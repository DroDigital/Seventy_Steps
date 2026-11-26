"""Landmarks for larger painted anatomy. Positions are in the tight idle canvas.

The material pass supplies fine texture everywhere. These placements distinguish
anatomy such as a spawn's sucker from a serpent's belly and a priest's vestments.
Each declaration names the materials the decal can touch.
"""

# Sheet cell, center x/y, width and height relative to the body, opacity, eligible materials.
GILLS = (0, .34, .40, .39, .27, .80, 'scale hide')
GILLS_OPPOSITE = (0, .68, .43, -.30, .22, .65, 'scale hide')
RIBS = (2, .53, .47, .48, .37, .78, 'flesh hide bone')
SORES = (3, .57, .53, .43, .37, .70, 'hide flesh slime scale')
PLATES = (4, .56, .49, .56, .42, .58, 'chitin flesh')
VEINS = (5, .23, .30, .49, .52, .69, 'membrane')
VEINS_OPPOSITE = (5, .78, .31, -.49, .52, .67, 'membrane')
OCELLI = (7, .64, .51, .41, .42, .61, 'flesh hide slime chitin')
STITCH = (8, .52, .58, .40, .45, .56, 'cloth leather')
CLASP = (9, .50, .34, .37, .25, .63, 'cloth leather metal')
MARROW = (10, .55, .48, .49, .43, .56, 'bone flesh')
QUILLS = (11, .72, .39, .43, .59, .61, 'feather')
TENDONS = (12, .50, .46, .39, .48, .76, 'flesh hide')
SHELL = (13, .60, .40, .48, .40, .66, 'stone scale hide chitin')
WISP = (14, .58, .53, .60, .56, .51, 'spectral')
BARK = (15, .53, .55, .44, .55, .60, 'wood')

FRONT = {}
for creatures, marks in [
    ('deep_one deep_one#eldritch father_dagon mother_hydra tritons', (GILLS, GILLS_OPPOSITE)),
    ('gnorri bokrug martins_beach_horror being_of_ib', (GILLS, SHELL)),
    ('innsmouth_hybrid innsmouth_hybrid#eldritch', (STITCH, (0, .40, .25, .24, .20, .66, 'hide scale'))),
    ('ym_bhi exham_troglodyte lilith', (RIBS, (12, .69, .63, .28, .32, .60, 'flesh hide'))),
    ('reanimated_corpse the_outsider', (
        (2, .52, .42, .39, .27, .83, 'cloth flesh'),
        (8, .59, .44, .39, .33, .57, 'cloth'),
    )),
    ('ghoul ghoul#eldritch pickman ghast gnoph_keh', ((3, .38, .46, .30, .28, .67, 'hide'), TENDONS)),
    ('zoog wamp beast_in_the_cave brown_jenkin gug martense_degenerate', (SORES,)),
    ('mi_go mi_go#eldritch winged_hybrid night_gaunt haunter_of_the_dark', (VEINS, VEINS_OPPOSITE, PLATES)),
    ('the_hound', (VEINS, VEINS_OPPOSITE, MARROW)),
    ('shantak albino_penguin', (QUILLS,)),
    ('elder_thing flying_polyp yekubian thousand_young whisperer#eldritch rhan_tegoth', (PLATES,)),
    ('shoggoth shoggoth#boss formless_spawn shunned_house_entity', (SORES, (7, .28, .64, .34, .44, .54, 'slime'))),
    ('wilbur_whateley flying_polyp#boss curwen_pit_thing yeb', (TENDONS, OCELLI)),
    ('dunwich_horror', ((7, .30, .51, .39, .28, .54, 'flesh'), (7, .65, .66, -.38, .30, .50, 'flesh'))),
    ('dhole nug', ((6, .50, .32, .46, .40, .57, 'flesh bone hide'), SORES)),
    ('azathoth', ((6, .64, .63, .31, .46, .56, 'flesh slime'), (12, .38, .49, -.32, .41, .57, 'flesh'))),
    ('shub_niggurath', ((6, .49, .54, .34, .38, .68, 'flesh wood'), BARK)),
    ('nyarlathotep#eldritch ghatanothoa other_gods', ((1, .50, .49, .36, .46, .67, 'flesh slime'), TENDONS)),
    ('cthulhu star_spawn', ((12, .54, .61, .37, .30, .58, 'flesh hide'), SORES)),
    ('colossus_pyramids', (SHELL, (13, .34, .64, -.31, .35, .48, 'stone'))),
    ('tsathoggua moon_beast gyaa_yothn nameless_city_reptile', (SORES,)),
    ('dagon_priest dagon_priest#eldritch high_priest nyarlathotep great_ones kn_yan_dweller', (CLASP, STITCH)),
    ('cthulhu_cultist man_of_leng keziah_mason edward_hutchinson charles_le_sorcier black_man umr_at_tawil ancient_ones hastur hybrid_mummy nasht_kaman_thah', (STITCH,)),
    ('moon_bog_wraith voice_in_the_tomb colour_out_of_space algol_light_being zann_window_thing being_from_beyond', (WISP,)),
    ('daemon_pipers high_priest#eldritch', (MARROW, CLASP)),
    ('serpent_man serpent_man#eldritch venusian_man_lizard child_of_yig yig', (SHELL,)),
]:
    for creature in creatures.split():
        FRONT[creature] = marks

# A front-facing mouth or clasp should not migrate to the back. Redress the same
# surface with a smaller secondary detail on the side and back poses.
SECONDARY = {
    'hide': SORES, 'flesh': TENDONS, 'bone': MARROW, 'scale': SHELL,
    'chitin': PLATES, 'membrane': VEINS, 'slime': SORES, 'feather': QUILLS,
    'cloth': STITCH, 'leather': STITCH, 'stone': SHELL, 'spectral': WISP, 'wood': BARK,
}
