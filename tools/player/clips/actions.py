"""The moves every weapon shares: the roll and the backstep, the revolver (shoot, reload), the Laudanum (drink), West's Reagent (inject) and the flask (throw).

There is one clip of each whatever is in his right hand, so that hand is kept out of the way: the weapon is carried low in front of him (`HOLD_R`), clear of the floor even if it is the rapier,
and in the roll and the backstep it is held out to the side or in front where it can neither dig in nor catch a leg. The left hand has the revolver and the small things (`c.props`).
reload, drink and inject are laid by the game over a walking body (only their torso, head and arms are used), so their boots stand at ease.
"""
import numpy as np
import solve as S
import frame as F
import qa
from clipkit import Clip, Foot, Leg, Series, Swing, Arm, timing
from clips.common import at_rest, stand_feet, IDLE_L

W = 'rapier'  # every clip is made and checked for the longest weapon (1.13 m): a shorter one is only further from the floor and from his legs
DEG = np.pi / 180

# ---- the carried pose, as a Swing -------------------------------------------------------------------------------------------------------------------------------------------
# The idle hangs a rapier straight down into the floor; the game tips a carried weapon forward off the hanging line itself (playerPose.ts CARRY) but not a clip's. These clips begin and end
# with the weapon hand brought forward a little (every joint within the 37 degrees of the idle's that tests/playerClips.test.ts allows), so a point the length of his leg is clear of the floor.
HOLD_R = ((-22, 0, -7), -24, (4, 0, 0))  # the weapon arm, as angles: the arm swung forward, the elbow bent, the weapon pointing down and forward


def swing_from(side, arm, elbow, hand=(0, 0, 0), by_roll=False):
    """The `Swing` that puts the arm in the same place as these joint angles do, with him standing at ease: for the first and last key of a clip whose arm is keyed by Swing. It names the edge
    (what faces up on the thing in the hand) by `toward`, or by `roll`, the turn about the weapon from the way it falls naturally (up, or forward for a thing hanging), if `by_roll`: a clip
    must key all of an arm's Swings one way or the other."""
    ch = dict(pelvis=(0.0, 0.912, 0.0), torso=(1, 0, 0), **{'arm' + side: {'arm': arm, 'elbow': elbow, 'hand': hand}})
    rig = S.solve(ch)[1]
    s, e, w = (rig.world[k + side][:3, 3] for k in ('arm', 'elbow', 'hand'))
    H = rig.world['hand' + side]
    d = w - s
    dist = float(np.linalg.norm(d))
    az, el = float(np.degrees(np.arctan2(-d[0], d[2]))), float(np.degrees(np.arcsin(d[1] / dist)))
    blade = -H[:3, 1]
    baz, bel = float(np.degrees(np.arctan2(-blade[0], blade[2]))), float(np.degrees(np.arcsin(blade[1])))
    pole = tuple(float(x) for x in S.unit(e - (s + w) / 2))
    edge = H[:3, 2]
    if not by_roll:
        return Swing(reach=(az, el, dist), blade=(baz, bel), toward=tuple(float(x) for x in edge), pole=pole)
    base = S.edge_of(blade, None, 0.0)
    roll = float(np.degrees(np.arctan2(np.dot(np.cross(base, edge), blade), np.dot(base, edge))))
    return Swing(reach=(az, el, dist), blade=(baz, bel), roll=roll, pole=pole)


REST_R = swing_from('R', *HOLD_R)
REST_L = swing_from('L', (-4, 0, 7), -12)
REST_L_ROLL = swing_from('L', (-4, 0, 7), -12, by_roll=True)  # the same, its edge by roll


def rest(**over):
    """The carried pose for a clip's first and last key (`at_rest`, with the weapon hand brought forward as above), with any channel named in `over` in its place. Arms are Arm angles."""
    return at_rest(**{**dict(armR=Arm(arm=HOLD_R[0], elbow=HOLD_R[1], hand=HOLD_R[2])), **over})


def hold_r(lean=0.0):
    """The weapon arm at his side as `rest` has it, turned back by how far his chest leans (degrees), so the weapon keeps its place in the world while he bends over the work of the other hand."""
    return Arm(arm=(HOLD_R[0][0] - lean, HOLD_R[0][1], HOLD_R[0][2]), elbow=HOLD_R[1], hand=HOLD_R[2])


# ---- the tools for a body that leaves the ground -----------------------------------------------------------------------------------------------------------------------------
LEG_KEYS = ('thigh', 'knee', 'foot')


class Airborne(Clip):
    """A clip whose boots are placed on the floor (`Foot`) while he stands and keyed by their joints (`Leg`) while he is off it. A boot is one or the other at a frame; the game's boots are IK, so
    the joints of the first and last frame of the flight are read back from the Foot keys either side of it, and the flight runs from one to the other without a pop."""

    def __init__(self, m, cid, fly0, fly1):
        super().__init__(m, cid)
        self.fly = (fly0, fly1)
        self.joined = False

    def channels(self, t):
        ch = super().channels(t)
        flying = self.fly[0] < t < self.fly[1]
        for side in ('footR', 'footL'):
            spec = ch.get(side)
            if spec:
                ch[side] = {k: v for k, v in spec.items() if (k in LEG_KEYS) == flying}
        return ch

    def solve(self):
        if not self.joined:  # the joints at the two ends of the flight are what the boots' Foot keys give there
            self.joined = True
            for t in self.fly:
                ch, _ = S.cap_pelvis(self.channels(t), self.root(t))
                pose = S.solve(ch, self.root(t))[0]
                for side in 'RL':
                    self.key(t, ease='linear', **{'foot' + side: Leg(thigh=tuple(S.euler_of(F.quat_to_mat(pose['leg' + side]))), knee=qa.signed_x(pose['knee' + side]),
                                                                     foot=tuple(S.euler_of(F.quat_to_mat(pose['foot' + side]))))})
        return super().solve()


