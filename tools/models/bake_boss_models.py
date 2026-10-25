#!/usr/bin/env python3
"""Bakes the models of the boss places (docs/BOSS_PLACES.md) from the supplied asset collection into the game's compact form:
`src/data/models/bossIndex.ts` (each model's box, what a body cannot walk through, where its flames sit) and `bossPack.ts` (its triangles),
beside the Kenney models' (bake_models.py), which this does not touch. The sources are read with Blender's own importers (`pip install bpy`),
so a scene's several objects, materials, textures, armature poses and modifiers are as Blender has them; see tools/models/boss/.
Run: python3 -I tools/models/bake_boss_models.py <work dir unpacked by tools/models/boss/unpack.py> [--only id,id] [--sheet out.png]
(needs `pip install bpy numpy pillow`). Models not named by `--only` keep the data they have. Then `npm run check`."""
import ast, base64, os, re, sys
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, 'boss'))
import numpy as np
import sources as S
import pack as P
import solids as SO
import manifest as MF
import proc as PR
import proc_more as PR2
import proc_grove as PR3
import fill as FL
PROC = {**PR.PROC, **PR2.PROC, **PR3.PROC}

OUT = os.path.join(HERE, '..', '..', 'src', 'data', 'models')

def existing():
    """The index and pack already written, so a run that bakes a few leaves the rest as they are."""
    info, blobs = {}, {}
    try:
        text = open(os.path.join(OUT, 'bossIndex.ts')).read()
        for m in re.finditer(r"^  (\w+): (\{.*\}),$", text, re.M):
            body = re.sub(r'(\w+):', r'"\1":', m.group(2)).replace("'", '"').replace('true', 'True').replace('false', 'False')
            info[m.group(1)] = ast.literal_eval(body)
        for m in re.finditer(r"^  (\w+): '([^']*)',$", open(os.path.join(OUT, 'bossPack.ts')).read(), re.M):
            blobs[m.group(1)] = m.group(2)
    except FileNotFoundError:
        pass
    return info, blobs

def blank_head(pos, col, cls, arm, spec):
    """A figure with its head taken off at a bone and an eyeless egg in its place (the blind dancers): the faces above the bone's head go, and the egg is the colour of what went."""
    top = S.bone_point(arm, spec.get('bone', 'head'))
    ctr = pos.mean(axis=1)
    gone = ctr[:, 1] > top[1] - 0.005
    if not gone.any():
        return pos, col, cls
    skin = col[gone].mean(axis=0)
    shape = PR.Shape()
    rx, ry, rz = spec.get('radii', (0.1, 0.125, 0.11))
    PR.ellipsoid(shape, (top[0], top[1] + ry * 0.7, top[2]), (rx, ry, rz), 5, 10, tuple(skin), int(np.bincount(cls[gone]).argmax()))
    t, c, k = shape.out(7, 0.02)
    return np.concatenate([pos[~gone], t]), np.concatenate([col[~gone], c]), np.concatenate([cls[~gone], k])

def bake_one(m, work):
    if m.src.startswith('proc:'):
        pos, col, cls = PROC[m.src[5:]](**m.args)
        dropped = None
    else:
        objs = S.mesh_objects(m.select, m.exclude)
        if not objs:
            raise ValueError(f'{m.id}: nothing in {m.src} matches {m.select!r}')
        arm = objs[0].find_armature()
        if m.pose and arm:
            S.pose_armature(arm, m.pose)
        soup, dropped = S.soup_of(objs, classes=m.classes, drop=m.drop, default_cls=m.cls, decimate_to=m.decimate or None, cut=m.cut, drop_alpha=m.drop_alpha, glass_alpha=m.glass_alpha)
        pos, col, cls, _ = soup.done()
        if m.plane and len(pos):
            cls = FL.panel(pos, cls, m.plane)
        if m.recolour is not None and len(col):
            luma = col @ np.array([.299, .587, .114])
            new = np.clip(np.array(m.recolour)[None, :] * (0.55 + 0.9 * np.minimum(1, luma * 1.3))[:, None], 0, 1)
            col = np.where(np.isin(cls, m.recolour_not)[:, None], col, new)
        if len(pos) and m.fill:
            pos, col, cls = FL.liquid(pos, col, cls, m.fill)
        if len(pos) and m.blank and arm:
            pos, col, cls = blank_head(pos, col, cls, arm, m.blank)
        if m.pose and arm:
            S.pose_armature(arm, {b.name: (0, 0, 0) for b in arm.pose.bones})
    if len(pos) == 0:
        raise ValueError(f'{m.id}: no faces')
    if m.mirror:
        pos = pos * np.array([-1, 1, 1])[None, None, :]
        pos = pos[:, ::-1, :]
        col, cls = col, cls
    pos = P.tip(pos, m.rx, m.rz)
    pos = P.rotate_y(pos, m.rot)
    pos, shift, k = P.fitted(pos, m.fit, m.squash)
    anchors = [list(map(lambda v: round(float(v), 3), a)) for a in m.anchors]
    if m.anchor_of and dropped:
        dpos, _, _, _ = dropped.done()
        if len(dpos):
            dpos = (P.rotate_y(dpos, m.rot) * np.array([k * m.squash[0], k * m.squash[1], k * m.squash[2]])) - shift
            anchors.append([round(float(v), 3) for v in dpos.reshape(-1, 3).mean(axis=0)])
    blob, lo, hi, nv, nt = P.bake(pos, col, cls, m.double)
    if m.solids == 'none':
        solids = []
    elif m.solids == 'box':
        solids = SO.one_box(pos)
    elif m.solids == 'auto':
        solids = SO.decompose(pos, m.bands)
    elif m.solids == 'trunk':
        solids = SO.trunk(pos)
    else:
        solids = [list(b) for b in m.solids]
    solids = [[float(v) for v in b] for b in solids]
    info = {'kit': m.kit, **{a: round(float(v), 3) for a, v in zip(('x0', 'y0', 'z0'), lo)}, **{a: round(float(v), 3) for a, v in zip(('x1', 'y1', 'z1'), hi)}, 'round': bool(m.round), 'tris': nt, 'solids': solids, 'anchors': anchors}
    return info, base64.b64encode(blob).decode(), (pos, col, cls)

