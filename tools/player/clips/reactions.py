"""What happens TO him: struck (`stagger`), his guard smashed (`guardBreak`), his own blow turned aside (`parried`) and the fall (`death`). The same whichever weapon is in the right hand, so
they are keyed and checked for the longest, the rapier (1.13 m from the wrist): the point never goes near the floor or his legs.

They are made to be read at once, for what they are. A blow knocks him back and he rocks with it (the chest and head go first, the hips after, the arm last); the guard breaking is worse
(both arms thrown wide, the chest open, a heavy step back and the knees going); the parry is the longest and the most helpless of the three (his own weapon thrown away from him, the body
carried round by it, then a held beat on a bent leg with nothing in front of him: the beat the player strikes in); and the death is a fall with nothing in it that a person would not do.
Every one but the death begins and ends in the carried pose (`rest`), so the game's crossfade has nothing to hide.

The death needs two things the toolkit does not have, both made here: boots that follow hips which are going down to the floor (`bake_legs`: the boots are placed on a probe clip with `Foot`, the toolkit's
own IK solves them, and the angles it finds are keyed as `Leg`s), and a lantern that lies on its side when he does instead of hanging through the boards (`Fallen`).
"""
import numpy as np
import solve as S
import frame as F
import lantern
from clipkit import Clip, Foot, Swing, Arm, Leg, timing
from clips.common import at_rest

W = 'rapier'
# The carried pose for the first and last key of a clip, as the rapier's clips have it (tests/playerClips.test.ts allows 37 degrees of any joint from the idle's): the sword hand a little raised in
# front of his belt with the point low and clear of the floor, written as a Swing so no channel of the arm is half Arm and half Swing.
REST_R = dict(reach=(7.88, -43.28, 0.5516), blade=(12.23, -60.44), toward=(0.0, 0.485, 0.875), pole=(-0.031, -0.722, -0.691))
OUT = (0.0, 1.0, 0.0)  # the edge of a weapon thrown wide: up
DEG = np.pi / 180


def rest(**over):
    """The carried pose: `at_rest` with the sword arm as a Swing. The head is not made to look at anything, so a reaction can throw it where it likes."""
    return at_rest(**{**dict(armR=Swing(**REST_R)), **over})


def sword(az, el, d, baz, bel, pole=(-0.5, -0.5, -0.6), toward=OUT):
    """The sword arm for a reaction: the wrist `d` from the shoulder at that bearing, the weapon pointing along `baz`, `bel`, the elbow bent toward `pole`."""
    return Swing(reach=(az, el, d), blade=(baz, bel), toward=toward, pole=pole)


def foot(x, z, yaw=0.0, pitch=0.0, lift=0.0):
    """A boot with its toe or heel (as it is pitched) on the floor at (x, z): `Foot` is given where the ankle is, which a pitched boot moves forward of its contact."""
    return Foot(x, z + S.roll_shift(pitch * DEG), yaw, pitch, lift)


def glide(c, side, t0, t1, a, b, h=0.07, via=None):
    """A boot picked up at frame t0 from `a` = (x, z, yaw, pitch) and set down at t1 on `b`: a smooth pace, still as it leaves and as it lands, lifted by a swell `h` high between (and bowed
    toward `via`, a point of the same four numbers, if there is one: a curve, not a line)."""
    for f in range(int(np.ceil(t0)), int(np.floor(t1)) + 1):
        u = (f - t0) / (t1 - t0)
        e = u * u * (3 - 2 * u)
        v = [a[i] + (b[i] - a[i]) * e for i in range(4)]
        if via is not None:
            v = [(1 - e) ** 2 * a[i] + 2 * (1 - e) * e * via[i] + e * e * b[i] for i in range(4)]
        c.key(f, ease='linear', **{side: foot(v[0], v[1], v[2], v[3], h * np.sin(np.pi * u) ** 1.2)})


LANTERN_LENGTH, LANTERN_RADIUS, FLOOR = 0.35, 0.085, 0.012  # the lantern's cage hangs this far below its pivot and is this wide about its axis; the lowest it may lie


