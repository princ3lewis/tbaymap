import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

export type WaitlistDeviceType = 'Bracelet' | 'Necklace' | 'Ring';

export interface WaitlistEntry {
  name: string;
  email: string;
  deviceType: WaitlistDeviceType;
  interests: string[];
  community?: string;
  notes?: string;
  consent: boolean;
  source?: string;
}

export const submitWaitlist = async (entry: WaitlistEntry) => {
  if (!db) {
    throw new Error('Firebase is not configured.');
  }

  await addDoc(collection(db, 'waitlist'), {
    ...entry,
    createdAt: serverTimestamp()
  });
};
