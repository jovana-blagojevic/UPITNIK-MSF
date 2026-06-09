# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design skill

Always invoke the `frontend-design` skill when making any UI, layout, or styling changes to this project.

## Project overview

**Upitnik** is a static multi-page research survey conducted jointly by the Faculty of Education in Sombor (Pedagoški fakultet u Somboru) and the Academy of Arts, University of Novi Sad. Participants of group music, sport, or folklore activities first pick their activity group, then their engagement level (amater / rekreativac / profesionalac), then fill in demographic questions and five validated psychological scales (MHC-SF, SPS-10, WHO-5, SWLS, FAS), then sign a canvas consent block.

The participant flow is three steps: `index.html` (pick group) → `nivo-{grupa}.html` (pick engagement level) → `index-{grupa}.html?nivo={nivo}` (the questionnaire, pre-filtered to that level). The chosen level arrives in the questionnaire via the `?nivo=` query param; opening a questionnaire without a valid `?nivo=` redirects back to `nivo-{grupa}.html`.

On submit (after client-side validation), the form POSTs the collected answers as JSON to a Google Apps Script endpoint read from `assets/config.js` (`window.UPITNIK_URL` / `window.UPITNIK_TOKEN`). `assets/config.js` **is committed** — the site is deployed via GitHub Pages, which serves only files tracked in Git, and the token is not a real secret (it is visible client-side anyway). The real protection is server-side in `server/apps-script.gs` (token + honeypot + range validation + CSV/formula-injection sanitization). On success it sets a `localStorage` flag (`upitnik_popunjen_{tip}`) to block re-submission and swaps the card for a `.hvala` thank-you message; on network/error it shows an `alert()`.

No build step. No package manager. No test runner. Open any `.html` file directly in a browser to develop.

## File structure

```
index.html                — Landing page: pick activity group (stays at repo root — GitHub Pages entry point)
strane/                   — All questionnaire pages
  nivo-muzika.html        — Music: pick engagement level → index-muzika.html?nivo=…
  nivo-sport.html         — Sport: pick engagement level → index-sport.html?nivo=…
  nivo-folklor.html       — Folklore: pick engagement level → index-folklor.html?nivo=…
  index-muzika.html       — Music questionnaire
  index-sport.html        — Sports questionnaire
  index-folklor.html      — Folklore questionnaire
assets/                   — Static resources
  style.css               — All styles; single source of truth for the design system
  script.js               — Form behaviour: nivo from URL, "Drugo" input activation, canvas signature, validation
  config.js               — window.UPITNIK_URL / UPITNIK_TOKEN (committed — served by GitHub Pages; token is not a real secret)
  favicon.svg             — Site icon
  fonts/                  — Self-hosted Lora + Source Sans 3 (woff2, latin + latin-ext); @font-face at the top of style.css
  logos/                  — Institutional emblems shown in index.html header (white-treated on the dark header)
server/                   — Google Apps Script (source of truth; NOT executed from Git — paste into the Apps Script editor)
  apps-script.gs          — Receives POSTs, validates + sanitizes, writes to Google Sheets (tab per group)
  apps-script-setup.gs    — One-time table preparation/styling
```

Paths are relative: pages in `strane/` reference assets as `../assets/…` and link back to the landing page as `../index.html`; `index.html` at the root uses `assets/…` and `strane/…`.

The three `nivo-*.html` pages share the landing-page shell (`.upitnik-header` + `.uvod-telo`) and present the three level options as clickable cards (`.nivo-izbor` / `.dugme-nivo`), each linking to the matching questionnaire with `?nivo=amater|rekreativac|profesionalac`.

## Architecture

**All three questionnaires share `style.css` and `script.js`.** Changes to either file affect all three.

Each questionnaire is structured as:
1. `.upitnik-header` — dark charcoal header with badge + H1
2. `<form id="forma">` — cream panel inside the dark card
   - `<input type="hidden" name="nivo">` — engagement level, filled from `?nivo=` (the level is chosen on `nivo-{grupa}.html`, not inside the form)
   - `<section class="sekcija" id="demografija">` — activity-specific demographic questions
   - Five `<section class="sekcija">` blocks, one per scale — MHC-SF, SPS-10, WHO-5, SWLS, FAS (this is the **folklor** order; muzika/sport arrange the scales differently — see below)
   - `.saglasnost-blok` — canvas signature consent block
   - `.podnozje-forme` — submit button

The demographic section differs between questionnaires. The five shared scales are identical across all three. **Muzika** and **sport** additionally have level-dependent sections (Fizička dobrobit, Odnos sa liderom, Negativni faktori) built as `.nivo-blok` elements with `data-nivo="amater|rekreativac|profesionalac"`; only the block matching the chosen `nivo` is shown. **Folklor** records `nivo` but has no level-dependent sections. Because of this, the section order differs per questionnaire: **folklor** is Demografija → MHC-SF → SPS-10 → WHO-5 → SWLS → FAS; **muzika/sport** are Demografija → WHO-5 → Fizička dobrobit → SWLS → MHC-SF → SPS-10 → Odnos sa liderom → FAS → Negativni faktori (the three level-dependent sections interleaved among the scales).

## Design system (style.css)

CSS custom properties are defined on `:root`. Key tokens:

