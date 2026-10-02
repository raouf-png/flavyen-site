const ABOUT = [
  { label: "Bio", sub: "Director & Art Director", text: "I'm Flavyen Dupont, a Director & Art Director but also Motion Designer, Editor and Producer. I have worked in digital, cinema, and television and had the opportunity to work with various big names internationally and in France such as Google, YouTube, Coway, Hyundai, Samyang, DCMJ, Mentorshow, Deezer and more." },
];
const CONTACT = [
  { label: "Email", sub: "flavyen.dupont@hotmail.com", text: "flavyen.dupont@hotmail.com", href: "mailto:flavyen.dupont@hotmail.com" },
  { label: "Instagram", sub: "@flavyen_d", text: "@flavyen_d", href: "https://www.instagram.com/flavyen_d/" },
  { label: "Vimeo", sub: "vimeo.com/user74346532", text: "vimeo.com/user74346532", href: "https://vimeo.com/user74346532" },
];

const CATS = [
  { id: "all", label: "All", items: FILMS },
  { id: "ads", label: "Ads", items: FILMS.filter(f => f.cat.includes("ADS")) },
  { id: "fiction", label: "Fiction", items: FILMS.filter(f => f.cat.includes("FICTION")) },
  { id: "about", label: "About", items: ABOUT, text: true },
  { id: "contact", label: "Contact", items: CONTACT, text: true },
];

const $ = id => document.getElementById(id);
const cats = $("cats"), list = $("column"), meta = $("meta");
const imgA = $("stageImg"), imgB = $("stageImgNext");
const state = { c: 0, sel: CATS.map(() => 0) };
let front = imgA, fadeToken = 0;

const mmss = s => s ? `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}` : "";
const icon = name => `<svg aria-hidden="true"><use href="#icon-${name}"/></svg>`;
const filmIcon = f => f.cat.includes("FICTION") ? "fiction" : f.cat.includes("ADS") ? "ads" : "all";

// Resolve CSS lengths (vh, vw, px) to pixels
function px(name) {
  const probe = document.createElement("div");
  probe.style.cssText = `position:absolute;visibility:hidden;width:var(${name})`;
  document.body.appendChild(probe);
  const v = probe.getBoundingClientRect().width;
  probe.remove();
  return v;
}

// Category row, ported from the ChatGPT build (.categories / .category)
function renderCats() {
  cats.innerHTML = CATS.map((c, i) =>
    `<button class="cat" role="tab" data-i="${i}">${icon(c.id)}<span>${c.label}</span></button>`).join("");
  cats.querySelectorAll(".cat").forEach(b => b.onclick = () => setCat(+b.dataset.i));
}

// Film list, ported from the ChatGPT build (#film-list / .film-item)
function renderList() {
  const cat = CATS[state.c];
  list.innerHTML = cat.items.map((f, i) => cat.text
    ? `<li><button class="film-item" data-i="${i}"><span class="item-icon">${icon(cat.id)}</span><span class="item-text">${f.label}<small>${f.sub}</small></span></button></li>`
    : `<li><button class="film-item" data-i="${i}"><span class="item-icon">${icon(filmIcon(f))}</span><span class="item-text">${f.title}<small>${[f.n, f.sub, mmss(f.dur)].filter(Boolean).join(" / ").toUpperCase()}</small></span></button></li>`
  ).join("");
  list.querySelectorAll(".film-item").forEach(b => b.onclick = () => {
    const i = +b.dataset.i;
    i === state.sel[state.c] ? open() : select(i);
  });
}

function layout() {
  const s = state.sel[state.c];
  list.querySelectorAll(".film-item").forEach(b => {
    const d = +b.dataset.i - s;
    b.setAttribute("aria-pressed", d === 0);
    b.tabIndex = d === 0 ? 0 : -1;
  });
  // The selected row stays at --sel-y, the list slides under it (PSP)
  list.style.transform = `translateY(${px("--sel-y") - px("--list-top") - s * px("--step-y")}px)`;

  cats.querySelectorAll(".cat").forEach((b, i) => {
    b.setAttribute("aria-selected", i === state.c);
    b.tabIndex = i === state.c ? 0 : -1;
  });
  cats.style.transform = `translateX(${-state.c * px("--cat-w")}px)`;
  stage();
}

function stage() {
  const cat = CATS[state.c], f = cat.items[state.sel[state.c]];
  if (cat.text) {
    imgA.style.opacity = imgB.style.opacity = 0;
    meta.innerHTML = `<span class="n">${String(state.sel[state.c] + 1).padStart(2, "0")}</span><span class="t">${f.label}</span><span></span>
      <p>${f.href ? `<a href="${f.href}" target="_blank" rel="noopener">${f.text}</a>` : f.text}</p>`;
    return;
  }
  const src = `media/${f.n}.jpg`;
  if (!front.src.endsWith(src)) {
    const token = ++fadeToken, back = front === imgA ? imgB : imgA;
    back.onload = () => {
      if (token !== fadeToken) return;
      back.style.opacity = 1; front.style.opacity = 0; front = back;
    };
    back.src = src;
  } else front.style.opacity = 1;
  meta.innerHTML = `<span class="n">${f.n}</span><span class="t">${f.title}</span><span class="dur">${mmss(f.dur)}</span>
    <span></span><span class="sub">${[f.sub, f.cat === "All" ? "" : f.cat.toLowerCase()].filter(Boolean).join(", ")}</span>`;
}

function select(i) {
  const n = CATS[state.c].items.length;
  state.sel[state.c] = Math.max(0, Math.min(n - 1, i));
  layout();
}

function setCat(i) {
  state.c = Math.max(0, Math.min(CATS.length - 1, i));
  renderList();
  layout();
}

function open() {
  const cat = CATS[state.c], f = cat.items[state.sel[state.c]];
  const url = cat.text ? f.href : f.vimeo;
  if (url) window.open(url, "_blank", "noopener");
}

addEventListener("keydown", e => {
  const k = { ArrowUp: () => select(state.sel[state.c] - 1), ArrowDown: () => select(state.sel[state.c] + 1),
    ArrowLeft: () => setCat(state.c - 1), ArrowRight: () => setCat(state.c + 1), Enter: open }[e.key];
  if (k) { e.preventDefault(); k(); }
});

// Trackpads send many small deltas: accumulate, one PSP step per notch
let wheelAcc = 0, wheelLast = 0;
addEventListener("wheel", e => {
  e.preventDefault();
  wheelAcc += e.deltaY;
  const now = performance.now();
  if (Math.abs(wheelAcc) < 40 || now - wheelLast < 90) return;
  wheelLast = now;
  select(state.sel[state.c] + Math.sign(wheelAcc));
  wheelAcc = 0;
}, { passive: false });

addEventListener("resize", layout);

function tick() {
  const d = new Date();
  $("clock").textContent = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
tick(); setInterval(tick, 10000);

renderCats();
renderList();
layout();
