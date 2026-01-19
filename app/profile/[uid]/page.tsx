'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useAuth } from '../../../components/AuthProvider';
import {
  followUser,
  subscribeToFollowingIds,
  subscribeToUserProfile,
  unfollowUser,
  updateUserProfile
} from '../../../services/userService';
import { subscribeToEventsByCreator } from '../../../services/eventsService';
import { TbayEvent, UserProfile } from '../../../types';
import { formatEventTiming } from '../../../utils/time';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../../../services/firebase';

const ProfilePage = () => {
  const params = useParams();
  const uid = Array.isArray(params?.uid) ? params.uid[0] : params?.uid;
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followingIds, setFollowingIds] = useState<string[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [events, setEvents] = useState<TbayEvent[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [formState, setFormState] = useState<UserProfile | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);

  const isSelf = Boolean(user?.uid && uid && user.uid === uid);
  const isFollowing = Boolean(uid && followingIds.includes(uid));

  useEffect(() => {
    if (!uid) {
      return;
    }
    const unsubscribe = subscribeToUserProfile(uid, (nextProfile) => {
      setProfile(nextProfile);
      if (isSelf) {
        setFormState(nextProfile);
      }
    });
    return () => unsubscribe();
  }, [uid, isSelf]);

  useEffect(() => {
    if (!uid || !db) {
      setFollowersCount(0);
      return;
    }
    const followersRef = collection(db, 'users', uid, 'followers');
    const unsubscribe = onSnapshot(
      followersRef,
      (snapshot) => {
        setFollowersCount(snapshot.size);
      },
      (error) => {
        console.error('Followers count failed:', error);
        setFollowersCount(0);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!uid || !db) {
      setFollowingCount(0);
      return;
    }
    const followingRef = collection(db, 'users', uid, 'following');
    const unsubscribe = onSnapshot(
      followingRef,
      (snapshot) => {
        setFollowingCount(snapshot.size);
      },
      (error) => {
        console.error('Following count failed:', error);
        setFollowingCount(0);
      }
    );
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!user?.uid) {
      setFollowingIds([]);
      return;
    }
    const unsubscribe = subscribeToFollowingIds(user.uid, setFollowingIds);
    return () => unsubscribe();
  }, [user?.uid]);

  useEffect(() => {
    if (!uid) {
      setEvents([]);
      return;
    }
    const unsubscribe = subscribeToEventsByCreator(uid, setEvents);
    return () => unsubscribe();
  }, [uid]);

  useEffect(() => {
    if (!editMode) {
      setFormState(profile);
    }
  }, [editMode, profile]);

  const handleFollowToggle = async () => {
    if (!user?.uid || !uid) {
      setActionError('Log in to follow profiles.');
      return;
    }
    setActionError(null);
    setActionBusy(true);
    try {
      if (isFollowing) {
        await unfollowUser({ uid: user.uid, targetUid: uid });
      } else {
        await followUser({ uid: user.uid, targetUid: uid });
      }
    } catch (error) {
      console.error('Follow action failed:', error);
      setActionError('Unable to update following status.');
    } finally {
      setActionBusy(false);
    }
  };

  const handleProfileSave = async () => {
    if (!user?.uid || !formState) {
      return;
    }
    setActionBusy(true);
    setActionError(null);
    try {
      await updateUserProfile(user.uid, formState);
      setEditMode(false);
    } catch (error) {
      console.error('Profile update failed:', error);
      setActionError('Unable to save profile.');
    } finally {
      setActionBusy(false);
    }
  };

  const interestsLabel = useMemo(() => {
    if (!profile?.interests || profile.interests.length === 0) {
      return 'No interests listed yet.';
    }
    return profile.interests.join(', ');
  }, [profile]);

  if (!uid) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Profile not found.
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-sm text-slate-500">
        Loading profile...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-400">Profile</p>
            <h1 className="text-2xl font-serif text-slate-900">{profile.displayName}</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
            <span>{followersCount} followers</span>
            <span>{followingCount} following</span>
            {!isSelf && (
              <button
                onClick={handleFollowToggle}
                disabled={actionBusy}
                className={`px-4 py-2 rounded-full text-[11px] font-bold ${
                  isFollowing ? 'bg-slate-900 text-white' : 'bg-indigo-600 text-white'
                } ${actionBusy ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {isFollowing ? 'Following' : 'Follow'}
              </button>
            )}
            {isSelf && (
              <button
                onClick={() => setEditMode((prev) => !prev)}
                className="px-4 py-2 rounded-full border border-slate-200 text-[11px] font-bold text-slate-600"
              >
                {editMode ? 'Cancel edit' : 'Edit profile'}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        {actionError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs font-semibold text-rose-700">
            {actionError}
          </div>
        )}

        <section className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Age</p>
              <p className="font-semibold">{profile.age ?? 'Not set'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Community</p>
              <p className="font-semibold">{profile.community || 'Not shared'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Job</p>
              <p className="font-semibold">{profile.job || 'Not shared'}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">School</p>
              <p className="font-semibold">{profile.school || 'Not shared'}</p>
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">Interests</p>
            <p className="text-sm text-slate-600">{interestsLabel}</p>
          </div>
          {profile.bio && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">About</p>
              <p className="text-sm text-slate-600 leading-relaxed">{profile.bio}</p>
            </div>
          )}
          {profile.location && (
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-slate-400 font-bold">From</p>
              <p className="text-sm text-slate-600">{profile.location}</p>
            </div>
          )}
        </section>

        {isSelf && editMode && formState && (
          <section className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Edit profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Display name</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formState.displayName}
                  onChange={(event) =>
                    setFormState((prev) => (prev ? { ...prev, displayName: event.target.value } : prev))
                  }
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Age</span>
                <input
                  type="number"
                  min={0}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formState.age ?? ''}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev ? { ...prev, age: event.target.value ? Number(event.target.value) : null } : prev
                    )
                  }
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Community</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formState.community}
                  onChange={(event) =>
                    setFormState((prev) => (prev ? { ...prev, community: event.target.value } : prev))
                  }
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">From</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formState.location}
                  onChange={(event) =>
                    setFormState((prev) => (prev ? { ...prev, location: event.target.value } : prev))
                  }
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Job</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formState.job}
                  onChange={(event) =>
                    setFormState((prev) => (prev ? { ...prev, job: event.target.value } : prev))
                  }
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">School</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={formState.school}
                  onChange={(event) =>
                    setFormState((prev) => (prev ? { ...prev, school: event.target.value } : prev))
                  }
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Interests</span>
                <input
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Sports, Culture, Food"
                  value={formState.interests.join(', ')}
                  onChange={(event) =>
                    setFormState((prev) =>
                      prev
                        ? {
                            ...prev,
                            interests: event.target.value
                              .split(',')
                              .map((item) => item.trim())
                              .filter(Boolean)
                          }
                        : prev
                    )
                  }
                />
              </label>
              <label className="block md:col-span-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">About</span>
                <textarea
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px]"
                  value={formState.bio}
                  onChange={(event) =>
                    setFormState((prev) => (prev ? { ...prev, bio: event.target.value } : prev))
                  }
                />
              </label>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setEditMode(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-slate-600 border border-slate-200 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleProfileSave}
                disabled={actionBusy}
                className="flex-1 py-3 rounded-2xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {actionBusy ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </section>
        )}

        <section className="bg-white rounded-[2rem] border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500">Events by {profile.displayName}</h2>
          {events.length === 0 ? (
            <p className="text-sm text-slate-500">No events posted yet.</p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  target="_blank"
                  className="block rounded-2xl border border-slate-100 p-4 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-slate-800">{event.title}</p>
                      <p className="text-[11px] text-slate-500">{formatEventTiming(event)}</p>
                    </div>
                    <span className="text-[10px] font-bold uppercase text-slate-400">{event.category}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <div className="text-xs text-slate-500">
          <Link href="/live" className="font-semibold text-indigo-600 hover:text-indigo-700">
            Back to live app
          </Link>
        </div>
      </main>
    </div>
  );
};

export default ProfilePage;
