import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";

export default function MyProbationaryOfficer() {
  return (
    <>
      <PageHeader section="FTO" title="My Probationary Officer" />
      <div className="grid gap-5">
      <DataPanel title="Assignment" columns={["PO", "Badge", "Class", "Phase", "Week"]} empty="No probationary officer assigned" />
      <DataPanel title="Packets" columns={["Date", "Packet", "Status"]} empty="No packets" />
      </div>
    </>
  );
}
