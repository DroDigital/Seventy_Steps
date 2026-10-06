#!/usr/bin/env python3
"""Four-frame profile walks from the two-frame ones, made on the pack itself (docs/SPRITE_QA.md).

  python3 walk4.py <pack folder> [--dry-run]

The two old frames are the contacts: move_0 stays, move_1 becomes move_2. After each a passing pose
is made from its pixels: the legs swung in under the hip, the trailing leg lifted, the near (lighter)
leg drawn over the far, the standing foot on the ground. Nothing is drawn anew, so the arms keep the
contact's swing. Only the two-legged creatures in WALKERS, whose legs it can tell apart (checked by
eye on the v1 pack), and only a side that has no move_2 yet: a walk already redrawn is left alone.
The frames it replaces are kept under walk4_backup/; the gallery's frame list is updated.
Needs `pip install pillow numpy`; it is standalone, so it can be copied next to the pack."""
import json, os, re, shutil, sys
from collections import deque
import numpy as np
from PIL import Image

WALKERS = {
    'innsmouth_hybrid': ('left', 'right'), 'innsmouth_hybrid#eldritch': ('left', 'right'),
    'kn_yan_dweller': ('left',), 'reanimated_corpse': ('left',), 'martense_degenerate': ('right',),
    'star_spawn': ('left',), 'wilbur_whateley': ('left',), 'ephraim_waite': ('left',),
    'lilith': ('left', 'right'), 'dr_munoz': ('left',), 'medusa_gorgon': ('left',),
    'hypnos': ('left', 'right'), 'great_ones': ('left', 'right'),
}
PAGES = ('previews/library.html', 'library.html', 'index.html')

ALPHA = 40


def _mask(a):
    return a[..., 3] > ALPHA


def _lum(c):
    c = c.astype(float)
    return 0.299 * c[..., 0] + 0.587 * c[..., 1] + 0.114 * c[..., 2]


def _components(m):
    lab = np.zeros(m.shape, int)
    sizes = []
    for y, x in zip(*np.nonzero(m)):
        if lab[y, x]:
            continue
        n = len(sizes) + 1
        q = deque([(y, x)])
        lab[y, x] = n
        s = 0
        while q:
            cy, cx = q.popleft()
            s += 1
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = cy + dy, cx + dx
                if 0 <= yy < m.shape[0] and 0 <= xx < m.shape[1] and m[yy, xx] and not lab[yy, xx]:
                    lab[yy, xx] = n
                    q.append((yy, xx))
        sizes.append(s)
    return lab, sizes


def legs(a):
    """(crotch row, labels, (front id, back id)) when two legs stand apart below the hip, else None.
    `front` is the leg on the side the figure faces (the smaller x for a left view)."""
    m = _mask(a)
    ys, xs = np.nonzero(m)
    y0, y1 = ys.min(), ys.max()
    h = y1 - y0 + 1

    def runs(row):
        d = np.diff(np.concatenate([[0], row.astype(int), [0]]))
        return int((d == 1).sum())
    crotch = None
    for y in range(y1, y0 + int(h * 0.5), -1):
        if runs(m[y]) >= 2:
            crotch = y
        elif crotch is not None and y < y1 - 2:
            break
    if crotch is None or y1 - crotch < 5:
        return None
    band = np.zeros_like(m)
    band[crotch:y1 + 1] = m[crotch:y1 + 1]
    lab, sizes = _components(band)
    big = sorted((i + 1 for i, s in enumerate(sizes) if s >= 8), key=lambda i: -sizes[i - 1])[:2]
    if len(big) < 2 or sizes[big[1] - 1] < 0.35 * sizes[big[0] - 1]:
        return None
    for i in big:   # both legs reach the ground
        if np.nonzero(lab == i)[0].max() < y1 - 2:
            return None
    big.sort(key=lambda i: np.nonzero(lab == i)[1].mean())
    return crotch, lab, (big[0], big[1])


def _rotate(a, sel, pivot, ang, lift):
    h, w = sel.shape
    py, px = pivot
    ca, sa = np.cos(ang), np.sin(ang)
    ys, xs = np.mgrid[0:h, 0:w]
    ry, rx = ys - py + lift, xs - px
    sy = np.round(py + ca * ry + sa * rx).astype(int)
    sx = np.round(px - sa * ry + ca * rx).astype(int)
    ok = (sy >= 0) & (sy < h) & (sx >= 0) & (sx < w)
    take = np.zeros((h, w), bool)
    take[ok] = sel[sy[ok], sx[ok]]
    out = np.zeros_like(a)
    out[take] = a[sy[take], sx[take]]
    return out


