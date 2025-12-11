## Findings
- Theme source: `src/index.css:111-115` forces a dark gradient when the OS is in dark mode, producing Image 1 instead of the light design in Image 2.
- Layout container: `src/components/Layout.tsx:41-45` uses `min-h-screen bg-white` but the body dark override wins; `max-w-lg` constrains width and creates mismatched spacing vs design.
- Bottom nav: `src/components/Layout.tsx:47-85` renders a bordered bar without the glass blur, central CTA, or home indicator shown in Image 2; `flare-oasis/client/pages/Index.tsx:462-513` implements the intended nav style.
- Working Hours card: Current card in `src/pages/Home.tsx:98-122` is close but progress thickness and colors differ slightly; top-right total time binds to live stats; Image 2’s counts are static there. Progress component exists as `flare-oasis/client/components/ui/progress.tsx`.
- Checklist & CTA: `src/pages/Home.tsx:124-157` uses simple rows and omits the big CTA button; Image 2 expects an accordion-like header with a primary full-width CTA (`flare-oasis/client/pages/Index.tsx:166-231`).
- Week calendar: `src/pages/Home.tsx:159-181` uses a bordered pill grid with a single dot; Image 2 shows a horizontal scroll list with two dots and active day styling (`flare-oasis/client/pages/Index.tsx:245-283`).
- Quick actions: `src/pages/Home.tsx:183-218` shows three task cards; Image 2 displays one prominent CTA instead of multiple cards in that position.
- Component hierarchy: App renders screens from `src/App.tsx:18-26` within `Layout`; none of the `flare-oasis/client/components/ui/*` are used in `src`, so the implementation doesn’t benefit from the shared design system.
- Responsiveness: `Layout`’s `max-w-lg` and fixed `h-16` nav differ from the light design’s safe-area-aware, glass nav and bottom input (`flare-oasis/client/pages/Index.tsx:438-459`).

## Recommendations
- Theme alignment
  - Remove or scope the dark background override: replace `@media (prefers-color-scheme: dark) body { ... }` with a `.dark body { ... }` rule and keep default light background (`src/index.css`).
  - Set `meta name="color-scheme"` to `light` if you want to lock Image 2’s look regardless of OS.
- Adopt flare-oasis UI components in `src`
  - Install and configure Tailwind in the root app, mirroring `flare-oasis/tailwind.config.ts` and importing `flare-oasis/client/global.css`.
  - Use `Accordion`, `Progress`, `Card`, `Button` from `flare-oasis/client/components/ui` inside `src/pages/Home.tsx` to match styling and spacing.
- Bottom navigation refactor
  - Update `src/components/Layout.tsx` to the glass-blur nav with a central round CTA and home indicator, following `flare-oasis/client/pages/Index.tsx:462-513` while preserving existing routes and `HapticFeedback`.
- Working Hours card polish
  - Replace the custom bar with `Progress` (`flare-oasis/client/components/ui/progress.tsx`) and keep `stats.progress` binding; ensure colors match `tempo` palette in `global.css`.
  - Keep the dynamic time `stats.todayHours` / `stats.todayMins` at the right of the header.
- Checklist & CTA
  - Use `Accordion` for the “Getting started first!” group; add a full-width primary button “Set your first working task” that navigates to `/visit`.
- Week calendar
  - Switch to a horizontal scroll list with active-day styling and two status dots as in `flare-oasis/client/pages/Index.tsx:245-283`.
- Responsiveness & safe areas
  - Use safe-area paddings (`env(safe-area-inset-*)`) already defined in `src/index.css`; update container widths to match mobile guidelines and ensure `pb-32` accommodates the glass nav.

## Implementation Steps
1. Theme: edit `src/index.css` to scope dark mode to a `.dark` class or remove the dark gradient override; default to light.
2. Tailwind: add Tailwind to the root project and configure `content` to include `src/**/*.{ts,tsx}` and `flare-oasis/client/components/**/*.{ts,tsx}`; import `flare-oasis/client/global.css` once.
3. Layout: refactor `src/components/Layout.tsx` to the glass-blur bottom nav with central CTA; keep existing `navItems` and routing.
4. Home screen: replace the custom progress with `Progress`; convert checklist to `Accordion`; add the full-width CTA; adjust the week calendar to the horizontal style.
5. Keep all data bindings (`useEntity`, `stats`, `navigate`) unchanged so existing functions continue to work.

## Verification
- Run the app with OS in both light and dark to ensure the UI remains in the Image 2 style (light) unless `.dark` is explicitly set.
- Confirm sections visually:
  - Header and date typography and spacing match Image 2.
  - Working Hours card has the correct progress thickness and tint, and time at right.
  - “Getting started first!” shows three rows with chevrons and a primary CTA.
  - Week calendar scrolls horizontally and shows two dots; active day is styled.
  - Bottom nav is glass-blurred with central CTA and home indicator.
- Navigate CTA and checklist rows to `/visit`, `/trips`, `/expenses` and ensure `HapticFeedback` triggers and data flows (`useEntity`) remain intact.
- Optional: capture screenshots via the existing `scripts/generate-screenshot.js` and compare against Image 2; test multiple viewport widths to verify responsiveness.

If you approve, I will implement these changes in `src` using the components from `${Folder:fla}` and verify with screenshots and local run.