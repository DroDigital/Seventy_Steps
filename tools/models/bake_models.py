#!/usr/bin/env python3
"""Bakes the CC0 models the arenas use (Kenney's kits: kenney.nl/assets) into the game's own compact form (round 61):
`src/data/models/index.ts` (each model's size and what it is, read by the simulation) and `src/data/models/pack.ts`
(its triangles, read by the renderer once an arena is drawn). A model is welded by position, its faces flattened (a face
takes the colour of the point of its colour map it stands on, as a low-poly figure is drawn), each sorted into a material
class by that colour (stone, wood, leaf), its positions held as 16-bit values within its own box.
Run: `python3 tools/models/bake_models.py <folder holding the unpacked kits: graveyard/ nature/ castle/ pirate/ survival/ town/>`
(needs `pip install pillow numpy`). Whenever the list below changes, run it again, then `npm run check`. docs/DECISIONS.md, CREDITS.md."""
import base64, json, os, struct, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', '..', 'src', 'data', 'models')

# id: (kit, file, round, fit): `round`: its footprint is a circle (a standing thing), else a box; `fit`: the metres it is made to stand
# (a positive number: its height; a negative: its longest side along the ground), the kits being drawn to no common scale.
MODELS = {
    # Graveyard Kit
    'crypt': ('graveyard', 'crypt-large', 0, 3.4), 'crypt_small': ('graveyard', 'crypt-small', 0, 2.6),
    'grave_cross': ('graveyard', 'gravestone-cross-large', 0, 1.5), 'grave_round': ('graveyard', 'gravestone-round', 0, 1.0), 'grave_wide': ('graveyard', 'gravestone-wide', 0, 0.9),
    'grave_broken': ('graveyard', 'gravestone-broken', 0, 0.7),
    'cross': ('graveyard', 'cross', 1, 1.9), 'cross_wood': ('graveyard', 'cross-wood', 1, 1.6),
    'coffin': ('graveyard', 'coffin-old', 0, -2.1), 'altar_stone': ('graveyard', 'altar-stone', 0, -2.4), 'column': ('graveyard', 'column-large', 1, 5.0),
    'urn': ('graveyard', 'urn-round', 1, 0.9), 'iron_fence': ('graveyard', 'iron-fence', 0, -2.2), 'iron_fence_broken': ('graveyard', 'iron-fence-damaged', 0, -2.2),
    'iron_gate': ('graveyard', 'iron-fence-border-gate', 0, -2.4), 'lightpost': ('graveyard', 'lightpost-single', 1, 3.8),
    'pine_crooked': ('graveyard', 'pine-crooked', 1, 7.0), 'trunk': ('graveyard', 'trunk-long', 0, 3.6),
    'rocks_tall': ('graveyard', 'rocks-tall', 1, 2.4), 'candles': ('graveyard', 'candle-multiple', 1, 0.45), 'bench': ('graveyard', 'bench-damaged', 0, -2.0),
    # Pirate Kit
    'wreck': ('pirate', 'ship-wreck', 0, -17), 'rowboat': ('pirate', 'boat-row-small', 0, -4.6), 'barrel': ('pirate', 'barrel', 1, 1.0),
    'chest': ('pirate', 'chest', 0, 0.9), 'rocks_sand_a': ('pirate', 'rocks-sand-a', 1, 4.0), 'rocks_sand_b': ('pirate', 'rocks-sand-b', 1, 4.5),
    # Nature Kit
    'cactus': ('nature', 'cactus_tall', 1, 3.4), 'canoe': ('nature', 'canoe', 0, -4.4), 'log': ('nature', 'log', 0, -3.2),
    'stump_old': ('nature', 'stump_old', 1, 1.2), 'mushroom_tall': ('nature', 'mushroom_redTall', 1, 3.2),
    'rock_large': ('nature', 'rock_largeA', 1, 2.6), 'rock_tall': ('nature', 'rock_tallA', 1, 4.0), 'plant_bush': ('nature', 'plant_bushLargeTriangle', 1, 1.4),
    'statue_obelisk': ('nature', 'statue_obelisk', 1, 5.0), 'statue_column': ('nature', 'statue_columnDamaged', 1, 3.6), 'statue_head': ('nature', 'statue_head', 1, 3.4),
    'lily': ('nature', 'lily_large', 1, -1.4),
    # Castle Kit
    'wall_ruin': ('castle', 'wall-half', 0, 2.6),
    # Fantasy Town Kit
    'fountain': ('town', 'fountain-round', 1, -4.4), 'hedge': ('town', 'hedge-large', 0, -3.0), 'cart': ('town', 'cart', 0, -3.0),
}

