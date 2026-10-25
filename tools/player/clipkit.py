"""How a clip is written: a handful of key poses on the game's own clock, solved into a pose for every 60 Hz frame (solve.py).

    def light1(m):                                    # m: the move's Timing, read from the game's data (build/game.json), so the keys fall on its frames
        c = Clip(m, 'cane.light1')
        c.key(0, pelvis=(0, .92, 0), armR=Grip((-.30, 1.0, .35), aim=(0, -1, .2)), footR=Foot(-.12, 0), footL=Foot(.12, 0))
        c.key(m.hit0 - 4, ..., ease='out')
        return c

Channels (units: metres and degrees, the game's axes: +z ahead, the figure's right at -x; positions are in the actor's own frame, which travels with it, except
a foot's, which is in the clip's world, where it stays put while the actor walks on past it; `space='root'` puts a foot in the actor's frame):
  pelvis (x, y, z)          where the hips are; standing, (0, .92, 0)      pelvis_rot, torso, head (x, y, z) degrees, 'YXZ': x pitches forward
  look (x, y, z)            a point the head turns to (adds to `head`)
  armR / armL               Swing(reach=(az, el, dist), blade=(az, el), toward, roll, pole)   the wrist `dist` from the shoulder at that bearing, the weapon along `blade`, its edge facing `toward`
                            Grip(pos, aim, edge, pole)   the same by vectors: the wrist at pos, the weapon pointing down `aim`, its edge toward `edge`, the elbow bent toward `pole`
                            Arm(arm=(x, y, z), elbow=x, hand=(x, y, z))   the joints' own angles
  footR / footL             Foot(x, z, yaw, pitch, lift, space, out)   a boot on the ground there (its toe or heel on it as it is pitched), `lift` above it
                            Leg(thigh=(x, y, z), knee=x, foot=(x, y, z))   the joints' own angles
A key holds the channels it names; between keys each channel runs on from the keys that name it. `ease` is how the stretch that ends at a key moves: 'cr' a spline
through the keys (the default: it carries speed through them), 'smooth', 'linear', 'out' (fast, then settling), 'in' (slow, then fast), 'snap' (a blow's), 'hold'
(stays until the key); `still=True` brings the key to rest (a spline's speed there is nothing).
"""
import json, os
import numpy as np
import solve as S
import lantern

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = json.load(open(os.path.join(HERE, 'build', 'game.json')))
LENGTH = {'cane': 0.94, 'axe': 0.8, 'razor': 0.275, 'cutlass': 0.77, 'rapier': 1.13}  # from the wrist along the weapon's line to its business end


def Grip(pos, aim=None, edge=None, pole=None):
    d = {'grip': pos}
    for k, v in (('aim', aim), ('edge', edge), ('pole', pole)):
        if v is not None:
            d[k] = v
    return d


def Swing(reach, blade=None, toward=None, roll=0.0, pole=None):
    """The weapon arm by angles: the wrist `reach` = (az, el, dist) from the shoulder (az degrees to the right of ahead, el up, dist metres, at most .58: the actor's directions, so a
    sweep of az is an arc about the shoulder), the weapon pointing `blade` = (az, el), its edge facing `toward` (a direction: the way a cut is going) or turned `roll` degrees."""
    d = {'reach': tuple(reach)}
    if blade is not None:
        d['blade'] = tuple(blade)
    if toward is not None:
        d['toward'] = tuple(toward)
    d['roll'] = (roll,)
    if pole is not None:
        d['pole'] = tuple(pole)
    return d


def Arm(arm=(0, 0, 0), elbow=0.0, hand=(0, 0, 0)):
    return {'arm': arm, 'elbow': (elbow,), 'hand': hand}


def Foot(x, z, yaw=0.0, pitch=0.0, lift=0.0, space='world', out=0.0):
    return {'x': (x,), 'z': (z,), 'yaw': (yaw,), 'pitch': (pitch,), 'lift': (lift,), 'out': (out,), 'space': space}


def Leg(thigh=(0, 0, 0), knee=0.0, foot=(0, 0, 0)):
    return {'thigh': thigh, 'knee': (knee,), 'foot': foot}


