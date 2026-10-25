"""The sword-cane's five blows and its parry. The blade is drawn for them (`drawn`): the game swaps the stick for the sword as the move begins and back some moments after it ends.

His hand with it is a fencer's, not a knight's: the light blows are flicks from the wrist with the body turning behind them (light1 to his left, light2 back to his right, light3 a lunging stab), the
heavy two are the same hand with the whole body let into it (heavy1 falls from high on his right, heavy2 wheels up from low on his left), and the parry is a quick beat across the body and a riposte.
Every blow begins and ends at the carried pose (`at_rest`, `HANG`, `HANG_EDGE`) so the game's crossfade has nothing to hide.
"""
import numpy as np
import solve as S
from clipkit import Clip, Foot, Swing, Arm, timing
from clips.common import at_rest, stand_feet, tangent

W = 'cane'
HANG = dict(reach=(15, -80, 0.55), blade=(8, -76))  # the weapon arm let hang, the blade down along his leg
HANG_EDGE = dict(toward=(0, 0, 1), pole=(-0.25, -0.8, -0.3))  # and its edge forward and its elbow bent back, as the carried pose has them: every key that names an edge or an elbow must begin and end here, or the channel is already turned at frame 0


def steps_on(c, side, start, moves, h=0.07):
    """`Clip.steps` for a boot that has already been keyed from frame 0 (a boot that does something between its steps, such as a swivel): the same lift, swing and heel-first landing, without the key at frame 0."""
    x, z, yaw = start
    for mv in moves:
        t0, t1, nx, nz = mv[:4]
        nyaw = mv[4] if len(mv) > 4 else yaw
        hh = mv[5] if len(mv) > 5 else h
        c.key(t0, ease='linear', **{side: Foot(x, z, yaw)})
        for f in range(int(np.ceil(t0)) + 1, int(np.floor(t1))):
            u = (f - t0) / (t1 - t0)
            e = u * u * (3 - 2 * u)
            pitch = 22 * max(0.0, 1 - u / 0.4) ** 2 - 10 * max(0.0, (u - 0.7) / 0.3) ** 1.5
            pz = z + (nz - z) * e + S.roll_shift(pitch * np.pi / 180) * (max(0.0, 1 - u / 0.3) if pitch > 0 else max(0.0, (u - 0.7) / 0.3))
            c.key(f, ease='linear', **{side: Foot(x + (nx - x) * e, pz, yaw + (nyaw - yaw) * e, pitch=pitch, lift=hh * np.sin(np.pi * u) ** 1.2)})
        c.key(t1, ease='linear', **{side: Foot(nx, nz, nyaw)})
        x, z, yaw = nx, nz, nyaw


