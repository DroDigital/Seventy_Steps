"""Builds creatures' models in Blender (docs/MODELS.md):

    blender -b --factory-startup -P tools/blender/build.py -- deep_one ghast [--preview] [--view side]
    blender -b --factory-startup -P tools/blender/build.py -- --all

Each id runs `tools/blender/creatures/<id>.py`'s `build(kit)` with what the game says of it
(tools/blender/timing.json), checks it, writes `public/models/<id>.glb` and, with `--preview`, its
contact sheets into `tools/blender/sheets/`; then src/data/modelManifest.ts is gathered again.
"""

import importlib.util
import json
import os
import sys
import traceback

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, HERE)

import bpy  # noqa: E402

from kit import Kit  # noqa: E402
from kit.export import check, export  # noqa: E402
from kit.preview import sheets  # noqa: E402
import manifest  # noqa: E402


def load(cid):
    path = os.path.join(HERE, 'creatures', f'{cid}.py')
    spec = importlib.util.spec_from_file_location(f'creature_{cid}', path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def one(cid, timing, opts):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = timing['fps']
    kit = Kit(cid, timing['entities'][cid], timing['fps'])
    load(cid).build(kit)
    rig, objs = kit.finish()
    errors, warnings = check(kit)
    for w in warnings:
        print(f'  warn {cid}: {w}')
    if errors:
        for e in errors:
            print(f'  FAIL {cid}: {e}')
        return False
    path = export(kit, rig, objs, opts['out'])
    print(f'OK {cid}: {kit.m.tris()} tris, {len(kit.r.bones)} bones, {len(kit.clips)} clips, {os.path.getsize(path) // 1024} KB')
    if opts['preview']:
        actions = [bpy.data.actions[n] for n in kit.clips]
        for p in sheets(kit, rig, actions, opts['sheets'], opts['view']):
            print(f'  sheet {os.path.relpath(p, ROOT)}')
    return True


def main(argv):
    opts = {'preview': '--preview' in argv, 'view': 'three', 'out': os.path.join(ROOT, 'public', 'models'), 'sheets': os.path.join(HERE, 'sheets')}
    if '--view' in argv:
        opts['view'] = argv[argv.index('--view') + 1]
    timing = json.load(open(os.path.join(HERE, 'timing.json')))
    made = sorted(f[:-3] for f in os.listdir(os.path.join(HERE, 'creatures')) if f.endswith('.py') and not f.startswith('_'))
    ids = made if '--all' in argv else [a for a in argv if not a.startswith('--') and a not in (opts['view'],)]
    bad = []
    for cid in ids:
        try:
            if cid not in timing['entities']:
                raise KeyError(f'{cid} is not in the roster')
            if not one(cid, timing, opts):
                bad.append(cid)
        except Exception:
            traceback.print_exc()
            print(f'  FAIL {cid}: the script raised')
            bad.append(cid)
    if '--no-manifest' not in argv:
        manifest.main()
    print(f'built {len(ids) - len(bad)} of {len(ids)}' + (f'; failed: {" ".join(bad)}' if bad else ''))
    return 1 if bad else 0


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
    code = main(argv)
    sys.stdout.flush()
    os._exit(code)
