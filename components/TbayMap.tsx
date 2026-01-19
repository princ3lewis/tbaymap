import React, { useEffect, useMemo, useRef, useState } from 'react';
import { EventCategory, TbayEvent, UserLocation } from '../types';
import { TBAY_COORDS } from '../constants';
import { loadGoogleMaps } from '../services/googleMapsLoader';
import { formatEventTiming } from '../utils/time';

interface Props {
  events: TbayEvent[];
  onSelectEvent: (event: TbayEvent) => void;
  userLocation?: UserLocation | null;
  locationError?: string | null;
  locationSharing?: boolean;
}

const categoryColor = (category: string) => {
  switch (category) {
    case EventCategory.SPORTS:
      return '#2563EB';
    case EventCategory.CULTURE:
      return '#F59E0B';
    case EventCategory.FOOD:
      return '#10B981';
    case EventCategory.COMMUNITY:
      return '#0F766E';
    case EventCategory.TRADITIONAL:
      return '#7C3AED';
    default:
      return '#64748B';
  }
};

const CategoryEmoji = (category: string) => {
  switch (category) {
    case EventCategory.SPORTS:
      return '⚽';
    case EventCategory.CULTURE:
      return '🎨';
    case EventCategory.FOOD:
      return '🍲';
    case EventCategory.COMMUNITY:
      return '🤝';
    case EventCategory.TRADITIONAL:
      return '🦅';
    default:
      return '🏷️';
  }
};

