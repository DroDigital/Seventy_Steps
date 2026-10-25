"""The drowned sailor's cutlass: three light blows, two heavy and a parry. 0.77 m from the wrist, one-edged and broad, so the edge must lead every cut.

His hand with it is a seaman's: a wide stance on bent knees that rolls with the weight (the pelvis and chest sway from boot to boot, the head leaning over the loaded leg), big flat slashes thrown
from the hips and shoulders in that order with the arm out at the end of them and the free arm thrown back to balance, and heavy overhead hacks that drop the whole body onto the blade. Light1 and
light2 are the flat slash to his left and its backhand back to his right, light3 the overhead chop down the middle; heavy1 winds back to the right and whirls nearly all the way round on his
boots, heavy2 heaves the blade up and cleaves it down the middle with the left hand come across onto the grip. The parry is the hilt thrown up across his face with a shove behind it.
Every blow begins and ends at the carried pose (`rest`, the idle's own arms written as Swings), so the game's crossfade has nothing to hide.
"""
import numpy as np
import solve as S
import frame as F
from clipkit import Clip, Foot, Swing, Arm, timing
from clips.common import at_rest, tangent

W = 'cutlass'
# The carried pose's own arms (locomotion.idle: the wrist 58 cm from the shoulder, the weapon hanging, the edge forward), written as Swings so the first and last key of a clip are the carried
# pose to a fraction of a degree. The poles are the elbow's way that reproduces the idle's own joint angles.
HANG = dict(reach=(43.4, -81.3, 0.5782), blade=(99.6, -83.9), toward=(0, 0, 1), pole=(0, 0, -1))
HANG_L = dict(reach=(-38.5, -78.8, 0.5768), pole=(0, 0, -1))  # the left arm's, for the clips that bring it to the grip (every left key of such a clip is then a Swing)
REST_LOOK = (0.3, 1.62, 4.0)  # where the idle's head is looking at its first frame
LOOK = (0, 1.4, 4)  # and where it looks through a blow: at the foe, a little below his own eyes
ROLL = (-0.35, -0.65, -0.45)  # the elbow's way for a cut thrown out to his right: down and out
ACROSS = (-0.2, -0.7, 0.2)  # and for the arm brought across his chest to the left


def rest(left=False, **over):
    """The carried pose for a clip's first and last key: `at_rest` with the sword arm (and, if `left`, the left too) as the Swings above, and the idle's gaze."""
    arms = dict(armR=Swing(**HANG))
    if left:
        arms['armL'] = Swing(**HANG_L)
    return at_rest(look=REST_LOOK, **{**arms, **over})


def cut(az, el=0.0, d=0.57, baz=None, bel=None, sign=1, drop=0.0, pole=ROLL):
    """The sword arm in a cut passing `az`, `el`: the wrist `d` from the shoulder and the blade out along the same bearing and height unless `baz` and `bel` say it trails or leads; its edge leading,
    the way the blade is going: the level tangent (`sign` +1 for a cut from his right to his left, -1 the other way) with `drop` of it falling (a hack comes down as it crosses)."""
    baz = az if baz is None else baz
    x, _, z = tangent(baz, sign)
    return Swing(reach=(az, el, d), blade=(baz, el if bel is None else bel), toward=(x, -drop, z), pole=pole)


def free(az, el, dist=0.5, pole=(0.5, -0.8, -0.3)):
    """The left arm out on its own: the wrist `dist` from the left shoulder, `az` degrees to the right of ahead (his left is negative), `el` up."""
    return Swing(reach=(az, el, dist), pole=pole)


def on_grip(ch, along=0.1, pole=(0.5, -0.8, -0.2)):
    """The left arm as a Swing that puts the left hand on the grip, `along` metres above the right wrist (toward the pommel), for the keyed pelvis, torso and sword arm in `ch`: the shoulders move
    with the body, so the reach is worked out from where the left one is."""
    B = S.move(ch['pelvis']) @ S.rot(S.euler(ch.get('pelvis_rot', (0, 0, 0))))
    T = B @ S.rot(S.euler(ch.get('torso', (0, 0, 0))))
    sr, sl = [(T @ S.move(F.JOINTS[j][1]))[:3, 3] for j in ('armR', 'armL')]
    az, el, d = ch['armR']['reach']
    hand = sr + d * S.aimv(az, el) - along * S.aimv(*ch['armR']['blade'])
    v = hand - sl
    dist = float(np.linalg.norm(v))
    return Swing(reach=(float(np.degrees(np.arctan2(-v[0], v[2]))), float(np.degrees(np.arcsin(v[1] / dist))), min(dist, 0.575)), pole=pole)


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


def turned(v, yaw):
    """A direction given for a figure facing ahead (an elbow's way, say), as it is for one turned `yaw` degrees to his left."""
    return tuple(float(x) for x in S.ry(np.radians(yaw)) @ np.asarray(v, float))


