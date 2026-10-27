"""Zamacona's rapier: two quick thrusts, a full lunge and a circular parry. 1.13 m from the wrist, a point and no edge, so every blow is a line from the shoulder to the foe.

His hand with it is a duellist's: front foot first, the sword arm out ahead and the free one flung back and up behind him for balance, the carriage upright until the lunge takes him low, the
point steady on its mark through the whole of the hit window, the arm straight along the blade and the shoulder behind it. Light1 is the quick extension off the front foot, light2 the other
line (the hand up at his brow, the point cocked and flicked down onto the mark from above as the left boot passes through under him, the hand turned thumb up), heavy1 the fencer's lunge (a
long gather, the arm goes out first, the rear leg drives and the body flies low after the point, the front leg reaching and landing as it arrives), the parry a circle the point draws to
knock the steel aside, and a riposte flicked back.
Every blow begins and ends in the carried pose with the sword hand raised a little (`rest`), so the game's crossfade has nothing to hide.
"""
import numpy as np
import solve as S
import frame as F
from clipkit import Clip, Foot, Swing, timing, LENGTH as LENGTHS
from clips.common import at_rest

W = 'rapier'
LENGTH = LENGTHS[W]  # the blade, from the wrist to the point
# The carried pose, for the first and last key of a clip, written as Swings so no channel of an arm is left half Arm and half Swing. The idle's own arms hang the rapier down his right leg with its
# point tipped back, and the game tips it 0.8 rad further when it is carried (playerPose.ts CARRY: a clip is not tipped), so a point swinging up from there to the guard would travel 150 degrees in
# five frames, faster than a blade this long can be turned. The clips begin and end instead in the carried pose with each arm raised a little over a quarter of a radian at the shoulder and
# the elbow: the sword hand in front of his belt, the point low in front of him and clear of the floor, which is a ready carriage and is where a blade goes when it is lowered. Every joint is
# within the 37 degrees of the idle's that tests/playerClips.test.ts allows, and the game's 0.12 s crossfade does the rest.
REST_R = dict(reach=(7.88, -43.28, 0.5516), blade=(12.23, -60.44), toward=(0.0, 0.485, 0.875), pole=(-0.031, -0.722, -0.691))
REST_L = dict(reach=(-16.17, -53.26, 0.5547), pole=(0.049, -0.575, -0.817))
REST_LOOK = (0.3, 1.62, 4.0)  # where the idle's head is looking at its first frame
FOE = (0.0, 1.2, 1.75)  # the game's hit sphere for the thrusts (reach 1.75, height 1.2), in the actor's frame: where the point is put
SH = 0.14  # how far ahead of the hips the sword shoulder is carried in a thrust: a straight arm and the blade then put the point just past the mark (1.75 to 1.8 from him)
EDGE = (0, 1, 0)  # the rapier's guard level, its quillons up and down (the hand held palm down)
EDGE2 = (0.9, 0.35, 0)  # and turned in toward his left (the hand held thumb up, as a quarte is)
POLE = (-0.35, -0.8, -0.3)  # the sword elbow's way: down and a little out and back


def rest(**over):
    """The carried pose for a clip's first and last key: `at_rest` with both arms as Swings, and the idle's gaze."""
    return at_rest(look=REST_LOOK, **{**dict(armR=Swing(**REST_R), armL=Swing(**REST_L)), **over})


def shoulders(ch):
    """Where his right and left shoulders are, in the actor's frame, for the pelvis and torso in `ch`."""
    B = S.move(ch['pelvis']) @ S.rot(S.euler(ch.get('pelvis_rot', (0, 0, 0))))
    T = B @ S.rot(S.euler(ch.get('torso', (0, 0, 0))))
    return [(T @ S.move(F.JOINTS[j][1]))[:3, 3] for j in ('armR', 'armL')]


def bearing(v):
    """(az, el) in degrees of the direction v, as a Swing takes them."""
    return float(np.degrees(np.arctan2(-v[0], v[2]))), float(np.degrees(np.arcsin(v[1] / np.linalg.norm(v))))


