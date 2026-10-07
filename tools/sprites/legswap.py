#!/usr/bin/env python3
"""A walk's second half made from its first by exchanging the legs' shades, for a creature whose near and far
legs are told apart by tone (the near leg light, the far leg dark: docs/SPRITE_QA.md) but whose drawn walk
repeats one contact, the light leg leading in both.

  python3 legswap.py <pack> <key> <side> [--mirror-legs] [--from-second] [--mirror-right] [--dry-run]

move_2 becomes move_0 and move_3 becomes move_1, each with its two legs recoloured below the crotch: the light
leg in the dark leg's shades and the dark leg in the light leg's, rank for rank, so each keeps its own modelling,
and the outline left as it is. In the first contact the light near leg leads; in the second the dark far leg
does, which is the exchange. The legs are the two largest parts that stand on the ground line, in the highest
band above it where they are still apart (an arm that reaches down but not to the ground is left alone). What it
replaces is kept under walk4_backup/; the gallery's list is updated. --mirror-right also writes the two frames,
flipped, to the right set (a mirror-safe creature). --from-second goes the other way: move_0 and move_1 are made
from move_2 and move_3, for a walk whose second contact and passing are the better drawn pair (the far leg leads
there, so the near leg leads in the frames made from them, as the brief has move_0).

--mirror-legs is for many legs alike in tone (a crawler): below the belly, where the legs stand apart, each leg is
mirrored about its own hip instead, so a leg reaching forward reaches back and one pushed back reaches forward:
the other phase of the stride, the outline, height and ground line unchanged."""
import json, os, re, shutil, sys
import numpy as np
from PIL import Image

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from walk4 import PAGES, _components, _lum, _mask, _rel    # noqa: E402

OUTLINE = 40    # pixels this dark are the outline: kept


