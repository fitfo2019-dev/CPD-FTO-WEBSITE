import { PortalShell } from "@/components/portal/portal-shell";

export default function FtoLayout({ children }: { children: React.ReactNode }) {
  return <PortalShell role="fto">{children}</PortalShell>;
}
