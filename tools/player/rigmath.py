"""The arithmetic between the game's joints and Blender's bones, with no Blender in it (numpy only), so the animation solver and the baker share it and a
round trip can be tested: a clip's joint rotations -> each bone's local transform in the .blend -> the same rotations read back from what Blender evaluates.

A joint J of the game moves rigidly with the parts hung from it. In the game frame, W_J = W_parent . T(offset) . R(q) (the pelvis: T(position) . R(q)); at rest every
R is the identity. A part's vertex follows the bone by Delta_J = (pose W_J) . (rest W_J)^-1 (in armature space, once the game's axes are turned into Blender's by C).
Blender's pose matrix of a bone is P = Delta . R_rest, and its local transform L (loc, quat) = R_rest^-1 . Delta_parent^-1 . Delta . R_rest.
"""
import numpy as np
import frame as F

Cm = np.eye(4)
Cm[:3, :3] = F.C
Cm_inv = np.linalg.inv(Cm)


def T(v):
    m = np.eye(4)
    m[:3, 3] = v
    return m


def R(q):
    m = np.eye(4)
    m[:3, :3] = F.quat_to_mat(np.asarray(q, float))
    return m


def game_world(pose):
    """pose: {'body_pos': (x, y, z) or None, joint: quaternion (w, x, y, z)}: every joint's 4x4 world matrix in the game frame."""
    W = {}
    for j in F.ORDER:
        parent, off = F.JOINTS[j]
        q = pose.get(j, (1, 0, 0, 0))
        if parent is None:
            pos = pose['body_pos'] if pose.get('body_pos') is not None else off
            W[j] = T(pos) @ R(q)
        else:
            W[j] = W[parent] @ T(off) @ R(q)
    return W


REST_W = game_world({})


def delta(W):
    """Armature-space motion of each joint's rigid body: C^-1 (pose W . rest W^-1) C."""
    return {j: Cm_inv @ (W[j] @ np.linalg.inv(REST_W[j])) @ Cm for j in F.ORDER}


def local_transforms(pose, rest_matrix):
    """Each bone's (location, quaternion) in its own rest frame for the pose. rest_matrix[j]: the bone's 4x4 rest matrix in armature space (Blender's bone.matrix_local)."""
    D = delta(game_world(pose))
    out = {}
    for j in F.ORDER:
        parent = F.JOINTS[j][0]
        rel = (np.linalg.inv(D[parent]) @ D[j]) if parent else D[j]
        Rb = rest_matrix[j]
        L = np.linalg.inv(Rb) @ rel @ Rb
        out[j] = (L[:3, 3].copy(), F.mat_to_quat(L[:3, :3]))
    return out


def pose_from_matrices(pose_matrix, rest_matrix):
    """The inverse: the game's joint rotations (and the pelvis position) from the 4x4 pose matrices (armature space) Blender evaluated."""
    Dg = {j: Cm @ (pose_matrix[j] @ np.linalg.inv(rest_matrix[j])) @ Cm_inv for j in F.ORDER}
    W = {j: Dg[j] @ REST_W[j] for j in F.ORDER}
    out = {}
    for j in F.ORDER:
        parent = F.JOINTS[j][0]
        if parent is None:
            out['body_pos'] = W[j][:3, 3].copy()
            out[j] = F.mat_to_quat(W[j][:3, :3])
        else:
            out[j] = F.mat_to_quat(W[parent][:3, :3].T @ W[j][:3, :3])
    return out
