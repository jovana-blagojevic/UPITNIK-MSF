/* ══════════════════════════════════════════════════════════════════════════
   UPITNIK — Priprema i stilizacija tabela (jednokratni setup)
   ──────────────────────────────────────────────────────────────────────────
   Ovaj fajl je SAMOSTALAN dodatak uz apps-script.gs. Nalepi ga kao DRUGI .gs
   fajl u istom Apps Script projektu (vezanom za tabelu u koju se upisuje), pa
   ga pokreni JEDNOM. Pravi i stilizuje tabove u bojama upitnika.

   KAKO POKRENUTI (dva načina):
     A) Preko menija (lakše): osveži tabelu (reload) → u meniju se pojavi
        „Upitnik ▸ …" → klikni „1 · Pripremi tabele".
     B) Iz editora: izaberi funkciju `pripremiTabele` → Run.
        (Prvi put traži dozvolu pristupa tabeli — odobri.)

   ŠTA PRAVI:
     • pripremiTabele()      → tabovi Muzika / Sport / Folklor sa stilizovanim,
                               zamrznutim zaglavljem (sve kolone, pravim redom).
                               BEZBEDNO: ako tab već ima podatke, NE dira sadržaj —
                               samo osveži stil zaglavlja.
     • pripremiTestTabele()  → „Muzika (TEST)", „Sport (TEST)", „Folklor (TEST)"
                               sa istom stilizacijom + nekoliko primera odgovora,
                               da odmah vidiš kako izgleda. Slobodno ih obriši.
     • obrisiTestTabele()    → briše tri (TEST) taba.

   STIL: tamni ugljen #4D4B47 + plavi akcenat (kao „izabrano"/dugme u upitniku),
   krem trake za redove, zamrznut 1. red i prve 3 kolone, beleške (note) na
   svakom zaglavlju sa objašnjenjem polja.

   Ovaj fajl NE utiče na doPost — služi samo za pripremu izgleda tabele.
   ══════════════════════════════════════════════════════════════════════════ */

/* Grupa → ime taba (samostalno, ne zavisi od apps-script.gs). */
var GRUPE = { muzika: 'Muzika', sport: 'Sport', folklor: 'Folklor' };
var TEST_SUFIKS = ' (TEST)';

/* Boje izvedene iz dizajna upitnika (style.css). */
var STIL = {
  ugljen:  '#4D4B47',   // .upitnik tamna kartica / zaglavlje
  plava:   '#0B3D66',   // akcenat (oklch(0.34 0.09 250) → sRGB)
  tekst:   '#F3F1EC',   // krem tekst na tamnoj podlozi
  traka1:  '#FBFAF6',   // svetlija traka reda
  traka2:  '#EFEDE6',   // tamnija traka reda
  ivica:   '#D5D0C7'    // --ivica
};

/* Meni u tabeli (pojavi se posle reload-a tabele). */
function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Upitnik')
      .addItem('1 · Pripremi tabele (Muzika/Sport/Folklor)', 'pripremiTabele')
      .addItem('2 · Napravi TEST tabele sa primerima', 'pripremiTestTabele')
      .addSeparator()
      .addItem('Obriši TEST tabele', 'obrisiTestTabele')
      .addToUi();
  } catch (e) { /* bez UI konteksta (npr. trigger) — preskoči */ }
}


/* ── Glavne akcije ─────────────────────────────────────────────────────── */

/* Pravi/stilizuje prave tabove. Ne dira postojeće podatke. */
function pripremiTabele() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(GRUPE).forEach(function(tip) {
    var sh = ss.getSheetByName(GRUPE[tip]) || ss.insertSheet(GRUPE[tip]);
    var kol;
    if (sh.getLastRow() > 1) {
      /* Već ima podatke — zadrži postojeće zaglavlje, samo ga restiluj. */
      kol = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    } else {
      kol = koloneZa(tip);
      obezbediDimenzije(sh, kol.length);
      sh.getRange(1, 1, 1, kol.length).setValues([kol]);
    }
    stilizujTab(sh, kol);
  });
  poruka('Gotovo. Tabele Muzika / Sport / Folklor su pripremljene i stilizovane.');
}