def sword(ch, to=FOE, d=None, wrist=None, edge=EDGE, pole=POLE):
    """The sword arm for the body being keyed in `ch`: the wrist `d` from the right shoulder (as far as the mark needs, if not said), on the line to the point `to` (or at `wrist` = (az, el), a bearing from the shoulder), and the blade
    always pointing at `to`; so a thrust is the arm straight along the blade at the mark. The shoulders move with the body, so the numbers are worked out from where this one is."""
    s = shoulders(ch)[0]
    if d is None:  # the arm stretches as far as the point needs it to (a little more, to put the point through the mark), no further than it goes
        d = float(np.clip(np.linalg.norm(np.asarray(to, float) - s) - LENGTH + 0.06, 0.3, 0.575))
    waz, wel = wrist or bearing(np.asarray(to, float) - s)
    w = s + d * S.aimv(waz, wel)
    baz, bel = bearing(np.asarray(to, float) - w)
    return Swing(reach=(waz, wel, d), blade=(baz, bel), toward=edge, pole=pole)


def rear(az, el, d=0.5, bend=(0.6, 0.2, -0.6)):
    """The free (left) arm: the wrist `d` from his left shoulder at that bearing (his left is az < 0), the elbow bent toward `bend`, which must not lie along the arm or the elbow has no side to go to."""
    u = S.aimv(az, el)
    b = np.asarray(bend, float)
    if np.linalg.norm(b - u * np.dot(b, u)) < 0.35 * np.linalg.norm(b):
        raise ValueError(f'the elbow of the free arm at ({az}, {el}) has no side to bend to: {bend} lies along the arm')
    return Swing(reach=(az, el, d), pole=bend)


def hips(c, f):
    """Where his hips are at frame f in the clip's world (z): the actor's root, which travels through the move, and the pelvis keyed in its frame. The boots are put by it, so the legs are never asked for more than they reach."""
    return float(c.root(f)[2] + c.channels(f)['pelvis'][2])


def key(c, t, arm=None, shoulder=None, **ch):
    """`Clip.key` with the sword arm worked out (`sword`) from the body in this key: `arm` is the keyword arguments of `sword`. `shoulder`: how far ahead of him (z) the sword shoulder is, if the
    pelvis is to be moved fore or aft to put it there: a thrust is the arm straight along the blade and the point at the mark, so the shoulder has to be one arm and one blade short of it."""
    ease = ch.pop('ease', 'cr')
    if shoulder is not None:
        p = ch['pelvis']
        ch['pelvis'] = (p[0], p[1], p[2] + shoulder - float(shoulders(ch)[0][2]))
    if arm is not None:
        ch['armR'] = sword(ch, **arm)
    c.key(t, ease=ease, **ch)


def _slerp(a, b, u):
    """The direction `u` of the way from the unit vector a to b along the great circle."""
    ang = float(np.arccos(np.clip(np.dot(a, b), -1.0, 1.0)))
    return a if ang < 1e-6 else (np.sin((1 - u) * ang) * a + np.sin(u * ang) * b) / np.sin(ang)


def _turn(v, k, ang):
    """The vector v turned `ang` radians about the unit vector k."""
    return v * np.cos(ang) + np.cross(k, v) * np.sin(ang) + k * np.dot(k, v) * (1 - np.cos(ang))


