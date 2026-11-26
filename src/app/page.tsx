import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ClipboardCheck, LayoutDashboard, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { BadgeMark } from "@/components/portal/badge-mark";
import { HomePhotos } from "@/components/portal/home-photos";

const JOURNEY = ["Academy", "Phase I", "Phase II", "Phase III", "Phase IV", "Probationary Phase"];

const ROLES = [
  { href: "/coordinator", title: "FTO Coordinator", icon: LayoutDashboard, items: ["Review Desk", "Phase Setup", "PO Progress", "Monthly Reports"] },
  { href: "/fto", title: "Field Training Officer", icon: ClipboardCheck, items: ["Daily Packet", "Phase Sign-Up", "Day-Off Coverage", "My Probationary Officer"] },
  { href: "/sergeant", title: "FTO Sergeant", icon: ShieldCheck, items: ["Sergeant Dashboard", "Phase Setup", "PO Progress", "Help Desk"] },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      <HomePhotos>
        <div className="mx-auto flex max-w-[1100px] flex-col items-center gap-6 px-4 py-12 text-center sm:py-16">
          <div className="flex items-center gap-[22px]">
            <BadgeMark height={64} />
            <span aria-hidden="true" className="h-12 w-px bg-white/40" />
            <Image src="/patch.png" alt="Columbus Division of Police patch" width={60} height={70} className="h-[64px] w-auto" />
          </div>
          <div className="rounded-md bg-white px-4 py-3">
            <Image src="/wm.png" alt="The City of Columbus" width={220} height={62} priority className="h-auto w-[190px] sm:w-[220px]" />
          </div>
          <div>
            <p className="shell-caps text-[12px] font-semibold text-white/75">Columbus Division of Police</p>
            <h1 className="shell-caps mt-2 text-3xl font-extrabold text-white sm:text-4xl">Field Training Portal</h1>
          </div>
          <ol className="home-journey">{JOURNEY.map((step) => <li key={step}>{step}</li>)}</ol>
        </div>
      </HomePhotos>
      <main className="mx-auto -mt-8 grid max-w-[1100px] gap-5 px-4 pb-16 md:grid-cols-3">
        {ROLES.map(({ href, title, icon: Icon, items }) => (
          <Link key={href} href={href} className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
            <Card className="h-full rounded-lg shadow-sm transition-shadow group-hover:shadow-md">
              <CardContent className="flex h-full flex-col gap-5 p-6">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-md bg-navy text-white">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-1" aria-hidden />
                </div>
                <h2 className="shell-caps text-lg font-extrabold text-navy">{title}</h2>
                <ul className="grid grid-cols-2 gap-2">
                  {items.map((i) => (
                    <li key={i} className="shell-caps rounded-md border bg-canvas px-3 py-2 text-[11px] font-bold text-ink">{i}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </Link>
        ))}
      </main>
    </div>
  );
}
