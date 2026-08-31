/* ══════════════════════════════════════════════════════════════════════════
   UPITNIK „GRUPNE AKTIVNOSTI I BLAGOSTANJE" (muzika · sport · folklor)
   Apps Script — priprema, reset i dokumentacija Google tabele
   ──────────────────────────────────────────────────────────────────────────
   Ovo je DRUGI .gs fajl u istom Apps Script projektu, uz apps-script.gs.
   Nalepi ga kao zaseban fajl („+" → Script → nazovi ga „Setup").

   Apps Script sve fajlove jednog projekta deli u istom global scope-u, pa
   ovaj fajl koristi TABOVI, KOLONE i opsegZa() direktno iz apps-script.gs —
   zaglavlje tabele i kod koji upisuje odgovore NE MOGU da se raziđu.

   KAKO SE POKREĆE
     Sačuvaj → osveži tabelu (F5) → u meniju se pojavi „Upitnik ▸ …".
     (Prvo pokretanje traži dozvolu pristupa tabeli — odobri je.)

   ŠTA RADI
     1 · Pripremi tabele      Pravi/stilizuje tabove sa punim, tačnim
                              zaglavljem. Ako tab već ima podatke, sadržaj se
                              NE dira — osvežava se samo stil zaglavlja.
     2 · Napravi legendu      Tab „Legenda": za svaku kolonu pun tekst pitanja
                              ili stavke i opseg vrednosti. Ovo je ono što ti
                              treba za pola godine, kad se vratiš podacima.
     3 · Osveži pregled       Tab „Pregled": broj odgovora po grupi i nivou,
                              prvi i poslednji odgovor.
     ─
     Test tabele              Tabovi „… (TEST)" sa primerima odgovora — da
                              vidiš kako tabela izgleda pre nego što pustiš
                              link učesnicima. Slobodno ih obriši posle.
     ⚠️ Resetuj podatke        BRIŠE sve odgovore iz pravih tabova, zadržava
                              zaglavlje i stil. Traži potvrdu. Pokreni ovo
                              posle probnog kruga, pre pravog prikupljanja.

   Ovaj fajl NE utiče na doPost — služi samo za pripremu i održavanje tabele.
   ══════════════════════════════════════════════════════════════════════════ */

var TEST_SUFIKS = ' (TEST)';
var TAB_LEGENDA = 'Legenda';
var TAB_PREGLED = 'Pregled';

/* Boje izvedene iz dizajna upitnika (assets/style.css). */
var STIL = {
  ugljen: '#4D4B47',   // .upitnik tamna kartica
  plava:  '#073964',   // akcenat („izabrano" / dugme) — oklch(0.34 0.09 250) u sRGB
  tekst:  '#F3F1EC',   // krem tekst na tamnoj podlozi
  traka1: '#FBFAF6',   // svetlija traka reda
  traka2: '#EFEDE6',   // tamnija traka reda
  ivica:  '#D5D0C7'    // --ivica
};

/* Sekcije upitnika — redom, prvi pogodak pobeđuje. Zaglavlje smenjuje boju na
   svakoj promeni sekcije, pa se blokovi razdvajaju i bez ijedne ručne izmene. */
var SEKCIJE = [
  [/^_vreme$|^tip_upitnika$|^nivo$/, "Meta"],
  [/^prethodna_/, "Prethodne aktivnosti"],
  [/^who\d+$/, "WHO-5 — mentalno blagostanje"],
  [/^swls\d+$/, "SWLS — zadovoljstvo životom"],
  [/^mhc\d+$/, "MHC-SF — kontinuum mentalnog zdravlja"],
  [/^sps\d+$/, "SPS-10 — socijalna podrška"],
  [/^fas\d+$/, "FAS — porodična adaptivnost"],
  [/^[arp]_fiz\d+$/, "Fizička dobrobit"],
  [/^[arp]_lider\d+$|^r_ima_vodju$/, "Odnos sa liderom"],
  [/^[arp]_neg\d+$/, "Negativni faktori"],
  [/^saglasnost$/, "Saglasnost"]
];

/* Kolone koje nose tekst ili oznaku i traže širinu; sve ostalo su pojedinačne
   stavke skala i staju u usku kolonu. */
var SIROKE_KOLONE = /^(_vreme|tip_upitnika|nivo|pol|duzina|godine|saglasnost|r_ima_vodju|vrsta_|muzicko_|dodatna_|prethodna_)/;


/* ── Meni ─────────────────────────────────────────────────────────────────── */

function onOpen() {
  try {
    SpreadsheetApp.getUi()
      .createMenu('Upitnik')
      .addItem('1 · Pripremi tabele', 'pripremiTabele')
      .addItem('2 · Napravi legendu', 'napraviLegendu')
      .addItem('3 · Osveži pregled', 'osveziPregled')
      .addSeparator()
      .addItem('Napravi TEST tabele sa primerima', 'pripremiTestTabele')
      .addItem('Obriši TEST tabele', 'obrisiTestTabele')
      .addSeparator()
      .addItem('⚠️ Resetuj podatke (obriši sve odgovore)', 'resetujPodatke')
      .addToUi();
  } catch (e) { /* bez UI konteksta (npr. trigger) — preskoči */ }
}


/* ── Glavne akcije ────────────────────────────────────────────────────────── */

