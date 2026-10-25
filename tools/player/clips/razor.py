"""The straight razor's four light blows, its lunge, its whirl and its parry: a close, quick, low and vicious hand. The blade is only 27 cm from the wrist, so the ARM carries every blow: the shoulder is
thrown after the target (the hips drop and drive, the chest folds over them, the torso leads) and the razor is a flick at the end of a long reach. He fights crouched inside the other's
reach, on short quick steps and lunges; the cut is one-edged, so the edge faces the way the hand is going (a backhand turns the wrist over).
"""
import numpy as np
import solve as S
import frame as F
from clipkit import Clip, Foot, Swing, Arm, Series, timing
from clips.common import at_rest, stand_feet, tangent

W = 'razor'
BLADE = 0.275  # the weapon's length from the wrist (clipkit.LENGTH)
HANG = dict(reach=(43, -81, 0.575), blade=(100, -84), toward=(0, 0, 1), pole=(-0.25, -0.8, -0.3))  # the carried pose's own arm, as a Swing, so a first and last key can match it


def P(az, r, y):
    """A point `r` metres from the root, `az` degrees to the right of ahead, `y` up: where a cut is to go (the game's hit sphere sits at such a point)."""
    a = np.radians(az)
    return (-np.sin(a) * r, y, np.cos(a) * r)


def shoulder(pelvis, pelvis_rot, torso):
    """The right shoulder in the actor's frame for a body keyed so."""
    B = S.move(pelvis) @ S.rot(S.euler(pelvis_rot))
    T = B @ S.rot(S.euler(torso))
    return (T @ S.move(F.JOINTS['armR'][1]))[:3, 3]


def to_tip(body, tip, blade, toward=None, pole=(-0.3, -0.7, -0.4)):
    """The weapon arm as a Swing that puts the razor's point at `tip` (actor's frame) with the blade pointing `blade` = (az, el), for the body keyed in `body` (pelvis, pelvis_rot, torso):
    the shoulders move with the body, so the wrist is worked out from where the shoulder is. (A reach longer than the arm is left for QA to report.)"""
    sh = shoulder(body['pelvis'], body.get('pelvis_rot', (0, 0, 0)), body.get('torso', (0, 0, 0)))
    wrist = np.asarray(tip, float) - BLADE * S.aimv(*blade) - 0.02 * S.edge_of(S.aimv(*blade), toward)
    v = wrist - sh
    d = float(np.linalg.norm(v))
    return Swing(reach=(float(np.degrees(np.arctan2(-v[0], v[2]))), float(np.degrees(np.arcsin(np.clip(v[1] / d, -1, 1)))), d), blade=blade, toward=toward, pole=pole)


def steps_on(c, side, start, moves, h=0.07):
    """`Clip.steps` for a boot that has already been keyed from frame 0 (one that does something between its steps, such as a swivel): the same lift, swing and heel-first landing, without the key at frame 0."""
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


def curve(*pts):
    """A smooth function of the frame through (frame, value) points (a Catmull-Rom spline, as the clip keys' own default): what a whole-body spin is written as, a number for every frame."""
    sr = Series()
    for t, v in pts:
        sr.add(t, v, 'cr', False)
    return lambda f: float(sr.at(f)[0])


