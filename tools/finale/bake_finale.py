#!/usr/bin/env python3
"""Bakes the endings' three props into src/data/models/finalePack.ts (round 98). Not stood in any arena, so they are
not added to MODEL_INFO (tests/arenaSets.test.ts fails a baked model nothing stands). CC0 only.

- fn_key: Savino's antique key, https://opengameart.org/content/antique-key (low.obj, CC0). Hung, silvered, the bow up.
- fn_arch: Kenney Castle Kit tower-square-arch, https://kenney.nl/assets/castle-kit (CC0). Scaled to a gate.
- fn_clock: the same kit's tower (base, windows, mid, roof) stacked, with a dial and hands made here.

Run: python3 tools/finale/bake_finale.py   (network the first time; numpy, pillow). Offline afterwards if /tmp/finale/zips is kept.
"""
import base64, io, json, os, struct, urllib.request, zipfile
import numpy as np
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys_path = os.path.join(ROOT, 'tools', 'models', 'boss')
import sys
sys.path.insert(0, sys_path)
import pack as P  # noqa: E402

WORK = '/tmp/finale'
H = {'User-Agent': 'Mozilla/5.0 seventy-steps-asset-fetch'}


def fetch(url, headers):
    req = urllib.request.Request(url, headers=headers)
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read()


def kenney(slug):
    dest = os.path.join(WORK, 'zips', f'{slug}.zip')
    if os.path.exists(dest) and os.path.getsize(dest) > 1000:
        return dest
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    hid = f'assets/{slug}'.encode().hex()
    meta = json.loads(fetch(f'https://kenney.nl/download-link/{hid}', {**H, 'Referer': f'https://kenney.nl/assets/{slug}', 'Accept': 'application/json'}))
    open(dest, 'wb').write(fetch(meta['url'], {**H, 'Referer': f'https://kenney.nl/assets/{slug}'}))
    return dest


def key_obj():
    dest = os.path.join(WORK, 'key.obj')
    if not (os.path.exists(dest) and os.path.getsize(dest) > 1000):
        os.makedirs(WORK, exist_ok=True)
        open(dest, 'wb').write(fetch('https://opengameart.org/sites/default/files/low_2.obj', H))
    vs, faces = [], []
    for line in open(dest):
        p = line.split()
        if not p:
            continue
        if p[0] == 'v':
            vs.append([float(x) for x in p[1:4]])
        elif p[0] == 'f':
            ix = [int(t.split('/')[0]) - 1 for t in p[1:]]
            for i in range(1, len(ix) - 1):
                faces.append([ix[0], ix[i], ix[i + 1]])
    pos = np.array(vs, np.float64)
    # the long axis hangs (it lies on x), and the wider end, the bow, is up
    pos = np.stack([-pos[:, 1], pos[:, 0], pos[:, 2]], axis=1)
    mid = np.median(pos[:, 1])
    wide = lambda m: np.ptp(pos[m][:, 0]) + np.ptp(pos[m][:, 2])
    if wide(pos[:, 1] < mid) > wide(pos[:, 1] >= mid):
        pos[:, 1] *= -1
    tri = pos[np.array(faces)].reshape(-1, 3, 3)
    tri, _, _ = P.fitted(tri, {'height': 0.28}, squash=(1, 1, 2.4))  # the source is a sliver; a key that thin vanishes at night
    n = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
    ln = np.linalg.norm(n, axis=1, keepdims=True)
    n = n / np.maximum(ln, 1e-8)
    shade = 0.62 + 0.38 * np.abs(n[:, 1])
    col = np.array([0.74, 0.77, 0.82]) * shade[:, None]
    cls = np.full(len(tri), 9, np.uint8)  # metal
    return tri, col, cls, ()


def glb(data):
    assert data[:4] == b'glTF'
    off, js, blob = 12, None, b''
    while off + 8 <= len(data):
        clen, ctype = struct.unpack_from('<II', data, off)
        chunk = data[off + 8:off + 8 + clen]
        off += 8 + clen
        if ctype == 0x4E4F534A:
            js = json.loads(chunk)
        elif ctype == 0x004E4942:
            blob = chunk
    acc, views = js['accessors'], js['bufferViews']

    def read(i):
        a, view = acc[i], views[acc[i]['bufferView']]
        comp = {5126: '<f4', 5123: '<u2', 5125: '<u4', 5121: '<u1'}[a['componentType']]
        cnt = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4}[a['type']]
        start = view.get('byteOffset', 0) + a.get('byteOffset', 0)
        return np.frombuffer(blob[start:start + a['count'] * cnt * np.dtype(comp).itemsize], dtype=np.dtype(comp)).reshape(a['count'], cnt).astype(np.float64)

    prim = js['meshes'][0]['primitives'][0]
    pos, idx = read(prim['attributes']['POSITION']), read(prim['indices']).reshape(-1).astype(np.int64)
    uv = read(prim['attributes']['TEXCOORD_0']) if 'TEXCOORD_0' in prim['attributes'] else None
    tri = pos[idx].reshape(-1, 3, 3)
    uvs = uv[idx].reshape(-1, 3, 2) if uv is not None else None
    return tri, uvs


