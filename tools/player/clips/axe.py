"""The hatchet-axe's four blows and its parry: heavy-headed and one-edged, in the right hand alone (the left is the balancing arm in the blows, and braces the haft only in the parry). Its weight shows in how it is
moved: slow winding-up with the pelvis low and the boots wide, the body throwing the arm and not the arm the body, and a follow-through that carries him a step."""
import numpy as np
import solve as S
import frame as F
from clipkit import Clip, Foot, Swing, Arm, timing
from clips.common import at_rest, tangent

W = 'axe'
# The carried pose's own arms (locomotion.idle: the wrist 58 cm from the shoulder, the haft hanging, the edge forward), written as Swings so the first and last key of a clip are the
# carried pose to a fraction of a degree. The poles are the elbow's way that reproduces the idle's own joint angles.
HANG = dict(reach=(43.4, -81.3, 0.5782), blade=(99.6, -83.9), toward=(0, 0, 1), pole=(0, 0, -1))
HANG_L = dict(reach=(-38.5, -78.8, 0.5768), pole=(0, 0, -1))  # for the clips that hold the haft with the left (every left key of such a clip is a Swing)
REST_LOOK = (0.3, 1.62, 4.0)  # where the idle's head is looking at its first frame


def rest(left=False, **over):
    """The carried pose for a clip's first and last key: `at_rest` with the axe arm (and, if `left`, the left too) as the Swings above, and the idle's gaze."""
    arms = dict(armR=Swing(**HANG))
    if left:
        arms['armL'] = Swing(**HANG_L)
    return at_rest(look=REST_LOOK, **{**arms, **over})


def lead(az, sign=1, drop=0.0):
    """`toward=` for the edge of a cut passing `az`: the way the head is going, the level tangent with `drop` of it falling (a chop comes down as it crosses)."""
    x, _, z = tangent(az, sign)
    return (x, -drop, z)


def on_haft(ch, along=0.2, pole=(0.5, -0.8, -0.3)):
    """The left arm as a Swing that puts the left hand on the haft `along` metres above the right wrist, for the keyed pelvis, torso and right arm in `ch` (the shoulders move with the
    body, so the reach is worked out from where the left one is). The left arm is a Swing in every clip that does this, so its free poses are Swings too (`free`)."""
    B = S.move(ch['pelvis']) @ S.rot(S.euler(ch.get('pelvis_rot', (0, 0, 0))))
    T = B @ S.rot(S.euler(ch.get('torso', (0, 0, 0))))
    sr, sl = [(T @ S.move(F.JOINTS[j][1]))[:3, 3] for j in ('armR', 'armL')]
    az, el, d = ch['armR']['reach']
    hand = sr + d * S.aimv(az, el) + along * S.aimv(*ch['armR']['blade'])
    v = hand - sl
    dist = float(np.linalg.norm(v))
    return Swing(reach=(float(np.degrees(np.arctan2(-v[0], v[2]))), float(np.degrees(np.arcsin(v[1] / dist))), dist), pole=pole)


def free(az, el, dist=0.5, pole=(0.5, -0.8, -0.3)):
    """The left arm out on its own: the wrist `dist` from the left shoulder, `az` degrees to the right of ahead (his left is negative), `el` up."""
    return Swing(reach=(az, el, dist), pole=pole)


