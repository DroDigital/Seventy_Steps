"""Checks of a solved clip that need no picture (numpy only; clipkit.Clip.solve() first): the things a person looking at it would catch late. Each returns lines for a
person to read (`WARN ...`), none stops a bake: a blow may be meant to go further than the guidelines. `report(clip)` is what animate.py and check.py print.

  reach     a hand or foot asked for what the limb cannot reach (it is stretched to its length: the weapon is off its mark)
  hit       the weapon's business end against the game's hit sphere, through the hit window: it should pass through it, not beside it, and not far beyond it
  limbs     an elbow, knee, thigh, head or torso past what a body does; a hand through the chest
  ground    the weapon's tip, a hand or the pelvis below the floor
  pops      a joint turning more than it can in one 60 Hz frame, or a weapon tip moving faster than a blow can
  slide     a boot meant to be planted (no lift) that moves along the ground
"""
import numpy as np
import frame as F
import solve as S
from clipkit import hit_path, LENGTH

DEG = 180 / np.pi
LIMITS = {  # degrees: (lowest, highest) of the joint's own angle
    'knee': (-2, 150), 'elbow': (-2, 150), 'thigh': (-135, 45), 'head_yaw': (-85, 85), 'head_pitch': (-55, 60), 'torso_yaw': (-80, 80), 'torso_pitch': (-45, 75), 'torso_roll': (-45, 45),
}
POP = 75.0  # degrees a joint may turn in one frame (a roll's whole-body spin is exempt: `spin_ok`)
TIP_FAST = 0.9  # metres a weapon's tip may travel in one frame (54 m/s)
SLIDE = 0.02  # metres a planted boot may creep in one frame


def angle(q):
    """The rotation angle of a quaternion (w, x, y, z), degrees."""
    return 2 * np.degrees(np.arccos(min(1.0, abs(q[0]))))


def signed_x(q):
    """The rotation about x of a quaternion known to turn about x alone (a knee, an elbow): degrees, signed."""
    q = -q if q[0] < 0 else q
    return 2 * np.degrees(np.arctan2(q[1], q[0]))


def frames_of(clip):
    return range(len(clip.rigs))


def blade(clip, rig):
    """The weapon in the right hand in the actor's frame: the grip and the business end."""
    g, t, _ = S.tip_of(rig, 'R', LENGTH.get(clip.weapon, 0.94))
    return g, t


def seg_dist(p, a, b):
    ab = b - a
    t = np.clip(np.dot(p - a, ab) / max(np.dot(ab, ab), 1e-9), 0, 1)
    return float(np.linalg.norm(p - (a + ab * t)))


def reach_lines(clip):
    out = []
    worst = {}
    for f, r in enumerate(clip.rigs):
        for k, v in r.over.items():
            if v > worst.get(k, (0, 0))[0]:
                worst[k] = (v, f)
    for k, (v, f) in sorted(worst.items()):
        if v > 0.02:
            out.append(f'WARN reach: {k} is {v * 100:.0f} cm out of reach at frame {f} (the limb is stretched; move the target or the pelvis)')
    return out


def hit_lines(clip):
    m = clip.m
    if not m.hit or clip.loop:
        return []
    out = []
    h0, h1 = m.hit0, m.hit1
    rad = m.hit['radius']
    ds, over = [], []
    for f in range(int(np.floor(h0)), min(int(np.ceil(h1)), len(clip.rigs) - 1) + 1):
        c, _ = hit_path(m, f)
        g, t = blade(clip, clip.rigs[f])
        far = t + (g - t) * 0.5  # the outer half of the weapon is what cuts
        ds.append((seg_dist(c, far, t), f))
        over.append((float(np.linalg.norm(t[[0, 2]])) - (float(np.linalg.norm(c[[0, 2]])) + rad), f))
    best = min(ds)
    worst = max(ds)
    if worst[0] > 1.25 * rad:
        out.append(f'WARN hit: at frame {worst[1]} the blade is {worst[0] * 100:.0f} cm from the hit sphere\'s centre (radius {rad * 100:.0f}): it is not where the blow lands')
    if best[0] > 0.7 * rad:
        out.append(f'WARN hit: the blade never gets within {best[0] * 100:.0f} cm of the hit sphere\'s centre (best at frame {best[1]}; radius {rad * 100:.0f})')
    far = max(over)
    if far[0] > 0.3:
        out.append(f'WARN hit: the tip is {far[0] * 100:.0f} cm beyond the far side of the hit sphere at frame {far[1]}')
    out.append(f'info hit: blade to the sphere\'s centre {best[0] * 100:.0f} cm at best (frame {best[1]}), {worst[0] * 100:.0f} cm at worst (radius {rad * 100:.0f})')
    return out


