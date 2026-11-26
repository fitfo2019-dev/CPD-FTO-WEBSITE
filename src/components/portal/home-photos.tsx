"use client";
import { useEffect, useState } from "react";
import { HOME_PHOTOS, photo } from "@/lib/photos";

/** Rotating Division photographs behind the home header. */
export function HomePhotos({ children }: { children: React.ReactNode }) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % HOME_PHOTOS.length), 6000);
    return () => window.clearInterval(timer);
  }, []);
  return (
    <header className="home-photos">
      {HOME_PHOTOS.map((key, i) => {
        const p = photo(key);
        // eslint-disable-next-line @next/next/no-img-element
        return <img key={key} src={p.src} alt={i === index ? p.alt : ""} aria-hidden={i !== index} className={`home-photo${i === index ? " is-active" : ""}`} style={{ objectPosition: p.position }} decoding="async" />;
      })}
      <div className="home-photos-body">{children}</div>
    </header>
  );
}
