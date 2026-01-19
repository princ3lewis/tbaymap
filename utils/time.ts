import { TbayEvent } from '../types';

const toDate = (value?: string | null) => {
  if (!value) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

const formatTime = (date: Date) =>
  date.toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit' });

const formatDate = (date: Date) =>
  date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric' });

const formatWhen = (date: Date, now: Date) =>
  isSameDay(date, now) ? `Today, ${formatTime(date)}` : `${formatDate(date)}, ${formatTime(date)}`;

export const formatRelativeTime = (value?: string | null) => {
  const date = toDate(value);
  if (!date) {
    return 'just now';
  }
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  if (diffMs < 60 * 1000) {
    return 'just now';
  }
  const minutes = Math.floor(diffMs / (60 * 1000));
  if (minutes < 60) {
    return `${minutes}m ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }
  return formatDate(date);
};

export const formatEventTiming = (event: TbayEvent) => {
  const now = new Date();
  const startAt = toDate(event.startAt);
  const endAt = toDate(event.endAt);
  const endedAt = toDate(event.endedAt);

  if (event.status === 'ended') {
    return endedAt ? `Ended ${formatRelativeTime(event.endedAt)}` : 'Ended';
  }

  if (startAt) {
    const startLabel = formatWhen(startAt, now);
    if (endAt) {
      const endLabel = formatWhen(endAt, now);
      return `Starts ${startLabel} • Ends ${endLabel}`;
    }
    return `Starts ${startLabel}`;
  }

  if (endAt) {
    return `Ends ${formatWhen(endAt, now)}`;
  }

  if (event.createdAt) {
    return `Posted ${formatRelativeTime(event.createdAt)}`;
  }

  return event.time;
};

export const isEventActive = (event: TbayEvent) => event.status !== 'ended';
