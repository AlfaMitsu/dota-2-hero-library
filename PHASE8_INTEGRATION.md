# Phase 8 — My Library / Personalization (staged)

**Status: committed to this GitHub branch, NOT deployed to production.**

Latest confirmed original live deployment before Phase 8:
- Vercel project: `prj_pdQDYxU5efK0v8zWkWXyAQaRBFNB`
- Team: `team_UipHa7EsPuQtnIlUZCvUgch5`
- Phase 7 production deployment: `dpl_724ufNE27PndvHQUyLwgvKiq1vXn`
- Live URL: https://dota-2-hero-library.vercel.app

On November 10, 2026, Vercel rejected an additional deployment request with **HTTP 402, `api-deployments-free-per-day`, retry-after 86,400 seconds**. The authorized CLI fallback was unavailable (no local Vercel CLI/session credentials). No new Phase 8 deployment has been reported as successful.

## Staged source files

- `public/phase8.js` — My Library, saved Hero Lab builds and 5v5 draft presets, homepage preferences, pinned heroes, local backup/import, device-transfer links, cosmetics preview integration and customizable share-card UI.
- `public/phase8.css` — responsive dashboard controls and non-destructive gallery appearance preferences.
- `app/api/phase8/card/route.ts` — 1200×630 SVG card endpoint with hero validation and sanitized accent/style/tagline parameters.
- `scripts/phase8-smoke.cjs` — browser regression checks, intended to run only after a future successful deployment.

The client JavaScript was checked with `new Function(...)` and passed syntax parsing. This is **not** a replacement for a full Next.js production build or browser regression test.

## Required safe integration into the *latest live source*, not the older GitHub main

1. Start from the file tree of the **current production deployment**, not this old GitHub branch's `main` source; it is missing some Vercel-only Phase 1–7 changes.
2. Add the three staged application files, preserving all files already deployed.
3. In the existing `app/layout.tsx`, add `import "../public/phase8.css";` alongside the existing Phase 1–7 CSS imports.
4. Append `"phase8"` to the existing `scripts` list used by Next.js `<Script src={"/"+id+".js"} strategy="lazyOnload"/>`.
5. Keep the original portrait routing, permanent 360° viewer, Hero Lab, Strategy Hub, Hero Studio and Phase 7 scripts untouched.
6. Build a preview, then verify all of the Phase 8 UI and API paths. Run `node scripts/phase8-smoke.cjs` (requires Playwright and its Chromium browser).
7. Deploy the same verified source to production, test all 127 portraits, and inspect Vercel runtime errors.

**Do not deploy this staging branch directly or merge it wholesale into main.** The GitHub `main` branch has not yet been fully synchronized with the Vercel-only app features.

## Features and accurate scope

The existing local storage keys are reused:
- `dota-lab-v2-<Hero Name>` for Hero Lab state.
- `dota-competitive-draft-v7` for the complete draft simulator.
- `dota-hero-favorites` for favorites.
- `dota-phase8-v1` for homepage preferences and saved presets.

Full JSON export/import is supported in the code. A shorter transfer link carries pinned heroes, favorites and appearance preferences, with user confirmation before import. **No account sign-in or automatic cloud sync** is configured because the project does not have an authenticated user store and secure database.

The cosmetics panel offers an optional community loadout preview at `loadout.nyan.cafe`. The site and its item assets are outside this application's control; iframe embedding may be blocked by that site's policies. There is a separate open-in-new-tab fallback. The existing native 360° viewer is preserved.

SVG cards are customizable by hero, one of five accent palettes, minimal/cinematic layout, and a short tagline, and use Valve social artwork when available.

## Verification checklist pending Vercel quota reset

- Production READY and domain correctly aliased.
- 127/127 hero portraits load.
- Original 360° drag rotation still operates; no 2D tilt.
- Main Hero Lab, Strategy Hub, Hero Studio and Phases 1–7 remain functional.
- All six new My Library tabs mount on desktop/mobile.
- Preferences persist across refresh, and pins open correct heroes.
- Build presets correctly save/restore existing Hero Lab states.
- Draft presets correctly save/restore all picks and bans.
- Customized SVG card API returns `200 image/svg+xml` for valid heroes and rejects unknown heroes.
- Full backup JSON round-trip restores user data safely.
- No horizontal overflow or uncaught browser errors.
