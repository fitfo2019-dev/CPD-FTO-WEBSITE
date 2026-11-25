import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AccountSettings() {
  return (
    <>
      <PageHeader section="Account" title="Account Settings" />
      <div className="grid gap-5 md:grid-cols-2">
        <Card className="rounded-lg shadow-none">
          <CardHeader className="border-b">
            <CardTitle className="shell-caps text-[13px] font-extrabold text-navy">Profile</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              {["Name", "Badge", "Precinct", "Watch", "Assignment"].map((k) => (
                <div key={k} className="contents">
                  <dt className="shell-caps text-[11px] font-bold text-muted-foreground">{k}</dt>
                  <dd>—</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
        <DataPanel title="Saved Phrases" columns={["Phrase", "Last Used"]} empty="No saved phrases" />
      </div>
    </>
  );
}
