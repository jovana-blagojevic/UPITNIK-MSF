/* ══════════════════════════════════════════════════════════════════════════
   UPITNIK „GRUPNE AKTIVNOSTI I BLAGOSTANJE" (muzika · sport · folklor)
   Apps Script — prijem odgovora i upis u Google Sheets
   ──────────────────────────────────────────────────────────────────────────
   OVAJ FAJL JE IZVOR ISTINE ZA SERVERSKI KOD. Kod se NE izvršava iz Git-a —
   nalepi ga u Apps Script editor tabele u koju se upisuje (Code.gs).

   Puno uputstvo korak po korak: ../UPUTSTVO-GOOGLE-SHEETS.md

   UKRATKO:
     1. Google tabela → Extensions → Apps Script
     2. Nalepi ovaj fajl u „Code.gs"
     3. Proveri da je TOKEN ispod IDENTIČAN sa window.UPITNIK_TOKEN u
        assets/config.js — ako nije, svaki odgovor se odbija sa greska:'token'
     4. Deploy → New deployment → Web app
          Execute as:     Me
          Who has access: Anyone     ← bez ovoga anonimni fetch dobija Google
                                       login stranu umesto JSON-a i upis pada
     5. Kopiraj „/exec" URL u window.UPITNIK_URL u assets/config.js

   ⚠️ Posle SVAKE izmene ovog koda: Deploy → Manage deployments → ✏️ →
      Version: New version → Deploy. URL ostaje isti; bez ovog koraka i dalje
      radi stara verzija.

   KAKO RADI (uparuje se sa assets/script.js):
     • Klijent POST-uje ravan JSON: sva polja forme (po „name") + token + _id.
       Telo ide BEZ Content-Type: application/json (namerno — izbegava CORS
       preflight); Apps Script svejedno čita e.postData.contents.
     • saglasnost stiže kao 'da' — sam crtež potpisa se NIKAD ne šalje.
     • _id je oznaka pokušaja slanja. Ako mreža pukne posle timeout-a, a red je
       već upisan, ponovni klik nosi ISTI _id i server ne pravi drugi red.
     • Numerička polja i Likert odgovori se upisuju kao BROJEVI (ne tekst), pa
       su AVERAGE/STDEV odmah upotrebljivi bez VALUE() omotača.
     • Zaglavlje se pri prvom odgovoru zaseje iz KOLONE — redosled kolona je
       isti kao redosled pitanja u upitniku, od prvog reda. Nepoznati ključevi
       (npr. „Dodaj još" setovi _2, _3…) se dopisuju na kraj, ništa se ne gubi.
   ══════════════════════════════════════════════════════════════════════════ */

/* Mora biti IDENTIČAN sa window.UPITNIK_TOKEN u assets/config.js.
   Nije prava tajna (vidljiv je u brauzeru) — samo minimalna prepreka. */
var TOKEN = '4a0e2d47b110d8f0bb58ab48a4b59b1b6b181bc360b6fbce';

/* tip_upitnika → ime taba. Ujedno i lista dozvoljenih grupa. */
var TABOVI = {
  muzika: 'Muzika',
  sport: 'Sport',
  folklor: 'Folklor'
};

/* Dozvoljeni nivoi angažovanja (stižu iz ?nivo= sa ekrana nivo-*.html). */
var NIVOI = ['amater', 'rekreativac', 'profesionalac'];

/* Tehnička polja koja se NE upisuju u tabelu. */
var IZUZMI = { token: true, hp_polje: true, _id: true };

/* Zaštita tabele od „flooding"-a kolona: upis je header-driven, pa bi inače
   bilo ko POST-om sa izmišljenim ključevima mogao da pravi nove kolone bez
   ograničenja. Najveći legitiman payload ima 112 polja. */
var MAX_KLJUCEVA = 250;
var KLJUC_OBLIK = /^[A-Za-z0-9_]{1,48}$/;
var ID_OBLIK = /^[A-Za-z0-9_-]{8,64}$/;
var MAX_DUZINA_VREDNOSTI = 500;

/* Koliko dugo se pamti _id radi prepoznavanja duplikata (6 h = maksimum
   koji CacheService dozvoljava; jedno popunjavanje traje 10–15 min). */
var DEDUPE_SEK = 21600;

/* Opsezi Likert skala — provereni prema value atributima u samim upitnicima.
   Vrednost van opsega znači ručno menjanje zahteva, ne grešku učesnika. */
var OPSEG_SKALA = [
  [/^who\d+$/,           1, 6],  // WHO-5
  [/^swls\d+$/,          1, 7],  // SWLS
  [/^mhc\d+$/,           1, 6],  // MHC-SF
  [/^sps\d+$/,           1, 4],  // SPS-10
  [/^fas\d+$/,           1, 5],  // FAS
  [/^[arp]_fiz\d+$/,     1, 5],  // Fizička dobrobit
  [/^[arp]_lider\d+$/,   1, 5],  // Odnos sa liderom
  [/^[arp]_neg\d+$/,     1, 5]   // Negativni faktori
];

