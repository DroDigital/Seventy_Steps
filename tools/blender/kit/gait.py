"""Walk cycles from the legs' IK (docs/MODELS.md): each leg plants its foot and pushes it back at the
body's pace for `duty` of the cycle, then lifts it and swings it forward again. One cycle carries the
body `stride` metres; the game moves the cycle on by the distance walked, so the feet do not slide.

    BIPED = (0.0, 0.5)                  # left, right
    WALK4 = (0.0, 0.5, 0.75, 0.25)      # fore-left, fore-right, hind-left, hind-right: a walk
    TROT = (0.0, 0.5, 0.5, 0.0)
    BOUND = (0.0, 0.08, 0.5, 0.58)      # a gallop's bound: fores together, hinds together
    TRIPOD = (0.0, 0.5, 0.5, 0.0, 0.0, 0.5)  # six legs, three down at a time
"""

import math

from .anim import add
from .ik import leg

BIPED = (0.0, 0.5)
WALK4 = (0.0, 0.5, 0.75, 0.25)
TROT = (0.0, 0.5, 0.5, 0.0)
BOUND = (0.0, 0.08, 0.5, 0.58)
TRIPOD = (0.0, 0.5, 0.5, 0.0, 0.0, 0.5)


def foot_at(k, foot, t, stride, duty, lift, reach=0.0):
    """Where a foot is at cycle phase t (0..1), relative to its rest place: (dy, dz)."""
    sweep = stride * duty
    if t < duty:  # planted: carried back under the body
        return (-sweep / 2 + sweep * t / duty + reach, 0.0)
    s = (t - duty) / (1 - duty)  # in the air: lifted and brought forward
    return (sweep / 2 - sweep * (s * s * (3 - 2 * s)) + reach, lift * math.sin(math.pi * s))


def walk(k, legs, frames, stride, phases=BIPED, duty=0.6, lift=0.12, bob=0.04, root=(0.0, 0.0, 0.0),
         parent_rx=0.0, knee='front', keys=8, extra=None, toe=8.0):
    """[(frame, pose)] for a looping walk: `legs` (thigh, shin, foot) each with its phase; `bob` the
    body's dip each step; `root` where the body is carried (a crouch); `extra(t)` adds a pose at each
    phase t (arms, tail, head, a sway of the body) to the legs'. `knee` front or back, or one per leg."""
    out = []
    for i in range(keys):
        t0 = i / keys
        f = round(frames * t0)
        dip = -bob * math.cos(4 * math.pi * t0)  # down as each foot takes the weight
        r = (root[0], root[1], root[2] + dip)
        pose = {'root:loc': r}
        for j, (th, sh, ft) in enumerate(legs):
            t = (t0 + phases[j]) % 1.0
            dy, dz = foot_at(k, ft, t, stride, duty, lift)
            a = k.r.head(ft)
            kn = knee if isinstance(knee, str) else knee[j]
            up = t >= duty
            pose.update(leg(k, th, sh, ft, (a[0], a[1] + dy, a[2] + dz), r, parent_rx, kn, toe if up else 0.0))
        if extra:
            pose = add(pose, extra(t0))
        out.append((f, pose))
    return out
