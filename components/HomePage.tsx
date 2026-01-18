'use client';

import React, { useMemo, useRef, useState } from 'react';
import { EventCategory } from '../types';
import { isFirebaseConfigured } from '../services/firebase';
import { submitWaitlist, WaitlistDeviceType } from '../services/waitlistService';

interface Props {
  demoHref: string;
  loginHref?: string;
}

const deviceOptions: Array<{
  value: WaitlistDeviceType;
  label: string;
  detail: string;
}> = [
  {
    value: 'Bracelet',
    label: 'Bracelet',
    detail: 'Everyday wear with a water-ready band.'
  },
  {
    value: 'Necklace',
    label: 'Necklace',
    detail: 'Visible signal and audio cue close to the heart.'
  },
  {
    value: 'Ring',
    label: 'Ring',
    detail: 'Subtle haptic alerts with minimalist styling.'
  }
];

const interestOptions = [
  EventCategory.SPORTS,
  EventCategory.CULTURE,
  EventCategory.FOOD,
  EventCategory.COMMUNITY,
  EventCategory.TRADITIONAL
];

const rolloutSteps = [
  {
    title: 'Prototype Build',
    description: 'Finalize the wearable form factors and sensor stack.'
  },
  {
    title: 'Thunder Bay Pilot',
    description: 'Launch community-led pilots with local event partners.'
  },
  {
    title: 'Public Release',
    description: 'Open pre-orders and deliver the first devices.'
  }
];

