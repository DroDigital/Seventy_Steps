"""Pack 38, 'Museum Showcase - Die Vitrine' by Samuel Francis Johnson (Oneironauticus) (Sketchfab, CC BY 4.0): a period wooden vitrine; its glass is left out, so the case stands open on the wax figures of the Mi-Go's museum."""
from manifest import M, add
import sources as S

add(
    M('mg_case', 'p38/scene.gltf', None, kit='p38', textures=('p38/textures/',), cls=S.WOOD, classes={'.': S.WOOD}, fit={'height': 2.6}, drop=['Architectural_Glass'], solids='box'),
)
