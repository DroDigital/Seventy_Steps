#!/usr/bin/env python3
"""Replace creatures' frames in the packed reviewed art with new drawings of them, in place.

Needs `pip install pillow`. For creatures the author drew again whole ('Umr at-Tawil; Nyarlathotep's two forms; the sixteen of
round 56, Yog-Sothoth among them), as against frames added to ones that have them (tools/add_reviewed_frames.py).

  python3 tools/replace_reviewed_sprite.py [--dry] <key> [<key> ...] <delivery folder>
  python3 tools/replace_reviewed_sprite.py [--dry] --all <delivery folder>      (every key of the folder's MANIFEST.json)

The folder holds the library's tree: sprites/<id>[/<variant>]/64x64/<direction>/<action>_<n>.png, or a boss's
bosses/<id>/movement/... (the key of a variant is <id>#<variant>). Each frame must be the canvas of the creature's front idle
and, for a creature registered on the ground line, stand within GROUND pixels of its ground line (one the delivery's MANIFEST.json
registers by its central body, a flier or a levitating thing, is left to move). What the delivery brings is the creature's
idle and move in all four views and its attack and hurt from the front (and a colossus's stoop, below): that is the whole of it.

  * Attack and hurt are front art only. A left, right or back attack or hurt in a delivery is never packed, and the old drawing's
    own (a boss's left and back combat) is dropped with it, for it would no longer match: seen from the side, a creature that
    strikes or is struck shows its front (render/sprites/directional.ts).
  * A scope may grow or shrink. A frame takes the old frame's place on its page where there was one; the rest take the places
    the old drawing freed on that page; the rest again go on a shelf at the foot of a library page with room (the creature's
    own first), and what nothing uses is cleared and taken out of the index (the frames after it move up a number).
  * Its right is registered as its left turned round (the delivery's right being that, pixel for pixel), else as drawn; a view
    is one or the other whole.
  * A colossus's stoop (the bow and the hold, `stoop_<n>`, and the halfway pose, `stoop_mid_0`) is front art too, and a creature that
    has one must come with one: each frame is pasted over the old one's rectangle on its page (the count is the old count; a delivery
    without it, or with one the creature has not got, is refused: tools/add_reviewed_frames.py adds a stoop), on the very ground line
    of the delivery's front idle, the bow and the hold no more than 1% taller than it and the halfway pose no taller.
  * Any other action it has (a flight) is left as it was.

The pixels go over the old rectangles, and the frame's hashes and bounds, the pages' and both indexes are brought in line, so the
integrity test holds the new art to the same account as the old. `--dry` does all of it in memory and writes nothing.
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
LIMIT = 2048  # the most a page may be, either way
GUTTER = 1
GROUND = 2
LIBRARY_PAGES = 4  # the library's own pages: the shelf of a redrawn creature is on one of them
ACTIONS = ('idle', 'move', 'attack', 'hurt')
STOOPS = ('stoop', 'stoop_mid')  # a colossus's bow and hold, and the pose halfway down to it: front only, in place on the pages of their own
DIRECTIONS = ('front', 'back', 'left', 'right')


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class Pack:
    def __init__(self, dry: bool) -> None:
        self.dry = dry
        self.index = json.loads((PACK / 'index.json').read_text())
        self.source = json.loads((PACK / 'source-index.json').read_text())
        self.images, self.touched, self.cursors, self.dead = {}, set(), {}, set()

    def page(self, n: int) -> Image.Image:
        if n not in self.images:
            with Image.open(PACK / self.index['pages'][n]['file']) as opened:
                self.images[n] = opened.convert('RGBA')
        return self.images[n]

    def clear(self, frame: dict) -> None:
        self.page(frame['page']).paste(Image.new('RGBA', (frame['width'], frame['height']), (0, 0, 0, 0)), (frame['x'], frame['y']))
        self.touched.add(frame['page'])

    def place(self, w: int, h: int, preferred: int):
        """A spot for a w x h frame on a shelf at the foot of a library page, `preferred` first: (page, x, y), or None."""
        for n in dict.fromkeys([preferred, *range(LIBRARY_PAGES)]):
            image = self.page(n)
            x, y, row = self.cursors.setdefault(n, [0, image.height, 0])
            fw, fh = w + GUTTER * 2, h + GUTTER * 2
            if x + fw > image.width:
                x, y, row = 0, y + row, 0
            if y + fh > LIMIT:
                continue
            self.cursors[n] = [x + fw, y, max(row, fh)]
            if image.height < y + fh:
                grown = Image.new('RGBA', (image.width, y + fh))
                grown.paste(image, (0, 0))
                self.images[n] = grown
                self.index['pages'][n]['height'] = grown.height
            self.touched.add(n)
            return n, x + GUTTER, y + GUTTER
        return None


def load(path: Path):
    data = path.read_bytes()
    with Image.open(io.BytesIO(data)) as decoded:
        rgba = decoded.convert('RGBA')
    return rgba, data, rgba.getchannel('A').getbbox()


def replace(pack: Pack, key: str, delivery: Path, central: bool) -> str:
    index, source = pack.index, pack.source
    entity = index['entities'][key]
    original = next(e for e in source['entities'] if e['key'] == key)
    frames = index['frames']
    idle = frames[entity['directions']['front']['actions']['idle'][0]]
    prefix = idle['source'].rsplit('/', 2)[0]  # sprites/<id>[/<variant>]/64x64, or bosses/<id>/movement
    canvas = (idle['width'], idle['height'])

    brought, skipped, stooped = {}, [], {}
    for path in sorted((delivery / prefix).glob('*/*.png')):
        match = re.fullmatch(r'(idle|move|attack|hurt|stoop_mid|stoop)_(\d+)\.png', path.name)
        if not match or path.parent.name not in DIRECTIONS:
            sys.exit(f'{path}: not a frame of a view')
        action, direction = match.group(1), path.parent.name
        if action in STOOPS:
            if direction != 'front':
                sys.exit(f'{path}: a stoop is front art')
            stooped.setdefault(action, {})[int(match.group(2))] = path
            continue
        if direction != 'front' and action in ('attack', 'hurt'):
            skipped.append(path)  # front art only: never packed
            continue
        brought.setdefault((direction, action), {})[int(match.group(2))] = path
    if not brought:
        sys.exit(f'{key}: nothing at {delivery / prefix}')
    for (direction, action), by_n in brought.items():
        if sorted(by_n) != list(range(len(by_n))):
            sys.exit(f'{key} {direction}/{action}: frames are not numbered from 0 in a run')
    for direction in DIRECTIONS:
        for action in ('idle', 'move'):
            if (direction, action) not in brought:
                sys.exit(f'{key}: the delivery has no {direction}/{action}')
    for action in entity['directions']['front']['actions']:
        if action in ACTIONS and ('front', action) not in brought:
            sys.exit(f'{key}: the delivery has no front/{action}, which it had')
        if action in STOOPS and action not in stooped:
            sys.exit(f'{key}: the delivery has no front/{action}, which it had')
    for action, by_n in stooped.items():
        if sorted(by_n) != list(range(len(by_n))):
            sys.exit(f'{key} front/{action}: frames are not numbered from 0 in a run')
        if action not in entity['directions']['front']['actions']:
            sys.exit(f'{key}: the delivery has a front/{action}, which it has not (tools/add_reviewed_frames.py adds one)')
        if len(by_n) != len(entity['directions']['front']['actions'][action]):
            sys.exit(f"{key} front/{action}: {len(by_n)} frames, it had {len(entity['directions']['front']['actions'][action])}")

    pixels = {path: load(path) for by_n in brought.values() for path in by_n.values()}
    mirrored = all(
        sorted(brought[('left', a)]) == sorted(brought[('right', a)])
        and all(ImageOps.mirror(pixels[brought[('left', a)][n]][0]).tobytes() == pixels[brought[('right', a)][n]][0].tobytes() for n in brought[('left', a)])
        for a in ('idle', 'move'))
    new = {}  # (direction, action, n) -> (path, rgba, bytes, bounds) of every frame drawn, a mirrored right not among them
    problems = []
    for (direction, action), by_n in sorted(brought.items()):
        for n, path in sorted(by_n.items()):
            rgba, data, bounds = pixels[path]
            if (rgba.width, rgba.height) != canvas:
                sys.exit(f'{path}: {rgba.width}x{rgba.height}, the canvas is {canvas[0]}x{canvas[1]}')
            if bounds is None:
                sys.exit(f'{path}: nothing painted')
            if not central and abs(bounds[3] - idle['bounds'][3]) > GROUND:
                problems.append(f'{path}: stands on row {bounds[3]}, the ground line is {idle["bounds"][3]}')
            if not (direction == 'right' and mirrored):
                new[(direction, action, n)] = (path, rgba, data, bounds)
    if problems:
        sys.exit('\n'.join(problems))

    old = {(d, a, n): i for d, v in entity['directions'].items() if v['sourceDirection'] == d
           for a, ids in v['actions'].items() if a in ACTIONS for n, i in enumerate(ids)}  # its own frames, not a mirror's
    slots = {k: old[k] for k in new if k in old}  # in place
    free = sorted(i for k, i in old.items() if k not in new and frames[i]['page'] == entity['page'] and (frames[i]['width'], frames[i]['height']) == canvas)
    shelved = 0
    for k in sorted(new):
        if k not in slots:
            if free:
                slots[k] = free.pop(0)  # a place the old drawing left
            else:
                slots[k] = None
                shelved += 1
    dead = [i for i in old.values() if i not in slots.values()]
    in_place = sum(1 for k in new if k in old)
    note = (f'{len(new)} frames drawn ({in_place} in place, {len(new) - in_place - shelved} into places the old drawing left, {shelved} on a shelf), '
            f'{len(dead)} old frames dropped, right {"mirrored" if mirrored else "drawn"}'
            + (f', {len(skipped)} left/right/back attack or hurt frames not packed' if skipped else ''))

    for k in sorted(new):
        path, rgba, data, bounds = new[k]
        d, a, n = k
        record = {'source': f'{prefix}/{d}/{a}_{n}.png', 'sourceSha256': sha256(data), 'pixelSha256': sha256(rgba.tobytes()), 'bounds': list(bounds)}
        if slots[k] is None:
            spot = pack.place(rgba.width, rgba.height, entity['page'])
            if spot is None:
                sys.exit('no library page has room for the new frames')
            frames.append({**record, 'width': rgba.width, 'height': rgba.height, 'page': spot[0], 'x': spot[1], 'y': spot[2]})
            slots[k] = len(frames) - 1
        else:
            frames[slots[k]].update(record)
        f = frames[slots[k]]
        pack.page(f['page']).paste(rgba, (f['x'], f['y']))  # every channel, no mask
        pack.touched.add(f['page'])
    for i in dead:
        pack.clear(frames[i])
        pack.dead.add(i)

    if stooped:
        front, registered = entity['directions']['front'], original['directions']['front']
        stands, high = new[('front', 'idle', 0)][3][3], new[('front', 'idle', 0)][3][3] - new[('front', 'idle', 0)][3][1]  # the delivery's own front idle
        drawn = {}
        for action, by_n in sorted(stooped.items()):
            for n, path in sorted(by_n.items()):
                rgba, data, bounds = load(path)
                if (rgba.width, rgba.height) != canvas:
                    sys.exit(f'{path}: {rgba.width}x{rgba.height}, the canvas is {canvas[0]}x{canvas[1]}')
                if bounds is None:
                    sys.exit(f'{path}: nothing painted')
                if bounds[3] != stands:
                    sys.exit(f'{path}: stands on row {bounds[3]}, the idle it is drawn from on {stands} (a stoop stands on the very ground line)')
                if bounds[3] - bounds[1] > (high if action == 'stoop_mid' else high * 1.01):  # (the halfway pose is never the taller)
                    sys.exit(f'{path}: {bounds[3] - bounds[1]} rows high, taller than the idle it comes down from ({high})')
                drawn[(action, n)] = (rgba, data, bounds)
        for (action, n), (rgba, data, bounds) in sorted(drawn.items()):
            f = frames[front['actions'][action][n]]
            f.update(source=f'{prefix}/front/{action}_{n}.png', sourceSha256=sha256(data), pixelSha256=sha256(rgba.tobytes()), bounds=list(bounds))
            pack.page(f['page']).paste(rgba, (f['x'], f['y']))  # in place, every channel, no mask
            pack.touched.add(f['page'])
        for action, ids in sorted((a, front['actions'][a]) for a in stooped):
            registered['actions'][action] = {'frame_count': len(ids), 'frames': [
                {'name': f'{action}_{n}', 'path': f'{prefix}/front/{action}_{n}.png', 'sha256': frames[i]['sourceSha256']} for n, i in enumerate(ids)]}
        note += f', its {len(drawn)} stoop frames ({", ".join(sorted(stooped))}) drawn in place'

    for d in DIRECTIONS:
        view, registered = entity['directions'][d], original['directions'][d]
        drawn = not (d == 'right' and mirrored)
        src = d if drawn else 'left'
        actions, entries = {}, {}
        for a in ACTIONS:
            if (src, a) not in brought:
                continue
            ids = [slots[(src, a, n)] for n in range(len(brought[(src, a)]))]
            actions[a] = ids
            entries[a] = {'frame_count': len(ids), 'frames': [
                {'name': f'{a}_{n}', 'path': f'{prefix}/{src}/{a}_{n}.png', 'sha256': frames[i]['sourceSha256']} for n, i in enumerate(ids)]}
        view.update(sourceDirection=src, mirror=not drawn, actions={**actions, **{a: ids for a, ids in view['actions'].items() if a not in ACTIONS}})
        registered.update(source_direction=src, mirror_horizontal=not drawn,
                          actions={**entries, **{a: r for a, r in registered['actions'].items() if a not in ACTIONS}})
    source['import_rules'].append(f'{key}: drawn again whole by the author and put in place of the old frames (tools/replace_reviewed_sprite.py); {note}.')
    return note


def finish(pack: Pack) -> None:
    index, source = pack.index, pack.source
    keep = [i for i in range(len(index['frames'])) if i not in pack.dead]
    moved = {old: n for n, old in enumerate(keep)}
    index['frames'] = [index['frames'][i] for i in keep]
    for entity in index['entities'].values():
        for view in entity['directions'].values():
            for action, ids in view['actions'].items():
                view['actions'][action] = [moved[i] for i in ids]  # a KeyError here is a dropped frame still registered
    for n in sorted(pack.touched):
        info = index['pages'][n]
        buffer = io.BytesIO()
        pack.page(n).save(buffer, 'PNG', optimize=True)
        encoded = buffer.getvalue()
        if not pack.dry:
            (PACK / info['file']).write_bytes(encoded)
        with Image.open(io.BytesIO(encoded)) as decoded:
            decoded = decoded.convert('RGBA')
            info.update(width=decoded.width, height=decoded.height, sha256=sha256(encoded), pngBytes=len(encoded))
            for f in index['frames']:
                if f['page'] == n and sha256(decoded.crop((f['x'], f['y'], f['x'] + f['width'], f['y'] + f['height'])).tobytes()) != f['pixelSha256']:
                    sys.exit(f"the page lost pixels of {f['source']}")
    source['unique_png_count'] = len(index['frames'])
    if pack.dry:
        return
    (PACK / 'source-index.json').write_text(json.dumps(source, indent=2) + '\n')
    index['sourceIndexSha256'] = sha256((PACK / 'source-index.json').read_bytes())
    index['frameCount'] = len(index['frames'])
    (PACK / 'index.json').write_text(json.dumps(index, separators=(',', ':')) + '\n')


def main(args: list, dry: bool) -> None:
    *keys, folder = args
    delivery = Path(folder)
    manifest = json.loads((delivery / 'MANIFEST.json').read_text()) if (delivery / 'MANIFEST.json').exists() else {'entities': []}
    modes = {e['key']: 'central-body' in e.get('registrationMode', '') for e in manifest['entities']}
    if keys == ['--all']:
        keys = [e['key'] for e in manifest['entities']]
    pack = Pack(dry)
    for key in keys:
        print(f'{key}: {replace(pack, key, delivery, modes.get(key, False))}', file=sys.stderr)
    finish(pack)
    print(f'{len(keys)} creatures {"checked" if dry else "replaced"}; {len(pack.dead)} frames dropped; {len(pack.index["frames"])} frames in all; pages changed: '
          + ', '.join(f"{n} ({pack.page(n).width}x{pack.page(n).height})" for n in sorted(pack.touched)), file=sys.stderr)


if __name__ == '__main__':
    argv = [a for a in sys.argv[1:] if a != '--dry']
    if len(argv) < 2:
        sys.exit(__doc__)
    main(argv, '--dry' in sys.argv)
