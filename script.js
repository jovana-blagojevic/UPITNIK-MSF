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
            // Upiši data URL u hidden input
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
        const izabrano = forma.querySelector(`input[name="${ime}"]:checked`);
        if (!izabrano) {
            prikaziGresku(pitanje, 'Ovo polje je obavezno.');
            imaGreski = true;
        }
    });

    /* ── Validacija number inputa ── */
    forma.querySelectorAll('input[type="number"]').forEach(input => {
        const pitanje = getPitanjeWrapper(input);
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

    alert('Hvala na popunjenom upitniku!');
});
