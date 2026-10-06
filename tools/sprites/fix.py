"""The fixes that need no drawing, made on a copy: a direction drawn facing the wrong way mirrored,
feet put back on the idle's ground line, a walk's upper body held steady (not where the frames
are to be redrawn anyway). Whatever needs a new or redrawn frame is left to the report. Each frame
touched is written under `out` at its own path in the pack, so the copy can be laid over the pack;
`fixes.json` lists what was done."""
import json, os
import numpy as np
from PIL import Image
from .checks import mask, shape


def _shift(rgba, dx, dy):
    """Moves the picture by whole pixels; what leaves the canvas is refused, not wrapped."""
    m = mask(rgba)
    ys, xs = np.nonzero(m)
    h, w = m.shape
    if ys.min() + dy < 0 or ys.max() + dy >= h or xs.min() + dx < 0 or xs.max() + dx >= w:
        return None
    out = np.zeros_like(rgba)
    src = rgba[max(0, -dy):h - max(0, dy), max(0, -dx):w - max(0, dx)]
    out[max(0, dy):max(0, dy) + src.shape[0], max(0, dx):max(0, dx) + src.shape[1]] = src
    return out


def plan(pack, findings):
    """{path: (rgba, [what was done])} for every frame a finding can mend without drawing."""
    done = {}

    def take(path):
        if path not in done:
            done[path] = [pack.image(path).copy(), []]
        return done[path]

    by_item = {i['key']: i for i in pack.sprites()}
    redraw = {(f['key'], f['direction']) for f in findings if f['check'] == 'off-model'}
    for f in findings:
        item = by_item[f['key']]
        if f['fix'] == 'mirror':
            for action in ('idle', 'move', 'attack', 'hurt'):
                for name, path in pack.frames(item, f['direction'], action):
                    entry = take(path)
                    entry[0] = entry[0][:, ::-1].copy()
                    entry[1].append('mirrored: it faced the other way')
    for f in findings:
        item = by_item[f['key']]
        if f['fix'] == 'shift':
            path = dict(pack.frames(item, f['direction'], f['numbers']['frame'].split('_')[0]))[f['numbers']['frame']]
            entry = take(path)
            moved = _shift(entry[0], 0, -f['numbers']['px'])
            if moved is not None:
                entry[0] = moved
                entry[1].append(f'moved {-f["numbers"]["px"]:+d} px to the ground line')
        elif f['fix'] == 'centre' and (f['key'], f['direction']) not in redraw:
            move = pack.frames(item, f['direction'], 'move')
            xs = [shape(mask(take(p)[0]))['torso_x'] for n, p in move]
            mean = sum(xs) / len(xs)
            for (n, p), x in zip(move, xs):
                dx = int(round(mean - x))
                if dx:
                    entry = take(p)
                    moved = _shift(entry[0], dx, 0)
                    if moved is not None:
                        entry[0] = moved
                        entry[1].append(f'moved {dx:+d} px across to hold the upper body steady')
    return {p: v for p, v in done.items() if v[1]}


def write(pack, findings, out):
    fixes = plan(pack, findings)
    log = {}
    for path, (rgba, what) in sorted(fixes.items()):
        dest = os.path.join(out, path)
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        Image.fromarray(rgba, 'RGBA').save(dest)
        log[path] = what
    os.makedirs(out, exist_ok=True)
    with open(os.path.join(out, 'fixes.json'), 'w') as f:
        json.dump(log, f, indent=1)
    print(f'{len(log)} frames mended into {out}')
    return log
