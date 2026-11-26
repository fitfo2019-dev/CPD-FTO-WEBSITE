"use client";

import { useEffect, useMemo, useState } from "react";
import { StatCard } from "@/components/portal/stat-card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FTO_BY, curFto, today, usePortal } from "@/lib/portal/store";
import { CURRENT_PHASE, PHASE_LABEL, PHASE_WEEKS, PROGRESS, inSampleGroup, pct, type ProgressPO } from "@/lib/po-progress/data";
import { cn } from "@/lib/utils";
import { Legend, PhaseTiles, StatusChip, TrendLabel, VsClassChip, WeekCell, WeekStrip, trendDir } from "./parts";
import { PoDetail } from "./po-detail";
import { caseSafe } from "@/lib/case-safe";

const { pos: allPos, classPhase, classWeek } = PROGRESS;

type Show = "BELOW STANDARD" | "EMERGING CONCERN" | "MEETS STANDARD" | "ABOVE";
const SHOW_LABEL: Record<Show, string> = { "BELOW STANDARD": "Below Standard", "EMERGING CONCERN": "Emerging Concern", "MEETS STANDARD": "Meets Standard", ABOVE: "Above Class UA %" };
const SHOW_PARAM: Record<string, Show> = { "below-standard": "BELOW STANDARD", "emerging-concern": "EMERGING CONCERN", "meets-standard": "MEETS STANDARD", above: "ABOVE" };
const matches = (p: ProgressPO, f: Show) => (f === "ABOVE" ? p.above : p.status === f);

function Cards({ pos, onOpen }: { pos: ProgressPO[]; onOpen: (p: ProgressPO) => void }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {pos.map((p) => (
        <button
          key={p.k}
          type="button"
          onClick={() => onOpen(p)}
          className={cn(
            "rounded-lg border border-l-4 bg-card p-4 text-left transition hover:shadow-md focus-visible:outline-2 focus-visible:outline-navy",
            p.status === "BELOW STANDARD" ? "border-l-err" : p.status === "EMERGING CONCERN" ? "border-l-[#e2b007]" : "border-l-line",
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="break-words font-extrabold text-navy">{p.name}</div>
              <div className="break-words text-xs text-muted-foreground">Badge {p.badge} · FTO {p.fto}</div>
            </div>
            <div className="shrink-0 whitespace-nowrap"><StatusChip status={p.status} /></div>
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

function Board({ pos, onOpen }: { pos: ProgressPO[]; onOpen: (p: ProgressPO) => void }) {
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
            {allPos[0].weeks.map((x) => (
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

export function ProgressView({ coordinatorScope = false }: { coordinatorScope?: boolean }) {
  const [open, setOpen] = useState<ProgressPO | null>(null);
  const [scope, setScope] = useState<"mine" | "all">(coordinatorScope ? "mine" : "all");
  const [show, setShow] = useState<Show | null>(null);
  const [tab, setTab] = useState("cards");
  useEffect(() => {
    const f = SHOW_PARAM[new URLSearchParams(window.location.search).get("show") ?? ""];
    if (f) setShow(f);
  }, []);
  const s = usePortal();
  // The FTO shown is the PO's current assignment, the same one Probationary Officers shows.
  const live = useMemo(
    () =>
      allPos.map((p) => {
        const f = FTO_BY[curFto(s, p.badge, today)?.fto ?? ""];
        return f ? { ...p, fto: f.name.replace(/^(Ofc|Sgt)\. /, ""), ftob: f.badge } : { ...p, fto: "—", ftob: "—" };
      }),
    [s],
  );
  const scoped = scope === "mine" ? live.filter(inSampleGroup) : live;
  const pos = show ? scoped.filter((p) => matches(p, show)) : scoped;
  const count = (f: Show) => scoped.filter((p) => matches(p, f)).length;
  const toggle = (f: Show) => setShow((cur) => (cur === f ? null : f));
  const tile = (f: Show, variant: "err" | "warn" | "ok" | "neutral") => (
    <StatCard label={SHOW_LABEL[f]} value={count(f)} variant={variant} onClick={() => toggle(f)} active={show === f} />
  );
  return (
    <>
      {coordinatorScope ? (
        <Tabs value={scope} onValueChange={(v) => setScope(v as "mine" | "all")} className="mb-4">
          <TabsList>
            <TabsTrigger value="mine" className="shell-caps text-[12px] font-bold" data-testid="tab-my-pos">{caseSafe("My PO’s")}</TabsTrigger>
            <TabsTrigger value="all" className="shell-caps text-[12px] font-bold" data-testid="tab-all-pos">{caseSafe("All PO’s")}</TabsTrigger>
          </TabsList>
        </Tabs>
      ) : null}
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        {tile("BELOW STANDARD", "err")}
        {tile("EMERGING CONCERN", "warn")}
        {tile("MEETS STANDARD", "ok")}
        {tile("ABOVE", "neutral")}
        <StatCard label={`Class UA % · Phase ${PHASE_LABEL[CURRENT_PHASE - 1]}`} value={pct(classPhase[CURRENT_PHASE - 1]?.uaPct)} onClick={() => setTab("board")} />
      </div>
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="cards" className="shell-caps text-[12px] font-bold">Cards</TabsTrigger>
            <TabsTrigger value="board" className="shell-caps text-[12px] font-bold">Class Board</TabsTrigger>
          </TabsList>
          {show ? (
            <div className="flex items-center gap-2" data-testid="progress-filter">
              <span className="shell-caps rounded-full border bg-card px-3 py-1 text-[11px] font-bold text-navy">{caseSafe(`Showing ${SHOW_LABEL[show]} (${pos.length})`)}</span>
              <button type="button" onClick={() => setShow(null)} className="shell-caps text-[11px] font-bold text-navy underline-offset-2 hover:underline">Clear</button>
            </div>
          ) : null}
        </div>
        <TabsContent value="cards" className="mt-4">
          {pos.length ? <Cards pos={pos} onOpen={setOpen} /> : <p className="shell-caps py-8 text-center text-xs font-bold text-muted-foreground">{caseSafe("No PO’s")}</p>}
          <Legend />
        </TabsContent>
        <TabsContent value="board" className="mt-4">
          <Board pos={pos} onOpen={setOpen} />
          <Legend />
        </TabsContent>
      </Tabs>
      <PoDetail po={open} onClose={() => setOpen(null)} />
    </>
  );
}
