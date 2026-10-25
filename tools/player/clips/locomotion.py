"""Standing and going: `idle` (a slow breathing loop the game plays whenever he is still), `walk`, `run` and `sprint` (stride loops: the game blends them by ground speed and
steps them with its own stride clock, so the right heel strikes at the loop's start; src/render/playerPose.ts), and the guard's overlay for each weapon (the upper body
only: a guard is held over whatever the legs are doing).

The strides are made, not keyed by hand: a cycle's boots are put on the ground by the pace they are meant for (a stride's length, how much of it a boot is down),
rolled heel to toe, swung through with the knee lifted, and the pelvis is carried as high as the legs reach and no higher, so a boot is never stretched to its mark.
Everything is in the actor's frame (`space='root'`): a boot that is down slides back through it at the pace the actor goes, which is what keeps it still on the ground.
"""
from dataclasses import dataclass
import numpy as np
from clipkit import Clip, Timing, Arm, Foot, Grip
import solve as S

DEG = np.pi / 180
HIP_X = 0.11
LEG = S.THIGH + S.SHANK  # hip to ankle, straight


@dataclass
class Gait:
    """The numbers of one pace. Lengths in metres, angles in degrees, `stance` the share of the cycle a boot is down."""
    n: int  # frames in the cycle
    stride: float  # the ground covered by a cycle (two steps)
    stance: float
    step_h: float  # how high a boot passes under the hips
    skew: float  # < 1: the boot rises early (a run's heel kicks up behind)
    top: float  # the pelvis's height when the weight is over a boot
    dip: float  # how far it sinks as a boot takes the weight
    air: float  # how far it rises between boots (a run)
    lean: float  # the torso's forward lean
    sway: float  # the pelvis's side to side
    twist_p: float  # the pelvis's turn about the vertical (the leading hip forward)
    twist_s: float  # the shoulders' turn against it
    arm: float  # the arm swing, degrees
    elbow: tuple  # the elbow's bend, degrees: always, and more as its arm swings forward
    width: float  # a boot's distance from the middle line
    toe_out: float
    look_y: float  # the height the head looks at, 4 m ahead
    strike: float  # a boot's toe up at the heel strike, degrees
    off: float  # and its heel up as it leaves
    trail: float = 8.0  # degrees the carried weapon trails behind the hand
    carry_arm: float = 0.6  # the weapon arm swings this much of the other's


def hermite(w, m0, m1):
    """0 to 1 over w in [0, 1] with slopes m0 at the start and m1 at the end."""
    return (w ** 3 - 2 * w ** 2 + w) * m0 + (-2 * w ** 3 + 3 * w ** 2) + (w ** 3 - w ** 2) * m1


def smooth_loop(v, width):
    n = len(v)
    w = np.concatenate([v[-width:], v, v[:width]])
    return np.convolve(w, np.ones(width) / width, mode='same')[width:width + n]


def foot_track(g, offset):
    """One boot's path through a cycle in the actor's frame: (z of the ankle, lift, pitch in radians) for each frame. `offset`: 0 for the right boot, 0.5 for the left."""
    stance_len = g.stance * g.stride
    td = 0.36 * stance_len  # where the boot is set down, ahead of the hips
    m = -(1 - g.stance) / g.stance  # the boot moves with the ground as it lands and as it leaves
    out = []
    for f in range(g.n):
        v = (f / g.n - offset) % 1.0
        if v < g.stance:
            k = v / g.stance
            z, lift = td - stance_len * k, 0.0
            pitch = (-g.strike * (1 - min(1.0, k / 0.16)) ** 2 + g.off * max(0.0, (k - 0.62) / 0.38) ** 2) * DEG
            z += S.roll_shift(pitch)
        else:
            w = (v - g.stance) / (1 - g.stance)
            z = td - stance_len + stance_len * hermite(w, m, m)
            lift = g.step_h * np.sin(np.pi * w ** g.skew) ** 1.2
            pitch = (g.off * (1 - min(1.0, w / 0.45)) ** 1.5 - g.strike * min(1.0, max(0.0, (w - 0.62) / 0.38)) ** 1.5) * DEG
            blend = max(0.0, 1 - w / 0.3) if pitch > 0 else max(0.0, (w - 0.7) / 0.3)  # the roll's carry fades out after the boot leaves and in before it lands
            z += S.roll_shift(pitch) * blend
        out.append((z, lift, pitch))
    return out


