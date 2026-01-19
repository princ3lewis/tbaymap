import {
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  where,
  updateDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { TBAY_COORDS } from '../constants';
import { EventAttendee, EventCategory, EventStatus, TbayEvent, UserLocation } from '../types';

type FirestoreLocation = UserLocation | { latitude: number; longitude: number };
type FirestoreAttendee = { name?: string; joinedAt?: unknown };
type FirestoreAttendeeMap = Record<string, FirestoreAttendee>;
type FirestoreCollaborator = { id?: string; name?: string; email?: string };

interface FirestoreEvent {
  title?: string;
  description?: string;
  category?: string;
  location?: FirestoreLocation;
  locationName?: string;
  ageMin?: number | null;
  mediaUrls?: string[];
  collaborators?: FirestoreCollaborator[];
  creator?: string;
  creatorId?: string;
  creatorName?: string;
  creatorLocation?: FirestoreLocation;
  creatorLocationUpdatedAt?: unknown;
  creatorLocationEnabled?: boolean;
  time?: string;
  participants?: number;
  maxParticipants?: number;
  isSpiritMarker?: boolean;
  createdAt?: unknown;
  startAt?: unknown;
  endAt?: unknown;
  endedAt?: unknown;
  status?: EventStatus;
  attendees?: FirestoreAttendeeMap;
}

const normalizeCategory = (value: unknown): EventCategory => {
  const categories = Object.values(EventCategory);
  if (typeof value === 'string' && categories.includes(value as EventCategory)) {
    return value as EventCategory;
  }
  return EventCategory.COMMUNITY;
};

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

const toDate = (value?: unknown) => {
  if (!value) {
    return null;
  }
  if (value instanceof Date) {
    return value;
  }
  if (typeof value === 'number') {
    return new Date(value);
  }
  if (typeof value === 'string') {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (typeof (value as { toDate?: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate();
  }
  return null;
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

const normalizeOptionalLocation = (value?: FirestoreLocation): UserLocation | null => {
  if (!value) {
    return null;
  }
  if ('latitude' in value && 'longitude' in value) {
    return { lat: value.latitude, lng: value.longitude };
  }
  return value;
};

const normalizeAttendees = (value?: FirestoreAttendeeMap) => {
  if (!value) {
    return { attendees: [] as EventAttendee[], attendeeIds: [] as string[] };
  }
  const entries = Object.entries(value);
  const attendees = entries.map(([id, attendee]) => ({
    id,
    name: attendee?.name ?? 'Community',
    joinedAt: normalizeTimestamp(attendee?.joinedAt)
  }));
  return { attendees, attendeeIds: entries.map(([id]) => id) };
};

const normalizeEvent = (id: string, data: FirestoreEvent): TbayEvent => {
  const { attendees, attendeeIds } = normalizeAttendees(data.attendees);
  return {
    id,
    title: data.title ?? 'Community Gathering',
    description: data.description ?? 'Details coming soon.',
    category: normalizeCategory(data.category),
    location: normalizeLocation(data.location),
    locationName: data.locationName ?? 'Thunder Bay',
    ageMin: typeof data.ageMin === 'number' ? data.ageMin : null,
    mediaUrls: Array.isArray(data.mediaUrls) ? data.mediaUrls : [],
    collaborators: Array.isArray(data.collaborators)
      ? data.collaborators.map((collaborator) => ({
          id: collaborator.id,
          name: collaborator.name ?? 'Collaborator',
          email: collaborator.email
        }))
      : [],
    creator: data.creator ?? data.creatorName ?? 'Community',
    creatorId: data.creatorId,
    creatorName: data.creatorName ?? data.creator ?? 'Community',
    creatorLocation: normalizeOptionalLocation(data.creatorLocation),
    creatorLocationUpdatedAt: normalizeTimestamp(data.creatorLocationUpdatedAt),
    creatorLocationEnabled: data.creatorLocationEnabled ?? false,
    time: data.time ?? 'Just now',
    createdAt: normalizeTimestamp(data.createdAt),
    startAt: normalizeTimestamp(data.startAt),
    endAt: normalizeTimestamp(data.endAt),
    endedAt: normalizeTimestamp(data.endedAt),
    status: data.status ?? 'active',
    attendees,
    attendeeIds,
    participants: attendees.length || data.participants || 0,
    maxParticipants: data.maxParticipants,
    isSpiritMarker: data.isSpiritMarker ?? false
  };
};

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

export const subscribeToEvent = (eventId: string, onEvent: (event: TbayEvent | null) => void) => {
  if (!db) {
    return () => {};
  }
  const eventRef = doc(db, 'events', eventId);
  return onSnapshot(
    eventRef,
    (snapshot) => {
      if (!snapshot.exists()) {
        onEvent(null);
        return;
      }
      onEvent(normalizeEvent(snapshot.id, snapshot.data() as FirestoreEvent));
    },
    (error) => {
      console.error('Event subscribe failed:', error);
      onEvent(null);
    }
  );
};

export const subscribeToEventsByCreator = (
  creatorId: string,
  onEvents: (events: TbayEvent[]) => void
) => {
  if (!db) {
    return () => {};
  }
  const eventsRef = collection(db, 'events');
  const q = query(eventsRef, where('creatorId', '==', creatorId));
  return onSnapshot(
    q,
    (snapshot) => {
      const events = snapshot.docs.map((docSnap) =>
        normalizeEvent(docSnap.id, docSnap.data() as FirestoreEvent)
      );
      onEvents(events);
    },
    (error) => {
      console.error('Creator events subscribe failed:', error);
      onEvents([]);
    }
  );
};

export const getEventById = async (eventId: string) => {
  if (!db) {
    return null;
  }
  const snapshot = await getDoc(doc(db, 'events', eventId));
  if (!snapshot.exists()) {
    return null;
  }
  return normalizeEvent(snapshot.id, snapshot.data() as FirestoreEvent);
};

export interface CreateEventPayload {
  title: string;
  description: string;
  category: EventCategory;
  location: UserLocation;
  locationName?: string;
  ageMin?: number | null;
  mediaUrls?: string[];
  collaborators?: { id?: string; name: string; email?: string }[];
  creator?: string;
  creatorId?: string;
  creatorEmail?: string;
  creatorName?: string;
  creatorLocation?: UserLocation | null;
  creatorLocationEnabled?: boolean;
  startAt?: Date | null;
  endAt?: Date | null;
  maxParticipants?: number;
  isSpiritMarker?: boolean;
}

export const createEvent = async (event: CreateEventPayload) => {
  if (!db) {
    throw new Error('firebase-not-configured');
  }
  if (!event.creatorId) {
    throw new Error('auth-required');
  }

  const creatorName = event.creatorName ?? event.creator ?? 'Community';
  const creatorId = event.creatorId;
  const eventsRef = collection(db, 'events');
  const eventRef = doc(eventsRef);
  const userRef = doc(db, 'users', creatorId);
  const creatorEmail = event.creatorEmail?.toLowerCase() ?? '';
  const adminRef = creatorEmail ? doc(db, 'admins', creatorEmail) : null;

  await runTransaction(db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const adminSnap = adminRef ? await transaction.get(adminRef) : null;
    const isAdmin = Boolean(adminSnap?.exists());

    const userData = userSnap.exists() ? (userSnap.data() as Record<string, unknown>) : {};
    const quotaData = (userData.eventQuota ?? {}) as { windowStart?: unknown; count?: number };
    const limitOverride = typeof userData.eventLimit === 'number' ? userData.eventLimit : 3;
    const now = new Date();

    if (!isAdmin) {
      const windowStart = toDate(quotaData.windowStart) ?? now;
      const windowMs = 744 * 60 * 60 * 1000;
      const withinWindow = now.getTime() - windowStart.getTime() < windowMs;
      const currentCount = withinWindow ? quotaData.count ?? 0 : 0;

      if (currentCount >= limitOverride) {
        throw new Error('event-limit');
      }

      transaction.set(
        userRef,
        {
          eventQuota: {
            windowStart: withinWindow ? quotaData.windowStart ?? now : now,
            count: currentCount + 1,
            limit: limitOverride
          }
        },
        { merge: true }
      );
    }

    const attendees: FirestoreAttendeeMap = {
      [creatorId]: {
        name: creatorName,
        joinedAt: serverTimestamp()
      }
    };

    transaction.set(eventRef, {
      title: event.title,
      description: event.description,
      category: event.category,
      location: event.location,
      locationName: event.locationName ?? 'Thunder Bay',
      ageMin: event.ageMin ?? null,
      mediaUrls: event.mediaUrls ?? [],
      collaborators: event.collaborators ?? [],
      creator: event.creator ?? creatorName,
      creatorId,
      creatorName,
      creatorLocation: event.creatorLocationEnabled ? event.creatorLocation ?? null : null,
      creatorLocationEnabled: event.creatorLocationEnabled ?? false,
      creatorLocationUpdatedAt: event.creatorLocationEnabled ? serverTimestamp() : null,
      time: 'Just now',
      createdAt: serverTimestamp(),
      startAt: event.startAt ?? null,
      endAt: event.endAt ?? null,
      status: 'active',
      attendees,
      participants: 1,
      maxParticipants: event.maxParticipants,
      isSpiritMarker: event.isSpiritMarker ?? false
    });
  });

  return eventRef.id;
};

export const joinEvent = async (eventId: string, userId: string, displayName: string) => {
  if (!db) {
    return;
  }
  const eventRef = doc(db, 'events', eventId);
  const userRef = doc(db, 'users', userId);
  await runTransaction(db, async (transaction) => {
    const [eventSnap, userSnap] = await Promise.all([transaction.get(eventRef), transaction.get(userRef)]);
    if (!eventSnap.exists()) {
      throw new Error('event-not-found');
    }

    const eventData = eventSnap.data() as FirestoreEvent;
    const status = eventData.status ?? 'active';
    if (status !== 'active') {
      throw new Error('event-ended');
    }

    const activeEventId = userSnap.exists() ? (userSnap.data() as { activeEventId?: string }).activeEventId : null;
    if (activeEventId && activeEventId !== eventId) {
      throw new Error('already-joined');
    }

    if (typeof eventData.ageMin === 'number') {
      const userAge = userSnap.exists() ? (userSnap.data() as { age?: number }).age : undefined;
      if (typeof userAge !== 'number' || userAge < eventData.ageMin) {
        throw new Error('age-restricted');
      }
    }

    const attendees = (eventData.attendees ?? {}) as FirestoreAttendeeMap;
    const alreadyJoined = Boolean(attendees[userId]);
    const nextCount = Object.keys(attendees).length + (alreadyJoined ? 0 : 1);

    if (!alreadyJoined) {
      transaction.update(eventRef, {
        [`attendees.${userId}`]: { name: displayName, joinedAt: serverTimestamp() },
        participants: nextCount
      });
    }

    transaction.set(userRef, { activeEventId: eventId, displayName }, { merge: true });
  });
};

export const leaveEvent = async (eventId: string, userId: string) => {
  if (!db) {
    return;
  }
  const eventRef = doc(db, 'events', eventId);
  const userRef = doc(db, 'users', userId);
  await runTransaction(db, async (transaction) => {
    const [eventSnap, userSnap] = await Promise.all([transaction.get(eventRef), transaction.get(userRef)]);
    if (!eventSnap.exists()) {
      return;
    }

    const eventData = eventSnap.data() as FirestoreEvent;
    const attendees = (eventData.attendees ?? {}) as FirestoreAttendeeMap;
    const wasJoined = Boolean(attendees[userId]);
    const nextCount = Math.max(0, Object.keys(attendees).length - (wasJoined ? 1 : 0));

    if (wasJoined) {
      transaction.update(eventRef, {
        [`attendees.${userId}`]: deleteField(),
        participants: nextCount
      });
    }

    const activeEventId = userSnap.exists() ? (userSnap.data() as { activeEventId?: string }).activeEventId : null;
    if (activeEventId === eventId) {
      transaction.set(userRef, { activeEventId: null }, { merge: true });
    }
  });
};

export const endEvent = async (eventId: string) => {
  if (!db) {
    return;
  }
  await updateDoc(doc(db, 'events', eventId), {
    status: 'ended',
    endedAt: serverTimestamp()
  });
};

export const updateCreatorLocation = async (
  eventId: string,
  location: UserLocation | null,
  enabled: boolean
) => {
  if (!db) {
    return;
  }
  const eventRef = doc(db, 'events', eventId);
  if (!enabled || !location) {
    await updateDoc(eventRef, {
      creatorLocation: deleteField(),
      creatorLocationUpdatedAt: serverTimestamp()
    });
    return;
  }
  await updateDoc(eventRef, {
    creatorLocation: location,
    creatorLocationEnabled: true,
    creatorLocationUpdatedAt: serverTimestamp()
  });
};

export const deleteEvent = async (eventId: string) => {
  if (!db) {
    return;
  }
  await deleteDoc(doc(db, 'events', eventId));
};
