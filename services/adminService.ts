import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import {
  buildStageMap,
  DeviceStage,
  DeviceStageMap,
  ManufacturingStageStatus
} from '../data/manufacturingStages';
import { WaitlistEntry, WaitlistDeviceType } from './waitlistService';

export type AdminDeviceStatus = 'online' | 'offline' | 'maintenance';

export interface AdminDevice {
  id: string;
  deviceId: string;
  serial?: string;
  label: string;
  type: WaitlistDeviceType;
  status: AdminDeviceStatus;
  battery: number;
  batchId?: string;
  lifecycle?: string;
  assignedTo?: string;
  firmware?: string;
  keyId?: string;
  notes?: string;
  lastSeen?: Date | null;
  createdAt?: Date | null;
  encodedAt?: Date | null;
  encodedBy?: string;
  stages: DeviceStageMap;
}

export interface AdminWaitlistEntry extends WaitlistEntry {
  id: string;
  status?: string;
  createdAt?: Date | null;
}

export interface AdminUser {
  id: string;
  email: string;
  addedBy?: string;
  createdAt?: Date | null;
}

export interface DeviceInput {
  id?: string;
  deviceId?: string;
  serial?: string;
  label: string;
  type: WaitlistDeviceType;
  status: AdminDeviceStatus;
  battery: number;
  batchId?: string;
  lifecycle?: string;
  assignedTo?: string;
  firmware?: string;
  keyId?: string;
  notes?: string;
}

export type BatchStatus = 'planned' | 'in_progress' | 'paused' | 'complete';

export interface ManufacturingBatch {
  id: string;
  name: string;
  status: BatchStatus;
  targetCount: number;
  notes?: string;
  createdAt?: Date | null;
}

export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  supplier?: string;
  category?: string;
  onHand: number;
  reorderPoint?: number;
  unitCost?: number;
  leadTimeDays?: number;
  location?: string;
  notes?: string;
  updatedAt?: Date | null;
  createdAt?: Date | null;
}

export type PurchaseOrderStatus = 'draft' | 'ordered' | 'received' | 'closed' | 'cancelled';

export interface PurchaseOrderItem {
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
}

export interface PurchaseOrder {
  id: string;
  supplier: string;
  status: PurchaseOrderStatus;
  items: PurchaseOrderItem[];
  orderedAt?: Date | null;
  expectedAt?: Date | null;
  notes?: string;
  createdAt?: Date | null;
}

export type FirmwareStatus = 'draft' | 'testing' | 'released' | 'deprecated';

export interface FirmwareRelease {
  id: string;
  version: string;
  status: FirmwareStatus;
  checksum?: string;
  notes?: string;
  createdAt?: Date | null;
}

export type QaResult = 'pass' | 'fail' | 'rework';

export interface QaReport {
  id: string;
  deviceId: string;
  result: QaResult;
  summary?: string;
  issues?: string;
  createdAt?: Date | null;
  createdBy?: string;
}

export type ShipmentStatus = 'packing' | 'label_created' | 'shipped' | 'delivered';

export interface Shipment {
  id: string;
  carrier?: string;
  tracking?: string;
  status: ShipmentStatus;
  deviceIds: string[];
  recipientName?: string;
  address?: string;
  notes?: string;
  createdAt?: Date | null;
}

interface FirestoreDevice {
  deviceId?: string;
  serial?: string;
  label?: string;
  type?: WaitlistDeviceType;
  status?: AdminDeviceStatus;
  battery?: number;
  batchId?: string;
  lifecycle?: string;
  assignedTo?: string;
  firmware?: string;
  keyId?: string;
  notes?: string;
  lastSeen?: { toDate?: () => Date };
  createdAt?: unknown;
  encodedAt?: { toDate?: () => Date };
  encodedBy?: string;
  stages?: Record<string, DeviceStage>;
}

interface FirestoreWaitlistEntry extends WaitlistEntry {
  status?: string;
  createdAt?: { toDate?: () => Date };
}