def light1(m=None):
    """An overhand chop from his right shoulder: the axe goes up and back as the weight settles onto the right leg, the torso unwinds first, and the head comes over and down across him to the left."""
    m = m or timing(W, 'light1')
    c = Clip(m, 'axe.light1')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    c.key(0, **rest())
    # gather: the weight goes back onto the right leg, the left hand lifts for balance and the axe starts up from the hang
    c.key(3, ease='smooth', pelvis=(0.0, 0.9, -0.03), pelvis_rot=(0, -6, 0), torso=(-1, -12, 0), look=(0, 1.4, 4),
          armR=Swing(reach=(42, -42, 0.4), blade=(62, 8), toward=(0, 0, 1), pole=(-0.5, -0.7, -0.5)), armL=Arm(arm=(-12, 6, 14), elbow=-20))
    c.key(7, ease='smooth', pelvis=(0.0, 0.89, -0.06), pelvis_rot=(0, -12, 0), torso=(-4, -28, 0), look=(0, 1.4, 4),
          armR=Swing(reach=(78, 22, 0.5), blade=(100, 38), toward=(0, 0, 1), pole=(-0.6, -0.6, -0.4)), armL=Arm(arm=(-24, 12, 32), elbow=-34))
    # the top: the axe over and behind the right shoulder, the head leaning back, the chest open
    c.key(10, ease='out', pelvis=(0.0, 0.88, -0.08), pelvis_rot=(0, -15, 0), torso=(-7, -38, 0), look=(0, 1.4, 4),
          armR=Swing(reach=(85, 48, 0.46), blade=(130, 62), toward=(0, -0.3, 1), pole=(-0.7, -0.5, -0.3)), armL=Arm(arm=(-30, 14, 40), elbow=-40))
    # the chop: the torso unwinds first, the wrist drops forward, the haft comes over and the head leads down
    c.key(12.5, ease='in', pelvis=(0.0, 0.85, 0.0), pelvis_rot=(0, -9, 0), torso=(5, -20, 0), look=(0, 1.4, 4),
          armR=Swing(reach=(75, 28, 0.54), blade=(80, 15), toward=(0.3, -0.7, 1), pole=(-0.5, -0.7, -0.2)))
    c.key(h0, ease='in', pelvis=(0.0, 0.82, 0.06), pelvis_rot=(2, -2, 0), torso=(12, -2, 0), look=(0, 1.2, 4),
          armR=Swing(reach=(62, 12, 0.57), blade=(52, -12), toward=lead(60, 1, 0.45), pole=(-0.4, -0.7, -0.2)), armL=Arm(arm=(0, -10, 25), elbow=-60))
    c.key((h0 + h1) // 2, ease='linear', pelvis=(0.0, 0.8, 0.1), pelvis_rot=(2, 8, 0), torso=(14, 18, 0), look=(0, 1.2, 4),
          armR=Swing(reach=(0, -4, 0.58), blade=(-2, -16), toward=lead(0, 1, 0.4)))
    c.key(h1, ease='linear', pelvis=(0.0, 0.8, 0.12), pelvis_rot=(2, 20, 0), torso=(14, 36, 0), look=(0, 1.2, 4),
          armR=Swing(reach=(-72, -6, 0.57), blade=(-92, -16), toward=lead(-80, 1, 0.3), pole=(0.1, -0.7, -0.3)), armL=Arm(arm=(0, 0, 55), elbow=-20))
    # follow-through: the head runs on low to his left, the edge turning outward, the body sagging into the lunge and then rising out of it
    c.key(h1 + 4, ease='out', pelvis=(0.0, 0.82, 0.1), pelvis_rot=(2, 24, 0), torso=(12, 40, 0), look=(0, 1.2, 4),
          armR=Swing(reach=(-95, -22, 0.52), blade=(-112, -42), toward=(1, -0.3, -0.3), pole=(0.2, -0.7, -0.1)))
    c.key(h1 + 8, ease='smooth', pelvis=(0.0, 0.86, 0.06), pelvis_rot=(0, 14, 0), torso=(8, 22, 0),
          armR=Swing(reach=(-40, -45, 0.56), blade=(-40, -62), toward=(1, 0, 0.3), pole=(0.0, -0.8, -0.2)))
    c.key(n - 4, ease='smooth', pelvis=(0.0, 0.9, 0.02), pelvis_rot=(0, 4, 0), torso=(3, 6, 0), armR=Swing(reach=(30, -70, 0.57), blade=(80, -80), toward=(0.4, 0, 1)))
    c.key(n, ease='smooth', still=True, **rest())
    # the boots: the left strides in under the chop, the right is dragged up behind it, and once the blow is spent they shuffle level again
    zn = float(c.root(n)[2])
    c.steps('footL', (0.115, 0.0, 7), [(5, 14, 0.15, zn + 0.14, 5, 0.09), (h1 + 4, n - 6, 0.115, zn, 7, 0.04)])
    c.steps('footR', (-0.115, 0.0, -7), [(11, 22, -0.15, zn - 0.1, -6, 0.08), (h1 + 9, n - 1, -0.115, zn, -7, 0.04)])
    return c