def self_level(g, arm_x, elbow, lean):
    """The right wrist's pitch that lets what it carries hang: the arm, the elbow and the lean undone, and a little trail behind as the pace goes up (the game tips it forward again by what it is)."""
    return g.trail - (lean + arm_x - elbow)


def build_gait(cid, g, weapon='cane'):
    n = g.n
    c = Clip(Timing(weapon, cid, {'frames': n}), cid, frames=n, loop=True, root_speed=g.stride / n)
    tracks = {-1: foot_track(g, 0.0), 1: foot_track(g, 0.5)}  # the right boot is at -x
    ph = 2 * np.pi * np.arange(n) / n
    px = -g.sway * np.sin(ph)
    yaw = g.twist_p * np.cos(ph)
    reach = np.empty(n)  # the highest the pelvis can be with both legs short of straight
    for f in range(n):
        lim = []
        for s in (-1, 1):
            z, lift, pitch = tracks[s][f]
            low = min(S.corner(pitch)[0][1], S.corner(pitch)[1][1])
            hx, hz = px[f] + s * HIP_X * np.cos(yaw[f] * DEG), -s * HIP_X * np.sin(yaw[f] * DEG)
            d = np.hypot(hx - s * g.width, hz - z)
            lim.append(S.GROUND - low + lift + np.sqrt(max(0.05, (LEG - 0.006) ** 2 - d ** 2)))
        reach[f] = min(lim)
    target = np.empty(n)  # where the weight would be: sinking as a boot takes it, rising between boots when both leave the ground
    cw = g.stance / 0.5
    for f in range(n):
        step = ((f / n) % 0.5) / 0.5
        target[f] = g.top if cw >= 1 else g.top - g.dip * np.sin(np.pi * step / cw) if step < cw else g.top + g.air * np.sin(np.pi * (step - cw) / (1 - cw))
    ys = smooth_loop(np.minimum(target, reach), max(3, n // 9))
    ys = ys - max(0.0, float(np.max(ys - reach))) - 0.002
    for f in range(n):
        p = ph[f]
        feet = {name: Foot(s * g.width, tracks[s][f][0], yaw=s * g.toe_out, pitch=tracks[s][f][2] / DEG, lift=tracks[s][f][1], space='root') for name, s in (('footR', -1), ('footL', 1))}
        c.key(f, ease='linear', pelvis=(px[f], ys[f], 0.01 * np.sin(2 * p) * g.lean / 6), pelvis_rot=(0, yaw[f], 0),
              torso=(g.lean + 0.4 * np.cos(2 * p) * (1 + g.lean / 8), -(g.twist_p + g.twist_s) * np.cos(p), px[f] * 40),
              look=(0, g.look_y, 4.0),
              armR=Arm(arm=(g.arm * g.carry_arm * np.cos(p), 0, -7), elbow=-(g.elbow[0] + g.elbow[1] * max(0.0, -np.cos(p))), hand=(self_level(g, g.arm * g.carry_arm * np.cos(p), g.elbow[0] + g.elbow[1] * max(0.0, -np.cos(p)), g.lean + 0.4 * np.cos(2 * p) * (1 + g.lean / 8)), 0, 0)),
              armL=Arm(arm=(-g.arm * np.cos(p), 0, 7), elbow=-(g.elbow[0] + g.elbow[1] * max(0.0, np.cos(p)))), **feet)
    return c


def walk():
    return build_gait('walk', Gait(n=52, stride=1.55, stance=0.6, step_h=0.075, skew=0.85, top=0.915, dip=0.0, air=0.0, lean=3.0, sway=0.022, twist_p=5.0, twist_s=4.5, arm=24, elbow=(14, 18),
                                   width=0.1, toe_out=6.0, look_y=1.52, strike=12, off=22, trail=7.0))


def run():
    return build_gait('run', Gait(n=34, stride=2.4, stance=0.36, step_h=0.25, skew=0.62, top=0.885, dip=0.07, air=0.03, lean=8.0, sway=0.014, twist_p=7.0, twist_s=7.0, arm=42, elbow=(70, 30),
                                  width=0.09, toe_out=2.0, look_y=1.45, strike=8, off=38, carry_arm=0.55, trail=20.0))


def sprint():
    return build_gait('sprint', Gait(n=30, stride=3.15, stance=0.31, step_h=0.32, skew=0.6, top=0.87, dip=0.07, air=0.04, lean=14.0, sway=0.01, twist_p=9.0, twist_s=8.0, arm=55, elbow=(85, 20),
                                     width=0.085, toe_out=2.0, look_y=1.35, strike=6, off=40, carry_arm=0.5, trail=30.0))


def idle():
    """Standing at ease: the weight easing between his boots, breath in the chest and shoulders, the head turning a little as it listens; four seconds round, so the game
    can play it on its own clock."""
    n = 240
    c = Clip(Timing('cane', 'idle', {'frames': n}), 'idle', frames=n, loop=True)
    for f in range(0, n, 6):
        a = 2 * np.pi * f / n
        breath = np.sin(3 * a)  # three breaths in a loop
        shift = np.sin(a)  # the weight goes from one boot to the other once a loop
        c.key(f, pelvis=(0.012 * shift, 0.912 - 0.004 * shift ** 2 + 0.0015 * breath, 0.0), pelvis_rot=(0, 1.2 * shift, 1.0 * shift),
              torso=(0.6 * breath + 1.0, -1.2 * shift, -0.8 * shift), look=(0.35 * np.sin(2 * a + 1), 1.62 + 0.04 * np.sin(3 * a), 4.0),
              armR=Arm(arm=(-3 + 1.5 * breath, 0, -6 + 0.8 * breath), elbow=-9 + 1.5 * breath, hand=(12 - 3 * breath, 0, 0)),
              armL=Arm(arm=(-4 - 1.5 * breath, 0, 7 + 0.8 * breath), elbow=-12 - 1.5 * breath),
              footR=Foot(-0.115, 0.0, yaw=-7, space='root'), footL=Foot(0.115, 0.0, yaw=7, space='root'))
    return c


GUARDS = {  # the weapon arm's wrist, where the weapon points, its edge, the elbow's way; the off hand; the torso's turn
    'cane': dict(r=Grip((-0.20, 1.27, 0.40), aim=(0.55, 0.8, 0.25), edge=(0, 0.2, 1), pole=(-0.5, -0.8, -0.2)), l=Grip((0.22, 1.27, 0.36), pole=(0.5, -0.8, -0.2)), torso=(2, 14, 0), head=(0, -10, 0)),
    'axe': dict(r=Grip((-0.22, 1.20, 0.36), aim=(0.5, 0.75, 0.4), edge=(-0.1, 0.1, 1), pole=(-0.5, -0.8, -0.2)), l=Grip((0.24, 1.22, 0.30), pole=(0.5, -0.8, -0.2)), torso=(3, 16, 0), head=(0, -12, 0)),
    'razor': dict(r=Grip((-0.15, 1.38, 0.30), aim=(-0.1, 1, 0.45), edge=(0, 0, 1), pole=(-0.4, -0.8, -0.3)), l=Grip((0.26, 1.20, 0.28), pole=(0.5, -0.8, -0.2)), torso=(5, 10, 0), head=(2, -6, 0)),
    'cutlass': dict(r=Grip((-0.22, 1.24, 0.38), aim=(0.1, 0.55, 0.85), edge=(0.8, 0, 0.1), pole=(-0.5, -0.8, -0.2)), l=Grip((0.24, 1.22, 0.28), pole=(0.5, -0.8, -0.2)), torso=(3, 16, 0), head=(0, -10, 0)),
    'rapier': dict(r=Grip((-0.16, 1.20, 0.44), aim=(0.04, 0.1, 1), edge=(0, 1, 0), pole=(-0.5, -0.8, -0.2)), l=Grip((0.50, 1.50, -0.22), pole=(0.8, -0.2, -0.3)), torso=(3, 22, 0), head=(0, -18, 0)),
}


def guard(weapon):
    """The guard held over a walk or a stand: the weapon across him, the off hand ready, breathing; only his torso, head and arms are used."""
    d = GUARDS[weapon]
    n = 120
    c = Clip(Timing(weapon, 'guard', {'frames': n}), f'{weapon}.guard', frames=n, loop=True)
    for f, k in ((0, 0.0), (60, 1.0)):
        c.key(f, ease='smooth', pelvis=(0, 0.912, 0), torso=(d['torso'][0] + 0.8 * k, d['torso'][1], d['torso'][2]), head=d['head'], look=(0, 1.55, 4.0),
              armR=dict(d['r'], grip=(d['r']['grip'][0], d['r']['grip'][1] + 0.012 * k, d['r']['grip'][2])), armL=dict(d['l'], grip=(d['l']['grip'][0], d['l']['grip'][1] - 0.008 * k, d['l']['grip'][2])),
              footR=Foot(-0.115, 0.0, yaw=-7, space='root'), footL=Foot(0.115, 0.0, yaw=7, space='root'))
    return c


def build():
    return [idle(), walk(), run(), sprint()] + [guard(w) for w in GUARDS]