def keyer(c, look=LOOK):
    """`key` for a clip with a big turn in it: the sword arm's `pole` is written for a figure facing ahead (down and out to his right, say) and is turned with the hips and chest, so the elbow stays
    on the right side of him however far round he is; and the head looks at `look` unless a key says."""
    def key(t, **ch):
        ch.setdefault('look', look)
        arm = ch.get('armR')
        if isinstance(arm, dict) and arm.get('pole') is not None and 'pelvis_rot' in ch:
            ch['armR'] = dict(arm, pole=turned(arm['pole'], ch['pelvis_rot'][1] + ch.get('torso', (0, 0, 0))[1]))
        c.key(t, **ch)
    return key


def pelvis_at(c, f):
    """Where the hips are at frame f as keyed so far: (x, z in the clip's world, yaw degrees). Key the body first, then put the boots about it."""
    p = c.series[('pelvis', None)].at(f)
    r = c.root(f)
    return float(p[0] + r[0]), float(p[2] + r[2]), float(c.series[('pelvis_rot', None)].at(f)[1])


def around(c, f, side, w=0.2, d=0.0, spread=7.0):
    """Where a boot stands about the hips at frame f: `w` out to its own side and `d` ahead of them, the pair turned with the hips, toes `spread` degrees out. (x, z, yaw) in the clip's world."""
    px, pz, yaw = pelvis_at(c, f)
    a, s = np.radians(yaw), (-1 if side == 'footR' else 1)
    x = s * w
    return px + x * np.cos(a) + d * np.sin(a), pz - x * np.sin(a) + d * np.cos(a), yaw + s * spread


def orbit(c, side, f0, f1, start, w=0.2, d=0.0, spread=7.0, lift=0.035):
    """A boot carried round the hips between frame f0 and f1, planted at both ends: it begins where it stands (`start`, its world place) and ends `w` out and `d` ahead of the hips; between, it keeps
    its place about them as they swing round, lifted a hair and pivoting as it goes, so it never skates along the ground."""
    px, pz, yaw = pelvis_at(c, f0)
    a = np.radians(yaw)
    ox, oz = start[0] - px, start[1] - pz  # where it stands about the hips, in the hips' own frame
    bx, bz = ox * np.cos(a) - oz * np.sin(a), ox * np.sin(a) + oz * np.cos(a)
    byaw = start[2] - yaw
    c.key(f0, ease='linear', **{side: Foot(start[0], start[1], start[2])})
    x1, z1, y1 = around(c, f1, side, w, d, spread)
    s_ = -1 if side == 'footR' else 1
    for f in range(f0 + 1, f1):
        u = (f - f0) / (f1 - f0)
        e = u * u * (3 - 2 * u)
        px, pz, yaw = pelvis_at(c, f)
        a = np.radians(yaw)
        x, z = bx + (s_ * w - bx) * e, bz + (d - bz) * e
        c.key(f, ease='linear', **{side: Foot(px + x * np.cos(a) + z * np.sin(a), pz - x * np.sin(a) + z * np.cos(a), yaw + byaw + (s_ * spread - byaw) * e, lift=lift * float(np.sin(np.pi * u)))})
    c.key(f1, ease='linear', **{side: Foot(x1, z1, y1)})
    return x1, z1, y1


