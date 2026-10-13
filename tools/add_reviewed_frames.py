#!/usr/bin/env python3
"""Add a delivery of new frames to the packed reviewed creature art, without touching a pixel of what is there.

Needs `pip install pillow`. tools/pack_reviewed_assets.py builds the pack from the author's whole library;
this adds frames the author drew afterwards (the colossi's stoop, COLOSSI-STOOP-MANIFEST.json) to the pack as
it stands: the frames go on a new page (public/creatures/reviewed/creatures-<n>.png), each creature's front
view gains the action, and index.json and source-index.json are brought in line, so the integrity test
(tests/reviewedCreatureAssets.test.ts) holds the new frames to the same account as the old.

  python3 tools/add_reviewed_frames.py <delivery folder>

The delivery folder holds COLOSSI-STOOP-MANIFEST.json and the PNGs it names. Each frame's bytes must match the
manifest's hash, and be the canvas of its creature's front idle, which must be the idle the frames were drawn
from (the manifest's idleSha256). A creature that already has the action is refused: remove it by hand first.
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


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main(delivery: Path) -> None:
    manifest = json.loads((delivery / 'COLOSSI-STOOP-MANIFEST.json').read_text())
    action = manifest['action']
    index = json.loads((PACK / 'index.json').read_text())
    source_path = PACK / 'source-index.json'
    source = json.loads(source_path.read_text())
    source_by_key = {e['key']: e for e in source['entities']}

    added = []  # (key, frame fields, image)
    for entity in manifest['entities']:
        key = entity['key']
        packed, original = index['entities'][key], source_by_key[key]
        if action in packed['directions']['front']['actions']:
            sys.exit(f'{key} already has {action}')
        idle = index['frames'][packed['directions']['front']['actions']['idle'][0]]
        if idle['sourceSha256'] != entity['idleSha256']:
            sys.exit(f"{key}: drawn from another idle than the pack's ({entity['idleSha256'][:12]} against {idle['sourceSha256'][:12]})")
        frames = []
        for frame in entity['frames']:
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
            frames.append({
                'source': frame['path'], 'sourceSha256': frame['sha256'], 'pixelSha256': sha256(rgba.tobytes()),
                'width': rgba.width, 'height': rgba.height, 'bounds': list(bounds),
            })
            added.append((key, frames[-1], rgba, frame['name']))
        original['directions']['front']['actions'][action] = {
            'frame_count': len(frames),
            'frames': [{'name': Path(f['path']).stem, 'path': f['path'], 'sha256': f['sha256']} for f in entity['frames']],
        }

    # One page for them all, shelf by shelf, in the order the packer uses (a gutter about each frame).
    page = len(index['pages'])
    x = y = row = 0
    for _, frame, _, _ in added:
        w, h = frame['width'] + GUTTER * 2, frame['height'] + GUTTER * 2
        if x + w > LIMIT:
            x, y, row = 0, y + row, 0
        frame.update(page=page, x=x + GUTTER, y=y + GUTTER)
        x, row = x + w, max(row, h)
    width = max(f['x'] + f['width'] + GUTTER for _, f, _, _ in added)
    height = max(f['y'] + f['height'] + GUTTER for _, f, _, _ in added)
    if max(width, height) > LIMIT:
        sys.exit('the new frames do not fit one page')
    canvas = Image.new('RGBA', (width, height))
    for _, frame, rgba, _ in added:
        canvas.paste(rgba, (frame['x'], frame['y']))  # every channel, no mask
    name = f'creatures-{page}.png'
    canvas.save(PACK / name, optimize=True)
    encoded = (PACK / name).read_bytes()
    with Image.open(io.BytesIO(encoded)) as decoded:
        for _, frame, _, _ in added:
            rect = (frame['x'], frame['y'], frame['x'] + frame['width'], frame['y'] + frame['height'])
            if sha256(decoded.convert('RGBA').crop(rect).tobytes()) != frame['pixelSha256']:
                sys.exit(f"the page lost pixels of {frame['source']}")
    index['pages'].append({'file': name, 'width': width, 'height': height, 'sha256': sha256(encoded), 'pngBytes': len(encoded)})

    first = len(index['frames'])
    index['frames'] += [f for _, f, _, _ in added]
    for n, (key, _, _, _) in enumerate(added):
        actions = index['entities'][key]['directions']['front']['actions']
        actions.setdefault(action, []).append(first + n)

    source['unique_png_count'] += len(added)
    source['import_rules'].append(
        f"'{action}' (front view only): two frames, the first once on entering the pose and the second held until it ends; they are a later delivery, packed onto their own atlas page by tools/add_reviewed_frames.py.")
    source_path.write_text(json.dumps(source, indent=2) + '\n')
    index['sourceIndexSha256'] = sha256(source_path.read_bytes())
    index['frameCount'] = len(index['frames'])
    (PACK / 'index.json').write_text(json.dumps(index, separators=(',', ':')) + '\n')
    print(f'{len(added)} frames of {len(manifest["entities"])} creatures on {name} ({width}x{height}); {index["frameCount"]} frames in all', file=sys.stderr)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]))