def heading(R, last=0.0):
    """Which way a torso faces about the vertical, from its left-hand axis, which stays level when the body lies on its back and its front axis (the toolkit's `torso_yaw`) points at the sky."""
    return float(np.arctan2(-R[2, 0], R[0, 0])) if np.hypot(R[2, 0], R[0, 0]) > 0.2 else last


class Fallen(Clip):
    """A clip that may end on the floor. The toolkit hangs the lantern plumb from his belt, turned about the vertical by the torso's yaw (lantern.add_swing), which is neither defined for a body lying
    on its back nor any use through the floor; so it is swung again here, with the heading of the torso's left hand for the yaw, and laid on its side where it would otherwise go under: swung toward
    the horizontal, outward from his hip, just far enough to clear."""

    def solve(self):
        super().solve()
        n = len(self.rigs)
        pivot = np.array(F.JOINTS['lantern'][1] + (1.0,))
        Ts = [r.world['torso'] for r in self.rigs]
        piv = np.array([(T @ pivot)[:3] + self.root(t) for t, T in enumerate(Ts)])
        yaw, last = np.zeros(n), 0.0
        for t, T in enumerate(Ts):
            last = yaw[t] = heading(T[:3, :3], last)
        phi = lantern.swing(piv, np.unwrap(yaw), self.loop)
        u = np.clip((np.arange(n) / max(n - 1, 1) - 0.5) / 0.5, 0, 1)
        phi = phi * (0.5 + 0.5 * np.cos(np.pi * u))[:, None]  # as the toolkit does: a move ends with the lantern still
        for t, (pose, T) in enumerate(zip(self.poses, Ts)):
            d0 = S.ry(yaw[t]) @ S.unit(np.array([phi[t, 0], -1.0, phi[t, 1]]))
            low = lambda d: piv[t][1] + LANTERN_LENGTH * d[1] - LANTERN_RADIUS * np.sqrt(max(0.0, 1 - d[1] ** 2))
            d = d0
            if low(d0) < FLOOR:
                out = T[:3, :3] @ np.array([1.0, 0.0, 0.0])
                out[1] = 0.0
                flat = S.unit(np.array([0.0, -0.12, 0.0]) + 0.99 * S.unit(out, (1.0, 0.0, 0.0)))
                lo, hi = 0.0, 1.0
                for _ in range(24):  # the least swing toward lying flat that lifts the cage clear
                    mid = (lo + hi) / 2
                    if low(S.unit((1 - mid) * d0 + mid * flat)) >= FLOOR:
                        hi = mid
                    else:
                        lo = mid
                d = S.unit((1 - hi) * d0 + hi * flat)
            pose['lantern'] = F.mat_to_quat(T[:3, :3].T @ (S.ry(yaw[t]) @ lantern.from_down(S.ry(-yaw[t]) @ d)))
        return self


def bake_legs(c, probe, frames):
    """The legs of `c` from the boots of `probe`, a frame at a time. A fall puts the hips where no standing boot can follow them, and a boot placed with `Foot` can only go where the body stands; so the
    boots are placed on a probe clip (pelvis, pelvis_rot and the boots' `Foot` keys), solved by the toolkit's own two-bone IK there, and the joint angles that came out are keyed on `c` (with the pelvis, as far
    as the legs let it be that high) on every frame: the boots stay where they were put, and the pose is the toolkit's own."""
    for f in range(frames + 1):
        ch, _ = S.cap_pelvis(probe.channels(f), probe.root(f))
        r = S.Rig(ch, probe.root(f))
        legs = {}
        for side in 'RL':
            r.leg(side)
            th, ft = (S.euler_of(F.quat_to_mat(r.q[j + side])) for j in ('leg', 'foot'))
            K = F.quat_to_mat(r.q['knee' + side])  # a knee turns about x alone, and past 90 degrees `euler_of` would give its other, equal, form
            legs['foot' + side] = Leg(tuple(float(v) for v in th), float(np.degrees(np.arctan2(K[2, 1], K[1, 1]))), tuple(float(v) for v in ft))
        c.key(f, ease='linear', pelvis=tuple(float(v) for v in ch['pelvis']), pelvis_rot=tuple(float(v) for v in ch['pelvis_rot']), **legs)


