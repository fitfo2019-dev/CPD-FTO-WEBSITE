# CPD Field Training Portal

Next.js 15 (App Router, TypeScript), Tailwind CSS 4 and shadcn/ui.

## Structure

- `src/app/page.tsx` – landing page with role entry
- `src/app/coordinator/*` – Coordinator Dashboard, Review Desk, Phase Setup, PO Progress, Probationary Officers, FTO Directory, Monthly Reports, Account Settings
- `src/app/fto/*` – Daily Packet, Phase Sign-Up, Day-Off Coverage, My Probationary Officer, Account Settings
- `src/components/portal/*` – navy sidebar shell, mobile menu, page header, stat cards, data panels, bottom action bar
- `src/components/ui/*` – shadcn/ui components
- `src/config/navigation.ts` – sidebar links per role
- `src/config/categories.ts` – the 30 performance categories and RT eligibility
- `src/app/globals.css` – design tokens (navy #0f2446, rating colors, Public Sans)

## Develop

```bash
pnpm install
pnpm dev
```
