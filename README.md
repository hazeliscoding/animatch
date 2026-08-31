<h1 align="center">AniMatch</h1>

Compare anime taste between [AniList](https://anilist.co) users. One place that answers: **how compatible are we, where do we disagree, and what should we watch together?**

![Compare — head-to-head](docs/screenshots/compare.png)

## ✨ Features

- ⚖️ **Head-to-head compare** — a 0–100 taste match score broken down into score correlation, genre overlap, completed overlap, and studio affinity.
- 💥 **Biggest disagreements** — the titles you two scored furthest apart, with per-user scores and delta badges.
- 📊 **Score distributions & genre profiles** — side-by-side histograms and per-genre bars for both users.
- 📚 **Shared backlog** — titles in both plan-to-watch lists, ranked by predicted mutual score, with watch-together picks.
- 👥 **Groups** — member stats, a pairwise taste-match heat matrix, and the backlog shared by the whole group.
- 📱 **Mobile layout** — compact summary view with bottom navigation under 720px.

| Shared backlog | Groups | Mobile |
| --- | --- | --- |
| ![Shared backlog](docs/screenshots/backlog.png) | ![Groups](docs/screenshots/groups.png) | ![Mobile](docs/screenshots/compare-mobile.png) |

## 🛠️ Stack

- **Angular 22** — standalone components, signals, typed routes.
- **Hikari design system** — an information-dense, portal-style design language ported as CSS tokens (`src/styles/tokens/`) and reusable components (`src/app/ui/`).
- Currently runs on mock data (`src/app/data/animatch-data.ts`) — AniList GraphQL integration is next, see [ROADMAP.md](ROADMAP.md).

## 🚀 Getting started

```bash
npm install
npm start        # dev server on http://localhost:4200
npm run build    # production build to dist/
npm test         # unit tests (vitest)
```
