"""Material separation for the reviewed creature and ally art.

Read the source colours before painting. A creature supplies a base surface, while its
colour ramps and anatomical regions distinguish adjoining surfaces of similar colour.
x and y are pixel centres in the unmirrored pose's tight bounds, normalised to 0..1.
"""

import numpy as np


MATERIALS = ('hide', 'flesh', 'bone', 'scale', 'chitin', 'membrane', 'slime', 'fur',
             'feather', 'cloth', 'leather', 'metal', 'stone', 'spectral', 'wood')
MAT = {name: i for i, name in enumerate(MATERIALS)}

# Use the actual painted form, including its distinct variants. A newly added
# creature must choose a surface before it can be baked.
_BASE_GROUPS = {
    'hide': '''ghoul ghoul#eldritch pickman ghast zoog wamp moon_beast night_gaunt
               being_of_ib exham_troglodyte winged_hybrid star_spawn elder_thing
               yithian yithian_archivist haunter_of_the_dark cthulhu tsathoggua
               thousand_young''',
    'flesh': '''ym_bhi flying_polyp#boss dhole wilbur_whateley dunwich_horror
                curwen_pit_thing lilith high_priest#eldritch ghatanothoa nug
                other_gods azathoth nyarlathotep#eldritch''',
    'bone': 'the_hound daemon_pipers',
    'scale': '''deep_one deep_one#eldritch gnorri serpent_man serpent_man#eldritch
                nameless_city_reptile venusian_man_lizard child_of_yig bokrug yig
                father_dagon mother_hydra martins_beach_horror tritons''',
    'chitin': '''mi_go mi_go#eldritch whisperer#eldritch flying_polyp yekubian
                 rhan_tegoth yeb''',
    'slime': '''shoggoth shoggoth#boss formless_spawn being_from_beyond the_unnamable
                shunned_house_entity''',
    'fur': '''cat_from_saturn cats_of_ulthar gyaa_yothn martense_degenerate gnoph_keh
              beast_in_the_cave brown_jenkin rat_swarm gug''',
    'feather': 'albino_penguin shantak',
    'cloth': '''innsmouth_hybrid innsmouth_hybrid#eldritch dagon_priest
                dagon_priest#eldritch cthulhu_cultist man_of_leng kn_yan_dweller
                reanimated_corpse hybrid_mummy keziah_mason black_man joseph_curwen
                simon_orne edward_hutchinson ephraim_waite ephraim_waite#eldritch
                whisperer voice_in_the_tomb high_priest dr_munoz charles_le_sorcier
                medusa_gorgon hypnos the_outsider terrible_old_man hastur umr_at_tawil
                ancient_ones nyarlathotep nasht_kaman_thah nodens moon_bog_wraith''',
    'metal': 'great_ones',
    'stone': 'colossus_pyramids zkauba',
    'spectral': 'colour_out_of_space algol_light_being zann_window_thing yog_sothoth',
    'wood': 'shub_niggurath',
}
BASE = {key: MAT[material] for material, keys in _BASE_GROUPS.items() for key in keys.split()}

# Bare-faced figures with coats, gloves or boots that share a single near-neutral
# palette: select the lighter skin ramp only inside the head / hand regions.
_COATS = {
    'innsmouth_hybrid': ('scale', 48), 'innsmouth_hybrid#eldritch': ('scale', 48),
    'reanimated_corpse': ('flesh', 64), 'ephraim_waite': ('hide', 52),
    'ephraim_waite#eldritch': ('flesh', 48), 'simon_orne': ('hide', 65),
    'hypnos': ('hide', 116), 'dr_munoz': ('hide', 118),
    'terrible_old_man': ('hide', 108), 'the_outsider': ('flesh', 60),
    'medusa_gorgon': ('hide', 56), 'kn_yan_dweller': ('hide', 68),
    'joseph_curwen': ('hide', 91),
}


