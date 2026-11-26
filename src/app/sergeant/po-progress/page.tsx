import { PageHeader } from "@/components/portal/page-header";
import { ProgressView } from "@/components/po-progress/progress-view";

export default function Page() {
  return (
    <>
      <PageHeader section="FTO Sergeant" title="PO Progress" photo="cruiser-skyline" />
      <ProgressView />
    </>
  );
}