def sweep(c, t0, t1, pace=lambda u: 0.5 * u + 0.5 * u * u * (3 - 2 * u)):
    """The sword arm, already keyed (by `Swing`) at frames t0 and t1, carried between them a frame at a time: the wrist along its own arc, the blade's point along a great circle, at a pace that is
    eased but never idles (a blade this long is fast at its point), the edge turning with it as a held weapon does and so never flipped about the blade, which is what a spline of the keys does to
    it when the blade turns far. Used to bring the point up out of its carriage and to put it down again."""
    a, b = c.channels(t0)['armR'], c.channels(t1)['armR']
    pa, pb = S.unit(S.aimv(*a['blade'])), S.unit(S.aimv(*b['blade']))
    ea, eb = S.edge_of(pa, a['toward']), S.edge_of(pb, b['toward'])
    axis = np.cross(pa, pb)
    axis = axis / np.linalg.norm(axis) if np.linalg.norm(axis) > 1e-6 else np.cross(pa, (0.0, 1.0, 0.0))
    swing = float(np.arccos(np.clip(np.dot(pa, pb), -1.0, 1.0)))
    carried = _turn(ea, axis, swing)  # the edge, if the hand did not twist the blade as it came round
    twist = float(np.arctan2(np.dot(np.cross(carried, eb), pb), np.dot(carried, eb)))  # and what is left to turn it by to the edge asked for
    for f in range(t0 + 1, t1):
        u = pace((f - t0) / (t1 - t0))
        v = _slerp(pa, pb, u)
        e = _turn(_turn(ea, axis, swing * u), v, twist * u * u)
        w = np.asarray(a['reach'], float) * (1 - u) + np.asarray(b['reach'], float) * u
        pole = np.asarray(a['pole'], float) * (1 - u) + np.asarray(b['pole'], float) * u
        baz, bel = bearing(v)
        c.key(f, ease='linear', armR=Swing(reach=tuple(w), blade=(baz, bel), toward=tuple(e), pole=tuple(pole)))


def light1(m=None):
    """The quick extension: the blade comes up out of its carriage to the guard and draws back a little, the weight sits back over the rear leg; then the front boot reaches and the arm shoots out
    straight along the blade, the point steady on the mark, the rear arm flung back for balance. The blade comes home, the boots close."""
    m = m or timing(W, 'light1')
    c = Clip(m, 'rapier.light1')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    home = float(c.root(n)[2])  # where he ends, and where the boots close: the clip's world has moved on with the move's own travel
    c.key(0, **rest())
    # the draw: the point swings up and out to his right and across to the mark, the hand rising along his right side (never through the floor); the free arm starts up; the weight sinks a
    # little and turns, the hand drawn back to his chest at the guard, the point on the mark, the free arm up and back
    c.key(3, pelvis=(0.0, 0.89, -0.03), pelvis_rot=(0, 8, 0), torso=(1, 12, 0), look=(0, 1.4, 4), armL=rear(-75, -10, 0.5, (0.6, 0.0, -0.5)))
    key(c, 6, pelvis=(0.0, 0.85, -0.08), pelvis_rot=(0, 13, 0), torso=(1, 21, 0),
        arm=dict(wrist=(-12, -28), d=0.4), armL=rear(-102, 28, 0.46, (0.6, 0.2, -0.6)))
    sweep(c, 0, 6)
    # the thrust: the hips go in first, the chest behind them, the arm last, to the full stretch with the point in the mark
    key(c, h0, ease='in', shoulder=SH, pelvis=(0.0, 0.78, 0.0), pelvis_rot=(2, 20, 0), torso=(12, 32, 0),
        arm=dict(), armL=rear(-122, 6, 0.55, (0.5, -0.2, -0.3)))
    key(c, h1, ease='linear', shoulder=SH + 0.02, pelvis=(0.0, 0.775, 0.0), pelvis_rot=(2, 21, 0), torso=(13, 34, 0),
        arm=dict(), armL=rear(-124, 4, 0.55, (0.5, -0.2, -0.3)))
    # the recovery: the arm folds back along the line, the body rises and unwinds, the point comes down to its carriage
    key(c, h1 + 5, ease='smooth', pelvis=(0.0, 0.85, 0.0), pelvis_rot=(0, 12, 0), torso=(3, 18, 0),
        arm=dict(wrist=(-12, -26), d=0.46), armL=rear(-100, 24, 0.46, (0.6, 0.2, -0.6)))
    c.key(n - 7, ease='smooth', pelvis=(0.0, 0.9, 0.0), pelvis_rot=(0, 4, 0), torso=(2, 6, 0), armL=rear(-60, -40, 0.5, (0.3, -0.1, -0.7)))
    c.key(n, ease='smooth', still=True, **rest())
    sweep(c, h1 + 5, n)
    # the boots: the front boot reaches into the thrust, the rear one is dragged up and out behind it; then the rear comes up, the front slides back and the two close
    c.steps('footR', (-0.115, 0.0, -7), [(2, h0, -0.07, hips(c, h0) + 0.5, 2, 0.14), (h1 + 3, h1 + 10, -0.115, home, -7, 0.05)])
    c.steps('footL', (0.115, 0.0, 7), [(5, h0 + 1, 0.17, hips(c, h0 + 1) - 0.34, 40, 0.05), (h1, h1 + 6, 0.115, home, 7, 0.06)])
    return c


