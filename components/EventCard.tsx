
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TbayEvent, EventCategory } from '../types';
import { getCulturalContext, generateAudioSpeech } from '../services/geminiService';
import { playTtsAudio } from '../utils/audioPlayer';
import { formatEventTiming } from '../utils/time';

interface Props {
  event: TbayEvent;
  onJoin: (id: string) => void;
  onLeave: (id: string) => void;
  onEnd: (id: string) => void;
  onNavigate: (event: TbayEvent) => void;
  onEdit: (event: TbayEvent) => void;
  isJoining: boolean;
  hasJoined: boolean;
  canJoin: boolean;
  joinDisabledReason?: string;
  isCreator: boolean;
  canEdit: boolean;
}

const CategoryEmoji = (category: string) => {
  switch (category) {
    case EventCategory.SPORTS: return '⚽';
    case EventCategory.CULTURE: return '🎨';
    case EventCategory.FOOD: return '🍲';
    case EventCategory.COMMUNITY: return '🤝';
    case EventCategory.TRADITIONAL: return '🦅';
    default: return '🏷️';
  }
};

const EventCard: React.FC<Props> = ({
  event,
  onJoin,
  onLeave,
  onEnd,
  onNavigate,
  onEdit,
  isJoining,
  hasJoined,
  canJoin,
  joinDisabledReason,
  isCreator,
  canEdit
}) => {
  const [insight, setInsight] = useState<string>('');
  const [showInsight, setShowInsight] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const attendees = event.attendees ?? [];
  const timingLabel = formatEventTiming(event);
  const isEnded = event.status === 'ended';
  const isFull = Boolean(event.maxParticipants && event.participants >= event.maxParticipants);
  const detailsUrl = `/events/${event.id}`;

  useEffect(() => {
    const fetchInsight = async () => {
      const text = await getCulturalContext(event.title, event.description);
      setInsight(text || '');
    };
    fetchInsight();
  }, [event.title, event.description]);

  const handleSpeak = async () => {
    if (!insight || isSpeaking) return;
    setIsSpeaking(true);
    const audioData = await generateAudioSpeech(insight);
    if (audioData) {
      await playTtsAudio(audioData);
    }
    setIsSpeaking(false);
  };

  return (
    <div className={`bg-white dark:bg-slate-900/70 rounded-[2.5rem] p-7 shadow-sm border transition-all duration-300 ${
      hasJoined
        ? 'border-indigo-100 bg-indigo-50/10 dark:border-indigo-500/40 dark:bg-indigo-500/10'
        : 'border-slate-100 dark:border-slate-800 hover:shadow-md'
    }`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-[1.2rem] flex items-center justify-center text-2xl shadow-inner border border-slate-100 dark:border-slate-700">
            {CategoryEmoji(event.category)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-tight">{event.title}</h4>
              {event.isSpiritMarker && (
                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                  ✨ Spirit Marker
                </span>
              )}
              {isEnded && (
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-200 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                  Ended
                </span>
              )}
              {event.editCount && event.editCount > 0 && (
                <span className="bg-indigo-100 text-indigo-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                  Edited
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{event.category}</span>
              <span className="w-1 h-1 bg-slate-300 dark:bg-slate-600 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{timingLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-slate-600 dark:text-slate-300 text-sm mb-6 leading-relaxed font-medium">
        {event.description}
      </p>

      {event.mediaUrls && event.mediaUrls.length > 0 && (
        <div className="mb-6 flex gap-3 overflow-x-auto">
          {event.mediaUrls.slice(0, 3).map((url) => (
            <div
              key={url}
              className="min-w-[120px] h-20 rounded-2xl overflow-hidden border border-slate-100 dark:border-slate-700 bg-slate-100 dark:bg-slate-800"
            >
              <img src={url} alt="Event media" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap gap-2 text-[11px] font-semibold text-slate-500 dark:text-slate-300">
          <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full">
            Host: {event.creatorName ?? event.creator}
          </span>
          {event.locationName && (
            <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full">
              Location: {event.locationName}
            </span>
          )}
          {event.collaborators && event.collaborators.length > 0 && (
            <span className="bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-3 py-1 rounded-full">
              Co-hosts: {event.collaborators.map((collab) => collab.name).join(', ')}
            </span>
          )}
          {typeof event.ageMin === 'number' && (
            <span className="bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-400/30 px-3 py-1 rounded-full text-rose-600 dark:text-rose-300">
              {event.ageMin}+ only
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {attendees.length > 0 ? (
            attendees.map((attendee) => (
              <Link
                key={attendee.id}
                href={`/profile/${attendee.id}`}
                target="_blank"
                className="px-3 py-1 rounded-full text-[11px] font-bold text-slate-600 dark:text-slate-200 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-400/30"
              >
                {attendee.name}
              </Link>
            ))
          ) : (
            <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500">Be the first to go.</span>
          )}
        </div>
      </div>

      {insight && (
        <div className="mb-6 bg-amber-50/50 rounded-2xl p-4 border border-amber-100/50">
          <div className="flex items-center justify-between mb-2">
            <button 
              onClick={() => setShowInsight(!showInsight)}
              className="flex items-center gap-2 text-[11px] font-bold text-amber-700"
            >
              <span>🦅 Traditional Insight</span>
              <span className={`transition-transform duration-300 ${showInsight ? 'rotate-180' : ''}`}>▾</span>
            </button>
            <button 
              onClick={handleSpeak}
              disabled={isSpeaking}
              className={`text-sm ${isSpeaking ? 'animate-pulse opacity-50' : 'opacity-100 hover:scale-110 transition-transform'}`}
              title="Hear Audio Insight"
            >
              {isSpeaking ? '🔊' : '🔈'}
            </button>
          </div>
          {showInsight && (
            <p className="text-[11px] text-amber-800/80 leading-relaxed italic animate-in fade-in slide-in-from-top-1">
              &quot;{insight}&quot;
            </p>
          )}
        </div>
      )}

        <div className="flex items-center justify-between pt-5 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500">
            {event.participants} going{event.maxParticipants ? ` • ${event.maxParticipants} max` : ''}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 justify-end">
          <Link
            href={detailsUrl}
            target="_blank"
            className="px-5 py-3 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
          >
            Details
          </Link>
          {hasJoined ? (
            <>
              <button
                onClick={() => onNavigate(event)}
                className="px-5 py-3 rounded-2xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200 dark:shadow-slate-900/40"
              >
                Get Directions
              </button>
              <button
                onClick={() => onLeave(event.id)}
                className="px-5 py-3 rounded-2xl font-bold text-xs border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95"
              >
                Opt out
              </button>
            </>
          ) : (
            <button
              onClick={() => onJoin(event.id)}
              disabled={isJoining || !canJoin}
              className={`px-6 py-3 rounded-2xl font-bold text-xs transition-all ${
                isJoining || !canJoin
                  ? 'bg-indigo-100 text-indigo-400 dark:bg-indigo-500/20 dark:text-indigo-200'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-100 dark:shadow-indigo-500/30'
              }`}
            >
              {isJoining ? 'Alerting...' : joinDisabledReason ?? "I'm Going"}
            </button>
          )}
          {isCreator && (
            <button
              onClick={() => onEdit(event)}
              disabled={!canEdit}
              className={`px-5 py-3 rounded-2xl font-bold text-xs border transition-all active:scale-95 ${
                canEdit
                  ? 'border-indigo-200 dark:border-indigo-400/40 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 cursor-not-allowed'
              }`}
            >
              {canEdit ? 'Edit event' : 'Edit used'}
            </button>
          )}
          {isCreator && !isEnded && (
            <button
              onClick={() => onEnd(event.id)}
              className="px-5 py-3 rounded-2xl font-bold text-xs border border-rose-200 dark:border-rose-400/40 text-rose-600 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all active:scale-95"
            >
              End event
            </button>
          )}
          {isFull && !isEnded && !hasJoined && (
            <span className="text-[10px] font-bold text-amber-600">Event full</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
