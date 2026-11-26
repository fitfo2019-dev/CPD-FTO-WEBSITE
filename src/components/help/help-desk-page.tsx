import { PageHeader } from "@/components/portal/page-header";
import { GeographyMapPanel, LawHandbookPanel } from "@/components/help/reference-panels";
import { HelpTopics } from "@/components/help/help-topics";
import type { Role } from "@/lib/portal/application-help";

export function HelpDeskPage({ section, role }: { section: string; role: Role }) {
  return (
    <>
      <PageHeader section={section} title="Help Desk" photo="cruiser-lights" />
      <GeographyMapPanel />
      <LawHandbookPanel />
      <HelpTopics role={role} />
    </>
  );
}
