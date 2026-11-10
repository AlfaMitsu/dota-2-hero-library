# Phase 5 production synchronization (in progress)

Production URL: https://dota-2-hero-library.vercel.app

Last verified Phase 5 production deployment: `dpl_BTCLbEueKCouLzRYePiC9UCU8UoG`

This branch backs up the Phase 5 changes to:
- `components/hero-library.tsx` — same-origin hero stats and keyboard slider controls
- `app/api/hero-stats/route.ts` — published hero-stat constants
- `public/phase5.js` and `public/phase5.css` — readable missing-ability-icon fallbacks

**IMPORTANT: This branch is not a complete copy of the live Vercel deployment and must NOT be merged into the production branch until it has been reconciled with all Phase 1–4 source, public scripts, and portrait assets currently deployed on Vercel.**

The live Vercel deployment also changes `app/layout.tsx` to load progressive enhancement scripts using Next.js `strategy="lazyOnload"`. The associated Phase 1–4 files and API routes need to be synchronized together before this root layout can be safely adopted in GitHub.

No changes have been made to `main`. A GitHub-triggered deploy from older code could overwrite more recent Vercel-only features.

QA evidence on the live production domain:
- All 127 heroes loaded
- No page-level React errors in the Phase 5 browser smoke test
- Original hero stats displayed and keyboard arrows / Home / End / Page Up worked
- Missing Axe innate icon displayed a fallback
- All five profile tabs remained functional
- 390px mobile viewport had no horizontal overflow