/* Pravi/stilizuje prave tabove. Ne dira postojeće podatke. */
function pripremiTabele() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABOVI).forEach(function(tip) {
    var sh = ss.getSheetByName(TABOVI[tip]) || ss.insertSheet(TABOVI[tip]);
    var kol;
    if (sh.getLastRow() > 1) {
      /* Već ima odgovore — zadrži zaglavlje kakvo jeste, samo ga restiluj. */
      kol = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
    } else {
      kol = KOLONE[tip].slice();
      obezbediSirinu(sh, kol.length);
      sh.getRange(1, 1, 1, kol.length).setValues([kol]);
    }
    stilizujTab(sh, kol, tip);
  });
  poruka('Gotovo.\n\nTabovi ' + Object.keys(TABOVI).map(function(t) { return TABOVI[t]; }).join(' / ') +
         ' su pripremljeni i stilizovani.');
}


/* BRIŠE sve odgovore iz pravih tabova. Zaglavlje i stil ostaju. */
function resetujPodatke() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var stanje = [];
  var ukupno = 0;
  Object.keys(TABOVI).forEach(function(tip) {
    var sh = ss.getSheetByName(TABOVI[tip]);
    var n = sh ? Math.max(0, sh.getLastRow() - 1) : 0;
    ukupno += n;
    stanje.push('  • ' + TABOVI[tip] + ': ' + n);
  });

  if (ukupno === 0) {
    poruka('Nema šta da se briše — svi tabovi su već prazni.');
    return;
  }
  if (!potvrdi('Brisanje odgovora\n\n' + stanje.join('\n') +
               '\n\nUkupno ' + ukupno + ' odgovora biće TRAJNO obrisano.\n' +
               'Zaglavlje i stil ostaju. Nastaviti?')) {
    poruka('Otkazano — ništa nije obrisano.');
    return;
  }

  Object.keys(TABOVI).forEach(function(tip) {
    var sh = ss.getSheetByName(TABOVI[tip]);
    if (!sh) return;
    var n = sh.getLastRow() - 1;
    if (n > 0) sh.deleteRows(2, n);
  });
  poruka('Obrisano ' + ukupno + ' odgovora. Tabela je spremna za prikupljanje.');
}


/* Tab „Legenda": ime kolone → sekcija → pun tekst pitanja → opseg vrednosti. */
function napraviLegendu() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB_LEGENDA) || ss.insertSheet(TAB_LEGENDA);
  sh.getBandings().forEach(function(b) { b.remove(); });
  sh.clear();

  var redovi = [['Grupa', 'Kolona', 'Sekcija', 'Pitanje / tvrdnja', 'Vrednost']];
  Object.keys(TABOVI).forEach(function(tip) {
    KOLONE[tip].forEach(function(k) {
      redovi.push([TABOVI[tip], k, sekcijaKolone(k), opisKolone(tip, k), tipVrednosti(k)]);
    });
  });

  obezbediSirinu(sh, 5);
  if (sh.getMaxRows() < redovi.length) sh.insertRowsAfter(sh.getMaxRows(), redovi.length - sh.getMaxRows());
  sh.getRange(1, 1, redovi.length, 5).setValues(redovi);

  sh.getRange(1, 1, 1, 5)
    .setBackground(STIL.ugljen).setFontColor(STIL.tekst)
    .setFontWeight('bold').setFontSize(10).setVerticalAlignment('middle');
  sh.setRowHeight(1, 34);
  sh.setFrozenRows(1);
  [110, 150, 210, 620, 130].forEach(function(w, i) { sh.setColumnWidth(i + 1, w); });
  sh.getRange(2, 1, redovi.length - 1, 5).setVerticalAlignment('top').setFontSize(10);
  sh.getRange(2, 4, redovi.length - 1, 1).setWrap(true);
  sh.getRange(1, 1, redovi.length, 5)
    .setBorder(true, true, true, true, true, true, STIL.ivica, SpreadsheetApp.BorderStyle.SOLID);

  poruka('Legenda napravljena — ' + (redovi.length - 1) + ' kolona opisano.');
}


/* Tab „Pregled": koliko odgovora je stiglo i kada. */
function osveziPregled() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(TAB_PREGLED) || ss.insertSheet(TAB_PREGLED);
  sh.getBandings().forEach(function(b) { b.remove(); });
  sh.clear();

  var redovi = [['Grupa', 'Odgovora', 'Amateri', 'Rekreativci', 'Profesionalci', 'Prvi odgovor', 'Poslednji odgovor']];
  var ukupno = 0;

  Object.keys(TABOVI).forEach(function(tip) {
    var s = ss.getSheetByName(TABOVI[tip]);
    var n = s ? Math.max(0, s.getLastRow() - 1) : 0;
    ukupno += n;
    var prvi = '', zadnji = '';
    var poNivou = { amater: 0, rekreativac: 0, profesionalac: 0 };
    if (n > 0) {
      var kol = s.getRange(1, 1, 1, s.getLastColumn()).getValues()[0];
      var iVreme = kol.indexOf('_vreme');
      var iNivo = kol.indexOf('nivo');
      var podaci = s.getRange(2, 1, n, s.getLastColumn()).getValues();
      podaci.forEach(function(r) {
        var nv = String(r[iNivo]);
        if (nv in poNivou) poNivou[nv] += 1;
      });
      if (iVreme > -1) {
        var vremena = podaci.map(function(r) { return r[iVreme]; })
                            .filter(function(v) { return v instanceof Date; });
        if (vremena.length) {
          prvi = new Date(Math.min.apply(null, vremena));
          zadnji = new Date(Math.max.apply(null, vremena));
        }
      }
    }
    redovi.push([TABOVI[tip], n, poNivou.amater, poNivou.rekreativac, poNivou.profesionalac, prvi, zadnji]);
  });

  redovi.push([]);
  redovi.push(['UKUPNO', ukupno]);
  redovi.push([]);
  redovi.push(['Osveženo', new Date()]);

  var sirinaRedova = Math.max.apply(null, redovi.map(function(r) { return r.length; }));
  obezbediSirinu(sh, sirinaRedova);
  redovi = redovi.map(function(r) {
    var kopija = r.slice();
    while (kopija.length < sirinaRedova) kopija.push('');
    return kopija;
  });
  sh.getRange(1, 1, redovi.length, sirinaRedova).setValues(redovi);

  sh.getRange(1, 1, 1, sirinaRedova)
    .setBackground(STIL.ugljen).setFontColor(STIL.tekst).setFontWeight('bold');
  sh.getRange(redovi.length - 3, 1, 1, 2).setFontWeight('bold').setBackground(STIL.traka2);
  for (var c = 1; c <= sirinaRedova; c++) sh.setColumnWidth(c, c === 1 ? 170 : 150);
  sh.setFrozenRows(1);

  poruka('Pregled osvežen. Ukupno odgovora: ' + ukupno + '.');
}