| Token | Value | Use |
|---|---|---|
| `--bg-page` | `#D6CCBA` | Page background |
| `--bg` | `#F3F1EC` | Subtle off-white — unselected option hover, input backgrounds |
| `--povrsina` | `#FDFBF7` | Form panel, selected option backgrounds |
| `--ivica` | `#D5D0C7` | Default borders |
| `--ivica-jak` | `#B5AFA4` | Stronger borders — inputs, section dividers |
| `--tekst` | `#1E1B16` | Primary text |
| `--tekst-slab` | `#58524A` | Secondary text |
| `--tekst-slabi` | `#908880` | Placeholder / tertiary text |
| `--plava` | `oklch(0.34 0.09 250)` | Accent — selected states, focus rings, submit button |
| `--plava-sv` | `oklch(0.96 0.015 250)` | Light accent — hover backgrounds |
| `--plava-ivica` | `oklch(0.60 0.05 250)` | Focused input border |
| `--greska` | `oklch(0.45 0.15 25)` | Error state |
| `--greska-sv` | `oklch(0.96 0.03 25)` | Error background tint |
| `--font-serif` | Lora | Headings, body text, option labels |
| `--font-sans` | Source Sans 3 | UI labels, badges, buttons, Likert numbers |
| `--r-mali` | `3px` | Small border radius |
| `--r-sredi` | `5px` | Medium border radius |
| `--senka` | layered box-shadow | Card and panel shadows |

Both fonts are **self-hosted** (`@font-face` at the top of `style.css`, files in `assets/fonts/`) — no Google Fonts CDN request, for participant privacy. Weights loaded: Lora 400/500/600/700 + italic 400/500; Source Sans 3 300/400/500/600 + italic 300/400. Subset is latin + latin-ext (covers Serbian č/ć/ž/š/đ); to add a weight, drop the woff2 in `assets/fonts/` and add a matching `@font-face` block.

The `.upitnik` card uses a hard-coded `background: #4D4B47` (dark charcoal), not a token. The `.likert-zaglavlje` also uses this dark background.

`index.html` opens with `.header-logoi` inside the dark `.upitnik-header`: the two institutional emblems (`assets/logos/`) rendered as white silhouettes via `filter: brightness(0) invert(1)`, separated by a thin `.logo-podela` hairline. The circular Pedagoški seal and the triangular Akademija mark are size-balanced per-logo (`.logo-pef` / `.logo-au`) because a triangle reads optically smaller than a circle.

**Radio option variants:**
- `.opcije-red` / `.opcija` — standard pill-style radio rows (used in demographics)
- `.likert-blok` / `.likert-red` / `.likert-opcija` — Likert scale rows with rectangular buttons
- `.likert-7` modifier — narrows buttons for 7-point SWLS scale

**Level-selection cards (`nivo-*.html`):**
- `.nivo-izbor` / `.dugme-nivo` — clickable level cards (name + definition + arrow) that navigate to `index-{grupa}.html?nivo=…`
- The Amater/Rekreativac/Profesionalac choice lives on `nivo-*.html`; the questionnaire only records it in the hidden `name="nivo"` input (no in-form display)

**Input variants:**
- `.unos-broj` — number input with box border
- `.unos-linija` — text input with bottom border only
- `.unos-drugo` — inline text field inside a radio label (disabled until parent radio is selected)

## Form behaviour (script.js)

Independent features:

0. **Nivo from URL** — on load, reads `?nivo=` (must be `amater`/`rekreativac`/`profesionalac`). If missing/invalid, redirects to `nivo-{tip_upitnika}.html`. Otherwise writes the value into the hidden `name="nivo"` input, then reveals the matching `.nivo-blok` (and resets/hides the others). For rekreativac, the `.vodja-blok` leader questions stay hidden until `r_ima_vodju="da"`.

1. **"Drugo" activation** — when a radio with class `.opcija-drugo` is selected, its sibling `.unos-drugo` input becomes interactive. Deselecting it disables the input again.

2. **Canvas signature** — `#saglasnost-canvas` captures a freehand signature. On first stroke, the hidden `#saglasnost` input is set to `'potpis'`; on `mouseup`/`touchend` it is updated to the full `canvas.toDataURL()`. `potpis_obrisi(canvasId)` clears the canvas and resets the hidden input.

3. **Submit validation** — prevents submission if any radio group has no selection, any `type="number"` input is empty or out of range, or the canvas is unsigned. Errors are injected as `.greska-tekst` spans and the `.greska` class is added to the containing `.pitanje` or `.likert-red`. The page scrolls to the first error.

Note: the `vrsta_sporta` and `vrsta_folklora_drugo` text inputs are **not validated** on submit — they are intentionally optional (the sports name field) or only active when their radio is selected.

## Content conventions

- All text is Serbian, Latin script, sentence case.
- Formal address throughout ("Vi", "Vas", "Vaš").
- Sections have no visible title heading; each section opens directly with its `.skala-uputstvo` instruction. For every Likert scale that instruction ends with a `Skala: <min> = …; <max> = …` legend matching that scale's own endpoints (e.g. WHO-5 `1 = Nikad; 6 = Sve vreme`, SWLS `1 = … ; 7 = …`).
- The `.badge` in each questionnaire header shows the full institutional affiliation.
