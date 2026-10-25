"""The colours the investigator is made of: src/render/palette.ts's BASE (read from tools/player/build/game.json, which export_data.mjs writes from the game
itself) and the multipliers src/render/investigator.ts puts on them, so a part is the colour the game gave it before and the lights see no new value."""
import json, os
import numpy as np
from kit import mix, shade

HERE = os.path.dirname(os.path.abspath(__file__))
GAME = json.load(open(os.path.join(HERE, 'build', 'game.json')))
BASE = {k: np.array(v, float) for k, v in GAME['base'].items()}
LANTERN = np.array(GAME['lantern'], float)

charcoal, bone, rust, sea = BASE['charcoal'], BASE['bone'], BASE['rust'], BASE['seaGrey']

COAT = shade(mix(charcoal, sea, 0.1), 2)
FACING = shade(COAT, 0.78)
SLEEVE = shade(mix(charcoal, sea, 0.3), 2)
DARK = shade(charcoal, 2)
PALE = shade(bone, 1.3)
SHIRT = shade(bone, 1.3)
LEATHER = shade(mix(rust, charcoal, 0.45), 1.7)
BRASS = shade(mix(bone, rust, 0.4), 1.4)
SCARF = shade(mix(rust, charcoal, 0.2), 1.6)
SILVER = shade(bone, 1.25)
HAIR = shade(mix(charcoal, rust, 0.3), 1.4)
STEEL = shade(bone, 1.15)
