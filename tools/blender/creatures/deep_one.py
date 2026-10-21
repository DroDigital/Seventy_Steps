"""Deep One (The Shadow over Innsmouth). "Mostly shiny and slippery, but the ridges of their backs
were scaly ... their heads were the heads of fish, with prodigious bulging eyes that never closed. At
the sides of their necks were palpitating gills, and their long paws were webbed. They hopped
irregularly, sometimes on two legs and sometimes on four." Grey-green over a pale belly, hunched, a
ridge of fin and spine down the back, a wide lipless mouth of needle teeth. It rakes across with one
webbed claw, and leaps in with both, maw open. Its eldritch self grows a second pair of eyes, and all
four burn Void Green."""

import math

from kit import ANOMALY, BASE, BIPED, add, gradient, mix, plant, shade, sym, walk


def build(k):
    S = k.H / 1.9
    P = lambda x, y, z: (x * S, y * S, z * S)
    r, m, pal = k.r, k.m, k.pal
    hide, back = pal.mid, mix(pal.mid, pal.dark, 0.4)
    belly = mix(pal.mid, BASE['bone'], 0.45)
    fin, mouth = mix(pal.dark, pal.mid, 0.25), (0.07, 0.05, 0.05)
    claw = shade(BASE['bone'], 0.75)
    eye = (mix(BASE['bone'], pal.light, 0.5), 0.75)
    green = (ANOMALY['green'], 1.0)

    r.bone('hips', P(0, 0.02, 0.86), P(0, 0.0, 1.0))
    r.bone('belly', P(0, 0.0, 1.0), P(0, -0.1, 1.28), 'hips')
    r.bone('chest', P(0, -0.1, 1.28), P(0, -0.24, 1.5), 'belly')
    r.bone('neck', P(0, -0.24, 1.5), P(0, -0.32, 1.58), 'chest')
    r.bone('head', P(0, -0.32, 1.58), P(0, -0.62, 1.62), 'neck')
    r.bone('jaw', P(0, -0.3, 1.55), P(0, -0.64, 1.5), 'head')
    r.sym_bone('upperarm', P(0.3, -0.2, 1.44), P(0.4, -0.25, 1.1), 'chest')
    r.sym_bone('forearm', P(0.4, -0.25, 1.1), P(0.42, -0.36, 0.78), 'upperarm.L')
    r.sym_bone('hand', P(0.42, -0.36, 0.78), P(0.44, -0.44, 0.58), 'forearm.L')
    r.sym_bone('thigh', P(0.15, 0.02, 0.88), P(0.25, -0.16, 0.5), 'hips')
    r.sym_bone('shin', P(0.25, -0.16, 0.5), P(0.24, 0.04, 0.12), 'thigh.L')
    r.sym_bone('foot', P(0.24, 0.04, 0.12), P(0.26, -0.22, 0.03), 'shin.L')

    skin = gradient(back, hide, (0, -1, 0), -0.1 * S, 0.12 * S)  # darker down the back
    under = gradient(back, belly, (0, -1, 0), 0.02 * S, 0.24 * S)  # the pale belly and throat

    def ridge(bone, pts, tall=1.0):
        """A crest of fin down the back: spines raked back and up from the line `pts` (y, z)."""
        tips = [(y + (0.13 if i % 2 == 0 else 0.06) * tall, z + (0.06 if i % 2 == 0 else 0.025) * tall) for i, (y, z) in enumerate(pts)]
        with m.on(bone):
            m.slab([(y * S, z * S) for y, z in pts + tips[::-1]], fin, origin=(0, 0, 0), u=(0, 1, 0), v=(0, 0, 1), thick=0.03 * S)

    with m.mat('hide'):
        with m.on('hips'):
            m.ellipsoid(P(0, 0.03, 0.93), P(0.21, 0.18, 0.15), skin, segs=8)
        with m.on('belly'):
            m.lathe([(0.19 * S, 0), (0.26 * S, 0.1 * S), (0.27 * S, 0.2 * S), (0.24 * S, 0.3 * S)], under, base=P(0, 0.0, 0.92), axis=(0, -0.3, 1), sides=9, squash=(1.0, 0.92))
        with m.on('chest'):
            m.lathe([(0.23 * S, 0), (0.27 * S, 0.08 * S), (0.25 * S, 0.18 * S), (0.17 * S, 0.27 * S)], under, base=P(0, -0.06, 1.2), axis=(0, -0.55, 1), sides=9, squash=(1.3, 0.85))
            with m.sym():
                m.ellipsoid(P(0.27, -0.18, 1.44), P(0.12, 0.12, 0.11), skin)
        ridge('belly', [(0.2, 0.98), (0.24, 1.06), (0.23, 1.14), (0.2, 1.22)])
        ridge('chest', [(0.17, 1.27), (0.14, 1.35), (0.09, 1.43), (0.02, 1.5)], 1.2)
        with m.on('neck'):
            m.tube([P(0, -0.18, 1.44), P(0, -0.3, 1.56)], [0.17 * S, 0.17 * S], skin, sides=8)
            with m.sym():  # the gills, three slits each side, behind the jaw
                for i in range(3):
                    m.box(P(0.165, -0.24 - i * 0.035, 1.53 - i * 0.01), P(0.016, 0.022, 0.1), mouth, rot_deg=(16, 0, 0))
        ridge('neck', [(-0.06, 1.53), (-0.11, 1.6)], 0.9)
        with m.on('head'):
            m.lathe([(0.15 * S, 0), (0.2 * S, 0.08 * S), (0.21 * S, 0.18 * S), (0.18 * S, 0.27 * S), (0.1 * S, 0.35 * S), (0, 0.38 * S)], skin,
                    base=P(0, -0.27, 1.64), axis=(0, -1, -0.04), sides=9, squash=(1.15, 0.6))
            m.box(P(0, -0.47, 1.56), P(0.28, 0.24, 0.03), mouth)  # the mouth's dark, seen as the jaw drops
            m.teeth(P(-0.17, -0.55, 1.575), P(0.17, -0.55, 1.575), 8, 0.05 * S, claw)
            with m.sym():
                m.ellipsoid(P(0.16, -0.43, 1.73), P(0.09, 0.09, 0.08), skin)  # the bulge each eye sits in
                with m.layer('plain'):
                    m.eye(P(0.205, -0.45, 1.745), 0.06 * S, eye)
                with m.layer('eldritch'):
                    m.eye(P(0.205, -0.45, 1.745), 0.06 * S, green)
                    m.eye(P(0.075, -0.56, 1.76), 0.036 * S, green)  # the second pair, new and wet, above the snout
        with m.on('jaw'):
            m.lathe([(0.15 * S, 0), (0.19 * S, 0.1 * S), (0.18 * S, 0.22 * S), (0.13 * S, 0.3 * S), (0.05 * S, 0.37 * S)], gradient(belly, hide, (0, 0, 1), 1.48 * S, 1.56 * S),
                    base=P(0, -0.27, 1.53), axis=(0, -1, -0.06), sides=9, squash=(1.1, 0.42))
            m.teeth(P(-0.15, -0.56, 1.545), P(0.15, -0.56, 1.545), 7, 0.04 * S, claw, down=(0, 0, 1))
        with m.sym():
            with m.on('upperarm.L'):
                m.limb(P(0.3, -0.2, 1.46), P(0.4, -0.25, 1.1), 0.11 * S, 0.085 * S, skin)
            with m.on('forearm.L'):
                m.limb(P(0.4, -0.25, 1.1), P(0.42, -0.36, 0.78), 0.085 * S, 0.06 * S, skin)
            with m.on('hand.L'):
                m.ellipsoid(P(0.43, -0.39, 0.72), P(0.055, 0.085, 0.07), hide)
                tips = []
                for dy in (-0.09, -0.03, 0.03, 0.085):
                    a, b = P(0.43, -0.39 + dy * 0.5, 0.67), P(0.44, -0.4 + dy * 1.5, 0.53)
                    m.limb(a, b, 0.026 * S, 0.018 * S, hide, sides=4)
                    m.cone(b, P(0.445, -0.42 + dy * 1.6, 0.46), 0.017 * S, claw, 3)
                    tips.append((b[1], b[2]))
                web = [(-0.39 * S + dy * 0.6 * S, 0.66 * S) for dy in (0.085, -0.09)] + tips
                m.slab(web, fin, origin=(0.435 * S, 0, 0), u=(0, 1, 0), v=(0, 0, 1), thick=0.012 * S)
            with m.on('thigh.L'):
                m.limb(P(0.15, 0.02, 0.92), P(0.25, -0.16, 0.5), 0.14 * S, 0.095 * S, skin)
            with m.on('shin.L'):
                m.limb(P(0.25, -0.16, 0.5), P(0.24, 0.04, 0.13), 0.095 * S, 0.06 * S, skin)
            with m.on('foot.L'):
                m.ellipsoid(P(0.24, 0.03, 0.1), P(0.065, 0.07, 0.055), hide)
                toes = [(0.18, -0.07), (0.3, -0.05), (0.37, 0.21), (0.32, 0.18), (0.29, 0.3), (0.25, 0.2), (0.21, 0.29), (0.18, 0.18), (0.13, 0.23), (0.16, 0.0)]
                m.slab([(x * S, f * S) for x, f in toes], hide, origin=P(0, 0, 0.03), u=(1, 0, 0), v=(0, -1, 0), thick=0.045 * S)
                for x, f in ((0.37, 0.21), (0.29, 0.3), (0.21, 0.29), (0.13, 0.23)):
                    m.cone(P(x, -f, 0.03), P(x, -f - 0.07, 0.0), 0.014 * S, claw, 3)

    animate(k, S)