def light1(m=None):
    """A cross-body slash from his right to his left: he sinks and coils to the right with the razor hand cocked out and back, then the hips drive and the chest folds in after the
    left boot's lunge, the shoulder throws the arm round at chest height and the wrist snaps the point through; the blade carries on across and drops to his left hip as he straightens."""
    m = m or timing(W, 'light1')
    c = Clip(m, 'razor.light1')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    look = (0, 1.42, 4)
    c.key(0, **at_rest(armR=Swing(**HANG)), look=look)
    # the coil: the weight drops and turns right, the hand cocks back at the shoulder, the blade out behind it; the off hand comes up to guard
    c.key(3, ease='out', pelvis=(0.01, 0.81, -0.07), pelvis_rot=(3, -14, 0), torso=(14, -34, 0),
          armR=Swing(reach=(102, 8, 0.5), blade=(112, 16), toward=tangent(105), pole=(-0.4, -0.6, -0.5)), armL=Arm(arm=(-55, 0, 30), elbow=-85))
    c.key(5, ease='in', pelvis=(0.0, 0.8, 0.0), pelvis_rot=(4, -8, 0), torso=(15, -22, 0),
          armR=Swing(reach=(82, 5, 0.55), blade=(86, 8), toward=tangent(84), pole=(-0.4, -0.6, -0.4)), armL=Arm(arm=(-35, 0, 30), elbow=-70))
    # the cut: four frames, the point at chest height through the arc, the shoulder thrown round after the lunging boot
    cut = [(h0, P(55, 0.98, 1.22), (55, 4), 55, dict(pelvis=(0.0, 0.78, 0.08), pelvis_rot=(4, 0, 0), torso=(16, -6, 0))),
           (h0 + 1, P(18, 1.0, 1.2), (18, 2), 18, dict(pelvis=(0.0, 0.78, 0.12), pelvis_rot=(4, 12, 0), torso=(16, 12, 0))),
           (h0 + 2, P(-18, 1.0, 1.18), (-18, 0), -18, dict(pelvis=(0.0, 0.78, 0.14), pelvis_rot=(4, 22, 0), torso=(16, 30, 0))),
           (h1, P(-55, 0.98, 1.12), (-55, -2), -55, dict(pelvis=(0.0, 0.78, 0.15), pelvis_rot=(4, 30, 0), torso=(16, 44, 0)))]
    for t, tip, blade, az, body in cut:
        c.key(t, ease='linear', **body, armR=to_tip(body, tip, blade, toward=tangent(az)), armL=Arm(arm=(20 + 10 * (t - h0), 0, 35), elbow=-40))
    # the carry: the point runs on across and falls to his left as he straightens out of the crouch
    c.key(h1 + 3, ease='out', pelvis=(0.0, 0.8, 0.12), pelvis_rot=(4, 30, 0), torso=(14, 48, 0),
          armR=Swing(reach=(-84, -10, 0.5), blade=(-96, -30), toward=tangent(-90), pole=(0.1, -0.7, -0.3)))
    c.key(h1 + 6, ease='smooth', pelvis=(0.0, 0.85, 0.06), pelvis_rot=(3, 16, 0), torso=(8, 26, 0),
          armR=Swing(reach=(-40, -50, 0.5), blade=(-30, -64), toward=(1, 0, 0.3), pole=(-0.2, -0.8, -0.3)), armL=Arm(arm=(0, 0, 25), elbow=-30))
    c.key(n - 3, ease='smooth', pelvis=(0.0, 0.89, 0.02), pelvis_rot=(1, 6, 0), torso=(2, 10, 0), armR=Swing(reach=(10, -70, 0.56), blade=(60, -80), toward=(0.4, 0, 1), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-3, 0, 12), elbow=-15))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG)))
    # the boots: the left lunges in under the cut, the right is dragged up behind it, and the two close level
    zn = float(c.root(n)[2])
    c.steps('footL', (0.115, 0.0, 7), [(2, h0 + 1, 0.15, float(c.root(h0 + 1)[2]) + 0.25, 12, 0.08), (h1 + 4, n - 3, 0.115, zn, 7, 0.04)])
    c.steps('footR', (-0.115, 0.0, -7), [(h0 - 1, h1 + 3, -0.14, float(c.root(h1 + 3)[2]) - 0.1, -6, 0.07), (h1 + 6, n - 2, -0.115, zn, -7, 0.04)])
    return c


def light2(m=None):
    """The backhand back: from the end of the slash he whips the wrist over and the hand comes across his chest to his left shoulder, the blade out behind it, the body wound hard left over the rear boot; then
    the right boot lunges, the hips unwind and the arm flings out to the right with the edge turned to lead, the point flicking through at chest height; his weight is thrown forward after it."""
    m = m or timing(W, 'light2')
    c = Clip(m, 'razor.light2')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    look = (0, 1.42, 4)
    c.key(0, **at_rest(armR=Swing(**HANG)), look=look)
    # the coil: the hand crosses his chest to the far shoulder, the blade out behind it, the weight sinking on the left leg; the off hand throws out the other way
    c.key(3, ease='out', pelvis=(-0.01, 0.81, -0.07), pelvis_rot=(3, 16, 0), torso=(15, 38, 0),
          armR=Swing(reach=(-60, 2, 0.47), blade=(-112, 20), toward=tangent(-105, -1), pole=(-0.1, -0.5, -0.6)), armL=Arm(arm=(-10, 0, 62), elbow=-35))
    c.key(5, ease='in', pelvis=(-0.01, 0.8, -0.02), pelvis_rot=(4, 24, 0), torso=(16, 46, 0),
          armR=Swing(reach=(-70, 6, 0.5), blade=(-84, 8), toward=tangent(-84, -1), pole=(-0.2, -0.6, -0.5)), armL=Arm(arm=(-5, 0, 66), elbow=-30))
    # the cut: the right boot lunges, the hips unwind first and the arm is flung out after them, the wrist turned over so the edge goes first
    cut = [(h0, P(-55, 0.98, 1.2), (-55, 3), -55, dict(pelvis=(-0.01, 0.78, 0.06), pelvis_rot=(4, 26, 0), torso=(17, 48, 0))),
           (h0 + 1, P(-18, 1.0, 1.2), (-18, 2), -18, dict(pelvis=(-0.01, 0.77, 0.11), pelvis_rot=(4, 12, 0), torso=(18, 24, 0))),
           (h0 + 2, P(18, 1.0, 1.2), (18, 0), 18, dict(pelvis=(-0.01, 0.77, 0.14), pelvis_rot=(4, -4, 0), torso=(18, 0, 0))),
           (h1, P(55, 0.98, 1.16), (55, -3), 55, dict(pelvis=(-0.01, 0.77, 0.16), pelvis_rot=(4, -18, 0), torso=(18, -26, 0)))]
    for t, tip, blade, az, body in cut:
        c.key(t, ease='linear', **body, armR=to_tip(body, tip, blade, toward=tangent(az, -1)), armL=Arm(arm=(-5 - 12 * (t - h0), 0, 66 - 6 * (t - h0)), elbow=-30 + 4 * (t - h0)))
    # the carry: the point runs on out to his right and falls, the body comes up out of the lunge
    c.key(h1 + 3, ease='out', pelvis=(0.0, 0.79, 0.14), pelvis_rot=(4, -24, 0), torso=(15, -40, 0),
          armR=Swing(reach=(88, -8, 0.5), blade=(98, -26), toward=tangent(94, -1), pole=(-0.5, -0.5, -0.5)), armL=Arm(arm=(-40, 0, 55), elbow=-35))
    c.key(h1 + 6, ease='smooth', pelvis=(0.0, 0.85, 0.06), pelvis_rot=(3, -12, 0), torso=(8, -20, 0),
          armR=Swing(reach=(60, -50, 0.52), blade=(70, -64), toward=(-1, 0, 0.3), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-10, 0, 25), elbow=-30))
    c.key(n - 3, ease='smooth', pelvis=(0.0, 0.89, 0.02), pelvis_rot=(1, -5, 0), torso=(2, -6, 0), armR=Swing(reach=(52, -72, 0.56), blade=(90, -82), toward=(0, 0, 1), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-6, 0, 12), elbow=-18))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG)))
    # the boots: the right lunges in under the cut, the left is dragged up behind it, and the two close level
    zn = float(c.root(n)[2])
    c.steps('footR', (-0.115, 0.0, -7), [(2, h0 + 1, -0.15, float(c.root(h0 + 1)[2]) + 0.25, -12, 0.08), (h1 + 4, n - 3, -0.115, zn, -7, 0.04)])
    c.steps('footL', (0.115, 0.0, 7), [(h0 - 1, h1 + 3, 0.14, float(c.root(h1 + 3)[2]) - 0.1, 6, 0.07), (h1 + 6, n - 2, 0.115, zn, 7, 0.04)])
    return c


