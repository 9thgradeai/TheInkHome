/**
 * Best-effort cross-device sync for likes/saves.
 *
 * localStorage is always the source of truth (works offline, instantly). On top
 * of that we best-effort GET/POST to `/api/sync` so a deployed backend can merge
 * and persist the reader's interactions across devices. Every call swallows
 * errors — if the backend is down, the local copy is simply kept.
 */

const SYNC_URL = "/api/sync";

async function fetchRemote(): Promise<{ likes: string[]; saves: string[] } | null> {
  try {
    const res = await fetch(SYNC_URL, { method: "GET", headers: { Accept: "application/json" } });
    if (!res.ok) return null;
    const data = await res.json();
    if (data && Array.isArray(data.likes) && Array.isArray(data.saves)) {
      return { likes: data.likes, saves: data.saves };
    }
    return null;
  } catch {
    return null;
  }
}

function postRemote(likes: string[], saves: string[]) {
  try {
    const payload = JSON.stringify({ likes, saves });
    if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
      navigator.sendBeacon(SYNC_URL, new Blob([payload], { type: "application/json" }));
      return;
    }
    fetch(SYNC_URL, {
      method: "POST",
      body: payload,
      keepalive: true,
      headers: { "Content-Type": "application/json" },
    }).catch(() => {});
  } catch {
    // never throw from sync
  }
}

/**
 * On load, try to hydrate from the backend, merging (union) with the local copy.
 * Returns true if a remote state was applied.
 */
export async function hydrateInteractions(
  localLikes: string[],
  localSaves: string[],
  apply: (likes: string[], saves: string[]) => void
): Promise<boolean> {
  const remote = await fetchRemote();
  if (!remote) return false;
  apply(
    [...new Set([...remote.likes, ...localLikes])],
    [...new Set([...remote.saves, ...localSaves])]
  );
  return true;
}

/** Debounced POST of the latest local state to the backend. */
export function persistInteractions(likes: string[], saves: string[]) {
  postRemote(likes, saves);
}