def look(pos, col, cls):
    """Colours as the game lays them (a class's base colour by the light and dark of the face), for the contact sheet."""
    base = {S.STONE: (.5, .5, .48), S.WOOD: (.36, .27, .2), S.LEAF: (.24, .3, .26), S.ROCK: (.42, .42, .4), S.SLAB: (.58, .56, .5), S.COBBLE: (.4, .4, .38),
            S.BRICK: (.5, .34, .3), S.CLOTH: (.6, .5, .3), S.METAL: (.3, .27, .26), S.BONE: (.85, .8, .68), S.GLOW: (1, .8, .5),
            S.GLASS: (.62, .68, .66), S.LIQUID: (.3, .55, .35), S.MIRROR: (.8, .85, .9), S.WAX: (.82, .74, .56)}
    luma = col @ np.array([.299, .587, .114])
    shade = 0.55 + 0.9 * np.minimum(1, luma * 1.3)
    return np.array([np.array(base.get(int(c), base[S.STONE])) for c in cls]) * shade[:, None]

def main():
    args = sys.argv[1:]
    work = args[0]
    flag = lambda n: args[args.index(n) + 1] if n in args else None
    only = set(flag('--only').split(',')) if flag('--only') else None
    sheet = flag('--sheet')
    models = MF.load_all()
    ids = [m.id for m in models]
    assert len(ids) == len(set(ids)), 'duplicate ids: ' + ', '.join(i for i in ids if ids.count(i) > 1)
    info, blobs = existing()
    cells = []
    groups = {}
    for m in models:
        if only and m.id not in only:
            continue
        groups.setdefault((m.src, m.textures), []).append(m)
    for (src, textures), group in groups.items():
        if not src.startswith('proc:'):
            S.load(os.path.join(work, src), [os.path.join(work, t) for t in textures])
        for m in group:
            try:
                info[m.id], blobs[m.id], cell = bake_one(m, work)
            except Exception as e:
                print('FAILED', m.id, e)
                continue
            i = info[m.id]
            print(f"{m.id:24s} {i['tris']:5d} tris  {i['x1']-i['x0']:6.2f} x {i['y1']-i['y0']:6.2f} x {i['z1']-i['z0']:6.2f}  solids={len(i['solids'])} anchors={len(i['anchors'])}  {len(blobs[m.id]) * 3 // 4} B")
            cells.append((m.id, cell[0], look(*cell)))
    order = [m.id for m in models if m.id in info]
    entries = {k: info[k] for k in order}
    index_ts, pack_ts = P.ts_index(entries, None), P.ts_pack({k: blobs[k] for k in order})  # (made first: a failure leaves the files as they were)
    with open(os.path.join(OUT, 'bossIndex.ts'), 'w') as f:
        f.write(index_ts)
    with open(os.path.join(OUT, 'bossPack.ts'), 'w') as f:
        f.write(pack_ts)
    if sheet and cells:
        import preview
        preview.sheet(cells, cols=6, size=200).save(sheet)
    print(len(entries), 'models,', sum(len(b) * 3 // 4 for b in blobs.values()), 'bytes')

main()
