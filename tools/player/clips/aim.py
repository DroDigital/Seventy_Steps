"""A weapon arm that points the blade where a clip says in the world, by joints a body has: for the roll, whose body turns a whole circle under the blade. The clip
keys where the rapier's point should lie in the world (`az` degrees to his right of ahead, `el` up, at frames, turned between by the shortest arc) and a posture
for the arm to stay near (the upper arm swung forward and out, the elbow's bend, the blade's turn forward of the forearm and its tilt out, the arm's turn inward); each
frame the joints are found that point the blade so, as near that posture and the last frame as they can be, inside what a shoulder, an elbow and a wrist do, with
the point kept off the floor. A sword held so stays near the line of the forearm, as a hand can hold one, and the arm never reaches out to aim it.
Not a clip module (no `build`): `actions.roll` uses it.
"""
import numpy as np
from scipy.optimize import minimize
import solve as S
import frame as F
from clipkit import Arm, LENGTH

NAMES = ('fwd', 'out', 'bend', 'wrist', 'tilt', 'rot')
LO = np.array([-55.0, 0.0, 5.0, -35.0, -30.0, -25.0])  # what each may be: the arm 55 degrees back to 100 forward, the elbow 5 to 135, the wrist 35 either way...
HI = np.array([100.0, 45.0, 135.0, 35.0, 35.0, 50.0])
SCALE = np.array([25.0, 12.0, 25.0, 12.0, 12.0, 15.0])  # how far each may stray from the posture asked for before it weighs as a degree off the aim
CLEAR = 0.07  # the point is kept this far off the floor
DEG = np.pi / 180


def arm(fwd, out, bend, wrist=0.0, tilt=0.0, rot=0.0):
    """The right arm by its joints in his chest's own frame: see the module's note (rot turns the upper arm inward, carrying the bent forearm across him)."""
    return Arm(arm=(-fwd, rot, -out), elbow=-bend, hand=(-wrist, 0, -tilt))


def aim_at(keys, f):
    """The world direction keyed by {frame: (az, el)} at frame f: the shortest arc between the keys either side (held before the first and after the last)."""
    ks = sorted(keys)
    if f <= ks[0] or f >= ks[-1]:
        return S.aimv(*keys[ks[0] if f <= ks[0] else ks[-1]])
    i, j = max(k for k in ks if k <= f), min(k for k in ks if k > f)
    a, b = S.aimv(*keys[i]), S.aimv(*keys[j])
    u = (f - i) / (j - i)
    ang = np.arccos(np.clip(a @ b, -1, 1))
    return a if ang < 1e-6 else (np.sin((1 - u) * ang) * a + np.sin(u * ang) * b) / np.sin(ang)


def _fk(T, p):
    """The blade's direction and its grip for joints p, the chest's world matrix T."""
    fwd, out, bend, wrist, tilt, rot = p
    Ws = T @ S.move(F.JOINTS['armR'][1]) @ S.rot(S.euler((-fwd, rot, -out)))
    We = Ws @ S.move(F.JOINTS['elbowR'][1]) @ S.rot(S.rx(-bend * DEG))
    Wh = We @ S.move(F.JOINTS['handR'][1]) @ S.rot(S.euler((-wrist, 0, -tilt)))
    return -Wh[:3, 1], Wh[:3, 3] + Wh[:3, 2] * 0.02


def solve_arm(chest, want, posture, weapon='rapier'):
    """The joints, frame by frame, for {frame: chest world matrix}, {frame: blade direction wanted} and {frame: posture (NAMES)}: each frame from the last."""
    length = LENGTH[weapon]
    out, prev = {}, None
    for f in sorted(chest):
        T, w, r0 = chest[f], want[f], np.asarray(posture[f], float)

        def cost(p):
            blade, grip = _fk(T, p)
            miss = np.degrees(np.arccos(np.clip(blade @ w, -1, 1)))
            floor = max(0.0, CLEAR - (grip + blade * length)[1]) * 400
            limits = np.sum(np.maximum(0, LO - p) ** 2 + np.maximum(0, p - HI) ** 2) * 10
            near = np.sum(((p - r0) / SCALE) ** 2) * 6
            still = 0.0 if prev is None else np.sum(((p - prev) / SCALE) ** 2) * 2
            return miss ** 2 + floor ** 2 + limits + near + still

        p = minimize(cost, r0 if prev is None else prev, method='Nelder-Mead', options=dict(maxiter=4000, xatol=0.05, fatol=0.01)).x
        out[f] = tuple(float(x) for x in p)
        prev = p
    return out
