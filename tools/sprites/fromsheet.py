#!/usr/bin/env python3
"""Four walk frames from a generated 2x2 sheet on flat magenta, brought to the pack's 64x64 frames.

  python3 fromsheet.py <sheet.png> <pack folder> <creature key> <side> [--mirror-right] [--dry-run]

Each cell is keyed off the magenta, all four scaled by one factor so the tallest stands as tall as
its own idle_0, each pixel the commonest colour of its block, then every colour snapped to the
creature's own palette (its idle and old move frames). A model never keeps its figure in the same
place in every cell, so each frame is set by its own body, not by where it was drawn: its lowest
pixel on the idle's ground line, its upper body (the audit's measure, the top 40% of the silhouette)
over the idle's. move_0..move_3 are written and listed in the gallery; what they replace is kept
under walk4_backup/. --mirror-right also writes the four frames, flipped, to the creature's right
set (the right of a mirror-safe creature is its left, flipped)."""
import json, os, re, shutil, sys
import numpy as np
from PIL import Image

PAGES = ('previews/library.html', 'library.html', 'index.html')
ALPHA = 40
RARE_SHARE = 0.004   # a palette colour under this share of the creature's pixels is an accent
RARE_NEAR = 36       # and takes only the pixels within this RGB distance of it
GLOW_SAT = 0.55      # bright (over 130) and this saturated, a colour is a glow
GLOW_NEAR = 90       # an accent that is a glow takes pixels within this distance
BAND = 0.15          # and only at the heights (of the figure) where the creature's own frames hold one, give or take this


