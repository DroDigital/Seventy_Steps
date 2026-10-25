"""Poses of the investigator's joints, solved in numpy (no Blender): forward kinematics over frame.py's joint table, the two-bone IK of the arms and legs, and
the assembly of one instant's channels (clipkit.py's Frame) into the rotations the game's joints take. A pose is {'body_pos': (x, y, z), joint: quaternion (w, x, y, z)}.

Axes are the game's (y up, +z ahead, the figure's right at -x); rotations are the joints' own, Euler 'YXZ' in radians, so what is solved here is what poses.ts would set.
The ground is where a standing foot's sole is: GROUND metres above the figure's root (the old figure's soles hung 1.7 cm clear of it, as figures.ts has them).
"""
import numpy as np
import frame as F
from frame import euler_yxz, look_frame, mat_to_quat, quat_mul, quat_to_mat

DEG = np.pi / 180
THIGH, SHANK, ANKLE = F.THIGH, F.SHIN - F.ANKLE, F.ANKLE  # hip to knee, knee to ankle (0.41), ankle to sole's plane
UPPER, FORE = F.UPPER, F.FORE
SOLE, HEEL, TOE = 0.073, -0.12, 0.205  # the boot below the ankle joint, and how far behind and before it the sole runs
GROUND = F.REST['footR'][1] - SOLE  # 0.017: where a standing sole is: the old figure's soles hung this far clear of the figure's root
SIDE = {'R': -1, 'L': 1}  # which way the figure's right and left are, x


def rot(m3):
    m = np.eye(4)
    m[:3, :3] = m3
    return m


def move(v):
    m = np.eye(4)
    m[:3, 3] = v
    return m


def unit(v, fallback=(0.0, 0.0, 1.0)):
    v = np.asarray(v, float)
    n = np.linalg.norm(v)
    return v / n if n > 1e-9 else np.asarray(fallback, float)


