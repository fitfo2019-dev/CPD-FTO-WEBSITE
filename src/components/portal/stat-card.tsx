import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tone = { neutral: "border-t-line", err: "border-t-err", warn: "border-t-[#e2b007]", ok: "border-t-ok" } as const;

export function StatCard({ label, value, variant = "neutral" }: { label: string; value: string | number; variant?: keyof typeof tone }) {
  return (
    <Card className={cn("rounded-lg border-t-4 py-4 shadow-none", tone[variant])}>
      <CardContent className="px-4">
        <p className="shell-caps text-[11px] font-bold text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy">{value}</p>
      </CardContent>
    </Card>
  );
}
