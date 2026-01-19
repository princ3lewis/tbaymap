import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { TBAY_COORDS } from '../constants';
import { EventCategory, TbayEvent, UserLocation } from '../types';

type FirestoreLocation = UserLocation | { latitude: number; longitude: number };

interface FirestoreEvent {
  title?: string;
  description?: string;
  category?: string;
  location?: FirestoreLocation;
  creator?: string;
  time?: string;
  participants?: number;
  maxParticipants?: number;
  isSpiritMarker?: boolean;
  createdAt?: unknown;
}

const normalizeCategory = (value: unknown): EventCategory => {
  const categories = Object.values(EventCategory);
  if (typeof value === 'string' && categories.includes(value as EventCategory)) {
    return value as EventCategory;
  }
  return EventCategory.COMMUNITY;
};

const normalizeLocation = (value?: FirestoreLocation): UserLocation => {
  if (!value) {
    return TBAY_COORDS;
  }
  if ('latitude' in value && 'longitude' in value) {
    return { lat: value.latitude, lng: value.longitude };
  }
  return value;
};

const normalizeEvent = (id: string, data: FirestoreEvent): TbayEvent => ({
  id,
  title: data.title ?? 'Community Gathering',
  description: data.description ?? 'Details coming soon.',
  category: normalizeCategory(data.category),
  location: normalizeLocation(data.location),
  creator: data.creator ?? 'Community',
  time: data.time ?? 'Soon',
  participants: data.participants ?? 0,
  maxParticipants: data.maxParticipants,
  isSpiritMarker: data.isSpiritMarker ?? false
});

export const subscribeToEvents = (onEvents: (events: TbayEvent[]) => void) => {
  if (!db) {
    return () => {};
  }

  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, orderBy('createdAt', 'desc'));
  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map((docSnap) =>
        normalizeEvent(docSnap.id, docSnap.data() as FirestoreEvent)
      );
      onEvents(events);
    },
    (error) => {
      console.error('Firestore subscribe failed:', error);
    }
  );
};

export const createEvent = async (event: Omit<TbayEvent, 'id'>) => {
  if (!db) {
    return;
  }
  await addDoc(collection(db, 'events'), {
    ...event,
    createdAt: serverTimestamp()
  });
};

export const joinEvent = async (eventId: string) => {
  if (!db) {
    return;
  }
  const eventRef = doc(db, 'events', eventId);
  await updateDoc(eventRef, { participants: increment(1) });
};

export const deleteEvent = async (eventId: string) => {
  if (!db) {
    return;
  }
  await deleteDoc(doc(db, 'events', eventId));
};