interface FirestoreAdmin {
  email?: string;
  addedBy?: string;
  createdAt?: { toDate?: () => Date };
}

interface FirestoreBatch {
  name?: string;
  status?: BatchStatus;
  targetCount?: number;
  notes?: string;
  createdAt?: { toDate?: () => Date };
}

interface FirestoreInventoryItem {
  name?: string;
  sku?: string;
  supplier?: string;
  category?: string;
  onHand?: number;
  reorderPoint?: number;
  unitCost?: number;
  leadTimeDays?: number;
  location?: string;
  notes?: string;
  updatedAt?: { toDate?: () => Date };
  createdAt?: { toDate?: () => Date };
}

interface FirestorePurchaseOrder {
  supplier?: string;
  status?: PurchaseOrderStatus;
  items?: PurchaseOrderItem[];
  orderedAt?: { toDate?: () => Date };
  expectedAt?: { toDate?: () => Date };
  notes?: string;
  createdAt?: { toDate?: () => Date };
}

interface FirestoreFirmwareRelease {
  version?: string;
  status?: FirmwareStatus;
  checksum?: string;
  notes?: string;
  createdAt?: { toDate?: () => Date };
}

interface FirestoreQaReport {
  deviceId?: string;
  result?: QaResult;
  summary?: string;
  issues?: string;
  createdAt?: { toDate?: () => Date };
  createdBy?: string;
}

interface FirestoreShipment {
  carrier?: string;
  tracking?: string;
  status?: ShipmentStatus;
  deviceIds?: string[];
  recipientName?: string;
  address?: string;
  notes?: string;
  createdAt?: { toDate?: () => Date };
}

const toDate = (value?: { toDate?: () => Date } | Date | null) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value.toDate !== 'function') {
    return null;
  }
  return value.toDate();
};

const normalizeDevice = (id: string, data: FirestoreDevice): AdminDevice => ({
  id,
  deviceId: data.deviceId ?? id,
  serial: data.serial ?? '',
  label: data.label ?? `Device ${id.slice(0, 5)}`,
  type: data.type ?? 'Bracelet',
  status: data.status ?? 'offline',
  battery: typeof data.battery === 'number' ? data.battery : 0,
  batchId: data.batchId ?? '',
  lifecycle: data.lifecycle ?? 'new',
  assignedTo: data.assignedTo ?? '',
  firmware: data.firmware ?? '',
  keyId: data.keyId ?? '',
  notes: data.notes ?? '',
  lastSeen: toDate(data.lastSeen),
  createdAt: toDate(data.createdAt as { toDate?: () => Date } | null),
  encodedAt: toDate(data.encodedAt),
  encodedBy: data.encodedBy ?? '',
  stages: normalizeStageMap(data.stages)
});

const normalizeWaitlistEntry = (id: string, data: FirestoreWaitlistEntry): AdminWaitlistEntry => ({
  id,
  name: data.name ?? '',
  email: data.email ?? '',
  deviceType: data.deviceType ?? 'Bracelet',
  interests: data.interests ?? [],
  community: data.community ?? '',
  notes: data.notes ?? '',
  consent: Boolean(data.consent),
  source: data.source ?? 'unknown',
  status: data.status ?? 'new',
  createdAt: toDate(data.createdAt)
});

const normalizeAdmin = (id: string, data: FirestoreAdmin): AdminUser => ({
  id,
  email: (data.email ?? id).toLowerCase(),
  addedBy: data.addedBy ?? '',
  createdAt: toDate(data.createdAt)
});

const normalizeBatch = (id: string, data: FirestoreBatch): ManufacturingBatch => ({
  id,
  name: data.name ?? `Batch ${id.slice(0, 5)}`,
  status: data.status ?? 'planned',
  targetCount: typeof data.targetCount === 'number' ? data.targetCount : 0,
  notes: data.notes ?? '',
  createdAt: toDate(data.createdAt)
});