def rising(az, rise=0.55):
    """`toward=` for the edge of a cut that climbs as it crosses `az` from his right to his left: the level tangent with `rise` of it going up."""
    x, _, z = tangent(az)
    return (0.85 * x, rise, 0.85 * z)


def light3(m=None):
    """The rising cut, from the other boot: he ducks right down inside the reach with the hand low at his right hip and the point trailing, the right boot driving in, and the whole body stands up through the
    cut: the edge goes from low on his right up across to high on his left, the wrist turning it over at the top, as a man might open a throat."""
    m = m or timing(W, 'light3')
    c = Clip(m, 'razor.light3')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    look = (0, 1.4, 4)
    c.key(0, **at_rest(armR=Swing(**HANG)), look=look)
    # the duck: right down on the legs, folded over, the hand dropped back behind his right hip with the point down and trailing; the off hand comes up to ward
    c.key(3, ease='out', pelvis=(0.02, 0.74, -0.08), pelvis_rot=(6, -12, 0), torso=(26, -26, 0),
          armR=Swing(reach=(75, -50, 0.5), blade=(100, -52), toward=rising(75, 0.7), pole=(-0.5, -0.8, -0.2)), armL=Arm(arm=(-60, 0, 35), elbow=-80))
    c.key(5, ease='in', pelvis=(0.02, 0.72, 0.0), pelvis_rot=(6, -8, 0), torso=(26, -20, 0),
          armR=Swing(reach=(66, -40, 0.54), blade=(78, -36), toward=rising(66, 0.7), pole=(-0.5, -0.8, -0.2)), armL=Arm(arm=(-50, 0, 40), elbow=-70))
    # the cut: he rises through it, the point climbing from his hip to above his shoulder
    cut = [(h0, P(50, 0.98, 0.92), (50, -12), 50, dict(pelvis=(0.0, 0.73, 0.07), pelvis_rot=(6, -2, 0), torso=(26, -8, 0))),
           (h0 + 1, P(17, 1.0, 1.12), (17, 6), 17, dict(pelvis=(0.0, 0.76, 0.11), pelvis_rot=(5, 8, 0), torso=(22, 10, 0))),
           (h0 + 2, P(-17, 1.0, 1.3), (-17, 22), -17, dict(pelvis=(0.0, 0.79, 0.13), pelvis_rot=(4, 18, 0), torso=(16, 26, 0))),
           (h1, P(-50, 0.95, 1.46), (-50, 38), -50, dict(pelvis=(0.0, 0.82, 0.13), pelvis_rot=(3, 26, 0), torso=(10, 40, 0)))]
    for t, tip, blade, az, body in cut:
        c.key(t, ease='linear', **body, armR=to_tip(body, tip, blade, toward=rising(az, 0.6 - 0.2 * (t - h0))), armL=Arm(arm=(-40 + 18 * (t - h0), 0, 40 + 4 * (t - h0)), elbow=-60 + 8 * (t - h0)))
    # the carry: the hand climbs on to above his left shoulder and the wrist breaks over; he is up on his toes, then the weight comes back down
    c.key(h1 + 3, ease='out', pelvis=(0.0, 0.86, 0.1), pelvis_rot=(2, 28, 0), torso=(4, 44, 0),
          armR=Swing(reach=(-70, 38, 0.5), blade=(-78, 50), toward=(0.75, 0.3, -0.4), pole=(-0.1, -0.5, -0.6)), armL=Arm(arm=(15, 0, 55), elbow=-40))
    c.key(h1 + 7, ease='smooth', pelvis=(0.0, 0.87, 0.05), pelvis_rot=(2, 16, 0), torso=(3, 26, 0),
          armR=Swing(reach=(-40, -10, 0.5), blade=(-30, -40), toward=(1, 0, 0.3), pole=(-0.2, -0.8, -0.3)), armL=Arm(arm=(0, 0, 25), elbow=-30))
    c.key(n - 3, ease='smooth', pelvis=(0.0, 0.89, 0.02), pelvis_rot=(1, 6, 0), torso=(2, 10, 0), armR=Swing(reach=(10, -70, 0.56), blade=(60, -80), toward=(0.4, 0, 1), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-3, 0, 12), elbow=-15))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG)))
    # the boots: the right drives in under the cut (a longer step than the backhand's), the left follows, then they close
    zn = float(c.root(n)[2])
    c.steps('footR', (-0.115, 0.0, -7), [(2, h0 + 1, -0.17, float(c.root(h0 + 1)[2]) + 0.32, -10, 0.09), (h1 + 5, n - 3, -0.115, zn, -7, 0.04)])
    c.steps('footL', (0.115, 0.0, 7), [(h0 - 2, h1 + 2, 0.15, float(c.root(h1 + 2)[2]) - 0.08, 10, 0.07), (h1 + 6, n - 2, 0.115, zn, 7, 0.04)])
    return c


