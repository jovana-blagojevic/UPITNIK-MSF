# Upitnik — Grupne aktivnosti i blagostanje

Veb upitnik za istraživanje koje se sprovodi na **Pedagoškom fakultetu u Somboru** i **Akademiji umetnosti Univerziteta u Novom Sadu**.

Istraživanje ispituje kako učešće u grupnim muzičkim, sportskim i folklornim aktivnostima doprinosi mentalnom zdravlju, blagostanju i socijalnoj podršci učesnika.

---

## Korišćenje

Nema build-a ni zavisnosti. Otvorite `index.html` u pretraživaču.

Tok je u tri koraka: učesnik prvo bira **vrstu aktivnosti** (`index.html`), zatim **nivo angažovanja** — amater / rekreativac / profesionalac (`nivo-{grupa}.html`), pa se otvara odgovarajući upitnik već pripremljen za izabrani nivo (`index-{grupa}.html?nivo=…`).

---

## Stranice

| Fajl | Sadržaj |
|---|---|
| `index.html` | Početna stranica — izbor grupe (muzika / sport / folklor) |
| `nivo-muzika.html` | Izbor nivoa angažovanja — muzika |
| `nivo-sport.html` | Izbor nivoa angažovanja — sport |
| `nivo-folklor.html` | Izbor nivoa angažovanja — folklor |
| `index-muzika.html` | Upitnik za učesnike muzičkih aktivnosti |
| `index-sport.html` | Upitnik za sportiste |
| `index-folklor.html` | Upitnik za folkloraše |

---

## Sadržaj upitnika

Svaki upitnik sadrži:

1. **Demografska pitanja** — pol, godine, vrsta aktivnosti, trajanje učešća, prethodna aktivnost (nivo angažovanja se bira u prethodnom koraku, na `nivo-{grupa}.html`)
2. **MHC-SF** — Mental Health Continuum Short Form (14 stavki, skala 0–5)
3. **SPS-10** — Social Provision Scale (10 stavki, skala 1–4)
4. **WHO-5** — Well-Being Index (5 stavki, skala 0–5)
5. **SWLS** — Satisfaction With Life Scale (5 stavki, skala 1–7)
6. **FAS** — Fatigue Assessment Scale (10 stavki, skala 1–5)
7. **Potvrda saglasnosti** — canvas potpis

Sva pitanja su obavezna osim polja za dodatnu/prethodnu aktivnost.

---

## Git — rad sa kodom

### Kloniranje repozitorijuma

```bash
git clone <URL repozitorijuma>
cd "CLAUDE UPITNIK"
```

### Tipičan tok rada

```bash
# Pregledaj izmene pre nego što ih sačuvaš
git status
git diff

# Dodaj izmenjene fajlove i napravi commit
git add style.css script.js index-muzika.html   # navedi konkretne fajlove
git commit -m "Kratak opis izmene"

# Pošalji na remote (GitHub/GitLab)
git push
```

### Korisne komande

| Komanda | Šta radi |
|---|---|
| `git log --oneline` | Pregled istorije commitova |
| `git diff` | Pregled nekomitovanih izmena |
| `git restore <fajl>` | Povratak na poslednju komitovanu verziju fajla |
| `git pull` | Preuzimanje najnovije verzije sa remote-a |

> **Napomena:** Projekat nema build korak — fajlovi se direktno otvaraju u pretraživaču. Nema `node_modules` ni generisanih fajlova koje treba isključiti iz gita (`.gitignore` nije neophodan, ali možete dodati `.DS_Store` unos).

---

## Tehničke napomene

- Čist HTML/CSS/JS, bez framework-a ni zavisnosti
- Responzivan — optimizovan za mobilne uređaje
- Fontovi se učitavaju sa Google Fonts (Lora + Source Sans 3)
- Potpis se čuva kao base64 PNG u skrivenom `input` polju
- Validacija se vrši na klijentskoj strani pre slanja forme
