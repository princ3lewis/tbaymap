import {
  doc,
  onSnapshot,
  runTransaction,
  serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

export type LinkedDeviceStatus = 'online' | 'offline' | 'maintenance';

export interface LinkedDevice {
  id: string;
  deviceId: string;
  label: string;
  type: 'Bracelet' | 'Necklace' | 'Ring';
  status: LinkedDeviceStatus;
  battery: number;
  lastSeen?: string | null;
  ownerUid?: string;
  ownerEmail?: string;
  linkedAt?: string | null;
}

interface FirestoreDevice {
  deviceId?: string;
  label?: string;
  type?: 'Bracelet' | 'Necklace' | 'Ring';
  status?: LinkedDeviceStatus;
  battery?: number;
  lastSeen?: unknown;
  ownerUid?: string | null;
  ownerEmail?: string | null;
  linkedAt?: unknown;
  encodedAt?: unknown;
}

interface FirestoreUserLink {
  linkedDeviceId?: string | null;
}

const normalizeTimestamp = (value?: unknown): string | null => {
  if (!value) {
    return null;
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value).toISOString();
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return null;
};

const normalizeDevice = (id: string, data: FirestoreDevice): LinkedDevice => ({
  id,
  deviceId: data.deviceId ?? id,
  label: data.label ?? `Device ${id.slice(0, 5)}`,
  type: data.type ?? 'Bracelet',
  status: data.status ?? 'offline',
  battery: typeof data.battery === 'number' ? data.battery : 0,
  lastSeen: normalizeTimestamp(data.lastSeen),
  ownerUid: data.ownerUid ?? undefined,
  ownerEmail: data.ownerEmail ?? undefined,
  linkedAt: normalizeTimestamp(data.linkedAt)
});

export const subscribeToLinkedDevice = (
  uid: string,
  onDevice: (device: LinkedDevice | null) => void
) => {
  if (!db) {
    return () => {};
  }
  const userRef = doc(db, 'users', uid);
  let deviceUnsubscribe: (() => void) | null = null;

  const unsubscribeUser = onSnapshot(
    userRef,
    (snapshot) => {
      const data = snapshot.exists() ? (snapshot.data() as FirestoreUserLink) : null;
      const deviceId = data?.linkedDeviceId ?? null;
      if (!deviceId) {
        if (deviceUnsubscribe) {
          deviceUnsubscribe();
          deviceUnsubscribe = null;
        }
        onDevice(null);
        return;
      }
      if (deviceUnsubscribe) {
        deviceUnsubscribe();
      }
      const deviceRef = doc(db, 'devices', deviceId);
      deviceUnsubscribe = onSnapshot(
        deviceRef,
        (deviceSnapshot) => {
          if (!deviceSnapshot.exists()) {
            onDevice(null);
            return;
          }
          onDevice(normalizeDevice(deviceSnapshot.id, deviceSnapshot.data() as FirestoreDevice));
        },
        (error) => {
          console.error('Device link subscribe failed:', error);
          onDevice(null);
        }
      );
    },
    (error) => {
      console.error('User link subscribe failed:', error);
      onDevice(null);
    }
  );

  return () => {
    if (deviceUnsubscribe) {
      deviceUnsubscribe();
    }
    unsubscribeUser();
  };
};

export const linkDeviceToUser = async ({
  uid,
  email,
  deviceId
}: {
  uid: string;
  email?: string | null;
  deviceId: string;
}) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  const deviceRef = doc(db, 'devices', deviceId);
  const userRef = doc(db, 'users', uid);
  const normalizedEmail = (email ?? '').trim().toLowerCase();

  await runTransaction(db, async (transaction) => {
    const [deviceSnap, userSnap] = await Promise.all([
      transaction.get(deviceRef),
      transaction.get(userRef)
    ]);

    if (!deviceSnap.exists()) {
      throw new Error('device-not-found');
    }

    const deviceData = deviceSnap.data() as FirestoreDevice;
    if (!deviceData.encodedAt) {
      throw new Error('device-not-encoded');
    }

    if (deviceData.ownerUid && deviceData.ownerUid !== uid) {
      throw new Error('device-already-linked');
    }

    const userData = userSnap.exists() ? (userSnap.data() as FirestoreUserLink) : null;
    if (userData?.linkedDeviceId && userData.linkedDeviceId !== deviceId) {
      throw new Error('user-already-linked');
    }

    transaction.set(
      userRef,
      {
        linkedDeviceId: deviceId,
        linkedAt: serverTimestamp()
      },
      { merge: true }
    );
    transaction.update(deviceRef, {
      ownerUid: uid,
      ownerEmail: normalizedEmail || null,
      linkedAt: serverTimestamp()
    });
  });
};

export const unlinkDeviceFromUser = async ({
  uid,
  deviceId
}: {
  uid: string;
  deviceId: string;
}) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  const deviceRef = doc(db, 'devices', deviceId);
  const userRef = doc(db, 'users', uid);

  await runTransaction(db, async (transaction) => {
    const [deviceSnap, userSnap] = await Promise.all([
      transaction.get(deviceRef),
      transaction.get(userRef)
    ]);

    if (!deviceSnap.exists()) {
      throw new Error('device-not-found');
    }

    const deviceData = deviceSnap.data() as FirestoreDevice;
    if (deviceData.ownerUid && deviceData.ownerUid !== uid) {
      throw new Error('device-not-owned');
    }

    const userData = userSnap.exists() ? (userSnap.data() as FirestoreUserLink) : null;
    if (userData?.linkedDeviceId && userData.linkedDeviceId !== deviceId) {
      throw new Error('user-device-mismatch');
    }

    transaction.set(
      userRef,
      {
        linkedDeviceId: null,
        linkedAt: null
      },
      { merge: true }
    );
    transaction.update(deviceRef, {
      ownerUid: null,
      ownerEmail: null,
      linkedAt: null
    });
  });
};
