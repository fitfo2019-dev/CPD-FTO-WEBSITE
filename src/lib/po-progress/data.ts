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
      /** Rated hours: scheduled shift length × rated days, editable on the Daily Performance Summary. */
      hours: number;
      hoursEdited: boolean;
      A: number;
      UA: number;
      RT: number;
      NO: number;
      nrt: number;
      uaByCat: Record<number, number>;
      /** UA's keyed by specific task ("category.task"); narrative-only categories use the FTO's "same issue" link. */
      uaByTask: Record<string, number>;
      late: boolean;
      /** Status and score use signed Daily Performance Summaries only. */
      signed: boolean;
      /** Sunday of the rated week (YYYY-MM-DD). */
      ratedOn: string;
      /** The FTO Office recorded the NRT meeting outcome this week. */
      meeting: boolean;
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
  /** PO-SCORE-2 phase score, 0-100; null when no signed week is scored. */
  score: number | null;
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

const NOTE = "Based on signed Daily Performance Summaries; not a release recommendation.";
/** Prior standard; still applies to weeks rated before RULES_EFFECTIVE (never retroactive). */
export const STD1_VERSION = "PO-STD-1 · November 25, 2026";
export const FORMULA_VERSION = "PO-STD-2 · November 26, 2026";
export const SCORE_VERSION = "PO-SCORE-2 · November 26, 2026";
/** PO-STD-2 and PO-SCORE-2 apply to weeks rated on or after this date. */
export const RULES_EFFECTIVE = "2026-11-26";
export const NRT_UA_WEIGHT = 20;
export const NRT_PHASE_CAP = 60;
export const EMERGING_CAP = 80;
export const FULL_WEEK_HOURS = 40;
/** Weekly total UA's per 40 rated hours by phase: [Emerging Concern at, Below Standard at]. Owner decisions, November 26, 2026. */
export const WEEKLY_TOTALS: Record<number, [number, number]> = { 1: [12, 24], 2: [10, 20], 3: [8, 16], 4: [5, 10] };
/** UA's in one category within a phase: [Emerging Concern at, Below Standard at]; resets each phase. */
export const CATEGORY_PHASE: [number, number] = [10, 15];
/** UA's on the same specific task within one rated week that make the week Below Standard. */
export const SAME_TASK_WEEK = 3;

export const round1 = (v: number) => Math.round(v * 10 + Number.EPSILON * 10) / 10;
export const shiftHours = (sched: string) => (sched === "4x10" ? 10 : 8);
const inEffect = (ratedOn: string) => ratedOn >= RULES_EFFECTIVE;

/** Deficiency units for one rated week: each NRT replaces its paired UA and counts as 20 UA's. */
export function weekUnits(x: { UA: number; nrt: number }): number {
  return Math.max(0, x.UA - x.nrt) + NRT_UA_WEIGHT * x.nrt;
}

/** Units scaled to a 40-hour week, to one decimal, so short weeks and both schedules are counted alike. */
export const perForty = (units: number, hours: number) => (hours > 0 ? round1((units * FULL_WEEK_HOURS) / hours) : 0);

/** 100% less 2 points per unit through 20 units, then 1 point per unit, reaching 0% at 80 units. */
export function unitScore(units: number): number {
  return round1(units <= 20 ? 100 - 2 * units : Math.max(0, 60 - (units - 20)));
}

const LEVELS: Status[] = ["MEETS STANDARD", "EMERGING CONCERN", "BELOW STANDARD"];
const CAP = [100, EMERGING_CAP, NRT_PHASE_CAP];

/** Week score: per-40-hour units on the UA scale, held to the cap for the week's Status After. */
export function weekScore(x: { UA: number; nrt: number; hours: number }, status: Status = "MEETS STANDARD"): number {
  return Math.min(unitScore(perForty(weekUnits(x), x.hours)), CAP[LEVELS.indexOf(status)]);
}

/** Phase score: average of scored weeks to one decimal, held to 60% with an NRT or 15+ in one category, 80% with 10-14. */
export function phaseScore(scores: number[], phase: { nrt: number; catMax: number }): number | null {
  if (!scores.length) return null;
  const avg = round1(scores.reduce((a, v) => a + v, 0) / scores.length);
  const cap = phase.nrt > 0 || phase.catMax >= CATEGORY_PHASE[1] ? NRT_PHASE_CAP : phase.catMax >= CATEGORY_PHASE[0] ? EMERGING_CAP : 100;
  return Math.min(avg, cap);
}

