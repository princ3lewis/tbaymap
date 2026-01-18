
import React, { useState, useEffect, useRef } from 'react';
import { TbayEvent, UserLocation } from '../types';

interface Props {
  event: TbayEvent;
  onClose: () => void;
  userLocation?: UserLocation | null;
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

const NavigationOverlay: React.FC<Props> = ({ event, onClose, userLocation }) => {
  const [distance, setDistance] = useState<number | null>(null);
  const [eta, setEta] = useState<number | null>(null);
  const initialDistanceRef = useRef<number | null>(null);

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
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
        >
          ✕
        </button>
      </div>
      
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
