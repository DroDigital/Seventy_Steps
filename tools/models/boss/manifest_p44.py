"""Pack 44, "Kyle's Mushroom Pack" by Kyle Fuji (itch.io, CC0 1.0): a turkey tail, a reishi, a blue oyster, a morel and a lantern mushroom, grown to the height of a man's knee and more,
for the black caverns of Tsath and the cities of the Mi-Go (round 77)."""
from manifest import M, add
import sources as S

TEX = ('p44/Materials/Textures/', 'p44/Materials/')
def mu(id, path, **kw):
    kw.setdefault('cls', S.BONE)
    return M(id, f'p44/Models/{path}.glb', None, kit='p44', textures=TEX, classes={'.': kw['cls']}, solids='none', **kw)

add(
    mu('mu_bracket', 'Turkey Tails/turkey_tail_3', fit={'width': 1.1}, recolour=(0.32, 0.28, 0.35)),
    mu('mu_reishi', 'Reishis/reishi_4', fit={'width': 1.3}, recolour=(0.36, 0.2, 0.17)),
    mu('mu_oyster', 'Oysters Blue/oyster_blue_1', fit={'width': 0.9}, recolour=(0.31, 0.38, 0.43)),
    mu('mu_morel', 'Morels/morel_1', fit={'height': 0.8}, recolour=(0.35, 0.29, 0.21)),
    mu('mu_lantern', "Jack o' Lanterns/jack_o_lantern_3", cls=S.GLOW, fit={'width': 0.9}),
)