def find(root, kit, name):
    for sub in ('Models/GLB format', 'Models/GLTF format', 'Models'):
        p = os.path.join(root, kit, sub, name + '.glb')
        if os.path.exists(p):
            return p
    return None

def load_glb(path):
    b = open(path, 'rb').read()
    magic, ver, length = struct.unpack('<III', b[:12])
    off, js, bin_ = 12, None, None
    while off < length:
        cl, ct = struct.unpack('<II', b[off:off + 8])
        data = b[off + 8:off + 8 + cl]
        off += 8 + cl
        if ct == 0x4E4F534A: js = json.loads(data)
        elif ct == 0x004E4942: bin_ = data
    return js, bin_

CT = {5120: np.int8, 5121: np.uint8, 5122: np.int16, 5123: np.uint16, 5125: np.uint32, 5126: np.float32}
NC = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}

def accessor(js, bin_, i):
    a = js['accessors'][i]
    bv = js['bufferViews'][a['bufferView']]
    n = NC[a['type']]
    dt = np.dtype(CT[a['componentType']])
    stride = bv.get('byteStride') or n * dt.itemsize
    base = bv.get('byteOffset', 0) + a.get('byteOffset', 0)
    out = np.empty((a['count'], n), dtype=dt)
    for k in range(a['count']):
        out[k] = np.frombuffer(bin_, dtype=dt, count=n, offset=base + k * stride)
    return out

def node_matrix(node):
    if 'matrix' in node:
        return np.array(node['matrix'], dtype=np.float64).reshape(4, 4).T
    m = np.eye(4)
    if 'scale' in node: m = np.diag(list(node['scale']) + [1.0]) @ m
    if 'rotation' in node:
        x, y, z, w = node['rotation']
        r = np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
        mm = np.eye(4); mm[:3, :3] = r; m = mm @ m
    if 'translation' in node:
        t = np.eye(4); t[:3, 3] = node['translation']; m = t @ m
    return m

def triangles(js, bin_, path):
    """Every triangle of the model as (3 positions, uv centroid or None, material factor colour or None, image index or None)."""
    tex = None
    if js.get('images'):
        iv = js['bufferViews'][js['images'][0]['bufferView']] if 'bufferView' in js['images'][0] else None
        if iv is not None:
            import io
            tex = Image.open(io.BytesIO(bin_[iv.get('byteOffset', 0):iv.get('byteOffset', 0) + iv['byteLength']])).convert('RGB')
        else:
            uri = js['images'][0]['uri']
            tex = Image.open(os.path.join(os.path.dirname(path), uri)).convert('RGB')
    out = []
    def walk(ni, parent):
        node = js['nodes'][ni]
        m = parent @ node_matrix(node)
        if 'mesh' in node:
            for prim in js['meshes'][node['mesh']]['primitives']:
                pos = accessor(js, bin_, prim['attributes']['POSITION']).astype(np.float64)
                pos = (np.c_[pos, np.ones(len(pos))] @ m.T)[:, :3]
                uv = accessor(js, bin_, prim['attributes']['TEXCOORD_0']).astype(np.float64) if 'TEXCOORD_0' in prim['attributes'] else None
                idx = accessor(js, bin_, prim['indices'])[:, 0].astype(np.int64) if 'indices' in prim else np.arange(len(pos))
                mat = js['materials'][prim['material']] if 'material' in prim else {}
                pbr = mat.get('pbrMetallicRoughness', {})
                factor = pbr.get('baseColorFactor', [1, 1, 1, 1])[:3]
                textured = 'baseColorTexture' in pbr and tex is not None
                for t in range(0, len(idx) - 2, 3):
                    a, b, c = idx[t:t + 3]
                    col = None
                    if textured and uv is not None:
                        u, v = uv[[a, b, c]].mean(axis=0)
                        px = tex.getpixel((int(min(max(u, 0), 0.9999) * tex.width), int(min(max(v, 0), 0.9999) * tex.height)))
                        col = [px[0] / 255, px[1] / 255, px[2] / 255]
                    else:
                        col = [f for f in factor]
                    out.append((pos[[a, b, c]], col))
        for c in node.get('children', []): walk(c, m)
    scene = js['scenes'][js.get('scene', 0)]
    for ni in scene['nodes']: walk(ni, np.eye(4))
    return out

