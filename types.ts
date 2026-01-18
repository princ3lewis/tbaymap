
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

export interface TbayEvent {
  id: string;
  title: string;
  description: string;
  category: EventCategory;
  location: UserLocation;
  creator: string;
  time: string;
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