def light4(m=None):
    """The stab: he draws back low over the rear boot with the razor hand at his right hip and the point already on the mark, the left hand reaching out in front of it to mask it; a quick hop up on the right boot, the left
    lunging out ahead, and the hips and the right shoulder come through behind the point, which jabs out at chest height and stays; then the elbow folds, the hand draws back to his ribs with the point dropping, and he comes up out of it."""
    m = m or timing(W, 'light4')
    c = Clip(m, 'razor.light4')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    look = (0, 1.4, 4)
    c.key(0, **at_rest(armR=Swing(**HANG)), look=look)
    # the draw: the weight sinks back and the body turns away to the right, the hand to the ribs with the blade level on the mark and its edge up; the left hand comes forward as a screen
    c.key(4, ease='out', pelvis=(0.0, 0.8, -0.12), pelvis_rot=(5, -16, 0), torso=(18, -26, 0),
          armR=Swing(reach=(58, -42, 0.4), blade=(8, 0), toward=(0, 1, 0), pole=(-0.6, -0.7, -0.4)), armL=Arm(arm=(-85, 0, 22), elbow=-40))
    c.key(8, ease='in', pelvis=(0.0, 0.76, 0.04), pelvis_rot=(6, -2, 0), torso=(22, 4, 0),
          armR=Swing(reach=(48, -38, 0.42), blade=(6, 0), toward=(0, 1, 0), pole=(-0.6, -0.7, -0.4)), armL=Arm(arm=(-80, 0, 20), elbow=-45))
    # the jab: the hips are thrown in, the right shoulder comes round behind the hand and the arm shoots out until the point is in the mark; it holds through the window as he settles into the lunge
    shot = [(h0, P(0, 1.2, 1.2), 0.74, 0.19, (7, 14, 0), (27, 24, 0), Arm(arm=(-30, 0, 40), elbow=-60)),
            (h0 + 1, P(0, 1.22, 1.25), 0.73, 0.21, (7, 17, 0), (28, 28, 0), Arm(arm=(5, 0, 42), elbow=-50)),
            (h0 + 2, P(0, 1.24, 1.27), 0.73, 0.22, (7, 19, 0), (28, 31, 0), Arm(arm=(25, 0, 44), elbow=-40)),
            (h1, P(0, 1.24, 1.28), 0.73, 0.22, (7, 20, 0), (28, 32, 0), Arm(arm=(30, 0, 45), elbow=-38))]
    for t, tip, py, pz, prot, tor, left in shot:
        body = dict(pelvis=(0.0, py, pz), pelvis_rot=prot, torso=tor)
        c.key(t, ease='linear', **body, armR=to_tip(body, tip, (0, 0), toward=(0, 1, 0), pole=(-0.5, -0.7, -0.3)), armL=left)
    c.key(h1 + 3, ease='smooth', pelvis=(0.0, 0.74, 0.21), pelvis_rot=(7, 18, 0), torso=(27, 30, 0),
          armR=Swing(reach=(-4, -4, 0.58), blade=(-4, -2), toward=(0, 1, 0), pole=(-0.5, -0.7, -0.3)), armL=Arm(arm=(30, 0, 45), elbow=-38))
    # the withdrawal: the elbow folds and the hand draws back to his ribs, the point dropping, the left hand comes in to guard; he rises and unwinds
    c.key(h1 + 7, ease='smooth', pelvis=(0.0, 0.78, 0.14), pelvis_rot=(6, 10, 0), torso=(18, 18, 0),
          armR=Swing(reach=(14, -26, 0.4), blade=(8, -14), toward=(0, 1, 0.3), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-30, 0, 35), elbow=-60))
    c.key(h1 + 12, ease='smooth', pelvis=(0.0, 0.85, 0.08), pelvis_rot=(3, 6, 0), torso=(8, 8, 0),
          armR=Swing(reach=(30, -56, 0.5), blade=(60, -52), toward=(0, 0.5, 1), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-10, 0, 20), elbow=-25))
    c.key(n - 4, ease='smooth', pelvis=(0.0, 0.9, 0.02), pelvis_rot=(1, 2, 0), torso=(2, 3, 0), armR=Swing(reach=(40, -76, 0.57), blade=(90, -80), toward=(0, 0, 1), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-5, 0, 10), elbow=-14))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG)))
    # the boots: a quick hop up on the right, the left reaches out for the lunge; once the point has landed the right comes up and the left draws back to it
    zn = float(c.root(n)[2])
    c.steps('footR', (-0.115, 0.0, -7), [(2, 8, -0.13, float(c.root(8)[2]) + 0.05, -8, 0.07), (h1 + 2, h1 + 9, -0.115, zn, -7, 0.05)])
    c.steps('footL', (0.115, 0.0, 7), [(6, 11, 0.14, float(c.root(11)[2]) + 0.33, 12, 0.09), (h1 + 6, n - 3, 0.115, zn, 7, 0.05)])
    return c


