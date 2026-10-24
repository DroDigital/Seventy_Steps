"""Pack 51, 'Prayer Wheel' by Özlem Çandır (Sketchfab, CC BY 4.0): a wheel on its handle, stood upright on its handle, a drum on a post, on the floor of Leng's monastery (round 74)."""
from manifest import M, add
import sources as S

add(
    M('pw_wheel', 'p51/scene.gltf', None, kit='p51', textures=('p51/textures/',), cls=S.METAL, classes={'.': S.METAL}, fit={'height': 1.5}, rz=90, solids='trunk', round=True),
)
