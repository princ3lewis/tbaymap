
'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { TbayEvent, EventCategory, DeviceStatus, UserLocation, UserProfile } from './types';
import { TBAY_COORDS, TBAY_LOCATIONS } from './constants';
import Header from './components/Header';
import EventCard from './components/EventCard';
import NavigationOverlay from './components/NavigationOverlay';
import TbayMap from './components/TbayMap';
import { suggestEvents, generateAudioSpeech } from './services/geminiService';
import { playTtsAudio } from './utils/audioPlayer';
import { formatRelativeTime } from './utils/time';
import {
  CreateEventPayload,
  createEvent,
  endEvent,
  joinEvent,
  leaveEvent,
  subscribeToEvents,
  updateCreatorLocation
} from './services/eventsService';
import {
  linkDeviceToUser,
  subscribeToLinkedDevice,
  unlinkDeviceFromUser,
  type LinkedDevice
} from './services/deviceLinkService';
import {
  ensureUserProfile,
  subscribeToFollowingIds,
  subscribeToUserProfile
} from './services/userService';
import { uploadEventMedia, validateMediaFiles } from './services/mediaService';
import { db, isFirebaseConfigured } from './services/firebase';
import { useAuth } from './components/AuthProvider';
import { loadGoogleMaps } from './services/googleMapsLoader';
import { doc, updateDoc } from 'firebase/firestore';

