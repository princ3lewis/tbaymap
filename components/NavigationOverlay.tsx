
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { TbayEvent, UserLocation } from '../types';
import { formatEventTiming, formatRelativeTime } from '../utils/time';

interface Props {
  event: TbayEvent;
  onClose: () => void;
  userLocation?: UserLocation | null;
  mapsUrl?: string;
}

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

const NavigationOverlay: React.FC<Props> = ({ event, onClose, userLocation, mapsUrl }) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const initialDistanceRef = useRef<number | null>(null);
  const creatorDistance =
    event.creatorLocation && event.creatorLocationEnabled
      ? distanceKm(event.creatorLocation, event.location)
      : null;
  const creatorAtEvent = creatorDistance !== null && creatorDistance < 0.15;
  const creatorUpdateLabel = event.creatorLocationUpdatedAt
    ? formatRelativeTime(event.creatorLocationUpdatedAt)
    : null;

  useEffect(() => {
    if (!userLocation) {
      setDistance(null);
      setEta(null);
      initialDistanceRef.current = null;
      return;
    }

    const currentDistance = distanceKm(userLocation, event.location);
    setDistance(currentDistance);
    const walkSpeedKmh = 4.5;
    setEta(Math.max(1, Math.round((currentDistance / walkSpeedKmh) * 60)));

    if (initialDistanceRef.current === null) {
      initialDistanceRef.current = currentDistance;
    }
  }, [userLocation, event.location]);

  const initialDistance = initialDistanceRef.current;
  const progress =
    distance === null
      ? 0
      : initialDistance && initialDistance > 0
        ? Math.max(0, Math.min(100, ((initialDistance - distance) / initialDistance) * 100))
        : 100;

  return (
    <div className="fixed top-20 inset-x-0 z-50 px-4 animate-in slide-in-from-top duration-500">
      <div className="max-w-xl mx-auto bg-slate-900 text-white rounded-[2rem] p-6 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-2xl">
            {distance === null || distance > 0 ? '🚶' : '📍'}
          </div>
          <div>
            <h4 className="font-bold text-lg leading-tight">
              {distance === null || distance > 0 ? `To ${event.title}` : "You've Arrived!"}
            </h4>
            <div className="flex items-center gap-3 text-sm text-slate-400 font-medium">
              <span>{distance === null ? 'Locating...' : `${distance.toFixed(1)} km`}</span>
              <span className="w-1 h-1 bg-slate-600 rounded-full" />
              <span className="text-green-400">
                {eta === null ? 'Enable location' : `${eta} min walk`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/events/${event.id}`}
            target="_blank"
            className="px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest bg-white/10 hover:bg-white/20 transition-colors"
          >
            Details
          </Link>
          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="px-3 py-2 rounded-full text-[11px] font-bold uppercase tracking-widest bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 transition-colors"
            >
              Open Maps
            </a>
          )}
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="max-w-xl mx-auto mt-3 px-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="bg-slate-800/80 text-slate-200 rounded-2xl px-4 py-3 border border-slate-700">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Event timing</p>
          <p className="font-semibold">{formatEventTiming(event)}</p>
          {event.locationName && (
            <p className="text-[11px] text-slate-400 mt-1">Location: {event.locationName}</p>
          )}
        </div>
        <div className="bg-slate-800/80 text-slate-200 rounded-2xl px-4 py-3 border border-slate-700">
          <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-1">Creator location</p>
          {creatorDistance === null ? (
            <p className="font-semibold">Location hidden</p>
          ) : (
            <p className="font-semibold">
              {creatorAtEvent ? 'Creator is at the event' : `${creatorDistance.toFixed(1)} km away`}
            </p>
          )}
          {creatorUpdateLabel && (
            <p className="text-[11px] text-slate-400 mt-1">Updated {creatorUpdateLabel}</p>
          )}
        </div>
      </div>

      {event.mediaUrls && event.mediaUrls.length > 0 && (
        <div className="max-w-xl mx-auto mt-3 px-6">
          <div className="text-[10px] uppercase tracking-widest text-slate-400 font-bold mb-2">
            Event media
          </div>
          <div className="flex gap-3 overflow-x-auto">
            {event.mediaUrls.map((url) => (
              <div
                key={url}
                className="min-w-[140px] h-24 rounded-2xl overflow-hidden border border-slate-700 bg-slate-800"
              >
                <img src={url} alt="Event media" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Visual Path Simulation */}
      <div className="max-w-xl mx-auto mt-2 px-6">
        <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-indigo-500 transition-all duration-1000" 
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
};

export default NavigationOverlay;
