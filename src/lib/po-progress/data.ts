import roster from "@/config/sample-roster.json";
import { CATEGORIES } from "@/config/categories";
import { POS } from "@/lib/portal/sample";

export type Status = "BELOW STANDARD" | "EMERGING CONCERN" | "MEETS STANDARD";
export type Week =
  | { w: number; kind: "future" }
  | { w: number; kind: "limbo"; worked: number }
  | {
      w: number;
      kind: "rated";
      ph: number;
      lim: number;
      rated: number;
      A: number;
      UA: number;
      RT: number;
      NO: number;
      nrt: number;
      uaByCat: Record<number, number>;
      late: boolean;
    };

export type PhaseStats = {
  A: number;
  UA: number;
  RT: number;
  NO: number;
  nrt: number;
  late: number;
  rated: number;
  uaPct: number;
  aPct: number;
  /** PO-SCORE-1 phase score, 0-100. */
  score: number;
};

export type ProgressPO = {
  k: number;
  name: string;
  badge: string;
  fto: string;
  ftob: string;
  sched: string;
  weeks: Week[];
  phaseUA: Record<number, Record<number, number>>;
  nrtCats: number[];
  phases: (PhaseStats | null)[];
  status: Status;
  delta: number;
  above: boolean;
  trend: number;
  /** Week the flag cleared when the PO was flagged earlier and is now MEETS STANDARD. */
  clearedWeek: number | null;
  calc: CalcRow[];
};

const NOTE = "Based on documented ratings; not a release recommendation.";
export const FORMULA_VERSION = "PO-STD-1 · November 25, 2026";
export const SCORE_VERSION = "PO-SCORE-1 · November 26, 2026";
/** Advisory score (owner decision, November 26, 2026); applies to weeks rated on or after that date and is never applied retroactively. */
export const NRT_UA_WEIGHT = 20;
export const NRT_PHASE_CAP = 60;

/** Deficiency units for one rated week: each NRT replaces its paired UA and counts as 20 UA's. */
export function weekUnits(x: { UA: number; nrt: number }): number {
  return Math.max(0, x.UA - x.nrt) + NRT_UA_WEIGHT * x.nrt;
}

/** 100% less 2 points per unit through 20 units, then 1 point per unit, reaching 0% at 80 units. */
export function unitScore(units: number): number {
  return units <= 20 ? 100 - 2 * units : Math.max(0, 60 - (units - 20));
}

export const weekScore = (x: { UA: number; nrt: number }) => unitScore(weekUnits(x));

/** Phase score: average of rated week scores to one decimal; held to 60% or lower when the phase has an NRT. Limbo weeks are excluded. */
export function phaseScore(ws: { UA: number; nrt: number }[]): number | null {
  if (!ws.length) return null;
  const avg = Math.round((ws.reduce((a, x) => a + weekScore(x), 0) / ws.length) * 10) / 10;
  return ws.some((x) => x.nrt > 0) ? Math.min(avg, NRT_PHASE_CAP) : avg;
}
export const STATUS_RULE: Record<Status, string> = {
  "BELOW STANDARD": `A rated week with 20 or more UA's, 3 or more UA's in one category, or an NRT. Steps down one level after a rated week that meets standard. ${NOTE}`,
  "EMERGING CONCERN": `A rated week with 10-19 UA's. Clears after a rated week that meets standard. ${NOTE}`,
  "MEETS STANDARD": `Rated weeks with 0-9 UA's, fewer than 3 in any one category and no NRT. ${NOTE}`,
};

type RatedWeek = Extract<Week, { kind: "rated" }>;
const LEVELS: Status[] = ["MEETS STANDARD", "EMERGING CONCERN", "BELOW STANDARD"];

export type CalcRow = {
  w: number;
  ph: number;
  days: number;
  UA: number;
  topCat: number | null;
  topCatUA: number;
  nrt: number;
  units: number;
  score: number;
  band: Status;
  reason: string;
  status: Status;
};