def classify(rgb):
    r, g, b = rgb
    mx, mn = max(rgb), min(rgb)
    sat = (mx - mn) / mx if mx > 0 else 0
    if g > r * 1.08 and g > b * 1.08 and sat > 0.18: return 2  # leaf
    if r > g * 1.12 and g > b * 1.05 and sat > 0.28: return 1  # wood
    return 0  # stone

def bake(tris):
    pts = np.concatenate([t[0] for t in tris])
    lo, hi = pts.min(axis=0), pts.max(axis=0)
    span = np.maximum(hi - lo, 1e-6)
    q = np.round((pts - lo) / span * 65535 - 32768).astype(np.int32)
    uniq, inv = np.unique(q, axis=0, return_inverse=True)
    inv = inv.reshape(-1)
    faces = []
    for k, (p, col) in enumerate(tris):
        i = inv[k * 3:k * 3 + 3]
        if len({*i}) < 3: continue
        faces.append((i, col))
    blob = bytearray()
    blob += struct.pack('<HH', len(uniq), len(faces))
    blob += struct.pack('<6f', *lo, *hi)
    blob += uniq.astype('<i2').tobytes()
    for i, col in faces:
        blob += struct.pack('<3H', *[int(x) for x in i])
    for i, col in faces:
        blob += struct.pack('<4B', classify(col), *[int(round(min(max(c, 0), 1) * 255)) for c in col])
    return bytes(blob), lo, hi, len(uniq), len(faces)

