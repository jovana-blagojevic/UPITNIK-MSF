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
