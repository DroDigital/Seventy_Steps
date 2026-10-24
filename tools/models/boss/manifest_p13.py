"""Pack 13, pistachio's human basemeshes (CC0) and pack 12, orange juice games' PSX male base mesh (CC0): bodies posed offline on their rigs (Blender evaluates the armature,
the pose is baked into the model's faces, nothing moves in the game) and turned to figures of stone and of the Court: the blind dancers of Azathoth's court (heads taken off at
the neck and an eyeless egg set in their place, their proportions drawn out) and a pale one seated for the tiers of Hastur's theatre (the stone people of Gorgon's porch were these, caught as they ran, until round 72's statues). One body, many poses."""
from manifest import M, add
import sources as S

HUMAN = 'p13/Human Basemeshes.blend'
STONEFIG = (0.62, 0.6, 0.58)

def fig(id, pose, sel='basemesh_male', fit=None, **kw):
    return M(id, HUMAN, sel, kit='p13', cls=S.STONE, classes={'.': S.STONE}, fit=fit or {'height': 2.0}, pose=pose, **kw)

DANCER = {'bone': 'head', 'radii': (0.1, 0.14, 0.11)}  # the egg that stands where a face was
TALL = (0.72, 1.3, 0.72)  # drawn out: a dancer is longer in the limb and thinner than a person

add(
    # the blind dancers: whirling, bent, reaching, writhing (each is turned, mirrored and scaled by the court; heads taken off, the egg's radii in metres of the source)
    fig('fg_dance_a', {'upper_arm.L': (0, 0, 75), 'upper_arm.R': (0, 0, -75), 'forearm.L': (0, 0, 25), 'forearm.R': (0, 0, -25), 'thigh.L': (55, 0, 0), 'shin.L': (-50, 0, 0), 'spine': (0, 28, 0), 'neck': (0, 0, 25)},
        decimate=700, blank=DANCER, squash=TALL, recolour=(0.34, 0.33, 0.46), solids='box', round=True),
    fig('fg_dance_b', {'spine': (38, 0, 0), 'upper_arm.L': (-50, 0, 20), 'upper_arm.R': (-60, 0, -20), 'thigh.R': (30, 0, 0), 'shin.R': (-30, 0, 0), 'neck': (0, 0, 35), 'hips': (0, 0, 10)},
        decimate=700, blank=DANCER, squash=TALL, recolour=(0.34, 0.33, 0.46), solids='box', round=True),
    fig('fg_dance_c', {'upper_arm.L': (0, 0, 155), 'upper_arm.R': (-40, 0, -25), 'spine': (0, -20, 0), 'hips': (0, 0, -12), 'thigh.L': (20, 0, 14), 'thigh.R': (-20, 0, -14)},
        decimate=700, blank=DANCER, squash=TALL, recolour=(0.34, 0.33, 0.46), solids='box', round=True),
    fig('fg_dance_d', {'upper_arm.L': (0, 0, 160), 'upper_arm.R': (0, 0, -160), 'forearm.L': (0, 0, -30), 'forearm.R': (0, 0, 30), 'thigh.L': (0, 0, 28), 'thigh.R': (0, 0, -28), 'spine': (-12, 0, 0), 'neck': (0, 0, -20)},
        decimate=700, blank=DANCER, squash=TALL, recolour=(0.34, 0.33, 0.46), solids='box', round=True),
    # a pale one seated, for the tiers of a theatre
    fig('fg_seat', {'thigh.L': (90, 0, 0), 'thigh.R': (90, 0, 0), 'shin.L': (-90, 0, 0), 'shin.R': (-90, 0, 0), 'upper_arm.L': (30, 0, 0), 'upper_arm.R': (30, 0, 0), 'forearm.L': (60, 0, 0), 'forearm.R': (60, 0, 0)},
        decimate=700, recolour=(0.7, 0.66, 0.8), solids='none'),
)
