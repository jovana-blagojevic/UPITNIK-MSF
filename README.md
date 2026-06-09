# Upitnik — Grupne aktivnosti i blagostanje

Veb upitnik za istraživanje koje se sprovodi na **Pedagoškom fakultetu u Somboru** i **Akademiji umetnosti Univerziteta u Novom Sadu**.

Istraživanje ispituje kako učešće u grupnim muzičkim, sportskim i folklornim aktivnostima doprinosi mentalnom zdravlju, blagostanju i socijalnoj podršci učesnika.

---

## Korišćenje

Nema build-a ni zavisnosti. Otvorite `index.html` u pretraživaču.

Tok je u tri koraka: učesnik prvo bira **vrstu aktivnosti** (`index.html`), zatim **nivo angažovanja** — amater / rekreativac / profesionalac (`nivo-{grupa}.html`), pa se otvara odgovarajući upitnik već pripremljen za izabrani nivo (`index-{grupa}.html?nivo=…`).

---

## Struktura foldera

```
index.html              Početna — izbor grupe (ostaje u korenu zbog GitHub Pages)
strane/                 Upitničke stranice
  ├─ nivo-{grupa}.html    izbor nivoa angažovanja
  └─ index-{grupa}.html   sam upitnik (?nivo=…)
assets/                 Statički resursi
  ├─ style.css  script.js  config.js  favicon.svg
  ├─ fonts/              samostalno hostovani woff2
  └─ logos/             grbovi institucija (header)
server/                 Google Apps Script (ne izvršava se iz repoa)
  ├─ apps-script.gs       prijem odgovora → Google Sheets
  └─ apps-script-setup.gs jednokratna priprema/stilizacija tabela
```

| Fajl | Sadržaj |
|---|---|
| `index.html` | Početna stranica — izbor grupe (muzika / sport / folklor) |
| `strane/nivo-muzika.html` | Izbor nivoa angažovanja — muzika |
| `strane/nivo-sport.html` | Izbor nivoa angažovanja — sport |
| `strane/nivo-folklor.html` | Izbor nivoa angažovanja — folklor |
| `strane/index-muzika.html` | Upitnik za učesnike muzičkih aktivnosti |
| `strane/index-sport.html` | Upitnik za sportiste |
| `strane/index-folklor.html` | Upitnik za folkloraše |

---

## Sadržaj upitnika

Svaki upitnik sadrži:

1. **Demografska pitanja** — pol, godine, vrsta aktivnosti, trajanje učešća, prethodna aktivnost (nivo angažovanja se bira u prethodnom koraku, na `nivo-{grupa}.html`)
2. **MHC-SF** — Mental Health Continuum Short Form (14 stavki, skala 1–6)
3. **SPS-10** — Social Provision Scale (10 stavki, skala 1–4)
4. **WHO-5** — Well-Being Index (5 stavki, skala 1–6)
5. **SWLS** — Satisfaction With Life Scale (5 stavki, skala 1–7)
6. **FAS** — Fatigue Assessment Scale (10 stavki, skala 1–5)
7. **Potvrda saglasnosti** — canvas potpis

> **Redosled i dodatne sekcije:** gornji redosled prati **folklorni** upitnik. Upitnici za
> **muziku** i **sport** raspoređuju skale drugačije i dodatno sadrže sekcije zavisne od nivoa
> angažovanja — **Fizička dobrobit**, **Odnos sa liderom** i **Negativni faktori**. Njihov
> redosled je: WHO-5 → Fizička dobrobit → SWLS → MHC-SF → SPS-10 → Odnos sa liderom → FAS →
> Negativni faktori.

