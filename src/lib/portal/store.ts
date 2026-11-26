"use client";

import { useSyncExternalStore } from "react";
import { CLASSES, DEFAULT_WEEKS, FORMS, FTOS, FTO_BY, ME, POS, PO_BY, TODAY, rnd, shuffleSeeded } from "./sample";

export type PhaseStatus = "Draft" | "Active";
export type Setup = { start: string; phases: number[] };
export type Extension = { po: string; phase: number; days: number; reason: string; added: string };
export type ReturnInfo = { tags: string[]; note: string; at: string };
export type Packet = {
  id: string;
  po: string;
  fto: string;
  date: string;
  phase: number;
  forms: string[];
  status: "local_draft_pending" | "submitted_complete";
  reviewedAt?: string;
  returned?: ReturnInfo;
};
export type Coverage = { id: string; po: string; req: string; date: string; by: string };
export type Profile = { name: string; badge: string; email: string; phone: string; pct?: string; watch?: string };

export type PortalState = {
  setups: Record<string, Setup>;
  phs: Record<string, PhaseStatus[]>;
  asg: Record<string, string>;
  signups: Record<string, string[]>;
  ran: Record<string, boolean>;
  wd: string[];
  ext: Extension[];
  packets: Packet[];
  cov: Coverage[];
  coord: Profile;
  me: Profile;
};

