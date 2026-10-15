#!/usr/bin/env python3
"""Measure the reviewed creature art for what the renderer adds to it, into src/data/reviewedLook.ts.

Needs `pip install pillow numpy`. Run it when the pack in public/creatures/reviewed changes
(tools/pack_reviewed_assets.py), then `npm run check`.

  eyes   where a form's eyes are, for those that have them, so the renderer can glow about them in the dark
         and look out of a mist (render/creatureViews.ts, as it does for the drawn sprites): found in each
         form's front idle as the small, bright, saturated marks in its head, and kept only for the forms
         named in EYED, which were looked at one by one (a mark that is a tooth, a gem or a spot is not an eye).
  body   how wide the painted body of a boss form is in the three bands its hurt zones are (legs, torso,
         head; data/bossTuning.ts ZONES): the half-width of the mass, as a fraction of the form's height, from
         its front idle. The fight strikes a colossus where the picture shows it (data/assemblyShape.ts).
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / 'public' / 'creatures' / 'reviewed'
OUT = ROOT / 'src' / 'data' / 'reviewedLook.ts'

# Forms whose front idle was looked at and has eyes (or marks that glow like them): the box (x0, y0, x1, y1, in
# pixels) in which the finder looks, or None for the whole head. A mark that is a tooth, a gem, a spot or a
# visor is not an eye, and the finder cannot tell: the others (the Shoggoths' green spots, the Unnamable's
# bone, the Haunter's visor, the Wamp's and the rat swarm's dim amber) were looked at and are left out.
EYED = {
    'black_man': None, 'charles_le_sorcier': (27, 13, 36, 19), 'cthulhu_cultist': None, 'ghoul': None, 'ghoul#eldritch': None,
    'gnoph_keh': None, 'gug': None, 'martense_degenerate': (30, 14, 37, 20), 'medusa_gorgon': None, 'winged_hybrid': None,
}
EYE_WINDOW = 9  # pixels across which a mark is told from what is about it
EYE_MAX = 12  # pixels of a mark, at most
EYE_SPREAD = 0.07  # their spread, at most, as a fraction of the picture's width

LEGS_TOP = 0.34  # the bands of a boss's body, as fractions of its painted height: data/bossTuning.ts ZONES (tests/reviewedLook.test.ts holds them equal)
TORSO_TOP = 0.72
BODY_SHARE = 75  # the percentile of a band's rows' widths taken for its breadth: the mass, not the farthest claw


def frame_pixels(pages, frame):
    page = pages[frame['page']]
    return page[frame['y']:frame['y'] + frame['height'], frame['x']:frame['x'] + frame['width']].astype(float)


def windows(arr, size):
    pad = size // 2
    return np.lib.stride_tricks.sliding_window_view(np.pad(arr, ((pad, pad), (pad, pad), (0, 0)), mode='edge'), (size, size, arr.shape[2]))[:, :, 0]


def marks(mask):
    """The 8-connected groups of set pixels in `mask`, each a list of (y, x)."""
    seen = np.zeros_like(mask, bool)
    out = []
    for y, x in zip(*np.nonzero(mask)):
        if seen[y, x]:
            continue
        stack, group = [(y, x)], []
        seen[y, x] = True
        while stack:
            cy, cx = stack.pop()
            group.append((cy, cx))
            for dy in (-1, 0, 1):
                for dx in (-1, 0, 1):
                    ny, nx = cy + dy, cx + dx
                    if 0 <= ny < mask.shape[0] and 0 <= nx < mask.shape[1] and mask[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        stack.append((ny, nx))
        out.append(group)
    return out


def find_eyes(px, bounds, box=None):
    """(x, y, radius, r, g, b) of the eye marks of a frame: x, y, radius as fractions of its width and height; None if it has none."""
    rgb = px[..., :3] / 255
    solid = px[..., 3] > 200
    x0, y0, x1, y1 = bounds
    around = windows(np.concatenate([rgb, solid[..., None].astype(float)], -1), EYE_WINDOW)
    has = around[..., 3] > 0.5
    mean = (around[..., :3] * has[..., None]).sum((2, 3)) / np.maximum(has.sum((2, 3)), 1)[..., None]
    weights = np.array([0.2126, 0.7152, 0.0722])
    stands_out = np.linalg.norm(rgb - mean, axis=-1) > 0.32
    brighter = (rgb @ weights - mean @ weights) > 0.14
    saturated = (rgb.max(-1) - rgb.min(-1)) > 0.45
    head = np.arange(px.shape[0])[:, None] < y0 + (y1 - y0) * 0.55
    if box:
        within = np.zeros(px.shape[:2], bool)
        within[box[1]:box[3], box[0]:box[2]] = True
        head = within
    found = [g for g in marks(solid & head & stands_out & (brighter | saturated)) if len(g) <= EYE_MAX]
    if not found:
        return None
    found.sort(key=lambda g: -np.mean([np.linalg.norm(rgb[y, x] - mean[y, x]) for y, x in g]) * len(g) ** 0.5)
    chosen = found[0]
    row = np.mean([y for y, _ in chosen])
    for g in found[1:]:  # its pair, level with it
        if abs(np.mean([y for y, _ in g]) - row) <= 3:
            chosen = chosen + g
            break
    ys, xs = np.array([y for y, _ in chosen]), np.array([x for _, x in chosen])
    cy, cx = ys.mean(), xs.mean()
    spread = min(float(np.hypot(xs - cx, ys - cy).max()) + 1, px.shape[1] * EYE_SPREAD)
    colour = px[ys, xs, :3].mean(0) / 255
    return (cx / px.shape[1], cy / px.shape[0], spread / px.shape[1], *[float(c) for c in colour])


def body_bands(px, bounds):
    """Half-widths of the painted mass in the legs, torso and head bands, as fractions of the painted height."""
    solid = px[..., 3] > 128
    x0, y0, x1, y1 = bounds
    height = y1 - y0
    bands = []
    for lo, hi in ((0, LEGS_TOP), (LEGS_TOP, TORSO_TOP), (TORSO_TOP, 1)):
        widths = [solid[y].sum() for y in range(int(y1 - hi * height), int(y1 - lo * height)) if solid[y].any()]
        bands.append(round(float(np.percentile(widths, BODY_SHARE)) / 2 / height, 3) if widths else 0.0)
    return bands


def main():
    manifest = json.loads((PACK / 'index.json').read_text())
    frames = manifest['frames']
    pages = [np.array(Image.open(PACK / p['file']).convert('RGBA')) for p in manifest['pages']]
    eyes, body = {}, {}
    for key, entity in manifest['entities'].items():
        front = frames[entity['directions']['front']['actions']['idle'][0]]
        px = frame_pixels(pages, front)
        if entity['assetGroup'] == 'bosses':
            body[key] = body_bands(px, front['bounds'])
        if key in EYED:
            found = find_eyes(px, front['bounds'], EYED[key])
            if not found:
                sys.exit(f'{key} is named in EYED but its eyes were not found')
            eyes[key] = [round(v, 3) for v in found]
    unknown = [key for key in EYED if key not in manifest['entities']]
    if unknown:
        sys.exit(f'EYED names forms the pack does not hold: {unknown}')
    lines = [
        '/** Generated by tools/reviewed_look.py from public/creatures/reviewed: do not edit. What the renderer adds to the reviewed art. */',
        '',
        "/** By form: where its eyes are in its front view (across and down as fractions of the picture, their spread as a fraction of its width) and their colour (0..1). */",
        'export const REVIEWED_EYES: Readonly<Record<string, readonly [x: number, y: number, spread: number, r: number, g: number, b: number]>> = {',
    ]
    lines += [f"  '{key}': [{', '.join(str(v) for v in value)}]," for key, value in sorted(eyes.items())]
    lines += [
        '};',
        '',
        "/** By boss form: the painted body's half-width in its legs, torso and head bands, as fractions of its height (what the fight's hurt zones are never narrower than: data/assemblyShape.ts). */",
        'export const REVIEWED_BODY: Readonly<Record<string, readonly [legs: number, torso: number, head: number]>> = {',
    ]
    lines += [f"  '{key}': [{', '.join(str(v) for v in value)}]," for key, value in sorted(body.items())]
    lines += ['};', '']
    OUT.write_text('\n'.join(lines))
    print(f'{OUT.relative_to(ROOT)}: {len(eyes)} with eyes, {len(body)} boss bodies measured', file=sys.stderr)


if __name__ == '__main__':
    main()