def key_cells(sheet):
    a = np.asarray(sheet.convert('RGB')).astype(int)
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    magenta = (r > 170) & (b > 170) & (g < 110) & (np.abs(r - b) < 70)
    h, w = magenta.shape
    cells = []
    for cy in (0, 1):
        for cx in (0, 1):
            sl = (slice(cy * h // 2, (cy + 1) * h // 2), slice(cx * w // 2, (cx + 1) * w // 2))
            cells.append((a[sl], ~magenta[sl]))
    return cells


def _bbox(m):
    ys, xs = np.nonzero(m)
    return ys.min(), ys.max(), xs.min(), xs.max()


def _lum(px):
    return 0.299 * px[:, 0] + 0.587 * px[:, 1] + 0.114 * px[:, 2]


def _torso_x(m):
    """Where the upper body stands, as the audit measures it: the mean column of the silhouette's top 40%."""
    ys, _ = np.nonzero(m)
    h = ys.max() - ys.min() + 1
    return np.nonzero(m[ys.min():ys.min() + max(2, int(h * 0.4))])[1].mean()


def _mode_downscale(rgb, m, scale, out_h, out_w, accents, band):
    """Each target pixel takes the commonest opaque colour of its source block (or stays clear), unless the
    block holds some of the creature's own glowing accent colour (`accents`), which then wins. Returns the
    picture and which pixels were taken that way. It counts when it is a blob at least three pixels thick
    (an eye in profile sits on the very edge of the face) or well inside the figure: the thin fringe the
    magenta ground leaves along an edge is neither. It counts only within `band`, the heights (shares of
    the figure, from its top) where the creature's own frames carry an accent: a pink hem is no eye."""
    res = np.zeros((out_h, out_w, 4), np.uint8)
    glowed = np.zeros((out_h, out_w), bool)
    ordinary = np.zeros((out_h, out_w, 3), np.uint8)    # what a glowing pixel would be, were it not
    if len(accents):
        near = (((rgb[:, :, None, :] - accents[None, None]) ** 2).sum(-1) <= GLOW_NEAR ** 2).any(-1) & m
        blob = _interior(near, 1) | (near & _interior(m, 4))
    for y in range(out_h):
        y0, y1 = int(y / scale), max(int(y / scale) + 1, int((y + 1) / scale))
        for x in range(out_w):
            x0, x1 = int(x / scale), max(int(x / scale) + 1, int((x + 1) / scale))
            bm = m[y0:y1, x0:x1]
            if bm.size == 0 or bm.mean() < 0.5:
                continue
            px = rgb[y0:y1, x0:x1][bm]
            q = (px // 8).astype(int)
            codes = q[:, 0] * 1024 + q[:, 1] * 32 + q[:, 2]
            vals, counts = np.unique(codes, return_counts=True)
            sel = px[codes == vals[counts.argmax()]].mean(0)
            res[y, x, :3] = sel
            res[y, x, 3] = 255
            if len(accents) and band[0] <= (y + 0.5) / out_h <= band[1] and blob[y0:y1, x0:x1][bm].sum() >= 2:
                ordinary[y, x] = sel
                res[y, x, :3] = px[near[y0:y1, x0:x1][bm]].mean(0)
                glowed[y, x] = True
    if len(accents):       # lone accent pixels on the edge of the figure are fringe, not an eye...
        pad = np.pad(glowed, 1)
        others = sum(pad[1 + dy:1 + dy + out_h, 1 + dx:1 + dx + out_w]
                     for dy in (-1, 0, 1) for dx in (-1, 0, 1) if dy or dx)
        solid = res[..., 3] > 0
        lone = glowed & (others == 0) & solid & ~_interior(solid, 1)
        if lone.sum() < glowed.sum() or lone.sum() > 2:   # ...unless they are all the frame has: that is its eye
            for y, x in zip(*np.nonzero(lone)):
                res[y, x, :3], glowed[y, x] = ordinary[y, x], False
    return res, glowed


def _interior(m, r):
    """The pixels of mask m that lie more than r steps inside it."""
    e = np.pad(m, r)
    for _ in range(r):
        n = e.copy()
        n[1:] &= e[:-1]
        n[:-1] &= e[1:]
        n[:, 1:] &= e[:, :-1]
        n[:, :-1] &= e[:, 1:]
        e = n
    return e[r:-r, r:-r]


def _glows(px):
    """Which colours (rows of px) are bright and saturated: a glowing eye, a claw tip."""
    top, low = px.max(1), px.min(1)
    return (top >= 130) & (top - low >= GLOW_SAT * np.maximum(top, 1))


def _accent_band(frames, accents):
    """The heights, as shares of the figure from its top, at which these frames hold an accent colour,
    widened by BAND: where an eye or a claw tip may be drawn, and nowhere else."""
    rels = []
    for f in frames:
        m = f[..., 3] > ALPHA
        ys = np.nonzero(m)[0]
        hit = m & (f[..., :3].astype(int)[:, :, None, :] == accents[None, None]).all(-1).any(-1)
        rels += list((np.nonzero(hit)[0] - ys.min()) / (ys.max() - ys.min() + 1))
    return (min(rels) - BAND, max(rels) + BAND) if rels else (0.0, 1.0)


def _snap(frame, palette, rare, glowed):
    """Every colour to the nearest of the creature's own. A rare one is for the pixels that really are that
    colour: a glowing accent within reach of its glow for a pixel taken as an accent (`glowed`), any other
    rare colour only for a pixel nearly it. It is no fallback for a lighter or warmer shade of the body."""
    m = frame[..., 3] > 0
    px = frame[m][:, :3].astype(int)
    d = ((px[:, None, :] - palette[None, :, :]) ** 2).sum(-1)
    pick = np.nonzero(rare)[0]
    reach = np.where(_glows(palette)[pick][None, :] & glowed[m][:, None], GLOW_NEAR, RARE_NEAR)
    d[:, pick] = np.where(d[:, pick] > reach ** 2, 1 << 30, d[:, pick])
    frame[m, :3] = palette[d.argmin(1)]
    return frame


def frames_from_sheet(sheet, idle, olds):
    """Four 64x64 RGBA frames from the sheet, fitted to the idle frame; `olds` lend their colours."""
    im = np.asarray(idle)
    im_m = im[..., 3] > ALPHA
    iy0, iy1, ix0, ix1 = _bbox(im_m)
    pal, uses = np.unique(np.concatenate([o[o[..., 3] > ALPHA][:, :3] for o in [im] + olds]), axis=0, return_counts=True)
    pal, rare = pal.astype(int), uses < RARE_SHARE * uses.sum()
    accents = pal[rare & _glows(pal)]        # its eyes, its claw tips: rare, bright, saturated
    band = _accent_band([im] + olds, accents) if len(accents) else (0.0, 1.0)
    cells = key_cells(sheet)
    boxes = [_bbox(m) for _, m in cells]
    heights = [b[1] - b[0] + 1 for b in boxes]      # one scale for all four: the tallest and the shortest frame
    scale = 2 * (iy1 - iy0 + 1) / (max(heights) + min(heights))     # stand as far above the idle as below it
    idle_x = _torso_x(im_m)
    smalls = []
    for (rgb, m), (y0, y1, x0, x1) in zip(cells, boxes):
        sub_rgb, sub_m = rgb[y0:y1 + 1, x0:x1 + 1], m[y0:y1 + 1, x0:x1 + 1]
        oh, ow = int(round(sub_m.shape[0] * scale)), int(round(sub_m.shape[1] * scale))
        smalls.append(_mode_downscale(sub_rgb, sub_m, scale, oh, ow, accents, band))
    # a model paints lighter than the pixel art it is shown: bring the sheet to the creature's own tone
    # (the mean luminance of its idle and old walk), the same brightness all over, so its look is kept
    own = np.concatenate([o[o[..., 3] > ALPHA][:, :3] for o in [im] + olds]).astype(float)
    drawn = np.concatenate([s[s[..., 3] > 0][:, :3] for s, _ in smalls]).astype(float)
    gain = float(np.clip(_lum(own).mean() / max(1.0, _lum(drawn).mean()), 0.7, 1.3))
    out = []
    for small, glowed in smalls:
        small[..., :3] = np.where(small[..., 3:4] > 0, np.clip(small[..., :3] * gain, 0, 255), 0).astype(np.uint8)
        small = _snap(small, pal, rare, glowed)
        ys, xs = np.nonzero(small[..., 3] > 0)
        ox = int(round(idle_x - _torso_x(small[..., 3] > 0)))
        oy = iy1 - int(ys.max())
        lo, hi = xs.min() + ox, xs.max() + ox
        if lo < 1 or hi > 62:      # a wide stride must not touch the canvas edge: nudge it in, no more than that
            nudge = 1 - lo if lo < 1 else 62 - hi
            print(f'  nudged {nudge:+d} px to clear the canvas edge', file=sys.stderr)
            ox += nudge
        keep = (ys + oy >= 0) & (ys + oy < 64) & (xs + ox >= 0) & (xs + ox < 64)
        if not keep.all():
            print(f'  clipped {int((~keep).sum())} px at the canvas edge', file=sys.stderr)
        canvas = np.zeros((64, 64, 4), np.uint8)
        canvas[ys[keep] + oy, xs[keep] + ox] = small[ys[keep], xs[keep]]
        out.append(canvas)
    return out


def _rel(path):
    return os.path.normpath(path[3:] if path.startswith('../') else path)


def _write(root, item, side, frames, flip=False):
    """move_0..move_3 into the pack at the side's own paths (what they replace goes to walk4_backup/)
    and into the gallery's list."""
    fr = item['frames'][side]
    prefix = fr['move_0'].rsplit('/', 1)[0]
    for i, f in enumerate(frames):
        name = f'move_{i}'
        dest = os.path.join(root, _rel(prefix + f'/{name}.png'))
        if os.path.exists(dest):
            back = os.path.join(root, 'walk4_backup', os.path.dirname(_rel(prefix + '/x')))
            os.makedirs(back, exist_ok=True)
            if not os.path.exists(os.path.join(back, f'{name}.png')):
                shutil.copy2(dest, os.path.join(back, f'{name}.png'))
        Image.fromarray(np.ascontiguousarray(f[:, ::-1]) if flip else f, 'RGBA').save(dest)
        fr[name] = prefix + f'/{name}.png'


def main(sheet_path, root, key, side, dry, mirror):
    page = next(p for p in PAGES if os.path.exists(os.path.join(root, p)))
    html = open(os.path.join(root, page), encoding='utf-8').read()
    m = re.search(r'(<script id="pack-data"[^>]*>)(.*?)(</script>)', html, re.S)
    data = json.loads(m.group(2))
    item = next(i for i in data['items'] if i['key'] == key)
    fr = item['frames'][side]
    other = 'right' if side == 'left' else 'left'
    if mirror and 'move_0' not in (item['frames'].get(other) or {}):
        sys.exit(f'{key} has no {other} set to mirror into')
    load = lambda p: np.asarray(Image.open(os.path.join(root, _rel(p))).convert('RGBA'))
    olds = [load(fr[k]) for k in sorted(fr) if k.startswith('move_')]
    new = frames_from_sheet(Image.open(sheet_path), load(fr['idle_0']), olds)
    if dry:
        return new
    _write(root, item, side, new)
    if mirror:
        _write(root, item, other, new, flip=True)
    html = html[:m.start(2)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + html[m.end(2):]
    open(os.path.join(root, page), 'w', encoding='utf-8').write(html)
    print(f'{key} {side}: move_0..move_3 written' + (f', flipped into {other}' if mirror else ''))
    return new


if __name__ == '__main__':
    flags = {a for a in sys.argv[1:] if a.startswith('--')}
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    if len(args) != 4 or flags - {'--dry-run', '--mirror-right'}:
        sys.exit(__doc__)
    main(*args, dry='--dry-run' in flags, mirror='--mirror-right' in flags)
