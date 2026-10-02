(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };

  function fmt(s) {
    if (!isFinite(s)) s = 0;
    var m = Math.floor(s / 60), r = Math.floor(s % 60);
    return (m < 10 ? '0' : '') + m + ':' + (r < 10 ? '0' : '') + r;
  }

  /* ---------- 1. XP window ---------- */
  var win = $('xpWindow'), title = $('xpTitle');
  var video = $('xpVideo'), play = $('xpPlay'), seek = $('xpSeek'), vol = $('xpVol'), time = $('xpTime');

  // drag by title bar, kept inside the page
  var drag = null;
  title.addEventListener('pointerdown', function (e) {
    if (e.target.closest('button')) return;
    var r = win.getBoundingClientRect();
    drag = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    win.style.position = 'absolute';
    win.style.left = r.left + window.scrollX + 'px';
    win.style.top = r.top + window.scrollY + 'px';
    win.style.margin = '0';
    title.setPointerCapture(e.pointerId);
  });
  title.addEventListener('pointermove', function (e) {
    if (!drag) return;
    var x = e.clientX - drag.dx + window.scrollX;
    var y = e.clientY - drag.dy + window.scrollY;
    var maxX = document.documentElement.scrollWidth - win.offsetWidth;
    var maxY = document.documentElement.scrollHeight - win.offsetHeight;
    win.style.left = Math.max(0, Math.min(maxX, x)) + 'px';
    win.style.top = Math.max(0, Math.min(maxY, y)) + 'px';
  });
  title.addEventListener('pointerup', function () { drag = null; });
  title.addEventListener('pointercancel', function () { drag = null; });

  // keeps the XP play button and the Nomad play key in sync
  function setPlayState(on) {
    play.setAttribute('aria-pressed', on ? 'true' : 'false');
    $('nkPlay').setAttribute('aria-pressed', on ? 'true' : 'false');
  }
  function togglePlay() {
    if (!video.currentSrc) { setPlayState(play.getAttribute('aria-pressed') !== 'true'); return; }
    if (video.paused) video.play().catch(function () { setPlayState(false); }); else video.pause();
  }
  play.addEventListener('click', togglePlay);
  video.addEventListener('play', function () { setPlayState(true); });
  video.addEventListener('pause', function () { setPlayState(false); });

  function updateTime() {
    time.textContent = fmt(video.currentTime) + ' / ' + fmt(video.duration);
    if (video.duration) seek.value = Math.round(video.currentTime / video.duration * 1000);
    lcdProgress(video.duration ? video.currentTime / video.duration : 0);
    $('lcdPos').textContent = fmt(video.currentTime);
    $('lcdDur').textContent = fmt(video.duration);
    $('waFootTime').textContent = fmt(video.currentTime) + '/' + fmt(video.duration);
  }
  video.addEventListener('timeupdate', updateTime);
  video.addEventListener('loadedmetadata', updateTime);
  seek.addEventListener('input', function () {
    if (video.duration) video.currentTime = seek.value / 1000 * video.duration;
  });
  vol.addEventListener('input', function () { video.volume = vol.value / 100; });
  video.volume = vol.value / 100;

  /* ---------- 2. Winamp ---------- */
  var eq = $('waEq');
  for (var i = 0; i < 10; i++) {
    var s = document.createElement('input');
    s.type = 'range'; s.min = -20; s.max = 20; s.value = 0;
    s.setAttribute('aria-label', 'Bande ' + (i + 1));
    eq.appendChild(s);
  }

  var tracks = [];
  for (var k = 1; k <= 12; k++) tracks.push({ title: 'Film ' + (k < 10 ? '0' : '') + k, dur: '0:00' });

  var list = $('waList');
  tracks.forEach(function (t, idx) {
    var li = document.createElement('li');
    li.tabIndex = 0;
    li.setAttribute('role', 'option');
    li.setAttribute('aria-selected', 'false');
    li.innerHTML =
      '<span class="wa-n">' + (idx + 1) + '.</span>' +
      '<span class="wa-t"></span><span class="wa-dots"></span>' +
      '<span class="wa-d"></span>';
    li.querySelector('.wa-t').textContent = t.title;
    li.querySelector('.wa-d').textContent = t.dur;
    li.addEventListener('click', function () { select(idx); });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(idx); }
      if (e.key === 'ArrowDown' && li.nextElementSibling) li.nextElementSibling.focus();
      if (e.key === 'ArrowUp' && li.previousElementSibling) li.previousElementSibling.focus();
    });
    list.appendChild(li);
  });
  list.setAttribute('role', 'listbox');

  var current = 0;
  function select(idx) {
    current = (idx + tracks.length) % tracks.length;
    Array.prototype.forEach.call(list.children, function (li, i) {
      li.setAttribute('aria-selected', i === current ? 'true' : 'false');
    });
    $('lcdL1').textContent = tracks[current].title;
    $('lcdIdx').textContent = (current + 1 < 10 ? '0' : '') + (current + 1);
    document.dispatchEvent(new CustomEvent('player:select', { detail: { index: current } }));
  }

  /* ---------- 3. Nomad ---------- */
  var BAR_W = 22;
  function lcdProgress(p) {
    var n = Math.round(Math.max(0, Math.min(1, p)) * BAR_W);
    var bar = '';
    for (var i = 0; i < BAR_W; i++) bar += i < n ? '█' : '░';
    $('lcdBar').textContent = '▶ ' + bar;
  }
  $('nkPlay').addEventListener('click', togglePlay);
  $('nkStop').addEventListener('click', function () {
    video.pause(); if (video.currentSrc) video.currentTime = 0; setPlayState(false); updateTime();
  });
  $('nkPrev').addEventListener('click', function () { select(current - 1); });
  $('nkNext').addEventListener('click', function () { select(current + 1); });

  select(0);
  updateTime();
})();