/** Band for one rated week under the program standard. */
export function weekBand(x: RatedWeek): { level: 0 | 1 | 2; reason: string; topCat: number | null; topCatUA: number } {
  let topCat: number | null = null, topCatUA = 0;
  for (const c in x.uaByCat) if (x.uaByCat[+c] > topCatUA) { topCat = +c; topCatUA = x.uaByCat[+c]; }
  if (x.nrt > 0) return { level: 2, reason: "NRT", topCat, topCatUA };
  if (topCatUA >= 3) return { level: 2, reason: "3+ UA's in one category", topCat, topCatUA };
  if (x.UA >= 20) return { level: 2, reason: "20+ UA's", topCat, topCatUA };
  if (x.UA >= 10) return { level: 1, reason: "10-19 UA's", topCat, topCatUA };
  return { level: 0, reason: "0-9 UA's", topCat, topCatUA };
}

/**
 * Program standard (owner decision, set 28). Each rated week is banded:
 * MEETS STANDARD 0-9 UA's; EMERGING CONCERN 10-19; BELOW STANDARD 20+, 3+ UA's in one category, or an NRT.
 * A worse week raises the status to that band. Each rated week that meets standard lowers it one level.
 * Limbo weeks are not rated and do not count. Late packets never affect a PO's status.
 */
export function evaluateStandard(weeks: Week[]): { status: Status; clearedWeek: number | null; calc: CalcRow[] } {
  let level = 0;
  let flagged = false;
  let clearedWeek: number | null = null;
  const calc: CalcRow[] = [];
  for (const x of weeks) {
    if (x.kind !== "rated") continue;
    const b = weekBand(x);
    if (b.level > level) { level = b.level; flagged = true; }
    else if (b.level === 0 && level > 0 && --level === 0) clearedWeek = x.w;
    calc.push({ w: x.w, ph: x.ph, days: x.rated, UA: x.UA, topCat: b.topCat, topCatUA: b.topCatUA, nrt: x.nrt, units: weekUnits(x), score: weekScore(x), band: LEVELS[b.level], reason: b.reason, status: LEVELS[level] });
  }
  return { status: LEVELS[level], clearedWeek: level === 0 && flagged ? clearedWeek : null, calc };
}


export const WEEKS = 15;
export const CURRENT_WEEK = 14;
export const PHASE_LABEL = ["I", "II", "III", "IV"] as const;
export const PHASE_WEEKS: Record<number, number[]> = { 1: [1, 2, 3, 4], 2: [5, 6, 7, 8], 3: [9, 10, 11, 12], 4: [13, 14, 15] };
export const phaseOf = (w: number) => (w <= 4 ? 1 : w <= 8 ? 2 : w <= 12 ? 3 : 4);
export const CURRENT_PHASE = phaseOf(CURRENT_WEEK);
const limboDays = (w: number) => (w === 1 ? 99 : w === 5 ? 2 : w === 9 || w === 13 ? 1 : 0);

type Profile = "strong" | "steady" | "improving" | "declining" | "frequent";
const PROFILES: Profile[] = ["strong", "strong", "steady", "steady", "steady", "improving", "improving", "declining", "frequent", "steady"];

