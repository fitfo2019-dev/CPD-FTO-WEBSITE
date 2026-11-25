import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";
import { StatCard } from "@/components/portal/stat-card";

export default function CoordinatorDashboard() {
  return (
    <>
      <PageHeader section="Coordinator" title="Coordinator Dashboard" />
      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Active POs" value={0} />
        <StatCard label="Awaiting Review" value={0} />
        <StatCard label="Struggling" value={0} variant="err" />
        <StatCard label="Watch" value={0} variant="warn" />
      </div>
      <div className="grid gap-5">
        <DataPanel title="Review Queue" columns={["PO", "FTO", "Packet", "Submitted", "Status"]} empty="No packets awaiting review" />
        <DataPanel title="Alerts" columns={["PO", "FTO", "Item", "Date"]} empty="No alerts" />
      </div>
    </>
  );
}
