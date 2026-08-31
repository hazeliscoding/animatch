# Roadmap

## Phase 1 — Real data
- [ ] AniList GraphQL client (public API, no auth needed for public lists)
- [ ] Replace `animatch-data.ts` mock constants with a data service (user lists, scores, genres)
- [ ] Compute compatibility for real user pairs: Pearson correlation, genre overlap, completed overlap, studio affinity
- [ ] Real cover art in disagreement/backlog lists (replace `IMG` placeholders)
- [ ] User search wired to the header search input

## Phase 2 — Accounts
- [ ] "Connect AniList" OAuth flow
- [ ] My profile page
- [ ] Persist recent comparisons and groups (local first, backend later)

## Phase 3 — Depth
- [ ] Recommendations page (predicted mutual scores across the full catalog)
- [ ] Radar-style genre spread on the compare page
- [ ] Backlog tabs: "Only in one backlog" and "Watching together" populated
- [ ] Group management: create groups, add/remove members
- [ ] Session planner for shared backlogs (episode pacing, sync-up suggestions)

## Phase 4 — Polish & delivery
- [ ] Mobile layouts for Shared backlog and Groups
- [ ] Density switcher (compact / standard / comfortable — tokens already support it)
- [ ] E2E smoke tests (Playwright)
- [ ] CI (build + test) and deploy (static hosting)
