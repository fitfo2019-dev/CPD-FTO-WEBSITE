import Image from "next/image";

/** Silver badge with the faint 27 37 mark beside the center seal. */
export function BadgeMark({ height }: { height: number }) {
  return (
    <span className="badge-mark" style={{ height }}>
      <Image src="/badge.png" alt="Columbus Division of Police badge" width={60} height={70} className="h-full w-auto" />
      <span className="badge-mark-num badge-mark-left" aria-hidden="true">27</span>
      <span className="badge-mark-num badge-mark-right" aria-hidden="true">37</span>
    </span>
  );
}
