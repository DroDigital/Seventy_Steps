"""Pack 46, 'Lab Assets' by MilkAndBanana (OpenGameArt, CC0 1.0): a retort, a Florence flask, a round-bottomed flask, a reagent bottle, a ring stand, a Bunsen burner and a microscope,
none of the counters, electronics or safety gear, the glass taken to a dusty amber and grey for the alchemist's cellars, Curwen's laboratory and the cellar of the Shunned House (round 74)."""
from manifest import M, add
import sources as S

F = 'p46/FBX/Tubes and Flasks/Flasks/bottle_glassware_'
def lb(id, path, **kw):
    kw.setdefault('cls', S.BONE)
    return M(id, 'p46/FBX/' + path + '.fbx', None, kit='p46', classes={'.': kw['cls']}, solids='none', **kw)

AMBER, GREY = (0.42, 0.3, 0.12), (0.38, 0.4, 0.38)
add(
    lb('lb_retort', 'Tubes and Flasks/Flasks/bottle_glassware_retort_flask_large', fit={'length': 0.9}, recolour=AMBER),
    lb('lb_florence', 'Tubes and Flasks/Flasks/bottle_glassware_florence_flask_large', fit={'height': 0.75}, recolour=GREY),
    lb('lb_round', 'Tubes and Flasks/Flasks/bottle_glassware_round_bottom_flask_large', fit={'height': 0.7}, recolour=AMBER),
    lb('lb_reagent', 'Tubes and Flasks/Flasks/bottle_glassware_reagent_bottle_large', fit={'height': 0.7}, recolour=GREY),
    lb('lb_stand', 'Heating Equipment/heating_equipment_ring_stand', cls=S.METAL, fit={'height': 1.1}),
    lb('lb_burner', 'Heating Equipment/heating_equipment_bunsen_burner', cls=S.METAL, fit={'height': 0.6}),
    lb('lb_microscope', 'Machines/machine_microscope', cls=S.METAL, fit={'height': 0.8}),
)
