import { PageHeader } from "@/components/portal/page-header";
import { UnlockRequestsPanel } from "@/components/limbo/unlock-requests-panel";
import { ReviewDeskPackets } from "@/components/admin/coord-pages";

export default function ReviewDesk() {
  return (
    <>
      <PageHeader section="Coordinator" title="Review Desk" />
      <div className="grid grid-cols-[minmax(0,1fr)] gap-5">
        <UnlockRequestsPanel />
        <ReviewDeskPackets />
      </div>
    </>
  );
}