def light1(m=None):
    """The flat slash: he sinks onto his right leg and winds right back with the elbow cocked and the blade behind that side, then the hips go first and the chest after them and the blade whips level
    across in front of him from his right to his left, the arm snapping out straight and the free arm thrown back the other way; the weight lands on the left boot and the blade carries on, dragging him round."""
    m = m or timing(W, 'light1')
    c = Clip(m, 'cutlass.light1')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    zn = float(c.root(n)[2])
    c.key(0, **rest())
    # wind-up: the weight settles onto the right leg and the head leans over it, the chest turns right and the blade goes out and back on that side with the elbow bent, the free hand lifting to balance it
    c.key(4, ease='out', pelvis=(-0.03, 0.88, -0.04), pelvis_rot=(1, -12, 2), torso=(3, -22, 5), look=LOOK,
          armR=cut(100, -18, 0.42, baz=110, bel=-4, pole=ROLL), armL=Arm(arm=(-30, 0, 40), elbow=-45))
    c.key(8, ease='smooth', pelvis=(-0.06, 0.8, -0.08), pelvis_rot=(2, -20, 3), torso=(5, -38, 7),
          armR=cut(125, 4, 0.5, baz=138, bel=6, pole=ROLL), armL=Arm(arm=(-35, 0, 50), elbow=-50))
    # the cut: the hips are round before the arm moves, the blade comes through level at the height of his chest, the elbow straightening as it goes and the weight crossing to the left boot
    c.key(h0, ease='in', pelvis=(-0.02, 0.77, 0.02), pelvis_rot=(4, 2, 0), torso=(8, -20, 0),
          armR=cut(80, -6, 0.57), armL=Arm(arm=(-15, 0, 55), elbow=-45))
    c.key(13, ease='linear', pelvis=(0.02, 0.76, 0.06), pelvis_rot=(5, 16, -2), torso=(9, 6, -5), armR=cut(0, -8, 0.58), armL=Arm(arm=(20, 0, 60), elbow=-30))
    c.key(h1, ease='linear', pelvis=(0.04, 0.78, 0.07), pelvis_rot=(5, 28, -3), torso=(8, 30, -8),
          armR=cut(-80, -10, 0.57, pole=ACROSS), armL=Arm(arm=(40, 0, 50), elbow=-35))
    # follow-through: the blade runs on across and sags, the body comes up out of the lunge
    c.key(h1 + 2, ease='out', pelvis=(0.04, 0.8, 0.06), pelvis_rot=(4, 30, -2), torso=(7, 38, -6), armR=cut(-100, -18, 0.55, baz=-112, bel=-26, pole=ACROSS), armL=Arm(arm=(35, 0, 45), elbow=-40))
    c.key(h1 + 6, ease='smooth', pelvis=(0.02, 0.84, 0.03), pelvis_rot=(3, 28, 0), torso=(5, 34, -2), armR=cut(-104, -34, 0.52, baz=-110, bel=-45, pole=ACROSS), armL=Arm(arm=(15, 0, 30), elbow=-35))
    # the edge turns back to the carried hold by degrees (backward, left, forward), not in one frame
    c.key(h1 + 9, ease='smooth', pelvis=(0.0, 0.87, 0.02), pelvis_rot=(2, 18, 0), torso=(4, 20, 0), armR=cut(-60, -50, 0.55, baz=-45, bel=-62, pole=ACROSS) | {'toward': (1, 0, 0.2)},
          armL=Arm(arm=(-6, 0, 22), elbow=-20))
    c.key(n - 3, ease='smooth', **rest(pelvis=(0.0, 0.9, 0.02), torso=(2, 6, 0)))
    c.key(n, ease='smooth', still=True, **rest())
    # the boots: the left strides in under the cut and takes the weight, the right is dragged up wide behind it, then both come in level
    c.steps('footL', (0.115, 0.0, 7), [(2, 11, 0.25, zn + 0.28, 16, 0.1), (h1 + 3, n - 4, 0.115, zn, 7, 0.05)])
    c.steps('footR', (-0.115, 0.0, -7), [(8, 17, -0.26, zn - 0.2, -18, 0.06), (h1 + 6, n - 1, -0.115, zn, -7, 0.05)])
    return c


def light2(m=None):
    """The backhand: the answer to the slash, with the blade brought round across his chest to his left as he winds that way, the elbow cocked, then thrown back out level to his right with the arm
    snapping straight and the free arm flung back behind him; the weight goes onto the right boot as the blade runs on."""
    m = m or timing(W, 'light2')
    c = Clip(m, 'cutlass.light2')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    zn = float(c.root(n)[2])
    c.key(0, **rest())
    c.key(4, ease='out', pelvis=(0.03, 0.88, -0.04), pelvis_rot=(1, 12, -2), torso=(3, 22, -5), look=LOOK,
          armR=cut(-20, -25, 0.44, baz=-90, bel=-5, sign=-1, pole=ACROSS), armL=Arm(arm=(-30, 0, 40), elbow=-45))
    c.key(8, ease='smooth', pelvis=(0.06, 0.8, -0.08), pelvis_rot=(2, 20, -3), torso=(5, 38, -7),
          armR=cut(-60, 6, 0.46, baz=-125, bel=8, sign=-1, pole=ACROSS), armL=Arm(arm=(-25, 0, 55), elbow=-45))
    c.key(h0, ease='in', pelvis=(0.02, 0.77, 0.02), pelvis_rot=(4, -2, 0), torso=(8, 20, 0),
          armR=cut(-80, -6, 0.5, sign=-1, pole=ACROSS), armL=Arm(arm=(-10, 0, 60), elbow=-40))
    c.key(13, ease='linear', pelvis=(-0.02, 0.76, 0.06), pelvis_rot=(5, -16, 2), torso=(9, -6, 5), armR=cut(0, -8, 0.58, sign=-1, pole=ACROSS), armL=Arm(arm=(25, 0, 65), elbow=-30))
    c.key(h1, ease='linear', pelvis=(-0.04, 0.78, 0.07), pelvis_rot=(5, -28, 3), torso=(8, -30, 8), armR=cut(80, -10, 0.57, sign=-1), armL=Arm(arm=(45, 0, 60), elbow=-35))
    c.key(h1 + 2, ease='out', pelvis=(-0.04, 0.8, 0.06), pelvis_rot=(4, -30, 2), torso=(7, -38, 6), armR=cut(100, -18, 0.55, baz=112, bel=-26, sign=-1), armL=Arm(arm=(40, 0, 55), elbow=-40))
    c.key(h1 + 6, ease='smooth', pelvis=(-0.02, 0.84, 0.03), pelvis_rot=(3, -28, 0), torso=(5, -34, 2), armR=cut(104, -34, 0.52, baz=110, bel=-45, sign=-1), armL=Arm(arm=(15, 0, 35), elbow=-35))
    c.key(h1 + 9, ease='smooth', pelvis=(0.0, 0.87, 0.02), pelvis_rot=(2, -18, 0), torso=(4, -20, 0), armR=cut(60, -50, 0.55, baz=45, bel=-62, sign=-1) | {'toward': (-1, 0, 0.2)},
          armL=Arm(arm=(-6, 0, 22), elbow=-20))
    c.key(n - 3, ease='smooth', **rest(pelvis=(0.0, 0.9, 0.02), torso=(2, -6, 0)))
    c.key(n, ease='smooth', still=True, **rest())
    c.steps('footR', (-0.115, 0.0, -7), [(2, 11, -0.25, zn + 0.28, -16, 0.1), (h1 + 3, n - 4, -0.115, zn, -7, 0.05)])
    c.steps('footL', (0.115, 0.0, 7), [(8, 17, 0.26, zn - 0.2, 18, 0.06), (h1 + 6, n - 1, 0.115, zn, 7, 0.05)])
    return c


