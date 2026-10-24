"""Pack 25, 'Low Poly Black Castle' by Bl4ckGh0st (Sketchfab, CC BY 4.0): a castle of black stone, a body with a stair and four corner towers, in modular pieces. Edward Hutchinson's donjon (the
keep at the back of the bailey), its interior floors and the ground it stood on left out and each of its pieces reduced, the whole sized to the keep."""
from manifest import M, add
import sources as S

add(
    M('hc_castle', 'p25/scene.gltf', r'(?!Stone_Floor|Ground_Plane).*', kit='p25', cls=S.STONE, classes={'.': S.STONE}, fit={'width': 30}, decimate=40, solids='box'),
)