def plain(ch):
    """The channels as the solver reads them at one instant: a one-number entry (the DSL keeps it in a tuple) as a number."""
    one = lambda v: float(v[0]) if isinstance(v, (tuple, list)) and len(v) == 1 else v
    return {k: ({e: one(v) for e, v in val.items()} if isinstance(val, dict) else val) for k, val in ch.items()}


HULL = (('body', (0, 0, 0), 0.14), ('torso', (0, 0.3, 0), 0.17), ('torso', (0, 0.5, -0.02), 0.14), ('armR', (0, 0, 0), 0.11), ('armL', (0, 0, 0), 0.11), ('elbowL', (0, 0, 0), 0.06), ('head', (0, 0.1, 0), 0.13),
        ('handR', (0, 0, 0), 0.06), ('handL', (0, 0, 0), 0.06), ('kneeR', (0, 0, 0), 0.08), ('kneeL', (0, 0, 0), 0.08), ('footR', (0, 0, 0), 0.1), ('footL', (0, 0, 0), 0.1))  # the parts of him that meet the floor, and how thick each is


def grounded(ch, rise, lead=0.0):
    """The pelvis that puts the lowest part of him `rise` metres off the floor and the middle of him `lead` ahead of the actor, for the rest of the channels in `ch`: a body that turns over turns on
    whatever it is touching, whichever way it is bent. (The boots must be keyed by joints.)"""
    rig = S.solve(plain(dict(ch, pelvis=(0.0, 0.0, 0.0))))[1]
    w = rig.world
    low = min((w[j] @ np.array([*o, 1.0]))[1] - r for j, o, r in HULL)
    mid = (w['body'][:3, 3] + (w['torso'] @ np.array([0, 0.3, 0, 1.0]))[:3] + 0.5 * (w['kneeR'][:3, 3] + w['kneeL'][:3, 3])) / 3.0  # hips, chest, knees
    return (0.0, rise - low, lead - float(mid[2]))


def tuck(thigh, knee, splay=8.0, toe=0.0):
    """Both legs by their joints: the thighs raised forward `thigh` degrees, the knees bent `knee`, a little apart."""
    return dict(footR=Leg(thigh=(-thigh, 0, -splay), knee=knee, foot=(toe, 0, 0)), footL=Leg(thigh=(-thigh, 0, splay), knee=knee, foot=(toe, 0, 0)))


def ride(c, side, f0, f1, x, dz, lift=lambda u: 0.0, yaw=lambda u: 0.0, pitch=lambda u: 0.0):
    """A boot carried by the body for frames f0 to f1 (it is on the floor of the clip's world, and the actor's root moves on): its place is `dz` ahead of the root (a number, or a function of
    u = 0 to 1 through the stretch), `lift` above the floor, so what is keyed is the boot's place in the world. After it, key the boot where it lands."""
    for f in range(f0, f1 + 1):
        u = (f - f0) / (f1 - f0)
        d = dz(u) if callable(dz) else dz
        c.key(f, ease='linear', **{side: Foot(x, float(c.root(f)[2]) + d, yaw(u), pitch(u), lift(u))})


def stride(c, side, f0, f1, frm, to, h=0.07, lift0=0.0):
    """A boot set down in the clip's world: `Clip.steps` for a boot already keyed at `frm` = (x, z, yaw) (a clip whose boot has been doing something else until then): lifted at frame f0 (already
    `lift0` off the floor, if it is in the air), swung through and set down heel first at frame f1 at `to`, a height `h` above its line at the most."""
    x, z, yaw = frm
    nx, nz, nyaw = to
    c.key(f0, ease='linear', **{side: Foot(x, z, yaw, lift=lift0, pitch=20 if lift0 else 0)})
    for f in range(f0 + 1, f1):
        u = (f - f0) / (f1 - f0)
        e = u * u * (3 - 2 * u)
        pitch = 22 * max(0.0, 1 - u / 0.4) ** 2 - 12 * max(0.0, (u - 0.7) / 0.3) ** 1.5
        pz = z + (nz - z) * e + S.roll_shift(pitch * DEG) * (max(0.0, 1 - u / 0.3) if pitch > 0 else max(0.0, (u - 0.7) / 0.3))
        c.key(f, ease='linear', **{side: Foot(x + (nx - x) * e, pz, yaw + (nyaw - yaw) * e, pitch=pitch, lift=lift0 * (1 - e) + h * np.sin(np.pi * u) ** 1.2)})
    c.key(f1, ease='linear', **{side: Foot(nx, nz, nyaw)})


class Track:
    """Numbers that change through a stretch of a clip: `at(f, name=value, ...)` keys them, `get(f)` reads each as a spline through its keys (held beyond the first and last). For a body that has
    to be placed on the floor frame by frame (a roll), where a key every few frames would let a hand dip through it between."""

    def __init__(self):
        self.series = {}

    def at(self, f, **values):
        for name, v in values.items():
            self.series.setdefault(name, Series()).add(f, v, 'cr', False)
        return self

    def get(self, f):
        return {name: float(s.at(f)[0]) for name, s in self.series.items()}