def main():
    root = sys.argv[1]
    index, pack, total = {}, {}, 0
    for mid, (kit, name, rnd, fit) in MODELS.items():
        p = find(root, kit, name)
        if not p:
            print('missing', mid, kit, name)
            continue
        js, b = load_glb(p)
        tris = triangles(js, b, p)
        pts = np.concatenate([t[0] for t in tris])
        ext = pts.max(axis=0) - pts.min(axis=0)
        k = (fit / ext[1]) if fit > 0 else (-fit / max(ext[0], ext[2]))
        tris = [(t[0] * k, t[1]) for t in tris]
        pts = np.concatenate([t[0] for t in tris])
        shift = np.array([(pts[:, 0].max() + pts[:, 0].min()) / 2, pts[:, 1].min(), (pts[:, 2].max() + pts[:, 2].min()) / 2]) # stood on the ground, its footprint centred on the origin
        tris = [(t[0] - shift, t[1]) for t in tris]
        blob, lo, hi, nv, nt = bake(tris)
        pack[mid] = base64.b64encode(blob).decode()
        total += len(blob)
        index[mid] = {'kit': kit, 'x0': round(float(lo[0]), 3), 'x1': round(float(hi[0]), 3), 'y0': round(float(lo[1]), 3), 'y1': round(float(hi[1]), 3), 'z0': round(float(lo[2]), 3), 'z1': round(float(hi[2]), 3), 'round': bool(rnd), 'tris': nt}
        print(f'{mid:20s} {kit:10s} {name:28s} v={nv:4d} t={nt:4d} {len(blob):6d} B  size={hi[0]-lo[0]:.2f} x {hi[1]-lo[1]:.2f} x {hi[2]-lo[2]:.2f}')
    os.makedirs(OUT, exist_ok=True)
    with open(os.path.join(OUT, 'index.ts'), 'w') as f:
        f.write('/** The arena models (generated by tools/models/bake_models.py: CC0 pieces of Kenney\'s kits, kenney.nl/assets, credited in CREDITS.md): each one\'s box in its own units (metres), the kit it comes from and whether its footprint is round. Data only. */\n\n')
        f.write("export type ModelKit = 'graveyard' | 'nature' | 'castle' | 'pirate' | 'survival' | 'town';\n\n")
        f.write('export interface ModelInfo {\n  kit: ModelKit;\n  x0: number;\n  x1: number;\n  y0: number;\n  y1: number;\n  z0: number;\n  z1: number;\n  round: boolean; // a standing thing: its footprint a circle, else a box\n  tris: number;\n}\n\n')
        f.write('export const MODEL_INFO: Readonly<Record<string, ModelInfo>> = {\n')
        for k, v in index.items():
            box = ', '.join(f"{a}: {v[a]}" for a in ('x0', 'x1', 'y0', 'y1', 'z0', 'z1'))
            f.write("  %s: { kit: '%s', %s, round: %s, tris: %d },\n" % (k, v['kit'], box, 'true' if v['round'] else 'false', v['tris']))
        f.write('};\n')
    with open(os.path.join(OUT, 'pack.ts'), 'w') as f:
        f.write('/** The arena models\' triangles (generated by tools/models/bake_models.py; read by render/modelKit.ts): base64 of each model\'s bytes: its point and face counts, its box, its points as 16-bit values within it, its faces as indices, and each face\'s material class and colour. Data only. */\n\n')
        f.write('export const MODEL_PACK: Readonly<Record<string, string>> = {\n')
        for k, v in pack.items():
            f.write(f"  {k}: '{v}',\n")
        f.write('};\n')
    kits = {'graveyard': ('Graveyard Kit 5.0', 'https://kenney.nl/assets/graveyard-kit'), 'nature': ('Nature Kit', 'https://kenney.nl/assets/nature-kit'), 'castle': ('Castle Kit', 'https://kenney.nl/assets/castle-kit'),
            'pirate': ('Pirate Kit', 'https://kenney.nl/assets/pirate-kit'), 'survival': ('Survival Kit', 'https://kenney.nl/assets/survival-kit'), 'town': ('Fantasy Town Kit 2.0', 'https://kenney.nl/assets/fantasy-town-kit')}
    with open(os.path.join(OUT, 'CREDITS.md'), 'w') as f:
        f.write('# Credits: the arena models\n\nThe pieces of the arenas that are models (`pack.ts`, drawn by `src/render/modelKit.ts`) are cut from the kits of **Kenney** (www.kenney.nl),\nreleased under **Creative Commons Zero (CC0 1.0)**, http://creativecommons.org/publicdomain/zero/1.0/ , which asks for no credit; it is given.\nThey were made again for the game by `tools/models/bake_models.py`: each model welded and flattened, its colours kept only as light and dark\n(the game lays the region\'s own over them), its size fitted to the metres it is stood at.\n\n')
        for kit, (name, url) in kits.items():
            ids = [k for k, v in index.items() if v['kit'] == kit]
            if ids:
                f.write(f'## {name}\n{url}\n\n' + ', '.join(f'`{i}`' for i in ids) + '\n\n')
    print(len(pack), 'models,', total, 'bytes')

main()
