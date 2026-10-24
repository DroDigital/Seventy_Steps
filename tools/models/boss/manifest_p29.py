"""Pack 29, 'Ancient Ruins - Modular' by zacharykozak (Sketchfab, CC BY 4.0): a two-storey arcade of round arches in ruin, with a pier standing behind and rubble about it, one mesh. Bokrug's court takes the
arcade alone (the pier and the rubble cut away) down both its sides in the colonnade's place, reduced, with fallen arches where the rubble lay."""
from manifest import M, add
import sources as S

SRC = 'p29/scene.gltf'
# game x -430..380 and z -75..75 (Blender y is the game's -z): the arcade's own width and thickness
ARCADE = [((380, 0, 0), (-1, 0, 0)), ((-430, 0, 0), (1, 0, 0)), ((0, 75, 0), (0, -1, 0)), ((0, -75, 0), (0, 1, 0))]

add(
    M('ar_arcade', SRC, None, kit='p29', cls=S.STONE, classes={'.': S.STONE}, fit={'width': 20}, cut=ARCADE, decimate=1500, solids='box', textures=('p29/textures/',)),
)