/* ── Kanonski redosled kolona po grupi ────────────────────────────────────
   Izvučen iz DOM redosleda <input name> u strane/index-*.html. Ako menjaš
   pitanja u upitniku, ove liste moraju da prate izmenu — inače će nova polja
   samo završiti na kraju tabele umesto na svom mestu.
   ────────────────────────────────────────────────────────────────────────── */
var KOLONE = {
  muzika: [
    "_vreme", "tip_upitnika", "nivo", "pol", "godine",
    "muzicko_obrazovanje", "vrsta_muzike", "vrsta_muzike_drugo", "duzina", "dodatna_aktivnost", "dodatna_aktivnost_nivo",
    "prethodna_aktivnost", "prethodna_nivo", "prethodna_trajanje", "who1", "who2",
    "who3", "who4", "who5", "a_fiz1", "a_fiz2",
    "a_fiz3", "a_fiz4", "p_fiz1", "p_fiz2", "p_fiz3",
    "p_fiz4", "r_fiz1", "r_fiz2", "r_fiz3", "r_fiz4",
    "swls1", "swls2", "swls3", "swls4", "swls5",
    "mhc1", "mhc2", "mhc3", "mhc4", "mhc5",
    "mhc6", "mhc7", "mhc8", "mhc9", "mhc10",
    "mhc11", "mhc12", "mhc13", "mhc14", "sps1",
    "sps2", "sps3", "sps4", "sps5", "sps6",
    "sps7", "sps8", "sps9", "sps10", "a_lider1",
    "a_lider2", "a_lider3", "a_lider4", "a_lider5", "p_lider1",
    "p_lider2", "p_lider3", "p_lider4", "p_lider5", "r_ima_vodju",
    "r_lider1", "r_lider2", "r_lider3", "r_lider4", "r_lider5",
    "fas1", "fas2", "fas3", "fas4", "fas5",
    "fas6", "fas7", "fas8", "fas9", "fas10",
    "a_neg1", "a_neg2", "a_neg3", "a_neg4", "a_neg5",
    "a_neg6", "a_neg7", "a_neg8", "p_neg1", "p_neg2",
    "p_neg3", "p_neg4", "p_neg5", "p_neg6", "p_neg7",
    "p_neg8", "p_neg9", "r_neg1", "r_neg2", "r_neg3",
    "r_neg4", "r_neg5", "r_neg6", "r_neg7", "saglasnost"
  ],
  sport: [
    "_vreme", "tip_upitnika", "nivo", "pol", "godine",
    "vrsta_sporta", "duzina", "dodatna_aktivnost", "dodatna_aktivnost_nivo", "prethodna_aktivnost", "prethodna_nivo",
    "prethodna_trajanje", "who1", "who2", "who3", "who4",
    "who5", "a_fiz1", "a_fiz2", "a_fiz3", "a_fiz4",
    "p_fiz1", "p_fiz2", "p_fiz3", "p_fiz4", "r_fiz1",
    "r_fiz2", "r_fiz3", "r_fiz4", "swls1", "swls2",
    "swls3", "swls4", "swls5", "mhc1", "mhc2",
    "mhc3", "mhc4", "mhc5", "mhc6", "mhc7",
    "mhc8", "mhc9", "mhc10", "mhc11", "mhc12",
    "mhc13", "mhc14", "sps1", "sps2", "sps3",
    "sps4", "sps5", "sps6", "sps7", "sps8",
    "sps9", "sps10", "a_lider1", "a_lider2", "a_lider3",
    "a_lider4", "a_lider5", "p_lider1", "p_lider2", "p_lider3",
    "p_lider4", "p_lider5", "r_ima_vodju", "r_lider1", "r_lider2",
    "r_lider3", "r_lider4", "r_lider5", "fas1", "fas2",
    "fas3", "fas4", "fas5", "fas6", "fas7",
    "fas8", "fas9", "fas10", "a_neg1", "a_neg2",
    "a_neg3", "a_neg4", "a_neg5", "a_neg6", "a_neg7",
    "a_neg8", "p_neg1", "p_neg2", "p_neg3", "p_neg4",
    "p_neg5", "p_neg6", "p_neg7", "p_neg8", "p_neg9",
    "r_neg1", "r_neg2", "r_neg3", "r_neg4", "r_neg5",
    "r_neg6", "r_neg7", "r_neg8", "saglasnost"
  ],
  folklor: [
    "_vreme", "tip_upitnika", "nivo", "pol", "godine",
    "vrsta_folklora", "vrsta_folklora_drugo", "duzina", "dodatna_aktivnost", "dodatna_aktivnost_nivo", "prethodna_aktivnost",
    "prethodna_nivo", "prethodna_trajanje", "who1", "who2", "who3",
    "who4", "who5", "a_fiz1", "a_fiz2", "a_fiz3",
    "a_fiz4", "p_fiz1", "p_fiz2", "p_fiz3", "p_fiz4",
    "r_fiz1", "r_fiz2", "r_fiz3", "r_fiz4", "swls1",
    "swls2", "swls3", "swls4", "swls5", "mhc1",
    "mhc2", "mhc3", "mhc4", "mhc5", "mhc6",
    "mhc7", "mhc8", "mhc9", "mhc10", "mhc11",
    "mhc12", "mhc13", "mhc14", "sps1", "sps2",
    "sps3", "sps4", "sps5", "sps6", "sps7",
    "sps8", "sps9", "sps10", "a_lider1", "a_lider2",
    "a_lider3", "a_lider4", "a_lider5", "p_lider1", "p_lider2",
    "p_lider3", "p_lider4", "p_lider5", "r_ima_vodju", "r_lider1",
    "r_lider2", "r_lider3", "r_lider4", "r_lider5", "fas1",
    "fas2", "fas3", "fas4", "fas5", "fas6",
    "fas7", "fas8", "fas9", "fas10", "a_neg1",
    "a_neg2", "a_neg3", "a_neg4", "a_neg5", "a_neg6",
    "a_neg7", "a_neg8", "p_neg1", "p_neg2", "p_neg3",
    "p_neg4", "p_neg5", "p_neg6", "p_neg7", "p_neg8",
    "p_neg9", "r_neg1", "r_neg2", "r_neg3", "r_neg4",
    "r_neg5", "r_neg6", "r_neg7", "r_neg8", "saglasnost"
  ]
};


