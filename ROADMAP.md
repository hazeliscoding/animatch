# Roadmap

## Phase 1 — Real data
- [x] AniList GraphQL client (public API, no auth needed for public lists)
- [x] Compute compatibility for real user pairs: Pearson correlation, genre overlap, completed overlap, studio affinity
- [x] Compare page on real users (`/compare?a=<user>&b=<user>`), with the mockup data kept as demo state
- [x] Real cover art + avatars on the compare page (replace `IMG` placeholders)
- [x] Real data for the Shared backlog and Groups pages (PLANNING lists, predicted mutual scores)
- [x] User search wired to the header search input

## Phase 2 — Accounts
- [x] "Connect AniList" OAuth flow (implicit grant; register a client and paste the ID on the profile page)
- [x] My profile page (own stats when connected, any public profile via `?u=`)
- [x] Persist recent comparisons and groups (localStorage — backend sync later)

## Phase 3 — Depth
- [x] Recommendations page (predicted mutual scores over AniList's top ~100 popular/highest-rated; deeper catalog digging later)
- [x] Radar-style genre spread on the compare page (bars ⇄ radar toggle)
- [x] Backlog tabs: "Only in one backlog" and "Watching together" populated
- [ ] Group management: create groups, add/remove members
- [ ] Session planner for shared backlogs (episode pacing, sync-up suggestions)

## Phase 4 — Polish & delivery
- [ ] Mobile layouts for Shared backlog and Groups
- [ ] Density switcher (compact / standard / comfortable — tokens already support it)
- [x] E2E smoke tests (Playwright)
- [x] CI (GitHub Actions: build + unit + e2e)
- [x] Deploy to Vercel