def light2(m=None):
    """A different line: the hand goes up high at his brow with the point sloping down at the mark, cocks the point up, and the left boot passes through under him as the wrist breaks and the point flicks
    down onto the line from above, palm turned in; the body whips round from the hips to the shoulder behind it and the free arm sweeps out and down. The blade goes out to the right as it comes home."""
    m = m or timing(W, 'light2')
    c = Clip(m, 'rapier.light2')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    home = float(c.root(n)[2])  # where he ends, and where the boots close: the clip's world has moved on with the move's own travel
    c.key(0, **rest())
    # the high guard: the hand rises to his brow on the right, the point level over the mark, the weight easy on his heels, the free arm out and low
    c.key(3, pelvis=(0.0, 0.9, -0.03), pelvis_rot=(0, -3, 0), torso=(0, 2, 0), look=(0, 1.5, 4), armL=rear(-70, -25, 0.5, (0.3, 0.6, -0.3)))
    key(c, 5, pelvis=(0.0, 0.88, -0.05), pelvis_rot=(0, -6, 0), torso=(-2, 4, 0), look=(0, 1.45, 4),
        arm=dict(to=(0.0, 1.85, 1.7), wrist=(8, 40), d=0.5, edge=EDGE2), armL=rear(-96, -10, 0.5, (0.3, 0.6, -0.3)))
    sweep(c, 0, 5)
    # the cock: the shoulder draws back, the hand a little higher and the point lifted: the wrist loaded
    key(c, 7, ease='smooth', pelvis=(0.0, 0.85, -0.08), pelvis_rot=(0, -10, 0), torso=(-5, -4, 0),
        arm=dict(to=(-0.05, 2.3, 1.3), wrist=(10, 48), d=0.46, edge=EDGE2), armL=rear(-100, -14, 0.5, (0.3, 0.6, -0.3)))
    # the flick: the hips drop through, the chest follows, and the wrist breaks: the hand falls to the line and the point with it
    key(c, 9, ease='in', shoulder=0.08, pelvis=(0.0, 0.82, 0.0), pelvis_rot=(2, -6, 0), torso=(8, 6, 0),
        arm=dict(to=(0.0, 1.5, 1.7), wrist=(4, 16), edge=EDGE2), armL=rear(-108, -24, 0.55, (0.3, 0.6, -0.3)))
    key(c, h0, ease='linear', shoulder=SH, pelvis=(0.0, 0.8, 0.0), pelvis_rot=(3, -8, 0), torso=(16, 12, 0),
        arm=dict(edge=EDGE2), armL=rear(-122, -38, 0.55, (0.3, 0.6, -0.3)))
    key(c, h1, ease='linear', shoulder=SH + 0.02, pelvis=(0.0, 0.795, 0.0), pelvis_rot=(3, -8, 0), torso=(17, 13, 0),
        arm=dict(edge=EDGE2), armL=rear(-126, -42, 0.55, (0.3, 0.6, -0.3)))
    # the recovery: the arm folds back along the line, the body rises, and the point goes out to his right and falls to its carriage
    key(c, h1 + 5, ease='smooth', pelvis=(0.0, 0.87, 0.02), pelvis_rot=(0, -2, 0), torso=(5, 6, 0),
        arm=dict(wrist=(-6, -20), d=0.45, edge=EDGE2), armL=rear(-90, -15, 0.5, (0.3, 0.6, -0.3)))
    c.key(n - 7, ease='smooth', pelvis=(0.0, 0.9, 0.0), pelvis_rot=(0, 2, 0), torso=(2, 4, 0), armL=rear(-60, -40, 0.5, (0.3, -0.1, -0.7)))
    c.key(n, ease='smooth', still=True, **rest())
    sweep(c, h1 + 5, n)
    # the boots: the left boot passes through and lands as the point arrives, the right is drawn up behind it, turning out; then the left slides back, the right comes up and the two close
    c.steps('footL', (0.115, 0.0, 7), [(4, h0, 0.04, hips(c, h0) + 0.48, -2, 0.15), (h1 + 2, h1 + 9, 0.115, home, 7, 0.05)])
    c.steps('footR', (-0.115, 0.0, -7), [(7, h1, -0.2, hips(c, h1) - 0.34, -25, 0.08), (h1 + 3, n - 4, -0.115, home, -7, 0.07)])
    return c


