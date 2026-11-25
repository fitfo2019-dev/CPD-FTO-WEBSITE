"use client";

import { useState } from "react";
import { ActionBar } from "@/components/portal/action-bar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, RATINGS } from "@/config/categories";
import { LIMBO_DAY, useLimbo } from "@/lib/limbo-store";
import { cn } from "@/lib/utils";
import { LockIcon, SummaryList, WarnIcon } from "./icons";
import { UnlockRequestDialog } from "./unlock-request-dialog";

const ACTIVITY = ["PremierOne Reports", "F.I. Reports", "Accident Reports", "Traffic Stops", "Traffic Citations", "Prisoners Slated"];
const CHECKLISTS = ["Reporting for Duty", "Vehicle Inspection", "Run Log"];
const capsTitle = "shell-caps text-[13px] font-extrabold text-navy";
const capsHead = "shell-caps text-[11px] font-bold text-muted-foreground";

function DayChip({ state }: { state: string }) {
  if (state === "approved") return <span className="chip c-amb">Limbo · Override Approved</span>;
  if (state === "pending") return <span className="chip c-amb">Unlock Pending Coordinator</span>;
  return <span className="chip c-lim">{LIMBO_DAY.dayOf}</span>;
}

export function LimboPacket() {
  const limbo = useLimbo();
  const [dialog, setDialog] = useState(false);
  const unlocked = limbo.state === "approved";
  const canRequest = limbo.state === "locked" || limbo.state === "denied";

  const header: [string, string][] = [
    ["Probationary Officer", LIMBO_DAY.po],
    ["Date", LIMBO_DAY.date],
    ["Phase · Week", LIMBO_DAY.phaseWeek],
    ["Tour", LIMBO_DAY.tour],
  ];

  return (
    <>
      <Card className="mb-5 rounded-lg py-4 shadow-none">
        <CardContent className="grid grid-cols-2 items-center gap-4 px-5 md:grid-cols-5">
          {header.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <p className={capsHead}>{k}</p>
              <p className="mt-1 font-bold">{v}</p>
            </div>
          ))}
          <div className="col-span-2 md:col-span-1 md:justify-self-end">
            <DayChip state={limbo.state} />
          </div>
        </CardContent>
      </Card>

      <div className={cn("limbo-banner", unlocked && "ovr")} role="status">
        <span className="lb-ico">{unlocked ? <WarnIcon /> : <LockIcon />}</span>
        <div className="min-w-0">
          <b className="block text-base">{unlocked ? "Limbo override – ratings unlocked" : "Limbo Period – PO not evaluated"}</b>
          <small className="text-xs font-semibold text-[#3a3f4b]">{unlocked ? `Approved by FTO Coordinator · ${limbo.reason}` : LIMBO_DAY.span}</small>
        </div>
        {canRequest && (
          <Button variant="outline" size="sm" className="shell-caps ml-auto bg-white font-bold" onClick={() => setDialog(true)}>
            Request Rating Unlock
          </Button>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card className={cn("rounded-lg py-0 shadow-none", unlocked && "border-2 border-[#c77700]")}>
          <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
            <CardTitle className={capsTitle}>Performance Categories</CardTitle>
            <span className={cn("shell-caps inline-flex items-center gap-1 text-[11px] font-bold", unlocked ? "text-warn" : "text-muted-foreground")}>
              {unlocked ? <WarnIcon /> : <LockIcon />} {unlocked ? "Override" : "Locked"}
            </span>
          </CardHeader>
          <CardContent className="overflow-x-auto px-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(capsHead, "w-12 px-5")}>#</TableHead>
                  <TableHead className={capsHead}>Category</TableHead>
                  {RATINGS.map((r) => (
                    <TableHead key={r} className={cn(capsHead, "w-14 text-center")}>{r}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {CATEGORIES.map((c) => (
                  <TableRow key={c.n}>
                    <TableCell className="px-5 tabular-nums text-muted-foreground">{c.n}</TableCell>
                    <TableCell className="whitespace-nowrap">{c.name}</TableCell>
                    {unlocked ? (
                      RATINGS.map((r) => {
                        const unavailable = r === "RT" && !c.rtAllowed;
                        return (
                          <TableCell key={r} className="text-center">
                            <input type="radio" name={`cat-${c.n}`} value={r} disabled={unavailable} aria-label={`${c.name}: ${r}`} className="size-4 accent-navy disabled:opacity-30" />
                          </TableCell>
                        );
                      })
                    ) : (
                      <TableCell colSpan={RATINGS.length} className="text-center">
                        <span className="lmark">Limbo · Not Rated</span>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="grid content-start gap-5">
          <Card className="rounded-lg py-0 shadow-none">
            <CardHeader className="border-b px-5 py-4">
              <CardTitle className={capsTitle}>FTO Comments</CardTitle>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className={cn("fixed-line", unlocked && "struck")}>
                <LockIcon /> Limbo Period – PO not evaluated
              </div>
              <Textarea rows={4} aria-label="FTO comments" placeholder="Comments" />
            </CardContent>
          </Card>

          <Card className="rounded-lg py-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
              <CardTitle className={capsTitle}>Daily Activity Summary</CardTitle>
              <span className="chip c-grno">Open</span>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3 px-5 py-4">
              {ACTIVITY.map((a) => (
                <label key={a} className="grid min-w-0 gap-1 text-xs font-semibold">
                  <span>{a}</span>
                  <input type="number" min={0} defaultValue={0} inputMode="numeric" className="h-9 w-full min-w-0 rounded-md border px-2 text-sm tabular-nums" />
                </label>
              ))}
            </CardContent>
          </Card>

          <Card className="rounded-lg py-0 shadow-none">
            <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
              <CardTitle className={capsTitle}>Checklist Forms</CardTitle>
              <span className="chip c-grno">Open</span>
            </CardHeader>
            <CardContent className="grid gap-2 px-5 py-4 text-sm">
              {CHECKLISTS.map((c) => (
                <span key={c} className="rounded-md border px-3 py-2 font-semibold">{c}</span>
              ))}
            </CardContent>
          </Card>

          {limbo.state !== "locked" && (
            <Card className="rounded-lg py-0 shadow-none">
              <CardHeader className="border-b px-5 py-4">
                <CardTitle className={capsTitle}>Unlock Record</CardTitle>
              </CardHeader>
              <CardContent className="px-5 py-4">
                <SummaryList
                  rows={[
                    ["Requested by", `FTO ${LIMBO_DAY.fto}`],
                    ["Reason", limbo.reason],
                    ["Explanation", limbo.why],
                    ["Coordinator", limbo.state === "approved" ? `Approved · ${limbo.coordNote}` : limbo.state === "denied" ? `Denied · ${limbo.coordNote}` : "Pending"],
                  ]}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ActionBar>
        <Button variant="outline" className="shell-caps h-10 px-5 font-bold">Save Local Draft</Button>
        <Button className="shell-caps h-10 px-5 font-bold" disabled>Finalize and Submit to Coordinator</Button>
      </ActionBar>

      <UnlockRequestDialog open={dialog} onOpenChange={setDialog} onSend={limbo.request} />
    </>
  );
}