/* Test tabovi sa primerima — da se vidi izgled pre puštanja linka. */
function pripremiTestTabele() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABOVI).forEach(function(tip) {
    var ime = TABOVI[tip] + TEST_SUFIKS;
    var sh = ss.getSheetByName(ime) || ss.insertSheet(ime);
    sh.getBandings().forEach(function(b) { b.remove(); });
    sh.clear();
    var kol = KOLONE[tip].slice();
    obezbediSirinu(sh, kol.length);
    sh.getRange(1, 1, 1, kol.length).setValues([kol]);
    var redovi = uzorciZa(tip, kol);
    if (redovi.length) sh.getRange(2, 1, redovi.length, kol.length).setValues(redovi);
    stilizujTab(sh, kol, tip);
  });
  poruka('Test tabele napravljene:\n' +
         Object.keys(TABOVI).map(function(t) { return '  • ' + TABOVI[t] + TEST_SUFIKS; }).join('\n'));
}

function obrisiTestTabele() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var obrisano = 0;
  Object.keys(TABOVI).forEach(function(tip) {
    var sh = ss.getSheetByName(TABOVI[tip] + TEST_SUFIKS);
    if (sh) { ss.deleteSheet(sh); obrisano++; }
  });
  poruka('Obrisano TEST tabova: ' + obrisano + '.');
}


/* ── Stilizacija ──────────────────────────────────────────────────────────── */

function stilizujTab(sh, kol, tip) {
  var n = kol.length;
  var maxR = sh.getMaxRows();

  /* Trake za redove (od 2. reda naniže) — krem nijanse. */
  sh.getBandings().forEach(function(b) { b.remove(); });
  if (maxR > 1) {
    sh.getRange(2, 1, maxR - 1, n)
      .applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY, false, false)
      .setFirstRowColor(STIL.traka1).setSecondRowColor(STIL.traka2);
  }

  /* Zaglavlje: boja se smenjuje na svakoj promeni sekcije. */
  var pozadine = [], prethodna = null, boja = STIL.ugljen;
  kol.forEach(function(k) {
    var sek = sekcijaKolone(k);
    if (prethodna !== null && sek !== prethodna) boja = (boja === STIL.ugljen) ? STIL.plava : STIL.ugljen;
    prethodna = sek;
    pozadine.push(boja);
  });

  sh.getRange(1, 1, 1, n)
    .setBackgrounds([pozadine])
    .setFontColors([kol.map(function() { return STIL.tekst; })])
    .setFontWeight('bold').setFontSize(10)
    .setHorizontalAlignment('center').setVerticalAlignment('middle').setWrap(true)
    .setNotes([kol.map(function(k) { return beleskaKolone(tip, k); })]);
  sh.setRowHeight(1, 46);

  if (maxR > 1) sh.getRange(2, 1, maxR - 1, n).setVerticalAlignment('middle').setFontSize(10);

  sh.setFrozenRows(1);
  sh.setFrozenColumns(Math.min(3, n));

  for (var c = 1; c <= n; c++) sh.setColumnWidth(c, sirinaKolone(kol[c - 1]));

  sh.getRange(1, 1, maxR, n)
    .setBorder(true, true, true, true, true, true, STIL.ivica, SpreadsheetApp.BorderStyle.SOLID);
}

/* Novi tab ima samo 26 kolona — proširi pre upisa širokog zaglavlja. */
function obezbediSirinu(sh, n) {
  var mc = sh.getMaxColumns();
  if (mc < n) sh.insertColumnsAfter(mc, n - mc);
}

function sekcijaKolone(k) {
  for (var i = 0; i < SEKCIJE.length; i++) {
    if (SEKCIJE[i][0].test(k)) return SEKCIJE[i][1];
  }
  return 'Demografija';   /* sve što nije skala ni meta */
}

function sirinaKolone(k) {
  if (k === '_vreme') return 150;
  return SIROKE_KOLONE.test(k) ? 130 : 46;
}

/* Beleška (hover note) na ćeliji zaglavlja. */
function beleskaKolone(tip, k) {
  return sekcijaKolone(k) + ' · ' + tipVrednosti(k) + '\n\n' + opisKolone(tip, k);
}

