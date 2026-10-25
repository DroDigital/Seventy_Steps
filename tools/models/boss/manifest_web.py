"""Parts taken from free web sources for the arenas (round 78; docs/ARENA_MIXES.md, docs/WEB_PARTS.md): baked into `src/data/models/webIndex.ts` + `webPack.ts`, beside
the boss set and the gates', which they never touch. Every one is CC0 (credited all the same, src/data/models/CREDITS.md); the work dir holds a folder for each source,
named by its `kit` here:

  kenney      Kenney's kits (kenney.nl, CC0): graveyard, space, nature, tower defence, mini arena, city industrial; `GLB format/<name>.glb`
  quaternius  Quaternius's packs on OpenGameArt (CC0): the modular dungeon, the medieval village, the ultimate space kit; FBX
  oga         single models on OpenGameArt (CC0): a throne, a pyramid, an egg, a knight's statue

Only what a place stands is baked (tests/arenaSets.test.ts keeps every baked model stood by something). `tools/models/boss/inspect_source.py <file>` lists a source's objects and sizes.
"""
from manifest import M, add
import sources as S

W = {'set': 'web'}
K = 'kenney/'
Q = 'quaternius/'
O = 'oga/'
GY = K + 'graveyard-kit/GLB format/'
SP = K + 'space-kit/GLB format/'

add(
    # the dead: a coffin, a skeleton of six objects made one, a crypt, a cross (Simon Orne's plot, dug up)
    M('wk_coffin', GY + 'coffin-old.glb', None, kit='kenney', cls=S.WOOD, classes={'.': S.WOOD}, fit={'length': 2.1}, solids='box', **W),
    M('wk_skeleton', GY + 'character-skeleton.glb', None, kit='kenney', cls=S.BONE, classes={'.': S.BONE}, fit={'height': 1.8}, join=True, solids='none', **W),
    M('wk_crypt', GY + 'crypt-large.glb', None, kit='kenney', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 3.4}, solids='box', **W),
    M('wk_cross', GY + 'gravestone-cross-large.glb', None, kit='kenney', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 2.0}, solids='box', **W),
    # a hooded keeper in his robe, six objects made one (the sabbat on the Black Man's island)
    M('wk_keeper', GY + 'character-keeper.glb', None, kit='kenney', cls=S.CLOTH, classes={'.': S.CLOTH}, fit={'height': 2.1}, join=True, solids='box', **W),
    # the Gardner farm's meteorite, its crater and the crystals that grew where it lay
    M('wk_meteor', SP + 'meteor_detailed.glb', None, kit='kenney', cls=S.ROCK, classes={'.': S.ROCK}, fit={'width': 4.2}, solids='box', round=True, **W),
    M('wk_crater', SP + 'craterLarge.glb', None, kit='kenney', cls=S.ROCK, classes={'.': S.ROCK}, fit={'width': 12.0}, solids='none', **W),
    M('wk_crystals', SP + 'rock_crystalsLargeA.glb', None, kit='kenney', cls=S.GLOW, classes={'.': S.GLOW}, fit={'height': 2.8}, solids='box', **W),
    M('wk_crystal', K + 'tower-defense-kit/GLB format/detail-crystal-large.glb', None, kit='kenney', cls=S.GLOW, classes={'.': S.GLOW}, fit={'height': 3.2}, solids='box', **W),
    # Shub-Niggurath's young: mushrooms of her wood, tall and short, and an egg
    M('wk_mushroom_a', K + 'nature-kit/GLB format/mushroom_redTall.glb', None, kit='kenney', cls=S.WOOD, classes={'.': S.WOOD}, fit={'height': 1.7}, solids='none', **W),
    M('wk_mushroom_b', K + 'nature-kit/GLB format/mushroom_tanTall.glb', None, kit='kenney', cls=S.WOOD, classes={'.': S.WOOD}, fit={'height': 2.3}, solids='none', **W),
    M('wk_egg', O + 'strange-egg/Strange Egg.fbx', None, kit='oga', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 1.7}, solids='box', round=True, **W),
    M('wk_tree_spikes', Q + 'oga-ultimate-space-glb/Tree Spikes.glb', None, kit='quaternius', cls=S.WOOD, classes={'.': S.WOOD}, fit={'height': 7.0}, decimate=900, solids='trunk', **W),
    M('wk_tree_spiral', Q + 'oga-ultimate-space-glb/Tree Spiral.glb', None, kit='quaternius', cls=S.WOOD, classes={'.': S.WOOD}, fit={'height': 6.0}, solids='trunk', **W),
    # the stone people of the Gorgon's garden: a horse on its plinth, a knight kneeling, a small figure
    M('wk_horse', Q + 'oga-lowpoly-modular-dungeon-pack/.Updated Modular Dungeon - May 2019/FBX/Statue_Horse.fbx', None, kit='quaternius', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 4.0}, join=True, decimate=1100, solids='box', **W),
    M('wk_knight', O + 'knight-statue/knight_statue.blend', None, kit='oga', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 2.6}, join=True, decimate=700, solids='box', **W),
    M('wk_statue', K + 'mini-arena/GLB format/statue.glb', None, kit='kenney', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 2.6}, solids='box', **W),
    # a real well and a tall candelabrum
    M('wk_well', Q + 'oga-lowpoly-medieval-village-pack/Medieval Village Pack - Dec 2020/Props/FBX/Well.fbx', None, kit='quaternius', cls=S.STONE, classes={'wood|bag|roof': S.WOOD, '.': S.STONE}, fit={'height': 2.6}, decimate=1100, solids='box', round=True, **W),
    M('wk_candelabrum', Q + 'oga-modular-dungeon/Modular Dungeon by @Quaternius/FBX/Candelabrum_tall.fbx', None, kit='quaternius', cls=S.METAL, classes={'candle': S.BONE, '.': S.METAL}, fit={'height': 2.2}, decimate=700, solids='box', anchors=[(0, 2.28, 0), (0.46, 1.98, 0), (-0.46, 1.98, 0), (0, 1.98, 0.42), (0, 1.98, -0.42)], **W),
    # the keep's laboratory: a generator, a ring of pipe, a tank
    M('wk_generator', SP + 'machine_generatorLarge.glb', None, kit='kenney', cls=S.METAL, classes={'.': S.METAL}, fit={'width': 3.0}, solids='box', **W),
    M('wk_pipe_ring', SP + 'pipe_ringHigh.glb', None, kit='kenney', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 3.4}, solids='box', **W),
    M('wk_tank', K + 'city-kit-industrial/GLB format/detail-tank-large.glb', None, kit='kenney', cls=S.METAL, classes={'.': S.METAL}, fit={'height': 2.8}, solids='box', round=True, **W),
    # the King's seat on Hastur's stage, and the Black Pharaoh's pyramid beyond the walls
    M('wk_throne', O + 'opendungeons-barbarian-throne/BarbarianThrone.blend', None, kit='oga', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 4.6}, solids='box', **W),
    M('wk_pyramid', O + 'pyramid-3d/pyramid-3d__piramid.blend', None, kit='oga', cls=S.STONE, classes={'.': S.STONE}, fit={'height': 26.0}, join=True, decimate=1400, solids='none', **W),
)