def roll():
    """A diving roll over the left shoulder: he drops and throws himself forward, hands first, and goes over in a tight tuck, the body turning once about its middle while it travels (the
    chest twisted a little to his right of the hips, as a shoulder roll is, so the turn runs diagonally across his back); the boots come down, he runs out of it onto his feet and stands.
    The weapon is held out to his right and up all through, along the line he turns about, so it neither digs in nor catches him."""
    m = timing(W, 'roll')
    c = Airborne(m, 'roll', 3, 27)
    n = m.frames
    root = lambda f: float(c.root(f)[2])
    T = Track()
    # name: pitch of the whole body (degrees, a full turn is 360), rise of the lowest part of him off the floor, torso/head bend, twist of the chest to his right of the hips, the left arm (psi: how far
    # forward of straight down it points in the world, until it is folded by joints: the blend), the legs (thigh raised, knee bent), the weapon arm's reach and blade
    T.at(3, pitch=26, torso=14, head=-14, twist=0, psi=60, blend=0, ax=-90, elbow=-20, thigh=-15, knee=25, rise=0.3)
    T.at(5, pitch=52, torso=10, head=-16, twist=-12, psi=45, rise=0.25, thigh=0, knee=40)
    T.at(7, pitch=82, torso=22, head=-4, twist=-24, psi=36, elbow=-30, rise=0.0, thigh=40, knee=85)
    T.at(8, pitch=98, torso=22, head=14, twist=-30, blend=1, ax=-45, elbow=-50, thigh=65, knee=105)
    T.at(9, pitch=114, torso=24, head=46, twist=-34, rise=0.0, ax=-30, elbow=-45, thigh=92, knee=125)
    T.at(11, pitch=144, torso=36, head=54, ax=-40, elbow=-60, thigh=114, knee=136)
    T.at(13, pitch=174, torso=52, head=54, ax=-70, elbow=-85, thigh=118, knee=138)
    T.at(16, pitch=218, torso=60, head=50, ax=-80, elbow=-90, thigh=118, knee=138)
    T.at(19, pitch=262, torso=54, head=34, ax=-80, elbow=-70, thigh=108, knee=128)
    T.at(22, pitch=304, torso=42, head=20, twist=-22, rise=0.0, ax=-55, elbow=-45, thigh=82, knee=98)
    T.at(24, rise=0.04)
    T.at(26, pitch=352, torso=30, head=4, twist=-8, ax=-35, elbow=-40, thigh=50, knee=60, rise=0.14)
    # the weapon arm: out to his right and up, hand near the shoulder while he is tucked
    T.at(3, ra=55, re=10, rd=0.5, rba=65, rbe=18)
    T.at(7, ra=92, re=20, rd=0.4, rba=100, rbe=25)
    T.at(13, ra=100, re=0, rd=0.25, rba=100, rbe=25)
    T.at(19, ra=100, re=5, rd=0.3)
    T.at(26, ra=90, re=15, rd=0.45, rba=95, rbe=20)

    c.key(0, **rest(armR=REST_R), **stand_feet(c, 0))  # the weapon arm by Swing and the left by joint angles all through, so neither channel is half of each
    # the drop: the knees go, the chest pitches over his boots and the arms come forward for the ground
    c.key(1, ease='smooth', pelvis=(0.0, 0.86, 0.03), pelvis_rot=(5, 0, 0), torso=(10, 0, 0), armR=Swing(reach=(20, -28, 0.55), blade=(25, -24), toward=(0, 1, 0), pole=(-0.3, -0.7, -0.3)))
    c.key(2, ease='smooth', pelvis=(0.0, 0.8, 0.07), pelvis_rot=(12, 0, 0), torso=(20, 0, 0), head=(-10, 0, 0), armL=Arm(arm=(-55, 0, 8), elbow=-30), armR=Swing(reach=(35, -4, 0.53), blade=(42, 2), toward=(0, 1, 0), pole=(-0.3, -0.7, -0.3)),
          footR=Foot(-0.115, 0.0, -7), footL=Foot(0.115, 0.0, 7))
    # the launch: the toes drive and he is off the floor, the body falling forward in a long line, the legs trailing
    c.key(3, ease='out', pelvis=(0.0, 0.84, 0.12), pelvis_rot=(26, 0, 0), torso=(14, 0, 0), head=(-14, 0, 0), armL=Arm(arm=(-90, 0, 8), elbow=-20), armR=Swing(reach=(55, 10, 0.5), blade=(65, 18), toward=(0, 1, 0), pole=(-0.3, -0.7, -0.3)),
          footR=Foot(-0.115, 0.04, -7, pitch=40, lift=0.05), footL=Foot(0.115, 0.04, 7, pitch=40, lift=0.05))
    chans = {}
    for f in range(4, 27):  # the flight, the tuck and the turn: every frame, set on the floor by its lowest part
        p = T.get(f)
        pitch_t = p['pitch'] + p['torso']
        ax = (1 - min(1.0, max(0.0, p['blend']))) * -(p['psi'] + pitch_t) + min(1.0, max(0.0, p['blend'])) * p['ax']
        ch = dict(pelvis_rot=(p['pitch'], 0, 0), torso=(p['torso'], p['twist'], 0), head=(p['head'], -0.5 * p['twist'], 0), armL=Arm(arm=(ax, 0, 8), elbow=p['elbow']),
                  armR=Swing(reach=(p['ra'], p['re'], p['rd']), blade=(p['rba'], p['rbe']), toward=(0, 1, 0), pole=(-0.3, -0.7, -0.3)), **tuck(p['thigh'], p['knee'], 6))
        chans[f] = (ch, np.array(grounded(ch, p['rise'])))
    for f, (ch, at) in chans.items():  # the part that is lowest changes from one to another as he turns: the hips are eased through it, so they do not jerk
        near = [chans[g][1] for g in (f - 1, f, f + 1) if g in chans]
        c.key(f, ease='linear', pelvis=tuple(0.25 * near[0] + 0.5 * at + 0.25 * near[-1]) if 4 < f < 26 else tuple(at), **ch)
    # the landing: the left boot is down ahead of him heel first as he comes upright, still low and still going; the right is thrown through and set down further on; he rises
    # over it and the left comes through to stand beside it
    zL, zR = root(27) + 0.3, root(31) + 0.3
    c.key(27, ease='smooth', pelvis=(0.0, 0.7, 0.0), pelvis_rot=(364, 0, 0), torso=(30, -3, 0), head=(-12, 0, 0), armL=Arm(arm=(-30, 0, 12), elbow=-50), armR=Swing(reach=(85, 15, 0.45), blade=(95, 20), toward=(0, 1, 0), pole=(-0.3, -0.7, -0.3)),
          footL=Foot(0.115, zL, 7, pitch=-12), footR=Foot(-0.115, root(27) - 0.12, -7, pitch=25, lift=0.2))
    stride(c, 'footR', 27, 31, (-0.115, root(27) - 0.12, -7), (-0.115, zR, -7), 0.12, lift0=0.2)
    c.key(31, ease='smooth', pelvis=(0.0, 0.76, 0.02), pelvis_rot=(366, 0, 0), torso=(22, 6, 0), head=(-10, 0, 0), armL=Arm(arm=(35, 0, 12), elbow=-60), armR=Swing(reach=(70, 10, 0.5), blade=(80, 10), toward=(0, 1, 0), pole=(-0.3, -0.7, -0.3)))
    c.key(36, ease='smooth', pelvis=(0.0, 0.88, 0.04), pelvis_rot=(362, 0, 0), torso=(10, 3, 0), head=(-4, 0, 0), armL=Arm(arm=(-20, 0, 10), elbow=-30), armR=REST_R)
    c.key(n, ease='smooth', still=True, **rest(armR=REST_R, pelvis_rot=(360, 0, 0)))
    c.key(31, ease='linear', footL=Foot(0.115, zL, 7))
    stride(c, 'footL', 31, 38, (0.115, zL, 7), (0.115, root(n), 7), 0.1)
    c.key(n, ease='linear', footR=Foot(-0.115, root(n), -7), footL=Foot(0.115, root(n), 7))
    return c


