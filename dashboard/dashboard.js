// Peugeot 106 dashboard, vanilla.
(function () {
  const SVG = 'http://www.w3.org/2000/svg';

  function ticks(group, count, r1, r2, majorEvery, start, sweep) {
    for (let i = 0; i <= count; i++) {
      const a = (start + sweep * i / count) * Math.PI / 180;
      const l = document.createElementNS(SVG, 'line');
      const major = majorEvery && i % majorEvery === 0;
      const ri = major ? r1 - 4 : r1;
      l.setAttribute('x1', 50 + ri * Math.sin(a)); l.setAttribute('y1', 50 - ri * Math.cos(a));
      l.setAttribute('x2', 50 + r2 * Math.sin(a)); l.setAttribute('y2', 50 - r2 * Math.cos(a));
      if (major) l.classList.add('major');
      group.appendChild(l);
    }
  }
  document.querySelectorAll('.g-ticks').forEach(g => ticks(g, 24, 38, 44, 4, -135, 270));
  document.querySelectorAll('.d-ticks').forEach(g => ticks(g, 10, 42, 48, 5, -135, 270));

  // gauges: value in [0,1] -> needle from -135deg to +135deg
  const gauges = document.querySelectorAll('.gauge');
  function setGauge(i, v) {
    const g = gauges[i]; if (!g) return;
    v = Math.min(1, Math.max(0, v));
    g.querySelector('.g-needle').style.setProperty('--deg', (-135 + 270 * v) + 'deg');
  }
  window.setGauge = setGauge;
  setGauge(0, 0.3); setGauge(1, 0.55);

  // knob: drag (vertical), wheel, arrow keys. value 0..100 -> -135..135deg
  function knob(el, onChange) {
    let v = +el.getAttribute('aria-valuenow') || 0;
    function set(n) {
      v = Math.min(100, Math.max(0, Math.round(n)));
      el.setAttribute('aria-valuenow', v);
      el.style.setProperty('--angle', (-135 + 2.7 * v) + 'deg');
      if (onChange) onChange(v);
    }
    let y0, v0;
    el.addEventListener('pointerdown', e => { y0 = e.clientY; v0 = v; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove', e => { if (y0 != null) set(v0 + (y0 - e.clientY) / 2); });
    el.addEventListener('pointerup', () => { y0 = null; });
    el.addEventListener('wheel', e => { e.preventDefault(); set(v - Math.sign(e.deltaY) * 3); }, { passive: false });
    el.addEventListener('keydown', e => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowRight') set(v + 5);
      else if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') set(v - 5);
      else return;
      e.preventDefault();
    });
    set(v);
  }

  const lcd = document.getElementById('lcd');
  let freq = '98.7', lcdTimer;
  knob(document.getElementById('vol'), v => {
    lcd.textContent = 'VOL ' + String(v).padStart(2, '0');
    clearTimeout(lcdTimer);
    lcdTimer = setTimeout(() => { lcd.textContent = 'FM ' + freq; }, 900);
  });
  lcd.textContent = 'FM ' + freq;

  const win = document.getElementById('win');
  knob(document.getElementById('temp'), v => { win.textContent = (16 + Math.round(v * 0.12)) + '°'; });

  document.querySelectorAll('.preset').forEach(b => b.addEventListener('click', () => {
    freq = b.dataset.freq; lcd.textContent = 'FM ' + freq;
  }));

  const defrost = document.getElementById('defrost'), lamp = document.getElementById('lamp');
  defrost.addEventListener('click', () => {
    const on = defrost.getAttribute('aria-pressed') !== 'true';
    defrost.setAttribute('aria-pressed', on);
    lamp.classList.toggle('on', on);
  });
})();
