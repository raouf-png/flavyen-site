# Clone flavyendupont.com: projects, covers, images, texts, video links.
import re, os, json, csv, html, urllib.request

BASE = "https://flavyendupont.com"
OUT = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/128 Safari/537.36"}

def get(url, binary=False, headers=None):
    req = urllib.request.Request(url, headers={**UA, **(headers or {})})
    data = urllib.request.urlopen(req, timeout=60).read()
    return data if binary else data.decode("utf-8", "replace")

def save(url, path):
    if os.path.exists(path):
        return
    with open(path, "wb") as f:
        f.write(get(url, binary=True))

def text_of(fragment):
    t = re.sub(r"<script.*?</script>|<style.*?</style>", "", fragment, flags=re.S)
    t = re.sub(r"<br\s*/?>", "\n", t)
    t = re.sub(r"</(div|p|h\d|li)>", "\n", t)
    t = html.unescape(re.sub(r"<[^>]+>", "", t))
    lines = [re.sub(r"[ \t\xa0]+", " ", l).strip() for l in t.split("\n")]
    out = []
    for l in lines:
        if l or (out and out[-1]):
            out.append(l)
    return "\n".join(out).strip()

def biggest(img_tag):
    m = re.search(r'data-srcset="([^"]+)"', img_tag)
    if m:
        return m.group(1).split(",")[-1].strip().split(" ")[0]
    m = re.search(r'data-src="([^"]+)"', img_tag) or re.search(r'src="([^"]+)"', img_tag)
    return html.unescape(m.group(1)) if m else None

def ext(url):
    m = re.search(r"\.(jpg|jpeg|png|gif|webp|mp4)(\?|$)", url, re.I)
    return m.group(1).lower() if m else "jpg"

def covers(page_html):
    res = []
    for block in re.split(r'(?=<a class="project-cover)', page_html)[1:]:
        href = re.search(r'href="([^"]+)"', block).group(1)
        title = re.search(r'class="title preserve-whitespace[^"]*"[^>]*>([^<]*)<', block)
        imgs = re.findall(r"<img[^>]+>", block, flags=re.S)
        roll = next((biggest(i) for i, k in zip(imgs, re.findall(r'class="cover (cover-\w+)', block)) if k == "cover-rollover"), None)
        normal = next((biggest(i) for i, k in zip(imgs, re.findall(r'class="cover (cover-\w+)', block)) if k == "cover-normal"), None)
        res.append({"href": href, "title": html.unescape(title.group(1)) if title else href, "cover": normal, "rollover": roll})
    return res

home = get(BASE + "/work")
projects = covers(home)
cats = {}
for name, path in [("ADS", "/copie-de-fiction"), ("FICTION", "/copie-de-work")]:
    for c in covers(get(BASE + path)):
        cats.setdefault(c["href"], []).append(name)

