# Jeffershizzle Modernization — Task Tracker

## Phase 0: Analysis & Planning
- [x] Analyze EXP spiderweb structure
- [x] Map all 348 gallery connections
- [x] Extract 301 category names from DONT
- [x] Create gallery tree structure
- [x] Finalize architecture & naming decisions
- [x] Set up Cloudflare tunnel (api-jeffershizzle)

## Phase 1: Server Infrastructure
- [x] Create `jeffershizzle_images_api.py` (port 8030) — tested, serves 293 galleries
- [x] Create image rename/copy script
- [x] Run copy script — 2,389 images in `E:\jeffershizzle\images\001/`–`293/`
- [ ] Test API serves images through tunnel (needs tunnel running + API running together)

## Phase 2: Data Extraction
- [x] Fix 5 broken links in legacy source (bti->btx, gtu tab, oyg14->04, expfirst->index)
- [x] Handle orphan sub-pages (append x) — identified, ready for SPA
- [x] Handle orphan entries (daa/glt -> z suffix) — identified, ready for SPA
- [x] Generate `manifest.json` — 293 galleries, 2,228/2,236 links resolved (99.6%), 301 browse entries

## Phase 3: Build SPA
- [x] Create index.html shell
- [x] Build CSS with all 15 layout templates
- [x] Build JS router + gallery renderer
- [x] Build transition effects (fade in/out)
- [x] Integrate DONT browse view
- [x] Browser test: entry page, enlarge, spiderweb navigation, browse — all working

## Phase 4: Deploy & Test
- [ ] Deploy SPA to A Small Orange
- [ ] Verify images load through tunnel
- [ ] Visual comparison against legacy pages
- [ ] Test all layout types
- [ ] Test mobile viewport
