
import React from 'react';

export const TBAY_COORDS = { lat: 48.3809, lng: -89.2477 };

export const TBAY_LOCATIONS = [
  { id: 'marina-park', name: 'Marina Park (Waterfront)', coords: { lat: 48.4349, lng: -89.2107 } },
  { id: 'hillcrest-park', name: 'Hillcrest Park', coords: { lat: 48.4209, lng: -89.2489 } },
  { id: 'intercity', name: 'Intercity Shopping Centre', coords: { lat: 48.3962, lng: -89.2713 } },
  { id: 'lakehead-university', name: 'Lakehead University', coords: { lat: 48.4231, lng: -89.2582 } },
  { id: 'confederation', name: 'Confederation College', coords: { lat: 48.3793, lng: -89.2902 } },
  { id: 'chippewa-park', name: 'Chippewa Park', coords: { lat: 48.3247, lng: -89.2042 } },
  { id: 'fort-william-gardens', name: 'Fort William Gardens', coords: { lat: 48.4382, lng: -89.2234 } }
];

export const MedicineWheelColors = {
  white: '#FFFFFF',
  yellow: '#FBBF24',
  red: '#EF4444',
  black: '#111827'
};

export const MedicineWheelIcon = () => (
  <svg viewBox="0 0 100 100" className="w-12 h-12 shadow-sm rounded-full overflow-hidden border-2 border-slate-200">
    <rect x="0" y="0" width="50" height="50" fill={MedicineWheelColors.white} />
    <rect x="50" y="0" width="50" height="50" fill={MedicineWheelColors.yellow} />
    <rect x="0" y="50" width="50" height="50" fill={MedicineWheelColors.red} />
    <rect x="50" y="50" width="50" height="50" fill={MedicineWheelColors.black} />
  </svg>
);

export const WoodlandFloralPattern = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 opacity-10 pointer-events-none">
    <path d="M10,50 Q25,25 50,50 T90,50" fill="none" stroke="currentColor" strokeWidth="0.5" />
    <circle cx="50" cy="50" r="2" fill="currentColor" />
    <path d="M30,30 Q40,10 50,30" fill="none" stroke="currentColor" strokeWidth="0.3" />
    <path d="M70,30 Q60,10 50,30" fill="none" stroke="currentColor" strokeWidth="0.3" />
  </svg>
);