function tipVrednosti(k) {
  if (k === '_vreme') return 'datum i vreme';
  var o = (typeof opsegZa === 'function') ? opsegZa(k) : null;
  return o ? ('ceo broj ' + o[0] + '–' + o[1]) : 'tekst';
}


/* ── Opisi kolona ─────────────────────────────────────────────────────────── */

/* Meta kolone koje ne postoje kao polje u formi. */
var OPISI_META = {
  "_vreme": "Vreme prijema odgovora — upisuje server automatski.",
  "tip_upitnika": "Grupa aktivnosti: muzika / sport / folklor.",
  "nivo": "Nivo angažovanja izabran na ekranu nivo-*.html: amater / rekreativac / profesionalac."
};

/* Tekstovi identični u svim grupama (zajedničke skale i pitanja). */
var OPISI_ZAJEDNICKI = {
  "duzina": "Koliko godina učestvujete u ovoj grupi?",
  "fas1": "1. Umor mi predstavlja problem.",
  "fas10": "10. Kada radim nešto, mogu prilično dobro da se koncentrišem.",
  "fas2": "2. Veoma brzo se umorim.",
  "fas3": "3. Tokom dana ne radim nešto mnogo.",
  "fas4": "4. Imam dovoljno energije za svakodnevni život.",
  "fas5": "5. Fizički se osećam iscrpljeno.",
  "fas6": "6. Teško mi je da počnem sa bilo čim.",
  "fas7": "7. Teško mi je da jasno razmišljam.",
  "fas8": "8. Ne osećam želju da išta radim.",
  "fas9": "9. Mentalno se osećam iscrpljeno.",
  "godine": "Godine starosti",
  "mhc1": "1. sreću",
  "mhc10": "10. sposobnost da dobro upravljate svakodnevnim odgovornostima",
  "mhc11": "11. da imate tople i poverljive odnose sa drugima",
  "mhc12": "12. da imate iskustva koja vas podstiču na rast i razvoj",
  "mhc13": "13. samopouzdanje da izrazite sopstvene ideje i mišljenja",
  "mhc14": "14. da Vaš život ima smisao ili pravac",
  "mhc2": "2. zainteresovanost za život",
  "mhc3": "3. zadovoljstvo životom",
  "mhc4": "4. da imate nešto važno da doprinesete društvu",
  "mhc5": "5. da pripadate nekoj zajednici (npr. društvenoj grupi ili komšiluku)",
  "mhc6": "6. da je naše društvo dobro mesto, ili da postaje bolje mesto za sve ljude",
  "mhc7": "7. da su ljudi u osnovi dobri",
  "mhc8": "8. da način na koji naše društvo funkcioniše ima smisla",
  "mhc9": "9. da volite većinu aspekata svoje ličnosti",
  "pol": "Pol",
  "r_ima_vodju": "Da li u Vašoj grupi postoji osoba koja vodi i organizuje aktivnosti (neformalni vođa)?",
  "r_lider2": "2. Osećam da imam slobodu da izrazim svoje mišljenje pred osobom koja vodi grupu.",
  "r_lider4": "4. Osoba koja vodi grupu stvara mogućnosti da se pokažem i dam svoj doprinos.",
  "r_lider5": "5. Pristup i odnos osobe koja vodi grupu prema meni pozitivno utiče na moje blagostanje.",
  "saglasnost": "Potvrda dobrovoljne saglasnosti",
  "sps1": "1. Postoje ljudi na koje mogu da se oslonim da mi pomognu kada mi je pomoć zaista potrebna.",
  "sps10": "10. Postoje ljudi na koje mogu da računam u hitnim situacijama.",
  "sps2": "2. Postoje ljudi koji uživaju u istim društvenim aktivnostima kao i ja.",
  "sps3": "3. Imam bliske odnose koji mi pružaju osećaj emocionalne sigurnosti i blagostanja.",
  "sps4": "4. Postoji osoba sa kojom mogu da razgovaram o važnim odlukama u svom životu.",
  "sps5": "5. Imam odnose u kojima ljudi prepoznaju moje sposobnosti i veštine.",
  "sps6": "6. Postoji osoba kojoj mogu da verujem i kojoj mogu da se obratim za savet kada imam probleme.",
  "sps7": "7. Osećam da pripadam grupi ljudi koji dele moje stavove i uverenja.",
  "sps8": "8. Osećam snažnu emocionalnu povezanost sa najmanje jednom osobom.",
  "sps9": "9. Postoje ljudi koji cene moje talente i sposobnosti.",
  "swls1": "1. U većini aspekata, moj život je blizak mom idealu.",
  "swls2": "2. Uslovi mog života su odlični.",
  "swls3": "3. Zadovoljan/na sam svojim životom.",
  "swls4": "4. Do sada sam postigao/la važne stvari koje sam želeo/la u životu.",
  "swls5": "5. Kada bih mogao/la da živim život iznova, gotovo ništa ne bih menjao/la.",
  "who1": "1. Osećao/la sam se veselo i raspoloženo.",
  "who2": "2. Osećao/la sam se smireno i opušteno.",
  "who3": "3. Osećao/la sam se aktivno i živahno.",
  "who4": "4. Budio/la sam se svež/a i odmoran/na.",
  "who5": "5. Moj svakodnevni život je bio ispunjen stvarima koje me zanimaju."
};

