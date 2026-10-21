"""The kit a creature's script is handed (docs/MODELS.md): its data, palette, mesh, rig and clips.

    def build(k):
        k.r.bone(...); with k.m.on('spine'): k.m.lathe(...)
        a = k.clip('atk.sweep')       # frames, strike and end are the game's
        a.key(0, READY).key(a.strike - 4, WOUND, 'inout').key(a.strike, HIT, 'in')...

`k.need()` lists every clip the game asks of it; `k.attacks()` the attack clips among them.
"""

import bpy

from .anim import Clip, write
from .geo import Mesh
from .palette import Palette
from .rig import Rig

LOOPS = {'idle', 'move', 'stoop'}
BUDGET = {'lesser': 1600, 'greater': 2400, 'named': 2600, 'great_old_one': 5000, 'outer_god': 5000, 'ally': 2200}


class Kit:
    def __init__(self, cid, spec, fps=60):
        self.id, self.spec, self.fps = cid, spec, fps
        body = spec['body']
        self.H, self.R, self.reach, self.hover = body['height'], body['radius'], body['reach'], body['hover']
        look = spec['look']
        self.look = look
        self.pal = Palette(look.get('palette'), look.get('glow'))
        eld = spec.get('variants', {}).get('eldritch', {}).get('look') or {}
        self.eldritch_glow = eld.get('glow')
        self.m = Mesh()
        self.r = Rig()
        self.clips = {}
        self.uv_density = 1.6 * (2.0 / max(self.H, 0.5)) ** 0.5  # UVs per metre: the game's 64-texel textures at about a hundred to the metre on a man-sized body
        self.notes = []  # anything the build should say of it

    # ---- what the game asks ----------------------------------------------------------------------
    def need(self):
        return list(self.spec['clips'].keys())

    def attacks(self):
        return [c for c in self.need() if c.startswith('atk.')]

    def info(self, name):
        return self.spec['clips'][name]

    def clip(self, name, frames=None, **meta):
        """A clip the game asks for: an attack's or a reaction's length is the game's (frames given
        must agree); a loop (idle, move, stoop) takes the `frames` given. `stride` on `move` is the
        metres one cycle carries the body (the game keeps the feet from sliding by it)."""
        need = self.spec['clips'].get(name)
        assert need is not None, f'{self.id}: the game asks for no clip {name} (asks for {self.need()})'
        loop = bool(need.get('loop'))
        if loop:
            assert frames, f'{self.id}: {name} loops: give its frames'
        else:
            assert frames in (None, need['frames']), f'{self.id}: {name} is {need["frames"]} frames in the game'
            frames = need['frames']
        for k in ('strike', 'end'):
            if k in need:
                meta.setdefault(k, need[k])
        c = Clip(name, frames, loop, **meta)
        self.clips[name] = c
        return c

    # ---- making it -------------------------------------------------------------------------------
    def finish(self):
        """The armature, the mesh objects bound to it, and every clip as an action."""
        missing = [n for n in self.need() if n not in self.clips]
        assert not missing, f'{self.id}: clips not made: {missing}'
        rig = self.r.build(self.id)
        objs = [_mesh(self, rig, layer) for layer in [''] + sorted(self.m.layers)]
        write(rig, list(self.clips.values()))
        return rig, objs

    def budget(self):
        return BUDGET[self.spec['tier']]


def _mesh(kit, rig, layer):
    m = kit.m
    chosen = set(m.layers.get(layer, [])) if layer else set(range(len(m.faces))) - {i for f in m.layers.values() for i in f}
    faces = [f for i, f in enumerate(m.faces) if i in chosen]
    used = sorted({v for f in faces for v in f[0]})
    remap = {v: i for i, v in enumerate(used)}
    name = 'body' + (f'@{layer}' if layer else '')
    me = bpy.data.meshes.new(name)
    me.from_pydata([m.verts[v] for v in used], [], [tuple(remap[v] for v in f[0]) for f in faces])
    me.update()
    for mname in m.materials:
        mat = bpy.data.materials.get(mname) or bpy.data.materials.new(mname)
        me.materials.append(mat)
    col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    uv = me.uv_layers.new(name='UVMap')
    d = kit.uv_density
    for poly, f in zip(me.polygons, faces):
        poly.material_index = f[1]
        poly.use_smooth = f[4]
        n = poly.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        for li in poly.loop_indices:
            col.data[li].color = (*f[2], f[3])
            co = me.vertices[me.loops[li].vertex_index].co
            u, v = [(co[1], co[2]), (co[0], co[2]), (co[0], co[1])][ax]
            uv.data[li].uv = (u * d, v * d)
    me.color_attributes.active_color = col
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    groups = {}
    for old, new in remap.items():
        w = m.weights[old]
        total = sum(w.values())
        for b, k in w.items():
            assert b in kit.r.bones, f'{kit.id}: a part is bound to no bone {b}'
            g = groups.get(b) or ob.vertex_groups.new(name=b)
            groups[b] = g
            g.add([new], k / total, 'REPLACE')
    ob.parent = rig
    mod = ob.modifiers.new('rig', 'ARMATURE')
    mod.object = rig
    return ob