/* Pravi TEST tabove sa primerima odgovora (da se vidi izgled). */
function pripremiTestTabele() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(GRUPE).forEach(function(tip) {
    var ime = GRUPE[tip] + TEST_SUFIKS;
    var sh = ss.getSheetByName(ime) || ss.insertSheet(ime);
    sh.getBandings().forEach(function(b) { b.remove(); });
    sh.clear();
    var kol = koloneZa(tip);
    obezbediDimenzije(sh, kol.length);
    sh.getRange(1, 1, 1, kol.length).setValues([kol]);
    var redovi = uzorciZa(tip, kol);
    if (redovi.length) sh.getRange(2, 1, redovi.length, kol.length).setValues(redovi);
    stilizujTab(sh, kol);
  });
  poruka('Test tabele napravljene sa primerima:\nMuzika (TEST), Sport (TEST), Folklor (TEST).');
}

/* Briše TEST tabove. */
function obrisiTestTabele() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var obrisano = 0;
  Object.keys(GRUPE).forEach(function(tip) {
    var sh = ss.getSheetByName(GRUPE[tip] + TEST_SUFIKS);
    if (sh) { ss.deleteSheet(sh); obrisano++; }
  });
  poruka('Obrisano TEST tabova: ' + obrisano + '.');
}


/* ── Definicija kolona (redosled u tabeli = redosled u upitniku) ───────────
   Redosled VERNO prati DOM forme svake grupe: script.js šalje polja u DOM
   redosledu, pa header-driven upis u apps-script.gs dopisuje kolone istim
   redom — zato i pripremljeno zaglavlje mora da bude identično.
   NB: muzika i sport prepliću skale sa nivo-blokovima (who → fiz → swls →
   mhc → sps → lider → fas → neg); folklor ide mhc → sps → who → swls → fas. */

function koloneZa(tip) {
  var glava = ['_vreme', 'tip_upitnika', 'nivo'];

  if (tip === 'muzika') {
    var demM = ['pol', 'godine', 'muzicko_obrazovanje', 'vrsta_muzike',
                'vrsta_muzike_drugo', 'duzina', 'dodatna_aktivnost'];
    return glava.concat(demM).concat(prethodnaKolone())
      .concat(skala('who', 5)).concat(fizKolone())
      .concat(skala('swls', 5)).concat(skala('mhc', 14)).concat(skala('sps', 10))
      .concat(liderKolone()).concat(skala('fas', 10)).concat(negKolone())
      .concat(['saglasnost']);
  }

  if (tip === 'sport') {
    var demS = ['pol', 'godine', 'vrsta_sporta', 'tip_sporta', 'duzina'];
    return glava.concat(demS).concat(prethodnaKolone())
      .concat(skala('who', 5)).concat(fizKolone())
      .concat(skala('swls', 5)).concat(skala('mhc', 14)).concat(skala('sps', 10))
      .concat(liderKolone()).concat(skala('fas', 10)).concat(negKolone())
      .concat(['saglasnost']);
  }

  /* folklor — nema nivo-zavisnih blokova */
  var demF = ['pol', 'godine', 'vrsta_folklora', 'vrsta_folklora_drugo', 'duzina'];
  return glava.concat(demF).concat(prethodnaKolone())
    .concat(skala('mhc', 14)).concat(skala('sps', 10)).concat(skala('who', 5))
    .concat(skala('swls', 5)).concat(skala('fas', 10))
    .concat(['saglasnost']);
}

/* Prethodne aktivnosti: osnovna + dva „Dodaj još" slota (_2, _3).
   Ako neko doda više, doPost samo dopiše _4, _5… na kraj — ništa se ne gubi. */
function prethodnaKolone() {
  var a = ['prethodna_aktivnost', 'prethodna_nivo', 'prethodna_trajanje'];
  for (var n = 2; n <= 3; n++) {
    a.push('prethodna_aktivnost_' + n, 'prethodna_nivo_' + n, 'prethodna_trajanje_' + n);
  }
  return a;
}