/* Tekstovi koji se razlikuju po grupi (formulacija prilagođena aktivnosti). */
var OPISI_GRUPA = {
  muzika: {
    "a_fiz1": "1. Učešće u ovom ansamblu pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "a_fiz2": "2. Bez obzira na fizički napor, nakon probe / nastupa osećam se fizički bolje nego pre muzičke aktivnosti.",
    "a_fiz3": "3. Učešće u ovom ansamblu pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "a_fiz4": "4. Učešće u ovom ansamblu doprinosi kvalitetnijem snu.",
    "a_lider1": "1. Moj dirigent / vođa ansambla / šef orkestra me inspiriše i podstiče da dam sve od sebe na probama i nastupima.",
    "a_lider2": "2. Moj dirigent / vođa ansambla / šef orkestra se ponaša sa poštovanjem prema svim članovima grupe.",
    "a_lider3": "3. Osećam da imam slobodu da izrazim svoje mišljenje pred dirigentom / vođom ansambla / šefom orkestra.",
    "a_lider4": "4. Moj dirigent / vođa ansambla / šef orkestra stvara mogućnosti da se pokažem u grupi i dam svoj doprinos.",
    "a_lider5": "5. Pristup i odnos mog dirigenta / vođe ansambla / šefa orkestra prema meni u grupi pozitivno utiče na moje blagostanje.",
    "a_neg1": "1. Ponekad osećam pritisak da ne pogrešim na probi.",
    "a_neg2": "2. Ponekad osećam pritisak da ne pogrešim na nastupu / takmičenju.",
    "a_neg3": "3. Loš nastup negativno utiče na moje raspoloženje.",
    "a_neg4": "4. Negativan ishod nastupa / takmičenja umanjuje moje blagostanje u svakodnevnom životu.",
    "a_neg5": "5. Teško mi je da uskladim probe i nastupe sa ostalim životnim obavezama.",
    "a_neg6": "6. Unutar ansambla postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "a_neg7": "7. Učestale probe / nastupi negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "a_neg8": "8. Učestale probe / nastupi negativno utiču na moje blagostanje.",
    "dodatna_aktivnost": "Ukoliko postoji dodatna muzička aktivnost koju pohađate simultano, molimo Vas da navedete aktivnost i nivo na kom je pohađate",
    "dodatna_aktivnost_nivo": "Nivo angažovanja u toj dodatnoj muzičkoj aktivnosti: amater / rekreativac / profesionalac.",
    "muzicko_obrazovanje": "Nivo formalnog muzičkog obrazovanja",
    "p_fiz1": "1. Učešće u ovom ansamblu pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "p_fiz2": "2. Bez obzira na fizički napor, nakon probe / nastupa osećam se fizički bolje nego pre muzičke aktivnosti.",
    "p_fiz3": "3. Učešće u ovom ansamblu pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "p_fiz4": "4. Učešće u ovom ansamblu doprinosi kvalitetnijem snu.",
    "p_lider1": "1. Moj dirigent / vođa ansambla / šef orkestra me inspiriše i podstiče da dam sve od sebe na probama i nastupima.",
    "p_lider2": "2. Moj dirigent / vođa ansambla / šef orkestra se ponaša sa poštovanjem prema svim članovima grupe.",
    "p_lider3": "3. Osećam da imam slobodu da izrazim svoje mišljenje pred dirigentom / vođom ansambla / šefom orkestra.",
    "p_lider4": "4. Moj dirigent / vođa ansambla / šef orkestra stvara mogućnosti da se pokažem u grupi i dam svoj doprinos.",
    "p_lider5": "5. Pristup i odnos mog dirigenta / vođe ansambla / šefa orkestra prema meni u grupi pozitivno utiče na moje blagostanje.",
    "p_neg1": "1. Ponekad osećam pritisak da ne pogrešim na probi.",
    "p_neg2": "2. Ponekad osećam pritisak da ne pogrešim na nastupu / takmičenju.",
    "p_neg3": "3. Loš nastup negativno utiče na moje raspoloženje.",
    "p_neg4": "4. Negativan ishod nastupa / takmičenja umanjuje moje blagostanje u svakodnevnom životu.",
    "p_neg5": "5. Teško mi je da uskladim probe i nastupe sa ostalim životnim obavezama.",
    "p_neg6": "6. Unutar ansambla postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "p_neg7": "7. Učestale probe / nastupi negativno utiču na moje blagostanje.",
    "p_neg8": "8. Profesionalno bavljenje ovom muzičkom aktivnošću mi stvara osećaj finansijskog pritiska (osećaj da moram da zaradim) što negativno utiče na moje blagostanje.",
    "p_neg9": "9. Učestale probe / nastupi negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "prethodna_aktivnost": "Ukoliko ste pre ove grupne muzičke aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "prethodna_nivo": "Ukoliko ste pre ove grupne muzičke aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "prethodna_trajanje": "Ukoliko ste pre ove grupne muzičke aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "r_fiz1": "1. Učešće u ovom ansamblu pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "r_fiz2": "2. Bez obzira na fizički napor, nakon probe / nastupa osećam se fizički bolje nego pre muzičke aktivnosti.",
    "r_fiz3": "3. Učešće u ovom ansamblu pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "r_fiz4": "4. Učešće u ovom ansamblu doprinosi kvalitetnijem snu.",
    "r_lider1": "1. Osoba koja vodi ili organizuje našu grupu inspiriše me da se muzički razvijam i dajem sve od sebe.",
    "r_lider3": "3. Osoba koja vodi grupu ponaša se sa poštovanjem prema svim članovima.",
    "r_neg1": "1. Ponekad osećam pritisak da ne pogrešim prilikom izvođenja (npr. na svirci, probi sa ostatkom muzičke grupe).",
    "r_neg2": "2. Loše izvođenje negativno utiče na moje raspoloženje.",
    "r_neg3": "3. Negativan ishod nastupa umanjuje moje blagostanje u svakodnevnom životu.",
    "r_neg4": "4. Teško mi je da uskladim probe i svirke sa ostalim životnim obavezama.",
    "r_neg5": "5. Unutar ansambla postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "r_neg6": "6. Učestale probe / svirke negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "r_neg7": "7. Učestale probe / svirke negativno utiču na moje blagostanje.",
    "vrsta_muzike": "Vrsta muzičke aktivnosti",
    "vrsta_muzike_drugo": "Vrsta muzičke aktivnosti — uneto pod „Drugo\""
  },
  sport: {
    "a_fiz1": "1. Učešće u ovom sportu pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "a_fiz2": "2. Bez obzira na fizički napor, nakon treninga / utakmice osećam se fizički bolje nego pre te aktivnosti.",
    "a_fiz3": "3. Učešće u ovom sportu pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "a_fiz4": "4. Učešće u ovom sportu doprinosi kvalitetnijem snu.",
    "a_lider1": "1. Moj trener / kapiten me svojim primerom inspiriše i podstiče da dam sve od sebe na treningu i utakmicama.",
    "a_lider2": "2. Moj trener / kapiten se ponaša sa poštovanjem prema svim igračima podjednako.",
    "a_lider3": "3. Osećam da imam slobodu da izrazim svoje mišljenje pred trenerom / kapitenom.",
    "a_lider4": "4. Moj trener / kapiten stvara mogućnosti da se pokažem u grupi i dam svoj doprinos.",
    "a_lider5": "5. Pristup i odnos mog trenera / kapitena prema meni u grupi pozitivno utiče na moje blagostanje.",
    "a_neg1": "1. Ponekad osećam pritisak da odigram dobro na treningu.",
    "a_neg2": "2. Ponekad osećam pritisak da odigram dobro na utakmici.",
    "a_neg3": "3. Loša utakmica negativno utiče na moje raspoloženje.",
    "a_neg4": "4. Negativan ishod utakmice umanjuje moje blagostanje u svakodnevnom životu.",
    "a_neg5": "5. Teško mi je da uskladim treninge i utakmice sa ostalim životnim obavezama.",
    "a_neg6": "6. Unutar tima postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "a_neg7": "7. Učestale utakmice / treninzi negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "a_neg8": "8. Učestale utakmice / treninzi negativno utiču na moje blagostanje.",
    "dodatna_aktivnost": "Ukoliko postoji dodatna sportska aktivnost koju pohađate simultano, molimo Vas da navedete aktivnost i nivo na kom je pohađate",
    "dodatna_aktivnost_nivo": "Nivo angažovanja u toj dodatnoj sportskoj aktivnosti: amater / rekreativac / profesionalac.",
    "p_fiz1": "1. Učešće u ovom sportu pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "p_fiz2": "2. Bez obzira na fizički napor, nakon treninga / utakmice osećam se fizički bolje nego pre te aktivnosti.",
    "p_fiz3": "3. Učešće u ovom sportu pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "p_fiz4": "4. Učešće u ovom sportu doprinosi kvalitetnijem snu.",
    "p_lider1": "1. Moj trener / kapiten me inspiriše i podstiče da dam sve od sebe na treningu i utakmicama.",
    "p_lider2": "2. Moj trener / kapiten se ponaša sa poštovanjem prema svim igračima podjednako.",
    "p_lider3": "3. Osećam da imam slobodu da izrazim svoje mišljenje pred trenerom / kapitenom.",
    "p_lider4": "4. Moj trener / kapiten stvara mogućnosti da se pokažem u grupi i dam svoj doprinos.",
    "p_lider5": "5. Pristup i odnos mog trenera / kapitena prema meni u grupi pozitivno utiče na moje blagostanje.",
    "p_neg1": "1. Ponekad osećam pritisak da odigram dobro na treningu.",
    "p_neg2": "2. Ponekad osećam pritisak da odigram dobro na utakmici.",
    "p_neg3": "3. Loša utakmica ili loš ishod negativno utiče na moje raspoloženje.",
    "p_neg4": "4. Negativan ishod utakmice umanjuje moje blagostanje u svakodnevnom životu.",
    "p_neg5": "5. Teško mi je da uskladim treninge i utakmice sa ostalim životnim obavezama.",
    "p_neg6": "6. Unutar tima postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "p_neg7": "7. Učestale utakmice / treninzi negativno utiču na moje blagostanje.",
    "p_neg8": "8. Profesionalno bavljenje ovim sportom mi stvara osećaj finansijskog pritiska (osećaj da moram da zaradim) što negativno utiče na moje blagostanje.",
    "p_neg9": "9. Učestale utakmice / treninzi negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "prethodna_aktivnost": "Ukoliko ste pre ove grupne sportske aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "prethodna_nivo": "Ukoliko ste pre ove grupne sportske aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "prethodna_trajanje": "Ukoliko ste pre ove grupne sportske aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "r_fiz1": "1. Učešće u ovom sportu pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "r_fiz2": "2. Bez obzira na fizički napor, nakon treninga / utakmice osećam se fizički bolje nego pre te aktivnosti.",
    "r_fiz3": "3. Učešće u ovom sportu pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "r_fiz4": "4. Učešće u ovom sportu doprinosi kvalitetnijem snu.",
    "r_lider1": "1. Osoba koja vodi ili organizuje našu grupu inspiriše me da dam sve od sebe.",
    "r_lider3": "3. Osoba koja vodi grupu ponaša se sa poštovanjem prema svim članovima.",
    "r_neg1": "1. Ponekad osećam pritisak da odigram dobro na treningu.",
    "r_neg2": "2. Ponekad osećam pritisak da odigram dobro na utakmici.",
    "r_neg3": "3. Loša utakmica negativno utiče na moje raspoloženje.",
    "r_neg4": "4. Negativan ishod utakmice umanjuje moje blagostanje u svakodnevnom životu.",
    "r_neg5": "5. Teško mi je da uskladim treninge i utakmice sa ostalim životnim obavezama.",
    "r_neg6": "6. Unutar grupe postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "r_neg7": "7. Učestale utakmice / treninzi negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "r_neg8": "8. Učestale utakmice / treninzi negativno utiču na moje blagostanje.",
    "vrsta_sporta": "Vrsta sportske grupne aktivnosti kojom se bavite"
  },
  folklor: {
    "a_fiz1": "1. Učešće u ovom folklornom ansamblu pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "a_fiz2": "2. Bez obzira na fizički napor, nakon probe / nastupa osećam se fizički bolje nego pre te aktivnosti.",
    "a_fiz3": "3. Učešće u ovom folklornom ansamblu pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "a_fiz4": "4. Učešće u ovom folklornom ansamblu doprinosi kvalitetnijem snu.",
    "a_lider1": "1. Moj trener / vođa ansambla me svojim primerom inspiriše i podstiče da dam sve od sebe na probama i nastupima.",
    "a_lider2": "2. Moj trener / vođa ansambla se ponaša sa poštovanjem prema svim igračima podjednako.",
    "a_lider3": "3. Osećam da imam slobodu da izrazim svoje mišljenje pred trenerom / vođom ansambla.",
    "a_lider4": "4. Moj trener / vođa ansambla stvara mogućnosti da se pokažem u grupi i dam svoj doprinos.",
    "a_lider5": "5. Pristup i odnos mog trenera / vođe ansambla prema meni u grupi pozitivno utiče na moje blagostanje.",
    "a_neg1": "1. Ponekad osećam pritisak da odigram dobro na probi.",
    "a_neg2": "2. Ponekad osećam pritisak da odigram dobro na nastupu.",
    "a_neg3": "3. Loš nastup negativno utiče na moje raspoloženje.",
    "a_neg4": "4. Negativan ishod nastupa umanjuje moje blagostanje u svakodnevnom životu.",
    "a_neg5": "5. Teško mi je da uskladim probe i nastupe sa ostalim životnim obavezama.",
    "a_neg6": "6. Unutar folklorne grupe postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "a_neg7": "7. Učestale probe / nastupi negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "a_neg8": "8. Učestale probe / nastupi negativno utiču na moje blagostanje.",
    "dodatna_aktivnost": "Ukoliko postoji dodatna folklorna aktivnost koju pohađate simultano, molimo Vas da navedete aktivnost i nivo na kom je pohađate",
    "dodatna_aktivnost_nivo": "Nivo angažovanja u toj dodatnoj folklornoj aktivnosti: amater / rekreativac / profesionalac.",
    "p_fiz1": "1. Učešće u ovom folklornom ansamblu pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "p_fiz2": "2. Bez obzira na fizički napor, nakon probe / nastupa osećam se fizički bolje nego pre folklorne aktivnosti.",
    "p_fiz3": "3. Učešće u ovom folklornom ansamblu pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "p_fiz4": "4. Učešće u ovom folklornom ansamblu doprinosi kvalitetnijem snu.",
    "p_lider1": "1. Moj trener / vođa ansambla me inspiriše i podstiče da dam sve od sebe na probama i nastupima.",
    "p_lider2": "2. Moj trener / vođa ansambla se ponaša sa poštovanjem prema svim igračima podjednako.",
    "p_lider3": "3. Osećam da imam slobodu da izrazim svoje mišljenje pred trenerom / vođom ansambla.",
    "p_lider4": "4. Moj trener / vođa ansambla stvara mogućnosti da se pokažem u grupi i dam svoj doprinos.",
    "p_lider5": "5. Pristup i odnos mog trenera / vođe ansambla prema meni u grupi pozitivno utiče na moje blagostanje.",
    "p_neg1": "1. Ponekad osećam pritisak da ne pogrešim na probi.",
    "p_neg2": "2. Ponekad osećam pritisak da ne pogrešim na nastupu / takmičenju.",
    "p_neg3": "3. Loš nastup negativno utiče na moje raspoloženje.",
    "p_neg4": "4. Negativan ishod nastupa / takmičenja umanjuje moje blagostanje u svakodnevnom životu.",
    "p_neg5": "5. Teško mi je da uskladim probe i nastupe sa ostalim životnim obavezama.",
    "p_neg6": "6. Unutar ansambla postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "p_neg7": "7. Učestale probe / nastupi negativno utiču na moje blagostanje.",
    "p_neg8": "8. Profesionalno bavljenje ovom folklornom aktivnošću mi stvara osećaj finansijskog pritiska (osećaj da moram da zaradim) što negativno utiče na moje blagostanje.",
    "p_neg9": "9. Učestale probe / nastupi negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "prethodna_aktivnost": "Ukoliko ste pre ove grupne folklorne aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "prethodna_nivo": "Ukoliko ste pre ove grupne folklorne aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "prethodna_trajanje": "Ukoliko ste pre ove grupne folklorne aktivnosti pohađali neku drugu, molimo Vas da navedete koju i koliko dugo",
    "r_fiz1": "1. Učešće u ovoj grupi pozitivno utiče na moje fizičko zdravlje i bolji imunitet (npr. osećam se fizički otpornije, ređe se razboljevam, lakše prevladavam zdravstvene tegobe i generalno se osećam zdravstveno bolje).",
    "r_fiz2": "2. Bez obzira na fizički napor, nakon probe / nastupa osećam se fizički bolje nego pre folklorne aktivnosti.",
    "r_fiz3": "3. Učešće u ovoj grupi pomaže mi da održim dobru fizičku kondiciju u svakodnevnom životu (npr. osećaj manjeg fizičkog zamora, veće pokretljivosti).",
    "r_fiz4": "4. Učešće u ovoj grupi doprinosi kvalitetnijem snu.",
    "r_lider1": "1. Osoba koja vodi ili organizuje našu grupu inspiriše me da se fizički (kondiciono) razvijam i dajem sve od sebe.",
    "r_lider3": "3. Osoba koja vodi grupu ponaša se sa poštovanjem prema svim igračima.",
    "r_neg1": "1. Ponekad osećam pritisak da ne pogrešim na nastupu.",
    "r_neg2": "2. Ponekad osećam pritisak da ne pogrešim na probi sa ostatkom folklorne grupe.",
    "r_neg3": "3. Loše izvođenje negativno utiče na moje raspoloženje.",
    "r_neg4": "4. Negativan ishod nastupa umanjuje moje blagostanje u svakodnevnom životu.",
    "r_neg5": "5. Teško mi je da uskladim probe i nastupe sa ostalim životnim obavezama.",
    "r_neg6": "6. Unutar grupe postoje loši međuljudski odnosi koji negativno utiču na moje blagostanje.",
    "r_neg7": "7. Učestale probe / nastupi negativno utiču na moje fizičko zdravlje (osećaj iscrpljenosti).",
    "r_neg8": "8. Učestale probe / nastupi negativno utiču na moje blagostanje.",
    "vrsta_folklora": "Vrsta folklornog ansambla u kojoj trenutno učestvujete (amater i profesionalac: šifra iz liste; rekreativac: slobodan unos)",
    "vrsta_folklora_drugo": "Vrsta folklornog ansambla u kojoj trenutno učestvujete — uneto pod „Drugo\""
  }
};