def passing(a, facing='left'):
    """The passing pose after the contact `a`, or None where its legs cannot be told apart."""
    found = legs(a)
    if not found:
        return None
    crotch, lab, (fid, bid) = found
    if facing == 'right':
        fid, bid = bid, fid
    res = a.copy()
    res[(lab == fid) | (lab == bid)] = 0
    layers = {}
    for lid, lift in ((fid, 0), (bid, 2)):      # the trailing leg swings through, foot raised
        sel = lab == lid
        ys, xs = np.nonzero(sel)
        top = ys.min()
        topx = xs[ys <= top + 1].mean()
        botx = xs[ys >= ys.max() - 1].mean()
        lean = np.arctan2(botx - topx, ys.max() - top)
        layers[lid] = _rotate(a, sel, (top, topx), -lean * 0.85, lift)
    near = max((fid, bid), key=lambda i: _lum(a[lab == i][:, :3]).mean())
    for lid in sorted(layers, key=lambda i: i == near):   # far first, near over it
        m = _mask(layers[lid])
        res[m] = layers[lid][m]
    hip = _mask(a) & ~_mask(res)                           # mend the hip where a leg left it
    hip[crotch + 3:] = False
    res[hip] = a[hip]
    # the standing foot back on the ground: a leg swung upright reaches lower than it leaned, so
    # lifting the frame to the old ground line raises the body as a passing pose does
    drop = int(np.nonzero(_mask(res))[0].max() - np.nonzero(_mask(a))[0].max())
    if drop:
        res = np.roll(res, -drop, axis=0)
        if drop > 0:
            res[-drop:] = 0
        else:
            res[:-drop] = 0
    return res


def _rel(path):
    return os.path.normpath(path[3:] if path.startswith('../') else path)


def _load(root, rel):
    return np.asarray(Image.open(os.path.join(root, rel)).convert('RGBA')).copy()


def main(root, dry):
    page = next((p for p in PAGES if os.path.exists(os.path.join(root, p))), None)
    if page is None:
        sys.exit(f'no gallery page in {root}')
    with open(os.path.join(root, page), encoding='utf-8') as f:
        html = f.read()
    m = re.search(r'(<script id="pack-data"[^>]*>)(.*?)(</script>)', html, re.S)
    data = json.loads(m.group(2))
    made, skipped = [], []
    for item in data['items']:
        for side in WALKERS.get(item['key'], ()):
            frames = item['frames'].get(side) or {}
            name = f"{item['key']} {side}"
            if 'move_2' in frames or 'move_1' not in frames:
                skipped.append(f'{name}: already has a four-frame walk' if 'move_2' in frames else f'{name}: no walk')
                continue
            p0, p1 = _rel(frames['move_0']), _rel(frames['move_1'])
            a0, a1 = _load(root, p0), _load(root, p1)
            b0, b1 = passing(a0, side), passing(a1, side)
            if b0 is None or b1 is None:
                skipped.append(f'{name}: its legs cannot be told apart in these frames')
                continue
            made.append(name)
            if dry:
                continue
            folder = os.path.dirname(p0)
            back = os.path.join(root, 'walk4_backup', folder)
            os.makedirs(back, exist_ok=True)
            shutil.copy2(os.path.join(root, p1), os.path.join(back, 'move_1.png'))
            Image.fromarray(a1, 'RGBA').save(os.path.join(root, folder, 'move_2.png'))
            Image.fromarray(b0, 'RGBA').save(os.path.join(root, p1))
            Image.fromarray(b1, 'RGBA').save(os.path.join(root, folder, 'move_3.png'))
            prefix = frames['move_0'].rsplit('/', 1)[0]
            frames['move_2'] = prefix + '/move_2.png'
            frames['move_3'] = prefix + '/move_3.png'
    if made and not dry:
        text = json.dumps(data, ensure_ascii=False, separators=(',', ':'))
        html = html[:m.start(2)] + text + html[m.end(2):]
        with open(os.path.join(root, page), 'w', encoding='utf-8') as f:
            f.write(html)
    print(('would make' if dry else 'made') + f' {len(made)} four-frame walks: ' + ', '.join(made))
    for line in skipped:
        print('  left alone: ' + line)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--dry-run']
    if len(args) != 1:
        sys.exit(__doc__)
    main(args[0], '--dry-run' in sys.argv)