def animate(k, S):
    LEGS = [('thigh.L', 'shin.L', 'foot.L'), ('thigh.R', 'shin.R', 'foot.R')]
    crouch = lambda d, shift=None: plant(k, LEGS, root=(0, 0, -d * S), shift=shift)
    READY = add(crouch(0.05), sym({'upperarm.L': (-14, -10, 0), 'forearm.L': (-22, 0, 0), 'chest': (4, 0, 0), 'neck': (-4, 0, 0)}))

    idle = k.clip('idle', 120)
    for f, s in ((0, 0), (30, 1), (60, 0), (90, -1)):
        breath = sym({'chest': (3 * s, 0, 0), 'belly': (2 * s, 0, 0), 'head': (-3 * s, 0, 6 * s), 'jaw': (6 if f == 60 else 0, 0, 0),
                      'upperarm.L': (4 * s, 0, 0)})
        idle.key(f, add(READY, breath, {'chest': (0, 2 * s, 0)}), 'inout')

    stride = k.spec['speed'] * 40 / 60
    def body(t):
        c = math.cos(2 * math.pi * t)
        return {'upperarm.L': (32 * c - 12, -8, 0), 'upperarm.R': (-32 * c - 12, 8, 0), 'forearm.L': (-28, 0, 0), 'forearm.R': (-28, 0, 0),
                'belly': (8, 0, 0), 'chest': (12, 0, 5 * math.sin(2 * math.pi * t)), 'neck': (-12, 0, 0), 'head': (-8 + 5 * math.cos(4 * math.pi * t), 0, 0),
                'jaw': (4 + 4 * math.sin(4 * math.pi * t), 0, 0)}
    mv = k.clip('move', 40, stride=round(stride, 3))
    mv.keys_from(walk(k, LEGS, 40, stride, BIPED, duty=0.45, lift=0.2 * S, bob=0.06 * S, root=(0, 0, -0.06 * S), extra=body))

    hurt = k.clip('hurt')
    hurt.key(0, READY)
    hurt.key(5, add(crouch(0.08), sym({'chest': (-22, 0, 8), 'belly': (-8, 0, 0), 'neck': (-14, 0, 0), 'head': (-20, 0, -10), 'jaw': (28, 0, 0),
                                       'upperarm.L': (-40, -30, 0), 'forearm.L': (-30, 0, 0)})), 'out')
    hurt.key(14, add(crouch(0.1), sym({'chest': (-8, 0, 4), 'head': (-6, 0, -4), 'jaw': (10, 0, 0), 'upperarm.L': (-20, -16, 0), 'forearm.L': (-26, 0, 0)})), 'inout')
    hurt.key(34, READY, 'inout')

    reel = k.clip('reel')
    reel.key(0, READY)
    reel.key(8, add(crouch(0.12, [(0, 0.25 * S, 0), (0, 0, 0)]), sym({'chest': (-26, 0, 12), 'belly': (-10, 0, 0), 'head': (-24, 0, 0), 'jaw': (30, 0, 0),
                                                                  'upperarm.L': (-70, -50, 0), 'forearm.L': (-20, 0, 0)})), 'out')
    reel.key(30, add(crouch(0.28, [(0, 0.25 * S, 0), (0, 0, 0)]), sym({'chest': (30, 0, -6), 'belly': (18, 0, 0), 'head': (10, 0, 16), 'jaw': (14, 0, 0),
                                                                   'upperarm.L': (-20, -10, 0), 'forearm.L': (-50, 0, 0)})), 'inout')
    reel.key(52, add(crouch(0.22), sym({'chest': (24, 0, 4), 'belly': (14, 0, 0), 'head': (4, 0, -18), 'upperarm.L': (-10, -8, 0), 'forearm.L': (-40, 0, 0)})), 'inout')
    reel.key(66, add(crouch(0.18), sym({'chest': (20, 0, -4), 'head': (0, 0, 14), 'upperarm.L': (-12, -8, 0), 'forearm.L': (-36, 0, 0)})), 'inout')
    reel.key(96, READY, 'inout')

    death = k.clip('death')
    death.key(0, READY)
    death.key(10, add(crouch(0.04), sym({'chest': (-28, 0, 0), 'neck': (-16, 0, 0), 'head': (-24, 0, 0), 'jaw': (40, 0, 0), 'upperarm.L': (-60, -40, 0), 'forearm.L': (-30, 0, 0)})), 'out')
    knees = sym({'root:loc': (0, 0.06 * S, -0.45 * S), 'thigh.L': (-62, 0, -6), 'shin.L': (108, 0, 0), 'foot.L': (-40, 0, 0)})
    death.key(30, add(knees, sym({'chest': (24, 0, 0), 'belly': (10, 0, 0), 'head': (10, 0, 0), 'jaw': (18, 0, 0), 'upperarm.L': (-6, -14, 0), 'forearm.L': (-20, 0, 0)})), 'in')
    down = sym({'root': (78, 0, 0), 'root:loc': (0, 0.0, -0.08 * S), 'thigh.L': (-74, 0, -8), 'shin.L': (96, 0, 0), 'foot.L': (-20, 0, 0)})
    death.key(52, add(down, sym({'chest': (10, 0, 0), 'head': (-30, 0, 20), 'jaw': (24, 0, 0), 'upperarm.L': (-150, -40, 0), 'forearm.L': (-10, 0, 0)})), 'in')
    death.key(58, add(down, {'root': (6, 0, 0)}, sym({'chest': (6, 0, 0), 'head': (-34, 0, 22), 'jaw': (20, 0, 0), 'upperarm.L': (-160, -50, 0), 'forearm.L': (-6, 0, 0)})), 'out')
    death.key(80, add(down, sym({'chest': (8, 0, 0), 'head': (-30, 0, 24), 'jaw': (26, 0, 0), 'upperarm.L': (-158, -48, 0), 'forearm.L': (-8, 0, 0)})))

    a = k.clip('atk.sweep')  # one webbed claw raked across from its right to its left (arc 80 -> -60)
    s, e = a.strike, a.end
    coil = add(crouch(0.1), {'belly': (6, 0, -14), 'chest': (10, 0, -26), 'head': (0, 0, 22), 'jaw': (10, 0, 0),
                              'upperarm.R': (24, 78, 0), 'forearm.R': (-40, 0, 0), 'hand.R': (-20, 0, 0),
                              'upperarm.L': (-46, -14, 0), 'forearm.L': (-30, 0, 0)})
    a.key(0, READY)
    a.key(s - 9, coil, 'out')
    a.key(s - 2, add(coil, {'chest': (2, 0, -6), 'upperarm.R': (6, 8, 0)}), 'inout')
    a.key(s, add(crouch(0.12, [(0, -0.12 * S, 0), (0, 0, 0)]), {'belly': (10, 0, 6), 'chest': (14, 0, 12), 'head': (0, 0, -4), 'jaw': (30, 0, 0),
                                                               'upperarm.R': (-74, 38, 20), 'forearm.R': (-12, 0, 0), 'hand.R': (10, 0, 0),
                                                               'upperarm.L': (-30, -20, 0), 'forearm.L': (-36, 0, 0)}), 'in')
    a.key(e, add(crouch(0.12, [(0, -0.12 * S, 0), (0, 0, 0)]), {'belly': (12, 0, 16), 'chest': (16, 0, 32), 'head': (4, 0, -14), 'jaw': (20, 0, 0),
                                                               'upperarm.R': (-62, 4, 64), 'forearm.R': (-20, 0, 0), 'hand.R': (14, 0, 0),
                                                               'upperarm.L': (-10, -24, 0), 'forearm.L': (-30, 0, 0)}), 'out')
    a.key(e + 10, add(crouch(0.1), {'belly': (8, 0, 8), 'chest': (10, 0, 16), 'upperarm.R': (-36, 0, 30), 'forearm.R': (-26, 0, 0), 'upperarm.L': (-14, -12, 0), 'forearm.L': (-26, 0, 0)}), 'inout')
    a.key(a.frames, READY, 'inout')

    l = k.clip('atk.lunge')  # gathers low, springs, and comes down on its prey with both claws and its maw
    s, e = l.strike, l.end
    gather = add(crouch(0.3), sym({'belly': (22, 0, 0), 'chest': (18, 0, 0), 'neck': (-16, 0, 0), 'head': (-18, 0, 0),
                                   'upperarm.L': (40, -24, 0), 'forearm.L': (-50, 0, 0), 'hand.L': (-20, 0, 0)}))
    fly = sym({'root:loc': (0, 0, 0.32 * S), 'hips': (30, 0, 0), 'belly': (16, 0, 0), 'chest': (8, 0, 0), 'neck': (-26, 0, 0), 'head': (-30, 0, 0), 'jaw': (42, 0, 0),
               'thigh.L': (30, 0, 0), 'shin.L': (40, 0, 0), 'foot.L': (30, 0, 0),
               'upperarm.L': (-118, -26, 0), 'forearm.L': (-10, 0, 0), 'hand.L': (-24, 0, 0)})
    l.key(0, READY)
    l.key(s - 12, gather, 'out')
    l.key(s - 6, add(gather, crouch(0.04), {'root:loc': (0, 0, -0.04 * S)}), 'inout')
    l.key(s - 2, add(fly, sym({'root:loc': (0, 0, -0.12 * S), 'upperarm.L': (40, 0, 0), 'jaw': (-20, 0, 0)})), 'in')
    l.key(s, fly, 'out')
    land = add(crouch(0.26, [(0, -0.1 * S, 0), (0, 0.1 * S, 0)]), sym({'belly': (24, 0, 0), 'chest': (24, 0, 0), 'neck': (-10, 0, 0), 'head': (-6, 0, 0), 'jaw': (26, 0, 0),
                                                                   'upperarm.L': (-64, -10, 0), 'forearm.L': (-20, 0, 0), 'hand.L': (20, 0, 0)}))
    l.key(e - 2, add(fly, sym({'root:loc': (0, 0, -0.22 * S), 'upperarm.L': (40, 0, 0), 'hips': (-20, 0, 0)})), 'in')
    l.key(e, land, 'in')
    l.key(e + 14, add(crouch(0.16), sym({'belly': (12, 0, 0), 'chest': (10, 0, 0), 'jaw': (8, 0, 0), 'upperarm.L': (-30, -10, 0), 'forearm.L': (-30, 0, 0)})), 'inout')
    l.key(l.frames, READY, 'inout')