export const STATUS_RULE: Record<Status, string> = {
  "BELOW STANDARD": `A rated week at or over the phase limit (Phase I 24, II 20, III 16, IV 10 UA's per 40 rated hours), 3 or more UA's on the same task in a week, 15 or more UA's in one category this phase, or an NRT until the FTO Office records the NRT meeting outcome. ${NOTE}`,
  "EMERGING CONCERN": `A rated week at or over the phase line (Phase I 12, II 10, III 8, IV 5 UA's per 40 rated hours), or 10-14 UA's in one category this phase. ${NOTE}`,
  "MEETS STANDARD": `Under every line, with no NRT awaiting its meeting outcome. ${NOTE}`,
};

type RatedWeek = Extract<Week, { kind: "rated" }>;

export type CalcRow = {
  w: number;
  ph: number;
  days: number;
  hours: number;
  hoursEdited: boolean;
  UA: number;
  topTaskUA: number;
  topCat: number | null;
  topCatUA: number;
  /** Most UA's in one category so far this phase. */
  phaseCat: number | null;
  phaseCatUA: number;
  nrt: number;
  units: number;
  perForty: number | null;
  score: number | null;
  /** Why a week has no score. */
  scoreNote: "PENDING SIGNATURE" | "BEFORE PO-SCORE-2" | null;
  band: Status;
  reason: string;
  /** Holds that kept the status above the weekly result. */
  holds: string[];
  status: Status;
  version: string;
};

const maxEntry = (m: Record<string | number, number>) => {
  let k: string | null = null, v = 0;
  for (const c in m) if (m[c] > v) { k = c; v = m[c]; }
  return { k, v };
};

/** Weekly result for one rated week under the standard in effect that week. */
export function weekBand(x: RatedWeek): { level: 0 | 1 | 2; reason: string; topCat: number | null; topCatUA: number; topTaskUA: number } {
  const c = maxEntry(x.uaByCat), t = maxEntry(x.uaByTask);
  const topCat = c.k == null ? null : +c.k, topCatUA = c.v, topTaskUA = t.v;
  const r = (level: 0 | 1 | 2, reason: string) => ({ level, reason, topCat, topCatUA, topTaskUA });
  if (!inEffect(x.ratedOn)) {
    if (x.nrt > 0) return r(2, "NRT");
    if (topCatUA >= 3) return r(2, "3+ UA's in one category");
    if (x.UA >= 20) return r(2, "20+ UA's");
    if (x.UA >= 10) return r(1, "10-19 UA's");
    return r(0, "0-9 UA's");
  }
  const [em, below] = WEEKLY_TOTALS[x.ph];
  const ua40 = perForty(x.UA, x.hours);
  if (x.nrt > 0) return r(2, "NRT");
  if (topTaskUA >= SAME_TASK_WEEK) return r(2, "3+ UA's on the same task");
  if (ua40 >= below) return r(2, `${below}+ UA's per 40 hours`);
  if (ua40 >= em) return r(1, `${em}-${below - 1} UA's per 40 hours`);
  return r(0, `Under ${em} UA's per 40 hours`);
}

/**
 * Program standard PO-STD-2 (owner decisions, November 26, 2026). Status after each signed rated week is the highest of:
 * the weekly rule (a worse week raises it; each week that meets standard lowers it one level),
 * the category rule for the current phase (10-14 UA's in one category Emerging Concern, 15+ Below Standard; resets each phase),
 * and the NRT hold (Below Standard from an NRT until the FTO Office records the NRT meeting outcome).
 * Limbo weeks and unsigned weeks do not count. Late packets never affect status. Weeks before RULES_EFFECTIVE use PO-STD-1.
 */
