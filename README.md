# Upitnik — Grupne aktivnosti i blagostanje

Veb upitnik za istraživanje koje se sprovodi na **Pedagoškom fakultetu u Somboru** i **Akademiji umetnosti Univerziteta u Novom Sadu**.

Istraživanje ispituje kako učešće u grupnim muzičkim, sportskim i folklornim aktivnostima doprinosi mentalnom zdravlju, blagostanju i socijalnoj podršci učesnika.

---

## Korišćenje

Nema build-a ni zavisnosti. Otvorite `intro.html` u pretraživaču.

Učesnici biraju vrstu aktivnosti na intro stranici i bivaju preusmereni na odgovarajući upitnik.

---

## Stranice

| Fajl | Sadržaj |
|---|---|
| `intro.html` | Početna stranica — izbor grupe (muzika / sport / folklor) |
| `index-muzika.html` | Upitnik za učesnike muzičkih aktivnosti |
| `index-sport.html` | Upitnik za sportiste |
| `index-folklor.html` | Upitnik za folkloraše |

---

## Sadržaj upitnika

Svaki upitnik sadrži:

1. **Demografska pitanja** — pol, godine, vrsta aktivnosti, nivo angažovanja (amater / rekreativac / profesionalac), trajanje učešća, prethodna aktivnost
2. **MHC-SF** — Mental Health Continuum Short Form (14 stavki, skala 0–5)
3. **SPS-10** — Social Provision Scale (10 stavki, skala 1–4)
4. **WHO-5** — Well-Being Index (5 stavki, skala 0–5)
5. **SWLS** — Satisfaction With Life Scale (5 stavki, skala 1–7)
6. **FAS** — Fatigue Assessment Scale (10 stavki, skala 1–5)
7. **Potvrda saglasnosti** — canvas potpis

Sva pitanja su obavezna osim polja za dodatnu/prethodnu aktivnost.

---

## Tehničke napomene

- Čist HTML/CSS/JS, bez framework-a ni zavisnosti
- Responzivan — optimizovan za mobilne uređaje
- Fontovi se učitavaju sa Google Fonts (Lora + Source Sans 3)
- Potpis se čuva kao base64 PNG u skrivenom `input` polju
- Validacija se vrši na klijentskoj strani pre slanja forme
