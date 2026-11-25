import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";

export default function DayOffCoverage() {
  return (
    <>
      <PageHeader section="FTO" title="Day-Off Coverage" />
      <div className="grid gap-5">
      <DataPanel title="Coverage Days" columns={["Date", "PO", "Covering FTO", "Status"]} empty="No coverage days scheduled" />
      </div>
    </>
  );
}