def chest(pelvis, pelvis_rot, torso, p):
    """The point `p` of the torso's own frame (x to his left, y up the spine from the hips, z out of the chest) in the actor's frame, for the body so posed."""
    T = S.move(pelvis) @ S.rot(S.euler(pelvis_rot)) @ S.rot(S.euler(torso))
    return tuple(float(v) for v in (T @ np.append(np.asarray(p, float), 1.0))[:3])


REST_L = dict(reach=(-16.17, -53.26, 0.5547), pole=(0.049, -0.575, -0.817))  # the free arm of the carried pose, as the rapier's clips write it (a Swing, so no key of the arm is an Arm)


def free(az, el, d=0.56, pole=(0.6, -0.7, -0.3)):
    """The free (left) arm: the wrist `d` from the shoulder at that bearing, the elbow toward `pole`."""
    return Swing(reach=(az, el, d), pole=pole)


def wound(pelvis, pelvis_rot, torso, p=(0.07, 0.3, 0.2), pole=(0.7, -0.6, -0.3)):
    """The free hand held to his chest at `p` (the torso's frame): the Swing from where the left shoulder is for the body so posed."""
    T = S.move(pelvis) @ S.rot(S.euler(pelvis_rot)) @ S.rot(S.euler(torso))
    shoulder = (T @ S.move(F.JOINTS['armL'][1]))[:3, 3]
    v = np.array(chest(pelvis, pelvis_rot, torso, p)) - shoulder
    return Swing(reach=(float(np.degrees(np.arctan2(-v[0], v[2]))), float(np.degrees(np.arcsin(v[1] / np.linalg.norm(v)))), float(min(0.57, np.linalg.norm(v)))), pole=pole)


def stagger():
    """Struck from the front on his right shoulder: the chest and head are thrown back and the shoulder spun away, the sword arm flung out behind it and the free arm out for balance, the hips jolted
    after them; the right boot steps back to catch him, he hunches over it on bent knees and then comes back up, the arms folding in, the boot returning."""
    m = timing(W, 'stagger')
    c = Clip(m, 'stagger')
    n = m.frames
    c.key(0, **rest())
    c.key(3, ease='out', pelvis=(0.0, 0.895, -0.05), pelvis_rot=(-5, -8, 2), torso=(-16, -24, 5), head=(-22, 14, -6), armL=Arm(arm=(-25, 0, 40), elbow=-35))
    c.key(7, ease='smooth', pelvis=(0.0, 0.875, -0.1), pelvis_rot=(-8, -12, 2), torso=(-18, -28, 4), head=(-26, 18, -6), armL=Arm(arm=(-45, 0, 70), elbow=-30),
          armR=sword(108, 28, 0.5, 125, 24))
    c.key(10, ease='smooth', pelvis=(0.0, 0.84, -0.1), pelvis_rot=(2, -8, 0), torso=(6, -14, 0), head=(10, 8, 0),
          armR=sword(92, 10, 0.5, 120, 16), armL=Arm(arm=(-30, 0, 55), elbow=-40))
    c.key(15, ease='smooth', pelvis=(0.0, 0.83, -0.06), pelvis_rot=(8, -4, 0), torso=(12, -8, 0), head=(14, 4, 0),
          armR=sword(70, -10, 0.5, 90, -4), armL=Arm(arm=(-25, 0, 40), elbow=-45))
    c.key(22, ease='smooth', pelvis=(0.0, 0.88, -0.02), pelvis_rot=(3, -2, 0), torso=(5, -4, 0), head=(3, 2, 0),
          armR=sword(30, -30, 0.54, 40, -30), armL=Arm(arm=(-10, 0, 22), elbow=-25))
    c.key(n, ease='smooth', still=True, **rest())
    c.steps('footR', (-0.115, 0.0, -7), [(2.5, 9, -0.16, -0.24, -14, 0.08), (20, 31, -0.115, 0.0, -7, 0.05)])
    c.key(0, footL=Foot(0.115, 0.0, 7))
    return c