const normalizeInventoryItem = (id: string, data: FirestoreInventoryItem): InventoryItem => ({
  id,
  name: data.name ?? '',
  sku: data.sku ?? id,
  supplier: data.supplier ?? '',
  category: data.category ?? '',
  onHand: typeof data.onHand === 'number' ? data.onHand : 0,
  reorderPoint: typeof data.reorderPoint === 'number' ? data.reorderPoint : 0,
  unitCost: typeof data.unitCost === 'number' ? data.unitCost : 0,
  leadTimeDays: typeof data.leadTimeDays === 'number' ? data.leadTimeDays : 0,
  location: data.location ?? '',
  notes: data.notes ?? '',
  updatedAt: toDate(data.updatedAt),
  createdAt: toDate(data.createdAt)
});

const normalizePurchaseOrder = (id: string, data: FirestorePurchaseOrder): PurchaseOrder => ({
  id,
  supplier: data.supplier ?? '',
  status: data.status ?? 'draft',
  items: data.items ?? [],
  orderedAt: toDate(data.orderedAt),
  expectedAt: toDate(data.expectedAt),
  notes: data.notes ?? '',
  createdAt: toDate(data.createdAt)
});

const normalizeFirmwareRelease = (id: string, data: FirestoreFirmwareRelease): FirmwareRelease => ({
  id,
  version: data.version ?? '',
  status: data.status ?? 'draft',
  checksum: data.checksum ?? '',
  notes: data.notes ?? '',
  createdAt: toDate(data.createdAt)
});

const normalizeQaReport = (id: string, data: FirestoreQaReport): QaReport => ({
  id,
  deviceId: data.deviceId ?? '',
  result: data.result ?? 'rework',
  summary: data.summary ?? '',
  issues: data.issues ?? '',
  createdAt: toDate(data.createdAt),
  createdBy: data.createdBy ?? ''
});

const normalizeShipment = (id: string, data: FirestoreShipment): Shipment => ({
  id,
  carrier: data.carrier ?? '',
  tracking: data.tracking ?? '',
  status: data.status ?? 'packing',
  deviceIds: data.deviceIds ?? [],
  recipientName: data.recipientName ?? '',
  address: data.address ?? '',
  notes: data.notes ?? '',
  createdAt: toDate(data.createdAt)
});

const normalizeStageMap = (value?: Record<string, DeviceStage>): DeviceStageMap => {
  const base = buildStageMap();
  if (!value) {
    return base;
  }
  Object.keys(base).forEach((stageId) => {
    const entry = value[stageId];
    if (entry) {
      base[stageId] = {
        status: entry.status ?? base[stageId].status,
        updatedAt: toDate(entry.updatedAt as { toDate?: () => Date } | null) ?? null,
        updatedBy: entry.updatedBy ?? '',
        notes: entry.notes ?? ''
      };
    }
  });
  return base;
};

export const subscribeToDevices = (onDevices: (devices: AdminDevice[]) => void) => {
  if (!db) {
    return () => {};
  }
  const devicesRef = collection(db, 'devices');
  const q = query(devicesRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const devices = snapshot.docs.map((docSnap) =>
        normalizeDevice(docSnap.id, docSnap.data() as FirestoreDevice)
      );
      onDevices(devices);
    },
    (error) => {
      console.error('Devices subscribe failed:', error);
    }
  );
};

export const subscribeToWaitlist = (onEntries: (entries: AdminWaitlistEntry[]) => void) => {
  if (!db) {
    return () => {};
  }
  const waitlistRef = collection(db, 'waitlist');
  const q = query(waitlistRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const entries = snapshot.docs.map((docSnap) =>
        normalizeWaitlistEntry(docSnap.id, docSnap.data() as FirestoreWaitlistEntry)
      );
      onEntries(entries);
    },
    (error) => {
      console.error('Waitlist subscribe failed:', error);
    }
  );
};