const HomePage: React.FC<Props> = ({ demoHref, loginHref }) => {
  const formRef = useRef<HTMLDivElement | null>(null);
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const firebaseEnabled = isFirebaseConfigured();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    deviceType: 'Bracelet' as WaitlistDeviceType,
    community: '',
    interests: [] as string[],
    notes: '',
    consent: false
  });

  const themeStyle = useMemo(
    () =>
      ({
        '--ink': '#0f172a',
        '--pine': '#0f766e',
        '--ember': '#f97316',
        '--sand': '#f8f2e7',
        '--lake': '#0284c7'
      }) as React.CSSProperties,
    []
  );

  const handleScrollToForm = () => {
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleFieldChange =
    (field: keyof typeof formData) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const target = event.target;
      const value = target instanceof HTMLInputElement && target.type === 'checkbox' ? target.checked : target.value;
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (status !== 'submitting') {
        setStatus('idle');
        setError(null);
      }
    };

  const toggleInterest = (interest: string) => {
    setFormData((prev) => {
      const next = prev.interests.includes(interest)
        ? prev.interests.filter((item) => item !== interest)
        : [...prev.interests, interest];
      return { ...prev, interests: next };
    });
    if (status !== 'submitting') {
      setStatus('idle');
      setError(null);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!firebaseEnabled) {
      setStatus('error');
      setError('Firebase is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* keys to enable signups.');
      return;
    }

    if (!formData.consent) {
      setStatus('error');
      setError('Please confirm we can contact you about the launch.');
      return;
    }

    setStatus('submitting');
    try {
      await submitWaitlist({
        name: formData.name,
        email: formData.email,
        deviceType: formData.deviceType,
        community: formData.community,
        interests: formData.interests,
        notes: formData.notes,
        consent: formData.consent,
        source: 'home-page'
      });
      setStatus('success');
      setFormData({
        name: '',
        email: '',
        deviceType: 'Bracelet',
        community: '',
        interests: [],
        notes: '',
        consent: false
      });
    } catch (submitError) {
      console.error('Waitlist submission failed:', submitError);
      setStatus('error');
      setError('Something went wrong. Please try again in a moment.');
    }
  };

  return (
    <div className="relative min-h-screen text-slate-900 overflow-hidden" style={themeStyle}>
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            'radial-gradient(1200px 600px at 20% -10%, rgba(2,132,199,0.22), transparent), radial-gradient(900px 700px at 80% 10%, rgba(249,115,22,0.2), transparent), linear-gradient(180deg, var(--sand), #ffffff)'
        }}
      />
      <div className="absolute inset-0 woodland-pattern -z-10" />
      <div
        className="absolute -top-40 -right-10 w-[32rem] h-[32rem] rounded-full blur-3xl opacity-30 -z-10"
        style={{ background: 'radial-gradient(circle, rgba(15,118,110,0.4), transparent 70%)' }}
      />

      <header className="max-w-6xl mx-auto px-6 pt-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/80 border border-slate-200 shadow-sm flex items-center justify-center text-lg font-bold">
            TC
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-slate-500">Tbay Tech Services</p>
            <p className="text-lg font-serif" style={{ color: 'var(--ink)' }}>
              Anishinaabe Connect
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loginHref && (
            <a
              href={loginHref}
              className="text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-slate-900/10 bg-white/70 hover:bg-white transition"
            >
              Sign in
            </a>
          )}
          <button
            onClick={handleScrollToForm}
            className="text-[11px] font-bold uppercase tracking-[0.2em] px-4 py-2 rounded-full border border-slate-900/10 bg-white/70 hover:bg-white transition"
          >
            Pre-order
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <section className="pt-16 pb-12 grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-start">
          <div className="space-y-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.2em] bg-white/80 border border-amber-200 text-amber-700 reveal-up reveal-delay-1"
            >
              Artist-designed wearables for Thunder Bay
            </span>
            <h1 className="text-4xl md:text-6xl font-serif leading-tight reveal-up reveal-delay-2" style={{ color: 'var(--ink)' }}>
              Signal gatherings with a wearable rooted in culture.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl reveal-up reveal-delay-3">
              A bracelet, necklace, or ring that locks your GPS location, alerts nearby community members,
              and helps people show up for sports, cultural events, meals, and ceremonies.
            </p>
            <div className="flex flex-wrap gap-3 reveal-up reveal-delay-4">
              <button
                onClick={handleScrollToForm}
                className="px-6 py-3 rounded-2xl text-sm font-bold text-white shadow-lg"
                style={{ backgroundColor: 'var(--pine)' }}
              >
                Reserve your device
              </button>
              <a
                href={demoHref}
                className="px-6 py-3 rounded-2xl text-sm font-bold border border-slate-900/20 bg-white/70 hover:bg-white transition text-center"
              >
                View live demo
              </a>
            </div>
            <div className="grid grid-cols-3 gap-3 pt-6 reveal-up reveal-delay-4">
              {[
                { title: 'GPS-locked', detail: 'Pin gatherings in seconds.' },
                { title: 'Haptic + Audio', detail: 'Vibration and voice alerts.' },
                { title: 'Cultural Design', detail: 'Designed by Indigenous artists.' }
              ].map((item) => (
                <div key={item.title} className="bg-white/80 border border-slate-200 rounded-2xl p-4 shadow-sm">
                  <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                    {item.title}
                  </p>
                  <p className="text-[11px] text-slate-500">{item.detail}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div
              className="absolute -top-6 -left-6 w-32 h-32 rounded-full opacity-30 blur-2xl"
              style={{ background: 'radial-gradient(circle, rgba(2,132,199,0.6), transparent 70%)' }}
            />
            <div className="bg-white/90 border border-slate-200 rounded-[2.5rem] p-6 shadow-2xl reveal-up reveal-delay-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Wearable Stack</p>
                  <h3 className="text-2xl font-serif" style={{ color: 'var(--ink)' }}>
                    Signal Kit
                  </h3>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">Live</span>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                {deviceOptions.map((option) => (
                  <div
                    key={option.value}
                    className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                  >
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--ink)' }}>
                        {option.label}
                      </p>
                      <p className="text-[11px] text-slate-500">{option.detail}</p>
                    </div>
                    <div className="w-11 h-11 rounded-2xl border border-slate-200 bg-white flex items-center justify-center text-lg font-bold text-slate-500">
                      {option.value === 'Bracelet' ? 'B' : option.value === 'Necklace' ? 'N' : 'R'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                {[
                  { title: 'GPS Tracker', detail: 'Secure location pin.' },
                  { title: 'Blinker', detail: 'Visual alert LED.' },
                  { title: 'Audio Cue', detail: 'Speaker announcements.' },
                  { title: 'Sensors', detail: 'UV and environment data.' }
                ].map((item) => (
                  <div key={item.title} className="rounded-2xl bg-white border border-slate-200 p-4">
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-500">{item.title}</p>
                    <p className="text-[11px] text-slate-600">{item.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="flex items-end justify-between mb-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500">How it works</p>
              <h2 className="text-3xl font-serif" style={{ color: 'var(--ink)' }}>
                Create a gathering, send the signal, meet in person.
              </h2>
            </div>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Lock your location', detail: 'Set a gathering with GPS accuracy.' },
              { step: '02', title: 'Notify the community', detail: 'Nearby devices vibrate and light up.' },
              { step: '03', title: 'Join and navigate', detail: 'Open the app for directions.' },
              { step: '04', title: 'Gather and share', detail: 'Sports, food, culture, and wellness.' }
            ].map((item) => (
              <div key={item.step} className="bg-white/90 border border-slate-200 rounded-2xl p-5 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Step {item.step}</p>
                <p className="text-lg font-semibold mt-2" style={{ color: 'var(--ink)' }}>
                  {item.title}
                </p>
                <p className="text-[12px] text-slate-500 mt-2">{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="py-12">
          <div className="grid lg:grid-cols-[1fr_1.1fr] gap-10 items-start">
            <div className="space-y-6">
              <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500">Respect + privacy</p>
              <h2 className="text-3xl font-serif" style={{ color: 'var(--ink)' }}>
                Community-led, opt-in, and designed for safety.
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                People choose when to share their location. Events only reach people who opted into the
                category and distance radius. We blur exact location until someone decides to join.
              </p>
              <div className="grid gap-3">
                {[
                  'Category-based notifications',
                  'Distance-based visibility',
                  'Artist-designed wearable shells',
                  'Local Thunder Bay stewardship'
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--ember)' }} />
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-xs uppercase tracking-[0.2em] font-bold text-amber-600">Rollout</p>
                <div className="grid gap-3 mt-3">
                  {rolloutSteps.map((step) => (
                    <div key={step.title}>
                      <p className="text-sm font-bold text-slate-800">{step.title}</p>
                      <p className="text-[11px] text-slate-600">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div
              ref={formRef}
              className="bg-white/95 border border-slate-200 rounded-[2.5rem] p-6 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.3em] font-bold text-slate-500">Pre-order</p>
                  <h3 className="text-2xl font-serif" style={{ color: 'var(--ink)' }}>
                    Join the waitlist
                  </h3>
                </div>
                <div className="text-[10px] uppercase tracking-[0.2em] font-bold text-emerald-600">
                  No payment yet
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">
                    Full name
                    <input
                      value={formData.name}
                      onChange={handleFieldChange('name')}
                      required
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="Name"
                    />
                  </label>
                  <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">
                    Email
                    <input
                      value={formData.email}
                      onChange={handleFieldChange('email')}
                      required
                      type="email"
                      className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                      placeholder="you@email.com"
                    />
                  </label>
                </div>

                <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] block">
                  Preferred device
                  <select
                    value={formData.deviceType}
                    onChange={handleFieldChange('deviceType')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                  >
                    {deviceOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] block">
                  Community or neighborhood (optional)
                  <input
                    value={formData.community}
                    onChange={handleFieldChange('community')}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Thunder Bay"
                  />
                </label>

                <div>
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em]">Interested in</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {interestOptions.map((interest) => {
                      const isActive = formData.interests.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`px-4 py-2 rounded-full text-xs font-bold border transition ${
                            isActive
                              ? 'border-emerald-600 text-emerald-700 bg-emerald-50'
                              : 'border-slate-200 text-slate-500 bg-white'
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <label className="text-xs font-bold text-slate-600 uppercase tracking-[0.2em] block">
                  Notes (optional)
                  <textarea
                    value={formData.notes}
                    onChange={handleFieldChange('notes')}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
                    placeholder="Tell us about your ideas."
                  />
                </label>

                <label className="flex items-start gap-3 text-xs text-slate-500">
                  <input
                    type="checkbox"
                    checked={formData.consent}
                    onChange={handleFieldChange('consent')}
                    className="mt-1 h-4 w-4 rounded border-slate-300"
                  />
                  I agree to receive launch updates and early access details.
                </label>

                {error && (
                  <div className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
                    {error}
                  </div>
                )}

                {status === 'success' && (
                  <div className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                    Thanks for joining. We will reach out with the first build updates.
                  </div>
                )}

                <button
                  type="submit"
                  disabled={status === 'submitting'}
                  className="w-full py-3 rounded-2xl text-sm font-bold text-white shadow-lg disabled:opacity-60"
                  style={{ backgroundColor: 'var(--pine)' }}
                >
                  {status === 'submitting' ? 'Sending...' : 'Join the waitlist'}
                </button>
              </form>
            </div>
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto px-6 pb-10 pt-6 text-xs text-slate-500 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <span>Built in Thunder Bay with community partners.</span>
        <span>Interested in collaboration? hello@tbaytech.ca</span>
      </footer>
    </div>
  );
};

export default HomePage;