rows = []
for n, p in enumerate(projects, 1):
    name = re.sub(r"[^\w]+", "_", p["title"]).strip("_").upper()
    folder = os.path.join(OUT, f"{n:02d}_{name}")
    os.makedirs(folder, exist_ok=True)
    page = get(BASE + p["href"])
    main = page[page.find("<main"):page.find("</main>")]
    start = main.find('id="project-modules"')
    modules = main[main.find(">", start) + 1:main.find('<section class="back-to-top"')]

    videos = []
    for src in re.findall(r'<iframe[^>]+src="([^"]+)"', modules):
        src = html.unescape(src)
        if src.startswith("//"):
            src = "https:" + src
        info = {"embed": src}
        vm = re.search(r"player\.vimeo\.com/video/(\d+)(?:\?h=(\w+))?", src)
        yt = re.search(r"youtube(?:-nocookie)?\.com/embed/([\w-]+)", src)
        if vm:
            page_url = f"https://vimeo.com/{vm.group(1)}" + (f"/{vm.group(2)}" if vm.group(2) else "")
            info["url"] = page_url
            try:
                o = json.loads(get("https://vimeo.com/api/oembed.json?url=" + urllib.request.quote(page_url, safe=""), headers={"Referer": BASE + "/"}))
                info.update({k: o.get(k) for k in ("title", "duration", "upload_date", "author_name", "thumbnail_url", "description")})
            except Exception as e:
                info["oembed_error"] = str(e)
        elif yt:
            info["url"] = f"https://www.youtube.com/watch?v={yt.group(1)}"
        videos.append(info)

    native = [html.unescape(v) for v in re.findall(r'<source[^>]+src="([^"]+)"', modules)]
    imgs = [biggest(t) for t in re.findall(r"<img[^>]+>", modules, flags=re.S)]
    imgs = [u for u in dict.fromkeys(imgs) if u]

    if p["cover"]:
        save(p["cover"], os.path.join(folder, "cover." + ext(p["cover"])))
    if p["rollover"]:
        save(p["rollover"], os.path.join(folder, "cover_rollover." + ext(p["rollover"])))
    for i, u in enumerate(imgs, 1):
        save(u, os.path.join(folder, f"image_{i:02d}.{ext(u)}"))
    for i, u in enumerate(native, 1):
        save(u, os.path.join(folder, f"native_video_{i:02d}.{ext(u)}"))
    for i, v in enumerate(videos, 1):
        if v.get("thumbnail_url"):
            save(v["thumbnail_url"], os.path.join(folder, f"video_{i:02d}_thumbnail.jpg"))

    text = text_of(modules)
    with open(os.path.join(folder, "INFO.txt"), "w") as f:
        f.write(f"{p['title']}\n")
        f.write(f"Page : {BASE}{p['href']}\n")
        f.write(f"Categorie sur le site : {', '.join(cats.get(p['href'], [])) or 'aucune (seulement ALL)'}\n")
        f.write(f"Position dans la grille ALL : {n}\n\n")
        for i, v in enumerate(videos, 1):
            f.write(f"VIDEO {i}\n")
            for k in ("url", "title", "duration", "upload_date", "author_name", "description", "embed", "oembed_error"):
                if v.get(k) not in (None, ""):
                    val = f"{v[k]} s" if k == "duration" else v[k]
                    f.write(f"  {k} : {val}\n")
            f.write("\n")
        f.write(f"Images de la page : {len(imgs)} | Videos natives : {len(native)}\n\n")
        f.write("TEXTE DE LA PAGE\n\n" + (text or "(aucun texte)") + "\n")
    with open(os.path.join(folder, "videos.json"), "w") as f:
        json.dump(videos, f, ensure_ascii=False, indent=1)

    rows.append({"n": n, "titre": p["title"], "page": BASE + p["href"],
                 "categorie": ", ".join(cats.get(p["href"], [])),
                 "videos": " | ".join(v.get("url", v["embed"]) for v in videos),
                 "duree_s": " | ".join(str(v.get("duration", "")) for v in videos),
                 "images": len(imgs), "dossier": os.path.basename(folder)})
    print(n, p["title"], "| videos", len(videos), "| images", len(imgs), "| native", len(native))

with open(os.path.join(OUT, "PROJETS.csv"), "w", newline="") as f:
    w = csv.DictWriter(f, fieldnames=list(rows[0]))
    w.writeheader()
    w.writerows(rows)

about = get(BASE + "/about-1")
amain = about[about.find("<main"):about.find("</main>")]
for i, t in enumerate(re.findall(r"<img[^>]+>", amain, flags=re.S), 1):
    u = biggest(t)
    if u:
        save(u, os.path.join(OUT, f"00_about_image_{i:02d}.{ext(u)}"))
with open(os.path.join(OUT, "00_ABOUT.txt"), "w") as f:
    f.write("ABOUT\nPage : " + BASE + "/about-1\n\n" + text_of(amain) + "\n")
print("done", len(rows))
