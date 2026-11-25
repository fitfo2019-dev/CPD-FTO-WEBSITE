"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMBO_DAY, useLimbo } from "@/lib/limbo-store";
import { Steps, SummaryList } from "./icons";

const MIN_NOTE = 10;
const capsHead = "shell-caps px-5 py-2 text-left text-[11px] font-bold text-muted-foreground";

export function UnlockRequestsPanel() {
  const limbo = useLimbo();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const pending = limbo.state === "pending";
  const ok = note.trim().length >= MIN_NOTE;
  const decide = (fn: (n: string) => void) => {
    fn(note.trim());
    setNote("");
    setOpen(false);
  };

  return (
    <Card className="rounded-lg py-0 shadow-none">
      <CardHeader className="flex flex-row items-center justify-between border-b px-5 py-4">
        <CardTitle className="shell-caps text-[13px] font-extrabold text-navy">Limbo Unlock Requests</CardTitle>
        {pending && <span className="chip c-amb">1 Pending</span>}
      </CardHeader>
      <CardContent className="overflow-x-auto px-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              {["PO", "FTO", "Day", "Reason", "Status", ""].map((h, i) => (
                <th key={i} className={capsHead}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pending ? (
              <tr className="border-b">
                <td className="whitespace-nowrap px-5 py-3 font-bold">{LIMBO_DAY.po}</td>
                <td className="whitespace-nowrap px-5 py-3">{LIMBO_DAY.fto}</td>
                <td className="whitespace-nowrap px-5 py-3">{LIMBO_DAY.date} · {LIMBO_DAY.dayOf}</td>
                <td className="px-5 py-3">{limbo.reason}</td>
                <td className="px-5 py-3"><span className="chip c-amb">Pending</span></td>
                <td className="px-5 py-3 text-right">
                  <Button size="sm" className="shell-caps bg-navy font-bold" onClick={() => setOpen(true)}>Review</Button>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-muted-foreground">No pending unlock requests</td>
              </tr>
            )}
          </tbody>
        </table>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <Steps n={3} />
          <DialogTitle className="text-base font-extrabold text-navy">Coordinator review · limbo unlock</DialogTitle>
          <SummaryList
            rows={[
              ["FTO", LIMBO_DAY.fto],
              ["PO", LIMBO_DAY.po],
              ["Day", `${LIMBO_DAY.date} · Phase II · ${LIMBO_DAY.dayOf}`],
              ["Reason", limbo.reason],
              ["Explanation", limbo.why],
            ]}
          />
          <div className="grid gap-1.5">
            <Label htmlFor="cr-note" className="shell-caps text-[11px] font-bold">Coordinator note</Label>
            <Textarea id="cr-note" rows={3} maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" className="shell-caps font-bold" disabled={!ok} onClick={() => decide(limbo.deny)}>Deny</Button>
            <Button className="shell-caps bg-navy font-bold" disabled={!ok} onClick={() => decide(limbo.approve)}>Approve Unlock</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