def guard_break():
    """His guard smashed open: both arms are thrown wide and the sword out to the side, the chest wide open and arched back, a heavy stumbling step back and then a second as the knees go; he
    hangs there buckled over his boots, the arms drooping, swaying and dazed for a beat, then slowly gets his legs under him, draws the arms in and stands."""
    m = timing(W, 'guardBreak')
    c = Clip(m, 'guardBreak')
    n = m.frames
    c.key(0, **rest())
    # the smash: the chest goes back and the arms fly out, the sword arm a beat behind the body
    c.key(3, ease='out', pelvis=(0.0, 0.89, -0.07), pelvis_rot=(-7, -4, 2), torso=(-22, -10, 4), head=(-24, 8, -4), armL=Arm(arm=(-10, 0, 50), elbow=-25))
    c.key(7, ease='smooth', pelvis=(0.0, 0.87, -0.1), pelvis_rot=(-9, -5, 2), torso=(-24, -12, 4), head=(-26, 10, -4), armR=sword(98, 22, 0.56, 112, 30), armL=Arm(arm=(15, 0, 85), elbow=-10))
    # the heavy step back, the knees begin to go
    c.key(14, ease='smooth', pelvis=(0.0, 0.77, -0.2), pelvis_rot=(0, -3, 0), torso=(-6, -6, 0), head=(-8, 6, 0), armR=sword(95, 5, 0.56, 105, 0), armL=Arm(arm=(10, 0, 70), elbow=-15))
    # buckled over his boots: the chest caves, the head drops, the arms hang
    c.key(22, ease='smooth', pelvis=(0.0, 0.66, -0.2), pelvis_rot=(5, 0, 2), torso=(14, -4, 3), head=(22, 6, 6), armR=sword(85, -25, 0.55, 95, -32), armL=Arm(arm=(0, 0, 55), elbow=-20))
    # the dazed beat: he sways one way and the other, the head rolling, the free hand coming up toward his brow
    c.key(31, ease='smooth', pelvis=(0.03, 0.65, -0.18), pelvis_rot=(6, 4, 4), torso=(16, 6, -6), head=(24, -12, -8), armR=sword(82, -28, 0.55, 90, -35), armL=Arm(arm=(-45, 0, 25), elbow=-70))
    c.key(41, ease='smooth', pelvis=(-0.03, 0.65, -0.17), pelvis_rot=(6, -4, -4), torso=(18, -4, 6), head=(26, 10, 8), armR=sword(80, -30, 0.55, 88, -36), armL=Arm(arm=(-25, 0, 35), elbow=-40))
    # the recovery: the head lifts first, then the chest, and the legs push him up
    c.key(50, ease='smooth', pelvis=(0.0, 0.72, -0.12), pelvis_rot=(4, 0, 0), torso=(12, 0, 0), head=(12, 0, 0), armR=sword(70, -35, 0.54, 70, -40), armL=Arm(arm=(-5, 0, 40), elbow=-30))
    c.key(60, ease='smooth', pelvis=(0.0, 0.84, -0.05), pelvis_rot=(2, 0, 0), torso=(6, 0, 0), head=(4, 0, 0), armR=sword(40, -38, 0.54, 30, -50), armL=Arm(arm=(-6, 0, 22), elbow=-20))
    c.key(n - 3, ease='smooth', pelvis=(0.0, 0.905, -0.005), pelvis_rot=(0, 0, 0), torso=(2, 0, 0), head=(0, 0, 0))
    c.key(n, ease='smooth', still=True, **rest())
    c.steps('footR', (-0.115, 0.0, -7), [(2.5, 10, -0.17, -0.28, -14, 0.09), (56, 67, -0.115, 0.0, -7, 0.05)])
    c.steps('footL', (0.115, 0.0, 7), [(10, 18, 0.14, -0.14, 12, 0.07), (46, 58, 0.115, 0.0, 7, 0.05)])
    return c


