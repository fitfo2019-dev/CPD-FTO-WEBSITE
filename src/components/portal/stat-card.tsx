import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tone = { neutral: "border-t-line", err: "border-t-err", warn: "border-t-[#e2b007]", ok: "border-t-ok" } as const;

export function StatCard({
  label,
  value,
  variant = "neutral",
  onClick,
  active = false,
}: {
  label: string;
  value: string | number;
  variant?: keyof typeof tone;
  onClick?: () => void;
  active?: boolean;
}) {
  const body = (
    <Card className={cn("h-full rounded-lg border-t-4 py-4 shadow-none", tone[variant], onClick && "transition group-hover:shadow-md", active && "ring-2 ring-navy")}>
      <CardContent className="px-4">
        <p className="shell-caps text-[11px] font-bold text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-extrabold tabular-nums text-navy">{value}</p>
      </CardContent>
    </Card>
  );
  if (!onClick) return body;
  return (
    <button type="button" onClick={onClick} aria-pressed={active} className="group rounded-lg text-left focus-visible:outline-2 focus-visible:outline-navy">
      {body}
    </button>
  );
}