function opisKolone(tip, k) {
  if (OPISI_META[k]) return OPISI_META[k];
  var grupa = OPISI_GRUPA[tip];
  if (grupa && grupa[k]) return grupa[k];
  if (OPISI_ZAJEDNICKI[k]) return OPISI_ZAJEDNICKI[k];

  /* „Dodaj još" setovi (_2, _3…) nose isti tekst kao osnovni set. */
  var m = k.match(/^(.+)_(\d+)$/);
  if (m) {
    var osnovni = opisKolone(tip, m[1]);
    if (osnovni !== m[1]) return osnovni + ' — dodatni unos #' + m[2];
  }
  return k;
}


/* ── Primeri odgovora za TEST tabove ──────────────────────────────────────── */

/* Vrednosti za polja koja nisu Likert skala (opseg im se ne može izvesti). */
var PRIMERI = {
  "pol": ["zenski", "muski", "zenski"],
  "muzicko_obrazovanje": ["srednja_muzicka", "nemam_formalno", "visoko_muzicko"],
  "vrsta_muzike": ["hor", "bend", "orkestar"],
  "vrsta_sporta": ["košarka", "plivanje", "odbojka"],
  "vrsta_folklora": ["kud", "udruzenje", "skola"],
  "dodatna_aktivnost": ["", "rok bend", ""],
  "dodatna_aktivnost_nivo": ["", "rekreativac", ""],
  "prethodna_aktivnost": ["", "hor", "orkestar"],
  "prethodna_nivo": ["", "amater", "rekreativac"],
  "r_ima_vodju": ["da", "ne", "da"],
  "saglasnost": ["da", "da", "da"]
};