def steps_on(c, side, start, moves, h=0.07):
    """`Clip.steps` for a boot that has already been keyed (a boot that landed from a flight): the same lift, swing and heel-first landing, without the key at frame 0."""
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


def fly(c, side, f0, f1, x, z_of, yaw=0.0, yaw1=None, peak=0.2):
    """A boot in the air from frame f0, where it leaves the floor, to f1, where it lands heel first: `z_of(f)` is where it is each frame in the clip's world, so it can keep up with a body that is
    travelling at a run (`Clip.steps` swings a boot as a smooth step from here to there, which a lunge outruns). It is lifted `peak` at most, toe down as it goes and toe up as it lands."""
    yaw1 = yaw if yaw1 is None else yaw1
    for f in range(f0, f1 + 1):
        u = (f - f0) / (f1 - f0)
        pitch = 0.0 if f in (f0, f1) else 22 * max(0.0, 1 - u / 0.4) ** 2 - 10 * max(0.0, (u - 0.7) / 0.3) ** 1.5
        carry = S.roll_shift(pitch * np.pi / 180) * (max(0.0, 1 - u / 0.3) if pitch > 0 else max(0.0, (u - 0.7) / 0.3))
        lift = 0.0 if f in (f0, f1) else peak * np.sin(np.pi * u) ** 1.2
        c.key(f, ease='linear', **{side: Foot(x, z_of(f) + carry, yaw + (yaw1 - yaw) * u, pitch=pitch, lift=lift)})


