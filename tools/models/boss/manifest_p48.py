"""Pack 48, 'Modular Cave Kit' by Kenney (kenney.nl, CC0 1.0): its rock gate and its barred gate, taken singly, for the mouths of Nkai and the Elder City and the pens of Curwen's catacombs (round 79)."""
from manifest import M, add
import sources as S

def kc(id, file, **kw):
    kw.setdefault('cls', S.ROCK)
    return M(id, f'p48/glb/{file}.glb', None, kit='p48', textures=('p48/glb/Textures/',), classes={'.': kw['cls']}, **kw)

add(
    kc('kc_gate_rock', 'gate-rock', fit={'width': 5.0}, solids='auto'),
    kc('kc_gate_bars', 'gate-metal-bars', cls=S.METAL, fit={'width': 4.4}, solids='auto'),
)
