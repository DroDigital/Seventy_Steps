#!/usr/bin/env python3
"""Replace a creature's frames in the packed reviewed art with a new drawing of it, in place.

Needs `pip install pillow`. For a creature the author drew again whole (the 'Umr at-Tawil, 21 frames; Nyarlathotep's two
forms), as against frames added to one that has them (tools/add_reviewed_frames.py).

  python3 tools/replace_reviewed_sprite.py [--dry] <key> <delivery folder>

The folder holds the library's tree: sprites/<id>[/<variant>]/64x64/<direction>/<action>_<n>.png (the key of a variant is
<id>#<variant>). Each frame must be the canvas of the creature's front idle, stand within GROUND pixels of its ground line, and
be an action the creature already has, with at least as many frames as it has; its pixels are pasted over the old frame's
rectangle on its page, and the frame's hashes and bounds, the page's and both indexes are brought in line, so the integrity
test holds the new art to the same account as the old. A scope drawn with more frames than it had (a walk of two made six) keeps
the old frames' places and gets the rest on a new shelf at the foot of the creature's page. A view the creature had by
mirroring another (its right, from its left) stays mirrored when the delivery's is that other turned round, pixel for pixel;
one the delivery draws on its own is given its frames on the shelf, and no longer mirrors; a view is one or the other whole, so
its other actions that the delivery sends as the source turned round are put on the shelf too (the delivery's own files for
them), and one the delivery leaves out is refused, as is a drawn view with fewer frames than the mirrored one had. A scope that
grows grows in every view that mirrors it, in both indexes. `--dry` checks all of it and writes nothing.
"""

import hashlib
import io
import json
import re
import sys
from pathlib import Path

