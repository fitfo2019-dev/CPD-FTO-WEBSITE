import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";

export default function ReviewDesk() {
  return (
    <>
      <PageHeader section="Coordinator" title="Review Desk" />
      <div className="grid gap-5">
      <DataPanel title="Submitted Packets" columns={["PO", "FTO", "Phase · Week", "Packet", "Submitted", "Status"]} empty="No submitted packets" />
      </div>
    </>
  );
}
