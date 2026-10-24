"""Pack 04, the retro shacks, sheds and gantries (CC0): board shacks and lean-tos, great sheds on their frames, a gantry's floor, rails and stairs, concrete ramps,
platforms and barricades, pallets, barrels, a chain-link fence (Martin's Beach: the fishermen's cabins, the landing and its raised platforms; a few for
the ruined farms and the colony). Flat low poly; each file is its own scene."""
from manifest import M, add
import sources as S

DIR = 'p04/'

def ms(id, file, sel, cls, **kw):
    return M(id, DIR + file + '.blend', sel, kit='p04', cls=cls, classes={'.': cls}, fit=kw.pop('fit', {'scale': 1.0}), **kw)

add(
    ms('ms_shack', 'Shack A', 'Shack A', S.WOOD, fit={'scale': 1.5}, solids='box'),
    ms('ms_leanto', 'Leanto B', 'Leanto B', S.WOOD, fit={'scale': 1.5}, solids='box'),
    ms('ms_shed_a', 'Large Shed A', ['Shed A', 'Shed A Frame'], S.METAL, solids='box'),
    ms('ms_shed_b', 'Large Shed B', ['Shed A', 'Shed A Frame'], S.METAL, solids='box'),
    ms('ms_rail', 'Handrail', 'Handrail', S.METAL, fit={'scale': 2.0}, solids='none'),
    ms('ms_rail_post', 'Handrail', 'Handrail Post', S.METAL, fit={'scale': 2.0}, solids='none'),
    ms('ms_gantry', 'Metal Gantry Floor', 'Gantry Floor A', S.METAL, fit={'scale': 2.5}, solids='none'),
    ms('ms_pallet', 'Pallet', 'instance_0', S.WOOD, fit={'scale': 1.3}, solids='none'),
    ms('ms_barrel', 'Barrel', 'Barrel', S.METAL, fit={'scale': 1.3}, solids='box', round=True),
    ms('ms_barricade', 'Concrete Barricade', 'SketchUp', S.STONE, fit={'scale': 1.6}, solids='box'),
    ms('ms_platform', 'Concrete Ramps', 'Square Platform', S.STONE, solids='box'),
    ms('ms_pole', 'Chainlink Fence', 'Pole', S.METAL, fit={'scale': 1.4}, solids='none'),
)
