"""The four one-off actions of a boss fight and the places around it: `scatter` (a pinch of the Powder of Ibn Ghazi flung at the Horror), `kindle` (the lamp relit with a lucifer), `chant` (the
long incantation read from the little black book) and `helm` (his ten seconds at the Alert's wheel). None of them has a hit or a shot in the game's data, so they are made for how they read.

The right hand holds whatever weapon is in it, so it is never left to hang into the floor: every clip is checked for the rapier (the longest) and the arm either keeps the carried hold, is
brought out to balance, or is deliberate (the invocation's, the wheel's). The left hand has the prop (`c.props`) and does the acting in `scatter`, `kindle` and `chant`.
Every clip begins and ends at the carried pose (`rest`, `stand_feet`), so the game's crossfade has nothing to hide.
"""
import numpy as np
import solve as S
from clipkit import Clip, Foot, Swing, Arm, Grip, timing
from clips.common import at_rest, stand_feet

W = 'rapier'  # checked against the longest weapon (1.13 m): a shorter one is only further from the floor and from his legs

# ---- the carried pose, with the weapon hand brought forward as the game carries a rapier (playerPose.ts CARRY) so its point clears the floor ---------------------------------------
HOLD_R = ((-22, 0, -7), -24, (4, 0, 0))  # the weapon arm as joint angles: swung forward, the elbow bent, the weapon pointing down and forward


def swing_from(side, arm, elbow, hand=(0, 0, 0)):
    """The `Swing` that puts the arm where these joint angles do with him standing at ease: the first and last key of a clip that keys the arm by Swing."""
    ch = dict(pelvis=(0.0, 0.912, 0.0), torso=(1, 0, 0), **{'arm' + side: {'arm': arm, 'elbow': elbow, 'hand': hand}})
    rig = S.solve(ch)[1]
    s, e, w = (rig.world[k + side][:3, 3] for k in ('arm', 'elbow', 'hand'))
    H = rig.world['hand' + side]
    d = w - s
    dist = float(np.linalg.norm(d))
    az, el = float(np.degrees(np.arctan2(-d[0], d[2]))), float(np.degrees(np.arcsin(d[1] / dist)))
    blade = -H[:3, 1]
    baz, bel = float(np.degrees(np.arctan2(-blade[0], blade[2]))), float(np.degrees(np.arcsin(blade[1])))
    return Swing(reach=(az, el, dist), blade=(baz, bel), toward=tuple(float(x) for x in H[:3, 2]), pole=tuple(float(x) for x in e - (s + w) / 2))


REST_R = swing_from('R', *HOLD_R)


def rest(**over):
    """The carried pose for a clip's first and last key, both arms as FK angles (`over` replaces any channel)."""
    return at_rest(**{'armR': Arm(arm=HOLD_R[0], elbow=HOLD_R[1], hand=HOLD_R[2]), **over})


def weapon_r(az, el, d, baz, bel, pole=None):
    """The weapon arm by Swing: the wrist `d` from the shoulder at bearing (az, el), the weapon pointing (baz, bel). Its edge is turned up from the blade in the vertical plane (a fixed edge goes
    degenerate when the blade swings through it); the elbow's way is the carried hold's unless named."""
    return Swing(reach=(az, el, d), blade=(baz, bel), toward=tuple(float(x) for x in S.aimv(baz, bel + 90)), pole=REST_R['pole'] if pole is None else pole)


