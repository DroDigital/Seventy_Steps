"""What the boss places are made of (tools/models/bake_boss_models.py reads this): one `M` for each model baked, naming its source (a path under the
unpacked collection, tools/models/boss/unpack.py), the objects of it that are the model, how it is turned and sized, what each material is,
what a body cannot walk through and where its flames sit. The packs, their licences and what was done to them: docs/BOSS_PLACES.md and
src/data/models/CREDITS.md. A model's id is the one the places' planners (src/world/places/) and the sets name.

  fit      {'height': m} | {'length': m} | {'width': m} | {'depth': m} | {'scale': k}: how it is sized (metres, or times the source)
  rot      degrees about the vertical, to face the model's front toward +z (and its long side along x, for a wall)
  cls      the class of any face a material name does not decide; `classes` {material regex: class} decides the rest
  solids   'box' (its whole box), 'auto' (voxelised: doorways and colonnades stay open), 'trunk' (a tree: the box about its trunk, not its roots and limbs), 'none', or a list of (cx, cz, hx, hz, y0, y1)
  anchors  [(x, y, z)]: where a flame or a light sits in the finished model (its own frame, feet at the origin); `anchor_of` finds one from the
           faces of a material (regex) that are left out of the model: their middle
  recolour (r, g, b): the colours of the source thrown away, its light and dark kept
  src       `proc:<name>` makes the form in code (proc.py) from `args`; `rx`, `rz` tip a source over (a pipe laid on its side stood up)
  glass_alpha, fill, plane   what is clear, wet or silvered (round 77): see the fields
  select   a regex or a list for the objects of the scene that make it; `cut` bisects it (blender-space planes: (point, normal)); `drop` leaves
           out the faces of the materials it names; `decimate` reduces each object toward that many triangles; `pose` {bone: (rx, ry, rz)} poses an armature; `drop_alpha` leaves out the faces whose texture is mostly clear
"""
from dataclasses import dataclass, field
from typing import Any
import sources as S

@dataclass
class M:
    id: str
    src: str
    select: Any = None
    kit: str = ''
    fit: dict = field(default_factory=dict)
    rot: float = 0
    cls: Any = None
    classes: dict = field(default_factory=dict)
    double: tuple = (S.CLOTH, S.LEAF, S.GLASS, S.LIQUID)  # classes drawn on both sides (a thin shell is seen from within)
    round: bool = False
    solids: Any = 'box'
    bands: tuple = (0.9, 2.2)
    anchors: list = field(default_factory=list)
    anchor_of: Any = None
    drop: Any = None
    cut: Any = None
    decimate: int = 0
    drop_alpha: float = 0.0  # the faces of a texture clearer than this (the glass of a jar) are left out
    glass_alpha: float = 0.0  # ... or kept, as glass (round 77: class GLASS, drawn clear with a sheen)
    fill: Any = None  # a liquid the glass holds: {'level': 0.5, 'inset': 0.9, 'colour': (r, g, b)} (fill.py), class LIQUID
    plane: Any = None  # the faces of a flat panel made a mirror: {'axis': 2, 'sign': 1, 'at': 0.007, 'tol': 0.0006} in the source's own frame, class MIRROR (fill.py)
    squash: tuple = (1, 1, 1)
    pose: Any = None
    textures: tuple = ()
    exclude: Any = None
    mirror: bool = False
    rx: float = 0  # degrees: the source tipped about x (its top toward +z) and about z (its top toward -x), before it is turned about the vertical
    rz: float = 0
    recolour: Any = None  # (r, g, b): every face's colour taken from this by its own light and dark (a colony's painted metal made a pale stone)
    recolour_not: tuple = ()  # classes the recolour leaves as they were (the glazing of a still of copper)
    args: dict = field(default_factory=dict)  # a `proc:` form's arguments (tools/models/boss/proc.py)
    blank: Any = None  # a figure's head taken off at the bone of this name and an eyeless egg set in its place: {'bone': 'head', 'radii': (x, y, z)}

REGISTRY: list = []

def add(*models):
    REGISTRY.extend(models)

def load_all():
    """Imports every manifest module so each registers its models."""
    import importlib, pkgutil, os
    here = os.path.dirname(os.path.abspath(__file__))
    for m in sorted(pkgutil.iter_modules([here]), key=lambda m: m.name):
        if m.name.startswith('manifest_'):
            importlib.import_module(m.name)
    return REGISTRY