export function evaluateStandard(weeks: Week[]): { status: Status; clearedWeek: number | null; calc: CalcRow[] } {
  let weekly = 0, level = 0, flagged = false, clearedWeek: number | null = null, nrtHold = false, ph = 0;
  let cat: Record<number, number> = {};
  const calc: CalcRow[] = [];
  for (const x of weeks) {
    if (x.kind !== "rated") continue;
    if (x.ph !== ph) { ph = x.ph; cat = {}; }
    const b = weekBand(x);
    const std2 = inEffect(x.ratedOn);
    const row = { w: x.w, ph: x.ph, days: x.rated, hours: x.hours, hoursEdited: x.hoursEdited, UA: x.UA, topTaskUA: b.topTaskUA, topCat: b.topCat, topCatUA: b.topCatUA, nrt: x.nrt, units: weekUnits(x), band: LEVELS[b.level], reason: b.reason, version: std2 ? FORMULA_VERSION : STD1_VERSION };
    if (!x.signed) {
      const pc = maxEntry(cat);
      calc.push({ ...row, phaseCat: pc.k == null ? null : +pc.k, phaseCatUA: pc.v, perForty: null, score: null, scoreNote: "PENDING SIGNATURE", holds: [], status: LEVELS[level] });
      continue;
    }
    if (b.level > weekly) weekly = b.level;
    else if (b.level === 0 && weekly > 0) weekly--;
    let catLevel = 0;
    if (std2) {
      for (const c in x.uaByCat) cat[+c] = (cat[+c] || 0) + x.uaByCat[+c];
      if (x.nrt > 0) nrtHold = true;
      if (x.meeting) nrtHold = false;
    }
    const pc = maxEntry(cat);
    if (std2) catLevel = pc.v >= CATEGORY_PHASE[1] ? 2 : pc.v >= CATEGORY_PHASE[0] ? 1 : 0;
    const holds: string[] = [];
    if (catLevel > weekly) holds.push(`${pc.v} UA's in one category this phase`);
    if (nrtHold && weekly < 2) holds.push("NRT meeting outcome not yet recorded");
    const next = Math.max(weekly, catLevel, nrtHold ? 2 : 0);
    if (next > 0) flagged = true;
    if (next === 0 && level > 0) clearedWeek = x.w;
    level = next;
    const status = LEVELS[level];
    calc.push({
      ...row,
      phaseCat: pc.k == null ? null : +pc.k,
      phaseCatUA: pc.v,
      perForty: std2 ? perForty(row.units, x.hours) : null,
      score: std2 ? weekScore(x, status) : null,
      scoreNote: std2 ? null : "BEFORE PO-SCORE-2",
      holds,
      status,
    });
  }
  return { status: LEVELS[level], clearedWeek: level === 0 && flagged ? clearedWeek : null, calc };
}

export type PhaseSummary = { ph: number; weeks: number; avg: number | null; score: number | null; capReason: string | null };

/** Phase score lines for Show Calculation: average of scored weeks, then any phase cap and its reason. */
export function phaseSummaries(calc: CalcRow[]): PhaseSummary[] {
  return [1, 2, 3, 4].map((ph) => {
    const rows = calc.filter((r) => r.ph === ph && r.scoreNote !== "PENDING SIGNATURE");
    const scored = rows.filter((r) => r.score != null).map((r) => r.score!);
    const std2 = rows.filter((r) => r.version === FORMULA_VERSION);
    const nrt = std2.reduce((a, r) => a + r.nrt, 0);
    const catMax = std2.reduce((a, r) => Math.max(a, r.phaseCatUA), 0);
    const score = phaseScore(scored, { nrt, catMax });
    const avg = scored.length ? round1(scored.reduce((a, v) => a + v, 0) / scored.length) : null;
    const capReason = score != null && avg != null && score < avg ? (nrt > 0 ? "NRT this phase" : `${catMax} UA's in one category`) : null;
    return { ph, weeks: scored.length, avg, score, capReason };
  });
}

/** Phase scores from the calculation rows. */
export const phaseScores = (calc: CalcRow[]) => phaseSummaries(calc).map((x) => x.score);

