
export enum EventCategory {
  SPORTS = 'Sports',
  CULTURE = 'Culture',
  FOOD = 'Food',
  COMMUNITY = 'Community',
  TRADITIONAL = 'Traditional'
}

export interface UserLocation {
  lat: number;
  lng: number;
}

export type EventStatus = 'active' | 'ended';

export interface EventAttendee {
  id: string;
  name: string;
  joinedAt?: string | null;
}

export interface EventCollaborator {
  id?: string;
  name: string;
  email?: string;
}

export interface TbayEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  location: UserLocation;
  creator: string;
  creatorId?: string;
  creatorName?: string;
  creatorLocation?: UserLocation | null;
  creatorLocationUpdatedAt?: string | null;
  creatorLocationEnabled?: boolean;
  locationName?: string;
  ageMin?: number | null;
  mediaUrls?: string[];
  collaborators?: EventCollaborator[];
  time: string;
  createdAt?: string | null;
  startAt?: string | null;
  endAt?: string | null;
  endedAt?: string | null;
  status?: EventStatus;
  attendees?: EventAttendee[];
  attendeeIds?: string[];
  participants: number;
  maxParticipants?: number;
  isSpiritMarker?: boolean; // New: Significant cultural landmark marker
}

export interface DeviceStatus {
  connected: boolean;
  battery: number;
  vibrating: boolean;
  blinking: boolean;
  type: 'Bracelet' | 'Necklace' | 'Ring';
  uvIndex?: number; // New: Environmental sensing
  moonPhase?: string; // New: Cultural/Lunar tracking
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  age: number | null;
  interests: string[];
  community: string;
  job: string;
  school: string;
  bio: string;
  location: string;
  photoURL: string;
  createdAt?: string | null;
  updatedAt?: string | null;
  followersCount: number;
  followingCount: number;
  eventLimit: number;
}
