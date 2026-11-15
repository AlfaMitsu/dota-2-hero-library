# Phase 0 — Source Recovery and Deployment Reliability

Status: **IN PROGRESS — NOT SAFE TO DEPLOY FROM GITHUB**

## Verified facts
- Production deployment `dpl_FJ5SiyYramYA9upVRpfF36nszGrC` was READY and contains Phases 1–14.
- The GitHub development branch inherits **32 damaged source files**. Their truncated bytes must not be merged or deployed.
- Vercel's deployment file tree retains source SHA-1 identifiers, but the connected file-content retrieval truncates larger responses; SHA references enable safe Vercel deployment without reconstructing GitHub.
- The existing `scripts/check-source-integrity.cjs` blocks damaged source.
- New `scripts/production-smoke.cjs` verifies deployed homepage, Phase 12–14 assets, 360 CSS availability, and 127 hero API records. It is an HTTP smoke test, **not** a browser drag test.

## Damaged files (32)
- `app/api/hd-portrait/route.ts`
- `app/api/hero-catalog/route.ts`
- `app/api/phase2/route.ts`
- `app/api/phase3/route.ts`
- `app/api/phase4/card/route.ts`
- `app/api/phase4/patches/route.ts`
- `app/api/phase4/voices/route.ts`
- `app/api/phase7/item-popularity/route.ts`
- `app/api/phase7/items/route.ts`
- `app/api/phase7/matchups/route.ts`
- `app/hero-stage/hero-stage.css`
- `components/phase4-animation-studio.tsx`
- `public/clean-hero-portraits.js`
- `public/phase1-reconcile.js`
- `public/phase1.css`
- `public/phase1.js`
- `public/phase10.css`
- `public/phase10.js`
- `public/phase2.css`
- `public/phase2.js`
- `public/phase3.css`
- `public/phase3.js`
- `public/phase4.css`
- `public/phase4.js`
- `public/phase6.css`
- `public/phase7.css`
- `public/phase7.js`
- `public/phase9.css`
- `public/phase9.js`
- `public/qa-fixes.css`
- `public/qa-fixes.js`
- `scripts/phase6-check.cjs`

## Required recovery before merging
1. Obtain complete byte-for-byte source of these files from an authenticated source archive or earlier clean GitHub commits; do not use truncated connector output.
2. Compare each recovered file to production deployment SHA-1, and validate the exact file content before committing.
3. Run `node scripts/check-source-integrity.cjs`, `npm ci`, `npm run build`, and browser regression tests in an isolated checkout.
4. Run `node scripts/production-smoke.cjs https://<preview-host>` against the preview, and test real 360° dragging, mobile touch, modals, and navigation with a browser.
5. Merge only when the branch builds cleanly and all required tests pass. Keep the current working production deployment available for rollback.

No changes to production are authorized by this recovery branch alone.
