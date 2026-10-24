"""Pack 33, 'Brain in a Jar' by Mad_Lobster_Workshop (Sketchfab, CC BY 4.0): a glass jar and its brain, the jar's glass left out so the brain is seen between its lid and its base, stood on racks for the Whisperer's galleries and the museum of the Mi-Go."""
from manifest import M, add
import sources as S

add(
    M('mg_jar', 'p33/scene.gltf', None, kit='p33', textures=('p33/textures/',), cls=S.BONE, classes={'.': S.BONE}, fit={'height': 1.2}, drop_alpha=0.62, solids='box', round=True),
)