def hack(e, drop=1.0):
    """`toward=` for the edge of a blade pointing `e` degrees up from level (past 90 it points back over his shoulder) as it is swung over and down in front of him: the way its tip goes, which at
    the top is forward and at the bottom is down."""
    r = np.radians(e)
    return (0.0, -float(np.cos(r)) * drop, float(np.sin(r)))


def light3(m=None):
    """The hack: the blade thrown up over his right shoulder as he rises, the free arm reaching forward and his chest bowed back; then the hips drop out from under him and the whole weight comes down
    onto the blade, the free arm thrown back, the edge chopping down the middle of him from high to low; he stays bowed over it a moment before he straightens."""
    m = m or timing(W, 'light3')
    c = Clip(m, 'cutlass.light3')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    zn = float(c.root(n)[2])
    OUT = (-0.5, -0.5, -0.1)  # the elbow out to his right while the blade is raised
    c.key(0, **rest())
    # the throw up: the blade swings out and up from the hang, the free hand lifting with it
    c.key(6, ease='smooth', pelvis=(-0.01, 0.9, -0.03), pelvis_rot=(0, -8, 0), torso=(0, -14, -2), look=LOOK,
          armR=Swing(reach=(55, 12, 0.52), blade=(70, 55), toward=hack(55), pole=OUT), armL=Arm(arm=(-45, 0, 30), elbow=-40))
    # the top: the arm up beside his head, the blade cocked back over the shoulder, the chest arched and the weight rocked back onto the right leg; held a beat
    c.key(8, ease='smooth', pelvis=(-0.03, 0.93, -0.1), pelvis_rot=(-2, -14, -2), torso=(-12, -24, -3),
          armR=Swing(reach=(24, 62, 0.5), blade=(10, 112), toward=hack(112), pole=OUT), armL=Arm(arm=(-85, 0, 25), elbow=-30))
    c.key(10, ease='linear', pelvis=(-0.03, 0.93, -0.1), pelvis_rot=(-2, -14, -2), torso=(-12, -24, -3),
          armR=Swing(reach=(24, 63, 0.5), blade=(10, 114), toward=hack(114), pole=OUT), armL=Arm(arm=(-85, 0, 25), elbow=-30))
    # the drop: the hips fall first and drive on, the chest folds over after them, and the blade is still up behind: the arm is the last thing to come
    c.key(12, ease='in', pelvis=(-0.01, 0.87, -0.04), pelvis_rot=(1, -10, 0), torso=(0, -14, 0),
          armR=Swing(reach=(16, 58, 0.5), blade=(8, 100), toward=hack(100), pole=OUT), armL=Arm(arm=(-70, 0, 30), elbow=-30))
    c.key(14, ease='in', pelvis=(0.0, 0.8, 0.05), pelvis_rot=(3, -2, 0), torso=(14, -4, 0),
          armR=Swing(reach=(8, 36, 0.54), blade=(2, 60), toward=hack(60), pole=(-0.3, -0.7, -0.2)), armL=Arm(arm=(-20, 0, 40), elbow=-30))
    c.key(h0, ease='in', pelvis=(0.0, 0.77, 0.12), pelvis_rot=(4, 0, 0), torso=(22, 0, 0),
          armR=Swing(reach=(4, 14, 0.57), blade=(-2, 26), toward=hack(26), pole=(-0.3, -0.8, -0.2)), armL=Arm(arm=(0, 0, 50), elbow=-30))
    c.key(h1, ease='linear', pelvis=(0.0, 0.74, 0.14), pelvis_rot=(5, 2, 0), torso=(28, 4, 0),
          armR=Swing(reach=(-6, -10, 0.57), blade=(-8, -32), toward=hack(-32), pole=(-0.3, -0.8, -0.2)), armL=Arm(arm=(25, 0, 75), elbow=-15))
    # the weight of it: the blade bites low and stays there, he is bowed over it
    c.key(h1 + 4, ease='out', pelvis=(0.0, 0.74, 0.14), pelvis_rot=(5, 2, 0), torso=(32, 4, 0),
          armR=Swing(reach=(-6, -32, 0.57), blade=(-8, -58), toward=hack(-58), pole=(-0.3, -0.8, -0.2)), armL=Arm(arm=(30, 0, 70), elbow=-15))
    # the blade comes up from the floor with its edge turning round by degrees (down, left, forward)
    c.key(h1 + 8, ease='smooth', pelvis=(0.0, 0.78, 0.12), pelvis_rot=(4, 6, 0), torso=(26, 8, 0),
          armR=Swing(reach=(6, -46, 0.57), blade=(14, -62), toward=(1, 0, 0), pole=(-0.3, -0.8, -0.2)), armL=Arm(arm=(15, 0, 55), elbow=-20))
    c.key(h1 + 11, ease='smooth', pelvis=(0.0, 0.83, 0.08), pelvis_rot=(3, 8, 0), torso=(16, 12, 0),
          armR=Swing(reach=(14, -60, 0.56), blade=(40, -72), toward=(0.3, 0, 1), pole=(-0.3, -0.8, -0.2)), armL=Arm(arm=(5, 0, 40), elbow=-20))
    c.key(n - 4, ease='smooth', **rest(pelvis=(0.0, 0.9, 0.02), torso=(3, 4, 0)))
    c.key(n, ease='smooth', still=True, **rest())
    # the boots: the right is set back wide as he rocks onto it, the left strides out under the drop and lands as the blade bites; then the right is dragged up and both close
    c.steps('footR', (-0.115, 0.0, -7), [(1, 7, -0.18, -0.05, -12, 0.05), (12, 21, -0.2, zn - 0.15, -14, 0.06), (h1 + 6, n - 3, -0.115, zn, -7, 0.05)])
    c.steps('footL', (0.115, 0.0, 7), [(6, h0, 0.2, zn + 0.28, 10, 0.12), (h1 + 7, n - 2, 0.115, zn, 7, 0.05)])
    return c


