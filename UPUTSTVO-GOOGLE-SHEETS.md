# Povezivanje upitnika sa Google tabelom

Upitnik: **Grupne aktivnosti i blagostanje** (muzika · sport · folklor)

Ovo uputstvo se prolazi **jednom**, pre nego što se link podeli učesnicima.
Traje 10–15 minuta. Sve radiš iz svog Google naloga.

> ⚠️ **Ovaj upitnik ima svoju, zasebnu tabelu.** Upitnik „Umetničke preferencije
> nastavnika" (folder `UPITNIK-UP`) je drugo istraživanje sa svojom tabelom i
> svojim tokenom. Ne povezuj ih na isti endpoint: `tip_upitnika=muzika` postoji
> u oba i dva uzorka bi se pomešala u istom tabu „Muzika".

---

## Korak 1 · Napravi tabelu

1. Otvori [sheets.new](https://sheets.new) — pravi se prazna tabela.
2. Nazovi je npr. **„Upitnik MSF — odgovori"**.

Ne pravi ručno nikakve tabove i ne upisuj zaglavlje — skripta to radi sama u
koraku 5.

---

## Korak 2 · Otvori Apps Script

U tabeli: **Extensions → Apps Script**.

Otvara se editor sa jednim fajlom `Code.gs` u kome piše prazna funkcija
`myFunction`. Obriši sve iz njega.

---

## Korak 3 · Nalepi dva fajla

**Fajl 1 — prijemnik odgovora**

U `Code.gs` nalepi kompletan sadržaj fajla `server/apps-script.gs`.

**Fajl 2 — priprema tabele**

Levo, pored „Files", klikni **+ → Script**. Nazovi ga `Setup` i nalepi
kompletan sadržaj fajla `server/apps-script-setup.gs`.

Klikni **Save** (ikonica diskete ili Ctrl/Cmd + S).

> Zašto dva fajla: prvi prima odgovore i mora da bude tu da bi upitnik radio.
> Drugi samo priprema i održava izgled tabele. Apps Script ih deli u istom
> prostoru, pa drugi fajl koristi definicije kolona iz prvog — zaglavlje tabele
> i kod koji upisuje odgovore ne mogu da se raziđu.

---

## Korak 4 · Proveri token

U `Code.gs`, blizu vrha, stoji:

```js
var TOKEN = '4a0e2d47b110d8f0bb58ab48a4b59b1b6b181bc360b6fbce';
```

Otvori `assets/config.js` u folderu upitnika i uporedi sa:

```js
window.UPITNIK_TOKEN = '4a0e2d47b110d8f0bb58ab48a4b59b1b6b181bc360b6fbce';
```

**Ova dva stringa moraju biti identična.** Ako nisu, server odbija svaki
odgovor sa `greska: 'token'`, a učesnik vidi „Došlo je do greške pri slanju" —
i njegov odgovor je nepovratno izgubljen.

Token nije prava tajna (vidljiv je svakome ko otvori izvorni kod strane) —
on je samo minimalna prepreka da neko slučajno ne šalje smeće na tvoj endpoint.

---

## Korak 5 · Pripremi tabelu

1. Vrati se na tabelu i osveži stranu (F5 / Cmd + R).
2. U meniju, pored „Help", pojavio se **„Upitnik"**.
3. Klikni **Upitnik → 1 · Pripremi tabele**.
4. Prvi put Google traži dozvolu:
   - *Authorization required* → **Review permissions**
   - izaberi svoj nalog
   - „Google hasn't verified this app" → **Advanced** → **Go to … (unsafe)**
     (skripta je tvoja i pristupa samo ovoj tabeli — ovo je normalan Google
     ekran za nepotpisane lične skripte)
   - **Allow**
5. Pokreni **Upitnik → 1 · Pripremi tabele** ponovo ako se prekinulo zbog
   dozvole.

Dobio si tri taba — **Muzika**, **Sport**, **Folklor** — sa punim zaglavljem,
zamrznutim prvim redom i prve tri kolone, i objašnjenjem u svakoj ćeliji
zaglavlja (pređi mišem preko naziva kolone).

Odmah zatim pokreni i:

- **Upitnik → 2 · Napravi legendu** — tab „Legenda" sa punim tekstom svakog
  pitanja i opsegom vrednosti. Ovo je ono što ti treba za pola godine, kad se
  vratiš podacima i ne sećaš se šta je `p_neg7`.

---

## Korak 6 · Objavi kao web aplikaciju

U Apps Script editoru: **Deploy → New deployment**.

1. Pored „Select type" klikni zupčanik → **Web app**
2. Popuni:

| Polje | Vrednost |
|---|---|
| Description | `upitnik v1` (bilo šta) |
| Execute as | **Me** |
| Who has access | **Anyone** |

> ⚠️ **„Who has access: Anyone" je obavezno.** Sa „Anyone with Google account"
> anonimni učesnik dobija Google login stranu umesto odgovora, i upis pada.
> „Anyone" ne znači da bilo ko vidi tabelu — samo da endpoint prima zahteve.

3. **Deploy** → kopiraj **Web app URL**.

URL izgleda ovako i **mora da se završava na `/exec`** (ne `/dev`):

```
https://script.google.com/macros/s/AKfycb.../exec
```

**Provera:** otvori taj URL u brauzeru. Treba da vidiš:

```json
{"status":"ok","poruka":"Servis radi. Odgovori stižu POST zahtevom iz upitnika."}
```

Ako vidiš Google login ili grešku — vrati se na „Who has access".

---

## Korak 7 · Upiši URL u upitnik

Otvori `assets/config.js` i zameni vrednost:

```js
window.UPITNIK_URL = 'https://script.google.com/macros/s/AKfycb.../exec';
```

Sačuvaj i objavi izmenu na GitHub Pages (commit + push).

> `config.js` se **namerno komituje** u Git. Sajt je statičan i GitHub Pages
> servira samo fajlove iz repozitorijuma — bez ovog fajla forma na živom sajtu
> nema URL i ne šalje ništa.

---

## Korak 8 · Probni krug

Popuni upitnik do kraja — za sve tri grupe i bar dva nivoa angažovanja.

Proveri u tabeli:

- red se pojavio u tabu grupe koju si izabrao
- kolona `nivo` sadrži izabrani nivo
- Likert odgovori su **brojevi** poravnati desno, a ne tekst poravnat levo
  (ako su tekst, `AVERAGE` neće raditi — javi, nešto nije u redu)
- `saglasnost` je `da` (sam crtež potpisa se **nikad ne šalje** — samo potvrda
  da je nacrtan)
- kolone `nivo`-zavisnih blokova popunjene su samo za izabrani nivo, ostale su
  prazne — tako i treba

Pokreni **Upitnik → 3 · Osveži pregled** da vidiš zbirni tab „Pregled".

> Ako želiš da vidiš kako popunjena tabela izgleda pre pravog kruga:
> **Upitnik → Napravi TEST tabele sa primerima** pravi tabove „Muzika (TEST)"
> itd. sa po tri izmišljena odgovora. Obriši ih posle sa **Obriši TEST tabele**.

---

## Korak 9 · Reset pre pravog prikupljanja

Kad si zadovoljan probom:

**Upitnik → ⚠️ Resetuj podatke (obriši sve odgovore)**

Skripta prvo prikaže koliko odgovora ima po tabu i traži potvrdu. Briše samo
redove sa odgovorima — zaglavlje, stil i beleške ostaju.

Obriši i TEST tabove ako si ih pravio.

**Tabela je sada spremna. Podeli link učesnicima.**

---

## Održavanje

### Posle svake izmene `.gs` koda

**Deploy → Manage deployments → ✏️ (Edit) → Version: New version → Deploy**

URL ostaje isti. **Bez ovog koraka i dalje radi stara verzija koda** — ovo je
najčešći uzrok „promenio sam skriptu, a ništa se nije promenilo".

### Posle izmene pitanja u upitniku

Ako dodaješ, brišeš ili menjaš redosled pitanja, moraš da ažuriraš liste
`KOLONE` u `apps-script.gs` (i tekstove u `apps-script-setup.gs`). Nova polja
će inače raditi, ali će završiti kao nove kolone na kraju tabele umesto na
svom mestu u redosledu.

### Redovno

- **Upitnik → 3 · Osveži pregled** — brz uvid koliko je odgovora stiglo
- Tabela sama pravi rezervnu kopiju kroz istoriju verzija
  (**File → Version history**)

---

## Šta je gde u tabeli

| Tab | Sadržaj |
|---|---|
| **Muzika / Sport / Folklor** | Odgovori, jedan red = jedan učesnik |
| **Legenda** | Za svaku kolonu: sekcija, pun tekst pitanja, opseg vrednosti |
| **Pregled** | Broj odgovora po grupi i nivou, prvi i poslednji odgovor |

Prve kolone svakog taba:

| Kolona | Značenje |
|---|---|
| `_vreme` | Vreme prijema (upisuje server) |
| `tip_upitnika` | `muzika` / `sport` / `folklor` |
| `nivo` | `amater` / `rekreativac` / `profesionalac` |

Zatim demografija, pa skale redom kojim se pojavljuju u upitniku:
WHO-5 → Fizička dobrobit → SWLS → MHC-SF → SPS-10 → Odnos sa liderom → FAS →
Negativni faktori → `saglasnost`.

Polja nivo-zavisnih blokova nose prefiks nivoa: `a_` (amater), `r_`
(rekreativac), `p_` (profesionalac). Za jednog učesnika popunjen je samo jedan
set — ostali su prazni.

### Za analizu

**File → Download → Comma-separated values (.csv)** preuzima aktivni tab.
Za SPSS/R/Python učitaj svaki tab zasebno; brojne kolone su već brojevi.

---

## Ako nešto ne radi

Učesnik uvek vidi istu poruku („Došlo je do greške pri slanju"), a pravi razlog
se vidi u Apps Script editoru: **Executions** (leva traka, ikonica sata).

| `greska` | Šta znači | Šta uraditi |
|---|---|---|
| `token` | TOKEN u skripti ≠ token u `config.js` | Uskladi ih (korak 4) i uradi novi deployment |
| `tip_upitnika` | Stigla nepoznata grupa | Proveri `<input name="tip_upitnika">` u HTML-u |
| `nivo` | Nivo nije amater/rekreativac/profesionalac | Proveri `?nivo=` u linku |
| `godine` | Van opsega 18–80 | Proveri `min`/`max` na polju u HTML-u |
| `duzina_veca_od_godina` | Dužina učešća veća od godina starosti | Greška u kucanju kod učesnika |
| `opseg_polja:xxx` | Likert vrednost van opsega skale | Neko je menjao zahtev ručno, ili je opseg u `OPSEG_SKALA` pogrešan |
| `previse_polja` | Više od 250 polja | Pokušaj zloupotrebe |
| `nedozvoljeno_polje` | Ime polja van `[A-Za-z0-9_]` | Pokušaj zloupotrebe |
| `prazan_zahtev` | POST bez tela | Obično bot |

**Nema nikakve greške, ali ni reda u tabeli?**
1. Otvori `/exec` URL u brauzeru — mora da vrati `{"status":"ok",…}`.
   Ako vraća Google login: „Who has access" nije „Anyone".
2. Proveri da li si posle poslednje izmene koda uradio **New version** deploy.
3. U brauzeru na strani upitnika otvori Developer Tools → Console i pošalji
   formu — vidi se tačan odgovor servera.

**Odgovor je stigao dva puta?**
Ne bi trebalo — svaki pokušaj slanja nosi oznaku `_id` i server prepoznaje
ponovljeni pokušaj u roku od 6 sati. Ako se ipak desi, obriši višak reda ručno.

**Učesnik kaže „piše da sam već popunio, a nisam"?**
Blokada je po uređaju (`localStorage`), pa deljeni tablet/računar to izaziva.
Na tom ekranu postoji dugme **„Nisam ja — upitnik popunjava drugi učesnik"**
koje ga oslobađa.
