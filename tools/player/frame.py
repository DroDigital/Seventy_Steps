"""The investigator's joint frame, as src/render/figures.ts `skeleton()` builds it for src/render/investigator.ts, and the conversions between the
game's axes (Three.js: y up, +z ahead, the figure's right at -x) and Blender's (z up, the figure faces -y, its right at -x). One table of joints drives
the rig, the mesh builder, the animation solver and the baker, so none of them keeps its own copy of a number.

Every joint is a group at a fixed offset from its parent, turned by a rotation the clip sets; only the pelvis (`body`) also moves. A game joint at rest
has no rotation, so the frames of all joints at rest are the world's: a point of a part (given in its joint's frame, as the TypeScript builds it) is at
the joint's world position plus itself.
"""
import numpy as np

# skeleton('humanoid', { hip: 0.92, shoulder: [0.28, 0.58], hipX: 0.11, neck: [0.64, 0], leg: 0.9, thigh: 0.42, upper: 0.3, fore: 0.28, ankle: 0.07 })
HIP, SHOULDER_X, SHOULDER_Y, HIP_X, NECK_Y = 0.92, 0.28, 0.58, 0.11, 0.64
LEG, THIGH, UPPER, FORE, ANKLE = 0.9, 0.42, 0.30, 0.28, 0.07
SHIN = LEG - THIGH

# name: (parent, offset from the parent in the parent's frame, game axes). `body` is at the figure's root (the feet) at height HIP.
JOINTS = {
    'body':   (None,    (0, HIP, 0)),
    'torso':  ('body',  (0, 0, 0)),
    'head':   ('torso', (0, NECK_Y, 0)),
    'armR':   ('torso', (-SHOULDER_X, SHOULDER_Y, 0)),
    'elbowR': ('armR',  (0, -UPPER, 0)),
    'handR':  ('elbowR', (0, -FORE, 0)),
    'armL':   ('torso', (SHOULDER_X, SHOULDER_Y, 0)),
    'elbowL': ('armL',  (0, -UPPER, 0)),
    'handL':  ('elbowL', (0, -FORE, 0)),
    'legR':   ('body',  (-HIP_X, 0, 0)),
    'kneeR':  ('legR',  (0, -THIGH, 0)),
    'footR':  ('kneeR', (0, ANKLE + THIGH - LEG, 0)),
    'legL':   ('body',  (HIP_X, 0, 0)),
    'kneeL':  ('legL',  (0, -THIGH, 0)),
    'footL':  ('kneeL', (0, ANKLE + THIGH - LEG, 0)),
    'skirtR': ('body',  (0, 0, 0)),
    'skirtL': ('body',  (0, 0, 0)),
    'lantern': ('torso', (0.29, -0.005, 0.02)),  # what the lantern hangs from at the belt: it swings (clips: lantern.py), its pivot is where the strap ends
}
ORDER = list(JOINTS)  # parents before children

def rest_world():
    """Each joint's world position at rest, game axes."""
    out = {}
    for j, (p, off) in JOINTS.items():
        out[j] = np.array(off, float) + (out[p] if p else 0)
    return out

REST = rest_world()

# ---- Blender <-> game axes -------------------------------------------------------------------------------------------------------------------------
# game (x, y, z) -> blender (x, -z, y): a pure rotation (+90 degrees about x), so no mirroring, and the figure's right (-x) stays at -x.
C = np.array([[1, 0, 0], [0, 0, -1], [0, 1, 0]], float)
Cinv = C.T

def to_blender(p):
    return np.asarray(p, float) @ C.T

def from_blender(p):
    return np.asarray(p, float) @ Cinv.T

# ---- small rotation maths (numpy, no Blender needed) -----------------------------------------------------------------------------------------------

def quat_mul(a, b):
    aw, ax, ay, az = a
    bw, bx, by, bz = b
    return np.array([aw*bw - ax*bx - ay*by - az*bz, aw*bx + ax*bw + ay*bz - az*by, aw*by - ax*bz + ay*bw + az*bx, aw*bz + ax*by - ay*bx + az*bw])

def quat_conj(q):
    return np.array([q[0], -q[1], -q[2], -q[3]])

def quat_axis(axis, angle):
    axis = np.asarray(axis, float)
    axis = axis / (np.linalg.norm(axis) or 1)
    return np.concatenate([[np.cos(angle / 2)], axis * np.sin(angle / 2)])

def quat_to_mat(q):
    w, x, y, z = q / np.linalg.norm(q)
    return np.array([[1 - 2*(y*y + z*z), 2*(x*y - z*w), 2*(x*z + y*w)], [2*(x*y + z*w), 1 - 2*(x*x + z*z), 2*(y*z - x*w)], [2*(x*z - y*w), 2*(y*z + x*w), 1 - 2*(x*x + y*y)]])

def mat_to_quat(m):
    m = np.asarray(m, float)
    t = np.trace(m)
    if t > 0:
        s = np.sqrt(t + 1) * 2
        q = np.array([s / 4, (m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s])
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = np.sqrt(1 + m[0, 0] - m[1, 1] - m[2, 2]) * 2
        q = np.array([(m[2, 1] - m[1, 2]) / s, s / 4, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s])
    elif m[1, 1] > m[2, 2]:
        s = np.sqrt(1 + m[1, 1] - m[0, 0] - m[2, 2]) * 2
        q = np.array([(m[0, 2] - m[2, 0]) / s, (m[0, 1] + m[1, 0]) / s, s / 4, (m[1, 2] + m[2, 1]) / s])
    else:
        s = np.sqrt(1 + m[2, 2] - m[0, 0] - m[1, 1]) * 2
        q = np.array([(m[1, 0] - m[0, 1]) / s, (m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, s / 4])
    return q / np.linalg.norm(q)

def euler_yxz(x=0.0, y=0.0, z=0.0):
    """Three.js Euler 'YXZ' (the order every joint in poses.ts uses) as a quaternion: R = Ry * Rx * Rz."""
    qy, qx, qz = quat_axis((0, 1, 0), y), quat_axis((1, 0, 0), x), quat_axis((0, 0, 1), z)
    return quat_mul(quat_mul(qy, qx), qz)

def quat_slerp(a, b, t):
    a, b = np.asarray(a, float), np.asarray(b, float)
    d = float(np.dot(a, b))
    if d < 0:
        b, d = -b, -d
    if d > 0.9995:
        q = a + (b - a) * t
        return q / np.linalg.norm(q)
    th = np.arccos(min(1.0, d))
    return (np.sin((1 - t) * th) * a + np.sin(t * th) * b) / np.sin(th)

def look_frame(down, ahead):
    """The matrix whose -y is `down` and whose +z leans toward `ahead` (src/render/armReach.ts `frameOf`): the frame of a limb or a hand."""
    by = -np.asarray(down, float)
    by = by / np.linalg.norm(by)
    bz = np.asarray(ahead, float) - by * np.dot(ahead, by)
    if np.dot(bz, bz) < 1e-8:
        bz = np.array([0.0, 0.0, 1.0]) - by * by[2]
    bz = bz / np.linalg.norm(bz)
    bx = np.cross(by, bz)
    return np.stack([bx, by, bz], axis=1)