const TbayMap: React.FC<Props> = ({ events, onSelectEvent, userLocation, locationError, locationSharing }) => {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const selectedEvent = useMemo(
    () => events.find((event) => event.id === selectedEventId) || null,
    [events, selectedEventId]
  );
  const [mapStatus, setMapStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapError, setMapError] = useState<string | null>(null);
  const [hasCenteredOnUser, setHasCenteredOnUser] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const userMarkerRef = useRef<any>(null);

  useEffect(() => {
    const apiKey =
      (process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
        process.env.VITE_GOOGLE_MAPS_API_KEY) as string | undefined;
    if (!apiKey) {
      setMapStatus('error');
      setMapError('Missing Google Maps API key.');
      return;
    }

    if (!mapContainerRef.current) {
      return;
    }

    let cancelled = false;
    loadGoogleMaps(apiKey, ['places'])
      .then(async (google) => {
        if (cancelled || !mapContainerRef.current) {
          return;
        }
        let MapConstructor = google.maps.Map;
        if (google.maps.importLibrary) {
          const mapsLibrary = await google.maps.importLibrary('maps');
          MapConstructor = (mapsLibrary as any).Map || MapConstructor;
        }
        if (!MapConstructor) {
          throw new Error('Google Maps library not available.');
        }
        const map = new MapConstructor(mapContainerRef.current, {
          center: TBAY_COORDS,
          zoom: 12,
          mapId:
            process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID ||
            process.env.VITE_GOOGLE_MAPS_MAP_ID ||
            undefined,
          disableDefaultUI: true,
          zoomControl: true,
          fullscreenControl: false,
          streetViewControl: false,
          mapTypeControl: false
        });
        mapRef.current = map;
        setMapStatus('ready');
      })
      .catch((error) => {
        if (cancelled) {
          return;
        }
        console.error('Google Maps failed to load:', error);
        setMapStatus('error');
        const message =
          error instanceof Error && error.message ? error.message : 'Unable to load Google Maps.';
        setMapError(message);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapRef.current) {
      return;
    }

    const google = (window as any).google;
    const map = mapRef.current;
    const markers = markersRef.current;
    const nextIds = new Set(events.map((event) => event.id));

    markers.forEach((marker, id) => {
      if (!nextIds.has(id)) {
        marker.setMap(null);
        markers.delete(id);
      }
    });

    events.forEach((event) => {
      const isEnded = event.status === 'ended';
      const existing = markers.get(event.id);
      const icon = {
        path: google.maps.SymbolPath.CIRCLE,
        scale: event.isSpiritMarker ? 10 : 8,
        fillColor: isEnded ? '#94A3B8' : categoryColor(event.category),
        fillOpacity: isEnded ? 0.5 : 0.95,
        strokeColor: '#FFFFFF',
        strokeWeight: 2
      };

      if (existing) {
        existing.setPosition(event.location);
        existing.setIcon(icon);
        existing.setTitle(event.title);
      } else {
        const marker = new google.maps.Marker({
          position: event.location,
          map,
          title: event.title,
          icon
        });
        marker.addListener('click', () => setSelectedEventId(event.id));
        markers.set(event.id, marker);
      }
    });
  }, [events, mapStatus]);

  useEffect(() => {
    if (mapStatus !== 'ready' || !mapRef.current || !userLocation) {
      return;
    }

    const google = (window as any).google;
    const map = mapRef.current;
    const icon = {
      path: google.maps.SymbolPath.CIRCLE,
      scale: 7,
      fillColor: '#38BDF8',
      fillOpacity: 1,
      strokeColor: '#FFFFFF',
      strokeWeight: 2
    };

    if (!userMarkerRef.current) {
      userMarkerRef.current = new google.maps.Marker({
        position: userLocation,
        map,
        title: 'You',
        icon
      });
    } else {
      userMarkerRef.current.setPosition(userLocation);
    }

    if (!hasCenteredOnUser) {
      map.setCenter(userLocation);
      map.setZoom(14);
      setHasCenteredOnUser(true);
    }
  }, [userLocation, mapStatus, hasCenteredOnUser]);

  useEffect(() => {
    if (selectedEventId && !selectedEvent) {
      setSelectedEventId(null);
    }
  }, [selectedEventId, selectedEvent]);

  const gpsLabel =
    locationSharing === false
      ? 'Location Off'
      : userLocation
        ? 'GPS Active'
        : locationError
          ? 'Location Blocked'
          : 'Locating...';
  const gpsDotClass =
    locationSharing === false
      ? 'bg-slate-400'
      : userLocation
        ? 'bg-green-400 animate-pulse'
        : locationError
          ? 'bg-amber-400'
          : 'bg-yellow-400';

  return (
    <div className="bg-slate-900 rounded-[3rem] w-full h-[65vh] min-h-[450px] relative overflow-hidden border-[12px] border-white shadow-2xl group transition-all duration-700">
      <div ref={mapContainerRef} className="absolute inset-0" />

      {mapStatus === 'loading' && (
        <div className="absolute inset-0 bg-slate-900/80 text-white flex items-center justify-center text-sm font-bold tracking-wide">
          Loading map...
        </div>
      )}

      {mapStatus === 'error' && (
        <div className="absolute inset-0 bg-slate-900/90 text-white flex flex-col items-center justify-center gap-3 text-center px-6">
          <span className="text-lg font-bold">Map unavailable</span>
          <span className="text-xs text-slate-300">{mapError}</span>
        </div>
      )}

      {/* Top Controls Overlay */}
      <div className="absolute top-6 left-6 right-6 flex justify-between items-center pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-5 py-2.5 rounded-2xl border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest flex items-center gap-3 pointer-events-auto">
          <span className={`w-2 h-2 rounded-full ${gpsDotClass}`} />
          {gpsLabel}
        </div>
        <button
          onClick={() => setSelectedEventId(null)}
          className="bg-black/60 backdrop-blur-md w-11 h-11 rounded-2xl border border-white/10 text-white flex items-center justify-center hover:bg-black/80 transition-all pointer-events-auto active:scale-95"
        >
          🛰️
        </button>
      </div>

      {/* Floating Detailed Pop-up Card */}
      {selectedEvent && (
        <div className="absolute inset-x-0 bottom-6 px-6 z-40 animate-in slide-in-from-bottom-8 duration-500">
          <div className="bg-white rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-slate-100 flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl border border-indigo-100">
                  {CategoryEmoji(selectedEvent.category)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-900 text-lg leading-tight">
                      {selectedEvent.title}
                    </h4>
                    {selectedEvent.isSpiritMarker && (
                      <span className="text-[8px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-black uppercase">
                        Spirit Marker
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">
                    {selectedEvent.participants} Attending • {formatEventTiming(selectedEvent)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedEventId(null)}
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 line-clamp-2 font-medium leading-relaxed">
              {selectedEvent.description}
            </p>

            <div className="flex gap-2">
              <button
                onClick={() => onSelectEvent(selectedEvent)}
                className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
              >
                🚀 Details & Directions
              </button>
              <button
                onClick={() => onSelectEvent(selectedEvent)}
                className="px-5 py-4 bg-indigo-100 text-indigo-600 rounded-2xl font-bold text-xs hover:bg-indigo-200 transition-all flex items-center justify-center gap-2 shadow-xl active:scale-[0.98]"
              >
                View Feed
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scale & Metadata */}
      <div className="absolute bottom-6 left-8 right-8 pointer-events-none flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Thunder Bay, ON</span>
          <span className="text-[10px] font-mono text-slate-400">
            {(userLocation?.lat ?? TBAY_COORDS.lat).toFixed(4)} N /{' '}
            {Math.abs(userLocation?.lng ?? TBAY_COORDS.lng).toFixed(4)} W
          </span>
        </div>
        <div className="h-4 border-l border-b border-slate-700 w-16 relative">
          <span className="absolute -top-3 right-0 text-[8px] font-black text-slate-500">2.5 KM</span>
        </div>
      </div>
    </div>
  );
};

export default TbayMap;
