#!/usr/bin/env python3
"""The walk prompts for an image model (ChatGPT's image generation): one per entry of the creature library
(105: 96 sprite sets and 9 colossi), each asking for a 2x2 sheet on flat magenta that `fromsheet.py` turns
into the pack's frames. Left side only: the game flips it for the right.

  python3 prompts.py md > docs/SPRITE_PROMPTS.md        # the prompt book
  python3 prompts.py refs <pack folder> <out folder>    # each entry's front and side idle, upscaled, on magenta

The gaits are in gaits.py, the entries (and how each looks) in creatures.py."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gaits import CELLS, LEGGED
from creatures import ALL, SECTIONS, RIGHT_TOO

PROMPT = """\
Make ONE square image (1:1) of a pixel-art {kind}-cycle sprite sheet: a 2x2 grid of four equal square cells on a flat, solid magenta (#FF00FF) background. No borders between the cells, no text, no labels, no numbers, no ground line, no shadows, no gradients, no glow: nothing but the four sprites on pure magenta.

Subject: {name}, as shown in the attached reference image: {look}. The reference is its FRONT view (and, if a second image is attached, its standing pose in side view: match that profile exactly). Draw it in a perfect SIDE PROFILE, facing {side} ({face}). A flat side-on view: not three-quarter, not turned toward the viewer, not seen from above.

Style: keep the exact design, proportions, colours, shading and chunky low-resolution pixel-art look of the reference, as if each cell were a {px}x{px} sprite scaled up: hard pixel edges, no anti-aliasing, no blur, no new colours, no redesign, no extra limbs or accessories. In every cell: the same scale, the creature the same height from head to feet, standing on the same ground line (its lowest point at the same level in every cell), centred in the cell with a margin all around and nothing touching the cell edge.

The four cells are ONE {kind} cycle, read left to right, top to bottom.
{cells}{extra}

{end}"""
END_LEGGED = ('The four cells must show four DIFFERENT poses: cells 3 and 4 are the other-leg versions of '
              'cells 1 and 2, never copies.')
END_LOOP = 'The four cells must show four DIFFERENT poses of one smooth, looping motion, never copies of each other.'


def slug(key):
    return key.replace('#', '-')


def entry(key):
    return next(e for e in ALL if e[0] == key)


def prompt(key, side='LEFT'):
    _, name, gait, look, extra = entry(key)
    legged = gait in LEGGED
    cells = CELLS[gait]
    face = 'its face toward the left edge of each cell' if side == 'LEFT' else 'its face toward the right edge of each cell'
    return PROMPT.format(kind='walk' if legged else 'movement', name=name, look=look, side=side,
                         face=face, px=128 if key in COLOSSUS_KEYS else 64, cells=cells,
                         extra=('\n\n' + extra) if extra else '', end=END_LEGGED if legged else END_LOOP)


COLOSSUS_KEYS = {e[0] for e in SECTIONS[1][2]}


def stems():
    return {e[0]: f'{n:03d}_{slug(e[0])}' for n, e in enumerate(ALL, 1)}


def md():
    st = stems()
    out = [HEAD.format(total=len(ALL))]
    for letter, title, group in SECTIONS:
        out.append(f'## {letter}. {title} ({len(group)})\n')
        for key, name, gait, look, extra in group:
            s = st[key]
            out.append(f'### {s.split("_")[0]}. {name}  (`{s}`)\n')
            out.append(f'Attach `{s}_front.png` and `{s}_side.png`. Save the result as `{s}.png`.\n')
            out.append('```text\n' + prompt(key) + '\n```\n')
            if key in RIGHT_TOO:
                out.append('Optional, only if you want its own right side (otherwise the game flips the left walk, '
                           f'which only switches what it carries or wears): save as `{s}_right.png`.\n')
                out.append('```text\n' + prompt(key, 'RIGHT') + '\n```\n')
    out.append(TAIL)
    return '\n'.join(out)


HEAD = """\
# Walk prompts for ChatGPT image generation

One prompt for each of the library's {total} entries (96 creature sets and 9 colossi), left side only: the game
flips it for the right (`keziah_mason` and `the_outsider`, which are one-sided, also have an optional
right-hand prompt). Idle, attack, hurt, front and back are not touched.

Where the library stands: every creature with legs now has a four-frame side walk (made in the last session
with ElevenLabs, or from the v1 frames, or by Codex), so **A** (the 35 without legs: slither, ooze, float,
wingbeat) and **B** (the nine colossi) are the ones nobody has drawn. **C** and **D** are there for any walk
you are not happy with: redo only those.

## How to use it
1. A new chat for each entry (a fresh chat keeps one creature's style from leaking into the next).
2. Attach the two reference images named under the heading (from `refs_x8.zip`, or take the entry's own
   `front/idle_0.png` and `left/idle_0.png` from the pack; the second one matters: it shows the side
   design the walk must keep). Paste the prompt. Ask for **image generation** (square, 1024x1024).
3. Look at the sheet (the four checks below). If one fails, say so in one line (the fixes below) rather
   than starting over; if it is still wrong after two tries, start a new chat and try again.
4. Save each good sheet as the name under the heading, in one folder, and give me the folder (a Google
   Drive link, as before). I key out the magenta, bring each cell to the pack's frames in the
   creature's own colours, run the review (`tools/sprite_review.py audit`) and hand back a zip.

## What to check on every sheet
1. **Four cells, all facing left**, on flat magenta (no checkerboard, no border lines, no text).
2. **Legged creatures: the legs swap.** The leg that is forward in cell 1 is **back** in cell 3 (and cell 4
   is cell 2 with the other leg lifted). If cell 3 looks like cell 1, it fails: that is the walk that reads
   as one leg dragging. **Creatures without legs:** four different poses of one smooth loop, cell 4 leading
   back into cell 1.
3. **One size:** the creature is the same height and scale in all four cells, standing on one level.
4. **Pure profile:** no cell turned toward you; the design is the reference's, not a new one.

## One-line fixes (paste as a reply)
- Wrong background: `Redo it on a flat solid #FF00FF background with no gradient, no borders, no shadows.`
- Facing the wrong way: `Redo it with the creature facing LEFT in all four cells.`
- Cell 3 copies cell 1: `Cell 3 must be the mirror of cell 1's legs: the leg that is forward in cell 1 must be back in cell 3, and the other leg forward. Cell 4 likewise against cell 2. Redo the sheet.`
- Sizes differ: `Redo it with the creature exactly the same size and the same height in all four cells, standing on the same line.`
- Turned toward you: `Redo it with every cell in strict side profile, like a flat 2D side view.`
- Redesigned: `Keep the creature exactly as in the attached images: same shapes, same colours, nothing new.`
"""

TAIL = """
## After the sheets
Name them as above (`001_dagon_priest.png`, ...) and put them in one folder. I run, per sheet,
`python3 tools/sprites/fromsheet.py <sheet> <pack> <key> left`, then the review, and look at every walk.
What fails the review goes back to you as a short list with the reason. (The colossi are 128x128; the tool
takes the frame size from the idle.)
"""


def refs(pack_dir, out):
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    from sprites.pack import Pack, _rel
    from PIL import Image
    import numpy as np
    pack = Pack(pack_dir)
    items = {i['key']: i for i in pack.items}
    os.makedirs(out, exist_ok=True)
    for key, s in stems().items():
        item = items[key]
        for view, direction in (('front', 'front'), ('side', 'left')):
            if item.get('renderer') == 'sprite':
                path = dict(pack.frames(item, direction, 'idle'))['idle_0']
            else:
                path = _rel(item['movement'][direction]['idle_0'])
            im = Image.fromarray(pack.image(path), 'RGBA')
            im = im.resize((512, 512), Image.NEAREST)
            bg = Image.new('RGBA', im.size, (255, 0, 255, 255))
            bg.alpha_composite(im)
            bg.convert('RGB').save(os.path.join(out, f'{s}_{view}.png'))
    print(f'{2 * len(ALL)} references in {out}')


if __name__ == '__main__':
    if sys.argv[1:2] == ['md']:
        print(md())
    elif sys.argv[1:2] == ['refs'] and len(sys.argv) == 4:
        refs(sys.argv[2], sys.argv[3])
    else:
        sys.exit(__doc__)
