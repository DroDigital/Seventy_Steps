"""The weapon arm held in close for a body that turns over (the roll): the fist drawn in against the front of his right chest, the elbow at his ribs, the blade laid back along his
flank, all in the torso's own frame so it goes over with him. A blade fixed to a body that turns a whole circle must point at the floor somewhere in it, so frame by frame the blade is
turned out to his right, toward the line he turns about (where turning over cannot bring it down; `OUT`), by as little as keeps the tip off the floor. (Turning it up in its own plane
instead flips it from ahead of him to behind in a frame where it passes straight down.) Not a clip module (no `build`): the roll in `actions.py` uses it.
"""
import numpy as np
import solve as S
from clipkit import Swing, LENGTH

HAND = np.array([0.11, -0.25, 0.17])  # the wrist from the right shoulder, in the torso's frame (+x his left, +y up, +z ahead): in at the front of his chest
POLE = np.array([-0.55, -0.6, -0.45])  # the elbow out a little, down and back: at his ribs
TRAIL = np.array([-0.32, -0.62, -0.72])  # the blade: down and back along his right flank, a little out so it passes his hip
EDGE = np.array([0.0, 0.76, -0.65])  # the edge faces up his back, across the plane the blade is turned out in, so it never lies along the blade
OUT = np.array([-0.96, 0.28, 0.0])  # where the blade is turned to when it must: out to his right and a little up, level in the world whatever his chest is doing
CLEAR = 0.07  # how far the tip is kept off the floor (the solved pelvis may sit a little lower than keyed)


def _plain(ch):
    one = lambda v: float(v[0]) if isinstance(v, (tuple, list)) and len(v) == 1 else v
    return {k: ({e: one(v) for e, v in val.items()} if isinstance(val, dict) else val) for k, val in ch.items()}


def frame(ch, root=(0.0, 0.0, 0.0)):
    """(the torso's rotation, the right shoulder, the pelvis-relative world) for these channels: what the tuck is laid in."""
    rest = {k: v for k, v in _plain(ch).items() if k != 'armR'}
    rig = S.solve(rest, root)[1]
    return rig.world['torso'][:3, :3], rig.world['armR'][:3, 3]


def aim(R, shoulder, weapon='rapier'):
    """The blade's direction for a torso turned R with the right shoulder at `shoulder` (its height above the floor counts): TRAIL, turned out as little as clears the floor."""
    wrist = shoulder + R @ HAND
    length = LENGTH[weapon] + 0.02
    d0 = S.unit(R @ TRAIL)
    out = S.unit(OUT)
    ok = lambda d: wrist[1] + d[1] * length >= CLEAR
    if ok(d0):
        return d0
    for s in np.arange(0.025, 1.001, 0.025):
        d = S.unit((1 - s) * d0 + s * out)
        if ok(d):
            return d
    return out


def swing(R, blade):
    """The Swing that puts the wrist at HAND, the elbow toward POLE and the weapon along `blade` (actor-frame directions) for a torso turned R."""
    d = R @ HAND
    dist = float(np.linalg.norm(d))
    az, el = float(np.degrees(np.arctan2(-d[0], d[2]))), float(np.degrees(np.arcsin(d[1] / dist)))
    baz, bel = float(np.degrees(np.arctan2(-blade[0], blade[2]))), float(np.degrees(np.arcsin(np.clip(blade[1], -1, 1))))
    return Swing(reach=(az, el, dist), blade=(baz, bel), toward=tuple(float(x) for x in R @ EDGE), pole=tuple(float(x) for x in S.unit(R @ POLE)))


def smooth(dirs, passes=2):
    """Directions by frame ({f: unit vector}) eased into one another (a three-frame average, renormalised), so the lift and the turn out do not jerk; a direction is never lowered by it."""
    for _ in range(passes):
        nxt = {}
        for f, d in dirs.items():
            near = [dirs[g] for g in (f - 1, f, f + 1) if g in dirs]
            m = S.unit(0.25 * near[0] + 0.5 * d + 0.25 * near[-1])
            nxt[f] = m if m[1] >= d[1] - 1e-6 else d
        dirs = nxt
    return dirs


def _slerp(a, b, u):
    ang = np.arccos(np.clip(np.dot(a, b), -1, 1))
    return a if ang < 1e-4 else (np.sin((1 - u) * ang) * a + np.sin(u * ang) * b) / np.sin(ang)


def _angles(v):
    return float(np.degrees(np.arctan2(-v[0], v[2]))), float(np.degrees(np.arcsin(np.clip(v[1], -1, 1))))


SIDE = np.array([-1.0, 0.0, 0.0])  # his right: the blade on its way in from before him to behind him goes round by it, not down through the floor


def ease_in(rest, tucked, u):
    """A Swing between the carried one (`rest`) and a tucked one at u (0 to 1): the wrist moved straight from one place to the other, the blade turned round by his right (by the
    middle of the two pulled toward `SIDE`), the edge and the elbow eased."""
    r, t = (lambda k: np.asarray(rest[k], float)), (lambda k: np.asarray(tucked[k], float))
    wrist = (1 - u) * S.aimv(*rest['reach'][:2]) * rest['reach'][2] + u * S.aimv(*tucked['reach'][:2]) * tucked['reach'][2]
    dist = float(np.linalg.norm(wrist))
    a, b = S.aimv(*rest['blade']), S.aimv(*tucked['blade'])
    PASS = S.unit(S.unit(a + b) + 0.8 * SIDE)
    blade = _slerp(a, PASS, 2 * u) if u < 0.5 else _slerp(PASS, b, 2 * u - 1)
    mix = lambda k: tuple(float(x) for x in S.unit((1 - u) * r(k) + u * t(k)))
    return Swing(reach=(*_angles(wrist / dist), dist), blade=_angles(blade), toward=mix('toward'), pole=mix('pole'))
