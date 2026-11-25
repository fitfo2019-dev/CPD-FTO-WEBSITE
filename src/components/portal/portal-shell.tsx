import type { Role } from "@/config/navigation";
import { MobileBar, Sidebar } from "@/components/portal/sidebar";

export function PortalShell({ role, children }: { role: Role; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileBar role={role} />
        <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 pb-24 pt-6 sm:px-8">{children}</main>
      </div>
    </div>
  );
}
