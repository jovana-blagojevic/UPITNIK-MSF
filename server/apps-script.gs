/* ══════════════════════════════════════════════════════════════════════════
   UPITNIK — Google Apps Script za prijem odgovora i upis u Google Sheets
   ──────────────────────────────────────────────────────────────────────────
   Ovaj fajl je IZVOR ISTINE za serverski kod. Sam kod se NE izvršava iz Git-a —
   treba ga nalepiti u Apps Script editor vezan za tabelu u koju se upisuje.

   DEPLOY (uradi jednom, pa ponovi „Manage deployments" posle svake izmene koda):
     1. Otvori Google tabelu → Extensions → Apps Script.
     2. Nalepi ceo ovaj fajl, postavi TOKEN ispod (isti kao u config.js).
     3. Deploy → New deployment → tip „Web app".
        • Execute as:        Me
        • Who has access:    Anyone            ← bez ovoga anonimni fetch dobija
                                                  Google login HTML umesto JSON-a
                                                  i upis NE uspeva.
     4. Kopiraj „/exec" URL → to je window.UPITNIK_URL u config.js.

   KAKO RADI (uparuje se sa script.js):
     • Klijent POST-uje ravan JSON: sva polja forme (po „name") + token.
       Telo se šalje BEZ Content-Type: application/json (namerno — izbegava CORS
       preflight); Apps Script svejedno čita e.postData.contents.
     • saglasnost stiže kao 'da' (sam crtež potpisa se NE šalje).
     • Upis je „header-driven": kolone se prave automatski iz imena polja, pa
       različiti upitnici/nivoi (a_… / r_… / p_…) i „Dodaj još" polja (_2, _3…)
       sami dobijaju svoju kolonu — ništa se ne gubi.
     • Tab po grupi: Muzika / Sport / Folklor.
   ══════════════════════════════════════════════════════════════════════════ */

/* Mora biti IDENTIČAN sa window.UPITNIK_TOKEN u config.js. */
var TOKEN = 'ISTI_TOKEN_KAO_U_CONFIG';

/* tip_upitnika → ime taba u tabeli. Ujedno i lista dozvoljenih grupa. */
var TABOVI = { muzika: 'Muzika', sport: 'Sport', folklor: 'Folklor' };

/* Dozvoljeni nivoi angažovanja. */
var NIVOI = ['amater', 'rekreativac', 'profesionalac'];

/* Tehnička polja koja se NE upisuju u tabelu. */
var IZUZMI = { token: true, hp_polje: true };

/* Opseg za godine — mora se poklapati sa min/max na HTML polju (18–80). */
var GODINE_MIN = 18;
var GODINE_MAX = 80;

/* Zaštita tabele od „flooding"-a kolona: upis je header-driven, pa bi inače
   bilo ko mogao POST-om sa izmišljenim ključevima da pravi nove kolone bez
   ograničenja. Najveći legitimni upitnik (muzika + „Dodaj još") ima daleko
   ispod 200 polja; imena polja su uvek [a-z0-9_]. */
var MAX_KLJUCEVA = 200;
var KLJUC_OBLIK = /^[A-Za-z0-9_]{1,48}$/;
var MAX_DUZINA_VREDNOSTI = 500;


function doPost(e) {
  /* Lock serijalizuje upise: bez njega bi dva istovremena slanja mogla da
     pokvare zaglavlje ili da pišu u isti red. */
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);

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

    /* 3) Osnovna validacija ključnih polja. */
    var tip = String(p.tip_upitnika || '');
    if (!TABOVI[tip]) {
      return _json({ status: 'error', greska: 'tip_upitnika' });
    }
    if (NIVOI.indexOf(String(p.nivo)) === -1) {
      return _json({ status: 'error', greska: 'nivo' });
    }
    var god = Number(p.godine);
    if (!(god >= GODINE_MIN && god <= GODINE_MAX)) {
      return _json({ status: 'error', greska: 'godine' });
    }

    /* 4) Oblik payload-a — broj i imena ključeva (vidi MAX_KLJUCEVA gore). */
    var kljucevi = Object.keys(p);
    if (kljucevi.length > MAX_KLJUCEVA) {
      return _json({ status: 'error', greska: 'previse_polja' });
    }
    for (var i = 0; i < kljucevi.length; i++) {
      if (!KLJUC_OBLIK.test(kljucevi[i])) {
        return _json({ status: 'error', greska: 'nedozvoljeno_polje' });
      }
    }

    /* 5) Upis u tab odgovarajuće grupe (pravi ga ako ne postoji). */
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sh = ss.getSheetByName(TABOVI[tip]) || ss.insertSheet(TABOVI[tip]);
    upisiRed(sh, p);

    return _json({ status: 'ok' });
  } catch (err) {
    return _json({ status: 'error', greska: String(err) });
  } finally {
    lock.releaseLock();
  }
}


/* Upisuje jedan red, dinamički šireći zaglavlje (1. red) za nova polja.
   Kolona „_vreme" je uvek prva i sadrži vremensku oznaku prijema. */
function upisiRed(sh, p) {
  var lastCol = sh.getLastColumn();
  var header = lastCol > 0 ? sh.getRange(1, 1, 1, lastCol).getValues()[0] : [];

  /* Prazan tab — postavi početno zaglavlje. */
  if (!header.length) {
    header = ['_vreme'];
    sh.getRange(1, 1, 1, 1).setValues([header]);
  }

  /* Mapa: ime kolone → indeks. */
  var idx = {};
  header.forEach(function(h, i) { idx[h] = i; });

  /* Dodaj kolone za sve nove (još neviđene) ključeve, osim tehničkih. */
  var novi = [];
  Object.keys(p).forEach(function(k) {
    if (IZUZMI[k]) return;
    if (!(k in idx)) {
      idx[k] = header.length + novi.length;
      novi.push(k);
    }
  });
  if (novi.length) {
    sh.getRange(1, header.length + 1, 1, novi.length).setValues([novi]);
    header = header.concat(novi);
  }

  /* Sastavi red po redosledu zaglavlja i upiši. */
  var red = new Array(header.length).fill('');
  red[idx['_vreme']] = new Date();
  Object.keys(p).forEach(function(k) {
    if (!IZUZMI[k]) red[idx[k]] = bezbednaVrednost(p[k]);
  });
  sh.appendRow(red);
}


/* Zaštita od CSV/Formula injection: vrednost koju Sheets može protumačiti kao
   formulu (počinje sa = + - @, ili vodeći tab/CR) tretiraj kao čist tekst —
   dodaj vodeći apostrof. Brojevi i ostali tipovi prolaze nepromenjeni.
   Stringovi se i skraćuju (legitimna polja su kratka; saglasnost stiže kao 'da'). */
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
