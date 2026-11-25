"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LIMBO_DAY, LIMBO_REASONS } from "@/lib/limbo-store";
import { Steps, SummaryList } from "./icons";

const MIN_WHY = 25;

export function UnlockRequestDialog({ open, onOpenChange, onSend }: { open: boolean; onOpenChange: (o: boolean) => void; onSend: (reason: string, why: string) => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [reason, setReason] = useState("");
  const [why, setWhy] = useState("");
  const [typed, setTyped] = useState("");
  const len = why.trim().length;

  const change = (o: boolean) => {
    if (!o) {
      setStep(1);
      setTyped("");
    }
    onOpenChange(o);
  };

  return (
    <Dialog open={open} onOpenChange={change}>
      <DialogContent className="sm:max-w-md">
        {step === 1 ? (
          <>
            <Steps n={1} />
            <DialogTitle className="text-base font-extrabold text-navy">Why are ratings needed on a limbo day?</DialogTitle>
            <div className="grid gap-1.5">
              <Label htmlFor="lr-reason" className="shell-caps text-[11px] font-bold">Reason</Label>
              <select
                id="lr-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <option value="">Select reason</option>
                {LIMBO_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="lr-why" className="shell-caps text-[11px] font-bold">Explanation</Label>
              <Textarea id="lr-why" rows={4} maxLength={500} value={why} onChange={(e) => setWhy(e.target.value)} />
              <small className={len >= MIN_WHY ? "text-ok" : "text-muted-foreground"}>{len} / {MIN_WHY} minimum</small>
            </div>
            <DialogFooter>
              <Button variant="outline" className="shell-caps font-bold" onClick={() => change(false)}>Cancel</Button>
              <Button className="shell-caps bg-navy font-bold" disabled={!reason || len < MIN_WHY} onClick={() => setStep(2)}>Continue</Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Steps n={2} />
            <DialogTitle className="text-base font-extrabold text-navy">Confirm unlock request</DialogTitle>
            <SummaryList rows={[["Day", `${LIMBO_DAY.date} · Phase II · ${LIMBO_DAY.dayOf}`], ["Reason", reason], ["Explanation", why.trim()]]} />
            <div className="grid gap-1.5">
              <Label htmlFor="lr-type" className="shell-caps text-[11px] font-bold">Type UNLOCK</Label>
              <Input id="lr-type" autoComplete="off" spellCheck={false} value={typed} onChange={(e) => setTyped(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" className="shell-caps font-bold" onClick={() => setStep(1)}>Back</Button>
              <Button
                className="shell-caps bg-navy font-bold"
                disabled={typed.trim() !== "UNLOCK"}
                onClick={() => {
                  onSend(reason, why.trim());
                  setReason("");
                  setWhy("");
                  change(false);
                }}
              >
                Send to Coordinator
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