def scatter():
    """The Powder flung: the left fist swings back and low, the weight sinks and the shoulders wind away; then the right boot steps in, the hips and shoulders throw round and the arm sweeps up
    from his hip to forward and high, the wrist snapping over at the top as the packet empties; the arm falls away, the boot comes back and he stands. The right arm swings out to balance."""
    m = timing(W, 'scatter')
    c = Clip(m, 'scatter')
    c.props = ['powder']
    c.mark(props=14)
    n = m.frames
    c.key(0, **rest(armR=REST_R), **stand_feet(c, 0))
    c.key(0, look=(0, 1.5, 4))
    # wind-up: the weight sinks and goes back, the shoulders turn away to the right, the left fist swings back and low with the wrist cocked
    c.key(6, ease='out', pelvis=(0.0, 0.875, -0.05), pelvis_rot=(3, -10, 0), torso=(6, -22, 0),
          armL=Arm(arm=(42, 0, 14), elbow=-22, hand=(30, 0, 0)), armR=weapon_r(*REST_R['reach'][:2], 0.5, 10, -50), eases={'armR': 'smooth'})
    # the throw: the hips drive round first, the shoulders follow and the arm comes up through his front, straightening
    c.key(9, ease='in', pelvis=(0.0, 0.86, 0.04), pelvis_rot=(5, 2, 0), torso=(9, 0, 0),
          armL=Arm(arm=(-38, 0, 12), elbow=-34, hand=(12, 0, 0)))
    c.key(11, ease='linear', pelvis=(0.0, 0.85, 0.1), pelvis_rot=(5, 12, 0), torso=(11, 22, 0),
          armL=Arm(arm=(-96, 0, 12), elbow=-5, hand=(-22, 0, 0)), armR=weapon_r(40, -35, 0.5, 52, -48))
    # follow-through: the wrist snaps over at the top, the arm carries on and the body comes up out of the lunge
    c.key(14, ease='out', pelvis=(0.0, 0.86, 0.1), pelvis_rot=(4, 15, 0), torso=(9, 26, 0),
          armL=Arm(arm=(-104, 0, 24), elbow=-6, hand=(-58, 0, 0)))
    c.key(19, ease='smooth', pelvis=(0.0, 0.88, 0.07), pelvis_rot=(3, 9, 0), torso=(5, 14, 0),
          armL=Arm(arm=(-86, 0, 10), elbow=-26, hand=(-14, 0, 0)), armR=weapon_r(30, -40, 0.5, 40, -50))
    c.key(n - 4, ease='smooth', **rest(armR=REST_R, pelvis=(0.0, 0.905, 0.01), torso=(2, 3, 0)))
    c.key(n, ease='smooth', still=True, **rest(armR=REST_R))
    # the boots: the right steps in under the throw, the left keeps the ground; then the right comes back and the two stand level
    c.key(0, footL=Foot(0.115, 0.0, yaw=7))
    c.steps('footR', (-0.115, 0.0, -7), [(4, 11, -0.13, 0.26, -9, 0.08), (17, n - 2, -0.115, 0.0, -7, 0.05)])
    c.key(n, footL=Foot(0.115, 0.0, yaw=7))
    return c


# ---- kindle ----------------------------------------------------------------------------------------------------------------------------------------------------------------------
PIVOT = np.array([0.29, -0.005, 0.02])  # where the lantern hangs from his belt, in the torso's frame (model_gear.py): it hangs plumb from there
MATCH = 0.135  # the wrist to the match's head, along the hand's line


def grip_from(side, arm, elbow, hand=(0, 0, 0), edge=False):
    """The `Grip` that puts the arm where these joint angles do with him standing at ease: the first and last key of a clip that keys the arm by Grip (`edge`: with the hand's roll, for a
    clip whose other keys name one)."""
    ch = dict(pelvis=(0.0, 0.912, 0.0), torso=(1, 0, 0), **{'arm' + side: {'arm': arm, 'elbow': elbow, 'hand': hand}})
    rig = S.solve(ch)[1]
    s_, e, w = (rig.world[k + side][:3, 3] for k in ('arm', 'elbow', 'hand'))
    H = rig.world['hand' + side]
    return Grip(tuple(w), aim=tuple(-H[:3, 1]), pole=tuple(e - (s_ + w) / 2), edge=tuple(H[:3, 2]) if edge else None)  # (no edge: the hand's roll follows the arm, as it does at ease)


REST_GRIP_L = grip_from('L', (-4, 0, 7), -12)


def body_rig(body):
    """The solved rig of the body channels alone (pelvis, pelvis_rot, torso): what to put a hand on, in the actor's frame, for a pose of the body."""
    return S.solve({k: body[k] for k in ('pelvis', 'pelvis_rot', 'torso')})[1]


def on_torso(rig, p):
    """A point given in the torso's frame (the belt, the chest), in the actor's frame for this pose: a hand put there goes with him as he bends."""
    return (rig.T @ np.append(np.asarray(p, float), 1.0))[:3]


def grip_on(rig, p, aim, edge=None, pole=None):
    """The left hand's `Grip` with its wrist at `p` (torso frame), the match pointing down the torso-frame direction `aim`."""
    kw = {}
    if edge is not None:
        kw['edge'] = tuple(S.unit(rig.T[:3, :3] @ np.asarray(edge, float)))
    if pole is not None:
        kw['pole'] = tuple(S.unit(rig.T[:3, :3] @ np.asarray(pole, float)))
    return Grip(tuple(on_torso(rig, p)), aim=tuple(S.unit(rig.T[:3, :3] @ np.asarray(aim, float))), **kw)


