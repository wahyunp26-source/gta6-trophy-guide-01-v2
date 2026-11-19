# Leonida 55 — GTA VI Trophy Guide & Tracker

Unofficial fan guide and tracker for all 55 PlayStation 5 trophies of Grand
Theft Auto VI. Works offline: static files only, no network requests.

## What it does

- Checklist of all 55 trophies with official names, descriptions and grades
  (1 platinum, 2 gold, 6 silver, 46 bronze; 28 hidden), saved in the browser
  (localStorage), with Export / Import / Reset.
- A guide in our own words for every trophy, as numbered steps with inline
  citations [1][2] and a per-trophy source list with retrieval dates.
- Audit strip computed from the data: 55/55 trophies, guides and citations,
  28/28 hidden, 1 possibly missable, 6 unconfirmed (listed honestly),
  6 sources, list checked 19 Nov 2026.
- Platinum roadmap showing all 55 trophies across 7 stages, a Missables tab
  with the point of return (end of Chapter 1), a Next up tab, and an
  About & sources tab.
- Spoiler setting that hides story trophies until earned, filters by kind and
  grade, search (press `/`), Earned only / To do filters, interactive
  counters for counted trophies (e.g. meditation spots 0/18), and a
  Load sample progress demo button.

## How to run

```sh
node serve.ts
# open http://localhost:8080
```

## How to hand in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## Sources (retrieved 19 Nov 2026)

Exophase (official list), PowerPyx, KeenGamer, Push Square, PSNProfiles,
GTABase. Full list with dates: About & sources tab in the app, and
`app/data/trophies.json`.
