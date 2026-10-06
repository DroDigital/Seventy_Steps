#!/usr/bin/env python3
"""Four walk frames from a generated 2x2 sheet on flat magenta, brought to the pack's 64x64 frames.

  python3 fromsheet.py <sheet.png> <pack folder> <creature key> <side> [--dry-run]

Each cell is keyed off the magenta, all four scaled by one factor so the creature stands as tall as
its own idle_0 (its bob between frames kept), each pixel the commonest colour of its block, then
every colour snapped to the creature's own palette (its idle and old move frames). The frames stand
on the idle's ground line, centred where the old walk was. move_0..move_3 are written and listed in
the gallery; what they replace is kept under walk4_backup/."""
import json, os, re, shutil, sys
import numpy as np
from PIL import Image

PAGES = ('previews/library.html', 'library.html', 'index.html')
ALPHA = 40


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


def _mode_downscale(rgb, m, scale, out_h, out_w):
    """Each target pixel takes the commonest opaque colour of its source block (or stays clear)."""
    res = np.zeros((out_h, out_w, 4), np.uint8)
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
    return res


def _snap(frame, palette):
    m = frame[..., 3] > 0
    px = frame[m][:, :3].astype(int)
    d = ((px[:, None, :] - palette[None, :, :]) ** 2).sum(-1)
    frame[m, :3] = palette[d.argmin(1)]
    return frame


def frames_from_sheet(sheet, idle, olds):
    """Four 64x64 RGBA frames from the sheet, fitted to the idle frame and the old walk."""
    im = np.asarray(idle)
    im_m = im[..., 3] > ALPHA
    iy0, iy1, ix0, ix1 = _bbox(im_m)
    pal = np.unique(np.concatenate([o[o[..., 3] > ALPHA][:, :3] for o in [im] + olds]), axis=0).astype(int)
    cells = key_cells(sheet)
    boxes = [_bbox(m) for _, m in cells]
    src_h = max(b[1] - b[0] + 1 for b in boxes)
    scale = (iy1 - iy0 + 1) / src_h
    old_cx = np.mean([np.nonzero(o[..., 3] > ALPHA)[1].mean() for o in olds])
    ground = max(b[1] for b in boxes)
    out = []
    for (rgb, m), (y0, y1, x0, x1) in zip(cells, boxes):
        sub_rgb, sub_m = rgb[:ground + 1, x0:x1 + 1], m[:ground + 1, x0:x1 + 1]
        top = min(b[0] for b in boxes)
        sub_rgb, sub_m = sub_rgb[top:], sub_m[top:]
        oh, ow = int(round(sub_m.shape[0] * scale)), int(round(sub_m.shape[1] * scale))
        small = _snap(_mode_downscale(sub_rgb, sub_m, scale, oh, ow), pal)
        canvas = np.zeros((64, 64, 4), np.uint8)
        sm = small[..., 3] > 0
        cx = np.nonzero(sm)[1].mean()
        ox = int(round(old_cx - cx))
        oy = iy1 - (oh - 1)
        for y in range(oh):
            for x in range(ow):
                if sm[y, x] and 0 <= y + oy < 64 and 0 <= x + ox < 64:
                    canvas[y + oy, x + ox] = small[y, x]
        out.append(canvas)
    return out


def _rel(path):
    return os.path.normpath(path[3:] if path.startswith('../') else path)


def main(sheet_path, root, key, side, dry):
    page = next(p for p in PAGES if os.path.exists(os.path.join(root, p)))
    html = open(os.path.join(root, page), encoding='utf-8').read()
    m = re.search(r'(<script id="pack-data"[^>]*>)(.*?)(</script>)', html, re.S)
    data = json.loads(m.group(2))
    item = next(i for i in data['items'] if i['key'] == key)
    fr = item['frames'][side]
    load = lambda p: np.asarray(Image.open(os.path.join(root, _rel(p))).convert('RGBA'))
    olds = [load(fr[k]) for k in sorted(fr) if k.startswith('move_')]
    new = frames_from_sheet(Image.open(sheet_path), load(fr['idle_0']), olds)
    prefix = fr['move_0'].rsplit('/', 1)[0]
    if dry:
        return new
    for i, f in enumerate(new):
        name = f'move_{i}'
        dest = os.path.join(root, _rel(prefix + f'/{name}.png'))
        if os.path.exists(dest):
            back = os.path.join(root, 'walk4_backup', os.path.dirname(_rel(prefix + '/x')))
            os.makedirs(back, exist_ok=True)
            if not os.path.exists(os.path.join(back, f'{name}.png')):
                shutil.copy2(dest, os.path.join(back, f'{name}.png'))
        Image.fromarray(f, 'RGBA').save(dest)
        fr[name] = prefix + f'/{name}.png'
    html = html[:m.start(2)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + html[m.end(2):]
    open(os.path.join(root, page), 'w', encoding='utf-8').write(html)
    print(f'{key} {side}: move_0..move_3 written')
    return new


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--dry-run']
    if len(args) != 4:
        sys.exit(__doc__)
    main(*args, dry='--dry-run' in sys.argv)
