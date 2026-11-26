import { PageHeader } from "@/components/portal/page-header";
import { ProgressView } from "@/components/po-progress/progress-view";

export default function PoProgress() {
  return (
    <>
      <PageHeader section="Coordinator" title="PO Progress" photo="cruiser-skyline" />
      <ProgressView coordinatorScope />
    </>
  );
}
