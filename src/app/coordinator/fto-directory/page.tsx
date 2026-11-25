import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";

export default function FtoDirectory() {
  return (
    <>
      <PageHeader section="Coordinator" title="FTO Directory" />
      <div className="grid gap-5">
      <DataPanel title="Field Training Officers" columns={["FTO", "Badge", "Precinct", "Watch", "Senior", "Current PO"]} empty="No field training officers" />
      </div>
    </>
  );
}