def lamp_target(rig, inset=0.05, depth=-0.19):
    """Where the match's head goes: into the lantern's cage at the top of its flame (`depth` below the belt's pivot, the lamp hanging plumb), `inset` out toward the hand."""
    return on_torso(rig, PIVOT) + np.array([inset, depth, 0.0])


def lamp_touch(rig, **kw):
    """The left hand's `Grip` with the match's head at `lamp_target`, the match pointing along the line from his shoulder (so its wrist is a match's length short of it), and the target. The lamp
    hangs 0.83 m from his shoulder when he stands and the arm and the match reach 0.72, so he has to bow to it (the lamp goes with the torso: only its plumb hang changes as he bends)."""
    target = lamp_target(rig, **kw)
    aim = S.unit(target - rig.world['armL'][:3, 3])
    return Grip(tuple(target - aim * MATCH), aim=tuple(aim), pole=(0.7, -0.5, -0.2)), target


def kindle():
    """The lamp relit: the lucifer is struck along his belt and flares, and is held up to be looked at; then he bows to the lantern at his hip, the weight sinking back over bent knees, the left hand
    taking the flame into the cage; a beat for it to catch, the match shaken out, and he straightens. The right arm holds its weapon out at his side to balance the bow."""
    m = timing(W, 'kindle')
    c = Clip(m, 'kindle')
    c.props = ['match']
    c.mark(props=30)
    n = m.frames
    down = dict(pelvis=(0.0, 0.9, 0.0), pelvis_rot=(0, 0, 0), torso=(7, 6, -2))  # the first look down at the hand and the belt
    drag = dict(pelvis=(0.0, 0.89, 0.0), pelvis_rot=(1, 0, 0), torso=(9, 9, -3))  # the match dragged: the shoulder drops with the stroke
    flare = dict(pelvis=(0.0, 0.895, -0.01), pelvis_rot=(1, 0, 0), torso=(4, 10, -3))  # the lit match held up
    bow = dict(pelvis=(-0.02, 0.8, -0.1), pelvis_rot=(24, 0, 0), torso=(28, 4, -18))  # the bow to the lamp: the hips hinge, the knees bend and the back goes over
    sway = dict(pelvis=(-0.02, 0.805, -0.1), pelvis_rot=(25, 0, 0), torso=(29, 4, -19))  # as the flame catches he leans in a hair
    free = dict(pelvis=(-0.01, 0.84, -0.06), pelvis_rot=(14, 0, 0), torso=(16, 4, -8))  # on the way up
    R = {k: body_rig(v) for k, v in dict(down=down, drag=drag, flare=flare, bow=bow, sway=sway, free=free).items()}
    belt = grip_on(R['down'], (0.16, 0.13, 0.19), (0.0, -0.75, 0.65), pole=(0.5, -0.8, -0.2))
    cock = grip_on(R['down'], (0.17, 0.17, 0.15), (0.0, -0.8, 0.55), pole=(0.5, -0.8, -0.2))
    scrape = grip_on(R['drag'], (0.23, 0.07, 0.16), (0.05, -0.55, 0.85), pole=(0.5, -0.8, -0.2))
    held = grip_on(R['flare'], (0.12, 0.27, 0.31), (-0.05, 0.55, 0.85), pole=(0.6, -0.8, 0.0))
    touch, target = lamp_touch(R['bow'])
    touch2, _ = lamp_touch(R['sway'])
    look = lambda p: tuple(float(x) for x in p)
    c.key(0, **at_rest(armL=REST_GRIP_L, armR=REST_R), **stand_feet(c, 0))
    c.key(0, look=(0, 1.5, 4))
    # the weapon arm eases out and back to hold its blade out at his right side, level and clear of the floor, to balance the bow; it moves slowly (a long blade swings a long way) and is still while he bows
    c.key(6, ease='smooth', armR=weapon_r(60, -45, 0.5, 70, -32))
    c.key(15, ease='smooth', armR=weapon_r(100, -38, 0.5, 100, -26))
    c.key(26, ease='smooth', armR=weapon_r(100, -38, 0.5, 100, -26))
    c.key(38, ease='smooth', armR=REST_R)
    # the draw: the left hand comes across to the front of his hip with the match, the eyes on it
    c.key(3, ease='out', **down, armL=belt, look=look(on_torso(R['down'], (0.17, 0.0, 0.3))))
    c.key(5, ease='smooth', armL=cock)
    # the stroke: a short quick scrape down the belt, the shoulder dropping with it
    c.key(7, ease='in', **drag, armL=scrape, look=look(on_torso(R['drag'], (0.2, 0.0, 0.4))))
    # the flare: the lit match comes up before him, he watches the flame
    c.key(11, ease='smooth', **flare, armL=held, look=look(on_torso(R['flare'], (0.12, 0.33, 0.4))))
    c.key(13, ease='smooth', armL=dict(held, grip=tuple(np.array(held['grip']) + [0.0, 0.02, 0.0])))
    # the bow: the hips hinge and sink, the hand goes down the length of his side to the cage, the head following the flame
    c.key(19, ease='smooth', **bow, armL=touch, look=look(target))
    c.key(24, ease='smooth', **sway, armL=touch2, look=look(target))
    # the match shaken out: the hand draws back out of the cage and flicks away at his side (the match is gone from frame 30); the body comes up through it
    c.key(27, ease='smooth', **free, armL=Grip((0.5, 0.75, 0.2), aim=(0.3, -0.9, 0.2), pole=(0.7, -0.5, -0.2)), look=(0, 1.0, 1.0))
    c.key(30, ease='smooth', pelvis=(-0.005, 0.865, -0.04), pelvis_rot=(9, 0, 0), torso=(11, 3, -4), armL=Grip((0.42, 0.9, 0.16), aim=(0.4, -0.8, 0.4), pole=(0.7, -0.5, -0.2)), look=(0, 1.3, 3))
    c.key(35, ease='smooth', pelvis=(0.0, 0.9, -0.01), pelvis_rot=(3, 0, 0), torso=(4, 1, -1), look=(0, 1.5, 4))
    c.key(n, ease='smooth', still=True, **at_rest(armL=REST_GRIP_L, armR=REST_R))
    # the boots: the right steps back into a brace as he bows and comes in again as he rises; the left holds the ground
    c.key(0, footL=Foot(0.115, 0.0, yaw=7))
    c.steps('footR', (-0.115, 0.0, -7), [(8, 16, -0.14, -0.1, -12, 0.05), (29, 37, -0.115, 0.0, -7, 0.05)])
    c.key(n, footL=Foot(0.115, 0.0, yaw=7))
    return c


