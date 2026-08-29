'use client';

import { lastSeenLabel, usePresence, type Presence } from '@/lib/presence';

/**
 * The green/grey status dot. Sits on an avatar when `overlay` is set, otherwise
 * flows inline next to a name.
 */
export function PresenceDot({
  userId,
  fallback,
  overlay,
  size = 10,
}: {
  userId: string | undefined;
  fallback?: Presence;
  /** Position it over the bottom-right of a relatively-positioned avatar. */
  overlay?: boolean;
  size?: number;
}) {
  const { online, lastSeenAt } = usePresence(userId, fallback);
  const title = online ? 'En ligne' : lastSeenLabel(lastSeenAt);

  return (
    <span
      role="status"
      aria-label={title}
      title={title}
      style={{ width: size, height: size }}
      className={`inline-block shrink-0 rounded-full ${
        online ? 'bg-emerald-500' : 'bg-gray-300'
      } ${overlay ? 'absolute -bottom-0.5 -right-0.5 border-2 border-white' : ''}`}
    />
  );
}

/** Dot plus wording — for a conversation header, where there is room to explain. */
export function PresenceLabel({
  userId,
  fallback,
}: {
  userId: string | undefined;
  fallback?: Presence;
}) {
  const { online, lastSeenAt } = usePresence(userId, fallback);
  return (
    <span className="flex items-center gap-1.5 text-xs text-gray-500">
      <PresenceDot userId={userId} fallback={fallback} size={8} />
      {online ? 'En ligne' : lastSeenLabel(lastSeenAt)}
    </span>
  );
}
