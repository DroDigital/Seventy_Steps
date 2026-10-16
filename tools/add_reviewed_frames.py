#!/usr/bin/env python3
"""Add a delivery of new frames to the packed reviewed creature art, without touching a pixel of what is there.

Needs `pip install pillow`. tools/pack_reviewed_assets.py builds the pack from the author's whole library;
this adds frames the author drew afterwards (the colossi's stoop, its in-between frame, the bosses' side and
back attack and hurt) to the pack as it stands: the frames go on a new page (public/creatures/reviewed/creatures-<n>.png),
the creature's view gains the action, and index.json and source-index.json are brought in line, so the integrity
test (tests/reviewedCreatureAssets.test.ts) holds the new frames to the same account as the old.

  python3 tools/add_reviewed_frames.py [--dry] <delivery folder>

The delivery folder holds one *MANIFEST.json and the PNGs it names, in one of two forms:
  front only   {"action": "stoop", "entities": [{"key", "idleSha256", "frames": [{"path", "sha256", "bounds"}]}]}
  by view      {"entities": [{"key", "views": [{"direction", "idleSha256", "actions": {"attack": [frames], ...}}]}]}
Each frame's bytes must match the manifest's hash, and be the canvas of its view's idle, which must be the idle the
frames were drawn from (idleSha256); a view that already has the action is refused (remove it by hand first), and a
frame's ground line (the bottom of what is painted) must stay within GROUND pixels of the idle's. `--dry` checks all
of it and writes nothing. For a frame the author drew again in place (a creature's whole set), see replace_reviewed_sprite.py.
"""

import hashlib
import io
import json
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / 'public' / 'creatures' / 'reviewed'
LIMIT = 2048
GUTTER = 1
GROUND = {'default': 2, 'yog_sothoth': 4}  # pixels a frame's base may stand from its view's idle (a body of drifting spheres has a looser base)
EXACT = ('stoop', 'stoop_mid')  # the stoop's frames stand on the very ground line of the idle (tests/colossusStoop.test.ts)
FLYING = ('flight',)  # a flyer's flight cycle: its wings lift its lowest pixel off the idle's ground line (round 48: the Shantak), so it may rise, not sink
FLIGHT_RISE, FLIGHT_SINK = 12, 2  # pixels a flight frame may stand above, and below, its idle's ground line


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def manifest_of(delivery: Path) -> dict:
    found = sorted(delivery.glob('*MANIFEST.json'))
    if len(found) != 1:
        sys.exit(f'{delivery}: expected one *MANIFEST.json, found {len(found)}')
    return json.loads(found[0].read_text())


def jobs_of(manifest: dict) -> list:
    """(key, direction, action, idleSha256, frames) for each set of frames the delivery brings."""
    jobs = []
    for entity in manifest['entities']:
        if 'views' in entity:
            for view in entity['views']:
                for action, frames in view['actions'].items():
                    jobs.append((entity['key'], view['direction'], action, view['idleSha256'], frames))
        else:
            jobs.append((entity['key'], 'front', manifest['action'], entity['idleSha256'], entity['frames']))
    return jobs