/* Jedna skala: prefiks + 1..n. Opsezi: mhc 1–6, sps 1–4, who 1–6, swls 1–7,
   fas 1–5 (identične u sva tri upitnika). */
function skala(prefiks, n) {
  var a = [];
  for (var i = 1; i <= n; i++) a.push(prefiks + i);
  return a;
}

/* Nivo-zavisni blokovi (samo muzika i sport). Redosled nivoa prati formu:
   amater (a_) → profesionalac (p_) → rekreativac (r_). */
function fizKolone() {   // Fizička dobrobit — po 4 stavke
  return ['a_fiz1','a_fiz2','a_fiz3','a_fiz4',
          'p_fiz1','p_fiz2','p_fiz3','p_fiz4',
          'r_fiz1','r_fiz2','r_fiz3','r_fiz4'];
}
function liderKolone() {   // Odnos sa liderom — po 5; r_ima_vodju pre r_lider*
  return ['a_lider1','a_lider2','a_lider3','a_lider4','a_lider5',
          'p_lider1','p_lider2','p_lider3','p_lider4','p_lider5',
          'r_ima_vodju','r_lider1','r_lider2','r_lider3','r_lider4','r_lider5'];
}
function negKolone() {   // Negativni faktori — a_/r_ po 7, p_ ima 8
  return ['a_neg1','a_neg2','a_neg3','a_neg4','a_neg5','a_neg6','a_neg7',
          'p_neg1','p_neg2','p_neg3','p_neg4','p_neg5','p_neg6','p_neg7','p_neg8',
          'r_neg1','r_neg2','r_neg3','r_neg4','r_neg5','r_neg6','r_neg7'];
}


/* ── Stilizacija jednog taba ───────────────────────────────────────────── */

function stilizujTab(sh, kol) {
  var n = kol.length;
  var maxR = sh.getMaxRows();

  /* Trake za redove (telo, od 2. reda) — krem nijanse. */
  sh.getBandings().forEach(function(b) { b.remove(); });
  if (maxR > 1) {
    var band = sh.getRange(2, 1, maxR - 1, n)
                 .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false);
    band.setFirstRowColor(STIL.traka1).setSecondRowColor(STIL.traka2);
  }

  /* Zaglavlje: boja se smenjuje (ugljen ↔ plava) na svaku promenu sekcije —
     razdvaja blokove vizuelno, za bilo koji redosled/grupu. Krem bold tekst. */
  var zr = sh.getRange(1, 1, 1, n);
  var pozadine = [], prethSek = null, bojaSek = STIL.ugljen;
  kol.forEach(function(k) {
    var sek = sekcijaKolone(k);
    if (prethSek !== null && sek !== prethSek) {
      bojaSek = (bojaSek === STIL.ugljen) ? STIL.plava : STIL.ugljen;
    }
    prethSek = sek;
    pozadine.push(bojaSek);
  });
  var boje     = kol.map(function() { return STIL.tekst; });
  var beleske  = kol.map(function(k) { return opisKolone(k); });
  zr.setBackgrounds([pozadine])
    .setFontColors([boje])
    .setFontWeight('bold')
    .setFontSize(10)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle')
    .setWrap(true)
    .setNotes([beleske]);
  sh.setRowHeight(1, 46);

  /* Telo: poravnanje skala/blokova na centar, font malo manji. */
  if (maxR > 1) {
    sh.getRange(2, 1, maxR - 1, n).setVerticalAlignment('middle').setFontSize(10);
  }

  /* Zamrzni zaglavlje i prve tri kolone (_vreme, tip_upitnika, nivo). */
  sh.setFrozenRows(1);
  sh.setFrozenColumns(Math.min(3, n));

  /* Širine kolona. */
  for (var c = 1; c <= n; c++) sh.setColumnWidth(c, sirinaKolone(kol[c - 1]));

  /* Tanke linije svuda u brending boji. */
  sh.getRange(1, 1, maxR, n).setBorder(
    true, true, true, true, true, true, STIL.ivica, SpreadsheetApp.BorderStyle.SOLID
  );
}