def heavy1(m=None):
    """The fencer's lunge: a long gather (the point to the guard, the weight sunk back over the rear leg, the hand drawn to the hip and the free arm high behind him) and a held breath; then the arm
    goes out along the blade, the rear leg drives and the body flies low after the point, the front boot reaching and landing heel first as the point arrives; the lunge is held, the point still on the
    mark, and he comes up out of it, the rear boot brought up and the front one drawn back."""
    m = m or timing(W, 'heavy1')
    c = Clip(m, 'rapier.heavy1')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    home = float(c.root(n)[2])  # where he ends, and where the boots close: the clip's world has moved on with the move's own travel
    foe = (0.0, 1.2, 1.8)  # this blow's mark: reach 1.8
    run = lambda f: float(c.root(f)[2])
    c.key(0, **rest())
    # the guard: the point comes up to the mark, the weight turns and sinks, the free arm up and back
    c.key(3, pelvis=(0.0, 0.89, -0.03), pelvis_rot=(0, 7, 0), torso=(1, 11, 0), look=(0, 1.45, 4), armL=rear(-75, -10, 0.5, (0.6, 0.0, -0.5)))
    key(c, 7, pelvis=(0.0, 0.86, -0.07), pelvis_rot=(0, 12, 0), torso=(1, 20, 0), arm=dict(to=foe, wrist=(-12, -22), d=0.48), armL=rear(-100, 28, 0.46, (0.6, 0.2, -0.6)))
    sweep(c, 0, 7)
    # the gather: he sinks over the rear leg, the hand drawn right back to the hip with the point lifted to the foe's face, the free arm high; held a beat
    key(c, 11, ease='smooth', pelvis=(0.0, 0.76, -0.17), pelvis_rot=(0, 8, 0), torso=(-3, 14, 0), look=(0, 1.4, 4),
        arm=dict(to=(0.0, 1.5, 1.8), wrist=(-10, -36), d=0.34), armL=rear(-112, 44, 0.5, (0.6, 0.2, -0.6)))
    key(c, 14, ease='smooth', pelvis=(0.0, 0.75, -0.18), pelvis_rot=(0, 8, 0), torso=(-3, 14, 0),
        arm=dict(to=(0.0, 1.5, 1.8), wrist=(-10, -36), d=0.34), armL=rear(-112, 44, 0.5, (0.6, 0.2, -0.6)))
    # the drive: the arm leads, the point goes out along the line; the hips follow it and the body goes low behind
    key(c, 17, ease='in', shoulder=0.2, pelvis=(0.0, 0.77, 0.0), pelvis_rot=(4, 16, 0), torso=(14, 24, 0),
        arm=dict(to=foe, wrist=(-12, -20), d=0.45), armL=rear(-115, 30, 0.52, (0.6, 0.2, -0.6)))
    key(c, 20, ease='smooth', shoulder=SH + 0.02, pelvis=(0.0, 0.74, 0.0), pelvis_rot=(6, 18, 0), torso=(24, 28, 0),
        arm=dict(to=foe), armL=rear(-122, 14, 0.55, (0.5, -0.2, -0.3)))
    # the lunge: the front boot lands, the hips sit back over the rear leg, the body low and long behind the blade, the point on the mark and steady
    key(c, h0, ease='linear', shoulder=SH, pelvis=(0.0, 0.72, 0.0), pelvis_rot=(7, 18, 0), torso=(28, 30, 0), arm=dict(to=foe), armL=rear(-124, 8, 0.55, (0.5, -0.2, -0.3)))
    key(c, h1, ease='linear', shoulder=SH, pelvis=(0.0, 0.7, 0.0), pelvis_rot=(7, 18, 0), torso=(32, 32, 0), arm=dict(to=foe), armL=rear(-126, 4, 0.55, (0.5, -0.2, -0.3)))
    key(c, 30, ease='smooth', shoulder=SH, pelvis=(0.0, 0.7, 0.0), pelvis_rot=(7, 18, 0), torso=(32, 32, 0), arm=dict(to=foe), armL=rear(-126, 4, 0.55, (0.5, -0.2, -0.3)))
    # the recovery: the arm folds back along the line, the body rises and unwinds, the free arm comes down
    key(c, 38, ease='smooth', pelvis=(0.0, 0.84, -0.1), pelvis_rot=(2, 14, 0), torso=(8, 18, 0), arm=dict(wrist=(-12, -26), d=0.46), armL=rear(-100, 24, 0.46, (0.6, 0.2, -0.6)))
    c.key(n - 6, ease='smooth', pelvis=(0.0, 0.9, 0.0), pelvis_rot=(0, 4, 0), torso=(2, 6, 0), armL=rear(-60, -40, 0.5, (0.3, -0.1, -0.7)))
    c.key(n, ease='smooth', still=True, **rest())
    sweep(c, 38, n)
    # the boots: the front boot goes out ahead and sets down, the rear one is dragged out behind; in the flight the rear boot trails the hips and the front one reaches; then the rear comes up, the front slides back
    c.steps('footR', (-0.115, 0.0, -7), [(2, 6, -0.08, 0.3, 2, 0.1)])
    c.steps('footL', (0.115, 0.0, 7), [(3, 8, 0.2, -0.2, 45, 0.08)])
    smooth = lambda u: float(np.clip(u, 0, 1) ** 2 * (3 - 2 * np.clip(u, 0, 1)))
    front, rear_ = hips(c, 24) + 0.5, hips(c, 24) - 0.5  # where the boots stand in the lunge, half a metre fore and aft of the hips
    ahead = lambda f: float(np.interp(f, [14, 16, 19, 22, 24], [0.48, 0.3, 0.4, 0.5, 0.5]))  # how far before the hips the front boot is held as it comes
    behind = lambda f: -0.02 + 0.47 * smooth((f - 14) / 4)  # and how far behind them the rear one trails: the body leaves it and it is brought after
    fly(c, 'footR', 14, 24, -0.06, lambda f: hips(c, f) + ahead(f), yaw=2, peak=0.2)
    fly(c, 'footL', 14, 25, 0.2, lambda f: min(hips(c, f) - behind(f), rear_), yaw=45, yaw1=40, peak=0.26)
    steps_on(c, 'footL', (0.2, rear_, 40), [(31, 40, 0.115, home, 7, 0.06)])
    steps_on(c, 'footR', (-0.06, front, 2), [(34, 42, -0.115, home, -7, 0.05)])
    return c