def light2(m=None):
    """A backhand cut from his left: the axe crosses his chest to the far left as the body winds that way, then the right side drives round and the head rises across him in a diagonal, the
    right arm going out wide and the weight carrying him through onto the right boot."""
    m = m or timing(W, 'light2')
    c = Clip(m, 'axe.light2')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    c.key(0, **rest())
    c.key(4, ease='smooth', pelvis=(0.0, 0.9, -0.02), pelvis_rot=(0, 8, 0), torso=(1, 14, 0), look=(0, 1.4, 4),
          armR=Swing(reach=(10, -40, 0.42), blade=(-20, 10), toward=(0, 1, 0.3), pole=(-0.4, -0.7, -0.5)), armL=Arm(arm=(-6, -2, 12), elbow=-18))
    c.key(8, ease='smooth', pelvis=(0.0, 0.88, -0.05), pelvis_rot=(0, 18, 0), torso=(2, 32, 0), look=(0, 1.4, 4),
          armR=Swing(reach=(-45, 5, 0.52), blade=(-75, 25), toward=lead(-72, -1, -0.3), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(10, 0, 40), elbow=-20))
    # the top: the axe across his chest to the far left, the head up and behind it, the torso wound as far as it goes
    c.key(11, ease='out', pelvis=(-0.02, 0.86, -0.08), pelvis_rot=(0, 24, 0), torso=(0, 44, 0), look=(0, 1.4, 4),
          armR=Swing(reach=(-70, 12, 0.5), blade=(-105, 38), toward=lead(-72, -1, -0.3), pole=(-0.2, -0.8, -0.4)), armL=Arm(arm=(15, 0, 55), elbow=-25))
    c.key(14, ease='in', pelvis=(0.0, 0.83, 0.0), pelvis_rot=(0, 16, 0), torso=(8, 26, 0), look=(0, 1.3, 4),
          armR=Swing(reach=(-72, 4, 0.55), blade=(-85, 10), toward=lead(-72, -1, -0.3), pole=(-0.1, -0.8, -0.3)))
    c.key(h0, ease='in', pelvis=(0.0, 0.8, 0.08), pelvis_rot=(2, 8, 0), torso=(12, 14, 0), look=(0, 1.2, 4),
          armR=Swing(reach=(-84, -8, 0.57), blade=(-90, -14), toward=lead(-72, -1, -0.3), pole=(-0.1, -0.8, -0.3)), armL=Arm(arm=(0, 0, 30), elbow=-30))
    c.key(h0 + 2, ease='linear', pelvis=(0.0, 0.79, 0.1), pelvis_rot=(2, -2, 0), torso=(14, -4, 0), look=(0, 1.2, 4),
          armR=Swing(reach=(-26, -4, 0.58), blade=(-28, -4), toward=lead(-14, -1, -0.35)))
    c.key(h1, ease='linear', pelvis=(0.0, 0.8, 0.12), pelvis_rot=(2, -18, 0), torso=(12, -34, 0), look=(0, 1.2, 4),
          armR=Swing(reach=(62, 0, 0.57), blade=(76, 8), toward=lead(80, -1, -0.3), pole=(-0.7, -0.5, -0.1)), armL=Arm(arm=(-5, 0, 50), elbow=-15))
    c.key(h1 + 4, ease='out', pelvis=(0.0, 0.82, 0.1), pelvis_rot=(2, -24, 0), torso=(10, -42, 0), look=(0, 1.2, 4),
          armR=Swing(reach=(100, 24, 0.52), blade=(118, 18), toward=(-0.1, 0.3, -1), pole=(-0.8, -0.3, -0.1)))
    c.key(h1 + 8, ease='smooth', pelvis=(0.0, 0.86, 0.06), pelvis_rot=(0, -14, 0), torso=(6, -26, 0),
          armR=Swing(reach=(80, -10, 0.56), blade=(100, -35), toward=(0, -1, 0), pole=(-0.4, -0.7, -0.2)))
    c.key(n - 5, ease='smooth', pelvis=(0.0, 0.9, 0.02), pelvis_rot=(0, -4, 0), torso=(3, -8, 0), armR=Swing(reach=(55, -60, 0.57), blade=(90, -75), toward=(0, 0, 1)))
    c.key(n, ease='smooth', still=True, **rest())
    # the boots: the right crosses in under the cut, the left follows, then they come level
    zn = float(c.root(n)[2])
    c.steps('footR', (-0.115, 0.0, -7), [(5, 15, -0.15, zn + 0.14, -5, 0.09), (h1 + 4, n - 6, -0.115, zn, -7, 0.04)])
    c.steps('footL', (0.115, 0.0, 7), [(12, 24, 0.15, zn - 0.1, 6, 0.08), (h1 + 9, n - 1, 0.115, zn, 7, 0.04)])
    return c


