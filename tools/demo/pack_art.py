#!/usr/bin/env python3
"""Repacks the creature art the demo keeps (docs/DEMO_BUILD.md), so the demo ships no picture of a creature it does not keep.

Reads the full game's two atlases (public/creatures/reviewed: the 105 creatures; public/creatures/allies: the seven allies) and
writes the demo's own into tools/demo/art/creatures/, the same schema: the kept entities only (KEEP.entities in
src/data/demoContent.ts), each one's frames copied pixel for pixel from the source page into new pages (nearest filter, gutter 1,
no resampling), each entity's frames on one page. Frames keep their source hashes, so the demo's manifest still names the art
it was made from. Deterministic: run it again after the source atlas or KEEP changes, then `npm run check:demo`.

    python3 -I tools/demo/pack_art.py            (needs pip install pillow)
"""

import hashlib
import json
import os
import re
import sys

from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SOURCE = os.path.join(ROOT, 'public', 'creatures')
OUT = os.path.join(ROOT, 'tools', 'demo', 'art', 'creatures')
KEEP_FILE = os.path.join(ROOT, 'src', 'data', 'demoContent.ts')
LIMIT = 2048  # the widest and tallest a demo page is
GUTTER = 1  # the same margin the source atlases use
# The display names the demo gives a kept creature whose full-game name names a horror the demo does not keep
# (src/data/entities/lesser.ts: `__DEMO__ ? 'Cultist' : 'Cthulhu Cultist'`). Nothing reads an atlas's names at run time.
DEMO_NAMES = {'cthulhu_cultist': 'Cultist'}


def kept_entities():
    """The ids of KEEP.entities, read from demoContent.ts (its one `entities:` list)."""
    text = open(KEEP_FILE, encoding='utf8').read()
    block = re.search(r"entities: \[(.*?)\],", text, re.S)
    if not block:
        sys.exit('pack_art: KEEP.entities not found in src/data/demoContent.ts')
    ids = re.findall(r"'([a-z0-9_]+)'", block.group(1))
    if not ids:
        sys.exit('pack_art: KEEP.entities is empty')
    return ids


class Shelves:
    """Shelf packing: frames left to right, rows top to bottom, a new page when a row does not fit."""

    def __init__(self):
        self.pages = []  # each: {'x', 'y', 'row', 'used', 'boxes': [(src_page, sx, sy, w, h, dx, dy)]}

    def _cursor(self, page):
        return page['x'], page['y'], page['row']

    def _fit(self, page, rects):
        x, y, row = self._cursor(page)
        out = []
        for w, h in rects:
            if x + w + GUTTER > LIMIT:
                x, y, row = GUTTER, y + row + GUTTER, 0
            if y + h + GUTTER > LIMIT:
                return None
            out.append((x, y))
            x += w + GUTTER
            row = max(row, h)
        return out, (x, y, row)

    def place(self, rects):
        """Places a group of rectangles on one page (a new one if it does not fit the current). Returns (page index, [(x, y)])."""
        if self.pages:
            fit = self._fit(self.pages[-1], rects)
            if fit is not None:
                positions, (x, y, row) = fit
                page = self.pages[-1]
                page['x'], page['y'], page['row'] = x, y, row
                page['used'] = max(page['used'], y + row + GUTTER)
                return len(self.pages) - 1, positions
        page = {'x': GUTTER, 'y': GUTTER, 'row': 0, 'used': GUTTER, 'boxes': []}
        fit = self._fit(page, rects)
        if fit is None:
            sys.exit('pack_art: an entity is larger than a page')
        positions, (x, y, row) = fit
        page['x'], page['y'], page['row'] = x, y, row
        page['used'] = max(page['used'], y + row + GUTTER)
        self.pages.append(page)
        return len(self.pages) - 1, positions


