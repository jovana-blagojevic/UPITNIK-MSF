// Kopiraj ovaj fajl u config.js i unesi prave vrednosti.
// config.js je u .gitignore i nikad ne ide u Git.
//
// ⚠️ VAŽNO — BEZBEDNOST:
// Ovaj kod se učitava u pretraživaču, pa su i URL i TOKEN VIDLJIVI svakome
// (View Source / Network tab). TOKEN NIJE TAJNA i ne štiti od zloupotrebe —
// on je samo minimalna prepreka. Pravu zaštitu mora da radi Apps Script na
// serverskoj strani:
//   1) proveri da se prosleđeni `token` poklapa sa očekivanim;
//   2) odbaci zapis ako je honeypot polje `hp_polje` POPUNJENO (botovi ga pune);
//   3) validiraj očekivana polja i opsege (npr. godine 18–80) i odbaci prazne;
//   4) ograniči učestalost (npr. najviše N zapisa po minuti / po IP-u).
// Vidi README („Bezbednost") za primer Apps Script provere.
window.UPITNIK_URL   = 'OVDE_NALEPITI_APPS_SCRIPT_URL';
window.UPITNIK_TOKEN = 'OVDE_NALEPITI_TAJNI_TOKEN';