const INITIAL_EVENTS: TbayEvent[] = [
  {
    id: '1',
    title: 'Touch Football Practice',
    description: 'Looking for 4 more people to join a friendly practice session at the waterfront. Beginners welcome!',
    category: EventCategory.SPORTS,
    location: { lat: 48.40, lng: -89.23 },
    locationName: 'Marina Park (Waterfront)',
    creator: 'Jordan',
    creatorName: 'Jordan',
    time: 'Today, 5:00 PM',
    createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    startAt: new Date(Date.now() + 1000 * 60 * 45).toISOString(),
    status: 'active',
    attendees: [
      { id: 'jordan', name: 'Jordan', joinedAt: new Date(Date.now() - 1000 * 60 * 15).toISOString() },
      { id: 'maya', name: 'Maya' },
      { id: 'keen', name: 'Keen' },
      { id: 'alex', name: 'Alex' }
    ],
    attendeeIds: ['jordan', 'maya', 'keen', 'alex'],
    participants: 4,
    maxParticipants: 10
  },
  {
    id: '2',
    title: 'Community Barbecue',
    description: 'Celebrating local culture with food and storytelling. Bring your favorite dish!',
    category: EventCategory.FOOD,
    location: { lat: 48.37, lng: -89.26 },
    locationName: 'Hillcrest Park',
    creator: 'Sarah',
    creatorName: 'Sarah',
    time: 'Saturday, 1:00 PM',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 5).toISOString(),
    status: 'active',
    attendees: [
      { id: 'sarah', name: 'Sarah' },
      { id: 'kai', name: 'Kai' },
      { id: 'lia', name: 'Lia' },
      { id: 'drew', name: 'Drew' }
    ],
    attendeeIds: ['sarah', 'kai', 'lia', 'drew'],
    participants: 24
  },
  {
    id: '3',
    title: 'Beadworking Workshop',
    description: 'Indigenous-led workshop on traditional patterns for modern wearables.',
    category: EventCategory.CULTURE,
    location: { lat: 48.39, lng: -89.25 },
    locationName: 'Lakehead University',
    creator: 'Elder Mary',
    creatorName: 'Elder Mary',
    time: 'Tomorrow, 2:00 PM',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 20).toISOString(),
    status: 'active',
    attendees: [
      { id: 'mary', name: 'Elder Mary' },
      { id: 'aaron', name: 'Aaron' },
      { id: 'sienna', name: 'Sienna' }
    ],
    attendeeIds: ['mary', 'aaron', 'sienna'],
    participants: 8,
    maxParticipants: 12,
    isSpiritMarker: true
  },
  {
    id: '4',
    title: 'Spirit Garden Gathering',
    description: 'Weekly reflection at the community gardens. Everyone is welcome to join.',
    category: EventCategory.TRADITIONAL,
    location: { lat: 48.38, lng: -89.24 },
    locationName: 'Centennial Conservatory',
    creator: 'Elder Tom',
    creatorName: 'Elder Tom',
    time: 'Tonight, 7:00 PM',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    startAt: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
    status: 'active',
    attendees: [
      { id: 'tom', name: 'Elder Tom' },
      { id: 'reese', name: 'Reese' },
      { id: 'harper', name: 'Harper' }
    ],
    attendeeIds: ['tom', 'reese', 'harper'],
    participants: 12,
    isSpiritMarker: true
  }
];

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceKm = (from: UserLocation, to: UserLocation) => {
  const earthRadiusKm = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const toDateTimeInputValue = (date: Date) => {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const local = new Date(date.getTime() - tzOffset);
  return local.toISOString().slice(0, 16);
};

type PlaceSuggestion = {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
};

const App: React.FC = () => {
  const { user } = useAuth();
  const firebaseEnabled = isFirebaseConfigured();
  const [activeTab, setActiveTab] = useState<'feed' | 'map'>('feed');
  const [events, setEvents] = useState<TbayEvent[]>(firebaseEnabled ? [] : INITIAL_EVENTS);
  const [device, setDevice] = useState<DeviceStatus>({
    connected: false,
    battery: 82,
    vibrating: false,
    blinking: false,
    type: 'Bracelet',
    uvIndex: 1.5,
    moonPhase: 'Waxing'
  });
  const [linkedDevice, setLinkedDevice] = useState<LinkedDevice | null>(null);
  const [deviceLinkLoading, setDeviceLinkLoading] = useState(false);
  const [deviceLinking, setDeviceLinking] = useState(false);
  const [deviceLinkError, setDeviceLinkError] = useState<string | null>(null);
  const [isLinkingDevice, setIsLinkingDevice] = useState(false);
  const [deviceCode, setDeviceCode] = useState('');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locationSharing, setLocationSharing] = useState(true);
  
  const [activeNavEvent, setActiveNavEvent] = useState<TbayEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    category: EventCategory.SPORTS,
    description: '',
    locationMode: 'current' as 'current' | 'preset' | 'custom',
    locationId: TBAY_LOCATIONS[0]?.id ?? '',
    locationName: '',
    customLat: '',
    customLng: '',
    startAt: '',
    endAt: '',
    shareLocation: true,
    ageMin: '',
    collaborators: ''
  });
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaError, setMediaError] = useState<string | null>(null);
  const [placeQuery, setPlaceQuery] = useState('');
  const [placeSuggestions, setPlaceSuggestions] = useState<PlaceSuggestion[]>([]);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placeLocked, setPlaceLocked] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [leavingId, setLeavingId] = useState<string | null>(null);
  const [endingId, setEndingId] = useState<string | null>(null);
  const [dailyWisdom, setDailyWisdom] = useState<string>('');
  const creatorUpdateRef = useRef<{ at: number; lat: number; lng: number } | null>(null);
  const mapsApiRef = useRef<any>(null);
  const autocompleteRef = useRef<any>(null);
  const geocoderRef = useRef<any>(null);
  const mapPickerRef = useRef<any>(null);
  const mapPickerMarkerRef = useRef<any>(null);
  const mapPickerContainerRef = useRef<HTMLDivElement | null>(null);

  const userId = user?.uid ?? 'local-user';
  const userName =
    profile?.displayName ||
    user?.displayName ||
    (user?.email ? user.email.split('@')[0] : null) ||
    'You';
  const mapsApiKey =
    (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
      process.env.VITE_GOOGLE_MAPS_API_KEY) as string | undefined;
  const isDeviceLinked = Boolean(linkedDevice);
  const deviceIsOnline = linkedDevice?.status === 'online';
  const deviceStatusLabel = linkedDevice
    ? linkedDevice.status === 'online'
      ? 'Online'
      : linkedDevice.status === 'maintenance'
        ? 'Maintenance'
        : 'Offline'
    : '';
  const deviceBatteryLabel =
    linkedDevice && typeof linkedDevice.battery === 'number' ? `${linkedDevice.battery}%` : '';
  const deviceLastSeenLabel = linkedDevice?.lastSeen ? formatRelativeTime(linkedDevice.lastSeen) : null;
  const devicePrimaryLabel = deviceLinkLoading
    ? 'Checking device link...'
    : isDeviceLinked
      ? `${linkedDevice?.label ?? linkedDevice?.deviceId} linked`
      : 'No device linked';
  const deviceSecondaryLabel = deviceLinkLoading
    ? 'Syncing device status.'
    : isDeviceLinked
      ? `${deviceStatusLabel}${deviceBatteryLabel ? ` • ${deviceBatteryLabel}` : ''}`
      : 'You can link a device anytime.';
  const deviceActionLabel = deviceLinking
    ? isDeviceLinked
      ? 'Disconnecting...'
      : 'Connecting...'
    : isDeviceLinked
      ? 'Disconnect'
      : 'Connect';
  const minDateTime = useMemo(() => toDateTimeInputValue(new Date()), [isCreating]);

  useEffect(() => {
    const fetchWisdom = async () => {
      const suggestions = await suggestEvents(['community gathering', 'Anishinaabe culture']);
      if (suggestions && suggestions.length > 0) {
        setDailyWisdom(suggestions[0].description);
      }
    };
    fetchWisdom();
  }, []);

  useEffect(() => {
    if (!locationSharing && newEvent.shareLocation) {
      setNewEvent((prev) => ({ ...prev, shareLocation: false }));
    }
  }, [locationSharing, newEvent.shareLocation]);

  useEffect(() => {
    if (!firebaseEnabled) {
      return;
    }
    const unsubscribe = subscribeToEvents(setEvents);
    return () => unsubscribe();
  }, [firebaseEnabled]);

  useEffect(() => {
    if (!firebaseEnabled || !user) {
      setProfile(null);
      return;
    }
    ensureUserProfile({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    }).catch((error) => {
      console.error('Failed to ensure profile:', error);
    });
  }, [firebaseEnabled, user]);

  useEffect(() => {
    if (!firebaseEnabled || !user) {
      setProfile(null);
      return;
    }
    const unsubscribe = subscribeToUserProfile(user.uid, setProfile);
    return () => unsubscribe();
  }, [firebaseEnabled, user]);

  useEffect(() => {
    if (!firebaseEnabled || !user) {
      setFollowingIds([]);
      return;
    }
    const unsubscribe = subscribeToFollowingIds(user.uid, setFollowingIds);
    return () => unsubscribe();
  }, [firebaseEnabled, user]);

  useEffect(() => {
    if (!firebaseEnabled || !user?.uid) {
      setLinkedDevice(null);
      setDeviceLinkLoading(false);
      return;
    }
    setDeviceLinkLoading(true);
    const unsubscribe = subscribeToLinkedDevice(user.uid, (deviceInfo) => {
      setLinkedDevice(deviceInfo);
      setDeviceLinkLoading(false);
    });
    return () => unsubscribe();
  }, [firebaseEnabled, user?.uid]);

  useEffect(() => {
    if (!linkedDevice) {
      setDevice((prev) => ({ ...prev, connected: false }));
      return;
    }
    setDevice((prev) => ({
      ...prev,
      connected: Boolean(deviceIsOnline),
      battery: typeof linkedDevice.battery === 'number' ? linkedDevice.battery : prev.battery,
      type: linkedDevice.type ?? prev.type
    }));
  }, [deviceIsOnline, linkedDevice]);

  const creatorEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          event.creatorId &&
          event.creatorId === userId &&
          event.status !== 'ended' &&
          event.creatorLocationEnabled !== false
      ),
    [events, userId]
  );

  useEffect(() => {
    if (!locationSharing) {
      setUserLocation(null);
      setGeoError(null);
      return;
    }
    if (!('geolocation' in navigator)) {
      setGeoError('Geolocation is not supported in this browser.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGeoError(null);
      },
      (error) => {
        setGeoError(error.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 15000,
        timeout: 20000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [locationSharing]);

  useEffect(() => {
    if (!firebaseEnabled || creatorEvents.length === 0) {
      return;
    }

    if (!locationSharing) {
      creatorEvents.forEach((event) => {
        updateCreatorLocation(event.id, null, false).catch((error) => {
          console.error('Failed to disable creator location:', error);
        });
      });
      return;
    }

    if (!userLocation) {
      return;
    }

    const now = Date.now();
    const last = creatorUpdateRef.current;
    const movedKm = last ? distanceKm({ lat: last.lat, lng: last.lng }, userLocation) : null;
    if (last && movedKm !== null && movedKm < 0.05 && now - last.at < 30000) {
      return;
    }

    creatorUpdateRef.current = { at: now, lat: userLocation.lat, lng: userLocation.lng };
    creatorEvents.forEach((event) => {
      updateCreatorLocation(event.id, userLocation, true).catch((error) => {
        console.error('Failed to update creator location:', error);
      });
    });
  }, [creatorEvents, firebaseEnabled, locationSharing, userLocation]);

  const gpsLabel = locationSharing
    ? userLocation
      ? 'GPS Active'
      : geoError
        ? 'Location Blocked'
        : 'Locating...'
    : 'Location Off';
  const gpsDotClass = locationSharing
    ? userLocation
      ? 'bg-green-500'
      : geoError
        ? 'bg-amber-500'
        : 'bg-yellow-400'
    : 'bg-slate-400';
  const gpsPillClass = locationSharing
    ? userLocation
      ? 'bg-green-50 border-green-100 text-green-700'
      : geoError
        ? 'bg-amber-50 border-amber-100 text-amber-700'
        : 'bg-yellow-50 border-yellow-100 text-yellow-700'
    : 'bg-slate-100 border-slate-200 text-slate-500';

  const activeAttendanceEventId = useMemo(() => {
    const match = events.find((event) => event.attendeeIds?.includes(userId) && event.status !== 'ended');
    return match?.id ?? null;
  }, [events, userId]);
  const activeAttendanceEvent = events.find((event) => event.id === activeAttendanceEventId) ?? null;
  const activeEvents = useMemo(() => events.filter((event) => event.status !== 'ended'), [events]);
  const sortedEvents = useMemo(() => {
    const interestSet = new Set(profile?.interests?.map((item) => item.toLowerCase()) ?? []);
    return [...activeEvents]
      .map((event) => {
        const distance = userLocation ? distanceKm(userLocation, event.location) : Number.POSITIVE_INFINITY;
        const interestMatch = interestSet.has(event.category.toLowerCase());
        const friendInvolved = Boolean(
          (event.creatorId && followingIds.includes(event.creatorId)) ||
            (event.attendeeIds ?? []).some((id) => followingIds.includes(id))
        );
        return { event, distance, interestMatch, friendInvolved };
      })
      .sort((a, b) => {
        if (a.distance !== b.distance) {
          return a.distance - b.distance;
        }
        if (a.friendInvolved !== b.friendInvolved) {
          return a.friendInvolved ? -1 : 1;
        }
        if (a.interestMatch !== b.interestMatch) {
          return a.interestMatch ? -1 : 1;
        }
        return 0;
      })
      .map((item) => item.event);
  }, [activeEvents, followingIds, profile?.interests, userLocation]);
  const selectedPreset = TBAY_LOCATIONS.find((spot) => spot.id === newEvent.locationId);
  const locationSummary =
    newEvent.locationMode === 'current'
      ? userLocation
        ? 'Using your live location.'
        : 'Using Thunder Bay as a fallback.'
      : newEvent.locationMode === 'preset'
        ? `Using ${selectedPreset?.name ?? 'the selected location'}.`
        : newEvent.locationName
          ? `Using ${newEvent.locationName}.`
          : 'Using custom coordinates.';

  const handleMapPickRef = useRef<(coords: UserLocation) => void>(() => {});

  const updateCustomLocation = useCallback((coords: UserLocation, name?: string) => {
    setNewEvent((prev) => ({
      ...prev,
      customLat: coords.lat.toFixed(5),
      customLng: coords.lng.toFixed(5),
      locationName: name ?? prev.locationName
    }));
  }, []);

  const setMapMarker = useCallback((coords: UserLocation) => {
    const google = mapsApiRef.current;
    const map = mapPickerRef.current;
    if (!google || !map) {
      return;
    }
    if (!mapPickerMarkerRef.current) {
      mapPickerMarkerRef.current = new google.maps.Marker({
        position: coords,
        map,
        draggable: true
      });
      mapPickerMarkerRef.current.addListener('dragend', () => {
        const position = mapPickerMarkerRef.current.getPosition();
        if (!position) {
          return;
        }
        handleMapPickRef.current({ lat: position.lat(), lng: position.lng() });
      });
    } else {
      mapPickerMarkerRef.current.setPosition(coords);
    }
    map.setCenter(coords);
  }, []);

  const handleMapPick = useCallback(
    (coords: UserLocation) => {
      updateCustomLocation(coords);
      setMapMarker(coords);
      const geocoder = geocoderRef.current;
      if (!geocoder) {
        setPlaceLocked(true);
        setPlaceQuery(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        return;
      }
      geocoder.geocode({ location: coords }, (results: any, status: string) => {
        if (status === 'OK' && results && results[0]) {
          const formatted = results[0].formatted_address as string;
          setPlaceLocked(true);
          setPlaceQuery(formatted);
          setNewEvent((prev) => ({ ...prev, locationName: formatted }));
        } else {
          setPlaceLocked(true);
          setPlaceQuery(`${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}`);
        }
      });
    },
    [setMapMarker, updateCustomLocation]
  );

  useEffect(() => {
    handleMapPickRef.current = handleMapPick;
  }, [handleMapPick]);

  const handlePlaceSelect = useCallback(
    (suggestion: PlaceSuggestion) => {
      const geocoder = geocoderRef.current;
      if (!geocoder) {
        return;
      }
      setPlaceLocked(true);
      setPlacesLoading(true);
      geocoder.geocode({ placeId: suggestion.placeId }, (results: any, status: string) => {
        setPlacesLoading(false);
        if (status !== 'OK' || !results || !results[0]) {
          setPlacesError('Unable to load that address.');
          return;
        }
        const result = results[0];
        const location = result.geometry?.location;
        if (!location) {
          setPlacesError('No coordinates available for that address.');
          return;
        }
        const coords = { lat: location.lat(), lng: location.lng() };
        updateCustomLocation(coords, result.formatted_address as string);
        setPlaceQuery(result.formatted_address as string);
        setPlaceSuggestions([]);
        setPlacesError(null);
        setMapMarker(coords);
      });
    },
    [setMapMarker, updateCustomLocation]
  );

  useEffect(() => {
    if (!isCreating || newEvent.locationMode !== 'custom') {
      setPlaceQuery('');
      setPlaceSuggestions([]);
      setPlacesError(null);
      setPlacesLoading(false);
      setPlaceLocked(false);
      return;
    }
  }, [isCreating, newEvent.locationMode]);

  useEffect(() => {
    if (!isCreating || newEvent.locationMode !== 'custom') {
      return;
    }
    if (!placeQuery && newEvent.locationName) {
      setPlaceQuery(newEvent.locationName);
      setPlaceLocked(true);
    }
  }, [isCreating, newEvent.locationMode, newEvent.locationName, placeQuery]);

  useEffect(() => {
    if (!isCreating || newEvent.locationMode !== 'custom') {
      return;
    }
    if (newEvent.customLat || newEvent.customLng) {
      return;
    }
    const base = userLocation ?? TBAY_COORDS;
    setNewEvent((prev) => ({
      ...prev,
      customLat: base.lat.toFixed(5),
      customLng: base.lng.toFixed(5),
      locationName: prev.locationName || (userLocation ? 'My location' : 'Thunder Bay')
    }));
  }, [isCreating, newEvent.locationMode, newEvent.customLat, newEvent.customLng, userLocation]);

  const customCoords = useMemo(() => {
    if (newEvent.locationMode !== 'custom') {
      return null;
    }
    const lat = Number.parseFloat(newEvent.customLat);
    const lng = Number.parseFloat(newEvent.customLng);
    if (Number.isNaN(lat) || Number.isNaN(lng)) {
      return null;
    }
    return { lat, lng };
  }, [newEvent.customLat, newEvent.customLng, newEvent.locationMode]);

  useEffect(() => {
    if (!isCreating || newEvent.locationMode !== 'custom' || !customCoords) {
      return;
    }
    setMapMarker(customCoords);
  }, [customCoords, isCreating, newEvent.locationMode, setMapMarker]);

  useEffect(() => {
    if (!isCreating || newEvent.locationMode !== 'custom') {
      return;
    }
    if (!mapsApiKey) {
      setPlacesError('Missing Google Maps API key.');
      return;
    }
    loadGoogleMaps(mapsApiKey, ['places'])
      .then((google) => {
        mapsApiRef.current = google;
        if (!autocompleteRef.current && google.maps.places) {
          autocompleteRef.current = new google.maps.places.AutocompleteService();
        }
        if (!geocoderRef.current) {
          geocoderRef.current = new google.maps.Geocoder();
        }
        if (mapPickerContainerRef.current && !mapPickerRef.current) {
          const center = customCoords ?? userLocation ?? TBAY_COORDS;
          mapPickerRef.current = new google.maps.Map(mapPickerContainerRef.current, {
            center,
            zoom: 13,
            disableDefaultUI: true,
            zoomControl: true
          });
          mapPickerRef.current.addListener('click', (event: any) => {
            if (!event?.latLng) {
              return;
            }
            handleMapPick({ lat: event.latLng.lat(), lng: event.latLng.lng() });
          });
          setMapMarker(center);
        }
        setPlacesError(null);
      })
      .catch((error) => {
        console.error('Failed to load Places:', error);
        setPlacesError('Places search is unavailable right now.');
      });
  }, [customCoords, handleMapPick, isCreating, mapsApiKey, newEvent.locationMode, setMapMarker, userLocation]);

  useEffect(() => {
    if (!isCreating || newEvent.locationMode !== 'custom') {
      return;
    }
    if (!placeQuery || placeQuery.trim().length < 3 || placeLocked) {
      setPlaceSuggestions([]);
      setPlacesLoading(false);
      return;
    }
    if (!autocompleteRef.current || !mapsApiRef.current) {
      return;
    }
    const google = mapsApiRef.current;
    const base = userLocation ?? TBAY_COORDS;
    const timer = window.setTimeout(() => {
      setPlacesLoading(true);
      autocompleteRef.current.getPlacePredictions(
        {
          input: placeQuery,
          componentRestrictions: { country: 'ca' },
          location: new google.maps.LatLng(base.lat, base.lng),
          radius: 40000
        },
        (predictions: any, status: string) => {
          setPlacesLoading(false);
          if (status !== 'OK' || !predictions) {
            setPlaceSuggestions([]);
            if (status !== 'ZERO_RESULTS') {
              setPlacesError('No matching locations found.');
            }
            return;
          }
          const nextSuggestions = predictions.map((prediction: any) => ({
            placeId: prediction.place_id as string,
            description: prediction.description as string,
            mainText: prediction.structured_formatting?.main_text ?? prediction.description,
            secondaryText: prediction.structured_formatting?.secondary_text ?? ''
          }));
          setPlaceSuggestions(nextSuggestions);
          setPlacesError(null);
        }
      );
    }, 350);
    return () => window.clearTimeout(timer);
  }, [isCreating, newEvent.locationMode, placeLocked, placeQuery, userLocation]);

  const describeDeviceLinkError = (error: unknown) => {
    if (!(error instanceof Error)) {
      return 'Unable to update the device link. Please try again.';
    }
    switch (error.message) {
      case 'firebase-not-configured':
        return 'Firebase is not configured yet.';
      case 'device-not-found':
        return 'Device ID not found. Check the code on the device card.';
      case 'device-not-encoded':
        return 'This device is not ready yet. Please wait for encoding.';
      case 'device-already-linked':
        return 'That device is already linked to another account.';
      case 'user-already-linked':
        return 'Your account already has a linked device. Disconnect it first.';
      case 'device-not-owned':
        return 'This device is not linked to your account.';
      case 'user-device-mismatch':
        return 'This device is linked to a different account.';
      default:
        return 'Unable to update the device link. Please try again.';
    }
  };

  const openDeviceModal = () => {
    setDeviceLinkError(null);
    setDeviceCode('');
    setIsLinkingDevice(true);
    if (!firebaseEnabled) {
      setDeviceLinkError('Firebase is not configured yet.');
    } else if (!user) {
      setDeviceLinkError('Log in to link a device.');
    }
  };

  const closeDeviceModal = () => {
    setIsLinkingDevice(false);
    setDeviceLinkError(null);
  };

  const handleLinkDevice = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!firebaseEnabled) {
      setDeviceLinkError('Firebase is not configured yet.');
      return;
    }
    if (!user) {
      setDeviceLinkError('Log in to link a device.');
      return;
    }
    const trimmedCode = deviceCode.trim();
    if (!trimmedCode) {
      setDeviceLinkError('Enter the device ID.');
      return;
    }
    setDeviceLinking(true);
    setDeviceLinkError(null);
    try {
      await linkDeviceToUser({
        uid: user.uid,
        email: user.email,
        deviceId: trimmedCode
      });
      setIsLinkingDevice(false);
      setDeviceCode('');
    } catch (error) {
      setDeviceLinkError(describeDeviceLinkError(error));
    } finally {
      setDeviceLinking(false);
    }
  };

  const handleDisconnectDevice = async () => {
    if (!user || !linkedDevice) {
      return;
    }
    if (!window.confirm('Disconnect this device from your account?')) {
      return;
    }
    setDeviceLinking(true);
    setDeviceLinkError(null);
    try {
      await unlinkDeviceFromUser({
        uid: user.uid,
        deviceId: linkedDevice.id
      });
    } catch (error) {
      setDeviceLinkError(describeDeviceLinkError(error));
    } finally {
      setDeviceLinking(false);
    }
  };

  const handleMediaChange = (files: FileList | null) => {
    if (!files) {
      setMediaFiles([]);
      setMediaError(null);
      return;
    }
    const nextFiles = Array.from(files);
    try {
      validateMediaFiles(nextFiles);
      setMediaFiles(nextFiles);
      setMediaError(null);
    } catch (error) {
      setMediaFiles([]);
      setMediaError(error instanceof Error ? error.message : 'Invalid media selection.');
    }
  };

  const triggerAlert = useCallback(async (event: TbayEvent) => {
    if (!device.connected) return;
    
    setDevice(prev => ({ 
      ...prev, 
      vibrating: true, 
      blinking: true 
    }));
    
    const audioData = await generateAudioSpeech(`New ${event.category} gathering: ${event.title}. Notification sent to your ${device.type}.`);
    if (audioData) playTtsAudio(audioData);

    setTimeout(() => {
      setDevice(prev => ({ ...prev, vibrating: false, blinking: false }));
    }, 4500);
  }, [device.connected, device.type]);

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newEvent.title.trim();
    const description = newEvent.description.trim();
    if (!title || !description) {
      setCreateError('Add a title and description to post your gathering.');
      return;
    }
    if (firebaseEnabled && !user) {
      setCreateError('Log in to post a gathering.');
      return;
    }
    if (activeAttendanceEvent && activeAttendanceEvent.id) {
      setCreateError(`You're already going to ${activeAttendanceEvent.title}. Opt out before creating another event.`);
      return;
    }
    if (isSubmittingEvent) {
      return;
    }
    const startAt = newEvent.startAt ? new Date(newEvent.startAt) : null;
    const endAt = newEvent.endAt ? new Date(newEvent.endAt) : null;
    const now = new Date();
    if (startAt && startAt < now) {
      setCreateError('Start time cannot be in the past.');
      return;
    }
    if (endAt && endAt < now) {
      setCreateError('End time cannot be in the past.');
      return;
    }
    if (startAt && endAt && endAt <= startAt) {
      setCreateError('End time must be after the start time.');
      return;
    }
    const ageMinValue = newEvent.ageMin ? Number.parseInt(newEvent.ageMin, 10) : null;
    if (ageMinValue !== null && Number.isNaN(ageMinValue)) {
      setCreateError('Age restriction must be a number.');
      return;
    }
    if (ageMinValue !== null && ageMinValue < 0) {
      setCreateError('Age restriction must be a positive number.');
      return;
    }
    if (mediaError) {
      setCreateError(mediaError);
      return;
    }

    let location = userLocation ?? TBAY_COORDS;
    let locationName = userLocation ? 'My location' : 'Thunder Bay';
    if (newEvent.locationMode === 'preset') {
      const preset = TBAY_LOCATIONS.find((spot) => spot.id === newEvent.locationId);
      if (preset) {
        location = preset.coords;
        locationName = preset.name;
      }
    } else if (newEvent.locationMode === 'custom') {
      const lat = Number.parseFloat(newEvent.customLat);
      const lng = Number.parseFloat(newEvent.customLng);
      if (Number.isNaN(lat) || Number.isNaN(lng)) {
        setCreateError('Add a valid latitude and longitude for your custom location.');
        return;
      }
      location = { lat, lng };
      locationName = newEvent.locationName.trim() || 'Custom location';
    }

    setIsSubmittingEvent(true);
    const collaborators =
      newEvent.collaborators.trim().length > 0
        ? newEvent.collaborators
            .split(',')
            .map((name) => name.trim())
            .filter(Boolean)
            .map((name) => ({ name }))
        : [];
    const eventPayload: CreateEventPayload = {
      title,
      description,
      category: newEvent.category,
      location,
      locationName,
      ageMin: ageMinValue,
      mediaUrls: [],
      collaborators,
      creator: userName,
      creatorId: userId,
      creatorEmail: user?.email ?? undefined,
      creatorName: userName,
      creatorLocation: newEvent.shareLocation ? userLocation : null,
      creatorLocationEnabled: Boolean(newEvent.shareLocation && userLocation && locationSharing),
      startAt,
      endAt
    };

    const localEvent: TbayEvent = {
      id: Math.random().toString(36).substr(2, 9),
      title,
      description,
      category: newEvent.category,
      location,
      locationName,
      creator: userName,
      creatorId: userId,
      creatorName: userName,
      creatorLocation: newEvent.shareLocation ? userLocation : null,
      creatorLocationEnabled: Boolean(newEvent.shareLocation && userLocation && locationSharing),
      createdAt: new Date().toISOString(),
      startAt: startAt ? startAt.toISOString() : null,
      endAt: endAt ? endAt.toISOString() : null,
      status: 'active',
      time: 'Just now',
      attendees: [{ id: userId, name: userName, joinedAt: new Date().toISOString() }],
      attendeeIds: [userId],
      participants: 1,
      ageMin: ageMinValue,
      mediaUrls: [],
      collaborators
    };

    try {
      if (firebaseEnabled) {
        const eventId = await createEvent(eventPayload);
        if (eventId && mediaFiles.length > 0 && db) {
          const urls = await uploadEventMedia({ eventId, files: mediaFiles });
          if (urls.length > 0) {
            await updateDoc(doc(db, 'events', eventId), { mediaUrls: urls });
          }
        }
      } else {
        setEvents((prev) => [localEvent, ...prev]);
      }
      setIsCreating(false);
      setNewEvent({
        title: '',
        category: EventCategory.SPORTS,
        description: '',
        locationMode: 'current',
        locationId: TBAY_LOCATIONS[0]?.id ?? '',
        locationName: '',
        customLat: '',
        customLng: '',
        startAt: '',
        endAt: '',
        shareLocation: locationSharing,
        ageMin: '',
        collaborators: ''
      });
      setMediaFiles([]);
      setPlaceQuery('');
      setPlaceSuggestions([]);
      setPlacesError(null);
      setPlacesLoading(false);
      setPlaceLocked(false);
      mapPickerRef.current = null;
      mapPickerMarkerRef.current = null;
      setCreateError(null);
      triggerAlert(localEvent);
    } catch (error) {
      console.error('Failed to create event:', error);
      if (error instanceof Error && error.message === 'event-limit') {
        setCreateError('You have hit your 3 events per month limit. Contact admin to upgrade.');
      } else if (error instanceof Error && error.message === 'auth-required') {
        setCreateError('Log in to post a gathering.');
      } else {
        setCreateError('Unable to post the gathering. Please try again.');
      }
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleJoin = async (id: string) => {
    const event = events.find(e => e.id === id);
    if (!event) {
      return;
    }
    if (firebaseEnabled && !user) {
      setJoinError('Log in to join this event.');
      return;
    }
    if (activeAttendanceEventId && activeAttendanceEventId !== id) {
      setJoinError(`You're already going to ${activeAttendanceEvent?.title}. Opt out to join another.`);
      return;
    }
    if (event.status === 'ended') {
      setJoinError('This event has already ended.');
      return;
    }
    if (event.maxParticipants && event.participants >= event.maxParticipants) {
      setJoinError('This event is full.');
      return;
    }
    if (typeof event.ageMin === 'number') {
      if (profile?.age === null || typeof profile?.age !== 'number') {
        setJoinError(`Add your age in your profile to join this ${event.ageMin}+ event.`);
        return;
      }
      if (profile.age < event.ageMin) {
        setJoinError(`This event is ${event.ageMin}+ only.`);
        return;
      }
    }
    if (event.attendeeIds?.includes(userId)) {
      return;
    }

    setJoinError(null);
    setJoiningId(id);
    triggerAlert(event);

    if (firebaseEnabled) {
      try {
        await joinEvent(id, userId, userName);
      } catch (error) {
        console.error('Failed to join event:', error);
        if (error instanceof Error && error.message === 'age-restricted') {
          setJoinError(`This event is ${event.ageMin}+ only.`);
        } else {
          setJoinError('Unable to join right now. Please try again.');
        }
      }
    } else {
      setEvents((prev) =>
        prev.map((item) => {
          if (item.id !== id) {
            return item;
          }
          const attendeeIds = item.attendeeIds ?? [];
          if (attendeeIds.includes(userId)) {
            return item;
          }
          const attendees = [...(item.attendees ?? []), { id: userId, name: userName }];
          return {
            ...item,
            attendees,
            attendeeIds: [...attendeeIds, userId],
            participants: attendees.length
          };
        })
      );
    }

    setTimeout(() => setJoiningId(null), 600);
  };

  const handleLeave = async (id: string) => {
    const event = events.find((item) => item.id === id);
    if (!event) {
      return;
    }
    setLeavingId(id);
    if (firebaseEnabled) {
      try {
        await leaveEvent(id, userId);
      } catch (error) {
        console.error('Failed to leave event:', error);
      }
    } else {
      setEvents((prev) =>
        prev.map((item) => {
          if (item.id !== id) {
            return item;
          }
          const attendees = (item.attendees ?? []).filter((attendee) => attendee.id !== userId);
          return {
            ...item,
            attendees,
            attendeeIds: attendees.map((attendee) => attendee.id),
            participants: attendees.length
          };
        })
      );
    }
    setLeavingId(null);
  };

  const handleEndEvent = async (id: string) => {
    if (!window.confirm('End this event for everyone?')) {
      return;
    }
    setEndingId(id);
    if (firebaseEnabled) {
      try {
        await endEvent(id);
      } catch (error) {
        console.error('Failed to end event:', error);
      }
    } else {
      setEvents((prev) =>
        prev.map((item) =>
          item.id === id
            ? {
                ...item,
                status: 'ended',
                endedAt: new Date().toISOString()
              }
            : item
        )
      );
    }
    setEndingId(null);
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setCreateError(null);
    setMediaError(null);
    setNewEvent((prev) => ({ ...prev, shareLocation: locationSharing }));
  };

  const closeCreateModal = () => {
    setIsCreating(false);
    setCreateError(null);
    setMediaError(null);
    setMediaFiles([]);
    setNewEvent((prev) => ({
      ...prev,
      title: '',
      description: '',
      locationMode: 'current',
      locationId: TBAY_LOCATIONS[0]?.id ?? '',
      locationName: '',
      customLat: '',
      customLng: '',
      startAt: '',
      endAt: '',
      ageMin: '',
      collaborators: ''
    }));
    setPlaceQuery('');
    setPlaceSuggestions([]);
    setPlacesError(null);
    setPlacesLoading(false);
    setPlaceLocked(false);
    mapPickerRef.current = null;
    mapPickerMarkerRef.current = null;
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-900 pb-24 transition-all duration-500 ${device.blinking ? 'ring-8 ring-indigo-500/20 ring-inset' : ''}`}>
      <Header deviceStatus={device} />

      {activeNavEvent && (
        <NavigationOverlay 
          event={activeNavEvent} 
          onClose={() => setActiveNavEvent(null)} 
          userLocation={userLocation}
        />
      )}

      <main className="max-w-xl mx-auto px-4 py-6 space-y-6">
        {activeTab === 'feed' ? (
          <>
            {!activeNavEvent && (
              <div className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-indigo-100"
                >
                  +
                </button>
                <button 
                  onClick={openCreateModal}
                  className="flex-1 text-left px-5 py-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-500 transition-colors font-medium"
                >
                  Start a practice or BBQ...
                </button>
              </div>
            )}

            {!activeNavEvent && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Location</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {locationSharing ? 'Sharing on' : 'Sharing off'}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {locationSharing ? 'Visible to events you host.' : 'Hidden from other attendees.'}
                    </p>
                  </div>
                  <button
                    onClick={() => setLocationSharing((prev) => !prev)}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold ${
                      locationSharing ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {locationSharing ? 'On' : 'Off'}
                  </button>
                </div>
                <div className="bg-white rounded-[1.5rem] p-4 border border-slate-100 shadow-sm flex items-center justify-between">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Device</p>
                    <p className="text-sm font-semibold text-slate-700">
                      {devicePrimaryLabel}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      {deviceSecondaryLabel}
                    </p>
                    {isDeviceLinked && deviceLastSeenLabel && (
                      <p className="text-[10px] text-slate-400 mt-1">Last seen {deviceLastSeenLabel}</p>
                    )}
                    {user && (
                      <Link
                        href={`/profile/${user.uid}`}
                        target="_blank"
                        className="inline-flex mt-2 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                      >
                        View profile
                      </Link>
                    )}
                    {deviceLinkError && !isLinkingDevice && (
                      <p className="text-[10px] text-rose-500 mt-1">{deviceLinkError}</p>
                    )}
                  </div>
                  <button
                    onClick={isDeviceLinked ? handleDisconnectDevice : openDeviceModal}
                    disabled={deviceLinkLoading || deviceLinking}
                    className={`px-4 py-2 rounded-full text-[11px] font-bold ${
                      isDeviceLinked ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                    } ${deviceLinkLoading || deviceLinking ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    {deviceActionLabel}
                  </button>
                </div>
              </div>
            )}

            {!activeNavEvent && joinError && (
              <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-[1.5rem] px-4 py-3 text-xs font-semibold">
                {joinError}
              </div>
            )}

            {!activeNavEvent && dailyWisdom && (
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl" />
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-200 mb-2">Community Insight</h3>
                <p className="text-sm leading-relaxed font-medium">"{dailyWisdom}"</p>
              </div>
            )}

            <div className="space-y-4 pb-20">
              <div className="flex justify-between items-end px-1">
                <h2 className="text-xl font-bold text-slate-800">Local Gathering Feed</h2>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {activeEvents.length} Active
                </span>
              </div>
              <p className="text-[11px] text-slate-400 px-1">
                Ordered by proximity first, then shared interests and friends.
              </p>
              {sortedEvents.map(event => (
                (() => {
                  const isFull = Boolean(event.maxParticipants && event.participants >= event.maxParticipants);
                  const isEnded = event.status === 'ended';
                  const hasOtherEvent = Boolean(activeAttendanceEventId && activeAttendanceEventId !== event.id);
                  const ageMin = typeof event.ageMin === 'number' ? event.ageMin : null;
                  const ageMissing = ageMin !== null && (profile?.age === null || typeof profile?.age !== 'number');
                  const ageRestricted = ageMin !== null && typeof profile?.age === 'number' && profile.age < ageMin;
                  const canJoin = !(isFull || isEnded || hasOtherEvent || ageMissing || ageRestricted);
                  const joinDisabledReason = isEnded
                    ? 'Event ended'
                    : isFull
                      ? 'Event full'
                      : hasOtherEvent
                        ? `Going to ${activeAttendanceEvent?.title ?? 'another event'}`
                        : ageMissing
                          ? 'Add age to profile'
                          : ageRestricted
                            ? `${ageMin}+ only`
                            : undefined;
                  return (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  onEnd={handleEndEvent}
                  onNavigate={() => setActiveNavEvent(event)}
                  isJoining={joiningId === event.id || leavingId === event.id || endingId === event.id}
                  hasJoined={Boolean(event.attendeeIds?.includes(userId))}
                  canJoin={canJoin}
                  joinDisabledReason={joinDisabledReason}
                  isCreator={Boolean(event.creatorId && event.creatorId === userId)}
                />
                  );
                })()
              ))}
            </div>
          </>
        ) : (
          <div className="animate-in fade-in duration-500">
             <div className="flex justify-between items-center mb-4 px-1">
                <h2 className="text-xl font-bold text-slate-800">Community Map</h2>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${gpsPillClass}`}>
                   <span className={`w-1.5 h-1.5 rounded-full ${gpsDotClass} ${userLocation ? 'animate-pulse' : ''}`} />
                   <span className="text-[10px] font-bold uppercase">{gpsLabel}</span>
                </div>
             </div>
             <TbayMap
               events={activeEvents}
               userLocation={userLocation}
               locationError={geoError}
               locationSharing={locationSharing}
               onSelectEvent={(e) => {
                 setActiveTab('feed');
                 setActiveNavEvent(e);
               }}
             />
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-xl border-t border-slate-100 z-40">
        <div className="max-w-xl mx-auto px-10 h-20 flex items-center justify-between">
          <button 
            onClick={() => setActiveTab('feed')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'feed' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
          >
            <span className="text-xl">📱</span>
            <span className="text-[10px] font-bold uppercase">Feed</span>
          </button>
          
          <button 
            onClick={openCreateModal}
            className="w-14 h-14 bg-indigo-600 rounded-full flex items-center justify-center text-white shadow-xl shadow-indigo-100 -mt-10 border-4 border-white active:scale-90 transition-transform"
          >
            <span className="text-2xl font-bold">+</span>
          </button>

          <button 
            onClick={() => setActiveTab('map')}
            className={`flex flex-col items-center gap-1 transition-all ${activeTab === 'map' ? 'text-indigo-600 scale-110' : 'text-slate-400'}`}
          >
            <span className="text-xl">📍</span>
            <span className="text-[10px] font-bold uppercase">Map</span>
          </button>
        </div>
      </nav>

      {isCreating && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-start justify-center px-4 py-6 overflow-y-auto"
          onClick={closeCreateModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Create gathering</h2>
                <p className="text-xs text-slate-500">
                  Send an invite to people nearby who share this interest.
                </p>
              </div>
              <button
                onClick={closeCreateModal}
                className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 font-bold hover:bg-slate-100 transition-colors"
                type="button"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateEvent} className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Title</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Football practice, BBQ, beadwork..."
                  value={newEvent.title}
                  onChange={(event) => {
                    setNewEvent((prev) => ({ ...prev, title: event.target.value }));
                    setCreateError(null);
                  }}
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Category</span>
                <select
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={newEvent.category}
                  onChange={(event) => {
                    setNewEvent((prev) => ({
                      ...prev,
                      category: event.target.value as EventCategory
                    }));
                    setCreateError(null);
                  }}
                >
                  {Object.values(EventCategory).map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Description
                </span>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[110px]"
                  placeholder="Share the details, time, and who should join."
                  value={newEvent.description}
                  onChange={(event) => {
                    setNewEvent((prev) => ({ ...prev, description: event.target.value }));
                    setCreateError(null);
                  }}
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Location</span>
                <div className="mt-2 space-y-3">
                  <select
                    className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={newEvent.locationMode}
                    onChange={(event) => {
                      setNewEvent((prev) => ({
                        ...prev,
                        locationMode: event.target.value as 'current' | 'preset' | 'custom'
                      }));
                      setCreateError(null);
                    }}
                  >
                    <option value="current">Use my live location</option>
                    <option value="preset">Choose a Thunder Bay spot</option>
                    <option value="custom">Custom coordinates</option>
                  </select>
                  {newEvent.locationMode === 'preset' && (
                    <select
                      className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      value={newEvent.locationId}
                      onChange={(event) => {
                        setNewEvent((prev) => ({ ...prev, locationId: event.target.value }));
                        setCreateError(null);
                      }}
                    >
                      {TBAY_LOCATIONS.map((spot) => (
                        <option key={spot.id} value={spot.id}>
                          {spot.name}
                        </option>
                      ))}
                    </select>
                  )}
                  {newEvent.locationMode === 'custom' && (
                    <div className="grid grid-cols-1 gap-3">
                      <div className="space-y-2">
                        <input
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Search address or place in Thunder Bay"
                          value={placeQuery}
                          onChange={(event) => {
                            setPlaceQuery(event.target.value);
                            setPlaceLocked(false);
                            setCreateError(null);
                          }}
                        />
                        {placesLoading && (
                          <div className="text-[11px] text-slate-400">Searching nearby...</div>
                        )}
                        {placeSuggestions.length > 0 && (
                          <div className="rounded-2xl border border-slate-200 overflow-hidden">
                            {placeSuggestions.map((suggestion) => (
                              <button
                                key={suggestion.placeId}
                                type="button"
                                onClick={() => handlePlaceSelect(suggestion)}
                                className="w-full text-left px-4 py-2.5 text-xs text-slate-600 hover:bg-slate-50 transition"
                              >
                                <span className="font-semibold text-slate-800 block break-words">
                                  {suggestion.mainText}
                                </span>
                                <span className="text-[11px] text-slate-400 break-words">
                                  {suggestion.secondaryText || suggestion.description}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50">
                          {placesError ? (
                            <div className="px-4 py-3 text-xs text-amber-700 bg-amber-50">
                              {placesError}
                            </div>
                          ) : (
                            <div ref={mapPickerContainerRef} className="h-48 w-full" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Tip: click the map or drag the pin to fine-tune the spot.
                        </p>
                      </div>
                      <input
                        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Location name (optional)"
                        value={newEvent.locationName}
                        onChange={(event) => {
                          setNewEvent((prev) => ({ ...prev, locationName: event.target.value }));
                          setCreateError(null);
                        }}
                      />
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Latitude"
                          value={newEvent.customLat}
                          onChange={(event) => {
                            setNewEvent((prev) => ({ ...prev, customLat: event.target.value }));
                            setCreateError(null);
                          }}
                        />
                        <input
                          className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          placeholder="Longitude"
                          value={newEvent.customLng}
                          onChange={(event) => {
                            setNewEvent((prev) => ({ ...prev, customLng: event.target.value }));
                            setCreateError(null);
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Starts</span>
                  <input
                    type="datetime-local"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min={minDateTime}
                    value={newEvent.startAt}
                    onChange={(event) => {
                      setNewEvent((prev) => ({ ...prev, startAt: event.target.value }));
                      setCreateError(null);
                    }}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ends</span>
                  <input
                    type="datetime-local"
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min={minDateTime}
                    value={newEvent.endAt}
                    onChange={(event) => {
                      setNewEvent((prev) => ({ ...prev, endAt: event.target.value }));
                      setCreateError(null);
                    }}
                  />
                </label>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Age restriction
                  </span>
                  <input
                    type="number"
                    min={0}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="18"
                    value={newEvent.ageMin}
                    onChange={(event) => {
                      setNewEvent((prev) => ({ ...prev, ageMin: event.target.value }));
                      setCreateError(null);
                    }}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Collaborators
                  </span>
                  <input
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Add co-host names"
                    value={newEvent.collaborators}
                    onChange={(event) => {
                      setNewEvent((prev) => ({ ...prev, collaborators: event.target.value }));
                      setCreateError(null);
                    }}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Event media</span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-500 file:mr-4 file:rounded-full file:border-0 file:bg-slate-900 file:px-4 file:py-2 file:text-xs file:font-bold file:text-white"
                  onChange={(event) => {
                    handleMediaChange(event.target.files);
                    setCreateError(null);
                  }}
                />
                <p className="text-[11px] text-slate-400 mt-2">Up to 3 images, 8MB each.</p>
                {mediaFiles.length > 0 && (
                  <div className="mt-2 text-[11px] text-slate-500">
                    {mediaFiles.map((file) => file.name).join(', ')}
                  </div>
                )}
                {mediaError && (
                  <div className="mt-2 text-[11px] font-semibold text-rose-500">{mediaError}</div>
                )}
              </label>
              <div className="flex items-center justify-between rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Share my location</p>
                  <p className="text-xs text-slate-500">
                    {locationSharing ? 'Attendees can see if you are at the event.' : 'Turn on location sharing to enable.'}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={!locationSharing}
                  onClick={() =>
                    setNewEvent((prev) => ({ ...prev, shareLocation: !prev.shareLocation }))
                  }
                  className={`px-4 py-2 rounded-full text-[11px] font-bold ${
                    newEvent.shareLocation && locationSharing
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  } ${!locationSharing ? 'cursor-not-allowed opacity-60' : ''}`}
                >
                  {newEvent.shareLocation && locationSharing ? 'On' : 'Off'}
                </button>
              </div>
              {createError && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                  {createError}
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>{locationSummary}</span>
                <span className="uppercase tracking-widest font-bold text-slate-400">
                  {locationSharing ? (userLocation ? 'GPS locked' : 'GPS pending') : 'GPS off'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingEvent}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmittingEvent ? 'Posting...' : 'Post gathering'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isLinkingDevice && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={closeDeviceModal}
        >
          <div
            className="w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Connect your device</h2>
                <p className="text-xs text-slate-500">
                  Enter the device ID printed on your packaging or QR card.
                </p>
              </div>
              <button
                onClick={closeDeviceModal}
                className="w-10 h-10 rounded-full bg-slate-50 text-slate-400 font-bold hover:bg-slate-100 transition-colors"
                type="button"
              >
                ✕
              </button>
            </div>
            {!user && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                Log in to link a device to your account.
              </div>
            )}
            {!firebaseEnabled && (
              <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-semibold text-amber-700">
                Firebase is not configured yet.
              </div>
            )}
            <form onSubmit={handleLinkDevice} className="space-y-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Device ID</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:bg-slate-50"
                  placeholder="TBAY-DEVICE-XXXX"
                  value={deviceCode}
                  onChange={(event) => {
                    setDeviceCode(event.target.value);
                    setDeviceLinkError(null);
                  }}
                  disabled={deviceLinking || !firebaseEnabled || !user}
                />
              </label>
              {deviceLinkError && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
                  {deviceLinkError}
                </div>
              )}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={closeDeviceModal}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deviceLinking || !firebaseEnabled || !user}
                  className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {deviceLinking ? 'Linking...' : 'Link device'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {device.vibrating && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-indigo-600 text-white px-8 py-4 rounded-full shadow-2xl animate-bounce flex items-center gap-3 font-bold border-4 border-white ring-4 ring-indigo-500/30">
            <span className="text-xl">📳</span>
            <div className="flex flex-col">
              <span className="text-sm">Alert Received!</span>
              <span className="text-[10px] opacity-80 uppercase tracking-widest">{device.type} Active</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
