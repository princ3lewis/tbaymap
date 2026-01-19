'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { useAuth } from '../../../components/AuthProvider';
import { subscribeToAdminStatus } from '../../../services/adminService';
import {
  ASSEMBLY_HOTSPOTS,
  ASSEMBLY_STEPS,
  ASSEMBLY_SUBASSEMBLIES,
  EXPLODED_LAYERS,
  PIN_MAP
} from '../../../data/assemblyGuide';
import { HARDWARE_BOM } from '../../../data/hardwarePlan';

export default function AssemblyPage() {
  const { user, loading, signOut, enabled } = useAuth();
  const userEmail = user?.email?.toLowerCase() ?? '';
  const [adminStatus, setAdminStatus] = useState<'checking' | 'admin' | 'none'>('checking');
  const [focusMode, setFocusMode] = useState<'steps' | 'subassemblies'>('steps');
  const [viewMode, setViewMode] = useState<'full' | 'detail'>('full');
  const [activeStepId, setActiveStepId] = useState(ASSEMBLY_STEPS[0]?.id ?? '');
  const [activeSubassemblyId, setActiveSubassemblyId] = useState(ASSEMBLY_SUBASSEMBLIES[0]?.id ?? '');
  const [showAllHotspots, setShowAllHotspots] = useState(false);
  const [trainingMode, setTrainingMode] = useState(true);
  const modelViewerRef = useRef<any>(null);
  const viewPresets = useMemo(
    () => ({
      full: { cameraOrbit: '45deg 70deg 11m', cameraTarget: '0m -0.2m 0m', fieldOfView: '42deg' },
      detail: { cameraOrbit: '45deg 70deg 2.8m', cameraTarget: '0m 0m 0m', fieldOfView: '20deg' }
    }),
    []
  );

  useEffect(() => {
    if (!enabled || !userEmail) {
      setAdminStatus('checking');
      return;
    }
    const unsubscribeStatus = subscribeToAdminStatus(userEmail, (nextIsAdmin) => {
      setAdminStatus(nextIsAdmin ? 'admin' : 'none');
    });
    return () => unsubscribeStatus();
  }, [enabled, userEmail]);

  const requiredParts = HARDWARE_BOM.filter((item) => item.required);
  const activeStep = useMemo(
    () => ASSEMBLY_STEPS.find((step) => step.id === activeStepId) ?? ASSEMBLY_STEPS[0] ?? null,
    [activeStepId]
  );
  const activeSubassembly = useMemo(
    () =>
      ASSEMBLY_SUBASSEMBLIES.find((subassembly) => subassembly.id === activeSubassemblyId) ??
      ASSEMBLY_SUBASSEMBLIES[0] ??
      null,
    [activeSubassemblyId]
  );
  const activeHotspotIds = useMemo(() => {
    if (focusMode === 'subassemblies') {
      return new Set(activeSubassembly?.hotspots ?? []);
    }
    return new Set(activeStep?.hotspots ?? []);
  }, [activeStep?.hotspots, activeSubassembly?.hotspots, focusMode]);
  const visibleHotspotIds = useMemo(() => {
    if (showAllHotspots) {
      return new Set(ASSEMBLY_HOTSPOTS.map((hotspot) => hotspot.id));
    }
    return activeHotspotIds;
  }, [activeHotspotIds, showAllHotspots]);
  const activeHotspots = useMemo(
    () => ASSEMBLY_HOTSPOTS.filter((hotspot) => activeHotspotIds.has(hotspot.id)),
    [activeHotspotIds]
  );
  const activeLayerIds = useMemo(() => {
    if (focusMode === 'subassemblies' && activeSubassembly) {
      return new Set(
        ASSEMBLY_STEPS.filter((step) => activeSubassembly.steps.includes(step.id))
          .map((step) => step.layerId)
          .filter(Boolean) as string[]
      );
    }
    if (focusMode === 'steps' && activeStep?.layerId) {
      return new Set([activeStep.layerId]);
    }
    return new Set<string>();
  }, [activeStep?.layerId, activeSubassembly, focusMode]);
  const stepLabelMap = useMemo(() => new Map(ASSEMBLY_STEPS.map((step) => [step.id, step.title])), []);

  useEffect(() => {
    if (!modelViewerRef.current) {
      return;
    }
    const focus = focusMode === 'subassemblies' ? activeSubassembly?.focus : activeStep?.focus;
    if (focus) {
      modelViewerRef.current.cameraOrbit = focus.cameraOrbit;
      modelViewerRef.current.cameraTarget = focus.cameraTarget;
    }
  }, [activeStep?.focus, activeSubassembly?.focus, focusMode]);

  useEffect(() => {
    if (!modelViewerRef.current) {
      return;
    }
    const preset = viewPresets[viewMode];
    modelViewerRef.current.cameraOrbit = preset.cameraOrbit;
    modelViewerRef.current.cameraTarget = preset.cameraTarget;
    modelViewerRef.current.fieldOfView = preset.fieldOfView;
  }, [viewMode, viewPresets]);

  useEffect(() => {
    if (focusMode !== 'steps' || !activeStep?.subassemblyId) {
      return;
    }
    setActiveSubassemblyId(activeStep.subassemblyId);
  }, [activeStep?.subassemblyId, focusMode]);

  const resetCamera = () => {
    setViewMode('full');
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">Loading...</div>;
  }

  if (!enabled) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-serif text-slate-900">Admin access offline</h1>
          <p className="text-sm text-slate-600">
            Firebase is not configured yet. Add your NEXT_PUBLIC_FIREBASE_* keys first.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center w-full py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
          >
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-serif text-slate-900">Sign in to assemble</h1>
          <p className="text-sm text-slate-600">Use your admin account to access the assembly station.</p>
          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
            >
              Log in
            </Link>
            <Link
              href="/"
              className="w-full py-3 rounded-2xl text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (adminStatus === 'checking') {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-slate-500">
        Checking admin access...
      </div>
    );
  }

  if (adminStatus !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 shadow-xl text-center space-y-4">
          <h1 className="text-2xl font-serif text-slate-900">No admin access</h1>
          <p className="text-sm text-slate-600">
            {user.email ?? 'This account'} does not have admin access. Ask an admin to add you.
          </p>
          <div className="flex flex-col gap-2">
            <Link
              href="/"
              className="w-full py-3 rounded-2xl text-sm font-bold text-slate-700 border border-slate-200 hover:bg-slate-50 transition"
            >
              Back to home
            </Link>
            <button
              onClick={signOut}
              className="w-full py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Script
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
        type="module"
      />
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Assembly Station</p>
            <h1 className="text-2xl font-serif text-slate-900">Tbay Wearable Build Guide</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Link
              href="/admin"
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
            >
              Console
            </Link>
            <Link
              href="/admin/assembly/wiring"
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
            >
              Wiring View
            </Link>
            <Link
              href="/"
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
            >
              Home
            </Link>
            <Link
              href="/live"
              className="px-4 py-2 rounded-full border border-slate-200 text-xs font-bold uppercase tracking-[0.2em] text-slate-600 hover:bg-slate-50"
            >
              Live App
            </Link>
            <button
              onClick={signOut}
              className="px-4 py-2 rounded-full bg-slate-900 text-xs font-bold uppercase tracking-[0.2em] text-white hover:bg-slate-800"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        <section className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">3D assembly model</h2>
              <p className="text-xs text-slate-500">
                Custom concept model included at `public/models/tbay-bracelet.gltf`.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('full')}
                className={`px-3 py-1.5 rounded-full border ${
                  viewMode === 'full'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Full view
              </button>
              <button
                type="button"
                onClick={() => setViewMode('detail')}
                className={`px-3 py-1.5 rounded-full border ${
                  viewMode === 'detail'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Detail zoom
              </button>
              <button
                type="button"
                onClick={() => setFocusMode('steps')}
                className={`px-3 py-1.5 rounded-full border ${
                  focusMode === 'steps'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Step focus
              </button>
              <button
                type="button"
                onClick={() => setFocusMode('subassemblies')}
                className={`px-3 py-1.5 rounded-full border ${
                  focusMode === 'subassemblies'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'border-slate-200 text-slate-600'
                }`}
              >
                Sub-build focus
              </button>
              <button
                type="button"
                onClick={() => setShowAllHotspots((prev) => !prev)}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600"
              >
                {showAllHotspots ? 'Hide labels' : 'Show all labels'}
              </button>
              <button
                type="button"
                onClick={resetCamera}
                className="px-3 py-1.5 rounded-full border border-slate-200 text-slate-600"
              >
                Reset view
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-950/5">
              <model-viewer
                ref={modelViewerRef}
                src="/models/tbay-bracelet.gltf"
                alt="Tbay wearable assembly model"
                camera-controls
                auto-rotate
                shadow-intensity="0.8"
                field-of-view={viewPresets[viewMode].fieldOfView}
                style={{ width: '100%', height: '420px' }}
              >
                {ASSEMBLY_HOTSPOTS.map((hotspot) => {
                  const isActive = activeHotspotIds.has(hotspot.id);
                  const isVisible = visibleHotspotIds.has(hotspot.id);
                  return (
                    <button
                      key={hotspot.id}
                      type="button"
                      slot={`hotspot-${hotspot.id}`}
                      data-position={`${hotspot.position.x} ${hotspot.position.y} ${hotspot.position.z}`}
                      data-normal={`${hotspot.normal.x} ${hotspot.normal.y} ${hotspot.normal.z}`}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold shadow ${
                        isActive
                          ? 'bg-indigo-600 text-white ring-2 ring-indigo-200'
                          : 'bg-white/90 text-slate-700 border border-slate-200'
                      } ${isVisible ? '' : 'hidden'}`}
                    >
                      <span className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-slate-400'}`} />
                      {hotspot.label}
                    </button>
                  );
                })}
              </model-viewer>
            </div>
            <p className="text-xs text-slate-500">
              Tip: replace `/public/models/tbay-bracelet.gltf` with your final CAD export when ready.
            </p>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                Active parts
              </p>
              <div className="flex flex-wrap gap-2">
                {activeHotspots.length === 0 && (
                  <span className="text-[11px] text-slate-400">Select a step or sub-build to highlight.</span>
                )}
                {activeHotspots.map((hotspot) => (
                  <span
                    key={hotspot.id}
                    className="px-3 py-1 rounded-full text-[11px] font-semibold text-slate-600 bg-white border border-slate-200"
                  >
                    {hotspot.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Exploded view</h2>
              <p className="text-xs text-slate-500">Layer order from top to base.</p>
            </div>
            <div className="relative h-[360px] flex flex-col items-center justify-end gap-2">
              {EXPLODED_LAYERS.map((layer, index) => (
                <div
                  key={layer.id}
                  className={`w-48 sm:w-64 h-10 rounded-xl ${layer.color} shadow-md border border-white/70 transition ${
                    activeLayerIds.has(layer.id) ? 'ring-4 ring-indigo-300 scale-[1.02]' : ''
                  }`}
                  style={{ transform: `translateY(-${index * 14}px)` }}
                />
              ))}
            </div>
            <div className="space-y-2">
              {EXPLODED_LAYERS.map((layer) => (
                <div
                  key={layer.id}
                  className={`text-xs text-slate-600 ${
                    activeLayerIds.has(layer.id) ? 'font-semibold text-slate-900' : ''
                  }`}
                >
                  <span className="font-semibold text-slate-800">{layer.label}:</span> {layer.description}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Assembly sequence</h2>
            <p className="text-xs text-slate-500">
              Follow each step and mark the matching manufacturing stage in the admin console.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ASSEMBLY_STEPS.map((step, index) => (
              <button
                key={step.id}
                type="button"
                onClick={() => {
                  setActiveStepId(step.id);
                  setFocusMode('steps');
                }}
                className={`border border-slate-200 rounded-2xl p-4 space-y-3 text-left transition ${
                  step.id === activeStep?.id ? 'ring-2 ring-indigo-300 bg-indigo-50/30' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500">Step {index + 1}</p>
                  {step.id === activeStep?.id && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-500">
                      Active
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 break-words">{step.title}</h3>
                <p className="text-xs text-slate-600">{step.summary}</p>
                <div className="text-[11px] text-slate-500 space-y-1">
                  <p className="font-semibold text-slate-600">Parts: {step.parts.join(', ')}</p>
                  <p>Tools: {step.tools.join(', ')}</p>
                  <p>Checks: {step.checks.join(', ')}</p>
                </div>
              </button>
            ))}
          </div>
          {activeStep && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-1">
                    Guided build coach
                  </p>
                  <p className="text-sm font-semibold text-slate-800">{activeStep.title}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-[11px] font-semibold">
                  {activeStep.difficulty && (
                    <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 uppercase tracking-[0.15em]">
                      {activeStep.difficulty}
                    </span>
                  )}
                  {activeStep.timeMinutes && (
                    <span className="px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600">
                      ~{activeStep.timeMinutes} min
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-slate-600">{activeStep.summary}</p>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setTrainingMode(true)}
                  className={`px-3 py-1.5 rounded-full border ${
                    trainingMode ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Trainer view
                </button>
                <button
                  type="button"
                  onClick={() => setTrainingMode(false)}
                  className={`px-3 py-1.5 rounded-full border ${
                    !trainingMode ? 'bg-slate-900 text-white border-slate-900' : 'border-slate-200 text-slate-600'
                  }`}
                >
                  Builder view
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Do this</p>
                  <ol className="list-decimal list-inside text-xs text-slate-600 space-y-1">
                    {(trainingMode ? activeStep.kidSteps : activeStep.microSteps)?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ol>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-3 space-y-2">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Safety + tips</p>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                    {activeStep.safety?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                    {activeStep.tips?.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                    Parts + tools
                  </p>
                  <p className="text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Parts:</span> {activeStep.parts.join(', ')}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">
                    <span className="font-semibold text-slate-800">Tools:</span> {activeStep.tools.join(', ')}
                  </p>
                </div>
                <div className="bg-white rounded-2xl border border-slate-200 p-3">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">Done when</p>
                  <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                    {activeStep.checks.map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Sub-build processes</h2>
            <p className="text-xs text-slate-500">
              Grouped builds to visualize how modules fit together before final assembly.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ASSEMBLY_SUBASSEMBLIES.map((subassembly) => (
              <button
                key={subassembly.id}
                type="button"
                onClick={() => {
                  setActiveSubassemblyId(subassembly.id);
                  setFocusMode('subassemblies');
                }}
                className={`border border-slate-200 rounded-2xl p-4 text-left space-y-2 transition ${
                  subassembly.id === activeSubassembly?.id
                    ? 'ring-2 ring-emerald-300 bg-emerald-50/30'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-[0.2em]">Module</p>
                  {subassembly.id === activeSubassembly?.id && (
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-600">
                      Focused
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900">{subassembly.title}</h3>
                <p className="text-xs text-slate-600">{subassembly.summary}</p>
                <p className="text-[11px] text-slate-500">
                  Parts: {subassembly.parts.join(', ')}
                </p>
                <p className="text-[11px] text-slate-400">
                  Steps: {subassembly.steps.map((stepId) => stepLabelMap.get(stepId) ?? stepId).join(', ')}
                </p>
              </button>
            ))}
          </div>
          {activeSubassembly && (
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-2">
                Module focus
              </p>
              <p className="text-sm font-semibold text-slate-800">{activeSubassembly.title}</p>
              <p className="text-xs text-slate-600 mt-1">{activeSubassembly.summary}</p>
            </div>
          )}
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-6">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Pin map (BLE build)</h2>
              <p className="text-xs text-slate-500">
                Use the official wiring harness and keep wire runs short.
              </p>
            </div>
            <div className="space-y-3">
              {PIN_MAP.map((entry) => (
                <div key={entry.id} className="border border-slate-200 rounded-2xl p-4 space-y-1">
                  <p className="text-xs font-semibold text-slate-800">{entry.signal}</p>
                  <p className="text-xs text-slate-500">
                    {entry.from} → {entry.to}
                  </p>
                  <p className="text-[11px] text-slate-400">{entry.notes}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Required parts per device</h2>
              <p className="text-xs text-slate-500">Baseline BLE-to-mobile stack.</p>
            </div>
            <div className="space-y-3">
              {requiredParts.map((part) => (
                <div key={part.id} className="border border-slate-200 rounded-2xl p-3">
                  <p className="text-xs font-semibold text-slate-800 break-words">{part.name}</p>
                  <p className="text-[11px] text-slate-500 break-words">
                    SKU {part.sku} • {part.supplier} • {part.perDeviceQty} per device
                  </p>
                  <p className="text-[11px] text-slate-400 break-words">{part.purpose}</p>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-slate-500">Full hardware guide: `docs/hardware-setup.md`</p>
          </div>
        </section>
      </main>
    </div>
  );
}
