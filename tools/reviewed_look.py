#!/usr/bin/env python3
"""Measure the reviewed creature art for what the renderer adds to it, into src/data/reviewedLook.ts.

Needs `pip install pillow numpy`. Run it when the pack in public/creatures/reviewed changes
(tools/pack_reviewed_assets.py), then `npm run check`.

  eyes   where a form's eyes are, for those that have them, so the renderer can glow about them in the dark
         and look out of a mist (render/creatureViews.ts, as it does for the drawn sprites): found in each
         form's front idle as the small, bright, saturated marks in its head, and kept only for the forms
         named in EYED, which were looked at one by one (a mark that is a tooth, a gem or a spot is not an eye).
  glint  the exact colour of the small marks a form's art is lit by (its eyes, a shoggoth's green lamps, a hound's
         glare, a hellish spark): drawn once in the art, in one colour that nothing else in the form has but the
         marks, so the sprite shader can keep the texels of that colour alight in the dark, in every view and
         every frame (render/shaders/sprite.ts). Found as the colour that shows in most of a view's frames, a few
         texels at a time, bright or saturated; for the forms named in GLINTED, which were looked at one by one.
  matter the colour of each form's own flesh, hide, shell or stone (round 78): the mean of the middle half of its
         front idle's texels by brightness, not its outline or its glints. What a blow throws off it, and what
         the form crumbles to, is this colour (render/impactFx.ts), where every form threw the same grey.
  body   how wide the painted body of a boss form is in the three bands its hurt zones are (legs, torso,
         head; data/bossTuning.ts ZONES): the half-width of the mass, as a fraction of the form's height, from
         its front idle. The fight strikes a colossus where the picture shows it (data/assemblyShape.ts).
  ground the physical body's bottom row for forms whose detached sparks extend below it, as a fraction
         of the canvas height. The renderer keeps this one anchor through every pose and view.
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
# pixels) in which the finder looks, or None for the whole head (round 78: and, for a form whose eyes are not
# the brightest marks in the box, their exact colour in bytes, which are then the marks). A mark that is a tooth, a gem, a spot or a
# visor is not an eye, and the finder cannot tell: the others (the Shoggoths' green spots, the Unnamable's
# bone, the Haunter's visor, the Wamp's and the rat swarm's dim amber) were looked at and are left out.
EYED = {
    'black_man': None, 'charles_le_sorcier': (27, 13, 36, 19), 'cthulhu_cultist': None, 'ghoul': None, 'ghoul#eldritch': None,
    'gnoph_keh': None, 'gug': None, 'martense_degenerate': (30, 14, 37, 20), 'medusa_gorgon': None, 'winged_hybrid': None,
    'the_hound': ((24, 26, 40, 33), (43, 255, 160)), 'haunter_of_the_dark': (26, 25, 38, 34), 'serpent_man': (26, 10, 40, 18), 'the_outsider': (26, 5, 38, 13),  # round 78
}

# Forms whose marks keep their light in the dark (round 78): the eyes above and these, looked at on a sheet of
# the texels the colour takes. A form's key is the colour that shows, a few texels at a time, in most of the
# frames of one of its views; the others (a robe's gold, a pyramid's sand) hold too many texels of theirs.
GLINTED = [
    'azathoth', 'deep_one#eldritch', 'elder_thing', 'ghatanothoa', 'ghoul#eldritch', 'shoggoth', 'shoggoth#boss', 'the_hound', 'yeb',
]
GLINT_SHARE = 0.7  # the share of a view's frames a colour shows in
GLINT_MOST = 14  # texels of it in a frame, at most
EYE_WINDOW = 9  # pixels across which a mark is told from what is about it
EYE_MAX = 12  # pixels of a mark, at most
EYE_SPREAD = 0.07  # their spread, at most, as a fraction of the picture's width

LEGS_TOP = 0.34  # the bands of a boss's body, as fractions of its painted height: data/bossTuning.ts ZONES (tests/reviewedLook.test.ts holds them equal)
TORSO_TOP = 0.72
BODY_SHARE = 75  # the percentile of a band's rows' widths taken for its breadth: the mass, not the farthest claw
GROUNDED = {'yog_sothoth'}  # its sphere cluster rests on the ground; the detached sparks are not its feet


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


def find_eyes(px, bounds, box=None, colour=None):
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
    if colour:
        found = [g for g in marks(solid & head & (np.abs(px[..., :3] - np.array(colour)).sum(-1) <= 3)) if len(g) <= EYE_MAX]
    else:
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


def texel_colours(px):
    """{exact colour (r, g, b bytes): texels of it} over the solid texels of a frame."""
    solid = px[..., 3] > 200
    colours, counts = np.unique(px[..., :3][solid].astype(int), axis=0, return_counts=True)
    return {tuple(int(v) for v in c): int(n) for c, n in zip(colours, counts)}


def lit_by(c):
    """Whether a colour (bytes) is bright or saturated enough to be a light."""
    r, g, b = (v / 255 for v in c)
    top, bottom = max(r, g, b), min(r, g, b)
    saturation = (top - bottom) / max(top, 1e-6)
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.62 or (saturation > 0.55 and 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3)


def find_glint(entity, frames, pages):
    """The colour (0..1) of a form's lit marks, or None: the most saturated colour that is a few texels in most of the frames of a view."""
    best = None
    for view in entity['directions'].values():
        shown = [i for indexes in view['actions'].values() for i in indexes]
        counts = [texel_colours(frame_pixels(pages, frames[i])) for i in shown]
        for c in {c for each in counts for c in each}:
            held = [each[c] for each in counts if c in each]
            if len(held) < GLINT_SHARE * len(shown) or max(held) > GLINT_MOST or not lit_by(c):
                continue
            r, g, b = (v / 255 for v in c)
            score = (max(r, g, b) - min(r, g, b)) / max(max(r, g, b), 1e-6) * 0.7 + len(held) / len(shown) * 0.3
            if best is None or score > best[0]:
                best = (score, c)
    return None if best is None else [round(v / 255, 3) for v in best[1]]