def backstep():
    """A quick hop away from the foe: he coils for a frame, springs off both boots and goes back low through the air, the weapon hand brought up in front of him in a guard and the free arm
    flung out for balance, the chest leaning away; the left boot lands behind him first and the right under him as the move ends, and he takes the landing deep and settles."""
    m = timing(W, 'backstep')
    c = Clip(m, 'backstep')
    n = m.frames
    root = lambda f: float(c.root(f)[2])
    guard = lambda az, el, d, baz, bel: Swing(reach=(az, el, d), blade=(baz, bel), toward=(0, 1, 0), pole=(-0.4, -0.8, -0.3))
    c.key(0, **rest(armR=REST_R), **stand_feet(c, 0), look=(0, 1.5, 4))
    # the coil and the spring: the weight drops over his boots, the weapon hand comes up, then the legs drive and he leans away from his own boots
    c.key(1, ease='out', pelvis=(0.0, 0.84, -0.04), pelvis_rot=(2, 0, 0), torso=(10, 0, 0), armR=guard(12, -38, 0.55, 9, -28), armL=Arm(arm=(-30, 0, 22), elbow=-50))
    c.key(2, ease='smooth', pelvis=(0.0, 0.92, -0.08), pelvis_rot=(-1, 0, 0), torso=(-4, 0, 0), armR=guard(11, -15, 0.53, 6, 0), armL=Arm(arm=(-10, 0, 45), elbow=-40))
    c.key(3, ease='smooth', pelvis=(0.0, 0.95, -0.1), pelvis_rot=(-3, 0, 0), torso=(-10, 0, 0), armR=guard(10, 5, 0.52, 4, 22), armL=Arm(arm=(5, 0, 62), elbow=-25))
    # in the air: the body arcs back and the chest holds away, the guard steady, the free arm wide
    c.key(6, ease='smooth', pelvis=(0.0, 1.03, -0.12), pelvis_rot=(-4, 0, 0), torso=(-12, 0, 0), armR=guard(10, 8, 0.52, 3, 26), armL=Arm(arm=(10, 0, 72), elbow=-20))
    c.key(10, ease='smooth', pelvis=(0.0, 0.95, -0.06), pelvis_rot=(-1, 0, 0), torso=(-4, 0, 0), armR=guard(10, 5, 0.5, 4, 22), armL=Arm(arm=(-5, 0, 60), elbow=-30))
    # the landing: the boots take it, the hips go down and the chest comes over them, the arms brace; then he rises and everything comes home
    c.key(12, ease='out', pelvis=(0.0, 0.82, 0.0), pelvis_rot=(3, 0, 0), torso=(14, 0, 0), armR=guard(12, -5, 0.5, 6, 12), armL=Arm(arm=(-25, 0, 40), elbow=-45))
    c.key(14, ease='smooth', pelvis=(0.0, 0.76, 0.02), pelvis_rot=(3, 0, 0), torso=(16, 0, 0), armR=guard(12, -10, 0.5, 6, 5), armL=Arm(arm=(-20, 0, 32), elbow=-45))
    c.key(18, ease='smooth', pelvis=(0.0, 0.85, 0.02), pelvis_rot=(1, 0, 0), torso=(8, 0, 0), armR=guard(14, -35, 0.54, 10, -20), armL=Arm(arm=(-8, 0, 16), elbow=-25))
    c.key(n, ease='smooth', still=True, **rest(armR=REST_R))
    # the boots: carried through the air with him (the actor's root is moving at his own pace), the legs trailing at first and reaching back to land; then they stay where they land
    ride(c, 'footR', 1, 12, -0.115, lambda u: 0.04 + 0.1 * np.sin(np.pi * min(1, u * 1.6)) * (1 - u) - 0.04 * u, lift=lambda u: 0.02 + 0.22 * np.sin(np.pi * u) ** 0.8 * (1 - u) ** 0.3, yaw=lambda u: -7, pitch=lambda u: 14 * (1 - u) - 8 * u ** 3)
    ride(c, 'footL', 1, 11, 0.115, lambda u: 0.04 + 0.11 * np.sin(np.pi * min(1, u * 1.6)) * (1 - u) - 0.24 * u, lift=lambda u: 0.02 + 0.23 * np.sin(np.pi * u) ** 0.8 * (1 - u) ** 0.3, yaw=lambda u: 7, pitch=lambda u: 14 * (1 - u) - 8 * u ** 3)
    c.key(n, ease='linear', **stand_feet(c, n))
    return c