class Timing:
    """A move as the game has it: its length and the windows that decide when the blow lands, where the body travels, when an item takes effect."""

    def __init__(self, weapon, move, data):
        self.weapon, self.move, self.d = weapon, move, data
        self.frames = data['frames']
        hit = data.get('hit')
        self.hit = hit
        self.hit0, self.hit1 = (hit['window'] if hit else (None, None))
        self.arc = hit['arc'] if hit else None
        mo = data.get('motion')
        self.motion = (mo['window'][0], mo['window'][1], mo['distance'], mo['dir']) if mo else None
        self.item = data.get('item')
        self.use = data.get('use')
        self.shot = data['shot']['frame'] if data.get('shot') else None
        self.volley = data['volley']['frame'] if data.get('volley') else None
        self.parry = tuple(data['parry']) if data.get('parry') else None
        self.iframes = tuple(data['iframes']) if data.get('iframes') else None
        self.cancel, self.release = data.get('cancel'), data.get('release')
        self.hold = bool(data.get('hold'))
        self.length = LENGTH.get(weapon, 0.94)


def timing(weapon, move):
    """Timing for `move` with `weapon` in hand (the reactions and the one-off moves are the same whichever weapon)."""
    data = GAME['moves'][weapon].get(move) or GAME['reactions'].get(move)
    return Timing(weapon, move, data)


def smooth(u):
    return u * u * (3 - 2 * u)


SHAPES = {'smooth': smooth, 'linear': lambda u: u, 'out': lambda u: 1 - (1 - u) ** 2, 'in': lambda u: u * u, 'snap': lambda u: 1 - (1 - u) ** 3, 'hold': lambda u: 0.0 if u < 1 else 1.0}


def flatten(v):
    return np.atleast_1d(np.asarray(v, float))


class Series:
    """One channel's numbers over time: [(t, array, ease, still)], read at any t."""

    def __init__(self, loop=None):
        self.k = []
        self.loop = loop  # the period of a cycle, else None

    def add(self, t, v, ease, still):
        self.k.append((float(t), flatten(v), ease, still))
        self.k.sort(key=lambda a: a[0])

    def keys(self):
        if not self.loop:
            return self.k
        T = self.loop
        return [(t - T, *r) for t, *r in self.k] + self.k + [(t + T, *r) for t, *r in self.k]  # a cycle has its own ends on either side

    def at(self, t):
        ks = self.keys()
        if len(self.k) == 1:
            return self.k[0][1]
        if self.loop:
            t = t % self.loop
        if t <= ks[0][0]:
            return ks[0][1]
        if t >= ks[-1][0]:
            return ks[-1][1]
        i = max(j for j in range(len(ks)) if ks[j][0] <= t)
        t0, t1 = ks[i][0], ks[i + 1][0]
        u = (t - t0) / max(t1 - t0, 1e-6)
        ease = ks[i + 1][2]
        if ease != 'cr':
            return ks[i][1] + (ks[i + 1][1] - ks[i][1]) * SHAPES[ease](u)
        h = t1 - t0
        m0, m1 = self.tangent(ks, i) * h, self.tangent(ks, i + 1) * h
        u2, u3 = u * u, u * u * u
        return (2 * u3 - 3 * u2 + 1) * ks[i][1] + (u3 - 2 * u2 + u) * m0 + (3 * u2 - 2 * u3) * ks[i + 1][1] + (u3 - u2) * m1

    @staticmethod
    def tangent(ks, i):
        if ks[i][3] or i == 0 or i == len(ks) - 1:
            return np.zeros_like(ks[i][1])
        return (ks[i + 1][1] - ks[i - 1][1]) / max(ks[i + 1][0] - ks[i - 1][0], 1e-6)


