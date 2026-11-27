"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { NAV, ROLE_LABEL, type Role } from "@/config/navigation";
import { Brand } from "@/components/portal/brand";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

function NavLinks({ role }: { role: Role }) {
  const pathname = usePathname();
  const root = `/${role}`;
  return (
    <nav aria-label="Portal" className="flex flex-col gap-1 px-3">
      {NAV[role].map((item) => {
        if (item.disabled) {
          return (
            <span
              key={item.href}
              aria-disabled="true"
              className="shell-caps cursor-default rounded-md px-3 py-2.5 text-[12px] font-bold text-white/85"
            >
              {item.label}
            </span>
          );
        }
        const active = item.href === root ? pathname === root : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "shell-caps rounded-md px-3 py-2.5 text-[12px] font-bold transition-colors focus-visible:outline-2 focus-visible:outline-white",
              active ? "bg-white text-navy" : "text-white/85 hover:bg-navy-2 hover:text-white",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function RoleFooter({ role }: { role: Role }) {
  return (
    <div className="border-t border-white/10 px-5 py-4">
      <p className="shell-caps text-[12px] font-bold text-white">{ROLE_LABEL[role]}</p>
      <p className="shell-caps text-[11px] text-white/65">Field Training Office</p>
    </div>
  );
}

export function Sidebar({ role }: { role: Role }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[232px] shrink-0 flex-col bg-navy lg:flex">
      <div className="border-b border-white/10 px-4 py-5">
        <Brand />
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <NavLinks role={role} />
      </div>
      <RoleFooter role={role} />
    </aside>
  );
}

export function MobileBar({ role }: { role: Role }) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-navy px-4 py-3 lg:hidden">
      <span className="shell-caps text-[12px] font-bold text-white">Field Training Office</span>
      <Sheet>
        <SheetTrigger
          aria-label="Open menu"
          className="rounded-md p-2 text-white hover:bg-navy-2 focus-visible:outline-2 focus-visible:outline-white"
        >
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-[260px] border-none bg-navy p-0 text-white">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <div className="border-b border-white/10 px-4 py-5">
            <Brand compact />
          </div>
          <div className="py-4">
            <NavLinks role={role} />
          </div>
          <RoleFooter role={role} />
        </SheetContent>
      </Sheet>
    </header>
  );
}