def heavy1(m=None):
    """The whirl: he winds himself right back on bent knees with the blade thrown out behind him and holds it there a beat, then the hips go first and the chest after them and the blade comes last,
    the whole of him pivoting on his boots through most of a turn with the arm out level, the free fist tucked in to his chest to keep the turn tight; the blade runs on behind him and he is left crouched over its weight
    before he unwinds."""
    m = m or timing(W, 'heavy1')
    c = Clip(m, 'cutlass.heavy1')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    zn = float(c.root(n)[2])
    key = keyer(c)
    DOWN = (0.0, -0.3, -1.0)  # the elbow of a hanging or trailing arm: back

    key(0, **rest())
    # the gather: he sinks, turns right and the blade is drawn back low on that side
    key(8, ease='smooth', pelvis=(-0.04, 0.84, -0.06), pelvis_rot=(1, -25, -3), torso=(4, -35, -3),
        armR=cut(85, -20, 0.5, baz=110, bel=-12), armL=Arm(arm=(-35, 0, 40), elbow=-35))
    # the wind: wound as far as he goes, the blade out level behind him, the weight on the right leg, the free hand pointing at the mark; held a beat
    key(16, ease='smooth', pelvis=(-0.08, 0.78, -0.12), pelvis_rot=(2, -48, -4), torso=(5, -60, -4),
        armR=cut(125, 4, 0.56, baz=150, bel=6), armL=Arm(arm=(-70, 0, 40), elbow=-15))
    key(20, ease='linear', pelvis=(-0.08, 0.77, -0.12), pelvis_rot=(2, -50, -4), torso=(5, -62, -4),
        armR=cut(128, 4, 0.56, baz=152, bel=6), armL=Arm(arm=(-72, 0, 42), elbow=-15))
    # the turn: the hips are away first, the chest hangs back on them, the blade is last
    key(23, ease='in', pelvis=(-0.06, 0.76, -0.1), pelvis_rot=(3, -34, -2), torso=(6, -62, -2),
        armR=cut(138, 0, 0.57, baz=152, bel=0), armL=Arm(arm=(-55, 0, 55), elbow=-20))
    key(h0, ease='in', pelvis=(-0.07, 0.75, -0.14), pelvis_rot=(4, -2, -1), torso=(8, -52, 0),
        armR=cut(140, -6, 0.57, baz=150, bel=-8), armL=Arm(arm=(-30, 0, 45), elbow=-60))
    key(29, ease='linear', pelvis=(0.0, 0.74, 0.14), pelvis_rot=(4, 46, 1), torso=(8, -20, 0),
        armR=cut(0, -8, 0.58, baz=0, bel=-8, pole=ACROSS), armL=Arm(arm=(-10, 0, 30), elbow=-85))
    key(h1, ease='linear', pelvis=(0.09, 0.75, -0.14), pelvis_rot=(4, 92, 2), torso=(8, 20, 2),
        armR=cut(-150, -8, 0.58, baz=-150, bel=-10, pole=ACROSS), armL=Arm(arm=(15, 0, 40), elbow=-65))
    # the carry: the blade runs on behind him and drops, the turn takes him a little further and he is bowed over it
    key(h1 + 3, ease='out', pelvis=(0.1, 0.77, -0.08), pelvis_rot=(4, 118, 2), torso=(10, 38, 2),
        armR=cut(-196, -14, 0.56, baz=-200, bel=-22, pole=ACROSS), armL=Arm(arm=(30, 0, 50), elbow=-45))
    key(h1 + 8, ease='smooth', pelvis=(0.06, 0.76, -0.04), pelvis_rot=(4, 124, 0), torso=(14, 34, 0),
        armR=cut(-205, -34, 0.54, baz=-210, bel=-44, pole=DOWN), armL=Arm(arm=(20, 0, 40), elbow=-25))
    # unwinding: he comes up and round, the blade comes back round in front of him low with the body, and its edge turns back to the hold by degrees
    key(h1 + 14, ease='smooth', pelvis=(0.04, 0.8, 0.0), pelvis_rot=(2, 90, 0), torso=(10, 16, 0),
        armR=Swing(reach=(-150, -50, 0.56), blade=(-150, -58), toward=(0.6, 0, 0.6), pole=DOWN), armL=Arm(arm=(5, 0, 25), elbow=-20))
    key(n - 7, ease='smooth', pelvis=(0.01, 0.87, 0.0), pelvis_rot=(1, 30, 0), torso=(4, 4, 0),
        armR=Swing(reach=(-60, -68, 0.57), blade=(-50, -76), toward=(1, 0, 0.2), pole=DOWN), armL=Arm(arm=(-4, 0, 10), elbow=-14))
    key(n, ease='smooth', still=True, **rest())
    # the boots: they gather round him as he winds, he strides in with the right and then the left, then both are lifted a hair and carried round the hips with the turn; they land and take
    # his weight while he is bowed, and step round after him as he unwinds
    r = around(c, 10, 'footR', 0.2, -0.06)
    l = around(c, 11, 'footL', 0.2, 0.12)
    c.steps('footR', (-0.115, 0.0, -7), [(2, 10, *r, 0.05), (20, 25, *around(c, 25, 'footR', 0.2, -0.05), 0.08)])
    c.steps('footL', (0.115, 0.0, 7), [(3, 11, *l, 0.05), (13, 19, *around(c, 19, 'footL', 0.2, 0.2), 0.08)])
    r = orbit(c, 'footR', 25, 38, around(c, 25, 'footR', 0.2, -0.05), 0.2, -0.05)
    l = orbit(c, 'footL', 25, 38, around(c, 19, 'footL', 0.2, 0.2), 0.2, 0.1)
    steps_on(c, 'footR', r, [(41, 48, -0.115, zn - 0.05, -7, 0.08), (56, n - 1, -0.115, zn, -7, 0.03)])
    steps_on(c, 'footL', l, [(49, 56, 0.115, zn, 7, 0.06)])
    return c