export const subscribeToAdmins = (onAdmins: (admins: AdminUser[]) => void) => {
  if (!db) {
    return () => {};
  }
  const adminsRef = collection(db, 'admins');
  const q = query(adminsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const admins = snapshot.docs.map((docSnap) =>
        normalizeAdmin(docSnap.id, docSnap.data() as FirestoreAdmin)
      );
      onAdmins(admins);
    },
    (error) => {
      console.error('Admins subscribe failed:', error);
    }
  );
};

export const subscribeToAdminStatus = (
  email: string,
  onStatus: (isAdmin: boolean) => void
) => {
  if (!db || !email) {
    onStatus(false);
    return () => {};
  }
  const adminRef = doc(db, 'admins', email);
  return onSnapshot(
    adminRef,
    (snapshot) => {
      onStatus(snapshot.exists());
    },
    (error) => {
      console.error('Admin status subscribe failed:', error);
      onStatus(false);
    }
  );
};

export const subscribeToBatches = (onBatches: (batches: ManufacturingBatch[]) => void) => {
  if (!db) {
    return () => {};
  }
  const batchesRef = collection(db, 'batches');
  const q = query(batchesRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const batches = snapshot.docs.map((docSnap) =>
        normalizeBatch(docSnap.id, docSnap.data() as FirestoreBatch)
      );
      onBatches(batches);
    },
    (error) => {
      console.error('Batches subscribe failed:', error);
    }
  );
};

export const createBatch = async (input: Omit<ManufacturingBatch, 'id' | 'createdAt'>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await addDoc(collection(db, 'batches'), {
    ...input,
    createdAt: serverTimestamp()
  });
};

export const updateBatch = async (id: string, patch: Partial<ManufacturingBatch>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'batches', id), patch);
};

export const deleteBatch = async (id: string) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await deleteDoc(doc(db, 'batches', id));
};

export const subscribeToInventory = (onItems: (items: InventoryItem[]) => void) => {
  if (!db) {
    return () => {};
  }
  const inventoryRef = collection(db, 'inventory');
  const q = query(inventoryRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const items = snapshot.docs.map((docSnap) =>
        normalizeInventoryItem(docSnap.id, docSnap.data() as FirestoreInventoryItem)
      );
      onItems(items);
    },
    (error) => {
      console.error('Inventory subscribe failed:', error);
    }
  );
};

export const createInventoryItem = async (input: Omit<InventoryItem, 'id' | 'createdAt' | 'updatedAt'>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await addDoc(collection(db, 'inventory'), {
    ...input,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
};

export const updateInventoryItem = async (id: string, patch: Partial<InventoryItem>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'inventory', id), { ...patch, updatedAt: serverTimestamp() });
};

export const subscribeToPurchaseOrders = (onOrders: (orders: PurchaseOrder[]) => void) => {
  if (!db) {
    return () => {};
  }
  const ordersRef = collection(db, 'purchase_orders');
  const q = query(ordersRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((docSnap) =>
        normalizePurchaseOrder(docSnap.id, docSnap.data() as FirestorePurchaseOrder)
      );
      onOrders(orders);
    },
    (error) => {
      console.error('Purchase orders subscribe failed:', error);
    }
  );
};

export const createPurchaseOrder = async (input: Omit<PurchaseOrder, 'id' | 'createdAt'>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await addDoc(collection(db, 'purchase_orders'), {
    ...input,
    createdAt: serverTimestamp()
  });
};

export const updatePurchaseOrder = async (id: string, patch: Partial<PurchaseOrder>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'purchase_orders', id), patch);
};

export const subscribeToFirmware = (onReleases: (releases: FirmwareRelease[]) => void) => {
  if (!db) {
    return () => {};
  }
  const firmwareRef = collection(db, 'firmware_releases');
  const q = query(firmwareRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const releases = snapshot.docs.map((docSnap) =>
        normalizeFirmwareRelease(docSnap.id, docSnap.data() as FirestoreFirmwareRelease)
      );
      onReleases(releases);
    },
    (error) => {
      console.error('Firmware subscribe failed:', error);
    }
  );
};

