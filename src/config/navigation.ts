export type NavItem = { label: string; href: string };
export type Role = "coordinator" | "fto" | "sergeant";

export const NAV: Record<Role, NavItem[]> = {
  coordinator: [
    { label: "Coordinator Dashboard", href: "/coordinator" },
    { label: "Review Desk", href: "/coordinator/review-desk" },
    { label: "Phase Setup", href: "/coordinator/phase-setup" },
    { label: "PO Progress", href: "/coordinator/po-progress" },
    { label: "Probationary Officers", href: "/coordinator/probationary-officers" },
    { label: "FTO Directory", href: "/coordinator/fto-directory" },
    { label: "Monthly Reports", href: "/coordinator/monthly-reports" },
    { label: "Help Desk", href: "/coordinator/help-desk" },
    { label: "Account Settings", href: "/coordinator/account-settings" },
  ],
  fto: [
    { label: "Daily Packet", href: "/fto" },
    { label: "Phase Sign-Up", href: "/fto/phase-sign-up" },
    { label: "Day-Off Coverage", href: "/fto/day-off-coverage" },
    { label: "My Probationary Officer", href: "/fto/my-probationary-officer" },
    { label: "Help Desk", href: "/fto/help-desk" },
    { label: "Account Settings", href: "/fto/account-settings" },
  ],
  sergeant: [
    { label: "Sergeant Dashboard", href: "/sergeant" },
    { label: "Phase Setup", href: "/sergeant/phase-setup" },
    { label: "PO Progress", href: "/sergeant/po-progress" },
    { label: "Help Desk", href: "/sergeant/help-desk" },
  ],
};

export const ROLE_LABEL: Record<Role, string> = {
  coordinator: "FTO Coordinator",
  fto: "Field Training Officer",
  sergeant: "FTO Sergeant",
};
