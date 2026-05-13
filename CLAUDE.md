# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Design skill

Always invoke the `frontend-design` skill when making any UI, layout, or styling changes to this project.

## Project overview

**Upitnik** is a static multi-page research survey conducted jointly by the Faculty of Education in Sombor (Pedagoški fakultet u Somboru) and the Academy of Arts, University of Novi Sad. Participants of group music, sport, or folklore activities fill in demographic questions and five validated psychological scales (MHC-SF, SPS-10, WHO-5, SWLS, FAS), then sign a canvas consent block.

On submit, the form currently shows a thank-you `alert()` — there is no backend endpoint. Form data is not sent anywhere.

No build step. No package manager. No test runner. Open any `.html` file directly in a browser to develop.

## File structure

```
intro.html          — Landing page: participant selects their activity group
index-muzika.html   — Music questionnaire
index-sport.html    — Sports questionnaire
index-folklor.html  — Folklore questionnaire
style.css           — All styles; single source of truth for the design system
script.js           — Form behaviour: "Drugo" input activation, canvas signature, validation
```

## Architecture

**All three questionnaires share `style.css` and `script.js`.** Changes to either file affect all three.

Each questionnaire is structured as:
1. `.upitnik-header` — dark charcoal header with badge + H1
2. `<form id="forma">` — cream panel inside the dark card
   - `<section class="sekcija" id="demografija">` — activity-specific demographic questions
   - Five `<section class="sekcija">` blocks, one per scale (MHC-SF, SPS-10, WHO-5, SWLS, FAS)
   - `.saglasnost-blok` — canvas signature consent block
   - `.podnozje-forme` — submit button

The demographic section is the only part that differs between questionnaires. The five scales are identical across all three.

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

The `.upitnik` card uses a hard-coded `background: #4D4B47` (dark charcoal), not a token. The `.likert-zaglavlje` also uses this dark background.

**Radio option variants:**
- `.opcije-red` / `.opcija` — standard pill-style radio rows (used in demographics)
- `.opcije-sa-opisom` / `.opcija-red-opis` — side-by-side radio + definition text (used for Amater/Rekreativac/Profesionalac)
- `.likert-blok` / `.likert-red` / `.likert-opcija` — Likert scale rows with rectangular buttons
- `.likert-7` modifier — narrows buttons for 7-point SWLS scale

**Input variants:**
- `.unos-broj` — number input with box border
- `.unos-linija` — text input with bottom border only
- `.unos-saglasnost` — consent name input
- `.unos-drugo` — inline text field inside a radio label (disabled until parent radio is selected)

## Form behaviour (script.js)

Three independent features:

1. **"Drugo" activation** — when a radio with class `.opcija-drugo` is selected, its sibling `.unos-drugo` input becomes interactive. Deselecting it disables the input again.

2. **Canvas signature** — `#saglasnost-canvas` captures a freehand signature. On first stroke, the hidden `#saglasnost` input is set to `'potpis'`; on `mouseup`/`touchend` it is updated to the full `canvas.toDataURL()`. `potpis_obrisi(canvasId)` clears the canvas and resets the hidden input.

3. **Submit validation** — prevents submission if any radio group has no selection, any `type="number"` input is empty or out of range, or the canvas is unsigned. Errors are injected as `.greska-tekst` spans and the `.greska` class is added to the containing `.pitanje` or `.likert-red`. The page scrolls to the first error.

Note: the `vrsta_sporta` and `vrsta_folklora_drugo` text inputs are **not validated** on submit — they are intentionally optional (the sports name field) or only active when their radio is selected.

## Content conventions

- All text is Serbian, Latin script, sentence case.
- Formal address throughout ("Vi", "Vas", "Vaš").
- Scale names keep their English acronyms (MHC-SF, SPS-10, etc.) as `.skala-naslov` headings.
- The `.badge` in each questionnaire header shows the full institutional affiliation.