def main(delivery: Path, dry: bool) -> None:
    manifest = manifest_of(delivery)
    index = json.loads((PACK / 'index.json').read_text())
    source_path = PACK / 'source-index.json'
    source = json.loads(source_path.read_text())
    source_by_key = {e['key']: e for e in source['entities']}

    added = []  # (key, frame fields, image)
    problems = []
    for key, direction, action, idle_sha, delivered in jobs_of(manifest):
        packed, original = index['entities'][key]['directions'][direction], source_by_key[key]['directions'][direction]
        if action in packed['actions']:
            sys.exit(f'{key}/{direction} already has {action}')
        idle = index['frames'][packed['actions']['idle'][0]]
        if idle['sourceSha256'] != idle_sha:
            sys.exit(f"{key}/{direction}: drawn from another idle than the pack's ({idle_sha[:12]} against {idle['sourceSha256'][:12]})")
        tolerance = 0 if action in EXACT else GROUND.get(key, GROUND['default'])
        frames = []
        for frame in delivered:
            data = (delivery / frame['path']).read_bytes()
            if sha256(data) != frame['sha256']:
                sys.exit(f"{frame['path']}: its bytes differ from the manifest")
            with Image.open(io.BytesIO(data)) as decoded:
                rgba = decoded.convert('RGBA')
            if (rgba.width, rgba.height) != (idle['width'], idle['height']):
                sys.exit(f"{frame['path']}: {rgba.width}x{rgba.height}, its idle is {idle['width']}x{idle['height']}")
            bounds = rgba.getchannel('A').getbbox()
            if bounds is None or list(bounds) != frame['bounds']:
                sys.exit(f"{frame['path']}: bounds {bounds} against the manifest's {frame['bounds']}")
            if action in FLYING:
                lift = idle['bounds'][3] - bounds[3]
                if not -FLIGHT_SINK <= lift <= FLIGHT_RISE:
                    problems.append(f"{frame['path']}: stands on row {bounds[3]}, its idle on {idle['bounds'][3]} (a flight frame may lift {FLIGHT_RISE} and sink {FLIGHT_SINK})")
            elif abs(bounds[3] - idle['bounds'][3]) > tolerance:
                problems.append(f"{frame['path']}: stands on row {bounds[3]}, its idle on {idle['bounds'][3]} (at most {tolerance} apart)")
            frames.append({
                'source': frame['path'], 'sourceSha256': frame['sha256'], 'pixelSha256': sha256(rgba.tobytes()),
                'width': rgba.width, 'height': rgba.height, 'bounds': list(bounds),
            })
            added.append((key, direction, action, frames[-1], rgba))
        original['actions'][action] = {
            'frame_count': len(frames),
            'frames': [{'name': Path(f['path']).stem, 'path': f['path'], 'sha256': f['sha256']} for f in delivered],
        }
    if problems:
        sys.exit('\n'.join(problems))
    print(f'{len(added)} frames of {len({a[0] for a in added})} creatures check out', file=sys.stderr)
    if dry:
        return

    # One page for them all, shelf by shelf, in the order the packer uses (a gutter about each frame).
    page = len(index['pages'])
    x = y = row = 0
    for _, _, _, frame, _ in added:
        w, h = frame['width'] + GUTTER * 2, frame['height'] + GUTTER * 2
        if x + w > LIMIT:
            x, y, row = 0, y + row, 0
        frame.update(page=page, x=x + GUTTER, y=y + GUTTER)
        x, row = x + w, max(row, h)
    width = max(f['x'] + f['width'] + GUTTER for _, _, _, f, _ in added)
    height = max(f['y'] + f['height'] + GUTTER for _, _, _, f, _ in added)
    if max(width, height) > LIMIT:
        sys.exit('the new frames do not fit one page')
    canvas = Image.new('RGBA', (width, height))
    for _, _, _, frame, rgba in added:
        canvas.paste(rgba, (frame['x'], frame['y']))  # every channel, no mask
    name = f'creatures-{page}.png'
    canvas.save(PACK / name, optimize=True)
    encoded = (PACK / name).read_bytes()
    with Image.open(io.BytesIO(encoded)) as decoded:
        for _, _, _, frame, _ in added:
            rect = (frame['x'], frame['y'], frame['x'] + frame['width'], frame['y'] + frame['height'])
            if sha256(decoded.convert('RGBA').crop(rect).tobytes()) != frame['pixelSha256']:
                sys.exit(f"the page lost pixels of {frame['source']}")
    index['pages'].append({'file': name, 'width': width, 'height': height, 'sha256': sha256(encoded), 'pngBytes': len(encoded)})

    first = len(index['frames'])
    index['frames'] += [f for _, _, _, f, _ in added]
    for n, (key, direction, action, _, _) in enumerate(added):
        index['entities'][key]['directions'][direction]['actions'].setdefault(action, []).append(first + n)

    source['unique_png_count'] += len(added)
    actions = sorted({f'{d}/{a}' for _, d, a, _, _ in added})
    source['import_rules'].append(
        f"{', '.join(actions)}: a later delivery, packed onto its own atlas page by tools/add_reviewed_frames.py; "
        "the frames of an action play in order on the canvas and ground line of their view's idle (the stoop's: once, the last held).")
    source_path.write_text(json.dumps(source, indent=2) + '\n')
    index['sourceIndexSha256'] = sha256(source_path.read_bytes())
    index['frameCount'] = len(index['frames'])
    (PACK / 'index.json').write_text(json.dumps(index, separators=(',', ':')) + '\n')
    print(f'{len(added)} frames of {len({a[0] for a in added})} creatures on {name} ({width}x{height}); {index["frameCount"]} frames in all', file=sys.stderr)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--dry']
    if len(args) != 1:
        sys.exit(__doc__)
    main(Path(args[0]), '--dry' in sys.argv)
