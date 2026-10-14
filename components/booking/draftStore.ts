"use client";

import { useSyncExternalStore } from "react";
import { stockholmDate } from "@/components/ui/calendar-utils";
import type { RequestDraft } from "@/lib/booking/schema";
import {
  clearStoredDraft,
  emptyDraft,
  readDraft,
  writeDraft,
  type StorageLike,
} from "@/lib/booking/state";

/**
 * The request draft as a tiny external store backed by sessionStorage (`nordvra-request-v1`).
 * Read with `useRequestDraft()`; on the server and during hydration it returns null so the flow
 * renders its loading placeholder instead of mismatching HTML.
 */

export interface DraftSnapshot {
  draft: RequestDraft;
  /** Today's date in Swedish time ("YYYY-MM-DD"), read once in the browser. */
  today: string;
}

let snapshot: DraftSnapshot | null = null;
const listeners = new Set<() => void>();

function storage(): StorageLike | null {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage;
  } catch {
    // Access can throw when storage is blocked (privacy settings, sandboxed frames).
    return null;
  }
}

function load(): DraftSnapshot {
  snapshot ??= { draft: readDraft(storage()), today: stockholmDate(new Date()) };
  return snapshot;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getServerSnapshot(): DraftSnapshot | null {
  return null;
}

/** The current draft, or null before the component has mounted in the browser. */
export function useRequestDraft(): DraftSnapshot | null {
  return useSyncExternalStore<DraftSnapshot | null>(subscribe, load, getServerSnapshot);
}

/** Applies an update and saves it. Updates that return the same object are ignored. */
export function updateDraft(update: (draft: RequestDraft) => RequestDraft) {
  const current = load();
  const next = update(current.draft);
  if (next === current.draft) return;
  snapshot = { ...current, draft: next };
  writeDraft(storage(), next);
  emit();
}

/** Forgets the request (after it was sent, or when starting over). */
export function resetDraft() {
  clearStoredDraft(storage());
  if (snapshot) {
    snapshot = { ...snapshot, draft: emptyDraft() };
    emit();
  }
}
