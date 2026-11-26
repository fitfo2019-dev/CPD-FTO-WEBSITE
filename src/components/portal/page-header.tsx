import { photo, type PhotoKey } from "@/lib/photos";

export function PageHeader({ section, title, actions, photo: photoKey }: { section: string; title: string; actions?: React.ReactNode; photo?: PhotoKey }) {
  if (!photoKey) {
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
  const img = photo(photoKey);
  return (
    <div className="page-hero mb-6" data-testid="page-hero">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="page-hero-photo" src={img.src} alt="" aria-hidden="true" style={{ objectPosition: img.position }} decoding="async" />
      <div className="page-hero-body flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="shell-caps text-[11px] font-semibold">{section}</p>
          <h1 className="shell-caps mt-1 text-2xl font-extrabold sm:text-3xl">{title}</h1>
        </div>
        {actions}
      </div>
    </div>
  );
}
