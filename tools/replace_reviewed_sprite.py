#!/usr/bin/env python3
"""Replace a creature's frames in the packed reviewed art with a new drawing of it, in place.

Needs `pip install pillow`. For a creature the author drew again whole (the 'Umr at-Tawil, 21 frames), as against frames
added to one that has them (tools/add_reviewed_frames.py).

  python3 tools/replace_reviewed_sprite.py [--dry] <key> <delivery folder>

The folder holds the library's tree: sprites/<key>/64x64/<direction>/<action>_<n>.png. Each frame must be the canvas of the
creature's front idle, stand within GROUND pixels of its ground line, and be an action the creature already has, with as many
frames as it has; its pixels are pasted over the old frame's rectangle on its page, and the frame's hashes and bounds, the page's
and both indexes are brought in line, so the integrity test holds the new art to the same account as the old. A view the
creature had by mirroring another (its right, from its left) and the delivery draws on its own is given its frames on a new
shelf at the foot of the creature's page, and no longer mirrors. `--dry` checks all of it and writes nothing.
"""

import hashlib
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / 'public' / 'creatures' / 'reviewed'
LIMIT = 2048
GUTTER = 1
GROUND = 2


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def main(key: str, delivery: Path, dry: bool) -> None:
    index = json.loads((PACK / 'index.json').read_text())
    source_path = PACK / 'source-index.json'
    source = json.loads(source_path.read_text())
    entity = index['entities'][key]
    original = next(e for e in source['entities'] if e['key'] == key)
    if entity['assetGroup'] != 'sprites':
        sys.exit(f'{key} is a boss form: its canvases are not 64x64')
    page_no = entity['page']
    frames = index['frames']
    idle = frames[entity['directions']['front']['actions']['idle'][0]]
    tree = delivery / 'sprites' / key / '64x64'

    # What the delivery brings, by direction and action, in frame order.
    brought = {}
    for path in sorted(tree.glob('*/*.png')):
        match = re.fullmatch(r'(idle|move|attack|hurt)_(\d+)\.png', path.name)
        if not match:
            sys.exit(f'{path}: not a frame name')
        brought.setdefault((path.parent.name, match.group(1)), {})[int(match.group(2))] = path

    replace, fresh, problems = [], [], []  # (frame id or None, direction, action, n, path, rgba, bytes)
    for (direction, action), by_n in sorted(brought.items()):
        view = entity['directions'][direction]
        own = view['sourceDirection'] == direction
        if sorted(by_n) != list(range(len(by_n))):
            sys.exit(f'{direction}/{action}: frames are not numbered from 0 in a run')
        ids = view['actions'].get(action)
        if ids is None:
            sys.exit(f'{key} has no {direction}/{action} to replace')
        if len(ids) != len(by_n):
            sys.exit(f'{direction}/{action}: {len(by_n)} frames brought, {len(ids)} there')
        for n, path in sorted(by_n.items()):
            data = path.read_bytes()
            with Image.open(io.BytesIO(data)) as decoded:
                rgba = decoded.convert('RGBA')
            if (rgba.width, rgba.height) != (idle['width'], idle['height']):
                sys.exit(f'{path}: {rgba.width}x{rgba.height}, the canvas is {idle["width"]}x{idle["height"]}')
            bounds = rgba.getchannel('A').getbbox()
            if bounds is None:
                sys.exit(f'{path}: nothing painted')
            if abs(bounds[3] - idle['bounds'][3]) > GROUND:
                problems.append(f'{path}: stands on row {bounds[3]}, the ground line is {idle["bounds"][3]}')
            (replace if own else fresh).append((ids[n] if own else None, direction, action, n, path, rgba, data, bounds))
    missing = [f'{d}/{a}' for d, v in entity['directions'].items() for a in v['actions'] if (d, a) not in brought]
    if problems:
        sys.exit('\n'.join(problems))
    print(f'{len(replace)} frames to replace, {len(fresh)} new, {len(missing)} scopes left as they were{": " + ", ".join(missing) if missing else ""}', file=sys.stderr)
    if dry:
        return

    page_info = index['pages'][page_no]
    with Image.open(PACK / page_info['file']) as opened:
        page = opened.convert('RGBA')
    for fid, direction, action, n, path, rgba, data, bounds in replace:
        f = frames[fid]
        if not f['source'].endswith(f'/{direction}/{action}_{n}.png'):
            sys.exit(f'frame {fid} is {f["source"]}, not {direction}/{action}_{n}')
        page.paste(rgba, (f['x'], f['y']))  # every channel, no mask
        f.update(sourceSha256=sha256(data), pixelSha256=sha256(rgba.tobytes()), bounds=list(bounds))
        original['directions'][direction]['actions'][action]['frames'][n]['sha256'] = sha256(data)

    if fresh:  # a new shelf at the foot of the page
        w, h = idle['width'] + GUTTER * 2, idle['height'] + GUTTER * 2
        top, x, spots = page.height, 0, []
        for _ in fresh:
            if x + w > LIMIT:
                x, top = 0, top + h
            spots.append({'x': x + GUTTER, 'y': top + GUTTER})
            x += w
        height = max(spot['y'] for spot in spots) + idle['height'] + GUTTER
        if height > LIMIT:
            sys.exit('the page cannot grow to hold the new frames')
        grown = Image.new('RGBA', (page.width, height))
        grown.paste(page, (0, 0))
        page = grown
        by_scope = {}
        for (fid, direction, action, n, path, rgba, data, bounds), spot in zip(fresh, spots):
            page.paste(rgba, (spot['x'], spot['y']))
            frames.append({
                'source': f'sprites/{key}/64x64/{direction}/{action}_{n}.png', 'sourceSha256': sha256(data), 'pixelSha256': sha256(rgba.tobytes()),
                'width': rgba.width, 'height': rgba.height, 'bounds': list(bounds), 'page': page_no, 'x': spot['x'], 'y': spot['y'],
            })
            by_scope.setdefault((direction, action), []).append((len(frames) - 1, n, data))
        for direction in {d for d, _ in by_scope}:
            entity['directions'][direction] = {'sourceDirection': direction, 'mirror': False, 'actions': {}}
            original['directions'][direction] = {'source_direction': direction, 'mirror_horizontal': False, 'actions': {}}
        for (direction, action), items in by_scope.items():
            entity['directions'][direction]['actions'][action] = [i for i, _, _ in items]
            original['directions'][direction]['actions'][action] = {
                'frame_count': len(items),
                'frames': [{'name': f'{action}_{n}', 'path': f'sprites/{key}/64x64/{direction}/{action}_{n}.png', 'sha256': sha256(d)} for _, n, d in items],
            }
        source['unique_png_count'] += len(fresh)
        page_info['height'] = page.height

    page.save(PACK / page_info['file'], optimize=True)
    encoded = (PACK / page_info['file']).read_bytes()
    with Image.open(io.BytesIO(encoded)) as decoded:
        decoded = decoded.convert('RGBA')
        for f in frames:
            if f['page'] != page_no or not (f['source'].startswith(f'sprites/{key}/')):
                continue
            if sha256(decoded.crop((f['x'], f['y'], f['x'] + f['width'], f['y'] + f['height'])).tobytes()) != f['pixelSha256']:
                sys.exit(f"the page lost pixels of {f['source']}")
    page_info.update(sha256=sha256(encoded), pngBytes=len(encoded))
    source['import_rules'].append(
        f"{key}: drawn again whole by the author and put in place of the old frames (tools/replace_reviewed_sprite.py); "
        + ('its right view is drawn, not mirrored from its left, its four frames on a shelf at the foot of its page.' if fresh else 'the same views and counts as before.'))
    source_path.write_text(json.dumps(source, indent=2) + '\n')
    index['sourceIndexSha256'] = sha256(source_path.read_bytes())
    index['frameCount'] = len(frames)
    (PACK / 'index.json').write_text(json.dumps(index, separators=(',', ':')) + '\n')
    print(f'{key}: {len(replace)} frames replaced, {len(fresh)} added to {page_info["file"]} ({page.width}x{page.height}); {len(frames)} frames in all', file=sys.stderr)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--dry']
    if len(args) != 2:
        sys.exit(__doc__)
    main(args[0], Path(args[1]), '--dry' in sys.argv)
