
'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { TbayEvent, EventCategory, DeviceStatus, UserLocation } from './types';
import { TBAY_COORDS } from './constants';
import Header from './components/Header';
import EventCard from './components/EventCard';
import NavigationOverlay from './components/NavigationOverlay';
import TbayMap from './components/TbayMap';
import { suggestEvents, generateAudioSpeech } from './services/geminiService';
import { playTtsAudio } from './utils/audioPlayer';
import { createEvent, joinEvent, subscribeToEvents } from './services/eventsService';
import { isFirebaseConfigured } from './services/firebase';

const INITIAL_EVENTS: TbayEvent[] = [
  {
    id: '1',
    title: 'Touch Football Practice',
    description: 'Looking for 4 more people to join a friendly practice session at the waterfront. Beginners welcome!',
    category: EventCategory.SPORTS,
    location: { lat: 48.40, lng: -89.23 },
    creator: 'Jordan',
    time: 'Today, 5:00 PM',
    participants: 4,
    maxParticipants: 10
  },
  {
    id: '2',
    title: 'Community Barbecue',
    description: 'Celebrating local culture with food and storytelling. Bring your favorite dish!',
    category: EventCategory.FOOD,
    location: { lat: 48.37, lng: -89.26 },
    creator: 'Sarah',
    time: 'Saturday, 1:00 PM',
    participants: 24
  },
  {
    id: '3',
    title: 'Beadworking Workshop',
    description: 'Indigenous-led workshop on traditional patterns for modern wearables.',
    category: EventCategory.CULTURE,
    location: { lat: 48.39, lng: -89.25 },
    creator: 'Elder Mary',
    time: 'Tomorrow, 2:00 PM',
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
    creator: 'Elder Tom',
    time: 'Tonight, 7:00 PM',
    participants: 12,
    isSpiritMarker: true
  }
];

const App: React.FC = () => {
  const firebaseEnabled = isFirebaseConfigured();
  const [activeTab, setActiveTab] = useState<'feed' | 'map'>('feed');
  const [events, setEvents] = useState<TbayEvent[]>(firebaseEnabled ? [] : INITIAL_EVENTS);
  const [device, setDevice] = useState<DeviceStatus>({
    connected: true,
    battery: 82,
    vibrating: false,
    blinking: false,
    type: 'Bracelet',
    uvIndex: 1.5,
    moonPhase: 'Waxing'
  });
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  
  const [activeNavEvent, setActiveNavEvent] = useState<TbayEvent | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newEvent, setNewEvent] = useState({ title: '', category: EventCategory.SPORTS, description: '' });
  const [joinedEvents, setJoinedEvents] = useState<string[]>([]);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [dailyWisdom, setDailyWisdom] = useState<string>('');

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
    if (!firebaseEnabled) {
      return;
    }
    const unsubscribe = subscribeToEvents(setEvents);
    return () => unsubscribe();
  }, [firebaseEnabled]);

  useEffect(() => {
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
  }, []);

  const gpsLabel = userLocation
    ? 'GPS Active'
    : geoError
      ? 'Location Blocked'
      : 'Locating...';
  const gpsDotClass = userLocation ? 'bg-green-500' : geoError ? 'bg-amber-500' : 'bg-yellow-400';
  const gpsPillClass = userLocation
    ? 'bg-green-50 border-green-100 text-green-700'
    : geoError
      ? 'bg-amber-50 border-amber-100 text-amber-700'
      : 'bg-yellow-50 border-yellow-100 text-yellow-700';

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
    if (isSubmittingEvent) {
      return;
    }
    setIsSubmittingEvent(true);
    const baseLocation = userLocation ?? TBAY_COORDS;
    const eventPayload: Omit<TbayEvent, 'id'> = {
      title,
      description,
      category: newEvent.category,
      location: {
        lat: baseLocation.lat,
        lng: baseLocation.lng
      },
      creator: 'You',
      time: 'Just now',
      participants: 1
    };

    const localEvent: TbayEvent = {
      id: Math.random().toString(36).substr(2, 9),
      ...eventPayload
    };

    try {
      if (firebaseEnabled) {
        await createEvent(eventPayload);
      } else {
        setEvents((prev) => [localEvent, ...prev]);
      }
      setIsCreating(false);
      setNewEvent({ title: '', category: EventCategory.SPORTS, description: '' });
      setCreateError(null);
      triggerAlert(localEvent);
    } catch (error) {
      console.error('Failed to create event:', error);
      setCreateError('Unable to post the gathering. Please try again.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const handleJoin = async (id: string) => {
    setJoiningId(id);
    const event = events.find(e => e.id === id);
    if (event) triggerAlert(event);

    if (firebaseEnabled) {
      try {
        await joinEvent(id);
      } catch (error) {
        console.error('Failed to join event:', error);
      }
    }

    setTimeout(() => {
      setJoinedEvents(prev => [...prev, id]);
      setJoiningId(null);
    }, 600);
  };

  const openCreateModal = () => {
    setIsCreating(true);
    setCreateError(null);
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
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{events.length} Active</span>
              </div>
              {events.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onJoin={handleJoin}
                  onNavigate={() => setActiveNavEvent(event)}
                  isJoining={joiningId === event.id}
                  hasJoined={joinedEvents.includes(event.id)}
                />
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
               events={events}
               userLocation={userLocation}
               locationError={geoError}
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
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => {
            setIsCreating(false);
            setCreateError(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-[2rem] p-6 shadow-2xl border border-slate-100"
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
                onClick={() => {
                  setIsCreating(false);
                  setCreateError(null);
                }}
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
              {createError && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
                  {createError}
                </div>
              )}
              <div className="flex items-center justify-between text-[10px] text-slate-500">
                <span>
                  {userLocation ? 'Using your live location.' : 'Using Thunder Bay as a fallback.'}
                </span>
                <span className="uppercase tracking-widest font-bold text-slate-400">
                  {userLocation ? 'GPS locked' : 'GPS pending'}
                </span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setCreateError(null);
                  }}
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