def aim_left(az, el, d, baz=None, bel=None, up=(0, 1, 0), pole=(0.5, -0.8, -0.3)):
    """The left arm holding the revolver: the wrist `d` from his left shoulder at `az`, `el` (the actor's directions: az to his right, el up) and the barrel along `baz`, `bel` (the same bearing if not
    said), the sights toward `up`."""
    return Swing(reach=(az, el, d), blade=(az if baz is None else baz, el if bel is None else bel), toward=up, pole=pole)


def shoot():
    """The shot from the hip of a man who has learned it: he turns side-on, the left shoulder forward, takes a short stance, and the revolver comes up out of the carried hang to the aim in six frames;
    it fires on the seventh and the kick goes up through the wrist, the elbow and the shoulder, the barrel climbing and the chest rocking back; he brings it down onto the mark, holds a beat, then lowers it and unwinds. The weapon hand
    is kept down at his side and out of the line."""
    m = timing(W, 'shoot')
    c = Clip(m, 'shoot')
    c.props = ['gun']
    n, shot = m.frames, m.shot
    c.mark(shot=shot)
    aim = lambda e=3, d=0.56, be=None: aim_left(5, e, d, 7, e if be is None else be)
    c.key(0, **rest(armL=REST_L), look=(0, 1.5, 6))
    # the turn and the raise: the hips go round first, the chest after them, the arm comes up straight to the line, the head on the mark
    c.key(3, ease='out', pelvis=(0.02, 0.88, -0.03), pelvis_rot=(0, -12, 0), torso=(2, -20, 0), armL=aim_left(-12, -22, 0.52, -8, -30))
    c.key(shot - 1, ease='smooth', pelvis=(0.03, 0.865, -0.05), pelvis_rot=(0, -22, 0), torso=(3, -34, 0), armL=aim(3))
    c.key(shot, ease='linear', pelvis=(0.03, 0.865, -0.05), pelvis_rot=(0, -22, 0), torso=(3, -34, 0), armL=aim(3))
    # the kick: the barrel climbs, the elbow gives, the shoulders rock back; then it settles back onto the mark
    c.key(shot + 1, ease='out', pelvis=(0.03, 0.87, -0.08), pelvis_rot=(-1, -20, 0), torso=(-3, -31, 0), armL=aim(14, 0.5, 24))
    c.key(shot + 2, ease='out', pelvis=(0.03, 0.875, -0.09), pelvis_rot=(-2, -19, 0), torso=(-5, -29, 0), armL=aim(18, 0.49, 32))
    c.key(shot + 6, ease='smooth', pelvis=(0.03, 0.87, -0.06), pelvis_rot=(0, -22, 0), torso=(2, -33, 0), armL=aim(5, 0.55, 7))
    c.key(shot + 10, ease='smooth', pelvis=(0.03, 0.87, -0.05), pelvis_rot=(0, -22, 0), torso=(3, -34, 0), armL=aim(3, 0.55))
    # the lowering and the unwinding: the gun comes down by his side as the body turns back square
    c.key(shot + 14, ease='smooth', pelvis=(0.01, 0.89, -0.02), pelvis_rot=(0, -10, 0), torso=(2, -14, 0), armL=aim_left(-2, -32, 0.53, 2, -38))
    c.key(24, ease='smooth', pelvis=(0.0, 0.905, 0.0), pelvis_rot=(0, -3, 0), torso=(1, -3, 0), armL=aim_left(-22, -62, 0.54, -18, -58))
    c.key(n, ease='smooth', still=True, **rest(armL=REST_L))
    # the boots: the left reaches out ahead and the right swings round behind, toes to his right; later they come home
    c.steps('footL', (0.115, 0.0, 7), [(1, 4, 0.17, 0.2, -32, 0.05), (shot + 12, shot + 20, 0.115, 0.0, 7, 0.05)])
    c.steps('footR', (-0.115, 0.0, -7), [(1, 4, -0.2, -0.13, -72, 0.04), (shot + 15, shot + 23, -0.115, 0.0, -7, 0.05)])
    return c


