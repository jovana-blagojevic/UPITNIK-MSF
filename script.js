/* ══════════════════════════════════════════
   LOCAL STORAGE — blokiranje ponovnog popunjavanja
   ══════════════════════════════════════════ */
(function() {
    const forma = document.getElementById('forma');
    if (!forma) return;
    const tip = (forma.querySelector('input[name="tip_upitnika"]') || {}).value;
    if (!tip) return;
    if (localStorage.getItem('upitnik_popunjen_' + tip) === 'da') {
        forma.closest('.upitnik').innerHTML =
            '<div class="hvala">' +
            '<p>Već ste popunili ovaj upitnik.</p>' +
            '<p>Vaši odgovori su zabeleženi. Hvala Vam na učešću!</p>' +
            '</div>';
    }
})();

/* ══════════════════════════════════════════
   DRUGO — aktivacija tekst polja
   ══════════════════════════════════════════ */
document.querySelectorAll('.opcija-drugo input[type="radio"]').forEach(function(radio) {
    radio.addEventListener('change', function() {
        if (this.checked) {
            var input = this.closest('.opcija-drugo').querySelector('.unos-drugo');
            if (input) { input.removeAttribute('tabindex'); input.focus(); }
        }
    });
});

document.querySelectorAll('.opcije-red').forEach(function(red) {
    red.addEventListener('change', function(e) {
        if (e.target.type === 'radio' && !e.target.closest('.opcija-drugo')) {
            red.querySelectorAll('.unos-drugo').forEach(function(inp) {
                inp.setAttribute('tabindex', '-1');
            });
        }
    });
});

/* ══════════════════════════════════════════
   NIVO-ZAVISNA PITANJA (Dodatna pitanja)
   Prikazuje blok pitanja prema izabranom nivou
   angažovanja; za rekreativce otkriva pitanja o
   neformalnom vođi tek ako on/ona postoji.
   ══════════════════════════════════════════ */
(function() {
    /* Nivo-zavisni blokovi su sada raspoređeni preko više sekcija
       (Fizička dobrobit, Odnos sa liderom, Negativni faktori), pa se
       traže na nivou celog dokumenta. */
    const blokovi    = document.querySelectorAll('.nivo-blok');
    if (!blokovi.length) return;

    const praznoBlokovi = document.querySelectorAll('.nivo-prazno');
    const vodjaBlokovi  = document.querySelectorAll('.vodja-blok');

    /* Poništava odgovore u bloku koji se sakriva da se ne bi poslali */
    function resetBlok(blok) {
        if (!blok) return;
        blok.querySelectorAll('input[type="radio"]').forEach(function(r) { r.checked = false; });
        blok.querySelectorAll('.ima-izbor').forEach(function(el) { el.classList.remove('ima-izbor'); });
        blok.querySelectorAll('.neizabrana').forEach(function(el) { el.classList.remove('neizabrana'); });
        blok.querySelectorAll('.greska').forEach(function(el) { el.classList.remove('greska'); });
        blok.querySelectorAll('.greska-tekst').forEach(function(el) { el.remove(); });
    }

    function sakrij(blok) {
        if (!blok || blok.classList.contains('skriveno')) return;
        blok.classList.add('skriveno');
        resetBlok(blok);
    }

    function prikaziVodju(prikazi) {
        vodjaBlokovi.forEach(function(vodjaBlok) {
            if (prikazi) vodjaBlok.classList.remove('skriveno');
            else         sakrij(vodjaBlok);
        });
    }

    document.querySelectorAll('input[name="nivo"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (!this.checked) return;
            const izabran = this.value;
            praznoBlokovi.forEach(function(prazno) { prazno.classList.add('skriveno'); });
            blokovi.forEach(function(blok) {
                if (blok.getAttribute('data-nivo') === izabran) blok.classList.remove('skriveno');
                else sakrij(blok);
            });
            /* Pri promeni na nešto što nije rekreativac, poništi grananje o vođi */
            if (izabran !== 'rekreativac') {
                document.querySelectorAll('input[name="r_ima_vodju"]').forEach(function(r) { r.checked = false; });
                prikaziVodju(false);
            }
        });
    });

    document.querySelectorAll('input[name="r_ima_vodju"]').forEach(function(radio) {
        radio.addEventListener('change', function() {
            if (!this.checked) return;
            prikaziVodju(this.value === 'da');
        });
    });

    /* Početno stanje — npr. ako pregledač vrati prethodno izabran nivo */
    const vecIzabran = document.querySelector('input[name="nivo"]:checked');
    if (vecIzabran) vecIzabran.dispatchEvent(new Event('change', { bubbles: true }));
})();