class Clip:
    def __init__(self, m, cid, frames=None, loop=False, root_speed=0.0):
        self.m, self.id = m, cid
        self.weapon = m.weapon  # the weapon in the hand (the previews show it)
        self.props = []  # what the off-hand takes up (the figure's `prop:<id>` groups)
        self.drawn = False  # the sword-cane's blade is out
        self.frames = int(frames if frames is not None else m.frames)
        self.loop = loop
        self.auto_pelvis = not loop  # the pelvis is brought down to where the legs reach (solve.cap_pelvis); a loop that has done it itself says so
        self.root_speed = root_speed  # metres a frame the actor travels through a loop (the feet of a stride are in its frame, and slide back at this pace)
        self.series = {}  # (channel, entry) -> Series
        self.text = {}  # (channel, entry) -> a string entry
        self.markers = {}
        self.poses = None
        self.rigs = None

    def key(self, t, ease='cr', still=False, eases=None, **channels):
        for name, val in channels.items():
            e = (eases or {}).get(name, ease)
            if isinstance(val, dict):
                for entry, v in val.items():
                    if isinstance(v, str):
                        self.text[(name, entry)] = v
                    else:
                        self.series.setdefault((name, entry), Series(self.frames if self.loop else None)).add(t, v, e, still)
            else:
                self.series.setdefault((name, None), Series(self.frames if self.loop else None)).add(t, val, e, still)
        return self

    def steps(self, side, start, moves, h=0.07):
        """A boot's footwork: it stands at `start` = (x, z, yaw) in the clip's world, and for each (lift, land, x, z[, yaw[, height]]) in `moves` it is picked up at frame `lift`, swung
        through the air and set down at `land` at that place (heel first, toe off at the start, a smooth pace so it is still as it leaves and as it lands), where it stays until the next
        move. `side` is 'footR' or 'footL'. Use it for the boot you are stepping with, and `key` for the boot that stays."""
        x, z, yaw = start
        self.key(0, ease='linear', **{side: Foot(x, z, yaw)})
        for mv in moves:
            t0, t1, nx, nz = mv[:4]
            nyaw = mv[4] if len(mv) > 4 else yaw
            hh = mv[5] if len(mv) > 5 else h
            self.key(t0, ease='linear', **{side: Foot(x, z, yaw)})
            frames = range(int(np.ceil(t0)) + 1, int(np.floor(t1)))
            for f in frames:
                u = (f - t0) / (t1 - t0)
                e = u * u * (3 - 2 * u)
                pitch = 22 * max(0.0, 1 - u / 0.4) ** 2 - 10 * max(0.0, (u - 0.7) / 0.3) ** 1.5
                px, pz = x + (nx - x) * e, z + (nz - z) * e
                pz += S.roll_shift(pitch * np.pi / 180) * (max(0.0, 1 - u / 0.3) if pitch > 0 else max(0.0, (u - 0.7) / 0.3))
                self.key(f, ease='linear', **{side: Foot(px, pz, yaw + (nyaw - yaw) * e, pitch=pitch, lift=hh * np.sin(np.pi * u) ** 1.2)})
            self.key(t1, ease='linear', **{side: Foot(nx, nz, nyaw)})
            x, z, yaw = nx, nz, nyaw
        return self

    def mark(self, **marks):
        self.markers.update(marks)
        return self

    def root(self, t):
        """Where the actor's root is at frame t, in the clip's world: it travels along +z (or back) through the move's motion window, or at a steady pace through a loop."""
        if self.loop:
            return np.array([0.0, 0.0, self.root_speed * t])
        mo = self.m.motion
        if not mo:
            return np.zeros(3)
        w0, w1, dist, kind = mo
        sign = -1.0 if kind == 'back' else 1.0
        return np.array([0.0, 0.0, sign * dist * min(1.0, max(0.0, (t - w0) / (w1 - w0)))])

    def channels(self, t):
        out = {}
        for (name, entry), s in self.series.items():
            v = s.at(t)
            if entry is None:
                out[name] = v
            else:
                d = out.setdefault(name, {})
                d[entry] = v if len(v) > 1 else float(v[0])
        for (name, entry), txt in self.text.items():
            out.setdefault(name, {})[entry] = txt
        return out

    def solve(self):
        n = self.frames if self.loop else self.frames + 1
        self.poses, self.rigs = [], []
        for f in range(n):
            ch = self.channels(f)
            drop = 0.0
            if self.auto_pelvis:
                ch, drop = S.cap_pelvis(ch, self.root(f))
            pose, rig = S.solve(ch, self.root(f))
            rig.capped = drop
            self.poses.append(pose)
            self.rigs.append(rig)
        lantern.add_swing(self)
        return self


def hit_path(m, f):
    """Where the game's hit sphere is at frame f of its window: centre (in the actor's frame) and radius. Arc degrees: 0 ahead, + toward the attacker's right (-x)."""
    h = m.hit
    w0, w1 = h['window']
    a0, a1 = h['arc']
    a = np.radians(a0 + (a1 - a0) * min(1.0, max(0.0, (f - w0) / max(1, w1 - w0))))
    return np.array([-np.sin(a) * h['reach'], h['height'], np.cos(a) * h['reach']]), h['radius']