def circle(c, f0, f1, centre, wrist, radius=14.0, theta0=-45.0, turns=1.0, hand=0.3, edge=EDGE, pole=POLE):
    """The point drawn round in a circle, a frame at a time from f0 to f1: its direction goes round `centre` = (az, el) on a circle of `radius` degrees (about a third of a metre across at the point), clockwise
    seen from behind him, starting `theta0` degrees round from his right (up is 90) and going `turns` times round; the hand `wrist` = (az, el, d) from the shoulder follows it a `hand` part of the way, as a
    wrist does that turns a blade: the point moves most, the hand a little. Keyed in the Swing the blade is held in, so it meets the keys on either side of it."""
    for f in range(f0, f1 + 1):
        u = (f - f0) / (f1 - f0)
        th = np.radians(theta0 - 360.0 * turns * (0.5 * u + 0.5 * u * u * (3 - 2 * u)))  # eased a little: round the turn the point slows, and is never still
        dx, dy = radius * np.cos(th), radius * np.sin(th)
        c.key(f, ease='linear', armR=Swing(reach=(wrist[0] - hand * dx, wrist[1] + hand * dy, wrist[2]), blade=(centre[0] - dx, centre[1] + dy), toward=edge, pole=pole))


def parry(m=None):
    """The circle parry: the point brought up to the guard before the window opens, then drawn round in a circle about the foe's blade, the hand barely moving, to wind it up and knock it aside; the
    wrist loosens and the point comes back to the line, and a riposte flicks out as the front boot steps in; then the blade is drawn back and lowered."""
    m = m or timing(W, 'parry')
    c = Clip(m, 'rapier.parry')
    p0, p1, n = m.parry[0], m.parry[1], m.frames
    c.mark(parry0=p0, parry1=p1)
    home = float(c.root(n)[2])  # a parry has no travel: this is where he stands
    c.key(0, **rest())
    # the guard, in time for the window: the hand at his belt on the right, the point up toward the foe's eyes, the weight sunk and turned, the free arm up behind
    c.key(2, pelvis=(0.0, 0.89, -0.03), pelvis_rot=(0, 6, 0), torso=(1, 11, 0), look=(0, 1.55, 4), armL=rear(-75, -10, 0.5, (0.6, 0.0, -0.5)))
    key(c, p0, pelvis=(0.0, 0.87, -0.07), pelvis_rot=(0, 12, 0), torso=(1, 20, 0), look=(0, 1.55, 4), arm=dict(to=(0.0, 1.62, 1.75), wrist=(-8, -30), d=0.5), armL=rear(-100, 28, 0.46, (0.6, 0.2, -0.6)))
    sweep(c, 0, p0)
    # the circle: the shoulders turn with the point, first away to the right as it drops and goes under, then back through to the left as it climbs and comes over; the weight sits back and eases
    # forward again, the free arm lifting and settling with it
    c.key(p0 + 2, ease='smooth', pelvis=(0.0, 0.85, -0.1), pelvis_rot=(0, 14, 0), torso=(0, 28, 0), armL=rear(-104, 34, 0.46, (0.6, 0.2, -0.6)))
    c.key(p0 + 5, ease='smooth', pelvis=(0.0, 0.86, -0.08), pelvis_rot=(0, 12, 0), torso=(1, 16, 0), armL=rear(-98, 24, 0.46, (0.6, 0.2, -0.6)))
    c.key(p1, ease='smooth', pelvis=(0.0, 0.87, -0.07), pelvis_rot=(0, 13, 0), torso=(1, 22, 0), armL=rear(-100, 30, 0.46, (0.6, 0.2, -0.6)))
    guard = c.channels(p0)['armR']
    circle(c, p0, p1, centre=guard['blade'], wrist=guard['reach'])
    # the riposte: the point back to the line, the hand drawn to the ribs, then the arm flicks out as the front boot steps in and the hips follow
    key(c, p1 + 2, ease='smooth', pelvis=(0.0, 0.85, -0.06), pelvis_rot=(0, 12, 0), torso=(1, 20, 0), arm=dict(to=(0.0, 1.5, 1.75), wrist=(-8, -34), d=0.38), armL=rear(-102, 28, 0.46, (0.6, 0.2, -0.6)))
    key(c, p1 + 6, ease='in', shoulder=0.2, pelvis=(0.0, 0.8, 0.0), pelvis_rot=(3, 18, 0), torso=(12, 28, 0), arm=dict(to=(0.0, 1.4, 1.75)), armL=rear(-120, 8, 0.55, (0.5, -0.2, -0.3)))
    key(c, p1 + 8, ease='out', shoulder=0.22, pelvis=(0.0, 0.8, 0.0), pelvis_rot=(3, 18, 0), torso=(13, 29, 0), arm=dict(to=(0.0, 1.4, 1.75)), armL=rear(-122, 6, 0.55, (0.5, -0.2, -0.3)))
    # the recovery: the arm folds back, the body rises, the blade comes down to its carriage
    key(c, p1 + 14, ease='smooth', pelvis=(0.0, 0.87, 0.02), pelvis_rot=(0, 10, 0), torso=(3, 16, 0), arm=dict(wrist=(-10, -28), d=0.46), armL=rear(-100, 24, 0.46, (0.6, 0.2, -0.6)))
    c.key(n - 6, ease='smooth', pelvis=(0.0, 0.9, 0.0), pelvis_rot=(0, 4, 0), torso=(2, 6, 0), armL=rear(-60, -40, 0.5, (0.3, -0.1, -0.7)))
    c.key(n, ease='smooth', still=True, **rest())
    sweep(c, p1 + 14, n)
    # the boots: the front boot comes forward to the guard and steps in with the riposte, the rear one is drawn out behind and dragged after; then both come back level
    c.steps('footR', (-0.115, 0.0, -7), [(1, p0 + 1, -0.09, 0.14, 0, 0.05), (p1 + 2, p1 + 6, -0.07, hips(c, p1 + 6) + 0.45, 2, 0.12), (p1 + 9, n - 8, -0.115, home, -7, 0.05)])
    c.steps('footL', (0.115, 0.0, 7), [(1, p0 + 2, 0.19, -0.12, 40, 0.04), (p1 + 4, p1 + 8, 0.18, hips(c, p1 + 8) - 0.3, 40, 0.05), (p1 + 11, n - 3, 0.115, home, 7, 0.05)])
    return c


def build():
    return [light1(), light2(), heavy1(), parry()]
