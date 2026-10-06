"""Contact sheets for reviewing walks by eye: a row per creature, its idle and walk frames in each
side view at 3x on a ground line (red) and the canvas centre (blue), the two strides overlaid
(move_0 warm, move_1 cold: where they agree it is grey), and the row's findings written beside it."""
import os
import numpy as np
from PIL import Image, ImageDraw
from .checks import mask

SCALE, CELL, LABEL, PER_PAGE = 3, 64 * 3, 190, 12
COLUMNS = [('left', 'idle_0'), ('left', 'move_0'), ('left', 'move_1'), ('left', 'overlay'),
           ('right', 'move_0'), ('right', 'move_1'), ('front', 'move_0'), ('front', 'move_1')]


def _frame(pack, item, direction, name):
    """The frame as the game would draw it (a mirror-safe right is its left, mirrored), or None."""
    flip = direction == 'right' and not (item['frames'].get('right') or {})
    if flip and not item.get('mirror_safe'):
        return None
    frames = dict(pack.frames(item, 'left' if flip else direction, name.split('_')[0]))
    if name not in frames:
        return None
    rgba = pack.image(frames[name])
    return rgba[:, ::-1] if flip else rgba


def _overlay(pack, item, direction):
    a, b = _frame(pack, item, direction, 'move_0'), _frame(pack, item, direction, 'move_1')
    if a is None or b is None:
        return None
    ma, mb = mask(a), mask(b)
    out = np.zeros(a.shape, np.uint8)
    out[ma & mb] = (150, 150, 150, 255)
    out[ma & ~mb] = (235, 120, 70, 255)
    out[mb & ~ma] = (80, 170, 235, 255)
    return out


def write(pack, findings, out, keys=None):
    items = [i for i in pack.sprites() if keys is None or i['key'] in keys]
    by_key = {}
    for f in findings:
        by_key.setdefault(f['key'], []).append(f)
    os.makedirs(out, exist_ok=True)
    pages = []
    for start in range(0, len(items), PER_PAGE):
        chunk = items[start:start + PER_PAGE]
        sheet = Image.new('RGB', (LABEL + CELL * len(COLUMNS), 20 + CELL * len(chunk)), (70, 74, 72))
        draw = ImageDraw.Draw(sheet)
        for c, (d, name) in enumerate(COLUMNS):
            draw.text((LABEL + c * CELL + 4, 4), f'{d} {name}', fill=(255, 255, 200))
        for r, item in enumerate(chunk):
            y = 20 + r * CELL
            draw.text((4, y + 6), item['key'][:30], fill=(255, 255, 255))
            draw.text((4, y + 20), 'right mirrors left' if item.get('mirror_safe') else 'own right', fill=(200, 200, 160))
            checks = sorted({f'{f["direction"]}: {f["check"]}' for f in by_key.get(item['key'], [])})
            for i, line in enumerate(checks[:9]):
                draw.text((4, y + 40 + i * 14), line[:30], fill=(255, 150, 130))
            for c, (d, name) in enumerate(COLUMNS):
                rgba = _overlay(pack, item, d) if name == 'overlay' else _frame(pack, item, d, name)
                if rgba is None:
                    continue
                x = LABEL + c * CELL
                tile = Image.fromarray(np.ascontiguousarray(rgba), 'RGBA').resize((CELL, CELL), Image.NEAREST)
                sheet.paste(tile, (x, y), tile)
                draw.line([(x, y + 62 * SCALE), (x + CELL, y + 62 * SCALE)], fill=(255, 80, 80))
                draw.line([(x + 32 * SCALE, y), (x + 32 * SCALE, y + CELL)], fill=(90, 140, 255))
                draw.rectangle([x, y, x + CELL - 1, y + CELL - 1], outline=(40, 40, 40))
        path = os.path.join(out, f'walks_{start // PER_PAGE + 1:02d}.png')
        sheet.save(path)
        pages.append(path)
    print(f'{len(pages)} sheets in {out}')
    return pages