def reload():
    """Six rounds into the revolver while he walks on. The gun comes up out of its hang to before his chest, the muzzle high and the sights toward his face, his head bent over it; the cylinder is
    swung open with a tilt of the wrist and the rounds go in one by one, each a small jolt of the hand, the head and the shoulder following it; the sixth goes in and the cylinder is snapped shut on the
    frame the game counts it (48) with a flick of the wrist that spins the gun over and brings it down to his hip. His boots stand at ease (the game lays only his arms, chest and head over the walking)."""
    m = timing(W, 'reload')
    c = Clip(m, 'reload')
    c.props = ['gun']
    n, item = m.frames, m.item
    c.mark(item=item)
    rest_l = REST_L_ROLL
    gun = lambda az, el, d, baz, bel, roll=0.0: Swing(reach=(az, el, d), blade=(baz, bel), roll=roll, pole=(0.6, -0.7, -0.4))
    ticks = [17, 23, 29, 35, 40, 45]  # the rounds going in; the sixth is the last (the cylinder is closed at 48)
    kick = {-1: -0.25, 0: 1.0, 1: 0.55, 2: 0.25, 3: 0.08}
    T = Track()
    # the raise (0 to 11), the cylinder swung open (11 to 16), the loading (16 to 47, a slow lean in over the gun), the snap (48) and the flick that brings it down
    T.at(11, az=24, el=-32, d=0.42, baz=14, bel=62, roll=0, torso=9, yaw=-6, head=28)
    T.at(16, az=26, el=-30, d=0.40, baz=4, bel=42, roll=30, torso=10, yaw=-7, head=32)
    T.at(40, az=26, el=-31, d=0.40, baz=4, bel=40, roll=34, torso=11, yaw=-7, head=34)
    T.at(46, az=26, el=-31, d=0.40, baz=4, bel=42, roll=32, torso=11, yaw=-7, head=34)
    def key(f, arm, torso, yaw, head, ease='smooth', **extra):
        c.key(f, ease=ease, armL=arm, armR=hold_r(torso), torso=(torso, yaw, 0), head=(head, 0, 0), **extra)

    c.key(0, **rest(armL=rest_l))
    key(5, gun(-6, -50, 0.5, -2, -20), 4, -2, 10)
    key(11, gun(24, -32, 0.42, 14, 62), 9, -6, 28)
    for f in range(12, item):
        p = T.get(f)
        k = sum(w for i in ticks for t, w in kick.items() if f - i == t)  # how far into a round's jolt he is
        key(f, gun(p['az'], p['el'] - 6 * k, p['d'] - 0.02 * k, p['baz'], p['bel'] - 14 * k, p['roll'] + 16 * k), p['torso'] + 1.6 * k, p['yaw'], p['head'] + 3 * k, ease='linear')
    # the snap: the cylinder shut in a frame, the wrist throws the gun up and over, and it falls to his hip; the head comes up
    key(item, gun(24, -30, 0.42, 12, 66, 0), 9, -6, 26, ease='linear')
    key(item + 4, gun(18, -18, 0.46, 8, 70, 0), 7, -4, 14, ease='out')
    key(item + 9, gun(4, -44, 0.5, 2, 12, 0), 5, -2, 6)
    key(item + 16, gun(-14, -66, 0.54, -10, -48, 0), 3, 0, 2)
    c.key(n, ease='smooth', still=True, **rest(armL=rest_l))
    c.key(0, **stand_feet(c, 0))
    c.key(n, **stand_feet(c, n))
    return c


