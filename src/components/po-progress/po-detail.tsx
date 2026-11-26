"use client";

import Link from "next/link";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { CATEGORIES } from "@/config/categories";
import { CURRENT_WEEK, PHASE_LABEL, PROGRESS, WEEKS, pct, type ProgressPO } from "@/lib/po-progress/data";
import { cn } from "@/lib/utils";
import { StatusChip, WeekStrip } from "./parts";
import { caseSafe } from "@/lib/case-safe";

function WeekChart({ po }: { po: ProgressPO }) {
  const W = 640, H = 220, m = 40;
  const pw = po.weeks.map((x) => (x.kind === "rated" ? x.UA / (x.A + x.RT + x.UA) : null));
  const cw = PROGRESS.classWeek;
  const mxv = Math.max(0.03, ...pw.filter((v): v is number => v != null), ...cw.filter((v): v is number => v != null)) * 1.15;
  const X = (w: number) => m + ((w - 1) * (W - 2 * m)) / (WEEKS - 1);
  const Y = (v: number) => H - m - (v / mxv) * (H - 2 * m);
  let pc = "", pp = "";
  for (let w = 1; w <= CURRENT_WEEK; w++) {
    const c = cw[w - 1], p = pw[w - 1];
    if (c != null) pc += `${pc ? "L" : "M"}${X(w)},${Y(c)}`;
    if (p != null) pp += `${pp ? "L" : "M"}${X(w)},${Y(p)}`;
  }
  const bands: [number, number][] = [[1, 4], [5, 8], [9, 12], [13, 15]];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Weekly UA percent, PO versus class">
      {bands.map(([a, b], i) => (
        <g key={i}>
          <rect x={X(a) - 12} y={m - 14} width={X(b) - X(a) + 24} height={H - 2 * m + 14} fill={i % 2 ? "#ffffff" : "#f3f5f8"} />
          <text x={(X(a) + X(b)) / 2} y={m - 20} textAnchor="middle" className="fill-muted-foreground text-[10px] font-extrabold tracking-wider">
            PHASE {PHASE_LABEL[i]}
          </text>
        </g>
      ))}
      {[0, 1, 2, 3, 4].map((g) => {
        const v = (mxv * g) / 4;
        return (
          <g key={g}>
            <line x1={m} x2={W - m} y1={Y(v)} y2={Y(v)} stroke="#e1e6ee" />
            <text x={m - 6} y={Y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">{(v * 100).toFixed(0)}%</text>
          </g>
        );
      })}
      <path d={pc} fill="none" stroke="#8a94a6" strokeWidth={2} strokeDasharray="5 4" />
      <path d={pp} fill="none" stroke={po.above ? "#b42318" : "#0f2446"} strokeWidth={2.5} />
      {po.weeks.map((x) => {
        const v = pw[x.w - 1];
        return (
          <g key={x.w}>
            {v != null && x.kind === "rated" && (
              <circle cx={X(x.w)} cy={Y(v)} r={x.nrt ? 6 : 4} fill={x.nrt ? "#7b4bb0" : v > (cw[x.w - 1] ?? 0) ? "#b42318" : "#1f7a4d"}>
                <title>{`Week ${x.w} · ${pct(v)} vs class ${pct(cw[x.w - 1])}`}</title>
              </circle>
            )}
            <text x={X(x.w)} y={H - m + 16} textAnchor="middle" className="fill-muted-foreground text-[10px]">W{x.w}</text>
          </g>
        );
      })}
    </svg>
  );
}

function H3({ children }: { children: React.ReactNode }) {
  return <h3 className="shell-caps mb-2 text-[12px] font-extrabold text-navy">{children}</h3>;
}

