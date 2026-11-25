import { PortalShell } from "@/components/portal/portal-shell";

export default function CoordinatorLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="coordinator">{children}</PortalShell>;
}