def limb_lines(clip):
    out = []
    seen = {}

    def note(name, f, v, lo, hi):
        if v < lo - 0.5 or v > hi + 0.5:
            seen.setdefault(name, (f, v, lo, hi))

    for f, (pose, r) in enumerate(zip(clip.poses, clip.rigs)):
        for s in 'RL':
            note(f'knee{s}', f, signed_x(pose[f'knee{s}']), *LIMITS['knee'])
            note(f'elbow{s}', f, -signed_x(pose[f'elbow{s}']), *LIMITS['elbow'])
            note(f'thigh{s}', f, -S.euler_of(F.quat_to_mat(pose[f'leg{s}']))[0], *LIMITS['thigh'])
        eh = S.euler_of(F.quat_to_mat(pose['head']))
        note('head_pitch', f, eh[0], *LIMITS['head_pitch'])
        note('head_yaw', f, eh[1], *LIMITS['head_yaw'])
        et = S.euler_of(F.quat_to_mat(pose['torso']))
        note('torso_pitch', f, et[0], *LIMITS['torso_pitch'])
        note('torso_yaw', f, et[1], *LIMITS['torso_yaw'])
        note('torso_roll', f, et[2], *LIMITS['torso_roll'])
        T = r.T
        for s in 'RL':  # a wrist or an elbow inside the chest
            for j in (f'hand{s}', f'elbow{s}'):
                p = np.linalg.inv(T) @ np.append(r.world[j][:3, 3], 1.0)
                if 0.0 < p[1] < 0.6 and (p[0] / 0.2) ** 2 + (p[2] / 0.12) ** 2 < 1.0:
                    seen.setdefault(f'{j} in the chest', (f, 0.0, 0.0, 0.0))
    for name, (f, v, lo, hi) in sorted(seen.items()):
        out.append(f'WARN limbs: {name} at frame {f}' + (f' is {v:.0f} deg (a body does {lo:.0f} to {hi:.0f})' if hi else ''))
    return out


def ground_lines(clip):
    out = []
    low_tip = (9.0, 0)
    low_hip = (9.0, 0)
    for f, r in enumerate(clip.rigs):
        g, t = blade(clip, r)
        low_tip = min(low_tip, (float(t[1]), f))
        low_hip = min(low_hip, (float(r.pelvis[1]), f))
    if low_tip[0] < -0.01 and not clip.m.hold:
        out.append(f'WARN ground: the weapon\'s tip is {-low_tip[0] * 100:.0f} cm below the floor at frame {low_tip[1]}')
    if low_hip[0] < 0.25 and clip.id not in ('roll', 'death'):
        out.append(f'WARN ground: the pelvis is only {low_hip[0] * 100:.0f} cm up at frame {low_hip[1]}')
    return out


def pop_lines(clip, spin_ok=False):
    out = []
    n = len(clip.poses)
    worst = {}
    tipw = (0.0, 0)
    for f in range(n if clip.loop else n - 1):
        a, b = clip.poses[f], clip.poses[(f + 1) % n]
        for j in F.ORDER:
            if j == 'body' and spin_ok:
                continue
            q = F.quat_mul(F.quat_conj(a[j]), b[j])
            ang = angle(q)
            if ang > worst.get(j, (0, 0))[0]:
                worst[j] = (ang, f)
        ta, tb = blade(clip, clip.rigs[f])[1], blade(clip, clip.rigs[(f + 1) % n])[1]
        tipw = max(tipw, (float(np.linalg.norm(tb - ta)) - float(np.linalg.norm(clip.root((f + 1) % n) - clip.root(f))) * 0, f))
    for j, (ang, f) in sorted(worst.items()):
        if ang > POP and j != 'body':
            out.append(f'WARN pops: {j} turns {ang:.0f} deg between frames {f} and {f + 1}')
        elif ang > POP and not spin_ok:
            out.append(f'WARN pops: the pelvis turns {ang:.0f} deg between frames {f} and {f + 1}')
    if tipw[0] > TIP_FAST:
        out.append(f'WARN pops: the weapon\'s tip moves {tipw[0]:.2f} m in one frame at frame {tipw[1]} ({tipw[0] * 60:.0f} m/s)')
    out.append(f'info pops: fastest tip {tipw[0] * 60:.0f} m/s at frame {tipw[1]}')
    return out


def planted(clip, f, side):
    """(x, z in the clip's world, lift) of a boot at frame f when it is placed by Foot(), else None."""
    spec = clip.channels(f).get('foot' + side)
    if not spec or 'x' not in spec:
        return None
    x, z, lift = float(spec['x']), float(spec['z']), float(spec.get('lift', 0.0))
    if spec.get('space', 'world') != 'world':
        x, z = x + clip.root(f)[0], z + clip.root(f)[2]
    return x, z, lift


def slide_lines(clip):
    out = []
    n = len(clip.poses)
    for s in 'RL':
        worst = (0.0, 0)
        for f in range(n - 1):
            a, b = planted(clip, f, s), planted(clip, f + 1, s)
            if not a or not b or max(a[2], b[2]) > 0.004:
                continue
            d = float(np.hypot(a[0] - b[0], a[1] - b[1]))
            worst = max(worst, (d, f))
        if worst[0] > SLIDE:
            out.append(f'WARN slide: the {s} boot is on the ground and moves {worst[0] * 100:.1f} cm in one frame at frame {worst[1]} (lift it, or key it still)')
    return out


def report(clip, spin_ok=False):
    lines = reach_lines(clip) + hit_lines(clip) + limb_lines(clip) + ground_lines(clip) + pop_lines(clip, spin_ok) + slide_lines(clip)
    return lines
