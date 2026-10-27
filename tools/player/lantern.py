"""The lantern's swing: a damped pendulum hung from the belt (the `lantern` joint, pivot at frame.py's offset in the torso), pushed by the way the pivot moves through the clip, solved
here and keyed with the rest of the clip, so what Blender shows and what the game plays swings the same. Slight on purpose: a lantern that sways with his stride and settles
after a blow, not one that flies about. In the frame that turns with the torso's yaw, tilt `phi` (x toward his left, z ahead) obeys

    phi'' = -w0^2 phi - 2 zeta w0 phi' - push a / L        (a: the pivot's horizontal acceleration, the push a share of what a free bob would feel)

and a soft wall stops it swinging into his hip. The lantern hangs plumb from a torso that leans, and follows it round in yaw. A loop is run round a few times so it is the settled swing.
"""
import numpy as np
import frame as F
from solve import ry, unit
from frame import mat_to_quat

LENGTH = 0.23  # the pivot to the cage's weight: the chain, the ring, half the cage
ZETA = 0.28
PUSH = 0.55
SOFT = 9.0  # m/s^2: a push beyond this is only softly more (a cut's snap throws the belt about, the lantern's chain does not follow it all)
TILT = 0.42  # most the swing goes, radians (24 degrees)
IN_WALL = -0.2  # the tilt toward his body it stops at (x is his left: the lantern hangs at his left side)
SUB = 4
W0 = np.sqrt(9.81 / LENGTH)


def from_down(d):
    """The shortest rotation taking (0, -1, 0) to the unit vector d."""
    a = np.array([0.0, -1.0, 0.0])
    v = np.cross(a, d)
    c = float(np.dot(a, d))
    if c < -0.9999:
        return np.diag([1.0, -1.0, -1.0])
    k = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + k + k @ k / (1 + c)


def torso_yaw(R):
    return float(np.arctan2(R[0, 2], R[2, 2]))


def swing(piv, yaw, loop):
    """The tilt (n, 2) of the bob at each frame, given the pivot's world track (n, 3) and the torso's yaw (n,)."""
    n = len(piv)
    p = np.vstack([piv[-1:], piv, piv[:1]]) if loop else np.vstack([2 * piv[:1] - piv[1:2], piv, 2 * piv[-1:] - piv[-2:-1]])
    acc = (p[2:] - 2 * p[1:-1] + p[:-2]) * 3600.0  # m/s^2 at 60 Hz
    loc = np.empty((n, 2))
    acc = SOFT * np.tanh(acc / SOFT)
    for i in range(n):  # into the frame that turns with the torso: x his left, z ahead
        c, s = np.cos(-yaw[i]), np.sin(-yaw[i])
        loc[i] = (c * acc[i, 0] + s * acc[i, 2], -s * acc[i, 0] + c * acc[i, 2])
    phi, vel = np.zeros(2), np.zeros(2)
    dt = 1.0 / 60 / SUB
    out = np.zeros((n, 2))
    for cycle in range(5 if loop else 1):
        for i in range(n):
            a0, a1 = loc[i], loc[(i + 1) % n] if (loop or i + 1 < n) else loc[i]
            for s in range(SUB):
                a = a0 + (a1 - a0) * (s / SUB)
                force = -W0 ** 2 * phi - 2 * ZETA * W0 * vel - PUSH * a / LENGTH
                if phi[0] < IN_WALL:
                    force[0] += 900 * (IN_WALL - phi[0]) - 20 * min(vel[0], 0)
                vel = vel + force * dt
                phi = np.clip(phi + vel * dt, -TILT, TILT)
            out[i] = phi
    return out


def add_swing(clip):
    """Puts the lantern's rotation into each pose of a solved clip."""
    n = len(clip.rigs)
    pivot_local = np.array(F.JOINTS['lantern'][1] + (1.0,))
    piv = np.array([(r.world['torso'] @ pivot_local)[:3] + clip.root(t) for t, r in enumerate(clip.rigs)])
    yaw = np.array([torso_yaw(r.world['torso'][:3, :3]) for r in clip.rigs])
    phi = swing(piv, yaw, clip.loop)
    if not clip.loop:  # a move ends with the lantern hanging still, so the next pose (which does not know this one's swing) takes it from rest
        u = np.clip((np.arange(n) / max(n - 1, 1) - 0.5) / 0.5, 0, 1)
        phi = phi * (0.5 + 0.5 * np.cos(np.pi * u))[:, None]
    for t, (pose, rig) in enumerate(zip(clip.poses, clip.rigs)):
        d = unit(np.array([phi[t, 0], -1.0, phi[t, 1]]))
        world = ry(yaw[t]) @ from_down(d)
        pose['lantern'] = mat_to_quat(rig.world['torso'][:3, :3].T @ world)
