(() => {
  // placeholder content, no real titles
  const CATS = [
    { id: 'films', label: 'Films', icon: 'i-films', n: 6 },
    { id: 'commercials', label: 'Commercials', icon: 'i-commercials', n: 8 },
    { id: 'music', label: 'Music Videos', icon: 'i-music', n: 5 },
    { id: 'about', label: 'About', icon: 'i-about', items: ['Biography', 'Awards', 'Press'] },
    { id: 'contact', label: 'Contact', icon: 'i-contact', items: ['Email', 'Agent', 'Instagram'] },
  ];
  CATS.forEach(c => { if (!c.items) c.items = Array.from({ length: c.n }, (_, k) => `${c.label.replace(/s$/, '')} ${String(k + 1).padStart(2, '0')}`); });

  const catsEl = document.getElementById('cats');
  const itemsEl = document.getElementById('items');
  const use = id => `<svg><use href="#${id}"/></svg>`;
  let ci = 0, ii = CATS.map(() => 0);

  catsEl.innerHTML = CATS.map((c, k) =>
    `<li class="cat" role="tab" data-k="${k}">${use(c.icon)}<span class="label">${c.label}</span></li>`).join('');

  function renderItems() {
    const c = CATS[ci];
    itemsEl.innerHTML = c.items.map((t, k) =>
      `<li class="item" role="option" data-k="${k}" id="${c.id}-${k}"><span class="ico">${use(c.icon)}<svg class="badge"><use href="#i-badge"/></svg></span><span class="text">${t}</span></li>`).join('');
    paintItems();
  }
  function paintCats() {
    catsEl.style.setProperty('--i', ci);
    [...catsEl.children].forEach((el, k) => {
      el.setAttribute('aria-selected', k === ci);
      el.style.setProperty('--d', Math.abs(k - ci));
    });
  }
  function paintItems() {
    const i = ii[ci];
    itemsEl.style.setProperty('--i', i);
    [...itemsEl.children].forEach((el, k) => {
      el.setAttribute('aria-selected', k === i);
      el.style.setProperty('--d', Math.abs(k - i));
      el.classList.toggle('above', k < i);
    });
    itemsEl.setAttribute('aria-activedescendant', `${CATS[ci].id}-${i}`);
  }
  function setCat(k) {
    ci = Math.max(0, Math.min(CATS.length - 1, k));
    paintCats();
    itemsEl.classList.add('swap');
    renderItems();
    requestAnimationFrame(() => requestAnimationFrame(() => itemsEl.classList.remove('swap')));
  }
  function setItem(k) {
    ii[ci] = Math.max(0, Math.min(CATS[ci].items.length - 1, k));
    paintItems();
  }
  function open() {
    document.dispatchEvent(new CustomEvent('xmb:open', { detail: { id: `${CATS[ci].id}-${ii[ci]}`, category: CATS[ci].id, index: ii[ci] } }));
  }

  document.addEventListener('keydown', e => {
    const map = { ArrowLeft: () => setCat(ci - 1), ArrowRight: () => setCat(ci + 1), ArrowUp: () => setItem(ii[ci] - 1), ArrowDown: () => setItem(ii[ci] + 1), Enter: open };
    if (map[e.key]) { e.preventDefault(); map[e.key](); }
  });
  catsEl.addEventListener('click', e => { const li = e.target.closest('.cat'); if (li) setCat(+li.dataset.k); });
  itemsEl.addEventListener('click', e => {
    const li = e.target.closest('.item'); if (!li) return;
    if (+li.dataset.k === ii[ci]) open(); else setItem(+li.dataset.k);
  });
  let wheelAcc = 0;
  document.addEventListener('wheel', e => {
    wheelAcc += e.deltaY;
    if (Math.abs(wheelAcc) > 40) { setItem(ii[ci] + Math.sign(wheelAcc)); wheelAcc = 0; }
  }, { passive: true });

  paintCats(); renderItems(); catsEl.focus();

  // clock
  const clock = document.getElementById('clock');
  const tick = () => { const d = new Date(); clock.textContent = `${d.getMonth() + 1}/${d.getDate()} ${d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`; };
  tick(); setInterval(tick, 10000);

  // waves: colors and speed come from CSS variables
  const cv = document.getElementById('waves'), ctx = cv.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const colors = ['--wave-1', '--wave-2', '--wave-3'].map(v => css.getPropertyValue(v).trim());
  const speed = parseFloat(css.getPropertyValue('--wave-speed')) || 0.00018;
  const resize = () => { cv.width = innerWidth * devicePixelRatio; cv.height = innerHeight * devicePixelRatio; ctx.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0); };
  addEventListener('resize', resize); resize();
  const ribbons = [
    { c: 0, y: .58, amp: .09, freq: 1.1, w: 70, phase: 0 },
    { c: 1, y: .64, amp: .07, freq: 1.6, w: 40, phase: 2.1 },
    { c: 2, y: .72, amp: .11, freq: 0.8, w: 110, phase: 4.2 },
  ];
  function draw(t) {
    const W = innerWidth, H = innerHeight;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    for (const r of ribbons) {
      const g = ctx.createLinearGradient(0, 0, W, 0);
      g.addColorStop(0, 'transparent'); g.addColorStop(.3, colors[r.c]); g.addColorStop(.7, colors[r.c]); g.addColorStop(1, 'transparent');
      ctx.strokeStyle = g; ctx.lineWidth = r.w; ctx.filter = 'blur(14px)';
      ctx.beginPath();
      for (let x = -20; x <= W + 20; x += 8) {
        const k = x / W;
        const y = H * r.y + Math.sin(k * r.freq * Math.PI * 2 + t * speed + r.phase) * H * r.amp
                + Math.sin(k * r.freq * 0.5 * Math.PI * 2 - t * speed * 0.6 + r.phase) * H * r.amp * 0.5;
        x < 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.filter = 'none';
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
})();
