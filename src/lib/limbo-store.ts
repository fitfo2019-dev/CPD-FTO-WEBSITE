"use client";

import { useSyncExternalStore } from "react";

export type LimboState = "locked" | "pending" | "approved" | "denied";
export type LimboRequest = {
  state: LimboState;
  reason: string;
  why: string;
  requestedAt?: string;
  coordNote?: string;
  decidedAt?: string;
};

export const LIMBO_REASONS = [
  "Directed by FTO Coordinator",
  "Phase start date entered wrong",
  "Critical safety incident that must be documented",
  "Other",
] as const;

export const LIMBO_DAY = {
  po: "Bianca R. Delgado · 4133",
  fto: "Renee L. Sutter · 1590",
  date: "Sun, Oct 4, 2026",
  phaseWeek: "Phase II · Week 5",
  tour: "Day 1",
  span: "Phase II · Limbo Days 1–2 of Week 5",
  dayOf: "Limbo Day 1 of 2",
} as const;

const KEY = "cpd-fto.limbo.4133.2026-10-04";
const EMPTY: LimboRequest = { state: "locked", reason: "", why: "" };
const listeners = new Set<() => void>();
let cache: LimboRequest | null = null;

function read(): LimboRequest {
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...EMPTY, ...(JSON.parse(raw) as LimboRequest) } : EMPTY;
  } catch {
    cache = EMPTY;
  }
  return cache;
}

function write(next: LimboRequest) {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable: keep in memory */
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", onStorage);
  };
}

export function useLimbo() {
  const s = useSyncExternalStore(subscribe, read, () => EMPTY);
  return {
    ...s,
    request: (reason: string, why: string) => write({ state: "pending", reason, why, requestedAt: new Date().toISOString() }),
    approve: (coordNote: string) => write({ ...read(), state: "approved", coordNote, decidedAt: new Date().toISOString() }),
    deny: (coordNote: string) => write({ ...read(), state: "denied", coordNote, decidedAt: new Date().toISOString() }),
  };
}