/* ══════════════════════════════════════════
   CANVAS POTPIS
   ══════════════════════════════════════════ */
(function() {
    const canvas = document.getElementById('saglasnost-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let crta = false;
    let imaTracka = false;

    ctx.strokeStyle = '#111118';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function getPos(e) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const src = e.touches ? e.touches[0] : e;
        return {
            x: (src.clientX - rect.left) * scaleX,
            y: (src.clientY - rect.top) * scaleY
        };
    }

    function start(e) {
        e.preventDefault();
        crta = true;
        const pos = getPos(e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
        canvas.classList.add('aktivan');
    }

    function draw(e) {
        if (!crta) return;
        e.preventDefault();
        const pos = getPos(e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        if (!imaTracka) {
            imaTracka = true;
            canvas.classList.remove('prazno');
            const hidden = document.getElementById('saglasnost');
            if (hidden) hidden.value = 'potpis';
        }
    }

    function stop(e) {
        if (!crta) return;
        crta = false;
        ctx.closePath();
        canvas.classList.remove('aktivan');
        const hidden = document.getElementById('saglasnost');
        if (hidden && imaTracka) hidden.value = canvas.toDataURL();
    }

    canvas.addEventListener('mousedown',  start);
    canvas.addEventListener('mousemove',  draw);
    canvas.addEventListener('mouseup',    stop);
    canvas.addEventListener('mouseleave', stop);
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove',  draw,  { passive: false });
    canvas.addEventListener('touchend',   stop);
})();

function potpis_obrisi(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.classList.add('prazno');
    const hidden = document.getElementById('saglasnost');
    if (hidden) hidden.value = '';
}

const forma = document.getElementById('forma');

/* ── Pronalazi wrapper pitanja (radi i za .pitanje i za .likert-red) ── */
function getPitanjeWrapper(el) {
    return el.closest('.likert-red') || el.closest('.pitanje');
}

function prikaziGresku(pitanje, poruka) {
    pitanje.classList.add('greska');
    let span = pitanje.querySelector('.greska-tekst');
    if (!span) {
        span = document.createElement('span');
        span.className = 'greska-tekst';
        pitanje.appendChild(span);
    }
    span.textContent = poruka;
}

function ukloniGresku(pitanje) {
    if (!pitanje) return;
    pitanje.classList.remove('greska');
    const span = pitanje.querySelector('.greska-tekst');
    if (span) span.remove();
}

/* ── Zasivljavanje opcija pri promeni ── */
forma.addEventListener('change', (e) => {
    const pitanje = getPitanjeWrapper(e.target);
    if (pitanje) ukloniGresku(pitanje);

    if (e.target.type === 'radio') {
        /* Standardne pill opcije */
        const red = e.target.closest('.opcije-red');
        if (red && !red.classList.contains('likert-opcije')) {
            red.classList.add('ima-izbor');
            red.querySelectorAll('.opcija').forEach(opcija => {
                const radio = opcija.querySelector('input[type="radio"]');
                opcija.classList.toggle('neizabrana', !radio.checked);
            });
        }

        /* Likert kružići */
        const likertOpcije = e.target.closest('.likert-opcije');
        if (likertOpcije) {
            likertOpcije.classList.add('ima-izbor');
            likertOpcije.querySelectorAll('.likert-opcija').forEach(opcija => {
                const radio = opcija.querySelector('input[type="radio"]');
                opcija.classList.toggle('neizabrana', !radio.checked);
            });
        }
    }
});

forma.addEventListener('input', (e) => {
    const pitanje = getPitanjeWrapper(e.target);
    if (pitanje) ukloniGresku(pitanje);
});

forma.addEventListener('submit', (e) => {
    e.preventDefault();

    let imaGreski = false;

    /* ── Validacija svih radio grupa ── */
    const radioGrupe = [...new Set(
        [...forma.querySelectorAll('input[type="radio"]')].map(r => r.name)
    )];

    radioGrupe.forEach(ime => {
        const prviRadio = forma.querySelector(`input[name="${ime}"]`);
        const pitanje = getPitanjeWrapper(prviRadio);
        /* Preskoči skrivena pitanja (nivo-zavisni blokovi) */
        if (!pitanje || pitanje.offsetParent === null) return;
        const izabrano = forma.querySelector(`input[name="${ime}"]:checked`);
        if (!izabrano) {
            prikaziGresku(pitanje, 'Ovo polje je obavezno.');
            imaGreski = true;
        }
    });

    /* ── Validacija number inputa ── */
    forma.querySelectorAll('input[type="number"]').forEach(input => {
        const pitanje = getPitanjeWrapper(input);
        if (pitanje && pitanje.offsetParent === null) return;
        if (!input.value || input.value < input.min || input.value > input.max) {
            prikaziGresku(pitanje, `Unesite broj između ${input.min} i ${input.max}.`);
            imaGreski = true;
        }
    });

    /* ── Validacija canvas potpisa ── */
    const canvasPotpis = forma.querySelector('#saglasnost-canvas');
    if (canvasPotpis) {
        const hidden = forma.querySelector('#saglasnost');
        const pitanje = getPitanjeWrapper(canvasPotpis) || canvasPotpis.closest('.pitanje') || canvasPotpis.closest('.saglasnost-blok');
        if (!hidden || !hidden.value) {
            if (pitanje) prikaziGresku(pitanje, 'Molimo Vas da se potpišete.');
            canvasPotpis.style.borderColor = 'var(--greska)';
            imaGreski = true;
        }
    } else {
        /* ── Validacija text inputa (fallback) ── */
        forma.querySelectorAll('input[type="text"], textarea').forEach(input => {
            const pitanje = getPitanjeWrapper(input);
            if (!input.value.trim()) {
                prikaziGresku(pitanje, 'Ovo polje je obavezno.');
                imaGreski = true;
            }
        });
    }

    if (imaGreski) {
        const prvaGreska = forma.querySelector('.greska');
        if (prvaGreska) prvaGreska.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
    }

    /* ── Slanje podataka na Google Sheets ── */
    const podaci = {};
    const fd = new FormData(forma);
    fd.forEach((vrednost, kljuc) => {
        podaci[kljuc] = kljuc === 'saglasnost' ? 'da' : vrednost;
    });
    podaci.token = window.UPITNIK_TOKEN;

    const dugme = forma.querySelector('[type="submit"]');
    dugme.disabled = true;
    dugme.textContent = 'Šalje se…';

    fetch(window.UPITNIK_URL, {
        method: 'POST',
        body: JSON.stringify(podaci)
    })
    .then(function(res) { return res.json(); })
    .then(function(odgovor) {
        if (odgovor.status === 'ok') {
            const tip = podaci.tip_upitnika;
            if (tip) localStorage.setItem('upitnik_popunjen_' + tip, 'da');
            forma.closest('.upitnik').innerHTML =
                '<div class="hvala">' +
                '<p>Hvala na popunjenom upitniku!</p>' +
                '<p>Vaši odgovori su uspešno zabeleženi.</p>' +
                '</div>';
        } else {
            throw new Error(odgovor.greska || 'Nepoznata greška');
        }
    })
    .catch(function() {
        dugme.disabled = false;
        dugme.textContent = 'Pošalji';
        alert('Došlo je do greške pri slanju. Molimo pokušajte ponovo.');
    });
});
