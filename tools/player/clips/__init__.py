"""Every clip of the investigator, gathered from the modules below (each has `build() -> [Clip]`); animate.py keys them, clipbake.py bakes them.

A clip's id is what the game looks up: `<weapon>.<move>` for a blow, parry or anything that depends on what is in the hand, else the move's own name (`roll`, `reload`);
the carried gaits are `idle`, `walk`, `run`, `sprint` and the guard's overlay `guard` (docs/PLAYER.md).
"""
import importlib

MODULES = ['locomotion', 'cane', 'axe', 'razor', 'cutlass', 'rapier', 'actions', 'reactions']


def all_clips(only=None):
    out = []
    for name in MODULES:
        try:
            mod = importlib.import_module(f'clips.{name}')
        except ModuleNotFoundError as e:
            if e.name == f'clips.{name}':
                continue
            raise
        out += mod.build()
    if only:
        out = [c for c in out if any(c.id == o or c.id.startswith(o + '.') for o in only)]
    ids = [c.id for c in out]
    assert len(ids) == len(set(ids)), f'two clips with one id: {sorted(i for i in ids if ids.count(i) > 1)}'
    return out