/* ── Ulazne tačke ─────────────────────────────────────────────────────────── */

/* Otvaranje /exec URL-a u brauzeru — da se odmah vidi da servis radi. */
function doGet() {
  return _json({ status: 'ok', poruka: 'Servis radi. Odgovori stižu POST zahtevom iz upitnika.' });
}


function doPost(e) {
  /* Lock serijalizuje upise: bez njega bi dva istovremena slanja mogla da
     pokvare zaglavlje ili da pišu u isti red. */
  var lock = LockService.getScriptLock();
  var imamLock = false;
  try {
    lock.waitLock(25000);
    imamLock = true;

    if (!e || !e.postData || !e.postData.contents) {
      return _json({ status: 'error', greska: 'prazan_zahtev' });
    }

    var p = JSON.parse(e.postData.contents);

    /* 1) Token — minimalna prepreka (nije prava tajna, vidi config.js). */
    if (p.token !== TOKEN) {
      return _json({ status: 'error', greska: 'token' });
    }

    /* 2) Honeypot — popunjeno znači bot. Tiho prihvati (da bot ne sazna da je
          otkriven), ali NE upisuj ništa. */
    if (p.hp_polje && String(p.hp_polje).trim() !== '') {
      return _json({ status: 'ok' });
    }

    /* 3) Duplikat: isti _id je već upisan (ponovni klik posle mrežnog
          timeout-a). Vrati ok — učesnik vidi zahvalnicu, tabela ostaje čista. */
    var cache = CacheService.getScriptCache();
    var kljucId = null;
    if (p._id && ID_OBLIK.test(String(p._id))) {
      kljucId = 'poslato_' + String(p._id);
      if (cache.get(kljucId)) {
        return _json({ status: 'ok', napomena: 'duplikat' });
      }
    }

    /* 4) Osnovna validacija ključnih polja. */
    var tip = String(p.tip_upitnika || '');
    if (!TABOVI[tip]) {
      return _json({ status: 'error', greska: 'tip_upitnika' });
    }

    /* nivo — stiže iz hidden polja koje puni ?nivo= parametar */
    if (NIVOI.indexOf(String(p.nivo)) === -1) {
      return _json({ status: 'error', greska: 'nivo' });
    }

    /* Unakrsna provera koju pojedinačna polja ne mogu da uhvate:
       niko ne može da bude u grupi duže nego što je živ. */
    if (Number(p.duzina) > Number(p.godine)) {
      return _json({ status: 'error', greska: 'duzina_veca_od_godina' });
    }

    /* 5) Oblik payload-a — broj i imena ključeva (vidi MAX_KLJUCEVA gore). */
    var kljucevi = Object.keys(p);
    if (kljucevi.length > MAX_KLJUCEVA) {
      return _json({ status: 'error', greska: 'previse_polja' });
    }
    for (var i = 0; i < kljucevi.length; i++) {
      if (!KLJUC_OBLIK.test(kljucevi[i])) {
        return _json({ status: 'error', greska: 'nedozvoljeno_polje' });
      }
    }

    /* 6) Upis u tab odgovarajuće grupe (pravi ga ako ne postoji). */
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(TABOVI[tip]) || ss.insertSheet(TABOVI[tip]);
    upisiRed(sh, p, tip);

    if (kljucId) cache.put(kljucId, '1', DEDUPE_SEK);
    return _json({ status: 'ok' });

  } catch (err) {
    return _json({ status: 'error', greska: String(err && err.message ? err.message : err) });
  } finally {
    if (imamLock) lock.releaseLock();
  }
}