def drink():
    """The Laudanum: the small bottle comes up from his left hip to his mouth, his head tipping back as it comes, the bottle tilting up with it; he drinks, a long pull, and swallows on the game's frame (34)
    with a shudder of the throat and shoulders; then the bottle comes away, the face wrinkles and shakes once at the taste, and the hand goes down. The legs are the walking's."""
    m = timing(W, 'drink')
    c = Clip(m, 'drink')
    c.props = ['laudanum']
    n, item = m.frames, m.item
    c.mark(item=item)
    bottle = lambda az, el, d, baz, bel: Swing(reach=(az, el, d), blade=(baz, bel), roll=0, pole=(0.9, -0.9, 0.0))  # the elbow out to his left, as a man's is who drinks

    def key(f, arm, torso, head, yaw=0.0, tilt=0.0, ease='smooth', **extra):
        c.key(f, ease=ease, armL=arm, armR=hold_r(torso), torso=(torso, 0.4 * yaw, 0), head=(head, yaw, tilt), **extra)

    c.key(0, **rest(armL=REST_L_ROLL))
    # the lift: the bottle comes up in front of his chest, then to his mouth, the neck of it at his lips
    key(6, bottle(8, -34, 0.46, 6, 4), 2, 4)
    key(12, bottle(66, 12, 0.34, 12, 40), 0, -6)
    # the pull: the head goes back and the bottle goes up with it, held steady against the lips
    key(20, bottle(68, 14, 0.34, 12, 54), -4, -22)
    key(30, bottle(68, 14, 0.34, 10, 64), -6, -32, ease='linear')
    # the swallow: the throat works, the shoulders jerk and the head nods once
    key(item - 1, bottle(68, 14, 0.34, 10, 64), -5, -30, ease='linear')
    key(item, bottle(68, 14, 0.34, 10, 62), -1, -22, ease='out')
    key(item + 2, bottle(66, 14, 0.34, 10, 60), -3, -28)
    # the bottle comes away and the face wrinkles at the taste: the head turns one way and the other
    key(item + 6, bottle(50, 2, 0.42, 12, 24), 2, -8, yaw=-12, tilt=4)
    key(item + 9, bottle(36, -12, 0.46, 10, 8), 3, 2, yaw=12, tilt=-4)
    key(item + 12, bottle(24, -26, 0.48, 6, -4), 3, 4, yaw=-6)
    # the hand goes down to his side
    key(item + 18, bottle(-6, -56, 0.54, -4, -40), 1, 1)
    c.key(n, ease='smooth', still=True, **rest(armL=REST_L_ROLL))
    c.key(0, **stand_feet(c, 0))
    c.key(n, **stand_feet(c, n))
    return c


def inject():
    """West's Reagent: the syringe comes up in front of him and he looks at it, the needle up, and taps the barrel clear; then the elbow goes out and the syringe comes round to the side of his neck,
    the head turned and tipped away to give it the vein. He holds his breath, presses the plunger home and flinches on the game's frame (44): the head whips round, the shoulders lock and a
    shudder runs through him as it takes; the needle comes out, the hand falls and he breathes. The legs are the walking's."""
    m = timing(W, 'inject')
    c = Clip(m, 'inject')
    c.props = ['syringe']
    n, item = m.frames, m.item
    c.mark(item=item)
    needle = lambda az, el, d, baz, bel: Swing(reach=(az, el, d), blade=(baz, bel), roll=0, pole=(0.9, -0.9, 0.0))

    def key(f, arm, torso, head, yaw=0.0, tilt=0.0, ease='smooth', twist=0.0, **extra):
        c.key(f, ease=ease, armL=arm, armR=hold_r(torso), torso=(torso, twist, 0), head=(head, yaw, tilt), **extra)

    c.key(0, **rest(armL=REST_L_ROLL))
    # the look: the syringe comes up before his chest, the needle to the sky, and he bends his head to it
    key(8, needle(14, -20, 0.44, 8, 55), 5, 22, yaw=2)
    key(14, needle(14, -20, 0.44, 8, 55), 5, 22, yaw=2)
    key(17, needle(14, -22, 0.44, 8, 62), 6, 24, yaw=2, ease='out')  # a tap of the finger on the barrel
    key(19, needle(14, -20, 0.44, 8, 55), 5, 22, yaw=2)
    # to the neck: the elbow goes out, the syringe goes round to the side of his neck, the needle across at the vein; the head goes over to the right to give it room
    key(26, needle(-6, 16, 0.26, 128, -2), 1, -4, yaw=-22, tilt=16)
    key(32, needle(-5, 18, 0.235, 130, -1), 1, -6, yaw=-24, tilt=18, ease='linear')
    # the press: breath held, the shoulders come up, the arm shakes a little with the pressure
    key(item - 6, needle(-5, 18, 0.232, 130, -1), 2, -8, yaw=-26, tilt=19, ease='linear')
    key(item - 2, needle(-5, 18, 0.228, 130, -1), 3, -10, yaw=-27, tilt=20, ease='linear')
    # the flinch: the head snaps round and over, the shoulders twist away, the fist jerks
    key(item, needle(-4, 19, 0.222, 130, 1), 4, 8, yaw=14, tilt=26, ease='out', twist=10)
    key(item + 3, needle(-5, 18, 0.228, 130, -1), 3, 4, yaw=8, tilt=22, twist=6)
    # the needle out, and the shudder: the chest runs through a tremor as it takes
    key(item + 7, needle(0, 14, 0.4, 60, 30), 1, -2, yaw=-8, tilt=10, twist=-5)
    key(item + 10, needle(10, 0, 0.45, 20, 40), 3, 4, yaw=5, tilt=4, twist=4)
    key(item + 13, needle(10, -10, 0.45, 12, 40), 2, 2, yaw=-3, tilt=2, twist=-3)
    key(item + 17, needle(-4, -35, 0.5, 4, 10), 2, 6, yaw=0, tilt=0, twist=2)
    key(item + 23, needle(-30, -62, 0.55, -14, -45), 1, 2)
    c.key(n, ease='smooth', still=True, **rest(armL=REST_L_ROLL))
    c.key(0, **stand_feet(c, 0))
    c.key(n, **stand_feet(c, n))
    return c