def colormap(z, glb_name):
    """Kenney's GLB points at Textures/colormap.png beside it, rather than embedding the picture."""
    png = glb_name.rsplit('/', 1)[0] + '/Textures/colormap.png'
    if png not in z.namelist():
        return None
    return np.asarray(Image.open(io.BytesIO(z.read(png))).convert('RGB'), np.float64) / 255


def shade(tri, uvs, image, stone):
    if image is None or uvs is None:
        y = tri[:, :, 1].mean(1)
        k = (y - y.min()) / (max(y.max() - y.min(), 1e-6))
        return stone * (0.75 + 0.4 * k)[:, None]
    h, w = image.shape[:2]
    uv = uvs.mean(1)
    x = np.clip((uv[:, 0] % 1) * (w - 1), 0, w - 1).astype(int)
    y = np.clip(((1 - (uv[:, 1] % 1)) * (h - 1)), 0, h - 1).astype(int)
    sample = image[y, x]
    luma = sample.mean(1, keepdims=True)
    return stone * (0.55 + luma)  # the atlas's light and dark, over the stone


def piece(z, name, scale):
    tri, uvs = glb(z.read(name))
    return tri * scale, uvs, colormap(z, name)


def arch():
    z = zipfile.ZipFile(kenney('castle-kit'))
    name = next(n for n in z.namelist() if n.endswith('tower-square-arch.glb'))
    tri, uvs = glb(z.read(name))
    image = colormap(z, name)
    # the opening is the axis with the fewest vertices near the middle: turn it to face +z
    p = tri.reshape(-1, 3)
    span = p.max(0) - p.min(0)
    mid = (p.min(0) + p.max(0)) / 2
    near = [np.mean(np.abs(p[:, i] - mid[i]) < 0.18 * span[i]) for i in range(3)]
    hole = int(np.argmin(near[:1] + near[2:]))  # 0 -> x, 1 -> z (we only compare x and z)
    if hole == 0:
        tri = P.rotate_y(tri, 90)
    tri, _, _ = P.fitted(tri, {'height': 6.4})
    col = shade(tri, uvs, image, np.array([0.62, 0.58, 0.54]))
    return tri, col, np.zeros(len(tri), np.uint8), (0,)


