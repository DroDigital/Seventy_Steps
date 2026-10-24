"""Pack 40, 'PSX Dungeon' by Goblinatron (itch.io, CC BY 4.0): the crypt's furniture, the pillars broken and fallen, a chain, a chandelier, spikes, candles and
rubble, for the vaults and halls of the dungeons (round 74; the Outsider's ballroom, the Hound's tomb, the Voice's swamp, Curwen's catacombs)."""
from manifest import M, add
import sources as S

TEX = ('p40/Textures/',)
def pd(id, file, **kw):
    kw.setdefault('cls', S.STONE)
    return M(id, f'p40/Models/{file}.fbx', None, kit='p40', textures=TEX, classes={'.': kw['cls']}, **kw)

add(
    pd('pd_pillar_broken', 'Pillar_Collapsed_01', fit={'height': 3.4}, solids='box', round=True),
    pd('pd_pillar_fallen', 'Pillar_Collapsed_02', fit={'length': 5.0}, solids='box', round=True),
    pd('pd_chain', 'Chain', cls=S.METAL, fit={'height': 3.6}, solids='none'),
    pd('pd_chandelier', 'Chandelier', cls=S.METAL, fit={'width': 2.6}, solids='none'),
    pd('pd_spikes', 'Spikes', cls=S.METAL, fit={'width': 2.2}, solids='none'),
    pd('pd_candle_a', 'Candle_01', cls=S.BONE, fit={'height': 0.4}, solids='none', anchors=[(0.0, 0.42, 0.0)]),
    pd('pd_candle_b', 'Candle_02', cls=S.BONE, fit={'height': 0.5}, solids='none', anchors=[(0.0, 0.52, 0.0)]),
    pd('pd_debris', 'Debris', cls=S.ROCK, fit={'width': 2.2}, solids='none'),
)