def material_map(key, direction, rgba, x, y):
    """Return H×W uint8 MATERIALS ids. The caller masks out transparent texels."""
    mat = np.full(rgba.shape[:2], BASE[key], dtype=np.uint8)
    r, g, b = rgba[..., :3].astype(np.int16).transpose(2, 0, 1)
    light = (r * 2 + g * 5 + b) / 8
    frontal = direction == 'front'
    profile = direction in ('left', 'right')
    side = np.abs(x - 0.5)
    # The centres of a bent head, hand and breastplate move from pose to pose.
    # Pair their approximate positions with paint values, so a garment passing
    # through the same region does not acquire its neighbour's detail.
    if key in _COATS:
        skin, threshold = _COATS[key]
        head = (y < 0.22) & ((side < 0.30) | profile)
        hand = (y > 0.43) & (y < 0.71) & ((side > 0.30) | (profile & (side > 0.16)))
        bare = (head | hand) & (light > threshold)
        mat[bare] = MAT[skin]
        if key == 'medusa_gorgon':
            mat[(y < 0.38) & (~bare | (side > 0.14))] = MAT['scale']
        if key == 'the_outsider':
            mat[bare & (light > 132)] = MAT['bone']
        if key == 'kn_yan_dweller':
            mat[(r - b > 34) & (light > 95) & ~bare] = MAT['metal']
        if key == 'joseph_curwen':
            braid = (r > 1.25 * b) & (g > 1.12 * b) & (r > 86)
            mat[braid & ~bare & (y > 0.18) & (y < 0.65)] = MAT['metal']
        if key != 'reanimated_corpse':
            mat[(y > 0.9) & (light < threshold)] = MAT['leather']
        else:
            mat[(y > 0.91) & (light > 55)] = MAT['flesh']
    elif key in ('high_priest', 'high_priest#eldritch', 'nyarlathotep'):
        # The gold mask, coronet, filigree and chains are a distinct yellow ramp
        # from both the priest's blue cassock and the pharaoh's black-purple robe.
        mat[(r > 40) & (r > b * 1.46) & (g > b * 1.17)] = MAT['metal']
    elif key == 'man_of_leng':
        mat[(r - b < 22) & (light > 46)] = MAT['hide']
        mat[(y < 0.23) & (side > 0.16) & (light > 100)] = MAT['bone']
    elif key in ('dagon_priest', 'dagon_priest#eldritch'):
        mat[(r - b > 18) & (y > 0.19) & (side < 0.25) & frontal] = MAT['leather']
    elif key == 'hybrid_mummy':
        mat[(y < 0.20) & (light < 89)] = MAT['scale']
    elif key == 'keziah_mason':
        mat[((y < 0.19) | ((side > 0.28) & (y > 0.36) & (y < 0.68))) & (light > 68)] = MAT['hide']
    elif key in ('ancient_ones', 'voice_in_the_tomb', 'moon_bog_wraith'):
        mat[(y < 0.27) & (side < 0.22) & (light < 48) & frontal] = MAT['spectral']
    elif key == 'hastur':
        mat[(y > 0.65) & (r > 1.32 * g) & (light < 99)] = MAT['flesh']
    elif key == 'whisperer':
        # The dark, neutral slats of the chair surround the warm grey wrappings.
        mat[(abs(r - b) < 5) & (light < 83) & ((side > 0.24) | (direction == 'back'))] = MAT['wood']
    elif key == 'nodens':
        mat[(y < 0.34) & (side < 0.24) & (light > 93)] = MAT['fur']
        mat[(y > 0.88) & (light < 66)] = MAT['leather']
    elif key == 'nasht_kaman_thah':
        mat[(y > 0.11) & (y < 0.24) & (light > 130) & frontal] = MAT['hide']
    elif key in ('mi_go', 'mi_go#eldritch', 'whisperer#eldritch',
                 'haunter_of_the_dark', 'winged_hybrid', 'night_gaunt', 'the_hound'):
        # Wing tips lie outside the torso front/back. In profile the membrane sits
        # behind the shoulder; side sprites are physical source views, not mirrors.
        rear = x > 0.47 if direction == 'left' else x < 0.53
        wing = (side > 0.18 + 0.07 * y) if not profile else rear
        mat[wing & (y < (0.60 if key != 'haunter_of_the_dark' else 0.79))] = MAT['membrane']
    elif key == 'shantak':
        mat[(y > 0.82) & (light > 32)] = MAT['scale']
    elif key in ('cthulhu', 'star_spawn'):
        mat[(side > 0.23) & (y < 0.39) & (light < 128)] = MAT['membrane']
        beard = (side / 0.22) ** 2 + ((y - 0.35) / 0.24) ** 2
        if key == 'cthulhu':
            mat[frontal & (r - g > 2) & (light > 55 + 65 * beard)] = MAT['flesh']
        else:
            mat[frontal & (light > 48 + 42 * beard)] = MAT['flesh']
        mat[(y > 0.68) & (light > (163 if key == 'cthulhu' else 128))] = MAT['bone']
    elif key in ('father_dagon', 'mother_hydra', 'deep_one', 'deep_one#eldritch', 'tritons'):
        mat[frontal & (side < 0.26) & (y > 0.25) & (y < 0.67) & (r >= g - 2) & (light > 83)] = MAT['hide']
        if key == 'tritons':
            # Pearl / conch held at the abdomen: a pale ochre ramp distinct from green hands.
            mat[(r > g + 6) & (r - b > 26) & (light > 125)] = MAT['bone']
    elif key in ('ghoul', 'ghoul#eldritch', 'pickman'):
        mat[(y > 0.76) & (light > 99) & (r > g)] = MAT['bone']
    elif key == 'ghast':
        mat[(y > 0.81) & (light < 79)] = MAT['chitin']
    elif key in ('serpent_man#eldritch', 'yig', 'martins_beach_horror'):
        mat[frontal & (side < 0.23) & (light > 72) & (y > 0.29)] = MAT['hide']
    elif key in ('gnorri', 'venusian_man_lizard'):
        tendrils = (side / 0.24) ** 2 + ((y - 0.42) / 0.23) ** 2
        if key == 'gnorri':
            mat[frontal & (g - r < 12) & (light > 43 + 42 * tendrils)] = MAT['flesh']
        else:
            mat[frontal & (light > 26 + 25 * tendrils)] = MAT['flesh']
    elif key == 'moon_beast':
        mat[(r - g > 8) & (b > g)] = MAT['flesh']
    elif key in ('being_of_ib', 'rat_swarm'):
        mat[(r > 1.22 * g) & (r - g > 8)] = MAT['flesh']
    elif key == 'gyaa_yothn':
        mat[(y < 0.69) & (light < 81)] = MAT['chitin']
    elif key in ('exham_troglodyte', 'beast_in_the_cave', 'serpent_man'):
        mat[(y > 0.48) & (y < 0.80) & (side < 0.25) & (light < 81)] = MAT['leather']
    elif key == 'brown_jenkin':
        mat[(r - b > 25) & (light > 59) & ((y < 0.57) | (side > 0.30))] = MAT['hide']
    elif key in ('bokrug', 'ym_bhi', 'nug', 'dhole', 'dunwich_horror'):
        # An actual ivory paint stop, as distinct from the red wounds and purple ridges.
        mat[(light > 147) & (g > r * 0.77) & (b > r * 0.60)] = MAT['bone']
    elif key in ('yeb', 'nyarlathotep#eldritch'):
        # Cartilage crest/plates over raw red legs and belly.
        plated = (r - b > 12) & (g > (r + b) * 0.48)
        mat[plated] = MAT['chitin']
        mat[~plated & (r - g > 6)] = MAT['flesh']
    elif key in ('shub_niggurath', 'wilbur_whateley'):
        mat[(r - g > 7) & (g - b < r - g)] = MAT['flesh']
        if key == 'wilbur_whateley':
            mat[(r > 1.34 * g) & (g > 1.35 * b)] = MAT['leather']
    elif key in ('azathoth', 'flying_polyp#boss', 'other_gods', 'ghatanothoa'):
        mat[(light < 65) & (b >= g) & (r > g)] = MAT['slime']
    elif key in ('zann_window_thing', 'being_from_beyond'):
        mat[(y > 0.65) & (light < 86)] = MAT['flesh']
    elif key == 'daemon_pipers':
        mat[(light < 67) & (b >= g - 4)] = MAT['leather']
        mat[(r > 1.21 * b) & (r > 85) & (side > 0.24) & (y < 0.51)] = MAT['wood']
    elif key == 'great_ones':
        mat[(light > 95) & (r - b < r * 0.26)] = MAT['hide']
        mat[(y > 0.79) & (light < 88)] = MAT['leather']
    elif key == 'yithian_archivist':
        mat[(r - g > 18) & (r > 1.4 * b) & (y < 0.58)] = MAT['chitin']
    return mat
