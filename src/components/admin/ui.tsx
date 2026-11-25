"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

let msg = "";
let timer: ReturnType<typeof setTimeout> | undefined;
const subs = new Set<() => void>();
export function toast(m: string) {
  msg = m;
  subs.forEach((l) => l());
  clearTimeout(timer);
  timer = setTimeout(() => {
    msg = "";
    subs.forEach((l) => l());
  }, 1800);
}
function Toaster() {
  const m = useSyncExternalStore(
    (l) => {
      subs.add(l);
      return () => subs.delete(l);
    },
    () => msg,
    () => "",
  );
  return m ? (
    <div className="ap-toast" role="status" aria-live="polite">
      {m}
    </div>
  ) : null;
}

export function AdminPage({ children }: { children: React.ReactNode }) {
  return (
    <div className="ap">
      {children}
      <Toaster />
    </div>
  );
}

export function Tag({ k, children }: { k?: "ok" | "w" | "e" | "rp"; children: React.ReactNode }) {
  return <span className={`tag ${k || "n"}`}>{children}</span>;
}

export function Card({ title, right, children, pad = true, id }: { title: React.ReactNode; right?: React.ReactNode; children: React.ReactNode; pad?: boolean; id?: string }) {
  return (
    <section className="card" id={id}>
      <div className="card-h">
        <h2>{title}</h2>
        {right ? <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>{right}</div> : null}
      </div>
      <div style={pad ? { padding: 18 } : undefined}>{children}</div>
    </section>
  );
}

export function Modal({ open, title, onClose, children, footer, wide }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode; footer?: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="mbox" role="dialog" aria-modal="true" aria-label={title} style={wide ? { width: "min(720px,100%)" } : undefined}>
        <div className="mh">
          <h2>{title}</h2>
          <button className="x" aria-label="Close" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="mb">{children}</div>
        {footer ? <div className="mf">{footer}</div> : null}
      </div>
    </div>
  );
}

export function PoChecklist({ items, picked, setPicked }: { items: { badge: string; name: string }[]; picked: string[]; setPicked: (v: string[]) => void }) {
  const [q, setQ] = useState("");
  const t = q.toLowerCase();
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div className="toolbar">
        <input type="search" className="srch" placeholder="Search name or badge" aria-label="Search probationary officers" value={q} onChange={(e) => setQ(e.target.value)} />
        <span className="cnt">{picked.length} Selected</span>
      </div>
      <div className="polist">
        {items
          .filter((p) => !t || (p.name + " " + p.badge).toLowerCase().includes(t))
          .map((p) => (
            <label key={p.badge}>
              <input
                type="checkbox"
                checked={picked.includes(p.badge)}
                onChange={(e) => setPicked(e.target.checked ? [...picked, p.badge] : picked.filter((b) => b !== p.badge))}
              />
              <span className="data">{p.name}</span>
              <span className="b mono">#{p.badge}</span>
            </label>
          ))}
      </div>
    </div>
  );
}

export function PersonCell({ name, badge }: { name: string; badge: string }) {
  return (
    <td className="data">
      <b>{name}</b> <span className="mono" style={{ color: "var(--muted)" }}>#{badge}</span>
    </td>
  );
}
