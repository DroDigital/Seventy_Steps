"""A creature sprite pack as the outside library lays it out: a gallery page (`previews/library.html`,
or a site's `index.html`) whose `pack-data` script lists every creature, its renderer, its
directions and their frames, by paths relative to the gallery. Loads it from a folder or a URL;
`fetch` copies a published pack's idle and move frames (or every file it lists) and its page to a
folder first."""
import json, os, re, subprocess, urllib.parse
from concurrent.futures import ThreadPoolExecutor
import numpy as np
from PIL import Image

PAGES = ('previews/library.html', 'library.html', 'index.html')
DIRECTIONS = ('front', 'left', 'back', 'right')


def _pack_data(html):
    m = re.search(r'<script id="pack-data"[^>]*>(.*?)</script>', html, re.S)
    if not m:
        raise SystemExit('no pack-data script on the gallery page')
    return json.loads(m.group(1))


def _rel(path):
    """A gallery path ('../sprites/x.png') as a path from the pack's root."""
    return os.path.normpath(path.replace('../', '', 1) if path.startswith('../') else path)


class Pack:
    def __init__(self, root):
        self.root = root
        page = next((p for p in PAGES if os.path.exists(os.path.join(root, p))), None)
        if page is None:
            raise SystemExit(f'no gallery page in {root} (looked for {", ".join(PAGES)})')
        self.page = page
        with open(os.path.join(root, page), encoding='utf-8') as f:
            self.data = _pack_data(f.read())
        self.items = self.data['items']
        self._cache = {}

    def sprites(self):
        """The billboard creatures (the colossi are assemblies, reviewed apart)."""
        return [i for i in self.items if i.get('renderer') == 'sprite']

    def frames(self, item, direction, action):
        """[(name, path)] of one action in one direction, in order; the right of a mirror-safe
        creature is its left, mirrored where it is drawn (as the gallery shows it)."""
        fr = item['frames'].get(direction) or {}
        return sorted(((k, _rel(p)) for k, p in fr.items() if k.startswith(action + '_')),
                      key=lambda kv: int(kv[0].split('_')[1]))

    def image(self, path):
        """The frame as an RGBA array (rows, cols, 4)."""
        if path not in self._cache:
            self._cache[path] = np.asarray(Image.open(os.path.join(self.root, path)).convert('RGBA'))
        return self._cache[path]


def listed(data):
    """Every file the gallery lists (frames, attacks, contact sheets, notes), as gallery paths."""
    if isinstance(data, dict):
        return [p for v in data.values() for p in listed(v)]
    if isinstance(data, list):
        return [p for v in data for p in listed(v)]
    return [data] if isinstance(data, str) and data.startswith('../') else []


def fetch(url, dest, workers=4, everything=False):
    """Copies a published pack to `dest`: its page and every idle and move frame (`everything`: every
    file the page lists, as a hand-over that puts whole folders in the zip needs)."""
    if url.endswith('.html'):
        base = url.rsplit('/', 1)[0] + '/'
    else:
        base = url if url.endswith('/') else url + '/'
    os.makedirs(dest, exist_ok=True)
    page = os.path.join(dest, 'index.html')
    _curl(url, page)
    with open(page, encoding='utf-8') as f:
        data = _pack_data(f.read())
    paths = []
    for item in data['items']:
        groups = item['frames'] if item.get('renderer') == 'sprite' else (item.get('movement') or {})
        for fr in groups.values():
            paths += [p for k, p in fr.items() if k.startswith(('idle', 'move'))]
    if everything:
        paths = sorted(set(listed(data['items'])))

    def one(path):
        out = os.path.join(dest, _rel(path))
        if os.path.exists(out) and os.path.getsize(out) > 0:
            return True
        os.makedirs(os.path.dirname(out), exist_ok=True)
        return _curl(urllib.parse.urljoin(base, path), out)
    with ThreadPoolExecutor(workers) as ex:
        got = list(ex.map(one, paths))
    print(f'{sum(got)} of {len(paths)} {"files" if everything else "frames"} in {dest}')


def _curl(url, out):
    r = subprocess.run(['curl', '-sS', '-L', '-A', 'Mozilla/5.0', '-o', out, '-w', '%{http_code}', url],
                       capture_output=True, text=True)
    if r.stdout != '200':
        print(f'{url}: HTTP {r.stdout} {r.stderr.strip()}')
        return False
    return True