def light1(m=None):
    """A cut from his right across to his left, the left boot stepping in under it: the body winds to the right and back, throws round with the cut, and the blade carries on."""
    m = m or timing(W, 'light1')
    c = Clip(m, 'cane.light1')
    c.drawn = True
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    c.key(0, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    # wind-up: the weight drops and turns to the right, the arm goes out to that side with the blade behind it
    c.key(h0 - 3, ease='out', pelvis=(0.0, 0.88, -0.1), pelvis_rot=(2, -14, 0), torso=(4, -26, 0), head=(0, 16, 0), look=(0, 1.5, 4),
          armR=Swing(reach=(102, 8, 0.5), blade=(112, 22), toward=(0, 1, 0), pole=(-0.3, -0.7, -0.6)), armL=Arm(arm=(-30, 10, 30), elbow=-40))
    c.key(h0, ease='in', pelvis=(0.0, 0.86, -0.12), pelvis_rot=(4, -2, 0), torso=(6, -8, 0), head=(0, 6, 0),
          armR=Swing(reach=(72, -6, 0.56), blade=(72, -4), toward=tangent(72), pole=(-0.3, -0.7, -0.4)))
    c.key((h0 + h1) // 2, ease='linear', pelvis=(0.0, 0.85, -0.1), pelvis_rot=(5, 10, 0), torso=(7, 12, 0), head=(0, -6, 0),
          armR=Swing(reach=(0, -6, 0.58), blade=(0, -4), toward=tangent(0)))
    c.key(h1, ease='linear', pelvis=(0.0, 0.86, -0.1), pelvis_rot=(5, 22, 0), torso=(6, 26, 0), head=(0, -16, 0),
          armR=Swing(reach=(-68, -6, 0.56), blade=(-72, -4), toward=tangent(-72), pole=(-0.1, -0.7, -0.3)), armL=Arm(arm=(-40, 0, 40), elbow=-20))
    # follow-through: the blade carries on across and drops, the body comes up out of the lunge
    c.key(h1 + 2, ease='out', pelvis=(0.0, 0.87, -0.08), pelvis_rot=(4, 23, 0), torso=(5, 28, 0), head=(0, -18, 0),
          armR=Swing(reach=(-94, -10, 0.54), blade=(-98, -14), toward=tangent(-98), pole=(0.1, -0.7, -0.25)))
    c.key(h1 + 6, ease='out', pelvis=(0.0, 0.88, -0.06), pelvis_rot=(3, 24, 0), torso=(4, 30, 0), head=(0, -20, 0),
          armR=Swing(reach=(-110, -22, 0.5), blade=(-112, -32), toward=tangent(-112), pole=(0.2, -0.7, -0.2)))
    # the edge turns back to the carried hold by degrees (backward, then forward), not in one frame
    c.key(n - 10, ease='smooth', armR={'toward': (-0.7, 0, -0.7)})
    c.key(n - 8, ease='smooth', **at_rest(pelvis=(0.0, 0.9, 0.08), torso=(2, 10, 0), armR=Swing(**HANG, **HANG_EDGE)))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    # the boots: the left steps in under the blow, the right follows and the two come level
    c.steps('footL', (0.115, 0.0, 7), [(1, h0, 0.14, 0.58, 14, 0.1)])
    c.steps('footR', (-0.115, 0.0, -7), [(h0 - 1, h1 + 6, -0.13, 0.36, -4, 0.06)])
    return c


def light2(m=None):
    """The answer to light1: a backhand from his left across to his right, the right boot stepping in under it. The body unwinds the other way: it coils to the left with the blade crossed behind the chest, then throws round to the right."""
    m = m or timing(W, 'light2')
    c = Clip(m, 'cane.light2')
    c.drawn = True
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    c.key(0, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    # wind-up: the weight drops and turns to the left, the wrist crosses his chest and the blade points away behind it to the left
    c.key(h0 - 3, ease='out', pelvis=(0.03, 0.88, -0.1), pelvis_rot=(2, 14, 0), torso=(4, 26, 0), head=(0, -16, 0), look=(0, 1.5, 4),
          armR=Swing(reach=(-78, 6, 0.5), blade=(-110, 20), toward=(0, 1, 0), pole=(-0.3, -0.7, -0.4)), armL=Arm(arm=(-30, -10, 30), elbow=-40))
    c.key(h0, ease='in', pelvis=(0.02, 0.86, -0.12), pelvis_rot=(4, 2, 0), torso=(6, 8, 0), head=(0, -6, 0),
          armR=Swing(reach=(-72, -6, 0.56), blade=(-72, -4), toward=tangent(-72, -1), pole=(-0.3, -0.7, -0.4)))
    c.key((h0 + h1) // 2, ease='linear', pelvis=(0.0, 0.85, -0.1), pelvis_rot=(5, -10, 0), torso=(7, -12, 0), head=(0, 6, 0),
          armR=Swing(reach=(0, -6, 0.58), blade=(0, -4), toward=tangent(0, -1)))
    c.key(h1, ease='linear', pelvis=(-0.02, 0.86, -0.1), pelvis_rot=(5, -22, 0), torso=(6, -26, 0), head=(0, 16, 0),
          armR=Swing(reach=(68, -6, 0.56), blade=(72, -4), toward=tangent(68, -1), pole=(-0.4, -0.4, -0.6)), armL=Arm(arm=(-40, 0, 40), elbow=-20))
    # follow-through: the blade carries on out to the right and drops, the body comes up out of the lunge
    c.key(h1 + 2, ease='out', pelvis=(-0.02, 0.87, -0.08), pelvis_rot=(4, -23, 0), torso=(5, -28, 0), head=(0, 18, 0),
          armR=Swing(reach=(94, -10, 0.54), blade=(98, -14), toward=tangent(94, -1), pole=(-0.4, -0.3, -0.8)))
    c.key(h1 + 6, ease='out', pelvis=(-0.01, 0.88, -0.06), pelvis_rot=(3, -24, 0), torso=(4, -30, 0), head=(0, 20, 0),
          armR=Swing(reach=(110, -22, 0.5), blade=(112, -32), toward=tangent(110, -1), pole=(-0.4, -0.3, -0.8)))
    # the edge turns back to the carried hold by degrees (backward, left, forward), not in one frame
    c.key(n - 10, ease='smooth', armR={'toward': (1, 0, 0)})
    c.key(n - 8, ease='smooth', **at_rest(pelvis=(0.0, 0.9, 0.08), torso=(2, -10, 0), armR=Swing(**HANG, **HANG_EDGE)))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    # the boots: the right steps in under the blow, the left follows and the two come level
    c.steps('footR', (-0.115, 0.0, -7), [(1, h0, -0.14, 0.58, -14, 0.1)])
    c.steps('footL', (0.115, 0.0, 7), [(h0 - 1, h1 + 6, 0.13, 0.36, 4, 0.06)])
    return c


def light3(m=None):
    """The fencer's lunge: the hilt drawn back to the ribs with the point on the mark, then the whole body goes after the blade. The right boot reaches out ahead, the left drives behind it and the rear arm
    flings back to balance; the point holds a moment at full stretch, then the blade comes home and the boots close."""
    m = m or timing(W, 'light3')
    c = Clip(m, 'cane.light3')
    c.drawn = True
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    c.key(0, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    c.key(0, look=(0, 1.45, 4))
    # the draw: the weight sinks and goes back over the left leg, the hand comes to the ribs, the point stays on the mark, the off hand lifts to guard
    c.key(6, ease='out', pelvis=(0.03, 0.85, -0.08), pelvis_rot=(2, -8, 0), torso=(3, -14, 0),
          armR=Swing(reach=(-4, -40, 0.38), blade=(-6, 6), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-30, 0, 30), elbow=-60))
    # the drive: the hips go first and low, the shoulders follow, the hand still back: the arm is the last thing to leave
    c.key(11, ease='in', pelvis=(0.02, 0.77, 0.04), pelvis_rot=(6, 14, 0), torso=(9, 18, 0),
          armR=Swing(reach=(-4, -30, 0.4), blade=(-6, 4), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(10, 0, 55), elbow=-50))
    c.key(h0, ease='in', pelvis=(-0.01, 0.75, 0.04), pelvis_rot=(8, 20, 0), torso=(12, 30, 0),
          armR=Swing(reach=(-6, -2, 0.58), blade=(-6, 0), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(15, 0, 80), elbow=-85))
    c.key(h1, ease='linear', pelvis=(-0.02, 0.74, 0.06), pelvis_rot=(8, 22, 0), torso=(13, 32, 0),
          armR=Swing(reach=(-6, -3, 0.58), blade=(-6, -1), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(20, 0, 85), elbow=-90))
    c.key(h1 + 5, ease='smooth', pelvis=(-0.02, 0.77, 0.07), pelvis_rot=(8, 20, 0), torso=(12, 30, 0),
          armR=Swing(reach=(-6, -3, 0.58), blade=(-6, -1), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(5, 0, 75), elbow=-80))
    # the recovery: the elbow folds, the blade comes back to guard, the body rises and unwinds
    c.key(h1 + 12, ease='smooth', pelvis=(0.0, 0.85, 0.0), pelvis_rot=(4, 8, 0), torso=(5, 12, 0),
          armR=Swing(reach=(8, -30, 0.42), blade=(0, 30), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-20, 0, 30), elbow=-40))
    c.key(n - 6, ease='smooth', **at_rest(pelvis=(0.0, 0.905, 0.0), armR=Swing(**HANG, **HANG_EDGE)))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    # the boots: the left shuffles up behind, the right reaches out for the lunge and lands as the point arrives; then the right comes back and the left up, level
    c.steps('footL', (0.115, 0.0, 7), [(1, 7, 0.14, 0.42, 14, 0.05), (h1 + 4, n - 6, 0.115, 0.9, 7)])
    c.steps('footR', (-0.115, 0.0, -7), [(5, h0, -0.13, 1.28, -3, 0.12), (h1 + 4, h1 + 14, -0.115, 0.9, -7, 0.06)])
    return c


def heavy1(m=None):
    """The cleave: the blade swung up high behind his right shoulder, the body coiled and a long beat held at the top, then it falls down the right side and the whole body goes through it. The left boot strides in,
    the hips and shoulders unwind a half turn and the blade carries on down to his left hip, heavy; he stays crouched under its weight before he rises."""
    m = m or timing(W, 'heavy1')
    c = Clip(m, 'cane.heavy1')
    c.drawn = True
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    c.key(0, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    c.key(0, look=(0, 1.4, 4))
    # the gather: he sinks over the right leg, the blade starts up and back
    c.key(8, ease='out', pelvis=(0.03, 0.86, -0.1), pelvis_rot=(0, -12, 0), torso=(-3, -24, 0),
          armR=Swing(reach=(88, 30, 0.5), blade=(130, 36), toward=(0, 0, 1), pole=(-0.5, -0.5, -0.5)), armL=Arm(arm=(-60, 0, 30), elbow=-30))
    # the top: reaching up and back, the chest open, the weight on the rear leg; held a beat
    c.key(14, ease='smooth', pelvis=(0.04, 0.86, -0.05), pelvis_rot=(0, -22, 0), torso=(-9, -42, 0),
          armR=Swing(reach=(104, 46, 0.52), blade=(160, 40), toward=(0, 0, 1), pole=(-0.5, -0.5, -0.5)), armL=Arm(arm=(-70, 0, 40), elbow=-20))
    c.key(17, ease='linear', pelvis=(0.04, 0.86, -0.04), pelvis_rot=(0, -22, 0), torso=(-9, -43, 0),
          armR=Swing(reach=(104, 48, 0.52), blade=(162, 42), toward=(0, 0, 1), pole=(-0.5, -0.5, -0.5)))
    # the fall: the hips drop and drive forward, the blade comes down the right side
    c.key(21, ease='in', pelvis=(0.03, 0.8, 0.0), pelvis_rot=(3, -12, 0), torso=(4, -26, 0),
          armR=Swing(reach=(112, 30, 0.54), blade=(130, 24), toward=tangent(112), pole=(-0.5, -0.5, -0.5)), armL=Arm(arm=(-50, 0, 40), elbow=-30))
    c.key(h0, ease='in', pelvis=(0.04, 0.75, 0.02), pelvis_rot=(4, -2, 0), torso=(10, -4, 0),
          armR=Swing(reach=(100, 6, 0.56), blade=(100, 4), toward=tangent(100), pole=(-0.5, -0.6, -0.4)), armL=Arm(arm=(-30, 0, 25), elbow=-70))
    c.key((h0 + h1) // 2, ease='linear', pelvis=(0.04, 0.74, -0.03), pelvis_rot=(5, 18, 0), torso=(13, 22, 0),
          armR=Swing(reach=(20, -10, 0.58), blade=(20, -14), toward=tangent(20), pole=(-0.4, -0.6, -0.4)), armL=Arm(arm=(10, 0, 20), elbow=-65))
    c.key(h1, ease='linear', pelvis=(0.03, 0.74, -0.07), pelvis_rot=(6, 36, 0), torso=(16, 44, 0),
          armR=Swing(reach=(-60, -24, 0.56), blade=(-62, -30), toward=tangent(-60), pole=(-0.2, -0.7, -0.4)), armL=Arm(arm=(35, 0, 25), elbow=-55))
    # the carry: the blade drops on down to his left hip, the body folds over it and holds there with the weight of it
    c.key(h1 + 3, ease='out', pelvis=(0.02, 0.75, -0.1), pelvis_rot=(6, 42, 0), torso=(20, 50, 0),
          armR=Swing(reach=(-96, -34, 0.5), blade=(-104, -46), toward=tangent(-96), pole=(0.0, -0.7, -0.5)))
    c.key(h1 + 8, ease='smooth', pelvis=(0.0, 0.78, -0.08), pelvis_rot=(5, 38, 0), torso=(17, 46, 0),
          armR=Swing(reach=(-98, -36, 0.5), blade=(-104, -50), toward=tangent(-98), pole=(0.0, -0.7, -0.5)), armL=Arm(arm=(25, 0, 25), elbow=-50))
    c.key(n - 10, ease='smooth', pelvis=(0.0, 0.85, 0.04), pelvis_rot=(2, 20, 0), torso=(8, 24, 0),
          armR=Swing(reach=(-50, -66, 0.52), blade=(-30, -70), toward=(1, 0, 0), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-10, 0, 25), elbow=-30))
    c.key(n - 4, ease='smooth', **at_rest(pelvis=(0.0, 0.905, 0.0), torso=(2, 6, 0), armR=Swing(**HANG, **HANG_EDGE)))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    # the boots: the right steps up under the gather, the left strides through as the blade falls and lands as it bites; then the two close
    c.steps('footR', (-0.115, 0.0, -7), [(6, 15, -0.15, 0.3, -12, 0.06), (h1 + 2, h1 + 12, -0.115, 0.8, -7, 0.06)])
    c.steps('footL', (0.115, 0.0, 7), [(14, h0, 0.15, 1.15, 10, 0.1), (h1 + 6, n - 6, 0.115, 0.8, 7, 0.06)])
    return c


def heavy2(m=None):
    """The wheel: the blade swung back low behind his left side with the body wound hard to the left and held there, then he wheels round on his boots: the left boot strides through, the rear boot swivels on its toe, and
    the blade rises across in front of him from low left to high right with the whole body turning behind it; it lands high at his right, and he comes back round."""
    m = m or timing(W, 'heavy2')
    c = Clip(m, 'cane.heavy2')
    c.drawn = True
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    c.key(0, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    c.key(0, look=(0, 1.4, 4))
    # the coil: he sinks and winds to the left, the blade going out behind that side
    c.key(8, ease='out', pelvis=(0.02, 0.85, -0.06), pelvis_rot=(2, 14, 0), torso=(4, 28, 0),
          armR=Swing(reach=(-58, -8, 0.5), blade=(-100, -16), toward=tangent(-70, -1), pole=(-0.3, -0.7, -0.4)), armL=Arm(arm=(-60, 0, 20), elbow=-30))
    # the top of it: wound as far as he goes, the blade low and far back, the weight on the rear leg; held a beat
    c.key(15, ease='smooth', pelvis=(0.04, 0.82, -0.05), pelvis_rot=(4, 30, 0), torso=(8, 52, 0),
          armR=Swing(reach=(-72, -34, 0.46), blade=(-128, -48), toward=tangent(-90, -1), pole=(-0.3, -0.6, -0.5)), armL=Arm(arm=(-70, 0, 30), elbow=-25))
    c.key(18, ease='linear', pelvis=(0.04, 0.82, -0.04), pelvis_rot=(4, 31, 0), torso=(8, 53, 0),
          armR=Swing(reach=(-73, -35, 0.46), blade=(-130, -50), toward=tangent(-90, -1), pole=(-0.3, -0.6, -0.5)))
    # the wheel begins: the hips drive round first, the blade follows them out to the side
    c.key(22, ease='in', pelvis=(0.04, 0.78, 0.0), pelvis_rot=(4, 14, 0), torso=(8, 34, 0),
          armR=Swing(reach=(-88, -24, 0.52), blade=(-112, -26), toward=tangent(-95, -1), pole=(-0.2, -0.5, 0.6)), armL=Arm(arm=(-40, 0, 40), elbow=-30))
    c.key(h0, ease='in', pelvis=(0.04, 0.76, 0.0), pelvis_rot=(4, 0, 0), torso=(9, 14, 0),
          armR=Swing(reach=(-90, -14, 0.56), blade=(-100, -12), toward=tangent(-100, -1), pole=(-0.2, -0.5, 0.6)), armL=Arm(arm=(0, 0, 30), elbow=-50))
    c.key((h0 + h1) // 2, ease='linear', pelvis=(0.03, 0.75, -0.05), pelvis_rot=(5, -18, 0), torso=(10, -16, 0),
          armR=Swing(reach=(-20, -4, 0.58), blade=(-20, -2), toward=tangent(-20, -1), pole=(-0.3, -0.7, -0.3)), armL=Arm(arm=(30, 0, 25), elbow=-60))
    c.key(h1, ease='linear', pelvis=(0.0, 0.75, -0.09), pelvis_rot=(6, -36, 0), torso=(10, -52, 0),
          armR=Swing(reach=(60, 2, 0.56), blade=(62, 4), toward=tangent(60, -1), pole=(-0.4, -0.5, -0.5)), armL=Arm(arm=(40, 0, 20), elbow=-60))
    # the carry: the blade rises on to high at his right, the body wheeled right round and held there on the weight of it
    c.key(h1 + 3, ease='out', pelvis=(-0.02, 0.77, -0.1), pelvis_rot=(6, -44, 0), torso=(8, -62, 0),
          armR=Swing(reach=(100, 30, 0.5), blade=(112, 40), toward=tangent(100, -1), pole=(-0.4, -0.3, -0.8)))
    c.key(h1 + 9, ease='smooth', pelvis=(-0.02, 0.8, -0.08), pelvis_rot=(5, -40, 0), torso=(7, -56, 0),
          armR=Swing(reach=(100, 28, 0.5), blade=(110, 36), toward=tangent(100, -1), pole=(-0.4, -0.3, -0.8)), armL=Arm(arm=(20, 0, 30), elbow=-50))
    c.key(n - 12, ease='smooth', pelvis=(0.0, 0.86, 0.0), pelvis_rot=(2, -16, 0), torso=(5, -22, 0),
          armR=Swing(reach=(60, -50, 0.52), blade=(30, -52), toward=(-1, 0, 0), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-10, 0, 20), elbow=-30))
    c.key(n - 4, ease='smooth', **at_rest(pelvis=(0.0, 0.905, 0.0), torso=(2, -4, 0), armR=Swing(**HANG, **HANG_EDGE)))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    # the boots: the right gathers up as he coils, the left strides through into the wheel, the right swivels on its toe as the body turns and then follows level
    c.steps('footR', (-0.115, 0.0, -7), [(6, 15, -0.15, 0.3, 14, 0.06)])
    for f in range(h0 - 2, h1 + 3):  # the swivel: the boot stays at its place, lifted a hair, and turns with the hips
        u = (f - (h0 - 2)) / (h1 + 2 - (h0 - 2))
        c.key(f, ease='linear', footR=Foot(-0.15, 0.3, yaw=14 + (-40 - 14) * u * u * (3 - 2 * u), lift=0.012))
    steps_on(c, 'footR', (-0.15, 0.3, -40), [(h1 + 4, n - 8, -0.115, 0.8, -7, 0.06)])
    c.steps('footL', (0.115, 0.0, 7), [(14, h0, 0.12, 1.12, -16, 0.1), (h1 + 8, n - 6, 0.115, 0.8, 7, 0.06)])
    return c


def parry(m=None):
    """A fencer's parry: from the hang the blade flicks up to guard before the first frame of the window is over, beats across his body from right to left to knock the attack aside and holds it there, the weight
    settling back; then the wrist loosens, the blade comes round and a small riposte flick darts out as the right boot steps in, and he recovers to the carried hold."""
    m = m or timing(W, 'parry')
    c = Clip(m, 'cane.parry')
    c.drawn = True
    p0, p1, n = m.parry[0], m.parry[1], m.frames
    c.mark(parry0=p0, parry1=p1)
    c.key(0, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    c.key(0, look=(0, 1.5, 4))
    # up to guard: the blade flicks up in front of him, the point high on the right, and the hips sink back
    c.key(p0, ease='linear', pelvis=(0.0, 0.88, -0.05), pelvis_rot=(1, 4, 0), torso=(2, 8, 0),
          armR=Swing(reach=(15, -20, 0.46), blade=(12, 46), toward=tangent(14), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-20, 0, 40), elbow=-50))
    # the beat: the wrist turns over and the blade sweeps across in front of the chest to his left, the point still up
    c.key(p0 + 4, ease='in', pelvis=(0.0, 0.88, -0.07), pelvis_rot=(1, 10, 0), torso=(2, 16, 0),
          armR=Swing(reach=(-26, -16, 0.5), blade=(-42, 52), toward=tangent(-30), pole=(-0.3, -0.8, -0.2)), armL=Arm(arm=(0, 0, 55), elbow=-45))
    c.key(p1, ease='out', pelvis=(0.0, 0.88, -0.08), pelvis_rot=(1, 12, 0), torso=(2, 18, 0),
          armR=Swing(reach=(-32, -16, 0.52), blade=(-50, 48), toward=tangent(-36), pole=(-0.3, -0.8, -0.2)), armL=Arm(arm=(5, 0, 58), elbow=-42))
    # the loosening: the hand comes back to the ribs, the point swings round toward the mark
    c.key(p1 + 4, ease='smooth', pelvis=(0.0, 0.87, -0.04), pelvis_rot=(1, 2, 0), torso=(2, 4, 0),
          armR=Swing(reach=(8, -26, 0.38), blade=(-4, 14), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-10, 0, 35), elbow=-45))
    # the riposte: a small flick straight out, the boot stepping in and the shoulder behind it
    c.key(p1 + 8, ease='in', pelvis=(0.0, 0.84, 0.06), pelvis_rot=(3, 12, 0), torso=(6, 20, 0),
          armR=Swing(reach=(-4, -2, 0.58), blade=(-6, 2), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(25, 0, 60), elbow=-35))
    c.key(p1 + 10, ease='out', pelvis=(0.0, 0.84, 0.07), pelvis_rot=(3, 13, 0), torso=(6, 21, 0),
          armR=Swing(reach=(-5, -4, 0.56), blade=(-8, 0), toward=(0, 1, 0), pole=(-0.3, -0.8, -0.3)))
    c.key(n - 8, ease='smooth', pelvis=(0.0, 0.89, 0.02), pelvis_rot=(1, 4, 0), torso=(2, 6, 0),
          armR=Swing(reach=(10, -50, 0.5), blade=(10, -60), toward=(0, 0, 1), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-6, 0, 12), elbow=-20))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG, **HANG_EDGE)))
    # the boots: the right steps in with the riposte and back; the left keeps the ground
    c.key(0, **stand_feet(c, 0))
    c.steps('footR', (-0.115, 0.0, -7), [(p1 + 3, p1 + 10, -0.13, 0.14, -5, 0.05), (p1 + 15, n - 4, -0.115, 0.0, -7, 0.05)])
    c.key(n, footL=Foot(0.115, 0.0, yaw=7))
    return c


def build():
    return [light1(), light2(), light3(), heavy1(), heavy2(), parry()]
