import { PortalShell } from "@/components/portal/portal-shell";

export default function SergeantLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="sergeant">{children}</PortalShell>;
}
