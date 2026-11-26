/** Division photographs (public records) used for screen-only page banners. */
export type PhotoKey =
  | "graduation-oath"
  | "cruiser-skyline"
  | "cruiser-dusk"
  | "officers-portrait"
  | "recruit-run"
  | "new-officers"
  | "class-seated"
  | "cruiser-lights";

const PHOTOS: Record<PhotoKey, { alt: string; position: string }> = {
  "graduation-oath": { alt: "Columbus police recruits taking the oath at graduation", position: "50% 35%" },
  "cruiser-skyline": { alt: "Columbus police cruiser in front of the downtown skyline", position: "50% 60%" },
  "cruiser-dusk": { alt: "Columbus police cruiser at dusk", position: "50% 55%" },
  "officers-portrait": { alt: "Columbus police officers in dress uniform", position: "50% 30%" },
  "recruit-run": { alt: "Columbus police recruits on a training run", position: "50% 40%" },
  "new-officers": { alt: "New Columbus police officers in formation", position: "50% 30%" },
  "class-seated": { alt: "Columbus police recruit class seated in uniform", position: "50% 40%" },
  "cruiser-lights": { alt: "Police cruiser light bar at night", position: "50% 55%" },
};

export function photo(key: PhotoKey) {
  return { src: `/photos/${key}.webp`, ...PHOTOS[key] };
}

export const HOME_PHOTOS: PhotoKey[] = ["graduation-oath", "new-officers", "recruit-run", "class-seated"];
