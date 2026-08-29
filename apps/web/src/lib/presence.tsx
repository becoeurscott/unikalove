'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getSocket } from './socket';

export interface Presence {
  online: boolean;
  lastSeenAt: string | null;
}

interface PresenceEvent extends Presence {
  userId: string;
}

const PresenceContext = createContext<Map<string, Presence>>(new Map());

/**
 * Live online status for everyone this user has matched with.
 *
 * The gateway sends the full picture once on connect (`presence.sync`) and a
 * single row whenever someone comes or goes (`presence`), so the app holds one
 * shared map instead of every badge polling for itself.
 */
export function PresenceProvider({ children }: { children: React.ReactNode }) {
  const [map, setMap] = useState<Map<string, Presence>>(new Map());

  useEffect(() => {
    const socket = getSocket();

    const apply = (rows: PresenceEvent[]) =>
      setMap((previous) => {
        const next = new Map(previous);
        for (const row of rows) {
          next.set(row.userId, { online: row.online, lastSeenAt: row.lastSeenAt });
        }
        return next;
      });

    const onSync = (rows: PresenceEvent[]) => apply(rows ?? []);
    const onOne = (row: PresenceEvent) => row?.userId && apply([row]);

    socket.on('presence.sync', onSync);
    socket.on('presence', onOne);
    return () => {
      socket.off('presence.sync', onSync);
      socket.off('presence', onOne);
    };
  }, []);

  return <PresenceContext.Provider value={map}>{children}</PresenceContext.Provider>;
}

/**
 * Live status for one user. `fallback` is whatever the REST payload said, used
 * until a socket event arrives — on a fresh page load that is the only source.
 */
export function usePresence(userId: string | undefined, fallback?: Presence): Presence {
  const map = useContext(PresenceContext);
  return useMemo(() => {
    if (!userId) return { online: false, lastSeenAt: null };
    return map.get(userId) ?? fallback ?? { online: false, lastSeenAt: null };
  }, [map, userId, fallback]);
}

/** "il y a 5 min" / "hier" — deliberately coarse, an exact time is creepy. */
export function lastSeenLabel(lastSeenAt: string | null): string {
  if (!lastSeenAt) return 'Hors ligne';
  const minutes = Math.floor((Date.now() - new Date(lastSeenAt).getTime()) / 60_000);
  if (minutes < 1) return "Vu à l'instant";
  if (minutes < 60) return `Vu il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Vu il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Vu hier';
  if (days < 7) return `Vu il y a ${days} jours`;
  return 'Hors ligne';
}