def parried():
    """His own blow turned aside: the weapon is knocked up and away to his right and drags him after it, the shoulders spinning round, the free arm flung across for balance; he stumbles round on
    his boots, the right planting wide and the left trailing, and is left stooped over the bent right knee, half turned away with the chest open, the sword hanging low behind him and his
    eyes on the foe: held there, swaying and sagging, for the beat the player strikes in. Then the weight comes back, the shoulders unwind and the boots close."""
    m = timing(W, 'parried')
    c = Clip(m, 'parried')
    n = m.frames
    look = (0, 1.45, 4)  # the foe: the head comes round to it whatever the body does
    low = (0, 1.1, 3)  # the same, from under a stoop
    c.key(0, **rest())
    c.key(0, look=look)
    c.key(4, ease='out', eases={'armR': 'linear'}, pelvis=(0.0, 0.89, -0.06), pelvis_rot=(-3, -8, 2), torso=(-14, -14, 4), head=(-14, 0, -4), look=look,
          armR=sword(64, 40, 0.56, 88, 44), armL=Arm(arm=(-20, 0, 42), elbow=-30))
    c.key(10, ease='smooth', pelvis=(0.0, 0.85, -0.08), pelvis_rot=(1, -34, 3), torso=(-6, -34, 4), head=(0, 0, 0), look=look,
          armR=sword(112, 26, 0.56, 136, 26), armL=Arm(arm=(-60, 10, 20), elbow=-35))
    c.key(17, ease='smooth', pelvis=(-0.06, 0.79, -0.1), pelvis_rot=(5, -62, 4), torso=(4, -30, 3), head=(0, 0, 0), look=look,
          armR=sword(150, 8, 0.56, 168, 2), armL=Arm(arm=(-72, -10, 10), elbow=-40))
    c.key(25, ease='smooth', pelvis=(-0.1, 0.68, -0.08), pelvis_rot=(10, -50, 5), torso=(14, -12, 6), head=(0, 0, 0), look=low,
          armR=sword(140, -12, 0.56, 150, -22), armL=Arm(arm=(-40, 0, 40), elbow=-30))
    # the open beat: stooped over the bent right leg, the left trailing behind him, half turned with the chest to the foe, the arms hanging, the sword's point dragging low behind
    c.key(33, ease='smooth', pelvis=(-0.12, 0.63, -0.06), pelvis_rot=(14, -44, 8), torso=(24, -8, 8), head=(4, 0, 0), look=low,
          armR=sword(124, -34, 0.5, 134, -38), armL=Arm(arm=(-26, 0, 34), elbow=-20))
    c.key(41, ease='smooth', pelvis=(-0.10, 0.61, -0.05), pelvis_rot=(16, -46, 5), torso=(28, -6, 4), head=(6, 0, 0), look=low,
          armR=sword(122, -34, 0.5, 132, -35), armL=Arm(arm=(-34, 0, 26), elbow=-26))
    c.key(49, ease='smooth', pelvis=(-0.13, 0.66, -0.07), pelvis_rot=(11, -40, 8), torso=(20, -4, 9), head=(2, 0, 0), look=look,
          armR=sword(126, -32, 0.5, 136, -36), armL=Arm(arm=(-22, 0, 40), elbow=-18))
    c.key(57, ease='smooth', pelvis=(-0.11, 0.62, -0.05), pelvis_rot=(15, -45, 4), torso=(26, -7, 5), head=(6, 0, 0), look=low,
          armR=sword(122, -34, 0.5, 132, -35), armL=Arm(arm=(-30, 0, 30), elbow=-24))
    c.key(64, ease='smooth', pelvis=(-0.11, 0.64, -0.05), pelvis_rot=(12, -42, 5), torso=(22, -6, 4), head=(3, 0, 0), look=look,
          armR=sword(124, -34, 0.5, 134, -38), armL=Arm(arm=(-26, 0, 34), elbow=-20))
    # gathering himself: the shoulders come round, the legs push up, the sword is drawn back across
    c.key(77, ease='smooth', pelvis=(-0.04, 0.79, -0.04), pelvis_rot=(5, -20, 0), torso=(8, -4, 0), head=(2, 0, 0), look=look,
          armR=sword(80, -34, 0.55, 80, -46), armL=Arm(arm=(-14, 0, 30), elbow=-24))
    c.key(n - 8, ease='smooth', pelvis=(0.0, 0.895, 0.0), pelvis_rot=(1, -4, 0), torso=(2, 0, 0), head=(0, 0, 0), look=look,
          armR=sword(24, -40, 0.55, 20, -56), armL=Arm(arm=(-6, 0, 12), elbow=-18))
    c.key(n, ease='smooth', still=True, **rest())
    c.key(n, look=(0.3, 1.62, 4.0))
    # the boots: the right plants wide, the left pivots and then trails behind; at the end they come back level
    c.key(0, ease='linear', footR=foot(-0.115, 0.0, -7), footL=foot(0.115, 0.0, 7))
    glide(c, 'footR', 5, 22, (-0.115, 0.0, -7, 0), (-0.38, -0.06, -66, 0), 0.08)
    glide(c, 'footL', 8, 28, (0.115, 0.0, 7, 0), (0.2, -0.42, -34, 22), 0.06)
    glide(c, 'footL', 66, 82, (0.2, -0.42, -34, 22), (0.115, 0.0, 7, 0), 0.07)
    glide(c, 'footR', 68, n - 6, (-0.38, -0.06, -66, 0), (-0.115, 0.0, -7, 0), 0.06)
    c.key(n, ease='linear', footR=foot(-0.115, 0.0, -7), footL=foot(0.115, 0.0, 7))
    return c