def eye_colour(px, found):
    """The exact colour (0..1) most of the pixels about an eye found by `find_eyes` have, in a frame: its mark's own."""
    cx, cy, spread = found[0] * px.shape[1], found[1] * px.shape[0], found[2] * px.shape[1]
    ys, xs = np.nonzero(px[..., 3] > 200)
    near = np.hypot(xs - cx, ys - cy) <= spread + 1
    colours = [tuple(int(v) for v in px[y, x, :3]) for y, x in zip(ys[near], xs[near]) if lit_by(tuple(px[y, x, :3]))]
    return None if not colours else [round(v / 255, 3) for v in max(set(colours), key=colours.count)]


def body_matter(px):
    """The mean colour (0..1) of the middle half, by brightness, of a frame's solid texels."""
    solid = px[..., 3] > 200
    rgb = px[..., :3][solid] / 255
    luma = rgb @ np.array([0.2126, 0.7152, 0.0722])
    low, high = np.percentile(luma, [25, 75])
    middle = rgb[(luma >= low) & (luma <= high)]
    return [round(float(v), 3) for v in middle.mean(0)]


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
    eyes, body, ground, glints, matter = {}, {}, {}, {}, {}
    for key, entity in manifest['entities'].items():
        front = frames[entity['directions']['front']['actions']['idle'][0]]
        px = frame_pixels(pages, front)
        matter[key] = body_matter(px)
        if entity['assetGroup'] == 'bosses':
            body[key] = body_bands(px, front['bounds'])
        if key in GROUNDED:
            cluster = max(marks(px[..., 3] > 128), key=len)
            ground[key] = max(y for y, _ in cluster) / front['height']
        if key in EYED:
            where = EYED[key]
            box, colour = where if isinstance(where, tuple) and isinstance(where[0], tuple) else (where, None)
            found = find_eyes(px, front['bounds'], box, colour)
            if not found:
                sys.exit(f'{key} is named in EYED but its eyes were not found')
            eyes[key] = [round(v, 3) for v in found]
            glint = eye_colour(px, found)
            if glint and texel_colours(px).get(tuple(round(v * 255) for v in glint), 0) <= GLINT_MOST:
                glints[key] = glint
        if key in GLINTED:
            glint = find_glint(entity, frames, pages)
            if not glint:
                sys.exit(f'{key} is named in GLINTED but no colour of its marks was found')
            glints[key] = glint
    unknown = [key for key in EYED.keys() | GROUNDED | set(GLINTED) if key not in manifest['entities']]
    if unknown:
        sys.exit(f'Art measurements name forms the pack does not hold: {unknown}')
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
    lines += [
        '};',
        '',
        '/** By form: the physical body\'s ground row as a fraction of the canvas height, excluding detached sparks. */',
        'export const REVIEWED_GROUND: Readonly<Record<string, number>> = {',
    ]
    lines += [f"  '{key}': {value}," for key, value in sorted(ground.items())]
    lines += [
        '};',
        '',
        "/** By form: the exact colour (0..1) of the marks that stay lit in the dark in every view and frame (its eyes, its lamps): the sprite shader keeps the texels of this colour alight. */",
        'export const REVIEWED_GLINTS: Readonly<Record<string, readonly [r: number, g: number, b: number]>> = {',
    ]
    lines += [f"  '{key}': [{', '.join(str(v) for v in value)}]," for key, value in sorted(glints.items())]
    lines += [
        '};',
        '',
        "/** By form: the colour (0..1) of its own flesh, hide, shell or stone: what a blow throws off it. */",
        'export const REVIEWED_MATTER: Readonly<Record<string, readonly [r: number, g: number, b: number]>> = {',
    ]
    lines += [f"  '{key}': [{', '.join(str(v) for v in value)}]," for key, value in sorted(matter.items())]
    lines += ['};', '']
    OUT.write_text('\n'.join(lines))
    print(f'{OUT.relative_to(ROOT)}: {len(eyes)} with eyes, {len(glints)} with lit marks, {len(matter)} with matter, {len(body)} boss bodies, {len(ground)} body ground rows measured', file=sys.stderr)


if __name__ == '__main__':
    main()