def heavy1(m=None):
    """The dive: he coils right down onto the rear leg, the razor hand cocked back at his hip with the point on the mark and the free hand reaching ahead; then both boots leave the ground and he goes in low and flat
    across two metres, the right boot reaching out ahead of him, the left trailing, the free arm flung back; the arm shoots out and lands the point as the right boot lands, deep in the knee, and he holds the lunge with the
    point out a moment. Then the arm folds, the left boot steps up past the right and he rises, and the right boot steps back to close."""
    m = m or timing(W, 'heavy1')
    c = Clip(m, 'razor.heavy1')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    look = (0, 1.3, 4)
    c.key(0, **at_rest(armR=Swing(**HANG)), look=look)
    # the coil: sunk right down over the rear leg, folded forward, wound to the right; held a beat
    c.key(3, ease='out', pelvis=(0.0, 0.74, -0.14), pelvis_rot=(6, -12, 0), torso=(24, -22, 0), head=(-4, 0, 0),
          armR=Swing(reach=(60, -42, 0.42), blade=(6, -4), toward=(0, 1, 0), pole=(-0.6, -0.7, -0.4)), armL=Arm(arm=(-85, 0, 22), elbow=-40))
    c.key(4, ease='linear', pelvis=(0.0, 0.73, -0.15), pelvis_rot=(6, -13, 0), torso=(25, -23, 0), head=(-4, 0, 0),
          armR=Swing(reach=(60, -42, 0.42), blade=(6, -4), toward=(0, 1, 0), pole=(-0.6, -0.7, -0.4)), armL=Arm(arm=(-85, 0, 22), elbow=-40))
    # the launch and the flight: the hips go first, the chest follows them down and out flat, the hand still back, the free arm swinging round behind
    c.key(6, ease='in', pelvis=(0.0, 0.78, 0.0), pelvis_rot=(6, -2, 0), torso=(32, -6, 0), head=(-10, 0, 0),
          armR=Swing(reach=(55, -36, 0.44), blade=(6, -2), toward=(0, 1, 0), pole=(-0.6, -0.7, -0.4)), armL=Arm(arm=(-55, 0, 32), elbow=-32))
    c.key(9, ease='smooth', pelvis=(0.0, 0.8, 0.08), pelvis_rot=(6, 8, 0), torso=(38, 12, 0), head=(-10, 0, 0),
          armR=Swing(reach=(30, -24, 0.5), blade=(2, 0), toward=(0, 1, 0), pole=(-0.6, -0.7, -0.3)), armL=Arm(arm=(30, 0, 50), elbow=-25))
    # the point: the arm is fully out as the lead boot lands and stays at the mark while he drives on over it
    thrust = [(h0, P(0, 1.2, 1.26), 0.7, 0.12, (6, 12, 0), (40, 22, 0)), (h0 + 2, P(0, 1.2, 1.3), 0.65, 0.14, (6, 14, 0), (41, 25, 0)),
              (h1, P(0, 1.2, 1.3), 0.64, 0.14, (6, 14, 0), (42, 26, 0))]
    for t, tip, py, pz, prot, tor in thrust:
        body = dict(pelvis=(0.0, py, pz), pelvis_rot=prot, torso=tor)
        c.key(t, ease='linear', **body, head=(-13, 0, 0), armR=to_tip(body, tip, (0, 0), toward=(0, 1, 0), pole=(-0.5, -0.7, -0.3)), armL=Arm(arm=(36, 0, 52), elbow=-22))
    # the withdrawal: the arm sags, then the elbow folds and the hand draws back to the ribs with the point dropping; he comes up out of the lunge
    c.key(h1 + 3, ease='smooth', pelvis=(0.0, 0.66, 0.1), pelvis_rot=(6, 12, 0), torso=(38, 20, 0), head=(-14, 0, 0),
          armR=Swing(reach=(0, -10, 0.55), blade=(0, -8), toward=(0, 1, 0.1), pole=(-0.5, -0.7, -0.3)), armL=Arm(arm=(20, 0, 45), elbow=-30))
    c.key(h1 + 8, ease='smooth', pelvis=(0.0, 0.74, 0.08), pelvis_rot=(5, 8, 0), torso=(28, 10, 0), head=(-6, 0, 0),
          armR=Swing(reach=(40, -40, 0.42), blade=(8, -22), toward=(0, 1, 0.3), pole=(-0.5, -0.8, -0.3)), armL=Arm(arm=(-30, 0, 35), elbow=-55))
    c.key(h1 + 14, ease='smooth', pelvis=(0.0, 0.84, 0.05), pelvis_rot=(3, 4, 0), torso=(14, 6, 0),
          armR=Swing(reach=(40, -62, 0.52), blade=(70, -66), toward=(0, 0.5, 1), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-10, 0, 18), elbow=-22))
    c.key(n - 4, ease='smooth', pelvis=(0.0, 0.9, 0.02), pelvis_rot=(1, 2, 0), torso=(3, 3, 0), armR=Swing(reach=(42, -76, 0.57), blade=(94, -80), toward=(0, 0, 1), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-5, 0, 10), elbow=-14))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG)))
    # the boots: both leave the ground, the right reaching out ahead and the left trailing, and land on the point's frames; then the left steps up past the right and the right steps back to close
    zn = float(c.root(n)[2])
    c.steps('footR', (-0.115, 0.0, -7), [(4.5, 13, -0.15, zn + 0.23, -8, 0.3), (27, 35, -0.115, zn, -7, 0.06)])
    c.steps('footL', (0.115, 0.0, 7), [(4.5, 14.5, 0.13, zn - 0.45, 14, 0.24), (h1 + 3, h1 + 11, 0.115, zn + 0.02, 7, 0.07)])
    return c