function build() {
  let seed = 135;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const catW = CATEGORIES.map((_, i) => [0.02, 0.05, 0.04, 0.03][i % 4] + (i === 14 || i === 13 ? 0.05 : 0) + (i === 10 ? 0.03 : 0));

  // Names and badges come from the portal roster so a PO opens the same person everywhere.
  const cls = POS.filter((x) => x.cls === "Class 135");
  const raw = roster.map((r, k) => {
    const p = { ...r, name: cls[k]?.name ?? r.name, badge: cls[k]?.badge ?? r.badge };
    const prof: Profile =
      k === 3 || k === 17 || k === 29 ? "frequent" : k === 8 || k === 22 ? "declining" : PROFILES[Math.floor(rnd() * PROFILES.length)];
    const days = p.sched === "4x10" ? 4 : 5;
    const weeks: Week[] = [];
    const phaseUA: Record<number, Record<number, number>> = {};
    const nrtCats = new Set<number>();
    for (let w = 1; w <= WEEKS; w++) {
      if (w > CURRENT_WEEK) {
        weeks.push({ w, kind: "future" });
        continue;
      }
      const ph = phaseOf(w);
      const lim = Math.min(days, limboDays(w));
      const rated = days - lim;
      if (rated <= 0) {
        weeks.push({ w, kind: "limbo", worked: days });
        continue;
      }
      const f = { strong: 0.7, steady: 1.1, improving: Math.max(0.6, 2.2 - 0.12 * w), declining: 0.7 + 0.12 * w, frequent: 2.2 + 0.08 * w }[prof];
      let A = 0, UA = 0, RT = 0, NO = 0, nrt = 0;
      const uaByCat: Record<number, number> = {};
      for (let d = 0; d < rated; d++)
        for (let c = 0; c < CATEGORIES.length; c++) {
          const r = rnd();
          if (r < 0.12) { NO++; continue; }
          if (r < 0.12 + catW[c] * f * 0.24) { UA++; uaByCat[c] = (uaByCat[c] || 0) + 1; }
          else if (r < 0.12 + catW[c] * f * 0.24 + 0.03) RT++;
          else A++;
        }
      phaseUA[ph] = phaseUA[ph] || {};
      for (const c in uaByCat) {
        const before = phaseUA[ph][c] || 0;
        phaseUA[ph][c] = before + uaByCat[c];
        if (before < 5 && before + uaByCat[c] >= 5 && (prof === "frequent" || prof === "declining")) { nrt++; nrtCats.add(+c); }
      }
      const late = rnd() < 0.04;
      if (prof === "frequent" && ((k === 3 && w === 14) || (k === 29 && w === 13))) nrt++;
      weeks.push({ w, kind: "rated", ph, lim, rated, A, UA, RT, NO, nrt, uaByCat, late });
    }
    return { ...p, k, weeks, phaseUA, nrtCats: [...nrtCats] };
  });

  const stats = (po: (typeof raw)[number], ph: number): PhaseStats | null => {
    const ws = po.weeks.filter((x): x is Extract<Week, { kind: "rated" }> => x.kind === "rated" && x.ph === ph);
    if (!ws.length) return null;
    const s = { A: 0, UA: 0, RT: 0, NO: 0, nrt: 0, late: 0, rated: 0 };
    ws.forEach((x) => { s.A += x.A; s.UA += x.UA; s.RT += x.RT; s.NO += x.NO; s.nrt += x.nrt; s.late += x.late ? 1 : 0; s.rated += x.rated; });
    const base = s.A + s.RT + s.UA;
    return { ...s, uaPct: s.UA / base, aPct: s.A / base, score: phaseScore(ws)! };
  };

  const classPhase: ({ uaPct: number; aPct: number } | null)[] = [1, 2, 3, 4].map((ph) => {
    let A = 0, UA = 0, RT = 0, n = 0;
    raw.forEach((p) => { const s = stats(p, ph); if (s) { A += s.A; UA += s.UA; RT += s.RT; n++; } });
    return n ? { uaPct: UA / (A + RT + UA), aPct: A / (A + RT + UA) } : null;
  });
  const classWeek: (number | null)[] = Array.from({ length: WEEKS }, (_, i) => {
    let A = 0, UA = 0, RT = 0;
    raw.forEach((p) => { const x = p.weeks[i]; if (x.kind === "rated") { A += x.A; UA += x.UA; RT += x.RT; } });
    return A + UA + RT ? UA / (A + UA + RT) : null;
  });

  const pos: ProgressPO[] = raw.map((p) => {
    const phases = [1, 2, 3, 4].map((ph) => stats(p, ph));
    const cur = phases[CURRENT_PHASE - 1]!;
    const prev = phases[CURRENT_PHASE - 2];
    const { status, clearedWeek, calc } = evaluateStandard(p.weeks);
    const delta = cur.uaPct - classPhase[CURRENT_PHASE - 1]!.uaPct;
    return { ...p, phases, status, clearedWeek, calc, delta, above: delta > 0, trend: prev ? cur.uaPct - prev.uaPct : 0 };
  });
  const sev = (p: ProgressPO) => (p.status === "BELOW STANDARD" ? 300 : p.status === "EMERGING CONCERN" ? 200 : 100) + (p.above ? 50 : 0) + p.delta * 100;
  pos.sort((a, b) => sev(b) - sev(a));
  return { pos, classPhase, classWeek };
}

export const PROGRESS = build();

export const pct = (v: number | null | undefined) => (v == null ? "–" : `${(v * 100).toFixed(1)}%`);
export const scorePct = (v: number | null | undefined) => (v == null ? "–" : `${Number.isInteger(v) ? v : v.toFixed(1)}%`);

// Preview sample group; the server roster supplies each Coordinator group after integration.
export const inSampleGroup = (p: { k: number }) => p.k % 2 === 0;
