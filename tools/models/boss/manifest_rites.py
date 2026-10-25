"""Forms made in code for the places rebuilt in round 75 (proc_rites.py): a monolith, a cairn, a spire and a dais; a raft of pipes, a drum and chimes; an armillary,
a cluster of globes, a helix and a crystal; the Elder Thing's barrel and a star. They stand where no pack has the shape; their licence is this repository's."""
from manifest import M, add

def px(id, name, **kw):
    return M(id, f'proc:{name}', kit='proc', **kw)

add(
    px('px_monolith', 'monolith', args={'height': 12.0, 'base': 2.2}, solids='box'),
    px('px_cairn', 'cairn', args={'height': 2.4}, solids='box', round=True),
    px('px_spire', 'spire', args={'height': 14.0, 'base': 1.4}, solids='box', round=True),
    px('px_dais', 'dais', args={'radius': 5.0}, solids='none'),
    px('px_panpipe', 'panpipe', args={'count': 7, 'height': 8.0, 'width': 0.5}, solids='box'),
    px('px_drum', 'drum', args={'radius': 1.6}, solids='box', round=True),
    px('px_chimes', 'chimes', args={'height': 6.0, 'width': 4.0}, solids=[(-2.0, 0, 0.2, 0.2, 0, 6.0), (2.0, 0, 0.2, 0.2, 0, 6.0)]),
    px('px_armillary', 'armillary', args={'radius': 3.0}, solids='box', round=True),
    px('px_globes', 'globes', args={'radius': 1.4}, solids='box', round=True),
    px('px_helix', 'helix', args={'height': 10.0, 'radius': 0.9}, solids='box', round=True),
    px('px_shard', 'shard', args={'height': 6.0}, solids='box'),
    px('px_barrel', 'barrel', args={'height': 6.0, 'radius': 1.4}, solids='box', round=True),
    px('px_star', 'star', args={'radius': 4.0, 'thick': 0.5}, solids='box'),
)
