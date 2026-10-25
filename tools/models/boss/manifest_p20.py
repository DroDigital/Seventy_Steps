"""Pack 20, 'alien builings extension pack' by yughues (OpenGameArt, CC0): the tapered pylons, braced curtain walls, domed towers and overhead passages of an alien base, with the
base's own paint thrown away and its light and dark kept in a pale metal-stone (Zkauba's Yaddith: a city left in a hurry). The pack's lamps, consoles, crates and ships are not asked for."""
from manifest import M, add
import sources as S

DIR = 'p20/'
PALE = (0.82, 0.78, 0.74)
DARK = (0.62, 0.56, 0.56)

def ay(id, obj, fit, **kw):
    return M(id, DIR + 'alien_buildings.blend', '^' + obj + '$', kit='p20', textures=(DIR,), cls=S.SLAB, classes={'.': S.SLAB}, fit=fit, recolour=kw.pop('recolour', PALE), **kw)

add(
    ay('ay_wall', 'alien_wall_short', {'length': 24}, solids='box'),
    ay('ay_pylon', 'alien_tower_wall', {'height': 20}, solids='box'),
    ay('ay_bastion', 'alien_tower2', {'height': 20}, solids='box', recolour=DARK),
    ay('ay_passage', 'alien_corridor', {'length': 24}, solids='none'),
    ay('ay_portal', 'alien_gate', {'width': 14}, solids='none'),
    ay('ay_dome', 'alien_base3', {'height': 12}, solids='box'),
    ay('ay_gantry', 'alien_base8', {'height': 14}, solids='box', recolour=DARK),
    # round 75: the rest of what Yaddith's city is built of, for a court with engines in it
    ay('ay_tower', 'alien_tower', {'height': 40}, solids='box'),
    ay('ay_antenna', 'alien_antenna', {'width': 9}, solids='box', recolour=DARK),
    ay('ay_generator', 'alien_generator', {'width': 18}, solids='box', recolour=DARK),
    ay('ay_hangar', 'alien_base4', {'width': 22}, solids='box'),
    ay('ay_depot', 'alien_base7', {'width': 26}, solids='box', recolour=DARK),
    ay('ay_keep', 'alien_base10', {'height': 20}, solids='box'),
    ay('ay_stand', 'alien_stand2', {'height': 14}, solids='box', recolour=DARK),
    ay('ay_console', 'alien_console_1', {'height': 6}, solids='box'),
    ay('ay_craft', 'ufo_stand', {'width': 36}, solids='box'),
)
