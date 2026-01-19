'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { subscribeToEvent } from '../../../services/eventsService';
import { formatEventTiming } from '../../../utils/time';
import { TbayEvent } from '../../../types';
import { useAuth } from '../../../components/AuthProvider';

const EventDetailPage = () => {
  const params = useParams();
  const eventId = Array.isArray(params?.id) ? params.id[0] : params?.id;
  const [event, setEvent] = useState<TbayEvent | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!eventId) {
      return;
    }
    const unsubscribe = subscribeToEvent(eventId, setEvent);
    return () => unsubscribe();
  }, [eventId]);

  const timingLabel = useMemo(() => (event ? formatEventTiming(event) : ''), [event]);
  const collaborators = event?.collaborators ?? [];
  const attendees = event?.attendees ?? [];

  if (!eventId) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Event not found.
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
        Loading event...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Event Detail</p>
            <h1 className="text-2xl font-serif text-slate-900 dark:text-slate-100">{event.title}</h1>
          </div>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <span>{event.category}</span>
            {event.ageMin ? <span>{event.ageMin}+ only</span> : null}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 space-y-6">
        <section className="bg-white dark:bg-slate-900/70 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex flex-wrap gap-3 text-xs font-semibold text-slate-500 dark:text-slate-300">
            <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full">
              Host: {event.creatorName ?? event.creator}
            </span>
            {event.locationName && (
              <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full">
                Location: {event.locationName}
              </span>
            )}
            <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full">
              {timingLabel}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{event.description}</p>
          {collaborators.length > 0 && (
            <div className="text-xs text-slate-500 dark:text-slate-400">
              Co-hosts:{' '}
              <span className="font-semibold text-slate-700 dark:text-slate-200">
                {collaborators.map((collab) => collab.name).join(', ')}
              </span>
            </div>
          )}
        </section>

        {event.mediaUrls && event.mediaUrls.length > 0 && (
          <section className="bg-white dark:bg-slate-900/70 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Event media</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {event.mediaUrls.map((url) => (
                <div key={url} className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
                  <img src={url} alt="Event media" className="w-full h-48 object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="bg-white dark:bg-slate-900/70 rounded-[2rem] border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Attendees</h2>
          {attendees.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No attendees yet.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {attendees.map((attendee) => (
                <Link
                  key={attendee.id}
                  href={`/profile/${attendee.id}`}
                  target="_blank"
                  className="px-3 py-1 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-200 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-400/30 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition"
                >
                  {attendee.name}
                </Link>
              ))}
            </div>
          )}
          {!user && (
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Sign in to follow attendees and see more profile details.
            </p>
          )}
        </section>

        <div className="flex justify-between items-center text-xs text-slate-500 dark:text-slate-400">
          <span>
            {event.participants} attending{event.maxParticipants ? ` • ${event.maxParticipants} max` : ''}
          </span>
          <Link href="/live" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Back to live app
          </Link>
        </div>
      </main>
    </div>
  );
};

export default EventDetailPage;
