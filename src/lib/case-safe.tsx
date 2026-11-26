import type { ReactNode } from "react";

/** Keeps the possessive/plural "’s" lowercase inside uppercase shell labels (PO’s, UA’s, FTO’s). */
export function caseSafe(text: ReactNode): ReactNode {
  if (typeof text !== "string" || !/[’']s\b/.test(text)) return text;
  const parts = text.split(/([’']s)\b/);
  return <span>{parts.map((part, index) => (/^[’']s$/.test(part) ? <span key={index} className="normal-case">{part}</span> : part))}</span>;
}
