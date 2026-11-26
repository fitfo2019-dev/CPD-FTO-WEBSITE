import { PhaseSetup } from "@/components/admin/phase-setup";

export default async function PhaseSetupPage({ searchParams }: { searchParams: Promise<{ class?: string }> }) {
  const { class: cls } = await searchParams;
  return <PhaseSetup key={cls || ""} initialClass={cls} section="FTO Sergeant" />;
}
