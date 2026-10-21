"""Poses and clips (docs/MODELS.md).

A pose is a dict: `'bone': (rx, ry, rz)` in degrees about the creature's own axes as they stood at
rest (X its left, so +rx tips an upright bone forward and swings a hanging limb back; Z up, so +rz turns
it to its left; Y its back, so +ry tilts its top to its left), applied X, then Y, then Z, relative to its
parent; a fourth number scales the bone. `'bone:loc'` moves it (x, y, z metres, same axes). A bone a
pose leaves out is at rest. Keys are linear, as the PS1's were; `ease` adds the in-between keys that
ease into a key, so a blow can be slow to gather and quick to fall.
"""

import math

import bpy
from mathutils import Euler, Quaternion, Vector

ZERO = (0.0, 0.0, 0.0)


def _val(p, k):
    v = p.get(k)
    if v is not None:
        return v
    return ZERO if k.endswith(':loc') else (0.0, 0.0, 0.0)


def add(*poses):
    """Poses summed key by key (angles add, scales multiply): a stance plus a breath plus a gait."""
    out = {}
    for p in poses:
        for k, v in p.items():
            if k in out:
                a = out[k]
                s = (a[3] if len(a) > 3 else 1.0) * (v[3] if len(v) > 3 else 1.0)
                out[k] = tuple(a[i] + v[i] for i in range(3)) + ((s,) if (len(a) > 3 or len(v) > 3) else ())
            else:
                out[k] = tuple(v)
    return out


def lerp(a, b, t):
    """The pose t of the way from a to b."""
    out = {}
    for k in set(a) | set(b):
        va, vb = _val(a, k), _val(b, k)
        r = tuple(va[i] + (vb[i] - va[i]) * t for i in range(3))
        if len(va) > 3 or len(vb) > 3:
            sa, sb = (va[3] if len(va) > 3 else 1.0), (vb[3] if len(vb) > 3 else 1.0)
            r += (sa + (sb - sa) * t,)
        out[k] = r
    return out


def scale(p, k):
    """A pose made k times as strong (a smaller breath, a wider swing)."""
    return {n: tuple(x * k for x in v[:3]) + ((1 + (v[3] - 1) * k,) if len(v) > 3 else ()) for n, v in p.items()}


def sym(p):
    """Copies each `.L` entry to its `.R` twin, mirrored (and `.R` to `.L` where `.L` is absent)."""
    out = dict(p)
    for k, v in p.items():
        base, loc = (k[:-4], True) if k.endswith(':loc') else (k, False)
        for a, b in (('.L', '.R'), ('.R', '.L')):
            if base.endswith(a):
                twin = base[:-2] + b + (':loc' if loc else '')
                if twin not in p:
                    out[twin] = (-v[0], v[1], v[2]) if loc else (v[0], -v[1], -v[2]) + tuple(v[3:])
    return out


def mirror(p):
    """The whole pose seen in a mirror: left and right exchanged (a swipe from the other side)."""
    out = {}
    for k, v in p.items():
        loc = k.endswith(':loc')
        base = k[:-4] if loc else k
        name = base[:-2] + ('.R' if base.endswith('.L') else '.L') if base[-2:] in ('.L', '.R') else base
        out[name + (':loc' if loc else '')] = (-v[0], v[1], v[2]) if loc else (v[0], -v[1], -v[2]) + tuple(v[3:])
    return out


def wave(frames, bones, amp, phase_step=0.0, axis=0, cycles=1, at=None):
    """Keys of a travelling wave down a chain (a tail's sway, a tentacle's coil): `amp` degrees on
    `axis`, each bone `phase_step` of a turn behind the last. Returns [(frame, pose)] at `at` frames."""
    at = at or [round(frames * i / 8) for i in range(9)]
    out = []
    for f in at:
        p = {}
        for i, b in enumerate(bones):
            a = amp * math.sin(2 * math.pi * (cycles * f / frames - i * phase_step))
            r = [0.0, 0.0, 0.0]
            r[axis] = a
            p[b] = tuple(r)
        out.append((f, p))
    return out


EASES = {'in': lambda t: t * t, 'out': lambda t: 1 - (1 - t) ** 2, 'inout': lambda t: t * t * (3 - 2 * t)}


