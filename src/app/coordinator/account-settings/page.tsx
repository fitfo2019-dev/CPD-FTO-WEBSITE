import { DataPanel } from "@/components/portal/data-panel";
import { ProfileForm } from "@/components/admin/fto-pages";

export default function AccountSettings() {
  return (
    <ProfileForm who="coord">
      <DataPanel title="Saved Phrases" columns={["Phrase", "Last Used"]} empty="No saved phrases" />
    </ProfileForm>
  );
}