def heavy2(m=None):
    """The whirl: he sinks and winds hard to his left, the razor hand cocked far back behind that side, a beat held; then the hips go first, the shoulders after and the arm last, and he spins on the ball of his left
    boot, the point flung out flat at arm's length and swept right round in front of him from behind his left to behind his right with the edge leading, the free arm out the other way; the turn takes him on past
    the cut and right round, the right boot swinging free, until it lands to stop him facing front again."""
    m = m or timing(W, 'heavy2')
    c = Clip(m, 'razor.heavy2')
    h0, h1, n = m.hit0, m.hit1, m.frames
    c.mark(hit0=h0, hit1=h1)
    zn = float(c.root(n)[2])
    # the body, a number for each frame: the pelvis turns first and furthest, the torso is whipped after it and the arm last; yaw is in degrees, positive to his left, and runs on past a half turn
    yawP = curve((0, 0), (4, 22), (8, 50), (11, 64), (12, 66), (13, 65), (14, 62), (15, 38), (16, 10), (17, -18), (18, -48), (19, -78), (22, -170), (26, -285), (30, -345), (33, -360), (n, -360))
    yawT = curve((0, 0), (4, 10), (8, 28), (11, 42), (12, 44), (13, 44), (14, 44), (15, 28), (16, 13), (17, 0), (18, -12), (19, -24), (22, -26), (26, -16), (30, -6), (33, 0), (n, 0))
    pitchT = curve((0, 1), (4, 10), (8, 12), (12, 12), (14, 16), (19, 16), (24, 12), (30, 8), (36, 3), (n, 1))
    py = curve((0, 0.912), (4, 0.84), (8, 0.79), (12, 0.78), (14, 0.77), (19, 0.78), (24, 0.8), (30, 0.78), (34, 0.82), (38, 0.9), (n, 0.912))
    pz = curve((0, 0), (8, -0.04), (12, -0.06), (14, 0.02), (17, 0.08), (20, 0.08), (26, 0.04), (32, 0.02), (n, 0))
    head = curve((0, 0), (8, -22), (12, -42), (14, -34), (16, -12), (19, -30), (22, -44), (26, -30), (30, -10), (34, 0), (n, 0))
    # the arm: the point's azimuth about him, and how far out and how high it is, from the first frame of the cut on
    alpha = curve((13, -128), (14, -120), (15, -72), (16, -24), (17, 24), (18, 72), (19, 120), (20, 152), (21, 184), (23, 240), (25, 290), (27, 330), (29, 358), (31, 372))
    rad = curve((13, 0.75), (14, 0.8), (15, 0.86), (16, 0.98), (17, 1.05), (18, 1.05), (19, 1.0), (21, 0.88), (24, 0.78), (27, 0.72), (31, 0.62))
    hgt = curve((13, 1.25), (14, 1.12), (15, 1.08), (19, 1.08), (22, 1.0), (26, 0.95), (31, 0.95))
    lx = curve((0, -4), (4, -35), (8, -40), (12, -35), (14, -10), (16, 0), (19, 0), (24, -5), (30, -5), (36, -4), (n, -4))
    lz = curve((0, 7), (4, 25), (8, 30), (12, 40), (14, 70), (16, 85), (19, 85), (24, 60), (30, 30), (36, 12), (n, 7))
    le = curve((0, -12), (4, -75), (8, -80), (12, -60), (14, -20), (16, -8), (19, -8), (24, -20), (30, -25), (36, -14), (n, -12))
    # the weapon hand before the cut: down across his belly and back to behind his left side, cocked (the same channels as the cut's, so it runs into it)
    pre = {0: Swing(**HANG),
           4: Swing(reach=(-42, -48, 0.5), blade=(-30, -40), toward=tangent(-30, -1), pole=(-0.2, -0.8, -0.4)),
           8: Swing(reach=(-100, -6, 0.5), blade=(-120, 4), toward=tangent(-120, -1), pole=(-0.1, -0.5, -0.6)),
           11: Swing(reach=(-138, 8, 0.48), blade=(-152, 16), toward=tangent(-150, -1), pole=(0.0, -0.5, -0.6)),
           12: Swing(reach=(-140, 10, 0.5), blade=(-154, 18), toward=tangent(-152, -1), pole=(0.0, -0.5, -0.6))}
    post = {34: Swing(reach=(390, -35, 0.52), blade=(390, -40), toward=(-1, 0, 0.5), pole=(-0.25, -0.8, -0.3)),
            37: Swing(reach=(396, -62, 0.56), blade=(430, -72), toward=(-0.4, 0, 1), pole=(-0.25, -0.8, -0.3)),
            n - 2: Swing(reach=(400, -76, 0.57), blade=(456, -82), toward=(0, 0, 1), pole=(-0.25, -0.8, -0.3))}
    prev_az = None
    for f in range(n + 1):
        a = alpha(min(max(f, 13), 31))
        body = dict(pelvis=(0.0, py(f), pz(f)), pelvis_rot=(6, yawP(f), 0), torso=(pitchT(f), yawT(f), 0))
        ch = dict(body, head=(0, head(f), 0), armL=Arm(arm=(lx(f), 0, lz(f)), elbow=le(f)))
        if f in pre:
            ch['armR'] = pre[f]
        elif 13 <= f <= 31:
            yaw = np.radians(yawP(f) + yawT(f))  # the elbow bends to behind and below the shoulder whichever way he faces
            sw = to_tip(body, P(a, rad(f), hgt(f)), (a - 6, -2), toward=tangent(a, -1), pole=tuple(float(v) for v in S.ry(yaw) @ np.array([-0.3, -0.5, -0.5])))
            az, el, d = sw['reach']
            if prev_az is not None:
                az += 360 * round((prev_az - az) / 360)
            prev_az = az
            sw['reach'] = (az, el, d)
            ch['armR'] = sw
        elif f in post:
            ch['armR'] = post[f]
        if f == n:
            ch = at_rest(armR=Swing(**HANG))
        if f in pre or 13 <= f <= 31 or f in post or f in (0, n):
            c.key(f, ease='linear' if f not in (0, n) else 'smooth', **ch, still=(f == n))
        else:  # between: the body only
            c.key(f, ease='linear', **ch)
    # the boots: the right is picked up as the hips go round and swings free, out behind him on the turn, to land as he comes round to front; the left steps in under the cut and turns on its ball
    zp = float(c.root(14)[2])
    c.steps('footL', (0.115, 0.0, 7), [(8, 13, 0.11, zp, yawP(13) + 7, 0.07)])
    for f in range(14, 33):  # the pivot: it stays at its place, lifted a hair, and turns with the hips
        c.key(f, ease='linear', footL=Foot(0.11, zp, yaw=yawP(f) + 7, lift=0.012))
    steps_on(c, 'footL', (0.11, zp, yawP(32) + 7), [(33, 39, 0.115, zn, -353, 0.04)])
    c.key(0, footR=Foot(-0.115, 0.0, yaw=-7))
    c.key(10, ease='linear', footR=Foot(-0.115, 0.0, yaw=-7))
    for f in range(11, 31):
        w = min(1.0, (f - 10) / 4.0)  # off the ground, out of where it stood and round to behind the pelvis ...
        w = w * w * (3 - 2 * w)
        u = min(1.0, max(0.0, (f - 22) / 8.0))  # ... then in to where it lands
        u = u * u * (3 - 2 * u)
        r = np.radians(yawP(f))
        off = np.array([[np.cos(r), np.sin(r)], [-np.sin(r), np.cos(r)]]) @ np.array([-0.2, -0.12])
        orbit = np.array([float(c.root(f)[0]) + off[0], float(c.root(f)[2]) + pz(f) + off[1]])
        x, z = (np.array([-0.115, 0.0]) * (1 - w) + orbit * w) * (1 - u) + np.array([-0.115, zn]) * u
        c.key(f, ease='linear', footR=Foot(x, z, yaw=yawP(f) - 7, lift=0.26 * w * (1 - u)))
    c.key(31, ease='linear', footR=Foot(-0.115, zn, yaw=-367))
    c.key(n, ease='linear', footR=Foot(-0.115, zn, yaw=-367))
    return c


