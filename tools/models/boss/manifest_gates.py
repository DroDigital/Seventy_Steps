"""The arenas' gates (docs/GATES.md; tools/models/gates/fetch.py fetches the sources into <work>/w01 and on): leaves of free models baked into
`src/data/models/gateIndex.ts` + `gatePack.ts`. A leaf is baked on its own, its footprint centred, so that its hinge is the edge of its box:
the `_l` of a pair has its hinge at its x0 (the left, seen from the front, +z), the `_r` at its x1. data/gateStyles.ts hangs them.

  w01  Large Iron Gate, Poly Haven, by Josh Dean (CC0): a wrought-iron double gate, arched, two leaves
  w02  Large Castle Door, Poly Haven, by Tina (CC0): an iron-bound plank double door in a timber frame
  w03  Namaqualand Boulder 03, Poly Haven, by Jenelle van Heerden and Dario Barresi (CC0): a block of sandstone
  w10  Castle Kit, Kenney (CC0): a portcullis
"""
from manifest import M, add
import sources as S

G = {'set': 'gate', 'solids': 'none'}

add(
    # iron: the metal class, so the arena's own dye takes the finish (black, rust, verdigris, a pale gilt)
    M('gate_iron_l', 'w01/large_iron_gate.gltf', 'large_iron_gate_left_door', kit='w01', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 3.0}, decimate=2600, textures=('w01/textures/',), **G),
    M('gate_iron_r', 'w01/large_iron_gate.gltf', 'large_iron_gate_right_door', kit='w01', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 3.0}, decimate=2600, textures=('w01/textures/',), **G),
    # planks: wood, and the straps and hinges (the dark faces) metal
    M('gate_timber_l', 'w02/large_castle_door.gltf', 'large_castle_door_left', kit='w02', cls=S.WOOD, classes={'.': S.WOOD}, metal_luma=0.13, fit={'height': 2.8}, decimate=1600, textures=('w02/textures/',), **G),
    M('gate_timber_r', 'w02/large_castle_door.gltf', 'large_castle_door_right', kit='w02', cls=S.WOOD, classes={'.': S.WOOD}, metal_luma=0.13, fit={'height': 2.8}, decimate=1600, textures=('w02/textures/',), **G),
    M('gate_timber_frame', 'w02/large_castle_door.gltf', 'large_castle_door_frame', kit='w02', cls=S.WOOD, classes={'.': S.WOOD}, metal_luma=0.13, fit={'height': 3.0}, textures=('w02/textures/',), **G),
    # a block of rock rolled into a ford
    M('gate_boulder', 'w03/namaqualand_boulder_03.gltf', None, kit='w03', cls=S.ROCK, classes={'.': S.ROCK}, fit={'length': 3.0}, decimate=1100, textures=('w03/textures/',), **G),
    # the castle kit's portcullis, its width along z in the file: turned to face +z
    M('gate_portcullis', 'w10/metal-gate.glb', None, kit='w10', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 3.0}, rot=90, **G),
)