def heavy1(m=None):
    """The cleave: he gathers low and heaves the axe up with the whole body, then throws it back behind the right shoulder, torso wound right and weight on the rear leg, the free arm
    pointing at what he means to split; the hips fall into a wide lunge, the torso unwinds first, and the head crashes down across him from high on his right to low at his left, dragging him over it."""
    m = m or timing(W, 'heavy1')
    c = Clip(m, 'axe.heavy1')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    zn = float(c.root(n)[2])
    look = (0, 1.35, 4)

    def key(t, hands=None, **ch):
        if hands is not None:
            ch['armL'] = on_haft(ch, hands)
        ch.setdefault('look', look)
        c.key(t, **ch)

    key(0, **rest(left=True))
    # the heave: down into the knees with the free arm reaching forward for balance, then up on the toes with the axe overhead
    key(5, ease='smooth', pelvis=(0.0, 0.86, 0.0), pelvis_rot=(0, 0, 0), torso=(12, -8, 0), armR=Swing(reach=(12, -38, 0.46), blade=(18, 52), toward=(0, 0, 1), pole=(-0.3, -0.8, 0.2)), armL=free(-22, -22, 0.46))
    key(11, ease='smooth', pelvis=(0.0, 0.9, -0.03), pelvis_rot=(0, -6, 0), torso=(-2, -16, 0), armR=Swing(reach=(10, 28, 0.5), blade=(40, 62), toward=(0, 0, 1), pole=(-0.4, -0.6, -0.1)), armL=free(-30, 20, 0.5))
    key(15, ease='out', pelvis=(0.0, 0.93, -0.06), pelvis_rot=(0, -12, 0), torso=(-9, -26, 0), armR=Swing(reach=(40, 46, 0.47), blade=(100, 62), toward=(0, -0.2, 1), pole=(-0.7, -0.5, -0.2)), armL=free(-15, 25, 0.5))
    # thrown back: the axe behind the right shoulder, the torso wound, the weight on the rear leg and the free arm out at the target
    key(23, ease='smooth', pelvis=(-0.05, 0.8, -0.12), pelvis_rot=(0, -26, 0), torso=(-10, -50, 0), armR=Swing(reach=(105, 22, 0.5), blade=(148, 42), toward=(0, -0.3, 1), pole=(-0.8, -0.2, -0.5)), armL=free(-15, 8, 0.56))
    # the hips and torso go first, the axe still cocked high behind him; then the head comes over and down to the side where the cleave starts
    key(27, ease='in', pelvis=(0.0, 0.77, -0.04), pelvis_rot=(0, -16, 0), torso=(0, -42, 0), armR=Swing(reach=(100, 34, 0.5), blade=(142, 48), toward=(0, -0.4, 1), pole=(-0.8, -0.3, -0.5)), armL=free(-30, -20, 0.5))
    key(30, ease='in', pelvis=(0.0, 0.75, 0.04), pelvis_rot=(1, -8, 0), torso=(8, -30, 0), armR=Swing(reach=(98, 14, 0.56), blade=(135, 12), toward=lead(110, 1, 0.5), pole=(-0.7, -0.4, -0.3)), armL=free(-36, -28, 0.46))
    # the hit: the wrist leads and the head trails it round on the haft, the trail closing as the stroke ends; the hips are down in the lunge and the chest comes over the blow
    key(h0, ease='in', pelvis=(0.0, 0.74, 0.1), pelvis_rot=(2, -4, 0), torso=(16, -22, 0), armR=Swing(reach=(94, 2, 0.57), blade=(129, -10), toward=lead(110, 1, 0.35), pole=(-0.6, -0.6, -0.3)), armL=free(-40, -35, 0.45))
    key((h0 + h1) // 2, ease='linear', pelvis=(0.02, 0.73, 0.12), pelvis_rot=(2, 10, 0), torso=(22, 14, 0), armR=Swing(reach=(9, -8, 0.58), blade=(34, -18), toward=lead(20, 1, 0.4)))
    key(h1, ease='linear', pelvis=(0.05, 0.73, 0.14), pelvis_rot=(2, 22, 0), torso=(28, 40, 0), armR=Swing(reach=(-86, -12, 0.57), blade=(-80, -24), toward=lead(-70, 1, 0.3), pole=(0.1, -0.7, -0.3)), armL=free(-60, -10, 0.5))
    # the head's weight carries it on, low behind his left; he is dragged over it, then hauls it back up to the carried hang with the free arm swinging in to meet it
    key(h1 + 5, ease='out', pelvis=(0.04, 0.72, 0.12), pelvis_rot=(4, 28, 0), torso=(34, 48, 0), armR=Swing(reach=(-112, -42, 0.5), blade=(-125, -58), toward=(1, -0.3, -0.5), pole=(0.2, -0.7, -0.1)), armL=free(-80, 0, 0.55))
    key(h1 + 11, ease='smooth', pelvis=(0.0, 0.8, 0.08), pelvis_rot=(2, 18, 0), torso=(18, 30, 0), armR=Swing(reach=(-60, -50, 0.55), blade=(-70, -60), toward=(1, 0, 0.3), pole=(0.0, -0.8, -0.2)), armL=free(-70, -35, 0.5))
    key(h1 + 18, ease='smooth', pelvis=(0.0, 0.86, 0.04), pelvis_rot=(0, 6, 0), torso=(8, 12, 0), armR=Swing(reach=(10, -65, 0.57), blade=(60, -75), toward=(0.4, 0, 1)), armL=free(-45, -70, 0.55))
    key(n, ease='smooth', still=True, **rest(left=True))
    c.steps('footL', (0.115, 0.0, 7), [(19, 33, 0.2, zn + 0.38, 12, 0.1), (h1 + 8, h1 + 18, 0.115, zn, 7)])
    c.steps('footR', (-0.115, 0.0, -7), [(25, 38, -0.2, zn - 0.35, -14, 0.1), (h1 + 12, h1 + 24, -0.115, zn, -7)])
    return c


def heavy2(m=None):
    """The wheel: he coils low and to the right, the axe let out behind him at arm's length like a hammer's head, the pelvis starts round first with the torso whipped after it and the arm
    last, and the whole flat circle goes about him, the free arm out the other way for balance; the turn takes him on past it and he has to step round to stop."""
    m = m or timing(W, 'heavy2')
    c = Clip(m, 'axe.heavy2')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    zn = float(c.root(n)[2])
    look = (0, 1.35, 4)

    def key(t, **ch):
        ch.setdefault('look', look)
        c.key(t, **ch)

    key(0, **rest(left=True))
    key(6, ease='smooth', pelvis=(0.0, 0.86, -0.03), pelvis_rot=(0, -12, 0), torso=(6, -20, 0), armR=Swing(reach=(72, -36, 0.56), blade=(110, -38), toward=(0, 0, 1), pole=(-0.5, -0.7, -0.3)), armL=free(-20, 8, 0.5))
    # the coil: low, the torso turned to the right, the axe out behind at arm's length, the free arm pointing at the target
    key(14, ease='smooth', pelvis=(-0.04, 0.8, -0.1), pelvis_rot=(0, -30, 0), torso=(8, -46, 0), armR=Swing(reach=(100, -34, 0.57), blade=(150, -28), toward=(0, -0.2, 1), pole=(-0.7, -0.7, -0.4)), armL=free(-12, 12, 0.56))
    key(21, ease='smooth', pelvis=(-0.02, 0.77, -0.08), pelvis_rot=(0, -34, 0), torso=(8, -48, 0), armR=Swing(reach=(104, -34, 0.57), blade=(150, -28), toward=(0, -0.2, 1), pole=(-0.7, -0.7, -0.4)), armL=free(-12, 12, 0.56))
    # the pelvis leads the turn, the torso is whipped after it, the arm trails: they are no longer in one line
    key(26, ease='in', pelvis=(0.0, 0.75, 0.04), pelvis_rot=(0, -8, 0), torso=(10, -36, 0), armR=Swing(reach=(100, -30, 0.57), blade=(130, -22), toward=lead(100, 1), pole=(-0.7, -0.6, -0.3)), armL=free(-62, -18, 0.52))
    key(h0, ease='in', pelvis=(0.0, 0.74, 0.1), pelvis_rot=(2, 6, 0), torso=(12, -16, 0), armR=Swing(reach=(85, -24, 0.58), blade=(123, -18), toward=lead(100, 1), pole=(-0.6, -0.6, -0.3)), armL=free(-90, 0, 0.57))
    key((h0 + h1) // 2, ease='linear', pelvis=(0.0, 0.74, 0.12), pelvis_rot=(2, 20, 0), torso=(12, 20, 0), armR=Swing(reach=(-9, -2, 0.58), blade=(11, 0), toward=lead(0, 1, -0.2)), armL=free(-100, 6, 0.57))
    key(h1, ease='linear', pelvis=(0.0, 0.75, 0.12), pelvis_rot=(2, 36, 0), torso=(12, 52, 0), armR=Swing(reach=(-116, 4, 0.58), blade=(-111, 4), toward=lead(-100, 1, -0.2), pole=(0.3, -0.6, -0.3)), armL=free(-105, 10, 0.57))
    # the circle carries on round behind his left and the turn takes him with it; he plants and brings it back
    key(h1 + 5, ease='out', pelvis=(0.0, 0.76, 0.1), pelvis_rot=(2, 44, 0), torso=(10, 62, 0), armR=Swing(reach=(-140, 8, 0.55), blade=(-150, 6), toward=(0.5, 0, -1), pole=(0.4, -0.6, -0.2)), armL=free(-100, 0, 0.55))
    key(h1 + 11, ease='smooth', pelvis=(0.0, 0.8, 0.06), pelvis_rot=(0, 28, 0), torso=(8, 36, 0), armR=Swing(reach=(-70, -20, 0.55), blade=(-80, -40), toward=(1, 0, 0.3), pole=(0.2, -0.7, -0.2)), armL=free(-50, -35, 0.5))
    key(h1 + 18, ease='smooth', pelvis=(0.0, 0.87, 0.03), pelvis_rot=(0, 8, 0), torso=(4, 12, 0), armR=Swing(reach=(10, -65, 0.57), blade=(60, -75), toward=(0.4, 0, 1)), armL=free(-40, -70, 0.55))
    key(n, ease='smooth', still=True, **rest(left=True))
    c.steps('footL', (0.115, 0.0, 7), [(18, 33, 0.2, zn + 0.3, 16, 0.1), (h1 + 6, h1 + 18, 0.115, zn, 7)])
    c.steps('footR', (-0.115, 0.0, -7), [(21, 35, -0.2, zn - 0.3, 24, 0.1), (h1 + 10, h1 + 22, -0.115, zn, -7)])
    return c


def parry(m=None):
    """The catch: the haft snaps across him, head up to his left, the left hand coming to brace it, and the whole of him is shoved in behind it on a short step; then it comes back and he
    settles."""
    m = m or timing(W, 'parry')
    c = Clip(m, 'axe.parry')
    (p0, p1), n = m.parry, m.frames
    c.mark(parry0=p0, parry1=p1)
    look = (0, 1.4, 4)

    def key(t, hands=0.22, **ch):
        ch['armL'] = on_haft(ch, hands) if hands else ch['armL']
        ch.setdefault('look', look)
        c.key(t, **ch)

    c.key(0, **rest(left=True))
    # snapped across in four frames (the game's parry opens at the third: by then it is across): the haft angled up at his chest, the head high on his left, the left hand on it
    key(p0 + 1, ease='linear', pelvis=(0.0, 0.88, 0.04), pelvis_rot=(0, 0, 0), torso=(4, -6, 0), armR=Swing(reach=(-26, -14, 0.44), blade=(-62, 38), toward=(0, 1, 0.2), pole=(-0.4, -0.7, -0.3)))
    # the shove: the weight goes in behind it, the arms drive out and the head tips up
    key(p0 + 5, ease='out', pelvis=(0.0, 0.84, 0.12), pelvis_rot=(0, -2, 0), torso=(9, -8, 0), armR=Swing(reach=(-20, -8, 0.5), blade=(-56, 42), toward=(0, 1, 0.2), pole=(-0.4, -0.7, -0.3)))
    key(p1, ease='smooth', pelvis=(0.0, 0.85, 0.11), pelvis_rot=(0, -1, 0), torso=(8, -7, 0), armR=Swing(reach=(-21, -8, 0.49), blade=(-58, 40), toward=(0, 1, 0.2), pole=(-0.4, -0.7, -0.3)))
    # it comes back: the left hand lets go and drops, the haft sinks across him
    key(p1 + 8, None, ease='smooth', pelvis=(0.0, 0.88, 0.05), pelvis_rot=(0, 5, 0), torso=(5, 6, 0), armR=Swing(reach=(-30, -12, 0.54), blade=(-45, 0), toward=(0, 0, 1), pole=(-0.4, -0.7, -0.3)), armL=free(-30, -50, 0.55))
    key(p1 + 17, None, ease='smooth', pelvis=(0.0, 0.905, 0.01), pelvis_rot=(0, 1, 0), torso=(2, 1, 0), armR=Swing(reach=(30, -65, 0.57), blade=(80, -78), toward=(0, 0, 1), pole=(-0.3, -0.8, -0.3)), armL=free(-38, -75, 0.57))
    c.key(n, ease='smooth', still=True, **rest(left=True))
    c.steps('footL', (0.115, 0.0, 7), [(1, 6, 0.15, 0.24, 4, 0.06), (p1 + 5, p1 + 17, 0.115, 0.0, 7, 0.05)])
    c.key(0, footR=Foot(-0.115, 0.0, yaw=-7))
    c.key(p0, ease='smooth', footR=Foot(-0.13, -0.03, yaw=-10))
    c.key(p1 + 6, ease='smooth', footR=Foot(-0.13, -0.03, yaw=-10))
    c.key(p1 + 16, ease='smooth', footR=Foot(-0.115, 0.0, yaw=-7))
    c.key(n, ease='smooth', footR=Foot(-0.115, 0.0, yaw=-7))
    return c


def build():
    return [light1(), light2(), heavy1(), heavy2(), parry()]