def heavy2(m=None):
    """The cleave: he heaves the blade up over his head with the left hand come across onto the grip below the right, rises on his boots with the chest arched and the weight rocked back, and holds
    it there high a beat; then the hips fall out from under him and the whole of him comes down after the blade, the left boot lunging out, the two hands driving it down the middle of him
    from over his head to low in front; it bites and he is bowed over it before the hands part and he hauls it up."""
    m = m or timing(W, 'heavy2')
    c = Clip(m, 'cutlass.heavy2')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    zn = float(c.root(n)[2])
    OUT = (-0.8, -0.1, -0.5)  # the elbow out to his right with the arm raised (a pole pointing down would be along the arm and flip it)

    def key(t, hands=None, **ch):
        if hands is not None:
            ch['armL'] = on_grip(ch, hands)
        ch.setdefault('look', LOOK)
        c.key(t, **ch)

    key(0, **rest(left=True))
    # the heave: down a little to get under it, then up with the blade, the free hand reaching across for the grip
    key(5, ease='smooth', pelvis=(0.0, 0.88, -0.02), pelvis_rot=(2, -4, 0), torso=(8, -8, 0),
        armR=Swing(reach=(30, -12, 0.5), blade=(40, 50), toward=hack(50), pole=OUT), armL=free(-30, -10, 0.5))
    key(11, ease='smooth', pelvis=(0.0, 0.9, -0.06), pelvis_rot=(0, -4, 0), torso=(-6, -6, 0),
        armR=Swing(reach=(-30, 52, 0.52), blade=(0, 105), toward=hack(105), pole=OUT), hands=0.1)
    # the top: the hands together over his head, the blade cocked back behind it, the chest arched and the weight rocked back so that, as the ground slides on under him, he stays over his boots; held a beat
    key(18, ease='smooth', pelvis=(0.0, 0.91, -0.1), pelvis_rot=(-2, 0, 0), torso=(-16, 0, 0),
        armR=Swing(reach=(-62, 58, 0.53), blade=(0, 118), toward=hack(118), pole=OUT), hands=0.1)
    key(22, ease='linear', pelvis=(0.0, 0.91, -0.3), pelvis_rot=(-2, 0, 0), torso=(-17, 0, 0),
        armR=Swing(reach=(-62, 59, 0.53), blade=(0, 120), toward=hack(120), pole=OUT), hands=0.1)
    # the fall: the hips go first, the chest folds after them, and the blade stays up behind until the last of it
    key(24, ease='in', pelvis=(0.0, 0.86, -0.26), pelvis_rot=(0, 0, 0), torso=(-6, 0, 0),
        armR=Swing(reach=(-58, 57, 0.54), blade=(0, 112), toward=hack(112), pole=OUT), hands=0.1)
    key(26, ease='in', pelvis=(0.0, 0.8, -0.1), pelvis_rot=(3, 0, 0), torso=(8, 0, 0),
        armR=Swing(reach=(-45, 48, 0.55), blade=(0, 92), toward=hack(92), pole=OUT), hands=0.1)
    key(27, ease='in', pelvis=(0.0, 0.76, 0.02), pelvis_rot=(4, 0, 0), torso=(16, 0, 0),
        armR=Swing(reach=(-30, 30, 0.56), blade=(0, 60), toward=hack(60), pole=OUT), hands=0.1)
    key(h0, ease='in', pelvis=(0.0, 0.74, 0.18), pelvis_rot=(5, 0, 0), torso=(28, 0, 0),
        armR=Swing(reach=(-18, 8, 0.57), blade=(-4, 30), toward=hack(30), pole=OUT), hands=0.1)
    key(31, ease='linear', pelvis=(0.0, 0.72, 0.22), pelvis_rot=(6, 0, 0), torso=(34, 0, 0),
        armR=Swing(reach=(-14, -8, 0.57), blade=(-4, -8), toward=hack(-8), pole=OUT), hands=0.1)
    key(h1, ease='out', pelvis=(0.0, 0.7, 0.24), pelvis_rot=(6, 0, 0), torso=(38, 0, 0),
        armR=Swing(reach=(-12, -26, 0.57), blade=(-4, -38), toward=hack(-38), pole=OUT), hands=0.1)
    # it bites: the blade drives on low and stays there with him bowed over it
    key(h1 + 4, ease='out', pelvis=(0.0, 0.7, 0.24), pelvis_rot=(6, 0, 0), torso=(40, 0, 0),
        armR=Swing(reach=(-12, -38, 0.57), blade=(-4, -52), toward=hack(-52), pole=OUT), hands=0.1)
    key(h1 + 12, ease='smooth', pelvis=(0.0, 0.72, 0.22), pelvis_rot=(5, 2, 0), torso=(38, 2, 0),
        armR=Swing(reach=(-12, -38, 0.57), blade=(-4, -52), toward=hack(-52), pole=OUT), hands=0.1)
    # the hands part: the left falls away, the blade comes up off the floor with its edge turning round, he straightens
    key(h1 + 18, ease='smooth', pelvis=(0.0, 0.78, 0.16), pelvis_rot=(3, 6, 0), torso=(24, 8, 0),
        armR=Swing(reach=(6, -46, 0.57), blade=(14, -60), toward=(1, 0, 0), pole=(-0.3, -0.8, -0.2)), armL=free(-30, -50, 0.56))
    key(n - 8, ease='smooth', pelvis=(0.0, 0.86, 0.08), pelvis_rot=(2, 6, 0), torso=(10, 6, 0),
        armR=Swing(reach=(16, -64, 0.57), blade=(50, -74), toward=(0.3, 0, 1), pole=(-0.2, -0.8, -0.3)), armL=free(-36, -68, 0.57))
    key(n, ease='smooth', still=True, **rest(left=True))
    # the boots: he gathers them under the heave, the left lunges out under the fall and lands as the blade bites, the right is thrown up after it a hair behind, and both are brought level
    c.steps('footL', (0.115, 0.0, 7), [(4, 12, 0.19, 0.12, 10, 0.06), (22, 27, 0.2, zn + 0.1, 12, 0.12), (h1 + 16, n - 3, 0.115, zn, 7, 0.06)])
    c.steps('footR', (-0.115, 0.0, -7), [(12, 19, -0.19, -0.04, -12, 0.06), (25, 31, -0.2, zn - 0.05, -14, 0.1), (h1 + 20, n - 1, -0.115, zn, -7, 0.05)])
    return c