def throw():
    """The flask of lamp oil, lobbed with the left arm. He turns his hips away from the mark and takes the flask back past his ear, the chest leaning off his back foot and the right boot reaching out toward
    the foe; then it all goes forward in order: the hips drive and open first, the chest follows them, the elbow comes through ahead of the hand and the wrist snaps over, and the flask leaves on the
    game's frame (16) off the end of a straight arm. The arm carries on down across his body and he folds over his front boot with the throw; he checks, straightens, and the boots come home. His
    eyes stay on the mark all through. The weapon hand hangs where it was carried (kept out of the line), and the game takes the flask from the hand a frame after it is let go."""
    m = timing(W, 'throw')
    c = Clip(m, 'throw')
    c.props = ['flask']
    n, volley = m.frames, m.volley
    c.mark(volley=volley, props=volley + 1)

    def lob(az, el, d, baz, bel, elbow=(0.9, 0.2, -0.2)):
        """The left arm's reach (`aim_left`'s directions) with the flask along `baz`, `bel`; `elbow` is the way the elbow points, taken square to the arm so it is never lost along it (an arm swung through the
        place where its elbow's direction is nothing turns its shoulder a half turn in a frame)."""
        a = np.array([-np.sin(az * DEG) * np.cos(el * DEG), np.sin(el * DEG), np.cos(az * DEG) * np.cos(el * DEG)])
        e = np.array(elbow, float)
        e = e - np.dot(e, a) * a
        return Swing(reach=(az, el, d), blade=(baz, bel), roll=0, pole=tuple(float(x) for x in e / np.linalg.norm(e)))


    def key(f, arm, pitch, yaw, hip, drop, fore, ease='smooth', **extra):
        """One instant of the body: the chest's lean and turn, the hips' turn, how far the pelvis is down and ahead (`fore`), the throwing arm; the weapon hand follows the chest's lean."""
        c.key(f, ease=ease, armL=arm, armR=hold_r(1.3 * pitch), torso=(pitch, yaw, 0), pelvis_rot=(0.3 * pitch, hip, 0), pelvis=(0.12 * np.sin(hip * DEG), drop, fore), **extra)

    c.key(0, **rest(armL=REST_L_ROLL), look=(0, 1.5, 8))
    # the wind-up: the weight goes back over the left boot, the hips and chest turn away from the mark; the hand swings down and back as a pendulum does before it is brought up past the ear, the flask pointing
    # back and up, the elbow high and out
    key(2, lob(-60, -52, 0.55, -70, -66, (0.1, -0.5, -0.85)), -1, 5, 3, 0.9, -0.01)
    key(4, lob(-120, -34, 0.54, -140, -62, (0.0, -1.0, 0.0)), -3, 14, 8, 0.885, -0.03)
    key(7, lob(-150, 12, 0.46, -160, 42, (0.8, -0.5, 0.2)), -6, 30, 16, 0.865, -0.05)
    key(10, lob(-155, 46, 0.34, -172, 62, (1.0, -0.1, -0.4)), -9, 40, 22, 0.855, -0.07, ease='linear')
    # the throw: the hips go first and the chest is dragged after them, the elbow comes through leading and the hand lags and then whips over it; it is released at the top of the arm's reach
    key(12, lob(-130, 56, 0.34, -178, 66, (1.0, 0.4, -0.3)), -4, 36, 8, 0.84, 0.0, ease='linear')
    key(13, lob(-100, 62, 0.42, -150, 66, (1.0, 0.5, -0.1)), 0, 24, 0, 0.83, 0.04, ease='linear')
    key(14, lob(-60, 58, 0.52, -100, 62, (0.9, 0.2, 0.0)), 5, 10, -6, 0.82, 0.07, ease='linear')
    key(15, lob(-28, 52, 0.58, -45, 50, (0.8, 0.0, 0.0)), 10, -2, -10, 0.81, 0.09, ease='linear')
    key(volley, lob(-6, 46, 0.59, 0, 30, (0.8, -0.2, 0.0)), 14, -12, -13, 0.80, 0.1, ease='linear')
    # the follow-through: the arm carries on down and across his body, the chest folds over the front boot, the back boot comes up on its toe
    key(volley + 2, lob(12, 18, 0.57, 16, -10, (0.6, -0.6, 0.0)), 19, -20, -15, 0.79, 0.11, ease='out')
    key(volley + 6, lob(34, -34, 0.5, 30, -58, (0.3, -0.7, 0.3)), 18, -18, -12, 0.80, 0.11)
    key(volley + 10, lob(26, -56, 0.48, 14, -62, (0.3, -0.9, 0.2)), 12, -10, -7, 0.83, 0.08)
    # the check and the recovery: he straightens, the arm falls to his side, and everything comes home
    key(volley + 15, lob(-2, -64, 0.52, -4, -58, (0.3, -1.0, 0.0)), 6, -3, -2, 0.88, 0.04)
    key(volley + 21, lob(-10, -68, 0.55, -8, -56, (0.3, -1.0, 0.0)), 2, 0, 0, 0.905, 0.01)
    c.key(n, ease='smooth', still=True, **rest(armL=REST_L_ROLL))
    # the boots: the left turns out on its toe to take the weight back; the right reaches out toward the foe, lands before the hips arrive, and holds; later both return
    c.steps('footL', (0.115, 0.0, 7), [(3, 7, 0.19, -0.1, 40, 0.05), (volley + 7, volley + 14, 0.115, 0.0, 7, 0.06)])
    c.steps('footR', (-0.115, 0.0, -7), [(5, 13, -0.17, 0.34, -10, 0.09), (volley + 11, volley + 20, -0.115, 0.0, -7, 0.07)])
    return c


def build():
    return [roll(), backstep(), shoot(), reload(), drink(), inject(), throw()]