export const WEEKS = 15;
export const CURRENT_WEEK = 14;
export const PHASE_LABEL = ["I", "II", "III", "IV"] as const;
export const PHASE_WEEKS: Record<number, number[]> = { 1: [1, 2, 3, 4], 2: [5, 6, 7, 8], 3: [9, 10, 11, 12], 4: [13, 14, 15] };
export const phaseOf = (w: number) => (w <= 4 ? 1 : w <= 8 ? 2 : w <= 12 ? 3 : 4);
export const CURRENT_PHASE = phaseOf(CURRENT_WEEK);
/** Sample class: Week 1 starts Sunday, November 29, 2026, after the PO-STD-2 effective date. */
const sampleSunday = (w: number) => new Date(Date.UTC(2026, 10, 29 + 7 * (w - 1))).toISOString().slice(0, 10);
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
    const phaseTask: Record<string, number> = {};
    const nrtCats = new Set<number>();
    let nrtPending: boolean = false;
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
      const uaByTask: Record<string, number> = {};
      for (let d = 0; d < rated; d++)
        for (let c = 0; c < CATEGORIES.length; c++) {
          const r = rnd();
          if (r < 0.12) { NO++; continue; }
          if (r < 0.12 + catW[c] * f * 0.24) {
            UA++;
            uaByCat[c] = (uaByCat[c] || 0) + 1;
            const t = rnd(), key = `${c}.${t < 0.45 ? 0 : t < 0.75 ? 1 : t < 0.9 ? 2 : 3}`;
            uaByTask[key] = (uaByTask[key] || 0) + 1;
            // Sample: the 3rd UA on the same task this phase, both earlier ones retrained, becomes an NRT (PO-NRT-1).
            const pk = `${ph}:${key}`;
            phaseTask[pk] = (phaseTask[pk] || 0) + 1;
            if (phaseTask[pk] === 3 && (prof === "frequent" || prof === "declining")) { nrt++; nrtCats.add(c); }
          }
          else if (r < 0.12 + catW[c] * f * 0.24 + 0.03) RT++;
          else A++;
        }
      if (prof === "frequent" && ((k === 3 && w === 14) || (k === 29 && w === 13))) {
        // Sample NRT: the same Content Accuracy task failed on three runs, retrained after the first two (PO-NRT-1).
        const c = 14, key = `${c}.0`;
        A = Math.max(0, A - 3); UA += 3; uaByCat[c] = (uaByCat[c] || 0) + 3; uaByTask[key] = (uaByTask[key] || 0) + 3; nrt++; nrtCats.add(c);
      }
      phaseUA[ph] = phaseUA[ph] || {};
      for (const c in uaByCat) phaseUA[ph][c] = (phaseUA[ph][c] || 0) + uaByCat[c];
      const late = rnd() < 0.04;
      // Sample: the FTO Office records the NRT meeting outcome the rated week after an NRT.
      const meeting: boolean = nrtPending && !nrt;
      nrtPending = nrt > 0 || (nrtPending && !meeting);
      const signed = !(w === CURRENT_WEEK && k % 7 === 0);
      weeks.push({ w, kind: "rated", ph, lim, rated, hours: rated * shiftHours(p.sched), hoursEdited: false, A, UA, RT, NO, nrt, uaByCat, uaByTask, late, signed, ratedOn: sampleSunday(w), meeting });
    }
    return { ...p, k, weeks, phaseUA, nrtCats: [...nrtCats] };
  });

  const stats = (po: (typeof raw)[number], ph: number): PhaseStats | null => {
    const ws = po.weeks.filter((x): x is Extract<Week, { kind: "rated" }> => x.kind === "rated" && x.ph === ph);
    if (!ws.length) return null;
    const s = { A: 0, UA: 0, RT: 0, NO: 0, nrt: 0, late: 0, rated: 0 };
    ws.forEach((x) => { s.A += x.A; s.UA += x.UA; s.RT += x.RT; s.NO += x.NO; s.nrt += x.nrt; s.late += x.late ? 1 : 0; s.rated += x.rated; });
    const base = s.A + s.RT + s.UA;
    return { ...s, uaPct: s.UA / base, aPct: s.A / base, score: null };
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
    const { status, clearedWeek, calc } = evaluateStandard(p.weeks);
    const scores = phaseScores(calc);
    const phases = [1, 2, 3, 4].map((ph) => { const st = stats(p, ph); return st && { ...st, score: scores[ph - 1] }; });
    const cur = phases[CURRENT_PHASE - 1]!;
    const prev = phases[CURRENT_PHASE - 2];
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
