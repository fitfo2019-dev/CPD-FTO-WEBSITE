export function PageHeader({ section, title, actions }: { section: string; title: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="shell-caps text-[11px] font-semibold text-muted-foreground">{section}</p>
        <h1 className="shell-caps mt-1 text-2xl font-extrabold text-navy">{title}</h1>
      </div>
      {actions}
    </div>
  );
}
