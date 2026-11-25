import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";

export default function PhaseSignUp() {
  return (
    <>
      <PageHeader section="FTO" title="Phase Sign-Up" />
      <div className="grid gap-5">
      <DataPanel title="Open Phases" columns={["Phase", "Start", "End", "Sign-Up Closes", "Status"]} empty="No open sign-ups" />
      </div>
    </>
  );
}
