"use client";

import { useState } from "react";
import { StatCard } from "@/components/portal/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CURRENT_PHASE, PHASE_LABEL, PHASE_WEEKS, PROGRESS, pct, type ProgressPO } from "@/lib/po-progress/data";
import { cn } from "@/lib/utils";
import { Legend, PhaseTiles, StatusChip, TrendLabel, VsClassChip, WeekCell, WeekStrip, trendDir } from "./parts";
import { PoDetail } from "./po-detail";

const { pos, classPhase, classWeek } = PROGRESS;

function Cards({ onOpen }: { onOpen: (p: ProgressPO) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {pos.map((p) => (
        <button
          key={p.k}
          type="button"
          onClick={() => onOpen(p)}
          className={cn(
            "rounded-lg border border-l-4 bg-card p-4 text-left transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-navy",
            p.status === "STRUGGLING" ? "border-l-err" : p.status === "WATCH" ? "border-l-[#e2b007]" : "border-l-line",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="truncate font-extrabold text-navy">{p.name}</div>
              <div className="truncate text-xs text-muted-foreground">Badge {p.badge} · FTO {p.fto}</div>
            </div>
            <StatusChip status={p.status} />
          </div>
          <WeekStrip po={p} />
          <PhaseTiles po={p} />
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <VsClassChip po={p} />
            <TrendLabel po={p} />
          </div>
        </button>
      ))}
    </div>
  );
}

const th = "shell-caps px-1 py-1.5 text-[10px] font-bold text-muted-foreground";
const stk = "sticky left-0 z-10 bg-card px-3 text-left";

function Board({ onOpen }: { onOpen: (p: ProgressPO) => void }) {
  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full border-collapse text-sm tabular-nums">
        <thead>
          <tr className="border-b">
            <th className={cn(th, stk)}>Probationary Officer</th>
            <th className={th}>Status</th>
            {[1, 2, 3, 4].map((ph) => (
              <th key={ph} colSpan={PHASE_WEEKS[ph].length} className={cn(th, "border-l")}>Phase {PHASE_LABEL[ph - 1]}</th>
            ))}
            <th colSpan={4} className={cn(th, "border-l")}>UA % by Phase vs Class</th>
            <th className={th}>Trend</th>
          </tr>
          <tr className="border-b">
            <th className={cn(th, stk)} />
            <th />
            {pos[0].weeks.map((x) => (
              <th key={x.w} className={th}>W{x.w}</th>
            ))}
            {PHASE_LABEL.map((l) => (
              <th key={l} className={th}>{l}</th>
            ))}
            <th />
          </tr>
        </thead>
        <tbody>
          {pos.map((p) => (
            <tr key={p.k} onClick={() => onOpen(p)} className="cursor-pointer border-b hover:bg-canvas">
              <td className={cn(stk, "py-1.5")}>
                <button type="button" className="text-left" onClick={() => onOpen(p)}>
                  <b className="block whitespace-nowrap text-navy">{p.name}</b>
                  <small className="text-muted-foreground">{p.badge}</small>
                </button>
              </td>
              <td className="px-2"><StatusChip status={p.status} /></td>
              {p.weeks.map((x) => (
                <td key={x.w} className="px-0.5 text-center"><WeekCell x={x} showNum /></td>
              ))}
              {p.phases.map((s, i) => {
                const c = classPhase[i];
                return (
                  <td key={i} className={cn("px-2 text-right text-xs", s && c && (s.uaPct > c.uaPct ? "font-bold text-err" : "text-ok"))}>
                    {s ? pct(s.uaPct) : "–"}
                  </td>
                );
              })}
              <td className="px-2 text-center">
                {trendDir(p) > 0 ? <span className="text-err">&#9650;</span> : trendDir(p) < 0 ? <span className="text-ok">&#9660;</span> : <span className="text-muted-foreground">&#9654;</span>}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="bg-canvas font-bold">
            <td className={cn(stk, "bg-canvas py-2")}>Class Average</td>
            <td />
            {classWeek.map((v, i) => (
              <td key={i} className="px-0.5 text-center text-[10px] text-muted-foreground">{v != null ? (v * 100).toFixed(1) : ""}</td>
            ))}
            {classPhase.map((c, i) => (
              <td key={i} className="px-2 text-right text-xs">{c ? pct(c.uaPct) : "–"}</td>
            ))}
            <td />
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export function ProgressView() {
  const [open, setOpen] = useState<ProgressPO | null>(null);
  const count = (s: string) => pos.filter((p) => p.status === s).length;
  return (
    <>
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatCard label="Struggling" value={count("STRUGGLING")} variant="err" />
        <StatCard label="Watch" value={count("WATCH")} variant="warn" />
        <StatCard label="On Track" value={count("ON TRACK")} variant="ok" />
        <StatCard label="Above Class UA %" value={pos.filter((p) => p.above).length} />
        <StatCard label={`Class UA % · Phase ${PHASE_LABEL[CURRENT_PHASE - 1]}`} value={pct(classPhase[CURRENT_PHASE - 1]?.uaPct)} />
      </div>
      <Tabs defaultValue="cards">
        <TabsList>
          <TabsTrigger value="cards" className="shell-caps text-[12px] font-bold">Cards</TabsTrigger>
          <TabsTrigger value="board" className="shell-caps text-[12px] font-bold">Class Board</TabsTrigger>
        </TabsList>
        <TabsContent value="cards" className="mt-4">
          <Cards onOpen={setOpen} />
          <Legend />
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <Board onOpen={setOpen} />
          <Legend />
        </TabsContent>
      </Tabs>
      <PoDetail po={open} onClose={() => setOpen(null)} />
    </>
  );
}
