"use client";

import { useMemo, useState } from "react";
import { getApplicationHelpTopicsForRole, type Role } from "@/lib/portal/application-help";
import { cn } from "@/lib/utils";

export function HelpTopics({ role }: { role: Role }) {
  const topics = useMemo(() => getApplicationHelpTopicsForRole(role), [role]);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(topics[0]?.id ?? "");
  const matches = useMemo(() => {
    const needle = query.trim().toLocaleLowerCase();
    return topics.filter((t) => !needle || `${t.title} ${t.keywords} ${t.steps.join(" ")} ${t.expectedResult} ${t.recovery}`.toLocaleLowerCase().includes(needle));
  }, [topics, query]);
  const selected = matches.find((t) => t.id === selectedId) ?? matches[0];

  return (
    <section id="application-help" className="mb-5 overflow-hidden rounded-lg border bg-card" aria-label="Help Desk topics" data-testid="section-application-help">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
        <h2 className="shell-caps text-[15px] font-extrabold text-navy">Application Help</h2>
        <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search saving, access, packets…"
          aria-label="Search Help Desk topics" className="h-10 w-full rounded-md border bg-background px-3 text-sm sm:max-w-sm" />
      </header>
      <div className="grid md:grid-cols-[minmax(14rem,.72fr)_minmax(0,1.7fr)]">
        <nav aria-label="Help Desk topic list" className="border-b bg-canvas/60 p-2 md:border-b-0 md:border-r">
          <div className="grid grid-cols-2 gap-1 md:grid-cols-1">
            {matches.map((t) => (
              <button key={t.id} type="button" onClick={() => setSelectedId(t.id)} aria-pressed={selected?.id === t.id}
                className={cn("min-h-10 rounded-md border-l-4 px-3 text-left text-sm",
                  selected?.id === t.id ? "border-navy bg-white font-semibold text-navy" : "border-transparent hover:bg-white")}>
                {t.title}
              </button>
            ))}
          </div>
        </nav>
        <article className="min-w-0 p-5" aria-live="polite">
          {selected ? (
            <>
              <h3 className="border-b pb-3 text-lg font-extrabold text-navy">{selected.title}</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <section className="rounded-md border bg-canvas/50 p-3">
                  <h4 className="shell-caps mb-2 text-[11px] font-bold text-muted-foreground">Steps</h4>
                  <ol className="list-decimal space-y-1 pl-5 text-sm leading-relaxed">{selected.steps.map((s) => <li key={s}>{s}</li>)}</ol>
                </section>
                <section className="rounded-md border bg-canvas/50 p-3">
                  <h4 className="shell-caps mb-2 text-[11px] font-bold text-muted-foreground">Expected result</h4>
                  <p className="text-sm leading-relaxed">{selected.expectedResult}</p>
                </section>
                <section className="rounded-md border bg-canvas/50 p-3 sm:col-span-2">
                  <h4 className="shell-caps mb-2 text-[11px] font-bold text-muted-foreground">Recovery</h4>
                  <p className="text-sm leading-relaxed">{selected.recovery}</p>
                </section>
              </div>
            </>
          ) : (
            <p className="py-10 text-sm text-muted-foreground" role="status">None</p>
          )}
        </article>
      </div>
    </section>
  );
}
