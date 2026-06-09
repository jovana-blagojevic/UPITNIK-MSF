// Konfiguracija — ovaj fajl SE KOMITUJE u Git (namerno).
//
// ⚠️ VAŽNO — BEZBEDNOST:
// Sajt je statičan i deli se preko GitHub Pages, koji servira samo fajlove iz
// Git-a. Zato config.js MORA biti u repou — inače forma na živom sajtu nema
// URL/TOKEN i ne šalje. To je bezbedno: kod se učitava u pretraživaču, pa su
// URL i TOKEN ionako VIDLJIVI svakome (View Source / Network tab). TOKEN NIJE
// TAJNA i ne štiti od zloupotrebe — on je samo minimalna prepreka. Pravu zaštitu
// radi Apps Script na serverskoj strani (provera tokena + honeypota, validacija
// opsega i sanitizacija). Vidi server/apps-script.gs.

// 1) URL: zalepi „/exec" URL koji dobiješ posle Deploy → Web app.
//    (Mora se završavati na /exec — NE /dev.)
window.UPITNIK_URL   = 'https://script.google.com/macros/s/AKfycbzGs2P71QamzBlVsJF4I7bbq37QaXHM49wggD5xkSepVufcvhpcl0BEykGOaouAfEY/exec';

// 2) TOKEN: mora biti IDENTIČAN konstanti TOKEN u apps-script.gs.
//    Ovaj je već generisan za tebe — samo isti string upiši i u apps-script.gs.
window.UPITNIK_TOKEN = '4a0e2d47b110d8f0bb58ab48a4b59b1b6b181bc360b6fbce';