/* Obezbedi dovoljno redova/kolona pre upisa (novi tab ima samo 26 kolona). */
function obezbediDimenzije(sh, n) {
  var mc = sh.getMaxColumns();
  if (mc < n) sh.insertColumnsAfter(mc, n - mc);
}


/* ── Sekcije i boje zaglavlja ──────────────────────────────────────────── */

function sekcijaKolone(k) {
  if (k === '_vreme' || k === 'tip_upitnika' || k === 'nivo') return 'meta';
  if (/^prethodna_/.test(k)) return 'preth';
  if (/^mhc/.test(k))  return 'mhc';
  if (/^sps/.test(k))  return 'sps';
  if (/^who/.test(k))  return 'who';
  if (/^swls/.test(k)) return 'swls';
  if (/^fas/.test(k))  return 'fas';
  if (/_fiz\d/.test(k)) return 'fiz';
  if (/_lider\d/.test(k) || k === 'r_ima_vodju') return 'lider';
  if (/_neg\d/.test(k)) return 'neg';
  if (k === 'saglasnost') return 'sag';
  return 'dem';   // sva preostala demografija
}

function sirinaKolone(k) {
  if (k === '_vreme') return 150;
  if (k === 'tip_upitnika' || k === 'nivo' || k === 'pol') return 92;
  if (/^(vrsta_|tip_sporta|prethodna_|muzicko|dodatna|duzina|godine|saglasnost|r_ima_vodju)/.test(k)) return 120;
  return 46;   // pojedinačne stavke skala / blokova — uska kolona
}


/* ── Beleške (note) na zaglavlju: ljudski opis svakog polja ─────────────── */

function opisKolone(k) {
  var fiksni = {
    '_vreme': 'Vreme prijema odgovora (automatski upisuje server)',
    'tip_upitnika': 'Grupa: muzika / sport / folklor',
    'nivo': 'Nivo angažovanja: amater / rekreativac / profesionalac',
    'pol': 'Pol učesnika',
    'godine': 'Godine (18–80)',
    'duzina': 'Dužina učešća u aktivnosti (godine)',
    'vrsta_muzike': 'Vrsta muzičke aktivnosti',
    'vrsta_muzike_drugo': 'Vrsta muzike — uneto pod „Drugo"',
    'muzicko_obrazovanje': 'Formalno muzičko obrazovanje (da/ne)',
    'dodatna_aktivnost': 'Bavi se i drugom muzičkom aktivnošću (da/ne)',
    'tip_sporta': 'Tip sporta: ekipni / individualni',
    'vrsta_sporta': 'Naziv sporta (opciono polje)',
    'vrsta_folklora': 'Vrsta folklora',
    'vrsta_folklora_drugo': 'Vrsta folklora — uneto pod „Drugo"',
    'prethodna_aktivnost': 'Bavio/la se ranije drugom aktivnošću (da/ne)',
    'prethodna_nivo': 'Prethodna aktivnost — nivo angažovanja',
    'prethodna_trajanje': 'Prethodna aktivnost — trajanje (godine)',
    'r_ima_vodju': 'Rekreativci: da li grupa ima vođu/trenera (da/ne)',
    'saglasnost': 'Saglasnost potvrđena potpisom (da)'
  };
  if (fiksni[k]) return fiksni[k];

  var m = k.match(/^prethodna_(aktivnost|nivo|trajanje)_(\d+)$/);
  if (m) {
    var deo = { aktivnost: 'da/ne', nivo: 'nivo', trajanje: 'trajanje (godine)' }[m[1]];
    return 'Dodatna prethodna aktivnost #' + m[2] + ' — ' + deo;
  }

  var s = k.match(/^(mhc|sps|who|swls|fas)(\d+)$/);
  if (s) {
    var skale = {
      mhc:  ['MHC-SF', '1–6'],
      sps:  ['SPS-10', '1–4'],
      who:  ['WHO-5', '1–6'],
      swls: ['SWLS', '1–7'],
      fas:  ['FAS', '1–5']
    }[s[1]];
    return skale[0] + ' — stavka ' + s[2] + ' (skala ' + skale[1] + ')';
  }

  var b = k.match(/^([arp])_(fiz|lider|neg)(\d+)$/);
  if (b) {
    var nivo = { a: 'Amater', r: 'Rekreativac', p: 'Profesionalac' }[b[1]];
    var blok = { fiz: 'Fizička dobrobit', lider: 'Odnos sa liderom/vođom', neg: 'Negativni faktori' }[b[2]];
    return nivo + ' · ' + blok + ' · stavka ' + b[3];
  }

  return k;
}