def parry(m=None):
    """The catch: the hilt is thrown up in front of his face with the blade slanting up across him to his left and its flat to what is coming, the free hand slapping against the blade to brace it,
    and the whole of him shoved in behind it on a short step; the weight settles on the front boot, then the blade comes down and he sways back to the carried hold."""
    m = m or timing(W, 'parry')
    c = Clip(m, 'cutlass.parry')
    (p0, p1), n = m.parry, m.frames
    c.mark(parry0=p0, parry1=p1)
    UP = (-0.6, -0.4, -0.3)  # the elbow below the raised hilt and out to his right
    FACE = (-0.4, 0.15, 0.9)  # the edge to what is coming, a little out: not along the blade's own way up, where it would flip

    def key(t, hands=None, **ch):
        if hands is not None:
            ch['armL'] = on_grip(ch, hands, pole=(0.4, -0.7, -0.3))
        ch.setdefault('look', (0, 1.5, 4))
        c.key(t, **ch)

    key(0, **rest(left=True))
    c.key(2, ease='linear', armR={'toward': (0.0, 0.8, 0.6)})  # the edge leads the flick up (rolled over to face up as the blade rises through forward), and comes round to face the blow
    # up in four frames (the game's parry opens at the third, with the crossfade still in): the hilt at the height of his face, the blade across and slanting up to the left, the hips already sinking
    key(p0 + 1, ease='linear', pelvis=(0.0, 0.87, 0.02), pelvis_rot=(2, -4, 0), torso=(4, -10, 0),
        armR=Swing(reach=(-14, 14, 0.46), blade=(-70, 28), toward=FACE, pole=UP), armL=free(-5, 4, 0.5))
    # the shove: the weight goes in behind the blade, the left hand comes against it and the whole arm drives out; the head tucks behind it
    key(p0 + 5, ease='out', pelvis=(0.0, 0.82, 0.12), pelvis_rot=(4, 0, 0), torso=(12, -4, 0),
        armR=Swing(reach=(-12, 14, 0.54), blade=(-72, 34), toward=FACE, pole=UP), hands=-0.2)
    key(p1, ease='smooth', pelvis=(0.0, 0.82, 0.14), pelvis_rot=(4, 0, 0), torso=(13, -4, 0),
        armR=Swing(reach=(-12, 14, 0.55), blade=(-72, 34), toward=FACE, pole=UP), hands=-0.2)
    # it eases: the hand comes off the blade and drops, the elbow softens and the blade sinks across him
    key(p1 + 6, ease='smooth', pelvis=(0.0, 0.84, 0.08), pelvis_rot=(2, 2, 0), torso=(8, 0, 0),
        armR=Swing(reach=(-18, 8, 0.5), blade=(-60, 14), toward=FACE, pole=UP), armL=free(-20, -10, 0.5))
    key(n - 10, ease='smooth', pelvis=(0.0, 0.88, 0.03), pelvis_rot=(1, 4, 0), torso=(4, 2, 0),
        armR=Swing(reach=(10, -40, 0.54), blade=(20, -50), toward=(0, 0, 1), pole=(-0.3, -0.8, -0.3)), armL=free(-34, -50, 0.56))
    key(n, ease='smooth', still=True, **rest(left=True))
    # the boots: the right steps in with the shove, the left turns on its toe and takes the weight; both come back level
    c.steps('footR', (-0.115, 0.0, -7), [(1, 7, -0.17, 0.16, -12, 0.05), (p1 + 5, n - 3, -0.115, 0.0, -7, 0.05)])
    c.steps('footL', (0.115, 0.0, 7), [(1, 4, 0.17, -0.04, 14, 0.03), (p1 + 6, n - 3, 0.115, 0.0, 7, 0.04)])
    return c


def build():
    return [light1(), light2(), light3(), heavy1(), heavy2(), parry()]
