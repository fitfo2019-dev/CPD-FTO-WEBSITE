import { cn } from "@/lib/utils";
import { CURRENT_PHASE, PHASE_LABEL, PHASE_WEEKS, PROGRESS, pct, scorePct, STATUS_RULE, weekBand, type PhaseStats, type ProgressPO, type Status, type Week } from "@/lib/po-progress/data";
import { caseSafe } from "@/lib/case-safe";

export function weekClass(x: Week) {
  if (x.kind === "future") return "wk fut";
  if (x.kind === "limbo") return "wk lim";
  const b = weekBand(x);
  if (b.reason === "NRT" || b.reason.startsWith("3+")) return "wk nrt";
  return `wk u${x.UA === 0 ? 0 : b.level + 1}${x.lim > 0 ? " haslim" : ""}`;
}

export function weekTitle(x: Week) {
  if (x.kind === "future") return `Week ${x.w} · not yet worked`;
  if (x.kind === "limbo") return `Week ${x.w} · limbo`;
  const b = weekBand(x);
  return `Week ${x.w} · ${x.UA} ${x.UA === 1 ? "UA" : "UA’s"}${x.lim ? ` · limbo days ${x.lim}` : ""}${x.nrt ? " · NRT" : ""}${!x.nrt && b.reason.startsWith("3+") ? ` · ${b.reason.replace("'", "’")}` : ""}${x.signed ? "" : " · pending signature"}${x.late ? " · late packet" : ""}`;
}

export function WeekCell({ x, showNum }: { x: Week; showNum?: boolean }) {
  return (
    <span className={weekClass(x)} title={weekTitle(x)}>
      {x.kind === "limbo" ? "L" : showNum && x.kind === "rated" ? x.UA : ""}
    </span>
  );
}

export function WeekStrip({ po, big }: { po: ProgressPO; big?: boolean }) {
  return (
    <div className={cn("strip", big && "big")}>
      {[1, 2, 3, 4].map((ph) => (
        <div key={ph} className="sph" style={{ "--n": PHASE_WEEKS[ph].length } as React.CSSProperties}>
          <div className="sphl">{PHASE_LABEL[ph - 1]}</div>
          <div className="sphw">
            {PHASE_WEEKS[ph].map((w) => (
              <WeekCell key={w} x={po.weeks[w - 1]} showNum={big} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Tile color follows the most serious Status After reached in the phase. */
function tileClass(s: PhaseStats | null, po: ProgressPO, ph: number) {
  if (!s) return "tile fut";
  if (s.nrt > 0) return "tile nrt";
  const rows = po.calc.filter((r) => r.ph === ph && r.scoreNote !== "PENDING SIGNATURE");
  if (rows.some((r) => r.status === "BELOW STANDARD")) return "tile t3";
  if (rows.some((r) => r.status === "EMERGING CONCERN")) return "tile t1";
  return "tile t0";
}

export function PhaseTiles({ po }: { po: ProgressPO }) {
  return (
    <div className="tiles">
      {po.phases.map((s, i) => (
        <div key={i} className={tileClass(s, po, i + 1)}>
          <span>{PHASE_LABEL[i]}</span>
          <b>{s ? s.UA : "–"}</b>
          <i>{s ? scorePct(s.score) : ""}</i>
        </div>
      ))}
    </div>
  );
}

export function StatusChip({ status }: { status: Status }) {
  return (
    <span className={cn("chip", status === "BELOW STANDARD" ? "c-red" : status === "EMERGING CONCERN" ? "c-yel" : "c-grn")} title={STATUS_RULE[status]}>
      {status}
    </span>
  );
}

export function PreviouslyFlaggedChip({ week }: { week: number | null }) {
  if (week == null) return null;
  return (
    <span className="chip c-gry" title={`Flag cleared in Week ${week}.`}>
      Previously Flagged <em>wk {week}</em>
    </span>
  );
}

export function VsClassChip({ po }: { po: ProgressPO }) {
  return (
    <span className={cn("chip", po.above ? "c-redo" : "c-grno")} title="UA % this phase vs class">
      {pct(po.phases[CURRENT_PHASE - 1]?.uaPct)} <em>vs</em> {pct(PROGRESS.classPhase[CURRENT_PHASE - 1]?.uaPct)}
    </span>
  );
}

export function trendDir(po: ProgressPO) {
  return po.trend > 0.002 ? 1 : po.trend < -0.002 ? -1 : 0;
}

export function TrendLabel({ po }: { po: ProgressPO }) {
  const d = trendDir(po);
  const prev = PHASE_LABEL[CURRENT_PHASE - 2];
  return (
    <span className={cn("text-[11px] font-bold", d > 0 ? "text-err" : d < 0 ? "text-ok" : "text-muted-foreground")}>
      {d > 0 ? `Worse than Phase ${prev}` : d < 0 ? `Better than Phase ${prev}` : `Same as Phase ${prev}`}
    </span>
  );
}

export function Legend() {
  const items: [string, string][] = [
    ["lw u0", "0 UA’s"],
    ["lw u1", "Meets Standard"],
    ["lw u2", "Emerging Concern"],
    ["lw u3", "Below Standard"],
    ["lw nrt", "NRT or 3+ on Same Task"],
    ["lw lim", "Limbo week"],
    ["lw u0 haslim", "Week with limbo days"],
    ["lw fut", "Not yet worked"],
  ];
  return (
    <div className="legend">
      {items.map(([c, l]) => (
        <span key={l}>
          <i className={c} />
          {caseSafe(l)}
        </span>
      ))}
    </div>
  );
}