def clock():
    z = zipfile.ZipFile(kenney('castle-kit'))
    names = {
        'base': next(n for n in z.namelist() if n.endswith('/tower-square-base.glb')),
        'windows': next(n for n in z.namelist() if n.endswith('/tower-square-mid-windows.glb')),
        'mid': next(n for n in z.namelist() if n.endswith('/tower-square-mid.glb')),
        'roof': next(n for n in z.namelist() if n.endswith('/tower-square-roof.glb')),
    }
    scale = 1.22
    order = ['base', 'windows', 'mid', 'roof']
    parts, cols, y = [], [], 0.0
    windows = None
    for key in order:
        tri, uvs, image = piece(z, names[key], scale)
        p = tri.reshape(-1, 3)
        tri = tri - np.array([(p[:, 0].min() + p[:, 0].max()) / 2, p[:, 1].min(), (p[:, 2].min() + p[:, 2].max()) / 2])
        tri = tri + np.array([0, y, 0])
        if key == 'windows':
            windows = tri
        parts.append(tri)
        cols.append(shade(tri, uvs, image, np.array([0.5, 0.48, 0.46])))
        y += tri.reshape(-1, 3)[:, 1].max() - (y)
    # a pale dial on the tower's front, high enough to read under the eave: the striking clock the seal's line hears
    stone_so_far = np.concatenate(parts).reshape(-1, 3)
    front = windows.reshape(-1, 3)
    zf = front[:, 2].max() + 0.12
    span = stone_so_far[:, 1].max() - stone_so_far[:, 1].min()
    cy = stone_so_far[:, 1].min() + span * 0.62
    r = min(0.42, (front[:, 0].max() - front[:, 0].min()) * 0.34)
    dial, ticks, hands = [], [], []
    ring = 18
    for i in range(ring):
        a0, a1 = i / ring * np.pi * 2, (i + 1) / ring * np.pi * 2
        p0 = [np.sin(a0) * r, cy + np.cos(a0) * r, zf]
        p1 = [np.sin(a1) * r, cy + np.cos(a1) * r, zf]
        dial.append([p1, [0, cy, zf], p0])  # faces +z, out of the tower
    for i in range(12):
        a = i / 12 * np.pi * 2
        inner, outer = r * 0.78, r * 0.94
        c, s = np.sin(a), np.cos(a)
        tang = np.array([np.cos(a), -np.sin(a), 0]) * 0.018
        o0 = np.array([c * outer, cy + s * outer, zf + 0.01])
        i0 = np.array([c * inner, cy + s * inner, zf + 0.01])
        ticks.append([o0 - tang, o0 + tang, i0 + tang])
        ticks.append([o0 - tang, i0 + tang, i0 - tang])
    def hand(length, width, ang, zextra):
        c, s = np.sin(ang), np.cos(ang)
        forward = np.array([c, s, 0]) * length
        side = np.array([s, -c, 0]) * width
        hub = np.array([0, cy, zf + zextra])
        tip = hub + forward
        return [hub - side, hub + side, tip]
    hands.append(hand(r * 0.46, 0.02, 0.5, 0.02))
    hands.append(hand(r * 0.7, 0.014, 2.4, 0.03))
    stone = np.concatenate(parts)
    scol = np.concatenate(cols)
    metal = np.array(dial + ticks + hands, np.float64)
    mcol = np.zeros((len(metal), 3))
    mcol[:len(dial)] = (0.78, 0.72, 0.58)
    mcol[len(dial):len(dial) + len(ticks)] = (0.18, 0.14, 0.1)
    mcol[len(dial) + len(ticks):] = (0.12, 0.1, 0.08)
    tri = np.concatenate([stone, metal])
    col = np.concatenate([scol, mcol])
    cls = np.concatenate([np.zeros(len(stone), np.uint8), np.full(len(metal), 9, np.uint8)])
    p = tri.reshape(-1, 3)
    shift = np.array([(p[:, 0].min() + p[:, 0].max()) / 2, p[:, 1].min(), (p[:, 2].min() + p[:, 2].max()) / 2])
    return tri - shift, col, cls, (9,)  # the dial and the hands, from either side


def emit(models):
    pack, index = [], []
    for i, (name, tri, col, cls, double) in enumerate(models):
        blob, lo, hi, nv, nf = P.bake(tri, col, cls, double)
        pack.append(f"  {name}: '{base64.b64encode(blob).decode()}',")
        index.append(
            f"  {name}: {{ kit: 'finale', x0: {lo[0]:.3f}, x1: {hi[0]:.3f}, y0: {lo[1]:.3f}, y1: {hi[1]:.3f}, z0: {lo[2]:.3f}, z1: {hi[2]:.3f}, round: false, tris: {nf}, solids: [] }},"
        )
        print(name, 'points', nv, 'tris', nf, 'box', np.round(lo, 3), np.round(hi, 3))
    out = os.path.join(ROOT, 'src', 'data', 'models')
    open(os.path.join(out, 'finalePack.ts'), 'w').write(
        "/** The endings' props (round 98), baked by tools/finale/bake_finale.py: the silver key, the Ultimate Gate's arch, the court's clock tower. Not part of MODEL_INFO (no arena stands them). Licences: CREDITS.md. Data only. */\n\n"
        "export const FINALE_PACK: Readonly<Record<string, string>> = {\n" + "\n".join(pack) + "\n};\n"
    )
    open(os.path.join(out, 'finaleIndex.ts'), 'w').write(
        "/** Boxes of the endings' props (tools/finale/bake_finale.py). Not merged into MODEL_INFO. Data only. */\n\n"
        "import type { ModelInfo } from './index';\n\n"
        "export const FINALE_INFO: Readonly<Record<string, ModelInfo>> = {\n" + "\n".join(index) + "\n};\n"
    )


if __name__ == '__main__':
    emit([
        ('fn_key',) + key_obj(),
        ('fn_arch',) + arch(),
        ('fn_clock',) + clock(),
    ])
