import { PageHeader } from "@/components/portal/page-header";
import { DataPanel } from "@/components/portal/data-panel";
import { ActionBar } from "@/components/portal/action-bar";
import { Button } from "@/components/ui/button";

export default function PhaseSetup() {
  return (
    <>
      <PageHeader section="Coordinator" title="Phase Setup" />
      <div className="grid gap-5">
        <DataPanel title="Phase Calendar" columns={["Phase", "Start", "End", "Limbo Days", "Sign-Up Window"]} empty="No phases scheduled" />
        <DataPanel title="PO Assignments" columns={["PO", "Badge", "FTO", "Precinct", "Watch"]} empty="No assignments" />
      </div>
      <ActionBar>
        <Button variant="outline" className="shell-caps h-10 px-5 font-bold">Save Draft</Button>
        <Button className="shell-caps h-10 px-5 font-bold" disabled>Publish Phase</Button>
      </ActionBar>
    </>
  );
}
