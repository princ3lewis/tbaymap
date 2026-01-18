'use client';

import React from 'react';
import Link from 'next/link';
import App from '../../App';
import { useAuth } from '../../components/AuthProvider';

export default function LivePage() {
  const { user, loading, signOut, enabled } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Loading your session...
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-serif text-slate-900">Sign in to go live</h1>
          <p className="text-sm text-slate-600">
            Create gatherings, get alerts, and connect with your community.
          </p>
          {!enabled && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3">
              Firebase Auth is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* keys.
            </div>
          )}
          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="w-full py-3 rounded-2xl text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
            >
              Create account
            </Link>
          </div>
          <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        <Link
          href="/"
          className="px-4 py-2 rounded-full bg-white/90 border border-slate-200 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-600 shadow-sm hover:bg-white transition"
        >
          Home
        </Link>
        <button
          onClick={signOut}
          className="px-4 py-2 rounded-full bg-slate-900 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-sm hover:bg-slate-800 transition"
        >
          Sign out
        </button>
      </div>
      <App />
    </div>
  );
}