class Clip:
    """One animation: `frames` long at 60 a second (the game's step), looping or not; an attack's
    `strike` (the frame its blow lands, its bolt flies or its spell takes) and `end` are the game's."""

    def __init__(self, name, frames, loop=False, **meta):
        self.name, self.frames, self.loop, self.meta = name, int(frames), loop, meta
        self.keys = []

    @property
    def strike(self): return self.meta.get('strike')

    @property
    def end(self): return self.meta.get('end')

    def key(self, frame, pose, ease=None):
        f = int(round(frame))
        assert 0 <= f <= self.frames, f'{self.name}: key {f} outside 0..{self.frames}'
        self.keys = [k for k in self.keys if k[0] != f]
        self.keys.append((f, dict(pose), ease))
        self.keys.sort(key=lambda k: k[0])
        return self

    def keys_from(self, pairs, base=None, ease=None):
        for f, p in pairs:
            self.key(f, add(base, p) if base else p, ease)
        return self

    def pose_at(self, f):
        """The pose at frame f (between keys, as they will play)."""
        ks = self.expanded()
        for (f0, p0), (f1, p1) in zip(ks, ks[1:]):
            if f0 <= f <= f1:
                return lerp(p0, p1, (f - f0) / max(1, f1 - f0))
        return ks[-1][1] if f > ks[-1][0] else ks[0][1]

    def expanded(self):
        assert self.keys and self.keys[0][0] == 0, f'{self.name}: no key at frame 0'
        ks = list(self.keys)
        if self.loop and ks[-1][0] < self.frames:
            ks.append((self.frames, ks[0][1], ks[0][2]))
        if not self.loop and ks[-1][0] < self.frames:
            ks.append((self.frames, ks[-1][1], None))
        out = [(ks[0][0], ks[0][1])]
        for (f0, p0, _), (f1, p1, e) in zip(ks, ks[1:]):
            if e and f1 - f0 >= 4:
                for t in (1 / 3, 2 / 3):
                    out.append((round(f0 + (f1 - f0) * t), lerp(p0, p1, EASES[e](t))))
            out.append((f1, p1))
        return out


def write(ob, clips):
    """Each clip as an action of the armature `ob`, every bone keyed in every clip (the game blends
    them, so a bone one clip left alone would keep another's pose)."""
    bones = ob.data.bones
    rest = {b.name: b.matrix_local.to_3x3().normalized() for b in bones}
    inv = {n: m.inverted() for n, m in rest.items()}
    locs = {k[:-4] for c in clips for _, p, _ in c.keys for k in p if k.endswith(':loc')}
    scales = {k for c in clips for _, p, _ in c.keys for k, v in p.items() if len(v) > 3}
    for k in locs | scales | {k for c in clips for _, p, _ in c.keys for k in p}:
        assert (k[:-4] if k.endswith(':loc') else k) in bones, f'pose names no bone {k}'
    ob.animation_data_create()
    actions = []
    for clip in clips:
        act = bpy.data.actions.new(clip.name)
        act.use_fake_user = True
        slot = act.slots.new(id_type='OBJECT', name=ob.name)
        bag = act.layers.new('motion').strips.new(type='KEYFRAME').channelbag(slot, ensure=True)
        ob.animation_data.action = act
        ob.animation_data.action_slot = slot
        ks = clip.expanded()
        for b in bones:
            n = b.name
            quats, last = [], None
            for f, p in ks:
                r = p.get(n, (0.0, 0.0, 0.0))
                qw = Euler(tuple(math.radians(x) for x in r[:3]), 'XYZ').to_matrix()
                q = (inv[n] @ qw @ rest[n]).to_quaternion()
                if last is not None and last.dot(q) < 0:
                    q.negate()
                last = q
                quats.append((f, q))
            _curves(bag, n, 'rotation_quaternion', [(f, tuple(q)) for f, q in quats])
            if n in locs:
                _curves(bag, n, 'location', [(f, tuple(inv[n] @ Vector(p.get(n + ':loc', ZERO)))) for f, p in ks])
            if n in scales:
                _curves(bag, n, 'scale', [(f, (_scale(p, n),) * 3) for f, p in ks])
        actions.append(act)
    ob.animation_data.action = None
    return actions


def _scale(p, n):
    v = p.get(n)
    return v[3] if v is not None and len(v) > 3 else 1.0


def _curves(bag, bone, prop, keys):
    path = f'pose.bones["{bone}"].{prop}'
    group = bag.groups.get(bone) or bag.groups.new(bone)
    for i in range(len(keys[0][1])):
        fc = bag.fcurves.new(path, index=i)
        fc.group = group
        fc.keyframe_points.add(len(keys))
        co = [x for f, v in keys for x in (float(f), float(v[i]))]
        fc.keyframe_points.foreach_set('co', co)
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
        fc.update()