# ---- chant -----------------------------------------------------------------------------------------------------------------------------------------------------------------------
def table(pts, f):
    """A smooth curve through (frame, value) points: the shape of the whole incantation, read at frame f (smoothstep between points)."""
    xs = [p[0] for p in pts]
    i = int(np.clip(np.searchsorted(xs, f, side='right') - 1, 0, len(pts) - 2))
    (f0, v0), (f1, v1) = pts[i], pts[i + 1]
    u = float(np.clip((f - f0) / max(f1 - f0, 1e-6), 0.0, 1.0))
    return np.asarray(v0, float) + (np.asarray(v1, float) - np.asarray(v0, float)) * u * u * (3 - 2 * u)


def chant():
    """The incantation: boots set wide and planted, the little black book open on the left palm at his chest and his eyes on its page; he reads, the right arm rising by degrees from his side, and
    the voice and the body grow with it until the arm is held high and sweeps over his head, the chest thrown open and the head back; then the arm comes down to point at the Horror as the
    right boot stamps, and he lowers book and arm and stands. The weapon in his right hand goes with the arm, pointing along it. Breath and a slow shift of weight go all through."""
    m = timing(W, 'chant')
    c = Clip(m, 'chant')
    c.props = ['book']
    n = m.frames
    # the shape of it, (frame, value) points read smoothly: the back over the book (torso pitch), the body's turn, the pelvis's height and forward push
    pitch = [(0, 1), (14, 9), (60, 10), (84, 5), (108, -3), (128, -9), (146, -11), (152, -5), (158, 13), (166, 14), (174, 7), (n, 1)]
    yaw = [(0, 0), (40, 2), (80, -3), (100, -8), (120, -4), (134, 6), (148, 14), (156, -3), (166, 0), (n, 0)]
    sink = [(0, 0.912), (16, 0.872), (90, 0.868), (130, 0.85), (150, 0.848), (158, 0.84), (168, 0.86), (n, 0.912)]
    push = [(0, 0), (14, -0.03), (140, -0.03), (152, 0.0), (160, 0.07), (168, 0.06), (n, 0)]
    eyes_book = [(0, 0), (16, 1), (76, 1), (108, 0), (n, 0)]  # where the eyes are: the page, then the sky, then the Horror
    eyes_sky = [(0, 0), (76, 0), (108, 1), (146, 1), (156, 0), (n, 0)]
    book_up = [(0, 0), (14, 1), (150, 1), (162, 0.6), (n, 0)]  # how far the book is held up, as against hanging in the rest hand
    voice = [(0, 0.5), (60, 0.7), (130, 1.0), (n, 0.7)]  # how much the breath and the flutter of the body are
    # the right arm, (az, el, reach, blade az, blade el): down by his side, out and up by degrees, held high and swept over his head, down to point, down to rest
    r0 = REST_R['reach'] + REST_R['blade']
    arm = [(0, r0), (12, (22, -52, 0.55, 22, -42)), (26, (40, -36, 0.5, 42, -22)), (42, (46, -18, 0.48, 50, 0)), (58, (52, -8, 0.5, 60, 14)), (72, (60, 5, 0.52, 68, 28)),
           (86, (75, 22, 0.55, 80, 45)), (99, (68, 46, 0.57, 70, 62)), (110, (52, 62, 0.58, 54, 76)), (121, (20, 72, 0.58, 20, 82)), (131, (-28, 68, 0.58, -32, 78)),
           (139, (-44, 60, 0.58, -50, 72)), (146, (-10, 74, 0.58, -12, 84)), (151, (24, 50, 0.58, 24, 60)), (155, (8, 16, 0.58, 8, 16)), (159, (-2, 6, 0.58, 0, 4)),
           (166, (2, 4, 0.58, 2, 3)), (172, (14, -34, 0.55, 15, -34)), (n, r0)]
    rest_l = grip_from('L', (-4, 0, 7), -12, edge=True)
    front = np.array([0.0, 1.5, 4.0])  # the Horror's way
    for f in list(range(0, n, 5)) + [n]:
        v = float(table(voice, f))
        breath = np.sin(2 * np.pi * f / 54.0)  # slow breaths, deepening with the voice
        shift = np.sin(2 * np.pi * f / 170.0 + 0.4)  # the weight going slowly from one boot to the other and back
        flutter = np.sin(2 * np.pi * f / 23.0 + 1.0) * v  # a tremor in the shoulders and the book as he reads aloud
        ends = min(1.0, f / 20.0) * min(1.0, (n - f) / 20.0)  # the sway only once he is set, and not as he leaves
        turn = float(table(yaw, f))
        body = dict(pelvis=(0.02 * shift * ends, float(table(sink, f)) - 0.004 * breath * v, float(table(push, f))),
                    pelvis_rot=(0, 1.5 * shift * ends + 0.3 * turn, 1.2 * shift * ends),
                    torso=(float(table(pitch, f)) + 0.9 * breath * v, 0.7 * turn + 0.8 * flutter, -1.2 * shift * ends))
        rig = body_rig(body)
        # the left hand: the book upright before his chest, tipped back to him, a little raised as his voice is; or the hanging hand it was and will be
        wrist = np.array([0.12, 0.33 + 0.07 * float(table([(0, 0), (96, 0), (126, 1), (148, 1), (158, 0), (n, 0)], f)) + 0.004 * flutter, 0.30 + 0.01 * breath * v])
        hand = grip_on(rig, wrist, (0.0, -0.45, 0.9), edge=(0.0, 1.0, 0.45), pole=(0.6, -0.8, -0.2))
        w = float(table(book_up, f))
        if w < 1.0:
            hand = {k: tuple(np.asarray(hand[k], float) * w + np.asarray(rest_l[k], float) * (1 - w)) for k in hand}
        # the eyes: on the page, up to the sky as the arm goes up, then on the Horror
        page = on_torso(rig, wrist + np.array([0.0, 0.0, 0.1]))
        sky = np.array([0.0, 2.35 + 0.08 * flutter, 2.4])
        wb, ws = float(table(eyes_book, f)), float(table(eyes_sky, f))
        look = front + wb * (page - front) + ws * (sky - front)
        a = table(arm, f)
        c.key(f, ease='cr', **body, armL=hand, look=tuple(float(x) for x in look), armR=REST_R if f in (0, n) else weapon_r(*a[:3], *a[3:5]))
    c.key(0, **stand_feet(c, 0))
    # the boots: set wide and planted, the right a little ahead; the right stamps as the arm comes down to point; then both come in and stand
    c.steps('footL', (0.115, 0.0, 7), [(1, 10, 0.19, -0.04, 13, 0.05), (169, 178, 0.115, 0.0, 7, 0.05)])
    c.steps('footR', (-0.115, 0.0, -7), [(5, 15, -0.19, 0.08, -13, 0.05), (147, 156, -0.19, 0.08, -13, 0.09), (165, 175, -0.115, 0.0, -7, 0.05)])
    return c


