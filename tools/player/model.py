"""The investigator's parts, assembled: each a Shape in the frame of the joint it hangs from, with the texture the game draws it in, whether it glows, and
the group that decides when it is shown (`body` always; `arm:<id>` the weapon in hand; `gun`, `holstered`, `flash`, `flame`; `prop:<id>` what the off-hand
takes up for a move). Written to a .blend by build_blend.py; the game reads it back from there (bake_player.py), so a part edited in Blender stays edited.
"""
from dataclasses import dataclass
import numpy as np
from kit import Shape, box, merge
import model_arms as A
import model_body as B
import model_gear as G
from palette import PALE


@dataclass
class Part:
    name: str
    joint: str
    tex: str  # the world texture kind it is drawn in
    group: str
    shape: Shape
    emissive: float = 0.0
    at: tuple = (0.0, 0.0, 0.0)  # where the group's own object sits in the joint's frame (flame, flash: the shape is centred on it)


def parts():
    out = []
    add = lambda *a, **k: out.append(Part(*a, **k))
    add('torso', 'torso', 'cloth', 'body', merge([*B.torso(), *G.lantern_mount(), *G.holster(), *G.flask_belt(), *B.satchel()]))
    add('lantern', 'lantern', 'cloth', 'body', merge(G.lantern()))
    add('head', 'head', 'cloth', 'body', merge(B.head()).move(0, 0.025, 0))  # the head sits a little higher on its neck than the old figure's, out of the shoulders
    add('hat', 'head', 'cloth', 'body', merge(B.hat()).move(0, 0.025, 0))
    for side, arm, elbow, hand in (('R', 'armR', 'elbowR', 'handR'), ('L', 'armL', 'elbowL', 'handL')):
        add(f'sleeve{side}', arm, 'cloth', 'body', merge(B.upper_arm()))
        add(f'forearm{side}', elbow, 'cloth', 'body', merge(B.fore_arm()))
        h = merge(B.hand())
        add(f'hand{side}', hand, 'cloth', 'body', h if side == 'R' else h.mirror_x())
    for side in 'RL':
        add(f'thigh{side}', f'leg{side}', 'cloth', 'body', merge(B.thigh()))
        add(f'shin{side}', f'knee{side}', 'cloth', 'body', merge(B.shin()))
        add(f'foot{side}', f'foot{side}', 'cloth', 'body', merge(B.foot()))
        add(f'skirt{side}', f'skirt{side}', 'cloth', 'body', merge(B.skirt(-1 if side == 'R' else 1)))
    for wid, (tex, build) in A.WEAPONS.items():
        add(f'arm_{wid}', 'handR', tex, f'arm:{wid}', merge(build()))
    add('gun', 'handL', 'cloth', 'gun', merge(G.revolver()))
    add('flash', 'handL', 'flesh', 'flash', box(0.16, 0.16, 0.16, 0, 0, 0, np.array(PALE) * 0 + np.array([0.85, 0.82, 0.72])), emissive=1.0, at=(0, -0.32, 0.03))
    add('holstered', 'torso', 'cloth', 'holstered', merge(G.holstered_grip()))
    add('flame', 'lantern', 'cloth', 'flame', merge(G.flame()), emissive=1.0, at=(0.0, G.FLAME_Y, 0.0))
    for pid, build in (('flask', G.oil_flask), ('laudanum', G.laudanum_bottle), ('syringe', G.syringe), ('powder', G.powder_packet), ('match', G.match), ('book', G.book)):
        add(f'prop_{pid}', 'handL', 'cloth', f'prop:{pid}', merge(build()), emissive=0.6 if pid in ('syringe', 'match') else 0.0)
    return out
