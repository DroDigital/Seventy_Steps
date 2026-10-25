#!/usr/bin/env python3
"""Bakes the PS1 surface patterns (src/data/psxDetail.ts) that render/textures.ts lays over the world's stone, flagstones and planks: the 64 x 64 textures of Goblinatron's
'PSX Dungeon' (itch.io, CC BY 4.0; credited with its models, Pack 40 of src/data/models/CREDITS.md), kept as what they are in a PS1 game, their light and dark: a texel's
brightness against the texture's own average, a byte each. The game gives them their colour (the realm's grade), so they are read as greys: a wall's block, joint, chip and
stain, a flag's four slabs, a plank's grain, as a PlayStation texture artist drew them in sixteen shades.
Run: python3 -I tools/psx/bake_psx_textures.py <the pack's Textures folder> [out.ts]   (needs `pip install pillow numpy`)"""
import base64, os, sys
import numpy as np
from PIL import Image

PICK = {  # the kind of the world's texture each stands for : the file
    'stone': 'TEX_Wall_03.png',
    'slab': 'TEX_Ground_04.png',
    'wood': 'TEX_Planks_01.png',
}

def main(src, out):
    rows = []
    for name, f in PICK.items():
        im = Image.open(os.path.join(src, f)).convert('RGB')
        if im.size != (64, 64):
            im = im.resize((64, 64), Image.BOX)
        a = np.asarray(im, dtype=np.float64) / 255.0
        lum = a @ np.array([0.3, 0.59, 0.11])
        rel = lum / max(lum.mean(), 1e-3)           # 1 is the texture's own average light
        b = np.clip(np.round(rel * 100), 0, 255).astype(np.uint8)  # 100 is an average texel, so it can be 2.5 times as bright
        rows.append(f"  {name}: '{base64.b64encode(b.tobytes()).decode()}',")
    lines = [
        "/** PS1 surface patterns (round 79; tools/psx/bake_psx_textures.py, render/textures.ts): each 64 x 64 bytes of brightness against the texture's own average (100 is average), from",
        " * Goblinatron's 'PSX Dungeon' (CC BY 4.0, credited in src/data/models/CREDITS.md as Pack 40). Generated. */",
        '',
        'export const PSX_SIZE = 64;',
        'export const PSX_DETAIL: Readonly<Record<string, string>> = {',
        *rows,
        '};',
        '',
    ]
    open(out, 'w').write('\n'.join(lines))
    print(f'{out}: {sum(len(r) for r in rows)} bytes of base64 in {len(rows)} patterns')

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'psxDetail.ts')