def sha256(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(f.read()).hexdigest()


def pack(name, pack_dir, out_dir, keep, source_pages):
    index = json.load(open(os.path.join(pack_dir, 'index.json'), encoding='utf8'))
    chosen = [(key, entity) for key, entity in index['entities'].items() if key in keep]
    if not chosen:
        sys.exit(f'pack_art: {name} holds none of the kept entities')
    frames_src = index['frames']
    sheets = {}

    def sheet(page_index):
        if page_index not in sheets:
            path = os.path.join(pack_dir, index['pages'][page_index]['file'])
            sheets[page_index] = Image.open(path).convert('RGBA')
        return sheets[page_index]

    shelves = Shelves()
    new_frames, remap, placed = [], {}, {}
    entities = {}
    for key, entity in chosen:
        order = []
        for view in entity['directions'].values():
            for frames in view['actions'].values():
                for f in frames:
                    if f not in order:
                        order.append(f)
        todo = [f for f in order if f not in remap]
        rects = [(frames_src[f]['width'], frames_src[f]['height']) for f in todo]
        page, positions = shelves.place(rects)
        for f, (x, y) in zip(todo, positions):
            remap[f] = len(new_frames)
            new_frames.append(dict(frames_src[f], page=page, x=x, y=y))
            placed[remap[f]] = (frames_src[f]['page'], frames_src[f]['x'], frames_src[f]['y'], frames_src[f]['width'], frames_src[f]['height'], page, x, y)
        copy = json.loads(json.dumps(entity))
        copy['name'] = DEMO_NAMES.get(key, copy['name'])
        copy['page'] = new_frames[remap[order[0]]]['page'] if order else 0
        for view in copy['directions'].values():
            view['actions'] = {a: [remap[f] for f in frames] for a, frames in view['actions'].items()}
        entities[key] = copy

    os.makedirs(out_dir, exist_ok=True)
    for old in os.listdir(out_dir):
        if re.match(r'^(creatures|allies)-\d+\.png$', old) or old == 'index.json':
            os.remove(os.path.join(out_dir, old))
    out_pages = []
    template = index['pages'][0]
    for i, page in enumerate(shelves.pages):
        height = page['used']
        image = Image.new('RGBA', (LIMIT, height), (0, 0, 0, 0))
        for k, (src_page, sx, sy, w, h, dpage, dx, dy) in placed.items():
            if dpage != i:
                continue
            image.paste(sheet(src_page).crop((sx, sy, sx + w, sy + h)), (dx, dy))
        file = source_pages[i]
        path = os.path.join(out_dir, file)
        image.save(path, format='PNG')
        entry = {'file': file, 'width': LIMIT, 'height': height, 'sha256': sha256(path)}
        if 'pngBytes' in template:
            entry['pngBytes'] = os.path.getsize(path)
        out_pages.append(entry)

    ordered = {
        'format': index['format'],
        'sourceIndexSha256': index.get('sourceIndexSha256'),
        'entityCount': len(entities),
        'frameCount': len(new_frames),
    }
    for k in ('filter', 'mipmaps', 'gutter', 'coordinateOrigin'):
        if k in index:
            ordered[k] = index[k]
    ordered['pages'] = out_pages
    ordered['frames'] = new_frames
    ordered['entities'] = entities
    with open(os.path.join(out_dir, 'index.json'), 'w', encoding='utf8') as f:
        json.dump(ordered, f, indent=1)
        f.write('\n')
    print(f'{name}: {len(entities)} creatures, {len(new_frames)} frames, {len(out_pages)} page(s)')
    return entities, new_frames, out_pages


def verify(name, pack_dir, out_dir, source_index, demo_index):
    """Every kept frame's pixels are the source frame's, byte for byte, and every page's hash is its file's."""
    source = json.load(open(os.path.join(pack_dir, 'index.json'), encoding='utf8'))
    demo = json.load(open(os.path.join(out_dir, 'index.json'), encoding='utf8'))
    for key, entity in demo['entities'].items():
        src = source['entities'][key]
        for direction, view in entity['directions'].items():
            for action, frames in view['actions'].items():
                for new_i, old_i in zip(frames, [source_frame(src, direction, action, j) for j in range(len(frames))]):
                    nf, sf = demo['frames'][new_i], source['frames'][old_i]
                    if nf['pixelSha256'] != sf['pixelSha256'] or nf['source'] != sf['source']:
                        sys.exit(f'pack_art: {name}/{key} {direction}/{action} changed')
                    a = Image.open(os.path.join(pack_dir, source['pages'][sf['page']]['file'])).convert('RGBA').crop((sf['x'], sf['y'], sf['x'] + sf['width'], sf['y'] + sf['height']))
                    b = Image.open(os.path.join(out_dir, demo['pages'][nf['page']]['file'])).convert('RGBA').crop((nf['x'], nf['y'], nf['x'] + nf['width'], nf['y'] + nf['height']))
                    if a.tobytes() != b.tobytes():
                        sys.exit(f'pack_art: {name}/{key} {direction}/{action} pixels differ')
    for page in demo['pages']:
        if sha256(os.path.join(out_dir, page['file'])) != page['sha256']:
            sys.exit(f'pack_art: {name} page {page["file"]} hash is stale')


def source_frame(entity, direction, action, j):
    return entity['directions'][direction]['actions'][action][j]


def main():
    keep = set(kept_entities())
    base_entities, _, _ = pack('reviewed', os.path.join(SOURCE, 'reviewed'), os.path.join(OUT, 'reviewed'), keep,
                               [f'creatures-{i}.png' for i in range(64)])
    allies_entities, _, _ = pack('allies', os.path.join(SOURCE, 'allies'), os.path.join(OUT, 'allies'), keep,
                                 [f'allies-{i}.png' for i in range(64)])
    verify('reviewed', os.path.join(SOURCE, 'reviewed'), os.path.join(OUT, 'reviewed'), None, None)
    verify('allies', os.path.join(SOURCE, 'allies'), os.path.join(OUT, 'allies'), None, None)
    print('kept:', ', '.join(sorted(set(base_entities) | set(allies_entities))))


if __name__ == '__main__':
    main()
