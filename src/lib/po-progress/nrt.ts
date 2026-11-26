/**
 * NRT recommendation (PO-NRT-1, owner decisions, November 26, 2026), based on the 2026 FTO manual definition:
 * a pattern of documented deficient performance in a specific patrol task despite corrective re-training, always paired with a UA.
 * The system recommends an NRT on the 3rd UA for the same task in the current phase when each of the two earlier UA's
 * has corrective training documented before the next failure. The FTO makes the final decision; a dismissed
 * recommendation is not stored and is evaluated again on the next UA for that task.
 */
export const NRT_RULE_VERSION = "PO-NRT-1 · November 26, 2026";
export const NRT_REPEAT = 3;

export type Occurrence = {
  id: string;
  phase: number;
  /** "category.task" for checklist items; for narrative-only categories the FTO links a UA to an earlier one as the same issue. */
  task: string;
  /** When the UA occurred (ISO date-time). */
  at: string;
  /** When corrective training for this UA was documented (ISO date-time), if any. */
  retrainedAt: string | null;
  retrainMinutes: number | null;
};

export type NrtAdvice =
  | { kind: "none" }
  /** Earlier UA's on this task lack corrective training documented before the next failure. */
  | { kind: "retrain"; missing: Occurrence[] }
  /** Recommend NRT. `current` lists this phase's earlier UA's on the task for the FTO to select; `earlier` lists retrained UA's on the task from earlier phases, unselected by default. */
  | { kind: "nrt"; current: Occurrence[]; earlier: Occurrence[] };

const retrainedBefore = (o: Occurrence, next: Occurrence) => o.retrainedAt != null && o.retrainedAt >= o.at && o.retrainedAt < next.at;

export function adviseNrt(history: Occurrence[], today: Occurrence): NrtAdvice {
  const same = history
    .filter((o) => o.id !== today.id && o.task === today.task && o.at < today.at)
    .sort((a, b) => (a.at < b.at ? -1 : 1));
  const current = same.filter((o) => o.phase === today.phase);
  if (current.length < NRT_REPEAT - 1) return { kind: "none" };
  const [p1, p2] = current.slice(-2);
  const missing = [retrainedBefore(p1, p2) ? null : p1, retrainedBefore(p2, today) ? null : p2].filter((o): o is Occurrence => o != null);
  if (missing.length) return { kind: "retrain", missing };
  return { kind: "nrt", current, earlier: same.filter((o) => o.phase < today.phase && o.retrainedAt != null) };
}
