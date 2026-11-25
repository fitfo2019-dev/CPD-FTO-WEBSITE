import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";

export default function MonthlyReports() {
  return (
    <>
      <PageHeader section="Coordinator" title="Monthly Reports" />
      <div className="grid gap-5">
      <DataPanel title="Exports" columns={["Report", "Period", "Class", "Generated"]} empty="No reports generated" />
      </div>
    </>
  );
}
