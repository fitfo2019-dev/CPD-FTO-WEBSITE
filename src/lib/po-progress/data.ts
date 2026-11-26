import roster from "@/config/sample-roster.json";
import { CATEGORIES } from "@/config/categories";
import { POS } from "@/lib/portal/sample";

export type Status = "STRUGGLING" | "WATCH" | "ON TRACK";
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
  repeat: boolean;
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
};

export const WEEKS = 15;
export const CURRENT_WEEK = 14;
export const PHASE_LABEL = ["I", "II", "III", "IV"] as const;
export const PHASE_WEEKS: Record<number, number[]> = { 1: [1, 2, 3, 4], 2: [5, 6, 7, 8], 3: [9, 10, 11, 12], 4: [13, 14, 15] };
export const phaseOf = (w: number) => (w <= 4 ? 1 : w <= 8 ? 2 : w <= 12 ? 3 : 4);
export const CURRENT_PHASE = phaseOf(CURRENT_WEEK);
const limboDays = (w: number) => (w === 1 ? 99 : w === 5 ? 2 : w === 9 || w === 13 ? 1 : 0);

type Profile = "strong" | "steady" | "improving" | "declining" | "struggling";
const PROFILES: Profile[] = ["strong", "strong", "steady", "steady", "steady", "improving", "improving", "declining", "struggling", "steady"];

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
      k === 3 || k === 17 || k === 29 ? "struggling" : k === 8 || k === 22 ? "declining" : PROFILES[Math.floor(rnd() * PROFILES.length)];
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
      const f = { strong: 0.25, steady: 0.6, improving: Math.max(0.2, 1.6 - 0.11 * w), declining: 0.4 + 0.22 * w, struggling: 2.6 + 0.12 * w }[prof];
      let A = 0, UA = 0, RT = 0, NO = 0, nrt = 0;
      const uaByCat: Record<number, number> = {};
      for (let d = 0; d < rated; d++)
        for (let c = 0; c < CATEGORIES.length; c++) {
          const r = rnd();
          if (r < 0.12) { NO++; continue; }
          if (r < 0.12 + catW[c] * f * 0.11) { UA++; uaByCat[c] = (uaByCat[c] || 0) + 1; }
          else if (r < 0.12 + catW[c] * f * 0.11 + 0.03) RT++;
          else A++;
        }
      phaseUA[ph] = phaseUA[ph] || {};
      for (const c in uaByCat) {
        const before = phaseUA[ph][c] || 0;
        phaseUA[ph][c] = before + uaByCat[c];
        if (before < 3 && before + uaByCat[c] >= 3 && prof !== "strong") { nrt++; nrtCats.add(+c); }
      }
      const late = rnd() < 0.04;
      if (prof === "struggling" && ((k === 3 && w === 14) || (k === 29 && w === 13))) nrt++;
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
    // WATCH trigger: 2 or more UAs in the same category within the phase (owner decision)
    return { ...s, uaPct: s.UA / base, aPct: s.A / base, repeat: Object.values(po.phaseUA[ph] || {}).some((v) => v >= 2) };
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
    const status: Status = cur.nrt > 0 ? "STRUGGLING" : cur.repeat || cur.late ? "WATCH" : "ON TRACK";
    const delta = cur.uaPct - classPhase[CURRENT_PHASE - 1]!.uaPct;
    return { ...p, phases, status, delta, above: delta > 0, trend: prev ? cur.uaPct - prev.uaPct : 0 };
  });
  const sev = (p: ProgressPO) => (p.status === "STRUGGLING" ? 300 : p.status === "WATCH" ? 200 : 100) + (p.above ? 50 : 0) + p.delta * 100;
  pos.sort((a, b) => sev(b) - sev(a));
  return { pos, classPhase, classWeek };
}

export const PROGRESS = build();

export const pct = (v: number | null | undefined) => (v == null ? "–" : `${(v * 100).toFixed(1)}%`);