export function PoDetail({ po, onClose }: { po: ProgressPO | null; onClose: () => void }) {
  const headRef = useRef<HTMLDivElement>(null);
  const cats: Record<number, number> = {};
  po?.weeks.forEach((x) => {
    if (x.kind === "rated") for (const c in x.uaByCat) cats[+c] = (cats[+c] || 0) + x.uaByCat[c];
  });
  const top = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return (
    <Sheet open={!!po} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="right" initialFocus={headRef} className="w-full overflow-y-auto data-[side=right]:w-full data-[side=right]:sm:max-w-[720px]">
        {po && (
          <>
            <SheetHeader ref={headRef} tabIndex={-1} className="border-b pr-12 outline-none">
              <p className="shell-caps text-[11px] font-bold text-muted-foreground">PO Progress</p>
              <div className="flex flex-wrap items-center gap-3">
                <SheetTitle className="text-xl font-extrabold text-navy">{po.name}</SheetTitle>
                <StatusChip status={po.status} />
              </div>
              <SheetDescription>
                Badge {po.badge} · FTO {po.fto} · Badge {po.ftob} · {po.sched}
              </SheetDescription>
              <div>
                <Button variant="outline" size="sm" className="shell-caps mt-1 font-bold" render={<Link href={`/coordinator/probationary-officers?q=${po.badge}`} />} nativeButton={false}>
                  Open Full Profile
                </Button>
              </div>
            </SheetHeader>
            <div className="grid gap-6 px-4 pb-6">
              <section>
                <H3>Weekly UA % · PO vs Class</H3>
                <WeekChart po={po} />
                <div className="legend">
                  <span><i className="inline-block h-[3px] w-5" style={{ background: po.above ? "#b42318" : "#0f2446" }} />PO</span>
                  <span><i className="inline-block w-5 border-t-2 border-dashed border-[#8a94a6]" />Class</span>
                  <span><i className="inline-block size-3 rounded-full bg-[#7b4bb0]" />NRT week</span>
                </div>
              </section>
              <section className="overflow-x-auto">
                <H3>15-Week Strip</H3>
                <WeekStrip po={po} big />
              </section>
              <section className="overflow-x-auto">
                <H3>By Phase</H3>
                <table className="w-full text-sm tabular-nums">
                  <thead>
                    <tr className="shell-caps border-b text-left text-[11px] text-muted-foreground">
                      {["Phase", "UA’s", "UA %", "Class UA %", "A %", "Class A %", "NRT"].map((h) => (
                        <th key={h} className="px-2 py-1.5 font-bold">{caseSafe(h)}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {po.phases.map((s, i) => {
                      const c = PROGRESS.classPhase[i];
                      if (!s || !c)
                        return (
                          <tr key={i} className="border-b text-muted-foreground">
                            <td className="px-2 py-1.5">{PHASE_LABEL[i]}</td>
                            <td colSpan={6} className="px-2 py-1.5">Not yet worked</td>
                          </tr>
                        );
                      return (
                        <tr key={i} className="border-b">
                          <td className="px-2 py-1.5 font-bold">{PHASE_LABEL[i]}</td>
                          <td className={cn("px-2 py-1.5", s.UA && "font-bold text-err")}>{s.UA}</td>
                          <td className={cn("px-2 py-1.5", s.uaPct > c.uaPct && "font-bold text-err")}>{pct(s.uaPct)}</td>
                          <td className="px-2 py-1.5">{pct(c.uaPct)}</td>
                          <td className="px-2 py-1.5 font-bold text-ok">{pct(s.aPct)}</td>
                          <td className="px-2 py-1.5">{pct(c.aPct)}</td>
                          <td className={cn("px-2 py-1.5", s.nrt && "font-bold text-[#6a3aa0]")}>{s.nrt || "–"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </section>
              <section>
                <H3>{caseSafe("Most UA’s · Program")}</H3>
                {top.length ? (
                  <ul className="grid gap-1.5 text-sm">
                    {top.map(([c, v]) => (
                      <li key={c} className="flex items-center justify-between rounded-md border px-3 py-1.5">
                        <span>{CATEGORIES[+c].n}. {CATEGORIES[+c].name}</span>
                        <b className={po.nrtCats.includes(+c) ? "text-[#6a3aa0]" : "text-err"}>{v}</b>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">None</p>
                )}
              </section>
              <div className="flex flex-wrap gap-2">
                <Button className="shell-caps bg-navy font-bold">Export PO</Button>
                <Button variant="outline" className="shell-caps font-bold">Open Packets</Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