/* ---------- dates ---------- */
export const D = (s: string) => new Date(s + "T00:00");
export const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const addDays = (d: Date, n: number) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
export const isSun = (v: string) => !!v && D(v).getDay() === 0;
export const fmt = (d?: Date | null) => (d ? d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—");
export const fmtS = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
export const fmtW = (d: Date) => d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
export const today = D(TODAY);
export type Range = { s: Date; e: Date };
const overlap = (a?: Range | null, b?: Range | null) => !!a && !!b && a.s <= b.e && b.s <= a.e;
export const key = (po: string, i: number) => `${po}|${i}`;
export const skey = (c: string, i: number) => `${c}|${i}`;

/* ---------- derived (cached per state object) ---------- */
type Assignment = { po: string; i: number; fto: string; r: Range | null; cls: string };
type Derived = { ranges: Record<string, (Range | null)[] | null>; byF: Record<string, Assignment[]> };
const cache = new WeakMap<PortalState, Derived>();

export const extDays = (s: PortalState, po: string, i: number) => s.ext.filter((e) => e.po === po && e.phase === i).reduce((a, e) => a + e.days, 0);

function computeRanges(s: PortalState, po: string): (Range | null)[] | null {
  const p = PO_BY[po];
  const st = s.setups[p.cls];
  if (!st || !isSun(st.start)) return null;
  let cur = D(st.start);
  return st.phases.map((w, i) => {
    if (!(w > 0)) return null;
    const len = w * 7 + extDays(s, po, i);
    const r = { s: new Date(cur), e: addDays(cur, len - 1) };
    cur = addDays(cur, len);
    return r;
  });
}

function derived(s: PortalState): Derived {
  let d = cache.get(s);
  if (d) return d;
  const ranges: Derived["ranges"] = {};
  for (const p of POS) ranges[p.badge] = computeRanges(s, p.badge);
  const byF: Derived["byF"] = {};
  for (const [k, f] of Object.entries(s.asg)) {
    if (!f) continue;
    const [po, i] = k.split("|");
    (byF[f] ||= []).push({ po, i: +i, fto: f, r: (ranges[po] || [])[+i] ?? null, cls: PO_BY[po].cls });
  }
  d = { ranges, byF };
  cache.set(s, d);
  return d;
}

export const ranges = (s: PortalState, po: string) => derived(s).ranges[po];
export const rosterOf = (cls: string) => POS.filter((p) => p.cls === cls);
export const signed = (s: PortalState, c: string, i: number) => s.signups[skey(c, i)] || [];

export function phaseRange(s: PortalState, c: string, i: number): Range | null {
  const st = s.setups[c];
  if (!st || !isSun(st.start)) return null;
  let cur = D(st.start);
  for (let j = 0; j <= i; j++) {
    const r = { s: new Date(cur), e: addDays(cur, st.phases[j] * 7 - 1) };
    if (j === i) return r;
    cur = addDays(cur, st.phases[j] * 7);
  }
  return null;
}

export function busy(s: PortalState, po: string, i: number, fto: string) {
  const r = (ranges(s, po) || [])[i];
  if (!r) return false;
  const cls = PO_BY[po].cls;
  return (derived(s).byF[fto] || []).some((a) => !(a.po === po && a.i === i) && ((a.po !== po && a.i === i && a.cls === cls) || overlap(a.r, r)));
}

export const conflicts = (s: PortalState) => Object.values(derived(s).byF).flat().filter((a) => busy(s, a.po, a.i, a.fto));

export function isRepeat(s: PortalState, po: string, i: number) {
  const v = s.asg[key(po, i)];
  if (!v) return false;
  const st = s.setups[PO_BY[po].cls];
  return !!st && st.phases.some((_, j) => j !== i && s.asg[key(po, j)] === v);
}

export function phaseOn(s: PortalState, po: string, d: Date) {
  return (ranges(s, po) || []).findIndex((x) => !!x && x.s <= d && d <= x.e);
}
export function curFto(s: PortalState, po: string, d: Date) {
  const i = phaseOn(s, po, d);
  return i < 0 ? null : { i, fto: s.asg[key(po, i)] || "" };
}
export function myPoOn(s: PortalState, fto: string, d: Date) {
  return POS.find((p) => curFto(s, p.badge, d)?.fto === fto) || null;
}

/* ---------- Rested First ordering ---------- */
function fairnessOrder(s: PortalState, c: string, i: number, pool: string[]) {
  const r = phaseRange(s, c, i);
  if (!r) return [...pool];
  const start = r.s.getTime();
  const year = r.s.getFullYear();
  const byF = derived(s).byF;
  const info = pool.map((b, idx) => {
    const f = FTO_BY[b];
    const prev = (byF[b] || []).filter((a) => a.r && a.r.e.getTime() < start && !(a.cls === c && a.i === i));
    let last = f.priorLastEnd ? D(f.priorLastEnd).getTime() : -Infinity;
    for (const a of prev) last = Math.max(last, a.r!.e.getTime());
    const count = f.priorPhases + prev.filter((a) => a.r!.e.getFullYear() === year).length;
    const backToBack = start - last <= 7 * 864e5;
    return { b, senior: f.senior, backToBack, gap: start - last, count, idx };
  });
  info.sort(
    (a, b) =>
      (i === 3 ? Number(b.senior) - Number(a.senior) : 0) ||
      Number(a.backToBack) - Number(b.backToBack) ||
      b.gap - a.gap ||
      a.count - b.count ||
      a.idx - b.idx,
  );
  return info.map((x) => x.b);
}

export function runAutoAssign(s: PortalState, c: string, scope: number[], mode: "empty" | "all", order: string[]) {
  const asg = { ...s.asg };
  if (mode === "all") scope.forEach((i) => order.forEach((po) => delete asg[key(po, i)]));
  let work: PortalState = { ...s, asg };
  let placed = 0;
  let left = 0;
  const ran = { ...s.ran };
  const phases = s.setups[c].phases;
  for (const i of scope) {
    const ranked = fairnessOrder(work, c, i, signed(work, c, i));
    for (const po of order) {
      if (work.asg[key(po, i)]) continue;
      const had = new Set(phases.map((_, j) => (j !== i ? work.asg[key(po, j)] : "")).filter(Boolean));
      const f = ranked.find((b) => !had.has(b) && !busy(work, po, i, b));
      if (f) {
        work = { ...work, asg: { ...work.asg, [key(po, i)]: f } };
        placed++;
      } else left++;
    }
    ran[skey(c, i)] = true;
  }
  return { next: { ...work, ran }, placed, left };
}

export type FtoStatus = { kind: "confirmed"; po: string } | { kind: "waitlisted"; n: number } | { kind: "pending" };
export function ftoStatus(s: PortalState, c: string, i: number, fto: string): FtoStatus {
  const po = rosterOf(c).find((p) => s.asg[key(p.badge, i)] === fto);
  const active = (s.phs[c] || [])[i] === "Active";
  if (!active) return { kind: "pending" };
  if (po) return { kind: "confirmed", po: po.badge };
  if (!s.ran[skey(c, i)]) return { kind: "pending" };
  const taken = new Set(rosterOf(c).map((p) => s.asg[key(p.badge, i)]).filter(Boolean));
  const list = fairnessOrder(s, c, i, signed(s, c, i)).filter((b) => !taken.has(b));
  const n = list.indexOf(fto);
  return n < 0 ? { kind: "pending" } : { kind: "waitlisted", n: n + 1 };
}

export const pageTag = (s: PortalState, p: Packet, n: number) => {
  const r = (ranges(s, p.po) || [])[p.phase];
  const off = r ? Math.round((D(p.date).getTime() - r.s.getTime()) / 864e5) : 0;
  return `W${Math.floor(off / 7) + 1}D${(off % 7) + 1}P${n + 1}`;
};

/* ---------- seed ---------- */
function seedState(): PortalState {
  const all = FTOS.map((f) => f.badge);
  const signups: Record<string, string[]> = {};
  [92, 100, 63, 40].forEach((n, i) => (signups[skey("Class 136", i)] = shuffleSeeded(all).slice(0, n)));
  const asg: Record<string, string> = {};
  const c135 = rosterOf("Class 135");
  c135.forEach((p, k) => [0, 1, 2, 3].forEach((i) => (asg[key(p.badge, i)] = FTOS[(k + i * 20) % FTOS.length].badge)));
  [0, 1, 2, 3].forEach((i) => (signups[skey("Class 135", i)] = c135.map((p) => asg[key(p.badge, i)])));
  let s: PortalState = {
    setups: { "Class 135": { start: "2026-08-16", phases: [4, 4, 4, 3] }, "Class 136": { start: "2026-11-29", phases: [...DEFAULT_WEEKS] } },
    phs: { "Class 135": ["Active", "Active", "Active", "Active"], "Class 136": ["Draft", "Draft", "Draft", "Draft"] },
    asg,
    signups,
    ran: { "Class 135|0": true, "Class 135|1": true, "Class 135|2": true, "Class 135|3": true },
    wd: [],
    ext: [],
    packets: [],
    cov: [],
    coord: { name: "FTO Coordinator", badge: "", email: "", phone: "" },
    me: { name: FTO_BY[ME].name, badge: ME, email: "", phone: "", pct: FTO_BY[ME].pct, watch: FTO_BY[ME].watch },
  };
  const packets: Packet[] = [];
  [-3, -2, -1].forEach((off) => {
    const d = addDays(today, off);
    c135.forEach((p) => {
      if (rnd() < (off === -1 ? 0.55 : 0.35)) {
        const c = curFto(s, p.badge, d);
        if (!c || !c.fto || c.fto === ME) return;
        const runs = ["Call for Service", "Traffic Stop", "Self-Initiated Run Training", "Domestic Incident", "Arrest Process"].filter(() => rnd() < 0.35);
        packets.push({
          id: "P" + packets.length,
          po: p.badge,
          fto: c.fto,
          date: iso(d),
          phase: c.i,
          forms: ["Reporting for Duty", ...runs, "Probationary Officer Daily Performance Summary"],
          status: "submitted_complete",
          reviewedAt: off < -1 ? iso(addDays(d, 1)) : undefined,
        });
      }
    });
  });
  for (const f of FTOS) {
    f.senior = rnd() < 0.35;
    f.priorPhases = Math.floor(rnd() * 3);
    f.priorLastEnd = rnd() < 0.7 ? iso(addDays(today, -40 - Math.floor(rnd() * 200))) : null;
    const [first, ...rest] = f.name.split(" ").slice(1);
    f.email = `${first[0]}${rest.join("").replace(/[^A-Za-z]/g, "")}@example.org`;
    f.phone = `(614) 555-${String(1000 + Math.floor(rnd() * 8999)).slice(-4)}`;
  }
  FTO_BY[ME].priorPhases = 6;
  for (const i of [0, 1]) {
    const k = skey("Class 136", i);
    signups[k] = [...signups[k].filter((b) => b !== ME), ME];
  }
  const cov: Coverage[] = [];
  [1, 2, 3, 1, 2, 3, 2].forEach((off, k) => {
    const p = c135[(k * 11 + 3) % c135.length];
    const d = addDays(today, off);
    const c = curFto(s, p.badge, d);
    if (c && c.fto && c.fto !== ME) cov.push({ id: "C" + cov.length, po: p.badge, req: c.fto, date: iso(d), by: k === 2 ? FTOS[40].badge : "" });
  });
  s = { ...s, packets, cov };
  const order = rosterOf("Class 136").map((p) => p.badge);
  s = runAutoAssign(s, "Class 136", [0, 1], "empty", order).next;
  s = { ...s, phs: { ...s.phs, "Class 136": ["Active", "Active", "Draft", "Draft"] } };
  return s;
}

/* ---------- store ---------- */
const STORE_KEY = "cpd-fto.portal.v1";
const initial = seedState();
let state: PortalState = initial;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    if (raw) state = { ...initial, ...(JSON.parse(raw) as Partial<PortalState>) };
  } catch {
    state = initial;
  }
}

export function setPortal(fn: (s: PortalState) => PortalState) {
  load();
  state = fn(state);
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export function usePortal() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      if (!loaded) {
        load();
        if (state !== initial) l();
      }
      return () => listeners.delete(l);
    },
    () => state,
    () => initial,
  );
}

export { CLASSES, FORMS, FTOS, FTO_BY, ME, POS, PO_BY };