def rx(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def ry(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def rz(a):
    c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def euler(v):
    """Degrees (x, y, z) as the rotation matrix Three.js's 'YXZ' makes: Ry . Rx . Rz."""
    x, y, z = (np.asarray(v, float) * DEG)
    return ry(y) @ rx(x) @ rz(z)


def euler_of(m):
    """The 'YXZ' Euler angles (x, y, z) in degrees of a rotation matrix (the inverse of `euler`)."""
    x = np.arcsin(-np.clip(m[1, 2], -1, 1))
    if abs(m[1, 2]) < 0.9999:
        y, z = np.arctan2(m[0, 2], m[2, 2]), np.arctan2(m[1, 0], m[1, 1])
    else:
        y, z = np.arctan2(-m[2, 0], m[0, 0]), 0.0
    return np.array([x, y, z]) / DEG


def two_bone(root, target, l1, l2, pole):
    """The middle joint of a two-bone chain from `root` reaching for `target` (stretched to its length if out of reach), bent toward `pole`. -> (middle, end, stretch)."""
    d = target - root
    dist = np.linalg.norm(d)
    top = l1 + l2 - 1e-6
    low = abs(l1 - l2) + 1e-3
    reach = min(max(dist, low), top)
    u = unit(d, (0, -1, 0))
    n = np.asarray(pole, float) - u * np.dot(pole, u)
    n = unit(n, (0, 0, 1) if abs(u[2]) < 0.9 else (1, 0, 0))
    cosa = (l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach)
    a = np.arccos(np.clip(cosa, -1, 1))
    mid = root + l1 * (np.cos(a) * u + np.sin(a) * n)
    return mid, root + u * reach, max(0.0, dist - top)


def spec_vec(spec, key, default):
    return np.asarray(spec.get(key, default), float)


class Rig:
    """One instant: the pelvis and the torso set, then each arm and leg solved from where the pelvis and shoulders are."""

    def __init__(self, ch, root):
        self.ch = ch
        self.root = np.asarray(root, float)  # where the actor's root is, in the clip's world (only feet given in that world need it)
        self.q = {}
        self.over = {}  # how far each limb's target was out of reach (QA)
        self.pelvis = spec_vec(ch, 'pelvis', (0, F.HIP, 0))
        self.B = move(self.pelvis) @ rot(euler(ch.get('pelvis_rot', (0, 0, 0))))
        self.T = self.B @ rot(euler(ch.get('torso', (0, 0, 0))))
        self.q['body'] = mat_to_quat(self.B[:3, :3])
        self.q['torso'] = mat_to_quat(euler(ch.get('torso', (0, 0, 0))))
        self.world = {'body': self.B, 'torso': self.T}

    # ---- the head -------------------------------------------------------------------------------------------------------------------------------------
    def head(self):
        ch = self.ch
        look = ch.get('look')
        neck = move(F.JOINTS['head'][1])
        if look is not None:
            at = np.asarray(look, float)
            c = (self.T @ neck)[:3, 3]
            want = unit(at - c)
            local = self.T[:3, :3].T @ want
            yaw = np.clip(np.arctan2(local[0], local[2]), -1.1, 1.1)
            pitch = np.clip(np.arcsin(-local[1]), -0.7, 0.7)  # positive nods, which is looking down
            h = np.array([pitch / DEG, yaw / DEG, 0.0])
            h = h + np.asarray(ch.get('head', (0, 0, 0)), float)
        else:
            h = np.asarray(ch.get('head', (0, 0, 0)), float)
        self.q['head'] = mat_to_quat(euler(h))
        self.world['head'] = self.T @ neck @ rot(euler(h))

    # ---- arms -----------------------------------------------------------------------------------------------------------------------------------------
    def arm(self, side):
        s = SIDE[side]
        spec = self.ch.get('arm' + side)
        names = (f'arm{side}', f'elbow{side}', f'hand{side}')
        shoulder = self.T @ move(F.JOINTS[names[0]][1])
        if spec is None:
            spec = {'arm': (0, 0, 0), 'elbow': 0.0, 'hand': (0, 0, 0)}
        if 'grip' not in spec:  # forward kinematics: the angles as given
            Rs = euler(spec.get('arm', (0, 0, 0)))
            Re = rx(float(spec.get('elbow', 0.0)) * DEG)
            Rh = euler(spec.get('hand', (0, 0, 0)))
        else:  # the wrist at `grip`, the elbow bent toward `pole`, the hand turned so the weapon points down `aim` with its edge toward `edge`
            S = shoulder[:3, 3]
            W = np.asarray(spec['grip'], float)
            pole = spec_vec(spec, 'pole', (s * 0.25, -0.8, -0.3))
            E, W2, over = two_bone(S, W, UPPER, FORE, pole)
            self.over['arm' + side] = over
            e, f = unit(E - S), unit(W2 - E)
            bend = f - e * np.dot(f, e)
            ahead = bend if np.linalg.norm(bend) > 1e-4 else -(np.asarray(pole, float) - e * np.dot(pole, e))
            Fs = look_frame(e, ahead)  # the upper arm: down along e, +z toward the way the forearm turns
            Rs = self.T[:3, :3].T @ Fs
            ang = np.arccos(np.clip(np.dot(e, f), -1, 1))
            Re = rx(-ang)
            if 'aim' in spec:
                edge = spec.get('edge')
                Fh = look_frame(unit(spec['aim']), unit(edge) if edge is not None else Fs[:, 2])
                Rh = (self.T[:3, :3] @ Rs @ Re).T @ Fh
            else:
                Rh = euler(spec.get('hand', (0, 0, 0)))
        self.q[names[0]], self.q[names[1]], self.q[names[2]] = mat_to_quat(Rs), mat_to_quat(Re), mat_to_quat(Rh)
        Ws = shoulder @ rot(Rs)
        We = Ws @ move(F.JOINTS[names[1]][1]) @ rot(Re)
        self.world[names[0]], self.world[names[1]] = Ws, We
        self.world[names[2]] = We @ move(F.JOINTS[names[2]][1]) @ rot(Rh)

    # ---- legs -----------------------------------------------------------------------------------------------------------------------------------------
    def leg(self, side):
        s = SIDE[side]
        names = (f'leg{side}', f'knee{side}', f'foot{side}')
        hip = self.B @ move(F.JOINTS[names[0]][1])
        spec = self.ch.get('foot' + side)
        if spec is None or 'thigh' in spec:  # forward kinematics
            spec = spec or {}
            Rl, Rk, Rf = euler(spec.get('thigh', (0, 0, 0))), rx(float(spec.get('knee', 0.0)) * DEG), euler(spec.get('foot', (0, 0, 0)))
        else:
            yaw, pitch = spec.get('yaw', 0.0) * DEG, spec.get('pitch', 0.0) * DEG
            Rworld = ry(yaw) @ rx(pitch)
            pos = np.array([spec['x'], 0.0, spec['z']])
            if spec.get('space', 'world') == 'world':
                pos = pos - self.root * np.array([1, 0, 1])
            # the ankle goes where the lowest corner of the sole touches the ground (the toe, or the heel, as the foot is pitched), plus any lift
            corners = np.array([[0, -SOLE, HEEL], [0, -SOLE, TOE]])
            low = (corners @ Rworld.T)[:, 1].min()
            ankle = np.array([pos[0], GROUND - low + spec.get('lift', 0.0), pos[2]])
            H = hip[:3, 3]
            fwd = Rworld @ np.array([0.0, 0.0, 1.0])
            pole = fwd + np.array([s * 1.0, 0, 0]) * spec.get('out', 0.0)  # `out`: how far the knee splays outward (0 straight ahead)
            K, A, over = two_bone(H, ankle, THIGH, SHANK, pole)
            self.over['leg' + side] = over
            t, sh = unit(K - H), unit(A - K)
            dev = sh - t * np.dot(sh, t)  # the shin turns back of the thigh: the joint's +z is the other way, toward the knee's front
            Fh = look_frame(t, -dev if np.linalg.norm(dev) > 1e-4 else fwd)
            Rl = self.B[:3, :3].T @ Fh
            ang = np.arccos(np.clip(np.dot(t, sh), -1, 1))
            Rk = rx(ang)  # the shin goes back of the thigh: positive
            Rf = (self.B[:3, :3] @ Rl @ Rk).T @ Rworld
        self.q[names[0]], self.q[names[1]], self.q[names[2]] = mat_to_quat(Rl), mat_to_quat(Rk), mat_to_quat(Rf)
        Wl = hip @ rot(Rl)
        Wk = Wl @ move(F.JOINTS[names[1]][1]) @ rot(Rk)
        self.world[names[0]], self.world[names[1]] = Wl, Wk
        self.world[names[2]] = Wk @ move(F.JOINTS[names[2]][1]) @ rot(Rf)
        # the coat's skirt hangs from the thigh as figures' `settle` has it
        legx = euler_of(Rl)[0] * DEG
        k = self.ch.get('skirt', 0.9)
        self.q['skirt' + side] = mat_to_quat(rx(k * legx))

    def pose(self):
        self.head()
        for side in 'RL':
            self.arm(side)
            self.leg(side)
        out = dict(self.q)
        out['body_pos'] = self.pelvis.copy()
        return out


def solve(ch, root=(0.0, 0.0, 0.0)):
    """A pose (and the Rig, for the world matrices of its joints and what was out of reach) from one instant's channels."""
    r = Rig(ch, root)
    return r.pose(), r


def tip_of(rig, side, length):
    """Where a weapon of `length` held in the `side` hand points to, and its grip: (grip, tip, edge direction) in the frame the pose is in."""
    W = rig.world['hand' + side]
    return W[:3, 3] + W[:3, 2] * 0.02, W[:3, 3] + W[:3, 2] * 0.02 - W[:3, 1] * length, W[:3, 2]