Obavezna su sva pitanja sa ponuđenim odgovorima (radio-dugmad), numerička polja i potpis
saglasnosti. Slobodna tekstualna polja (naziv sporta, dodatna i prethodna aktivnost, opcija
„Drugo") su opciona.

---

## Git — rad sa kodom

### Kloniranje repozitorijuma

```bash
git clone git@github.com:jovana-blagojevic/UPITNIK-MSF.git
cd UPITNIK-MSF
```

### Tipičan tok rada

```bash
# Pregledaj izmene pre nego što ih sačuvaš
git status
git diff

# Dodaj izmenjene fajlove i napravi commit
git add assets/style.css assets/script.js strane/index-muzika.html   # navedi konkretne fajlove
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

> **Napomena:** Projekat nema build korak — fajlovi se direktno otvaraju u pretraživaču. `assets/config.js` **se komituje** (vidi „Bezbednost") jer GitHub Pages servira samo fajlove iz Git-a; token u njemu nije prava tajna. `.gitignore` isključuje samo `.DS_Store`.

---

## Bezbednost

Aplikacija je statična i deli se preko **GitHub Pages**, koji servira samo fajlove
iz Git-a — zato se `assets/config.js` **komituje** (inače forma na živom sajtu nema
URL/TOKEN i ne šalje). To je bezbedno: kod se učitava u pretraživaču, pa su
**`UPITNIK_URL` i `UPITNIK_TOKEN` ionako vidljivi svakome** (View Source / Network).
Token **nije tajna** i ne sprečava zloupotrebu — pravu zaštitu radi Apps Script na
serverskoj strani. Klijent dodatno ima *honeypot* polje (`hp_polje`): skriveno je za
ljude, ali ga automatski botovi popune; ako je popunjeno, slanje se ne izvršava.

Kompletan serverski kod (provera tokena + honeypota, validacija opsega, **sanitizacija
protiv CSV/Formula injection** — vrednosti koje počinju `= + - @` tretiraju se kao tekst,
i **header-driven** upis koji sam pravi kolone, sa tabom po grupi) nalazi se u
**[`server/apps-script.gs`](server/apps-script.gs)**. Taj fajl je izvor istine —
nalepi ga u Apps Script editor vezan za tabelu.

> **Token mora da se poklapa:** `TOKEN` u `server/apps-script.gs` mora biti **identičan**
> `window.UPITNIK_TOKEN` u `assets/config.js`, inače svaki upis vraća grešku `token`.

### Postavljanje (deploy)

1. Otvori Google tabelu → **Extensions → Apps Script**.
2. Nalepi ceo `server/apps-script.gs`; postavi `TOKEN` na istu vrednost kao u `assets/config.js`.
3. **Deploy → New deployment → Web app**, sa podešavanjima:
   - **Execute as:** Me
   - **Who has access:** Anyone — *bez ovoga* anonimni `fetch` dobija Google
     login HTML umesto JSON-a i upis **ne uspeva** (najčešći uzrok grešaka).
4. Kopiraj `/exec` URL u `assets/config.js` kao `window.UPITNIK_URL`.
5. Posle svake izmene koda: **Manage deployments → uredi → New version** (URL ostaje isti).

Odgovori se upisuju u tabove **Muzika / Sport / Folklor** (prave se automatski).
Kolone se dodaju iz imena polja, pa nivo-zavisna pitanja (`a_*`/`r_*`/`p_*`) i
„Dodaj još" polja (`_2`, `_3`…) sami zauzmu svoju kolonu — ništa se ne gubi.

### Priprema i izgled tabela (opciono)

Da tabovi budu spremni i lepi pre prvog učesnika, nalepi i **[`server/apps-script-setup.gs`](server/apps-script-setup.gs)**
kao drugi `.gs` fajl u isti Apps Script projekat, pa osveži tabelu — pojavi se meni **Upitnik**:

- **1 · Pripremi tabele** — pravi tabove Muzika/Sport/Folklor sa svim kolonama (pravim
  redom), zamrznutim i stilizovanim zaglavljem u bojama upitnika (ugljen + plavi akcenat,
  krem trake), uz belešku-objašnjenje na svakom zaglavlju. Bezbedno: ako tab već ima
  podatke, ne dira ih — samo osveži stil.
- **2 · Napravi TEST tabele sa primerima** — „Muzika (TEST)", „Sport (TEST)",
  „Folklor (TEST)" sa po nekoliko primera odgovora, da odmah vidiš izgled. Slobodno ih obriši.
- **Obriši TEST tabele** — uklanja tri `(TEST)` taba.

Setup fajl ne utiče na `doPost` (prijem odgovora) — služi samo za izgled tabele.

> Napomena: `localStorage` blokada ponovnog popunjavanja sprečava slučajno
> dvostruko slanje, ali se trivijalno zaobilazi (incognito / brisanje podataka).
> Za strože sprečavanje duplikata potrebna je serverska logika.

---

## Tehničke napomene

- Čist HTML/CSS/JS, bez framework-a ni zavisnosti
- Responzivan — optimizovan za mobilne uređaje
- Fontovi (Lora + Source Sans 3) su samostalno hostovani u `assets/fonts/` (woff2, subset latin + latin-ext) — bez zahteva ka Google Fonts CDN-u, zbog privatnosti ispitanika
- Potpis se čuva kao base64 PNG u skrivenom `input` polju
- Validacija se vrši na klijentskoj strani pre slanja forme
