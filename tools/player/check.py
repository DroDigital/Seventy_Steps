#!/usr/bin/env python3
"""A quick look at clips with no Blender: solves them (clipkit.py), prints qa.py's report and draws a contact sheet of a stick figure with the weapon, the game's hit
sphere through its window and the weapon tip's trail, from the side, the front and above. Seconds, not a minute: what you run again and again while keying a clip.
(The picture of the modelled figure, in Blender's own evaluation, is preview.py's `sheet`, once animate.py has keyed the clip.)

    python3 -I tools/player/check.py cane.light1 [--frames 0,9,13 | --every 3] [--views side,top,front] [--out f.png] [--cols 8] [--no-sheet]
    python3 -I tools/player/check.py --all [--module cane]       every clip's report, one block each (no pictures)

Always pass --module <the one you are keying> (clips/<module>.py): the others may be half made.

Side: his front is to the right. Front: his left is to the right of the picture. Above: his front is up, his right to the right. The lime ticks along the ground are
half metres of the clip's world (a planted boot keeps its tick). Red: the hit window (the tip's trail and the sphere); the sphere's centre travels the dotted arc.
"""
import os, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import numpy as np
from PIL import Image, ImageDraw
import frame as F
import solve as S
import qa
import clips as C
from clipkit import hit_path, LENGTH

SCRATCH = os.environ.get('PLAYER_SCRATCH', os.path.join(HERE, 'build', 'shots'))
W, H = 300, 330  # a tile
PX = 104.0  # pixels to the metre
TOE, HEEL, SOLE = S.TOE, S.HEEL, S.SOLE


def axes(view):
    """The picture's horizontal and vertical as game-axis vectors (x, y, z)."""
    return {'side': ((0, 0, 1), (0, 1, 0)), 'front': ((1, 0, 0), (0, 1, 0)), 'top': ((-1, 0, 0), (0, 0, 1))}[view]


def points(clip, f):
    r = clip.rigs[f]
    root = clip.root(f) * np.array([1, 0, 1])
    w = r.world
    at = lambda j, o=(0, 0, 0): (w[j] @ np.array([*o, 1.0]))[:3] + root
    g, t, _ = S.tip_of(r, 'R', LENGTH.get(clip.weapon, 0.94))
    pts = {j: at(j) for j in ('body', 'armR', 'armL', 'elbowR', 'elbowL', 'handR', 'handL', 'legR', 'legL', 'kneeR', 'kneeL', 'footR', 'footL', 'head')}
    pts.update(top=at('head', (0, 0.27, 0)), toeR=at('footR', (0, -SOLE, TOE)), heelR=at('footR', (0, -SOLE, HEEL)), toeL=at('footL', (0, -SOLE, TOE)), heelL=at('footL', (0, -SOLE, HEEL)),
               grip=g + root, tip=t + root)
    return pts, root


