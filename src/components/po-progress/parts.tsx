import { cn } from "@/lib/utils";
import { CURRENT_PHASE, PHASE_LABEL, PHASE_WEEKS, PROGRESS, pct, type PhaseStats, type ProgressPO, type Status, type Week } from "@/lib/po-progress/data";

export function weekClass(x: Week) {
  if (x.kind === "future") return "wk fut";
  if (x.kind === "limbo") return "wk lim";
  if (x.nrt > 0) return "wk nrt";
  return `wk u${Math.min(x.uaDays, 3)}${x.lim > 0 ? " haslim" : ""}`;
}

export function weekTitle(x: Week) {
  if (x.kind === "future") return `Week ${x.w} · not yet worked`;
  if (x.kind === "limbo") return `Week ${x.w} · limbo`;
  return `Week ${x.w} · UA days ${x.uaDays}${x.lim ? ` · limbo days ${x.lim}` : ""}${x.nrt ? " · NRT" : ""}${x.late ? " · late packet" : ""}`;
}

export function WeekCell({ x, showNum }: { x: Week; showNum?: boolean }) {
  return (
    <span className={weekClass(x)} title={weekTitle(x)}>
      {x.kind === "limbo" ? "L" : showNum && x.kind === "rated" ? x.uaDays : ""}
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

function tileClass(s: PhaseStats | null) {
  if (!s) return "tile fut";
  if (s.nrt > 0) return "tile nrt";
  return `tile ${s.uaDays <= 2 ? "t0" : s.uaDays <= 5 ? "t1" : s.uaDays <= 9 ? "t2" : "t3"}`;
}

export function PhaseTiles({ po }: { po: ProgressPO }) {
  return (
    <div className="tiles">
      {po.phases.map((s, i) => (
        <div key={i} className={tileClass(s)}>
          <span>{PHASE_LABEL[i]}</span>
          <b>{s ? s.uaDays : "–"}</b>
          <i>{s ? pct(s.aPct) : ""}</i>
        </div>
      ))}
    </div>
  );
}

export function StatusChip({ status }: { status: Status }) {
  return <span className={cn("chip", status === "STRUGGLING" ? "c-red" : status === "WATCH" ? "c-yel" : "c-grn")}>{status}</span>;
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
    ["lw u0", "0 UA days"],
    ["lw u1", "1"],
    ["lw u2", "2"],
    ["lw u3", "3+"],
    ["lw nrt", "NRT"],
    ["lw lim", "Limbo week"],
    ["lw u0 haslim", "Week with limbo days"],
    ["lw fut", "Not yet worked"],
  ];
  return (
    <div className="legend">
      {items.map(([c, l]) => (
        <span key={l}>
          <i className={c} />
          {l}
        </span>
      ))}
    </div>
  );
}
