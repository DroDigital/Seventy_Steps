"""Forms made in code (proc.py): a lightning mast, a chimney's stack, obelisks, fangs, a mask on its pole, a trough of slime, a bollard, a sphere and a ring of
light, a brazier. They stand where no pack has the shape; their licence is this repository's."""
from manifest import M, add

def px(id, name, kit='proc', **kw):
    return M(id, f'proc:{name}', kit=kit, **kw)

add(
    px('px_rod', 'rod', args={'height': 12.0}, solids='box'),
    px('px_chimney', 'chimney', args={'height': 9.0, 'width': 1.8}, solids='box'),
    px('px_obelisk', 'obelisk', args={'height': 12.0, 'base': 1.6}, solids='box'),
    px('px_obelisk_s', 'obelisk', args={'height': 5.0, 'base': 0.9}, solids='box'),
    px('px_fang', 'fang', args={'height': 3.0, 'base': 0.5, 'bend': 0.45}, solids='box'),
    px('px_fang_big', 'fang', args={'height': 7.0, 'base': 1.1, 'bend': 0.5}, solids='box'),
    px('px_mask', 'mask', solids='none'),
    px('px_trough', 'trough', args={'length': 4.0, 'width': 1.2, 'depth': 0.5}, solids='none'),
    px('px_bollard', 'bollard', solids='box', round=True),
    px('px_sphere', 'sphere', args={'radius': 1.0}, solids='box', round=True),
    px('px_ring', 'ring', args={'radius': 3.0, 'tube': 0.22}, solids='none'),
    px('px_hull', 'hull', args={'length': 9.0, 'beam': 3.0}, solids='box'),
    px('px_mast', 'mast', args={'height': 9.0}, solids='box', round=True),
    px('px_derrick', 'derrick', args={'height': 8.0, 'reach': 4.5}, solids='box'),
    px('px_anchor', 'anchor', args={'height': 2.6}, solids='box', round=True),
    px('px_dune', 'dune', args={'width': 12.0, 'height': 3.0, 'depth': 8.0}, solids='none'),
    px('px_well', 'well', args={'radius': 0.95}, solids='box', round=True),
    px('px_brazier', 'brazier', args={'height': 1.2}, solids='box', round=True, anchors=[(0.0, 1.4, 0.0)]),
    px('px_hedge', 'hedge', args={'length': 4.0, 'height': 9.0, 'depth': 2.6}, solids=[(0, 0, 2.1, 1.3, 0, 8.4)]),
    px('px_pod', 'pod', args={'radius': 0.6}, solids='none'),
    px('px_root', 'root', args={'span': 7.0, 'height': 3.4, 'radius': 0.55}, solids='none'),
    px('px_serpent', 'serpent', args={'length': 8.0, 'radius': 2.2}, solids='box'),
    px('px_slab', 'slab', args={'width': 5.0, 'height': 7.0, 'thick': 1.6, 'lean': 0.1}, solids='box'),
    px('px_prism', 'prism', args={'radius': 1.4, 'height': 6.0}, solids='box', round=True),
    px('px_collar', 'collar', args={'radius': 0.9}, solids='none'),
)
