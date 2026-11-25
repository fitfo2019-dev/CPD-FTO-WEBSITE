import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";

export default function ProbationaryOfficers() {
  return (
    <>
      <PageHeader section="Coordinator" title="Probationary Officers" />
      <div className="grid gap-5">
      <DataPanel title="Roster" columns={["PO", "Badge", "Class", "Phase", "FTO", "Status"]} empty="No probationary officers" />
      </div>
    </>
  );
}