def death():
    """Struck full in the chest, he staggers back doubled over his wound, the free hand pressed to it, and his knees go: down on the right knee with the left boot ahead of him, the sword's point on the floor
    and the hand slack on it, the head hanging, one held breath; then the weight tips him backward and he falls full length, the hips first, then the shoulders and the head striking the boards, the right leg
    sliding out and the left knee left standing. The sword lies from his open hand, the other arm flung out, the lantern rolled to its side; and for the last half second nothing moves at all."""
    m = timing(W, 'death')
    c = Fallen(m, 'death')
    c.auto_pelvis = False
    n = m.frames
    probe = Clip(m, 'death.boots')

    def K(t, ease='smooth', still=False, **ch):  # the body's keys go to the clip, the hips' to the probe, which places the boots
        c.key(t, ease=ease, still=still, **{k: v for k, v in ch.items() if k not in ('pelvis', 'pelvis_rot')})
        probe.key(t, ease=ease, still=still, **{k: v for k, v in ch.items() if k in ('pelvis', 'pelvis_rot')})

    LIE_R, LIE_L = (-0.3, 0.3, -0.9), (0.3, 0.3, -0.9)  # lying, an arm's elbow bends toward his head along the floor, not down into it
    K(0, **rest(armL=Swing(**REST_L)))
    c.key(0, look=(0.3, 1.62, 4.0))
    # the blow: the chest is thrown back and the sword arm flung wide
    K(5, ease='out', eases={'armR': 'linear'}, pelvis=(0.0, 0.895, -0.07), pelvis_rot=(-6, -8, 2), torso=(-24, -14, 4), head=(-28, 14, -6), armR=sword(76, 30, 0.55, 112, 26), armL=free(-72, 18, 0.56))
    # the recoil: he folds over it, the free hand going to the wound, the sword dropping to hang
    P, R_, T = (0.0, 0.84, -0.17), (2, -6, 2), (4, -12, 3)
    K(11, pelvis=P, pelvis_rot=R_, torso=T, head=(10, 10, 0), armR=sword(86, -4, 0.55, 100, -8), armL=wound(P, R_, T))
    P, R_, T = (0.0, 0.78, -0.26), (6, -4, 3), (22, -8, 5)
    K(19, pelvis=P, pelvis_rot=R_, torso=T, head=(26, 6, 8), armR=sword(72, -30, 0.55, 80, -24), armL=wound(P, R_, T))
    # the knees begin to go: down he comes, over the wound, the sword's point reaching the floor beside him
    P, R_, T = (0.0, 0.64, -0.4), (8, -2, 3), (30, -6, 6)
    K(29, pelvis=P, pelvis_rot=R_, torso=T, head=(34, 8, 10), armR=sword(62, -42, 0.5, 62, -24), armL=wound(P, R_, T))
    # on the one knee: the hand falls from the wound, the head hangs
    P, R_, T = (0.0, 0.5, -0.52), (10, -2, 2), (30, -4, 4)
    K(41, pelvis=P, pelvis_rot=R_, torso=T, head=(40, 6, 12), armR=sword(55, -54, 0.5, 55, -22), armL=free(-14, -58, 0.5))
    P, R_, T = (0.0, 0.48, -0.55), (12, 0, 2), (34, 0, 5)
    K(55, pelvis=P, pelvis_rot=R_, torso=T, head=(44, 4, 14), armR=sword(52, -56, 0.5, 52, -22), armL=free(-12, -62, 0.5))
    # the last breath: the chest comes up a little, the head with it
    P, R_, T = (0.0, 0.54, -0.55), (0, 0, 0), (6, 0, 0)
    K(65, pelvis=P, pelvis_rot=R_, torso=T, head=(-6, 0, 4), armR=sword(52, -52, 0.5, 54, -22), armL=free(-18, -56, 0.5))
    # the fall: the weight goes back, the body one piece about the knee, the arms trailing
    P, R_, T = (0.0, 0.5, -0.6), (-16, 2, 0), (0, 0, 0)
    K(73, pelvis=P, pelvis_rot=R_, torso=T, head=(-12, 6, 4), armR=sword(62, -34, 0.5, 70, -18), armL=free(-40, -40, 0.5))
    P, R_, T = (0.0, 0.42, -0.68), (-44, 4, 0), (-2, 0, 0)
    K(83, ease='in', pelvis=P, pelvis_rot=R_, torso=T, head=(-18, 10, 6), armR=sword(112, 12, 0.55, 150, 16), armL=free(-70, 12, 0.55))
    P, R_, T = (0.0, 0.2, -0.8), (-88, 12, 0), (-2, 0, 4)
    K(94, ease='in', pelvis=P, pelvis_rot=R_, torso=T, head=(-14, 20, 8), armR=sword(76, -14, 0.57, 90, 0, pole=LIE_R), armL=free(-78, -5, 0.57, pole=LIE_L))
    # the thud and the slump: the head and the arms settle after the body
    P, R_, T = (0.0, 0.185, -0.8), (-89, 12, 0), (-3, 0, 5)
    K(106, ease='out', pelvis=P, pelvis_rot=R_, torso=T, head=(-8, 26, 8), armR=sword(80, -14, 0.57, 96, 2, pole=LIE_R), armL=free(-80, -4, 0.57, pole=LIE_L))
    K(124, pelvis=P, pelvis_rot=R_, torso=T, head=(-4, 28, 10), armR=sword(82, -14, 0.57, 98, 2, pole=LIE_R), armL=free(-82, -4, 0.57, pole=LIE_L), still=True)
    K(n, ease='linear', pelvis=P, pelvis_rot=R_, torso=T, head=(-4, 28, 10), armR=sword(82, -14, 0.57, 98, 2, pole=LIE_R), armL=free(-82, -4, 0.57, pole=LIE_L), still=True)
    # the boots, placed on the probe: the right steps back and then goes down with the knee, the left comes up behind the fall and is left standing; then the right slides out along the floor
    probe.key(0, ease='linear', footR=foot(-0.115, 0.0, -7), footL=foot(0.115, 0.0, 7))
    glide(probe, 'footR', 2, 12, (-0.115, 0.0, -7, 0), (-0.18, -0.46, -12, 0), 0.08)
    glide(probe, 'footL', 12, 24, (0.115, 0.0, 7, 0), (0.15, -0.14, 12, 0), 0.06)
    glide(probe, 'footR', 22, 40, (-0.18, -0.46, -12, 0), (-0.16, -0.92, 0, 72), 0.04)
    glide(probe, 'footR', 68, 108, (-0.16, -0.92, 0, 72), (-0.34, -0.04, -28, -58), 0.05, via=(-0.5, -0.9, -20, 0))
    probe.key(n, ease='linear', footR=foot(-0.34, -0.04, -28, -58), footL=foot(0.15, -0.14, 12))
    bake_legs(c, probe, n)
    return c


def build():
    return [stagger(), guard_break(), parried(), death()]
