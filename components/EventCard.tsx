
import React, { useState, useEffect } from 'react';
import { TbayEvent, EventCategory } from '../types';
import { getCulturalContext, generateAudioSpeech } from '../services/geminiService';
import { playTtsAudio } from '../utils/audioPlayer';

interface Props {
  event: TbayEvent;
  onJoin: (id: string) => void;
  onNavigate: () => void;
  isJoining: boolean;
  hasJoined: boolean;
}

const CategoryEmoji = (category: EventCategory) => {
  switch (category) {
    case EventCategory.SPORTS: return '⚽';
    case EventCategory.CULTURE: return '🎨';
    case EventCategory.FOOD: return '🍲';
    case EventCategory.TRADITIONAL: return '🦅';
    default: return '📍';
  }
};

const EventCard: React.FC<Props> = ({ event, onJoin, onNavigate, isJoining, hasJoined }) => {
  const [insight, setInsight] = useState<string>('');
  const [showInsight, setShowInsight] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const fetchInsight = async () => {
      const text = await getCulturalContext(event.title, event.description);
      setInsight(text || '');
    };
    fetchInsight();
  }, [event.title]);

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
    <div className={`bg-white rounded-[2.5rem] p-7 shadow-sm border transition-all duration-300 ${hasJoined ? 'border-indigo-100 bg-indigo-50/10' : 'border-slate-100 hover:shadow-md'}`}>
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-slate-50 rounded-[1.2rem] flex items-center justify-center text-2xl shadow-inner border border-slate-100">
            {CategoryEmoji(event.category)}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-extrabold text-slate-900 text-lg leading-tight">{event.title}</h4>
              {event.isSpiritMarker && (
                <span className="bg-amber-100 text-amber-700 text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                  ✨ Spirit Marker
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{event.category}</span>
              <span className="w-1 h-1 bg-slate-300 rounded-full" />
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{event.time}</span>
            </div>
          </div>
        </div>
      </div>

      <p className="text-slate-600 text-sm mb-6 leading-relaxed font-medium">
        {event.description}
      </p>

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
              "{insight}"
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-5 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden shadow-sm">
                <img src={`https://picsum.photos/seed/${event.id}-${i}/32/32`} alt="" />
              </div>
            ))}
          </div>
          <span className="text-[11px] font-bold text-slate-400">
            {event.participants} going
          </span>
        </div>

        <div className="flex gap-2">
          {hasJoined ? (
            <button
              onClick={onNavigate}
              className="px-6 py-3 rounded-2xl font-bold text-xs bg-slate-900 text-white hover:bg-slate-800 transition-all active:scale-95 shadow-xl shadow-slate-200"
            >
              Get Directions
            </button>
          ) : (
            <button
              onClick={() => onJoin(event.id)}
              disabled={isJoining}
              className={`px-6 py-3 rounded-2xl font-bold text-xs transition-all ${
                isJoining 
                  ? 'bg-indigo-100 text-indigo-400'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-xl shadow-indigo-100'
              }`}
            >
              {isJoining ? 'Alerting...' : 'I\'m Joining'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