function uzorciZa(tip, kol) {
  var uzorci = [];
  for (var s = 0; s < 3; s++) {
    uzorci.push(kol.map(function(k) {
      if (k === '_vreme') return new Date(Date.now() - s * 3600000);
      if (k === 'tip_upitnika') return tip;
      if (PRIMERI[k]) return PRIMERI[k][s];
      var o = (typeof opsegZa === 'function') ? opsegZa(k) : null;
      if (o) return o[0] + ((s * 2 + k.length) % (o[1] - o[0] + 1));
      if (k === 'nivo') return ['amater', 'rekreativac', 'profesionalac'][s];
      return '';
    }));
  }
  return uzorci;
}


/* ── Pomoćnici za dijaloge ────────────────────────────────────────────────── */

function poruka(t) {
  try { SpreadsheetApp.getUi().alert(t); }
  catch (e) { Logger.log(t); }
}

function potvrdi(t) {
  try {
    var ui = SpreadsheetApp.getUi();
    return ui.alert('Potvrda', t, ui.ButtonSet.YES_NO) === ui.Button.YES;
  } catch (e) {
    /* Bez UI konteksta (pokretanje iz editora) — ne briši ništa bez potvrde. */
    Logger.log('Nema UI konteksta — reset preskočen. Pokreni iz menija u tabeli.');
    return false;
  }
}
