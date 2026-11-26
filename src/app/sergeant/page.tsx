import Link from "next/link";
import { PageHeader } from "@/components/portal/page-header";
import { StatCard } from "@/components/portal/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressView } from "@/components/po-progress/progress-view";

// Alerts come from NRT review requests, Week 15 non-release recommendations and FTO phase withdrawals.
// This design copy holds none of those records, so every count is zero until the portal data is connected.
const ALERTS: { key: string; tag: string; text: string; href: string; date: string }[] = [];

export default function SergeantDashboard() {
  const today = new Date().toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric", timeZone: "America/New_York" });
  return (
    <>
      <PageHeader section="FTO Sergeant" title="Sergeant Dashboard" actions={<span className="font-mono text-xs text-muted-foreground">{today}</span>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <StatCard label="Open NRT" value={ALERTS.filter((a) => a.tag === "NRT").length} />
        <StatCard label="Non-Release" value={ALERTS.filter((a) => a.tag === "Non-Release").length} />
        <StatCard label="FTO Withdrawals" value={ALERTS.filter((a) => a.tag === "Withdrawal").length} />
      </div>
      <Card className="mb-6 rounded-lg py-0 shadow-none">
        <CardHeader className="border-b px-5 py-4">
          <CardTitle className="shell-caps text-[13px] font-extrabold text-navy">Alerts</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          {ALERTS.length === 0 ? (
            <p className="px-5 py-4 text-sm text-muted-foreground">None</p>
          ) : (
            <ul className="divide-y text-sm">
              {ALERTS.map((a) => (
                <li key={a.key}>
                  <Link href={a.href} className="flex items-center gap-3 px-5 py-3 hover:bg-canvas">
                    <span className="shell-caps rounded border border-err px-2 py-0.5 text-[11px] font-bold text-err">{a.tag}</span>
                    <span className="min-w-0 flex-1 break-words">{a.text}</span>
                    <span className="font-mono text-xs text-muted-foreground">{a.date}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
      <h2 className="shell-caps mb-3 text-[13px] font-extrabold text-navy">PO Progress</h2>
      <ProgressView />
    </>
  );
}
