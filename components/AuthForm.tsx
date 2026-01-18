'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from './AuthProvider';

interface Props {
  mode: 'login' | 'signup';
}

const AuthForm: React.FC<Props> = ({ mode }) => {
  const router = useRouter();
  const { signIn, signUp, enabled } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!enabled) {
      setStatus('error');
      setError('Firebase Auth is not configured yet.');
      return;
    }

    if (mode === 'signup' && password !== confirm) {
      setStatus('error');
      setError('Passwords do not match.');
      return;
    }

    setStatus('submitting');
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
      router.push('/live');
    } catch (authError: any) {
      const message = authError?.message || 'Unable to authenticate. Please try again.';
      setStatus('error');
      setError(message);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-3xl border border-slate-200 p-8 shadow-xl">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500">
            {mode === 'login' ? 'Welcome back' : 'Join the community'}
          </p>
          <h1 className="text-2xl font-serif text-slate-900">
            {mode === 'login' ? 'Log in' : 'Create your account'}
          </h1>
        </div>
        <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-700">
          Home
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] block">
          Email
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            type="email"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="you@email.com"
          />
        </label>

        <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] block">
          Password
          <input
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            type="password"
            className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            placeholder="Minimum 6 characters"
          />
        </label>

        {mode === 'signup' && (
          <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] block">
            Confirm password
            <input
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              required
              type="password"
              className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
              placeholder="Repeat your password"
            />
          </label>
        )}

        {error && (
          <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-lg disabled:opacity-60"
          style={{ backgroundColor: '#0f766e' }}
        >
          {status === 'submitting'
            ? mode === 'login'
              ? 'Logging in...'
              : 'Creating account...'
            : mode === 'login'
              ? 'Log in'
              : 'Create account'}
        </button>
      </form>

      <div className="mt-4 text-xs text-slate-500 text-center">
        {mode === 'login' ? (
          <>
            New here?{' '}
            <Link href="/signup" className="font-semibold text-slate-700 hover:text-slate-900">
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-slate-700 hover:text-slate-900">
              Log in
            </Link>
          </>
        )}
      </div>
    </div>
  );
};

export default AuthForm;
