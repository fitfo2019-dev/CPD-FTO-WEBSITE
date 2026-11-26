"use client";

import { useState } from "react";
import { ExternalLink, MapPinned, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

const MAP_VIEWER_URL = "https://www.google.com/maps/d/u/0/viewer?mid=10NvwFmOwuUJTVQGQ2Jh1EIboXP0&ll=39.95032723201076%2C-82.92253150906822&z=11";
const MAP_EMBED_URL = "https://www.google.com/maps/d/embed?mid=10NvwFmOwuUJTVQGQ2Jh1EIboXP0&ll=39.95032723201076%2C-82.92253150906822&z=11";
const HANDBOOK_ROOT = "/law-handbook/index.html";
const WORKBOOKS = {
  ohio: { label: "Ohio Revised Code", src: HANDBOOK_ROOT },
  columbus: { label: "Columbus City Code", src: `${HANDBOOK_ROOT}?workbook=columbus` },
} as const;
type Workbook = keyof typeof WORKBOOKS;

function PanelHead({ icon, eyebrow, title, href, linkLabel, children }: {
  icon: React.ReactNode; eyebrow: string; title: string; href: string; linkLabel: string; children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3 border-b px-5 py-4">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-navy text-white" aria-hidden>{icon}</span>
        <div className="min-w-0">
          <p className="shell-caps text-[11px] font-semibold text-muted-foreground">{eyebrow}</p>
          <h2 className="shell-caps text-[15px] font-extrabold text-navy">{title}</h2>
          {children}
        </div>
      </div>
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="shell-caps inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-[11px] font-bold text-navy hover:bg-canvas">
        <ExternalLink className="size-4" aria-hidden /> {linkLabel}
      </a>
    </header>
  );
}

export function GeographyMapPanel() {
  return (
    <section className="mb-5 overflow-hidden rounded-lg border bg-card" aria-label="Columbus Police Geography Map" data-testid="section-geography-map">
      <PanelHead icon={<MapPinned className="size-5" />} eyebrow="Geography reference" title="Columbus Police Geography Map" href={MAP_VIEWER_URL} linkLabel="Open Original Map" />
      <iframe src={MAP_EMBED_URL} title="Interactive Columbus Police Geography Map" loading="lazy" allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin" className="block h-[520px] w-full border-0" />
    </section>
  );
}

export function LawHandbookPanel() {
  const [workbook, setWorkbook] = useState<Workbook>("ohio");
  const active = WORKBOOKS[workbook];
  return (
    <section className="mb-5 overflow-hidden rounded-lg border bg-card" aria-label="Ohio and Columbus Law Handbook" data-testid="section-law-handbook">
      <PanelHead icon={<Scale className="size-5" />} eyebrow="Law reference" title="Ohio and Columbus Law Handbook" href={active.src} linkLabel="Open Full Page">
        <div className="mt-2 flex flex-wrap gap-1" role="tablist" aria-label="Workbook">
          {(Object.keys(WORKBOOKS) as Workbook[]).map((key) => (
            <button key={key} type="button" role="tab" aria-selected={workbook === key} onClick={() => setWorkbook(key)}
              className={cn("shell-caps rounded-md border px-3 py-1.5 text-[11px] font-bold",
                workbook === key ? "border-navy bg-navy text-white" : "text-navy hover:bg-canvas")}>
              {WORKBOOKS[key].label}
            </button>
          ))}
        </div>
      </PanelHead>
      <iframe key={workbook} src={active.src} title={`${active.label} search`} loading="lazy" className="block h-[720px] w-full border-0" />
    </section>
  );
}
