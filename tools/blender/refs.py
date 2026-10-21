"""The reviewed 2D art of a creature, as a reference sheet for its model (docs/MODELS.md): every
direction's idle, a move frame and its attack and hurt frames where drawn, enlarged four times.

    python3 tools/blender/refs.py deep_one [more ids] [--out tools/blender/sheets]

A reference only: a model is designed from the story and its field note first (the sprites are
the author's reading of the same, at 64 pixels, from four sides)."""

import json
import os
import sys

from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
ART = os.path.join(ROOT, 'public', 'creatures', 'reviewed')


def sheet(key, index, pages, out):
    e = index['entities'].get(key)
    if not e:
        return None
    cells = []
    for d in ('front', 'left', 'back'):
        acts = e['directions'].get(d, {}).get('actions', {})
        for a in ('idle', 'move', 'attack', 'hurt', 'stoop'):
            for i in acts.get(a, [])[: 3 if a == 'attack' else 1]:
                fr = index['frames'][i]
                img = pages[fr['page']].crop((fr['x'], fr['y'], fr['x'] + fr['width'], fr['y'] + fr['height']))
                cells.append(img.resize((fr['width'] * 4, fr['height'] * 4), Image.NEAREST))
    if not cells:
        return None
    w, h = sum(c.width for c in cells), max(c.height for c in cells)
    s = Image.new('RGBA', (w, h), (40, 40, 44, 255))
    x = 0
    for c in cells:
        s.alpha_composite(c, (x, h - c.height))
        x += c.width
    path = os.path.join(out, f'{key.replace("#", "-")}-ref.png')
    s.convert('RGB').save(path)
    return path


def main(argv):
    out = argv[argv.index('--out') + 1] if '--out' in argv else os.path.join(HERE, 'sheets')
    os.makedirs(out, exist_ok=True)
    index = json.load(open(os.path.join(ART, 'index.json')))
    pages = [Image.open(os.path.join(ART, p['file'] if isinstance(p, dict) else p)).convert('RGBA') for p in index['pages']]
    for cid in [a for a in argv if not a.startswith('--') and a != out]:
        for key in (cid, f'{cid}#eldritch', f'{cid}#boss'):
            p = sheet(key, index, pages, out)
            if p:
                print(os.path.relpath(p, ROOT))


if __name__ == '__main__':
    main(sys.argv[1:])
