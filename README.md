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

> **Redosled sekcija je isti u sva tri upitnika:** Demografija → WHO-5 → **Fizička dobrobit**
> → SWLS → MHC-SF → SPS-10 → **Odnos sa liderom** → FAS → **Negativni faktori** → saglasnost.
> Podebljane sekcije zavise od nivoa angažovanja: prikazuje se samo blok izabranog nivoa
> (`a_*` amater, `r_*` rekreativac, `p_*` profesionalac), ostali ostaju skriveni i resetovani
> pa se njihovi odgovori nikad ne šalju. Kod rekreativaca su pitanja o vođi iza dodatnog
> Da/Ne pitanja (`r_ima_vodju`).

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

Korak po korak, sa svim mestima na kojima se najčešće greši:
**[UPUTSTVO-GOOGLE-SHEETS.md](UPUTSTVO-GOOGLE-SHEETS.md)**.

Ukratko: nalepi `server/apps-script.gs` kao `Code.gs` i
`server/apps-script-setup.gs` kao drugi fajl u isti Apps Script projekat →
**Deploy → New deployment → Web app** (*Execute as: Me*, *Who has access:
Anyone*) → `/exec` URL u `assets/config.js`.

> ⚠️ Posle **svake** izmene `.gs` koda: **Manage deployments → uredi → New
> version**. URL ostaje isti; bez toga i dalje radi stara verzija.

Odgovori se upisuju u tabove **Muzika / Sport / Folklor**. Zaglavlje se pri
prvom odgovoru zaseje iz liste `KOLONE` u `apps-script.gs`, pa je redosled
kolona isti kao redosled pitanja od prvog reda. Nepoznati ključevi (npr.
„Dodaj još" setovi `_2`, `_3`…) dopisuju se na kraj — ništa se ne gubi.
Likert i numerička polja se upisuju kao **brojevi**, pa `AVERAGE`/`STDEV` rade
bez `VALUE()` omotača.

### Meni „Upitnik" u tabeli

Posle nalepljivanja `server/apps-script-setup.gs` i osvežavanja tabele:

- **1 · Pripremi tabele** — tabovi sa svim kolonama pravim redom, zamrznuto i
  stilizovano zaglavlje (ugljen + plavi akcenat, krem trake) i beleška sa punim
  tekstom pitanja na svakoj koloni. Ako tab već ima odgovore, sadržaj se ne dira.
- **2 · Napravi legendu** — tab „Legenda": za svaku kolonu sekcija, pun tekst
  pitanja i opseg vrednosti.
- **3 · Osveži pregled** — tab „Pregled": broj odgovora po grupi i nivou, prvi i
  poslednji odgovor.
- **Napravi / Obriši TEST tabele** — `(TEST)` tabovi sa izmišljenim odgovorima,
  da se vidi izgled pre puštanja linka.
- **⚠️ Resetuj podatke** — briše sve odgovore, zadržava zaglavlje i stil. Traži
  potvrdu i prvo prikaže koliko će redova obrisati. Pokreni posle probnog kruga.

Setup fajl ne utiče na `doPost` (prijem odgovora) — služi samo za pripremu i
održavanje tabele.

### Duplikati i deljeni uređaji

- Svaki pokušaj slanja nosi oznaku `_id`; server je pamti 6 sati, pa ponovni
  klik posle mrežnog prekida **ne pravi drugi red**.
- `localStorage` blokira ponovno popunjavanje po **uređaju**, ne po osobi. Zato
  ekran „Već ste popunili upitnik" ima diskretno dugme *„Nisam ja — upitnik
  popunjava drugi učesnik"*: bez njega bi jedan tablet koji kruži po probi tiho
  odbijao sve učesnike posle prvog. Blokada se ionako trivijalno zaobilazi
  (incognito / brisanje podataka) — ona sprečava slučajno, ne namerno dupliranje.

---

## Tehničke napomene

- Čist HTML/CSS/JS, bez framework-a ni zavisnosti
- Responzivan — optimizovan za mobilne uređaje
- Fontovi (Lora + Source Sans 3) su samostalno hostovani u `assets/fonts/` (woff2, subset latin + latin-ext) — bez zahteva ka Google Fonts CDN-u, zbog privatnosti ispitanika
- Potpis se čuva kao base64 PNG u skrivenom `input` polju
- Validacija se vrši na klijentskoj strani pre slanja forme