export const createFirmwareRelease = async (input: Omit<FirmwareRelease, 'id' | 'createdAt'>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await addDoc(collection(db, 'firmware_releases'), {
    ...input,
    createdAt: serverTimestamp()
  });
};

export const updateFirmwareRelease = async (id: string, patch: Partial<FirmwareRelease>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'firmware_releases', id), patch);
};

export const subscribeToQaReports = (onReports: (reports: QaReport[]) => void) => {
  if (!db) {
    return () => {};
  }
  const qaRef = collection(db, 'qa_reports');
  const q = query(qaRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const reports = snapshot.docs.map((docSnap) =>
        normalizeQaReport(docSnap.id, docSnap.data() as FirestoreQaReport)
      );
      onReports(reports);
    },
    (error) => {
      console.error('QA reports subscribe failed:', error);
    }
  );
};

export const createQaReport = async (input: Omit<QaReport, 'id' | 'createdAt'>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await addDoc(collection(db, 'qa_reports'), {
    ...input,
    createdAt: serverTimestamp()
  });
};

export const subscribeToShipments = (onShipments: (shipments: Shipment[]) => void) => {
  if (!db) {
    return () => {};
  }
  const shipmentsRef = collection(db, 'shipments');
  const q = query(shipmentsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const shipments = snapshot.docs.map((docSnap) =>
        normalizeShipment(docSnap.id, docSnap.data() as FirestoreShipment)
      );
      onShipments(shipments);
    },
    (error) => {
      console.error('Shipments subscribe failed:', error);
    }
  );
};

export const createShipment = async (input: Omit<Shipment, 'id' | 'createdAt'>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await addDoc(collection(db, 'shipments'), {
    ...input,
    createdAt: serverTimestamp()
  });
};

export const updateShipment = async (id: string, patch: Partial<Shipment>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'shipments', id), patch);
};

export const createDevice = async (input: DeviceInput) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  const payload = {
    ...input,
    deviceId: input.deviceId ?? input.id ?? '',
    serial: input.serial ?? '',
    batchId: input.batchId ?? '',
    lifecycle: input.lifecycle ?? 'new',
    assignedTo: input.assignedTo ?? '',
    firmware: input.firmware ?? '',
    keyId: input.keyId ?? '',
    notes: input.notes ?? '',
    stages: buildStageMap(),
    createdAt: serverTimestamp(),
    lastSeen: serverTimestamp()
  };
  if (input.id) {
    await setDoc(doc(db, 'devices', input.id), payload);
    return;
  }
  await addDoc(collection(db, 'devices'), payload);
};

export const updateDevice = async (id: string, patch: Partial<DeviceInput> & { lastSeen?: unknown }) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'devices', id), patch);
};

export const updateDeviceStage = async (
  id: string,
  stageId: string,
  stage: { status: ManufacturingStageStatus; notes?: string; updatedBy?: string }
) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'devices', id), {
    [`stages.${stageId}`]: {
      status: stage.status,
      notes: stage.notes ?? '',
      updatedBy: stage.updatedBy ?? '',
      updatedAt: serverTimestamp()
    }
  });
};

export const deleteDevice = async (id: string) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await deleteDoc(doc(db, 'devices', id));
};

export const pingDevice = async (id: string) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'devices', id), { lastSeen: serverTimestamp() });
};

export const updateWaitlistEntry = async (id: string, patch: Partial<AdminWaitlistEntry>) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await updateDoc(doc(db, 'waitlist', id), patch);
};

export const deleteWaitlistEntry = async (id: string) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  await deleteDoc(doc(db, 'waitlist', id));
};

export const addAdmin = async (email: string, addedBy?: string) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }
  await setDoc(doc(db, 'admins', normalizedEmail), {
    email: normalizedEmail,
    addedBy: addedBy ?? '',
    createdAt: serverTimestamp()
  });
};

export const removeAdmin = async (email: string) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) {
    throw new Error('Email is required.');
  }
  await deleteDoc(doc(db, 'admins', normalizedEmail));
};