# ---- helm ------------------------------------------------------------------------------------------------------------------------------------------------------------------------
def smoothstep(u):
    u = min(1.0, max(0.0, float(u)))
    return u * u * (3 - 2 * u)


def sines(f, terms):
    """A sum of sines (amplitude, period in frames, phase): the deck's roll, pitch and heave are each several of these of different periods, so the sea never obviously repeats."""
    return sum(a * np.sin(2 * np.pi * f / p + ph) for a, p, ph in terms)


WHEEL = np.array([0.0, 1.16, 0.50])  # the middle of the Alert's wheel, in his frame: before his belly, its rim at arm's length
SPOKE = 0.32  # where his hands are about it


def on_wheel(phi, lift=0.0):
    """A place on the wheel's rim `phi` degrees clockwise of its top as he sees it (his right is -x), and the way the rim runs there (the way a hand's line lies, going down on his right).
    `lift`: how far the hand is off the rim, toward him and out."""
    a = np.radians(phi)
    rho = np.array([-np.sin(a), np.cos(a), 0.0])  # out from the wheel's middle
    return WHEEL + rho * (SPOKE + 0.5 * lift) + np.array([0.0, 0.0, -lift]), np.array([-np.cos(a), -np.sin(a), 0.0]), -rho


def helm():
    """At the wheel: both boots set wide and braced, knees soft, both hands on the Alert's wheel and his eyes ranging over the sea ahead. The deck's roll, pitch and heave are the sum of several slow
    swells, and he answers them: the hips shift against the roll, the chest and head stay upright over it, the knees take the heave. Now and then he turns the wheel a few degrees, hand over hand: both
    hands turn it, then the lower one lets go, comes back up the rim and takes hold again. A big swell makes him re-plant a boot. The weapon in his right hand hangs from it, swinging a little."""
    m = timing(W, 'helm')
    c = Clip(m, 'helm')
    n = m.frames
    ROLL = [(5.0, 240, 0.7), (3.2, 160, 2.1), (1.8, 96, 4.0), (1.0, 60, 1.0)]  # degrees of the deck's roll
    PITCH = [(3.0, 160, 1.3), (2.0, 120, 0.2), (1.2, 96, 2.2)]  # and of its pitch
    HEAVE = [(0.016, 120, 2.7), (0.009, 80, 0.4)]  # and its heave, metres
    SCAN = [(1.0, 240, 0.3), (0.5, 120, 2.0), (0.25, 48, 1.0)]  # the head's sweep over the sea (every period goes into 480, so the middle of the clip, frames 60 to 540, closes on itself)
    # the wheel's turning: (frame, degrees it is turned by, which hand lets go to take a better hold after)
    turns = [(70, 22, 'R'), (154, -16, 'L'), (236, 26, 'R'), (320, -20, 'L'), (396, 14, 'R'), (470, -26, 'L'), (498, 0, 'R')]  # they sum to nothing, and the last is only a re-grip: the wheel is where it began
    TURN, WAIT, REGRIP = 20, 3, 12
    base = {'R': 62.0, 'L': -62.0}
    psi = np.zeros(n + 1)
    slip = {'R': np.zeros(n + 1), 'L': np.zeros(n + 1)}
    lift = {'R': np.zeros(n + 1), 'L': np.zeros(n + 1)}
    cur, now = 0.0, {'R': 0.0, 'L': 0.0}
    for t, d, hand in turns:
        f = np.arange(n + 1)
        psi += d * np.array([smoothstep((x - t) / TURN) for x in f])
        cur += d
        t0 = t + TURN + WAIT  # the hand that went down lets go, goes back up the rim to where it began, a little short, and takes hold again
        target = -cur * 0.85  # the hand's slip back up the rim: nearly all of what the wheel has turned since it began
        for x in f:
            u = smoothstep((x - t0) / REGRIP)
            slip[hand][x] += (target - now[hand]) * u
            lift[hand][x] = max(lift[hand][x], np.sin(np.pi * min(1.0, max(0.0, (x - t0) / REGRIP))) * 0.06)
        now[hand] = target
    gust = lambda f: 1.0 + 0.6 * np.exp(-((f - 215) / 28.0) ** 2) + 0.5 * np.exp(-((f - 425) / 30.0) ** 2)
    rest_r = grip_from('R', *HOLD_R, edge=True)
    rest_l = grip_from('L', (-4, 0, 7), -12, edge=True)
    for f in list(range(0, n, 4)) + [n]:
        e = smoothstep((f - 14) / 46.0) * smoothstep((n - 8 - f) / 46.0)  # the sea only once he is at the wheel
        g = gust(f)
        roll = sines(f, ROLL) * g * e
        pitch = sines(f, PITCH) * g * e
        heave = sines(f, HEAVE) * g * e
        scan = sines(f, SCAN) * e
        up = smoothstep((f - 6) / 26.0) * smoothstep((n - 4 - f) / 26.0)  # at the wheel: the stance, the lean onto it
        body = dict(pelvis=(-0.011 * roll, 0.912 + (0.825 - 0.912) * up + heave, 0.008 * pitch),
                    pelvis_rot=(0.6 * pitch * up, 1.5 * np.sin(2 * np.pi * f / 240 + 1.0) * e, -0.6 * roll),
                    torso=(1 + 7 * up + 0.6 * pitch, 3.0 * scan, -0.5 * sines(f - 9, ROLL) * g * e))
        look = (3.2 * scan + 0.3, 1.58 + 0.15 * np.sin(2 * np.pi * f / 120 + 0.5) * e, 8.0)
        hands = {}
        for h, sgn in (('R', 1), ('L', -1)):
            phi = base[h] + psi[f] + slip[h][f]
            pos, tang, inward = on_wheel(phi, lift[h][f])
            aim = tang * sgn  # the hand's line: along the rim, pointing down, as it runs on his right and (the other way round) on his left
            if h == 'R':  # the weapon hangs from the hand, loosely: down and out, swinging with the roll
                hang = np.array([-0.35 + 0.05 * np.sin(np.radians(roll * 6)), -0.92, -0.1])
                aim = S.unit(0.65 * S.unit(hang) + 0.35 * S.unit(aim))
            hands[h] = Grip(tuple(pos), aim=tuple(aim), edge=tuple(inward), pole=(sgn * -0.6, -0.6, -0.3))
        if f in (0, n):
            hands = {'R': rest_r, 'L': rest_l}
        else:  # between the rest and the wheel: the hand goes up as the stance is taken
            w = smoothstep((f - 4) / 26.0) * smoothstep((n - 2 - f) / 26.0)
            if w < 1.0:
                hands = {h: {k: tuple(np.asarray(hands[h][k], float) * w + np.asarray((rest_r if h == 'R' else rest_l)[k], float) * (1 - w)) for k in hands[h]} for h in 'RL'}
        c.key(f, ease='cr', **body, look=tuple(float(x) for x in look), head=(0, 0, 0.6 * roll), armR=hands['R'], armL=hands['L'])
    c.key(0, **stand_feet(c, 0))
    # the boots: set wide and toed out, the right ahead, and braced; the left and the right each re-plant a little as a swell comes; then both come back and stand
    c.steps('footL', (0.115, 0.0, 7), [(3, 17, 0.23, -0.08, 16, 0.05), (258, 266, 0.255, -0.06, 18, 0.035), (500, 508, 0.23, -0.08, 16, 0.035), (568, 581, 0.115, 0.0, 7, 0.05)])
    c.steps('footR', (-0.115, 0.0, -7), [(9, 23, -0.23, 0.1, -16, 0.05), (426, 435, -0.255, 0.12, -18, 0.035), (520, 528, -0.23, 0.1, -16, 0.035), (574, 588, -0.115, 0.0, -7, 0.05)])
    return c


def build():
    return [scatter(), kindle(), chant(), helm()]
