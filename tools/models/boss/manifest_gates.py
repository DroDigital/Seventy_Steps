"""The arenas' gates (docs/GATES.md; tools/models/gates/fetch.py fetches the sources into <work>/w01 and on): leaves of free models baked into
`src/data/models/gateIndex.ts` + `gatePack.ts`. A leaf is baked on its own, its footprint centred, so that its hinge is the edge of its box:
the `_l` of a pair has its hinge at its x0 (the left, seen from the front, +z), the `_r` at its x1. data/gateStyles.ts hangs them.

  w01  Large Iron Gate, Poly Haven, by Josh Dean (CC0): a wrought-iron double gate, arched, two leaves
  w02  Large Castle Door, Poly Haven, by Tina (CC0): an iron-bound plank double door in a timber frame
  w03  Namaqualand Boulder 03, Poly Haven, by Jenelle van Heerden and Dario Barresi (CC0): a block of sandstone
  w10  Castle Kit, Kenney (CC0): a portcullis
  w20  Aztec Double-Headed Serpent for printing, corentin (CC BY 4.0, Sketchfab): two half-arches, each ending in a carved, fanged head; Yig's gate is one head
  w21  Demons Gate, Trockk (CC BY 4.0, Sketchfab): a ring of long spikes about an open middle; the corona of a cosmic gate
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
    # Yig's head: the head of one half of the serpent, cut from its neck and its coil (blender-space planes: behind z 31.5, under y 8.5, the other half), the cut closed, the
    # three chunks the viewer split it into made one (so the weld and the decimation see it whole); the snout toward +x as the gate is seen from the court
    M('gate_yig_head', 'w20/scene.gltf', None, kit='w20', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 6.0}, rot=90, join=True, cap=True, decimate=8000,
      cut=[((0, -31.5, 0), (0, -1, 0)), ((0, 0, 8.5), (0, 0, 1)), ((5, 0, 0), (1, 0, 0))], **G),
    # a ring of spikes facing the court, its plane across the opening; the gate's own colour is laid over it
    M('gate_demon_ring', 'w21/scene.gltf', None, kit='w21', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 4.0}, decimate=6000, join=True, **G),
    # the same ring in two halves, cut down its middle (its centre, x 24.05 in the source) and closed, each to slide off with a leaf: `_l` the half on the left seen from the court
    M('gate_demon_ring_l', 'w21/scene.gltf', None, kit='w21', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 4.0}, decimate=3500, join=True, cap=True, cut=[((24.05, 0, 0), (-1, 0, 0))], **G),
    M('gate_demon_ring_r', 'w21/scene.gltf', None, kit='w21', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 4.0}, decimate=3500, join=True, cap=True, cut=[((24.05, 0, 0), (1, 0, 0))], **G),
)