/* ── Generisanje primera odgovora za TEST tabove ───────────────────────── */

function uzorciZa(tip, kol) {
  var nivoi = ['amater', 'rekreativac', 'profesionalac'];
  return nivoi.map(function(nivo, i) {
    var p = uzorakPayload(tip, nivo, i);
    return kol.map(function(k) {
      if (k === '_vreme') return new Date(Date.now() - i * 3600000);
      return (k in p) ? p[k] : '';
    });
  });
}

function uzorakPayload(tip, nivo, s) {
  var p = {
    tip_upitnika: tip, nivo: nivo,
    pol: (s % 2 ? 'muški' : 'ženski'),
    godine: String(22 + s * 7),
    duzina: String(2 + s),
    saglasnost: 'da'
  }, i;

  for (i = 1; i <= 14; i++) p['mhc' + i]  = String(((i + s) % 6) + 1);   // 1–6
  for (i = 1; i <= 10; i++) p['sps' + i]  = String(((i + s) % 4) + 1);   // 1–4
  for (i = 1; i <= 5;  i++) p['who' + i]  = String(((i + s) % 6) + 1);   // 1–6
  for (i = 1; i <= 5;  i++) p['swls' + i] = String(((i + s) % 7) + 1);   // 1–7
  for (i = 1; i <= 10; i++) p['fas' + i]  = String(((i + s) % 5) + 1);   // 1–5

  if (tip === 'muzika') {
    p.vrsta_muzike = 'hor';
    p.muzicko_obrazovanje = (s % 2 ? 'da' : 'ne');
    p.dodatna_aktivnost = 'ne';
  } else if (tip === 'sport') {
    p.tip_sporta = (s % 2 ? 'ekipni' : 'individualni');
    p.vrsta_sporta = (s % 2 ? 'košarka' : 'plivanje');
  } else {
    p.vrsta_folklora = 'izvorni';
  }

  if (s > 0) {
    p.prethodna_aktivnost = 'da';
    p.prethodna_nivo = 'amater';
    p.prethodna_trajanje = String(s);
    if (s > 1) {   // i jedan „Dodaj još" primer
      p.prethodna_aktivnost_2 = 'da';
      p.prethodna_nivo_2 = 'rekreativac';
      p.prethodna_trajanje_2 = '1';
    }
  } else {
    p.prethodna_aktivnost = 'ne';
  }

  if (tip !== 'folklor') {
    var pre = nivo.charAt(0);   // 'a' / 'r' / 'p'
    for (i = 1; i <= 4; i++) p[pre + '_fiz' + i] = String(((i + s) % 5) + 1);
    if (nivo === 'rekreativac') {
      p.r_ima_vodju = 'da';
      for (i = 1; i <= 5; i++) p['r_lider' + i] = String(((i + s) % 5) + 1);
    } else {
      for (i = 1; i <= 5; i++) p[pre + '_lider' + i] = String(((i + s) % 5) + 1);
    }
    var brNeg = (nivo === 'profesionalac') ? 8 : 7;
    for (i = 1; i <= brNeg; i++) p[pre + '_neg' + i] = String(((i + s) % 5) + 1);
  }

  return p;
}


/* ── Pomoćnik za poruke ────────────────────────────────────────────────── */

function poruka(t) {
  try { SpreadsheetApp.getUi().alert(t); }
  catch (e) { Logger.log(t); }
}
