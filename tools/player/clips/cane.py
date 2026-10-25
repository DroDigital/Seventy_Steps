"""The sword-cane's five blows. The blade is drawn for them (`drawn`): the game swaps the stick for the sword as the move begins and back some moments after it ends."""
from clipkit import Clip, Foot, Grip, timing, hit_path

W = 'cane'


def light1(m=None):
    """A right-to-left cut across the front, the left foot stepping in under it."""
    m = m or timing(W, 'light1')
    c = Clip(m, 'cane.light1')
    c.drawn = True
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    feet0 = dict(footR=Foot(-0.12, 0.0), footL=Foot(0.12, 0.0))
    c.key(0, pelvis=(0, 0.92, 0), pelvis_rot=(0, 0, 0), torso=(0, 0, 0), head=(0, 0, 0),
          armR=Grip((-0.28, 0.9, 0.12), aim=(0.1, -1, 0.3), edge=(0, 0, 1)), armL=Grip((0.30, 0.95, 0.08), pole=(0.3, -0.7, -0.2)), **feet0)
    # wind-up: the weight settles back, the shoulders turn to the right, the blade is drawn out to that side
    c.key(h0 - 4, pelvis=(0.0, 0.88, -0.02), pelvis_rot=(4, -12, 0), torso=(4, -26, 0), head=(0, 18, 0),
          armR=Grip((-0.50, 1.22, 0.22), aim=(-0.82, -0.05, 0.55), edge=(0.55, 0, 0.82)), armL=Grip((0.34, 1.0, 0.0), pole=(0.4, -0.5, -0.4)),
          footR=Foot(-0.16, -0.06, yaw=-12), footL=Foot(0.14, 0.16, lift=0.12, yaw=-8), ease='out')
    c.key(h0, pelvis=(0.0, 0.85, 0.12), pelvis_rot=(8, -6, 0), torso=(8, -18, 0), head=(0, 12, 0),
          armR=Grip((-0.46, 1.22, 0.30), aim=(-0.88, -0.05, 0.45), edge=(0.45, 0, 0.88)), armL=Grip((0.34, 1.0, 0.0), pole=(0.4, -0.5, -0.4)),
          footR=Foot(-0.16, -0.06, yaw=-12), footL=Foot(0.15, 0.58, yaw=-5), ease='snap')
    c.key((h0 + h1) // 2, pelvis=(0.0, 0.85, 0.2), pelvis_rot=(10, 8, 0), torso=(10, 4, 0), head=(0, -4, 0),
          armR=Grip((-0.18, 1.25, 0.52), aim=(0.0, -0.08, 1.0), edge=(1, 0, 0)), ease='linear')
    c.key(h1, pelvis=(0.0, 0.85, 0.24), pelvis_rot=(8, 20, 0), torso=(8, 28, 0), head=(0, -14, 0),
          armR=Grip((0.12, 1.22, 0.46), aim=(0.88, -0.08, 0.46), edge=(0.46, 0, -0.88)), ease='linear')
    c.key(h1 + 5, pelvis=(0.0, 0.86, 0.22), pelvis_rot=(6, 26, 0), torso=(6, 36, 0), head=(0, -20, 0),
          armR=Grip((0.30, 1.18, 0.36), aim=(0.95, -0.2, 0.2), edge=(0.2, 0, -0.95)), armL=Grip((0.36, 1.05, 0.12), pole=(0.4, -0.5, -0.3)),
          footR=Foot(-0.14, 0.3, yaw=10, lift=0.0), footL=Foot(0.15, 0.58, yaw=-5), ease='out')
    c.key(n - 8, pelvis=(0.0, 0.89, 0.18), pelvis_rot=(2, 8, 0), torso=(2, 10, 0), head=(0, -6, 0),
          armR=Grip((-0.22, 1.0, 0.34), aim=(0.4, -0.9, 0.3), edge=(0, 0, 1)), footR=Foot(-0.14, 0.52, yaw=2), footL=Foot(0.15, 0.58), ease='smooth')
    c.key(n, pelvis=(0.0, 0.92, 0.16), pelvis_rot=(0, 0, 0), torso=(0, 0, 0), head=(0, 0, 0),
          armR=Grip((-0.28, 0.9, 0.2), aim=(0.1, -1, 0.3), edge=(0, 0, 1)), armL=Grip((0.30, 0.95, 0.16), pole=(0.3, -0.7, -0.2)), footR=Foot(-0.12, 0.52), footL=Foot(0.12, 0.58), ease='smooth', still=True)
    return c


def build():
    return [light1()]