def legs(a, facing='left'):
    """(labels, (one, two)): the two legs, below where they join, or None. They are the two largest parts of the
    figure's lower band behind its front quarter (where an arm reaches down), one of them on the ground line;
    the band grows upward, following both, until they meet."""
    m = _mask(a)
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max(), xs.min(), xs.max()
    reach = 0.25 * (x1 - x0)
    found, seeds = None, None
    for cut in range(y1 - 2, y0 + (y1 - y0) // 3, -1):
        band = np.zeros_like(m)
        band[cut:] = m[cut:]
        lab, sizes = _components(band)
        if seeds:                                  # follow the two legs up until they join
            one, two = (lab[s] for s in seeds)
            if one == two:
                break
            found = lab, (one, two)
            continue
        parts = []
        for i, s in enumerate(sizes):
            py, px = np.nonzero(lab == i + 1)
            front = px.mean() < x0 + reach if facing == 'left' else px.mean() > x1 - reach
            if s >= 8 and not front:
                parts.append((s, i + 1, py.max(), (py[-1], px[-1])))
        parts.sort(reverse=True)
        if len(parts) >= 2 and max(parts[0][2], parts[1][2]) >= y1 - 2:
            found, seeds = (lab, (parts[0][1], parts[1][1])), (parts[0][3], parts[1][3])
    return found


def swap(a, facing='left'):
    """The frame `a` with its two legs' shades exchanged below where they join, or None where they cannot be found."""
    found = legs(a, facing)
    if not found:
        return None
    lab, (one, two) = found
    res = a.copy()
    groups = []
    for lid in (one, two):
        ys, xs = np.nonzero(lab == lid)
        lum = _lum(a[ys, xs][:, :3])
        keep = lum >= OUTLINE
        order = np.argsort(lum[keep], kind='stable')
        groups.append((ys[keep][order], xs[keep][order]))
    (ya, xa), (yb, xb) = groups
    if len(ya) < 4 or len(yb) < 4:
        return None
    for (ys, xs), (ty, tx) in (((ya, xa), (yb, xb)), ((yb, xb), (ya, xa))):
        pick = np.round(np.linspace(0, len(ty) - 1, len(ys))).astype(int)   # the same rank in the other leg
        res[ys, xs, :3] = a[ty[pick], tx[pick], :3]
    return res


def mirrored(a, facing='left'):
    """The frame `a` with each leg, below the belly, mirrored about its hip; None without a belly to part them."""
    m = _mask(a)
    ys, xs = np.nonzero(m)
    y1, width = ys.max(), xs.max() - xs.min() + 1

    def widest(row):
        d = np.diff(np.concatenate([[0], row.astype(int), [0]]))
        return int((np.nonzero(d == -1)[0] - np.nonzero(d == 1)[0]).max()) if row.any() else 0
    belly = next((y for y in range(y1, ys.min(), -1) if widest(m[y]) > 0.45 * width), None)
    if belly is None or y1 - belly < 5:
        return None
    band = np.zeros_like(m)
    band[belly + 1:] = m[belly + 1:]
    lab, sizes = _components(band)
    res = a.copy()
    res[belly + 1:] = 0
    layers = []
    for i in range(len(sizes)):
        py, px = np.nonzero(lab == i + 1)
        hip = px[py == py.min()].mean()
        nx = np.round(2 * hip - px).astype(int)
        ok = (nx >= 0) & (nx < a.shape[1])
        layer = np.zeros_like(a)
        layer[py[ok], nx[ok]] = a[py[ok], px[ok]]
        layers.append((_lum(a[py, px][:, :3]).mean(), i, layer))
    for _, _, layer in sorted(layers):      # the darker (far) legs first, the lighter (near) over them
        sel = layer[..., 3] > 0
        res[sel] = layer[sel]
    return res


def _set(root, fr, name, frame, flip=False):
    prefix = fr['move_0'].rsplit('/', 1)[0]
    dest = os.path.join(root, _rel(prefix + f'/{name}.png'))
    if os.path.exists(dest):
        back = os.path.join(root, 'walk4_backup', os.path.dirname(_rel(prefix + '/x')))
        os.makedirs(back, exist_ok=True)
        if not os.path.exists(os.path.join(back, f'{name}.png')):
            shutil.copy2(dest, os.path.join(back, f'{name}.png'))
    Image.fromarray(np.ascontiguousarray(frame[:, ::-1]) if flip else frame, 'RGBA').save(dest)
    fr[name] = prefix + f'/{name}.png'


def main(root, key, side, mirror, dry, mirror_legs=False, from_second=False):
    page = next(p for p in PAGES if os.path.exists(os.path.join(root, p)))
    html = open(os.path.join(root, page), encoding='utf-8').read()
    m = re.search(r'(<script id="pack-data"[^>]*>)(.*?)(</script>)', html, re.S)
    data = json.loads(m.group(2))
    item = next(i for i in data['items'] if i['key'] == key)
    fr = item['frames'][side]
    load = lambda n: np.asarray(Image.open(os.path.join(root, _rel(fr[n]))).convert('RGBA')).copy()
    make = mirrored if mirror_legs else swap
    first, second = ('move_0', 'move_1'), ('move_2', 'move_3')
    src, dst = (second, first) if from_second else (first, second)
    made = [make(load(src[0]), side), make(load(src[1]), side)]
    if any(f is None for f in made):
        sys.exit(f'{key} {side}: its two legs cannot be told apart in {src[0]} and {src[1]}')
    if dry:
        return made
    for name, frame in zip(dst, made):
        _set(root, fr, name, frame)
        if mirror:
            _set(root, item['frames']['right' if side == 'left' else 'left'], name, frame, flip=True)
    html = html[:m.start(2)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + html[m.end(2):]
    open(os.path.join(root, page), 'w', encoding='utf-8').write(html)
    print(f'{key} {side}: {dst[0]}, {dst[1]} made from {src[0]}, {src[1]} with the legs exchanged'
          + (' (and flipped into the other side)' if mirror else ''))
    return made


if __name__ == '__main__':
    flags = {a for a in sys.argv[1:] if a.startswith('--')}
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 3 or flags - {'--mirror-right', '--dry-run', '--mirror-legs', '--from-second'}:
        sys.exit(__doc__)
    main(*args, mirror='--mirror-right' in flags, dry='--dry-run' in flags, mirror_legs='--mirror-legs' in flags,
         from_second='--from-second' in flags)
