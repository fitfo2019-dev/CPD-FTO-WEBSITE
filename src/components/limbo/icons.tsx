export function LockIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <rect x="3" y="7" width="10" height="7" rx="1.5" fill="currentColor" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function WarnIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
      <path d="M8 1.5 15 14H1z" fill="currentColor" />
      <rect x="7.2" y="5.5" width="1.6" height="4.5" fill="#fff" />
      <rect x="7.2" y="11" width="1.6" height="1.6" fill="#fff" />
    </svg>
  );
}

export function Steps({ n }: { n: number }) {
  return (
    <div className="mstep" aria-hidden="true">
      {[1, 2, 3].map((i) => (
        <span key={i} className={i < n ? "done" : i === n ? "cur" : ""}>{i}</span>
      ))}
    </div>
  );
}

export function SummaryList({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-1.5 rounded-md bg-canvas p-3 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="shell-caps text-[11px] font-bold text-muted-foreground">{k}</dt>
          <dd className="break-words">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