def parry(m=None):
    """The slip and the catch: the weight goes back over the right boot as the left slides away and the head slips off the line, the razor hand comes flicking across his chest with the blade up and its flat toward the
    blow, the free hand up and open beside it to take the wrist as it goes by; held close through the window; then the hands let go, drop to his ribs, and he settles back to his feet."""
    m = m or timing(W, 'parry')
    c = Clip(m, 'razor.parry')
    (p0, p1), n = m.parry, m.frames
    c.mark(parry0=p0, parry1=p1)
    look = (0, 1.5, 4)
    c.key(0, **at_rest(armR=Swing(**HANG)), look=look)
    # the hand turns over through his left (the blade swinging from down, out level to the left and up, the edge staying forward), a frame at a time, so the wrist never has to flip
    c.key(1, ease='linear', armR=Swing(reach=(8, -48, 0.5), blade=(-80, -35), toward=(0, 0, 1), pole=(-0.25, -0.8, -0.4)))
    c.key(2, ease='linear', armR=Swing(reach=(-28, -20, 0.47), blade=(-60, 15), toward=(0, 0, 1), pole=(-0.2, -0.7, -0.5)))
    # the catch: snapped across in three frames, in place by the time the window opens: hips back and down, the torso turned a little away, the hand at his left shoulder
    c.key(p0, ease='linear', pelvis=(-0.05, 0.86, -0.09), pelvis_rot=(-2, 10, 0), torso=(-3, 20, 0),
          armR=Swing(reach=(-60, -12, 0.46), blade=(-24, 58), toward=(0, 0, 1), pole=(-0.2, -0.7, -0.5)), armL=Arm(arm=(-55, 0, 18), elbow=-95))
    c.key(p0 + 4, ease='smooth', pelvis=(-0.05, 0.85, -0.07), pelvis_rot=(-1, 12, 0), torso=(-1, 22, 0),
          armR=Swing(reach=(-56, -8, 0.5), blade=(-14, 56), toward=(0, 0, 1), pole=(-0.2, -0.7, -0.5)), armL=Arm(arm=(-60, 0, 14), elbow=-92))
    c.key(p1, ease='smooth', pelvis=(-0.05, 0.85, -0.08), pelvis_rot=(-1, 12, 0), torso=(-1, 22, 0),
          armR=Swing(reach=(-57, -9, 0.49), blade=(-14, 57), toward=(0, 0, 1), pole=(-0.2, -0.7, -0.5)), armL=Arm(arm=(-60, 0, 14), elbow=-92))
    # letting go: the hands drop, the razor comes back to his ribs and then hangs
    c.key(p1 + 6, ease='smooth', pelvis=(-0.02, 0.87, -0.04), pelvis_rot=(0, 5, 0), torso=(2, 10, 0),
          armR=Swing(reach=(-8, -32, 0.42), blade=(-4, 20), toward=(0, -0.7, 1), pole=(-0.3, -0.8, -0.3)), armL=Arm(arm=(-35, 0, 22), elbow=-60))
    c.key(p1 + 13, ease='smooth', pelvis=(0.0, 0.9, 0.0), pelvis_rot=(0, 1, 0), torso=(2, 3, 0),
          armR=Swing(reach=(30, -62, 0.52), blade=(60, -58), toward=(0, -0.2, 1), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-10, 0, 12), elbow=-20))
    c.key(n - 4, ease='smooth', pelvis=(0.0, 0.91, 0.0), pelvis_rot=(0, 0, 0), torso=(1, 0, 0), armR=Swing(reach=(40, -76, 0.57), blade=(94, -80), toward=(0, 0, 1), pole=(-0.25, -0.8, -0.3)), armL=Arm(arm=(-5, 0, 8), elbow=-14))
    c.key(n, ease='smooth', still=True, **at_rest(armR=Swing(**HANG)))
    # the boots: the left slides away behind and out, the right takes the weight; once it is over the left comes back level
    c.steps('footL', (0.115, 0.0, 7), [(1, p0 + 1, 0.15, -0.14, 14, 0.04), (p1 + 3, p1 + 15, 0.115, 0.0, 7, 0.05)])
    c.key(0, footR=Foot(-0.115, 0.0, yaw=-7))
    return c


def build():
    return [light1(), light2(), light3(), light4(), heavy1(), heavy2(), parry()]
