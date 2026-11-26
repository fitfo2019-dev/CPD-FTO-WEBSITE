export type ClassInfo = { id: string; grad: string; n: number };
export type PO = { cls: string; name: string; badge: string; email: string; phone: string };
export type FTO = {
  name: string;
  badge: string;
  pct: string;
  watch: string;
  email: string;
  phone: string;
  senior: boolean;
  priorPhases: number;
  priorLastEnd: string | null;
};

export const WATCH = ["Day Watch", "Late Watch", "Midwatch"] as const;
export const DEFAULT_WEEKS = [4, 4, 4, 3];
export const MIN_PHASES = 4;
export const MAX_PHASES = 10;
export const PHASE_COLORS = ["#0f2446", "#1d4f91", "#4f7cc0", "#8fb0dc", "#b8923a", "#6b7c93", "#3d5a80", "#98c1d9", "#7a6c5d", "#2a9d8f"];
export const TODAY = "2026-11-25";

export const FORMS = [
  "Substation Orientation",
  "Reporting for Duty",
  "Call for Service",
  "Self-Initiated Run Training",
  "Domestic Incident",
  "Traffic Crash Investigation",
  "Traffic Stop",
  "High-Risk Traffic Stop",
  "Building Search",
  "Building Search Supplement",
  "Arrest Process",
  "OVI Process",
  "Probationary Officer Daily Performance Log",
  "Probationary Officer Weekly Performance Summary",
  "Monthly Performance Summary",
  "Probationary Officer Weekly Performance Log",
  "Weekly Packet Acknowledgement",
];

const FN = ["Marcus", "Tiffany", "Bryce", "Danielle", "Jamal", "Ana Lucía", "Connor", "Priya", "Devon", "Kayla", "Logan", "Simone", "Tyler", "Brianna", "Andre", "Megan", "Carlos", "Hannah", "Isaiah", "Lauren", "Mason", "Jasmine", "Ethan", "Olivia", "DeShawn", "Rachel", "Noah", "Alexis", "Gavin", "Sierra", "Malik", "Emily", "Victor", "Natalie", "Jordan", "Kiara", "Caleb", "Morgan", "Xavier", "Paige"];
const LN = ["Delgado", "Okafor", "McAllister", "Kowalski", "Whitfield", "Ferreira", "O'Neill", "Natarajan", "St. Clair", "Brewer", "Pierce", "Archer", "Novak", "Hughes", "Robinson", "Sullivan", "Mendoza", "Fischer", "Coleman", "Baptiste", "Gallagher", "Nguyen", "Patterson", "Reinhardt", "Abernathy", "Castillo", "Dunlap", "Esposito", "Holbrook", "Iverson", "Jablonski", "Kincaid", "Lombardi", "MacKenzie", "Oyelaran", "Pruitt", "Quintero", "Rasmussen", "Sandoval", "Thibodeaux", "Underwood", "Vasquez", "Whitaker", "Yamamoto", "Zielinski"];
const MI = "ABCDEFGHJKLMNPRSTW";

let seed = 136;
export const rnd = () => {
  seed = (seed * 1103515245 + 12345) % 2147483648;
  return seed / 2147483648;
};
const pick = <T,>(a: readonly T[]) => a[Math.floor(rnd() * a.length)];

export const CLASSES: ClassInfo[] = [
  { id: "Class 137", grad: "2027-03-19", n: 42 },
  { id: "Class 136", grad: "2026-11-20", n: 86 },
  { id: "Class 135", grad: "2026-08-07", n: 81 },
];

export const POS: PO[] = [];
{
  let bdg = 4300;
  const used = new Set<string>();
  CLASSES.slice()
    .reverse()
    .forEach((c) => {
      for (let k = 0; k < c.n; k++) {
        let f: string, l: string, nm: string;
        do {
          f = pick(FN);
          l = pick(LN);
          nm = `${f} ${rnd() < 0.45 ? pick(MI.split("")) + ". " : ""}${l}`;
        } while (used.has(nm));
        used.add(nm);
        bdg += 1;
        POS.push({
          cls: c.id,
          name: nm,
          badge: String(bdg),
          email: `${f[0]}${l.replace(/[^A-Za-z]/g, "")}@example.org`,
          phone: `(614) 555-${String(1000 + Math.floor(rnd() * 8999)).slice(-4)}`,
        });
      }
    });
}

export const FTOS: FTO[] = [];
{
  let fb = 2100;
  const used = new Set<string>();
  for (let k = 0; k < 118; k++) {
    let nm: string;
    do {
      nm = `${rnd() < 0.12 ? "Sgt." : "Ofc."} ${pick(FN)} ${pick(LN)}`;
    } while (used.has(nm));
    used.add(nm);
    fb += 7 + Math.floor(rnd() * 9);
    FTOS.push({ name: nm, badge: String(fb), pct: `Precinct ${1 + Math.floor(rnd() * 20)}`, watch: pick(WATCH), email: "", phone: "", senior: false, priorPhases: 0, priorLastEnd: null });
  }
  FTOS.sort((a, b) => a.name.split(" ").slice(-1)[0].localeCompare(b.name.split(" ").slice(-1)[0]));
}

export const shuffleSeeded = <T,>(a: T[]) => {
  const x = [...a];
  for (let i = x.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [x[i], x[j]] = [x[j], x[i]];
  }
  return x;
};

export const PO_BY: Record<string, PO> = Object.fromEntries(POS.map((p) => [p.badge, p]));
export const FTO_BY: Record<string, FTO> = Object.fromEntries(FTOS.map((f) => [f.badge, f]));
export const ME = FTOS[5].badge;
