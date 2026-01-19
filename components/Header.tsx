
import React, { useState, useEffect } from 'react';
import { MedicineWheelIcon } from '../constants';
import { DeviceStatus } from '../types';
import { getLunarInsight } from '../services/geminiService';

interface Props {
  deviceStatus: DeviceStatus;
  onToggleNotifications?: () => void;
  notificationCount?: number;
  onToggleTheme?: () => void;
  isDark?: boolean;
}

const Header: React.FC<Props> = ({ deviceStatus, onToggleNotifications, notificationCount, onToggleTheme, isDark }) => {
  const [showSensors, setShowSensors] = useState(false);
  const [lunarText, setLunarText] = useState('');

  useEffect(() => {
    if (showSensors && !lunarText) {
      getLunarInsight().then(setLunarText);
    }
  }, [showSensors, lunarText]);

  return (
    <>
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-800 sticky top-0 z-50">
        <div className="max-w-xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="scale-75 -ml-1">
              <MedicineWheelIcon />
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 dark:text-slate-100 tracking-tight text-lg">Connect</h1>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">Tbay Tech</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 text-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              type="button"
              aria-label="Toggle dark mode"
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            <button
              onClick={onToggleNotifications}
              className="relative w-10 h-10 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-200 text-lg flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              type="button"
              aria-label="Toggle notifications"
            >
              🔔
              {notificationCount && notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                  {notificationCount}
                </span>
              )}
            </button>
            <button 
              onClick={() => setShowSensors(!showSensors)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-bold transition-all border shadow-sm ${
                showSensors 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${deviceStatus.connected ? 'bg-green-500 animate-pulse' : 'bg-slate-300'}`} />
              {deviceStatus.connected ? `${deviceStatus.battery}%` : 'Offline'}
              <span className="opacity-30 ml-1">▼</span>
            </button>
          </div>
        </div>

        {/* Expandable Sensor Tray */}
        {showSensors && deviceStatus.connected && (
          <div className="max-w-xl mx-auto px-4 pb-6 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-slate-50 dark:bg-slate-900 rounded-[2rem] p-5 space-y-4 border border-slate-100 dark:border-slate-800 shadow-inner">
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 flex items-center gap-1">
                    ☀️ UV Index
                  </p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Low (2.1)</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-bold">Safe for waterfront</p>
                </div>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase mb-1 flex items-center gap-1">
                    🌑 Moon Cycle
                  </p>
                  <p className="text-xl font-extrabold text-slate-800 dark:text-slate-100">Waxing</p>
                  <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-1 font-bold">Tbay Sky Clear</p>
                </div>
              </div>

              {lunarText && (
                <div className="bg-indigo-600/5 p-4 rounded-2xl border border-indigo-100 dark:border-indigo-400/30 flex gap-4 items-start">
                  <div className="text-2xl mt-1">✨</div>
                  <div>
                    <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mb-1">Anishinaabe Lunar Insight</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                      {lunarText}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center px-2">
                 <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">GPS Syncing</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Temp: 18°C</span>
                 </div>
              </div>
            </div>
          </div>
        )}
      </header>
    </>
  );
};

export default Header;
