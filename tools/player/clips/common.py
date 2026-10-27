"""What the clip modules share: the weapon's direction and edge by name instead of by vector, the stance he stands in between moves (so a clip begins and ends where the carried
pose is, and the game's short crossfade has nothing to hide), and a few lengths of his body.

Directions: `az` is degrees from straight ahead, positive toward his RIGHT (as the game's hit arcs are: an arc of [70, -70] sweeps from his right to his left), `el` degrees above
the horizontal. Positions are metres in the actor's frame: x to his left (his right is -x), y up from the floor, z ahead.
"""
import numpy as np
import solve as S
from clipkit import Grip, Arm, Foot, Swing

SHOULDER_R = np.array([-0.28, 1.50, 0.0])  # where the pelvis at 0.92 and the torso straight put the shoulders
SHOULDER_L = np.array([0.28, 1.50, 0.0])
ARM = 0.58  # shoulder to wrist, straight: a wrist farther than this from its shoulder is out of reach
UP = np.array([0.0, 1.0, 0.0])


unit = S.unit
aimv = S.aimv
edge_of = S.edge_of


def Blade(pos, az, el=0.0, toward=None, roll=0.0, pole=None):
    """The wrist at `pos` (a point in the actor's frame) and the weapon pointing `az`, `el`, its edge facing `toward` or rolled `roll` degrees: `Swing` is the same from the shoulder."""
    a = aimv(az, el)
    return Grip(tuple(pos), aim=tuple(a), edge=tuple(edge_of(a, toward, roll)), pole=None if pole is None else tuple(pole))


def tangent(az, sign=1):
    """The way a blade's tip is going as a level cut sweeps through `az` (see aimv): with `sign` = +1 toward lesser az (right to left, his left being az < 0), -1 the other way. A blade whose edge
    is meant to lead a cut has `toward=tangent(az)` for each key of it (a constant direction turns the edge about the blade where the cut turns)."""
    a = np.radians(az)
    return (sign * float(np.cos(a)), 0.0, sign * float(np.sin(a)))


def reach_check(shoulder, pos):
    """How far beyond the arm's reach (metres, 0 if within) a wrist at `pos` is from the shoulder at `shoulder`."""
    return max(0.0, float(np.linalg.norm(np.asarray(pos, float) - shoulder)) - ARM)


# ---- the carried pose, as the idle clip has it (locomotion.idle), for the first and last keys of a clip ---------------------------------------------------------------------
IDLE_R = Arm(arm=(-3, 0, -6), elbow=-9, hand=(12, 0, 0))  # the weapon arm hanging, the weapon hanging from it
IDLE_L = Arm(arm=(-4, 0, 7), elbow=-12)


def at_rest(**over):
    """The channels of standing at ease (pelvis, torso, head, both arms), with any you name in their place; the boots are `stand_feet`'s."""
    ch = dict(pelvis=(0.0, 0.912, 0.0), pelvis_rot=(0, 0, 0), torso=(1, 0, 0), head=(0, 0, 0), armR=IDLE_R, armL=IDLE_L)
    ch.update(over)
    return ch


def stand_feet(clip, t, dz=0.0, right_dz=None, left_dz=None, yaw=7.0, width=0.115):
    """Both boots flat on the floor at frame `t`, as at ease, in the clip's world: the actor's root is where its motion has taken it by then, so the boots are put there (`dz`
    ahead of it; `right_dz` and `left_dz` set each apart)."""
    z = float(clip.root(t)[2])
    return dict(footR=Foot(-width, z + (dz if right_dz is None else right_dz), yaw=-yaw), footL=Foot(width, z + (dz if left_dz is None else left_dz), yaw=yaw))