/* ── Upis ─────────────────────────────────────────────────────────────────── */

/* Upisuje jedan red. Prazan tab dobija kompletno kanonsko zaglavlje odjednom;
   kasnije se dopisuju samo ključevi koje zaglavlje još nema. */
function upisiRed(sh, p, tip) {
  var lastCol = sh.getLastColumn();
  var header = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];
  var prazno = !header.length || header.every(function(h) { return String(h).trim() === ''; });

  if (prazno) {
    header = (KOLONE[tip] || ['_vreme']).slice();
    var maxKol = sh.getMaxColumns();
    if (maxKol < header.length) sh.insertColumnsAfter(maxKol, header.length - maxKol);
    sh.getRange(1, 1, 1, header.length).setValues([header]);
  }

  /* Mapa: ime kolone → indeks. */
  var idx = {};
  header.forEach(function(h, i) { idx[h] = i; });

  /* Dopiši kolone za ključeve koje zaglavlje još nema (npr. „Dodaj još"
     setovi _2, _3… ili polje dodato u upitnik posle prvog odgovora). */
  var novi = [];
  Object.keys(p).forEach(function(k) {
    if (IZUZMI[k]) return;
    if (!(k in idx)) {
      idx[k] = header.length + novi.length;
      novi.push(k);
    }
  });
  if (novi.length) {
    var maxK = sh.getMaxColumns();
    if (maxK < header.length + novi.length) sh.insertColumnsAfter(maxK, header.length + novi.length - maxK);
    sh.getRange(1, header.length + 1, 1, novi.length).setValues([novi]);
    header = header.concat(novi);
  }

  /* Sastavi ceo red PRE upisa — ako neka vrednost ispadne iz opsega,
     vrednostZaUpis baca izuzetak i tabela ostaje netaknuta. */
  var red = new Array(header.length).fill('');
  if ('_vreme' in idx) red[idx['_vreme']] = new Date();
  Object.keys(p).forEach(function(k) {
    if (!IZUZMI[k]) red[idx[k]] = vrednostZaUpis(k, p[k]);
  });
  sh.appendRow(red);
}


/* ── Vrednosti ────────────────────────────────────────────────────────────── */

/* Opseg za polje koje mora da bude ceo broj, ili null za tekstualna polja. */
function opsegZa(k) {
  if (k === 'godine') return [18, 80];                        // godine starosti
  if (k === 'duzina') return [0, 60];                         // dužina učešća
  if (/^prethodna_trajanje(_\d+)?$/.test(k)) return [0, 60];  // trajanje prethodne aktivnosti
  for (var i = 0; i < OPSEG_SKALA.length; i++) {
    if (OPSEG_SKALA[i][0].test(k)) return [OPSEG_SKALA[i][1], OPSEG_SKALA[i][2]];
  }
  return null;
}

/* Brojna polja se upisuju kao BROJEVI (ne tekst) — inače AVERAGE/STDEV u
   tabeli ne rade bez VALUE(). Prazna opciona polja ostaju prazna ćelija. */
function vrednostZaUpis(k, v) {
  var opseg = opsegZa(k);
  if (!opseg) return bezbednaVrednost(v);

  if (v === '' || v === null || v === undefined) return '';
  var n = Number(v);
  if (!isFinite(n) || Math.floor(n) !== n || n < opseg[0] || n > opseg[1]) {
    throw new Error('opseg_polja:' + k);
  }
  return n;
}

/* Zaštita od CSV/formula injection: vrednost koju Sheets može protumačiti kao
   formulu (počinje sa = + - @, ili vodeći tab/CR) tretiraj kao čist tekst —
   dodaj vodeći apostrof. Stringovi se i skraćuju (legitimna polja su kratka;
   saglasnost stiže kao 'da'). */
function bezbednaVrednost(v) {
  if (typeof v !== 'string') return v;
  v = v.slice(0, MAX_DUZINA_VREDNOSTI);
  return /^[=+\-@\t\r]/.test(v) ? "'" + v : v;
}


/* Pomoćnik: JSON odgovor sa ispravnim MIME tipom. */
function _json(o) {
  return ContentService
    .createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
}
