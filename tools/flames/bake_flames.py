#!/usr/bin/env python3
"""Bakes the flame flipbook (src/data/flameAtlas.ts) that render/flames.ts draws at every fire, torch and lamp: a heat mask (0 the rim of a flame,
1 its white core) and a coverage mask, two bytes a texel, cut from the pixel flames of 'Fire' (ZomBCool, OpenGameArt, CC0: 15 x 20, four frames),
so that the colour of a flame is the game's (render/flames.ts: a ramp, and its eldritch ones) and not the artist's. The flames stay as drawn, hard
edged, as the low picture wants them; a big fire is made of several, each at its own beat. (Martin Jelinek's 81 x 123 bonfire, 'Fire FX - Burning
Fire Animation', also CC0, was tried: reduced to this picture it was a blur beside these.)
Below the flames, four smoke puffs (Kenney's 'Smoke Particles', CC0, whitePuff00, 03, 06 and 09, reduced to 24 x 24 and kept as their soft coverage) that
render/particles.ts draws as its 'puff' shape: the smoke of the chimneys and the fires.
Run: python3 -I tools/flames/bake_flames.py <folder with fire_3.gif> <folder with the smoke's 'White puff' pictures> [out.ts]   (needs `pip install pillow numpy`)"""
import base64, glob, os, sys
import numpy as np
from PIL import Image

SIZE = (96, 48)
SMALL = (16, 24)   # a flame's cell
PUFF = (24, 24)    # a puff's cell, in the row below

def heat_of(rgba):
    """(heat, coverage) of an RGBA picture: heat from the light of it, the white core brightest."""
    a = rgba[..., 3].astype(np.float64) / 255.0
    rgb = rgba[..., :3].astype(np.float64) / 255.0
    lum = rgb @ np.array([0.3, 0.59, 0.11])
    sat = rgb.max(axis=-1) - rgb.min(axis=-1)
    heat = np.clip(0.08 + 0.95 * lum - 0.25 * sat, 0, 1)
    return heat, a

def put(atlas, cell, xy, heat, cover):
    x, y = xy
    h, w = heat.shape
    atlas[y:y + h, x:x + w, 0] = np.round(heat * 255)
    atlas[y:y + h, x:x + w, 1] = np.round(cover * 255)

def main(src, smoke, out):
    atlas = np.zeros((SIZE[1], SIZE[0], 2), dtype=np.uint8)
    cells = []
    g = Image.open(os.path.join(src, 'fire_3.gif'))
    for i in range(g.n_frames):
        g.seek(i)
        im = g.convert('RGBA')
        canvas = Image.new('RGBA', SMALL, (0, 0, 0, 0))
        canvas.alpha_composite(im, ((SMALL[0] - im.width) // 2, SMALL[1] - im.height - 1))
        heat, cover = heat_of(np.array(canvas))
        cover = (cover > 0.5).astype(np.float64)  # a pixel flame is all or nothing
        xy = (i * SMALL[0], 0)
        put(atlas, SMALL, xy, heat, cover)
        cells.append(xy)
    puffs = []
    for i, n in enumerate((0, 3, 6, 9)):
        im = Image.open(os.path.join(smoke, f'whitePuff{n:02d}.png')).convert('RGBA')
        box = im.getbbox() or (0, 0, im.width, im.height)
        side = max(box[2] - box[0], box[3] - box[1])
        square = Image.new('RGBA', (side, side), (0, 0, 0, 0))
        square.alpha_composite(im.crop(box), ((side - (box[2] - box[0])) // 2, (side - (box[3] - box[1])) // 2))
        c = np.asarray(square.resize(PUFF, Image.BOX).convert('RGBA'))
        xy = (i * PUFF[0], SMALL[1])
        put(atlas, PUFF, xy, np.zeros(PUFF[::-1]), c[..., 3].astype(np.float64) / 255.0)
        puffs.append(xy)
    data = base64.b64encode(atlas.tobytes()).decode()
    lines = [
        '/** The flame flipbook (round 74; tools/flames/bake_flames.py, render/flames.ts): two bytes a texel, heat then coverage. Generated; credits in src/data/models/CREDITS.md. */',
        '',
        f"export const FLAME_ATLAS = {{ width: {SIZE[0]}, height: {SIZE[1]}, data: '{data}' }} as const;",
        '',
        '/** The cells of the flame (texels from the top left of the atlas) and their size. */',
        f'export const FLAME_CELLS = {{ w: {SMALL[0]}, h: {SMALL[1]}, at: {[list(c) for c in cells]} }} as const;',
        '',
        '/** The cells of the smoke puffs (coverage in the second byte) and their size. */',
        f'export const PUFF_CELLS = {{ w: {PUFF[0]}, h: {PUFF[1]}, at: {[list(c) for c in puffs]} }} as const;',
        '',
    ]
    open(out, 'w').write('\n'.join(lines))
    print(f'{out}: {len(data)} bytes of base64, {len(cells)} frames, {len(puffs)} puffs')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'flameAtlas.ts')
