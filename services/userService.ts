import {
  collection,
  doc,
  getDoc,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { UserProfile } from '../types';

interface FirestoreUserProfile {
  displayName?: string;
  email?: string;
  age?: number | null;
  interests?: string[];
  community?: string;
  job?: string;
  school?: string;
  bio?: string;
  location?: string;
  photoURL?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
  followersCount?: number;
  followingCount?: number;
  eventLimit?: number;
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

const normalizeProfile = (id: string, data: FirestoreUserProfile): UserProfile => ({
  id,
  displayName: data.displayName ?? 'Community Member',
  email: data.email ?? '',
  age: typeof data.age === 'number' ? data.age : null,
  interests: Array.isArray(data.interests) ? data.interests : [],
  community: data.community ?? '',
  job: data.job ?? '',
  school: data.school ?? '',
  bio: data.bio ?? '',
  location: data.location ?? '',
  photoURL: data.photoURL ?? '',
  createdAt: normalizeTimestamp(data.createdAt),
  updatedAt: normalizeTimestamp(data.updatedAt),
  followersCount: typeof data.followersCount === 'number' ? data.followersCount : 0,
  followingCount: typeof data.followingCount === 'number' ? data.followingCount : 0,
  eventLimit: typeof data.eventLimit === 'number' ? data.eventLimit : 3
});

export const ensureUserProfile = async ({
  uid,
  email,
  displayName,
  photoURL
}: {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
}) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  const userRef = doc(db, 'users', uid);
  const snapshot = await getDoc(userRef);
  if (snapshot.exists()) {
    return;
  }
  await setDoc(
    userRef,
    {
      displayName: displayName ?? (email ? email.split('@')[0] : 'Community Member'),
      email: (email ?? '').trim().toLowerCase(),
      photoURL: photoURL ?? '',
      interests: [],
      community: '',
      job: '',
      school: '',
      bio: '',
      location: '',
      followersCount: 0,
      followingCount: 0,
      eventLimit: 3,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    },
    { merge: true }
  );
};

export const subscribeToUserProfile = (uid: string, onProfile: (profile: UserProfile | null) => void) => {
  if (!db) {
    return () => {};
  }
  const userRef = doc(db, 'users', uid);
  return onSnapshot(
    userRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onProfile(null);
        return;
      }
      onProfile(normalizeProfile(snapshot.id, snapshot.data() as FirestoreUserProfile));
    },
    (error) => {
      console.error('Profile subscribe failed:', error);
      onProfile(null);
    }
  );
};

export const updateUserProfile = async (uid: string, patch: Partial<UserProfile>) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  const userRef = doc(db, 'users', uid);
  const payload: Record<string, unknown> = { updatedAt: serverTimestamp() };
  if (typeof patch.displayName === 'string') payload.displayName = patch.displayName;
  if (typeof patch.age === 'number' || patch.age === null) payload.age = patch.age;
  if (Array.isArray(patch.interests)) payload.interests = patch.interests;
  if (typeof patch.community === 'string') payload.community = patch.community;
  if (typeof patch.job === 'string') payload.job = patch.job;
  if (typeof patch.school === 'string') payload.school = patch.school;
  if (typeof patch.bio === 'string') payload.bio = patch.bio;
  if (typeof patch.location === 'string') payload.location = patch.location;
  if (typeof patch.photoURL === 'string') payload.photoURL = patch.photoURL;
  await updateDoc(userRef, payload);
};

export const subscribeToFollowingIds = (uid: string, onIds: (ids: string[]) => void) => {
  if (!db) {
    return () => {};
  }
  const followingRef = collection(db, 'users', uid, 'following');
  return onSnapshot(
    followingRef,
    (snapshot) => {
      onIds(snapshot.docs.map((docSnap) => docSnap.id));
    },
    (error) => {
      console.error('Following subscribe failed:', error);
      onIds([]);
    }
  );
};

export const followUser = async ({ uid, targetUid }: { uid: string; targetUid: string }) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  if (uid === targetUid) {
    throw new Error('follow-self');
  }
  const followingRef = doc(db, 'users', uid, 'following', targetUid);
  const followerRef = doc(db, 'users', targetUid, 'followers', uid);
  const userRef = doc(db, 'users', uid);

  await runTransaction(db, async (transaction) => {
    const [followingSnap, followerSnap] = await Promise.all([
      transaction.get(followingRef),
      transaction.get(followerRef)
    ]);
    if (followingSnap.exists() || followerSnap.exists()) {
      return;
    }
    transaction.set(followingRef, { createdAt: serverTimestamp() });
    transaction.set(followerRef, { createdAt: serverTimestamp() });
    transaction.update(userRef, { followingCount: increment(1) });
  });
};

export const unfollowUser = async ({ uid, targetUid }: { uid: string; targetUid: string }) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  const followingRef = doc(db, 'users', uid, 'following', targetUid);
  const followerRef = doc(db, 'users', targetUid, 'followers', uid);
  const userRef = doc(db, 'users', uid);

  await runTransaction(db, async (transaction) => {
    const [followingSnap, followerSnap] = await Promise.all([
      transaction.get(followingRef),
      transaction.get(followerRef)
    ]);
    if (!followingSnap.exists() && !followerSnap.exists()) {
      return;
    }
    if (followingSnap.exists()) {
      transaction.delete(followingRef);
    }
    if (followerSnap.exists()) {
      transaction.delete(followerRef);
    }
    transaction.update(userRef, { followingCount: increment(-1) });
  });
};

export const unsubscribeFromProfile = (unsubscribe?: () => void) => {
  if (unsubscribe) {
    unsubscribe();
  }
};

export const unsubscribeFromFollowing = (unsubscribe?: () => void) => {
  if (unsubscribe) {
    unsubscribe();
  }
};

export const getUserProfile = async (uid: string) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  const snapshot = await getDoc(doc(db, 'users', uid));
  if (!snapshot.exists()) {
    return null;
  }
  return normalizeProfile(snapshot.id, snapshot.data() as FirestoreUserProfile);
};

export const checkFollowing = async (uid: string, targetUid: string) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  const snapshot = await getDoc(doc(db, 'users', uid, 'following', targetUid));
  return snapshot.exists();
};