def tile(clip, f, view, trail, size=(W, H)):
    pts, root = points(clip, f)
    hx, vy = (np.array(a, float) for a in axes(view))
    mid = np.array([0.0, 0.0, 0.0])
    if view == 'side':
        mid = np.array([0, 0, root[2] + 0.45])
        ctr = (size[0] / 2, size[1] - 24)
    elif view == 'front':
        mid = np.array([0.0, 0, root[2]])
        ctr = (size[0] / 2, size[1] - 22)
    else:
        mid = np.array([0.0, 0, root[2] + 0.4])
        ctr = (size[0] / 2, size[1] * 0.64)

    def P(p):
        d = np.asarray(p) - mid
        return (ctr[0] + float(d @ hx) * PX, ctr[1] - float(d @ vy) * PX)

    im = Image.new('RGB', size, (28, 28, 36))
    d = ImageDraw.Draw(im)
    if view != 'top':
        d.line([P((-1.5, S.GROUND, root[2] - 2 + 0.3)), P((1.5, S.GROUND, root[2] + 2))] if view == 'front' else [(0, P((0, S.GROUND, 0))[1]), (size[0], P((0, S.GROUND, 0))[1])], fill=(70, 70, 80), width=1)
    z0 = np.floor((mid[2] - 2.0) * 2) / 2
    for k in range(10):
        z = z0 + k * 0.5
        if view == 'side':
            x, y = P((0, S.GROUND, z))
            d.line([(x, y), (x, y + 6)], fill=(150, 220, 40), width=1)
        elif view == 'top':
            x, y = P((-1.2, 0, z))
            d.line([(x, y), (x + 6, y)], fill=(150, 220, 40), width=1)
    m = clip.m
    hit = bool(m.hit) and not clip.loop and m.hit0 <= f <= m.hit1
    if m.hit and not clip.loop:  # the sphere's centre through its window, and the sphere now if it is in its window
        for g in range(int(m.hit0), int(m.hit1) + 1):
            c, rad = hit_path(m, g)
            x, y = P(c + clip.root(g) * np.array([1, 0, 1]))
            d.ellipse([x - 1, y - 1, x + 1, y + 1], fill=(255, 190, 80))
        if hit:
            c, rad = hit_path(m, f)
            x, y = P(c + root)
            d.ellipse([x - rad * PX, y - rad * PX, x + rad * PX, y + rad * PX], outline=(255, 80, 60))
    for i in range(1, f + 1):  # the tip's trail
        if trail is not None:
            a, b = P(trail[i - 1]), P(trail[i])
            on = bool(m.hit) and not clip.loop and m.hit0 <= i <= m.hit1
            d.line([a, b], fill=(255, 70, 40) if on else (230, 190, 90), width=2)
    line = lambda a, b, col, wd=3: d.line([P(pts[a]), P(pts[b])], fill=col, width=wd)
    R, L, K = (240, 120, 90), (110, 160, 240), (200, 200, 190)
    line('body', 'head', K, 4)
    line('head', 'top', (240, 220, 120), 5)
    line('armR', 'armL', K, 3)
    line('legR', 'legL', K, 3)
    line('armR', 'elbowR', R)
    line('elbowR', 'handR', R)
    line('armL', 'elbowL', L)
    line('elbowL', 'handL', L)
    line('legR', 'kneeR', R)
    line('kneeR', 'footR', R)
    line('legL', 'kneeL', L)
    line('kneeL', 'footL', L)
    line('heelR', 'toeR', R, 3)
    line('heelL', 'toeL', L, 3)
    d.line([P(pts['grip']), P(pts['tip'])], fill=(255, 255, 255) if not hit else (255, 120, 90), width=3)
    r = clip.rigs[f]
    tags = ''.join(f' {k}' for k, v in clip.markers.items() if abs(v - f) < 0.5)
    d.text((4, size[1] - 12), f'{f}' + (' HIT' if hit else '') + tags, fill=(255, 255, 255))
    if any(v > 0.02 for v in r.over.values()):
        d.text((size[0] - 70, 4), 'OUT OF REACH', fill=(255, 90, 90))
    d.text((4, 3), view, fill=(150, 150, 160))
    return im


def tip_trail(clip):
    return [points(clip, f)[0]['tip'] for f in range(len(clip.rigs))]


def sheet(clip, frames, views, out, cols=8):
    trail = tip_trail(clip)
    tiles = [[tile(clip, f, v, trail) for f in frames] for v in views]
    rows = []
    for vi, row in enumerate(tiles):
        for k in range(0, len(row), cols):
            rows.append(row[k:k + cols])
    img = Image.new('RGB', (W * min(cols, len(frames)), H * len(rows)))
    for y, row in enumerate(rows):
        for x, t in enumerate(row):
            img.paste(t, (x * W, y * H))
    ImageDraw.Draw(img).text((6, H - 24), clip.id, fill=(240, 240, 220))
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    img.save(out)
    print('wrote', out)


def run(cid, a, get):
    made = C.all_clips([cid], get('--module').split(',') if get('--module') else None)
    if not made:
        sys.exit(f'no clip {cid}')
    for clip in made:
        clip.solve()
        n = len(clip.rigs)
        print(f'{clip.id}: {clip.frames} frames' + (f', hit {clip.m.hit0}-{clip.m.hit1}' if clip.m.hit else '') + (' (loop)' if clip.loop else ''))
        for line in qa.report(clip, spin_ok=clip.id in ('roll', 'death')):
            print('  ' + line)
        if '--no-sheet' in a:
            continue
        if get('--frames'):
            fr = [int(x) for x in get('--frames').split(',')]
        else:
            step = int(get('--every', max(1, clip.frames // 11)))
            fr = list(range(0, n, step))
            if not clip.loop and fr[-1] != n - 1:
                fr.append(n - 1)
        sheet(clip, [min(f, n - 1) for f in fr], get('--views', 'side,top').split(','), get('--out', os.path.join(SCRATCH, f'check_{clip.id}.png')), int(get('--cols', 8)))


if __name__ == '__main__':
    a = sys.argv[1:]
    get = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    if '--all' in a:
        for clip in C.all_clips(None, get('--module').split(',') if get('--module') else None):
            clip.solve()
            warns = [l for l in qa.report(clip, spin_ok=clip.id in ('roll', 'death')) if l.startswith('WARN')]
            print(f'{clip.id:18s} {clip.frames:4d} frames  ' + (f'{len(warns)} warnings' if warns else 'clean'))
            for l in warns:
                print('    ' + l)
    else:
        ids = [x for x in a if not x.startswith('--') and (a.index(x) == 0 or not a[a.index(x) - 1].startswith('--') or a[a.index(x) - 1] in ('--no-sheet',))]
        run(ids[0], a, get)