from PIL import Image, ImageOps

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
    prefix = idle['source'].rsplit('/', 2)[0]  # sprites/<id>[/<variant>]/64x64
    tree = delivery / prefix

    # What the delivery brings, by direction and action, in frame order.
    brought = {}
    for path in sorted(tree.glob('*/*.png')):
        match = re.fullmatch(r'(idle|move|attack|hurt)_(\d+)\.png', path.name)
        if not match:
            sys.exit(f'{path}: not a frame name')
        brought.setdefault((path.parent.name, match.group(1)), {})[int(match.group(2))] = path

    def load(path: Path) -> Image.Image:
        with Image.open(io.BytesIO(path.read_bytes())) as decoded:
            return decoded.convert('RGBA')

    # (frame id or None, direction, action, n, path, rgba, bytes, bounds): in place; a view the pack mirrored, drawn; extra frames
    replace, fresh, grown, problems = [], [], [], []
    kept = {}  # (direction, action) -> its rows: a view the pack mirrors, that the delivery turns round the same way
    for (direction, action), by_n in sorted(brought.items()):
        view = entity['directions'][direction]
        own = view['sourceDirection'] == direction
        if sorted(by_n) != list(range(len(by_n))):
            sys.exit(f'{direction}/{action}: frames are not numbered from 0 in a run')
        ids = view['actions'].get(action)
        if ids is None:
            sys.exit(f'{key} has no {direction}/{action} to replace')
        if len(ids) > len(by_n):  # a mirrored view's frames are its source's: drawn on its own, it may not be shorter either
            sys.exit(f'{direction}/{action}: {len(by_n)} frames brought, {len(ids)} there')
        rows = []
        for n, path in sorted(by_n.items()):
            data = path.read_bytes()
            rgba = load(path)
            if (rgba.width, rgba.height) != (idle['width'], idle['height']):
                sys.exit(f'{path}: {rgba.width}x{rgba.height}, the canvas is {idle["width"]}x{idle["height"]}')
            bounds = rgba.getchannel('A').getbbox()
            if bounds is None:
                sys.exit(f'{path}: nothing painted')
            if abs(bounds[3] - idle['bounds'][3]) > GROUND:
                problems.append(f'{path}: stands on row {bounds[3]}, the ground line is {idle["bounds"][3]}')
            rows.append((ids[n] if own and n < len(ids) else None, direction, action, n, path, rgba, data, bounds))
        if not own and view['mirror']:
            twin = brought.get((view['sourceDirection'], action), {})
            if sorted(twin) == sorted(by_n) and all(ImageOps.mirror(load(twin[n])).tobytes() == load(p).tobytes() for n, p in by_n.items()):
                kept[(direction, action)] = rows
                continue
        for row in rows:
            (replace if row[0] is not None else grown if own else fresh).append(row)
    # A view the delivery draws on its own no longer mirrors, and a view is one or the other whole: what it kept turned round is
    # given the delivery's own files for it (the same picture), and an action of it that the delivery leaves out is refused.
    for direction in sorted({row[1] for row in fresh}):
        for action in entity['directions'][direction]['actions']:
            if (direction, action) in kept:
                fresh.extend(kept.pop((direction, action)))
            elif not any(row[1:3] == (direction, action) for row in fresh):
                sys.exit(f'{direction}/{action}: the delivery draws {direction} on its own, which then no longer mirrors, and brings no {action} for it')
    missing = [f'{d}/{a}' for d, v in entity['directions'].items() for a in v['actions'] if (d, a) not in brought]
    if problems:
        sys.exit('\n'.join(problems))
    print(f'{len(replace)} frames to replace, {len(fresh)} drawn for views that mirrored, {len(grown)} added to scopes that had fewer, '
          f'{len(kept)} views kept mirrored, {len(missing)} scopes left as they were{": " + ", ".join(missing) if missing else ""}', file=sys.stderr)
    if dry:
        return

    def readers(views, source_key: str, direction: str, action: str) -> list:
        """The views of an index that read `direction`'s frames of `action`: itself, and any that mirrors it (each lists them again)."""
        return [v for v in views.values() if v[source_key] == direction and action in v['actions']]

    def registered_as(direction: str, action: str) -> list:
        return readers(original['directions'], 'source_direction', direction, action)

    page_info = index['pages'][page_no]
    with Image.open(PACK / page_info['file']) as opened:
        page = opened.convert('RGBA')
    for fid, direction, action, n, path, rgba, data, bounds in replace:
        f = frames[fid]
        if not f['source'].endswith(f'/{direction}/{action}_{n}.png'):
            sys.exit(f'frame {fid} is {f["source"]}, not {direction}/{action}_{n}')
        page.paste(rgba, (f['x'], f['y']))  # every channel, no mask
        f.update(sourceSha256=sha256(data), pixelSha256=sha256(rgba.tobytes()), bounds=list(bounds))
        for view in registered_as(direction, action):
            view['actions'][action]['frames'][n]['sha256'] = sha256(data)

    shelf = fresh + grown
    if shelf:  # a new shelf at the foot of the page
        w, h = idle['width'] + GUTTER * 2, idle['height'] + GUTTER * 2
        top, x, spots = page.height, 0, []
        for _ in shelf:
            if x + w > LIMIT:
                x, top = 0, top + h
            spots.append({'x': x + GUTTER, 'y': top + GUTTER})
            x += w
        height = max(spot['y'] for spot in spots) + idle['height'] + GUTTER
        if height > LIMIT:
            sys.exit('the page cannot grow to hold the new frames')
        grown_page = Image.new('RGBA', (page.width, height))
        grown_page.paste(page, (0, 0))
        page = grown_page
        placed = []  # (frame id, direction, action, n, bytes) in shelf order
        for (_, direction, action, n, path, rgba, data, bounds), spot in zip(shelf, spots):
            page.paste(rgba, (spot['x'], spot['y']))
            frames.append({
                'source': f'{prefix}/{direction}/{action}_{n}.png', 'sourceSha256': sha256(data), 'pixelSha256': sha256(rgba.tobytes()),
                'width': rgba.width, 'height': rgba.height, 'bounds': list(bounds), 'page': page_no, 'x': spot['x'], 'y': spot['y'],
            })
            placed.append((len(frames) - 1, direction, action, n, data))
        by_scope = {}
        for fid, direction, action, n, data in placed[:len(fresh)]:
            by_scope.setdefault((direction, action), []).append((fid, n, data))
        for direction in {d for d, _ in by_scope}:
            entity['directions'][direction] = {'sourceDirection': direction, 'mirror': False, 'actions': {}}
            original['directions'][direction] = {'source_direction': direction, 'mirror_horizontal': False, 'actions': {}}
        for (direction, action), items in by_scope.items():
            entity['directions'][direction]['actions'][action] = [i for i, _, _ in items]
            original['directions'][direction]['actions'][action] = {
                'frame_count': len(items),
                'frames': [{'name': f'{action}_{n}', 'path': f'{prefix}/{direction}/{action}_{n}.png', 'sha256': sha256(d)} for _, n, d in items],
            }
        for fid, direction, action, n, data in placed[len(fresh):]:  # the extra frames of a scope: after its old ones, in order
            for view in readers(entity['directions'], 'sourceDirection', direction, action):  # its own, and each view that is it turned round
                if n != len(view['actions'][action]):
                    sys.exit(f'{direction}/{action}: frame {n} comes after {len(view["actions"][action])}')
                view['actions'][action].append(fid)
            for view in registered_as(direction, action):
                registered = view['actions'][action]
                registered['frames'].append({'name': f'{action}_{n}', 'path': f'{prefix}/{direction}/{action}_{n}.png', 'sha256': sha256(data)})
                registered['frame_count'] = len(registered['frames'])
        source['unique_png_count'] += len(shelf)
        page_info['height'] = page.height

    page.save(PACK / page_info['file'], optimize=True)
    encoded = (PACK / page_info['file']).read_bytes()
    with Image.open(io.BytesIO(encoded)) as decoded:
        decoded = decoded.convert('RGBA')
        for f in frames:
            if f['page'] != page_no or not f['source'].startswith(f'{prefix}/'):
                continue
            if sha256(decoded.crop((f['x'], f['y'], f['x'] + f['width'], f['y'] + f['height'])).tobytes()) != f['pixelSha256']:
                sys.exit(f"the page lost pixels of {f['source']}")
    page_info.update(sha256=sha256(encoded), pngBytes=len(encoded))
    notes = [f'{len(grown)} frames of scopes that had fewer are on a shelf at the foot of its page'] if grown else []
    if fresh:
        notes.append(f'its {"/".join(sorted({d for _, d, *_ in fresh}))} view is drawn, not mirrored, its {len(fresh)} frames on that shelf')
    if kept:
        notes.append(f'{len(kept)} views stay mirrored, the delivery\'s being the same turned round')
    source['import_rules'].append(
        f"{key}: drawn again whole by the author and put in place of the old frames (tools/replace_reviewed_sprite.py); "
        + ('; '.join(notes) if notes else 'the same views and counts as before') + '.')
    source_path.write_text(json.dumps(source, indent=2) + '\n')
    index['sourceIndexSha256'] = sha256(source_path.read_bytes())
    index['frameCount'] = len(frames)
    (PACK / 'index.json').write_text(json.dumps(index, separators=(',', ':')) + '\n')
    print(f'{key}: {len(replace)} frames replaced, {len(shelf)} added to {page_info["file"]} ({page.width}x{page.height}); {len(frames)} frames in all', file=sys.stderr)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if a != '--dry']
    if len(args) != 2:
        sys.exit(__doc__)
    main(args[0], Path(args[1]), '--dry' in sys.argv)
