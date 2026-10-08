#!/usr/bin/env python3
"""ChatGPT batches for the walks of every two- and four-legged creature, from the original (v1) frames:
a four-frame walk for each in its front, back and left view (and its right, where it is one-sided), ten
sheets to a request, each with its reference (the view's idle_0, 16x, transparent).

  python3 batches.py <v1 pack folder> <out folder>     # refs, prompts, jobs.csv, PROJECT_INSTRUCTIONS.txt
  python3 batches.py md <v1 pack folder> > docs/SPRITE_BATCHES.md

A finished sheet is saved as <out>/Bnn/kk.png (kk its place in the batch); jobs.csv says which creature
and view it is, for fromsheet.py."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from creatures import NEEDED, HAVE

ORDER = ('robed', 'biped', 'hunched', 'quad', 'toad', 'waddle')     # one body plan after another
BODY = {'robed': 'robed', 'biped': 'two legs', 'hunched': 'hunched, two legs', 'quad': 'four legs',
        'toad': 'four legs, toad-like', 'waddle': 'penguin'}
VIEWS = {'front': 'FRONT view', 'back': 'BACK view', 'left': 'LEFT view (facing left)',
         'right': 'RIGHT view (facing right)'}
PER_BATCH = 10
# v1's own facing mistakes, so each reference faces the way its job says: Innsmouth's left and right sets are
# swapped (v1fixes.py), the Deep One's left faces right in both forms (Codex redrew it later; v1 is the base)
SWAPPED = {'innsmouth_hybrid': {'left': 'right', 'right': 'left'}}
FLIPPED = {'deep_one': 'left', 'deep_one#eldritch': 'left'}

INSTRUCTIONS = """\
You make pixel-art WALK CYCLE sprite sheets for a game: one sheet per job. When a message lists several jobs, make every one of them, each as its own separate image, in the order listed.

INPUT: each job has one attached reference: a 64x64 pixel-art sprite enlarged to 1024x1024 (every pixel a 16x16 block) on a transparent background, showing the creature standing still in the job's view (FRONT, BACK, LEFT or RIGHT).

OUTPUT: one square image per job, 1024x1024: a 2x2 grid of four equal 512x512 cells on a transparent background. Nothing else: no borders, grid lines, text, numbers, labels, ground line, shadows or glow.

SAME CREATURE, SAME VIEW: each cell is the reference picture shrunk to exactly half size (512x512) with only the walking parts moved. The creature keeps the reference's place and size in the cell, its feet on the same row. Same face, design, proportions, colours and outline: never redesign it, never change its colours, never turn it to another view, never flip it.

PIXELS: every pixel of the 64x64 sprite is one crisp 8x8 block in its cell, the same block size in all four cells. Only the reference's colours. Hard edges, no anti-aliasing, no blur, no smoothing, no new detail.

A REAL WALK, NOT A STILL. Measured in the sprite's own 64x64 pixels: steps reach 4 to 8 px from the body's centre; hands swing 4 to 7 px; the body rises 1 to 2 px at the passing poses. The four cells loop, read left to right, top to bottom.

SIDE VIEW (LEFT or RIGHT; it faces the way the reference faces):
1. Contact: the near leg (lighter) forward with the heel down, the far leg (darker, behind) back with the toe down; the far arm forward, the near arm back.
2. Passing: the near leg straight under the body; the far leg bent and swinging forward past it, foot lifted; body 1 to 2 px higher; arms by the hips.
3. Contact on the other leg: the far leg forward, the near leg back; the arms swapped. The mirror of cell 1, NOT a copy.
4. Passing: the far leg straight; the near leg bent and swinging past; body higher; arms by the hips.

FRONT VIEW (facing the viewer):
1. Contact: the creature's right leg (on the viewer's left) steps toward the viewer: its foot 1 to 2 px lower and a little wider, the knee slightly bent; the other foot behind, 2 to 3 px higher, heel lifted. The body shifts 1 px over the stepping leg. The arm on the other side swings forward (its hand 2 to 3 px lower), the arm on the stepping side swings back (its hand shorter, partly behind the hip).
2. Passing: the right leg straight, carrying the weight; the left foot lifted 2 to 3 px with the knee bent, passing beside it; body 1 to 2 px higher; arms by the hips.
3. Contact on the other leg: the creature's left leg steps toward the viewer, the right one behind; the arms swapped. The legs and arms mirror cell 1; the face, the light and the markings do NOT flip.
4. Passing: the left leg straight; the right foot lifted and passing; body higher.

BACK VIEW (seen from behind): as the front view, but the stepping foot goes away from the viewer: at contact the leading foot sits 2 to 3 px higher (further off) and the trailing foot nearer and lower, its heel lifted and sole showing. The arms swing the same way.

BODY TYPES (each job names one):
- two legs: as above.
- hunched, two legs: knees bent, heavy steps, the long arms swing low; the body leans the same amount in every cell.
- robed: the robe hides the legs, so each step shows in the hem and the foot tips. At contact the stepping foot shows under the hem and pushes it out (front and back: the hem's lower edge tilts 3 to 4 px toward the stepping side; side: pushed forward over the shin and trailing back behind). At passing the hem swings back the other way and the folds bunch at the knee. The sleeves swing with the arms.
- four legs: diagonal pairs. Cell 1: the near front leg and the far hind leg reach forward (front and back views: the creature's right foreleg and its left hind leg step). Cell 2: the legs gather under the body, 1 px higher. Cell 3: the other pair. Cell 4: gathered again. The head bobs 1 px.
- four legs, toad-like: a squat crawl, the short legs in diagonal pairs, the body low and rocking 1 px (side to side in front and back views, forward and back in side views).
- penguin: a waddle: the whole body tilts 2 px toward the stepping foot, the feet alternate, the flippers swing out.

CLOTH, HAIR AND LOOSE PARTS follow through, a beat behind the body: hems, coat tails, sleeves, capes, stoles, tatters, hair, tentacles and tails swing and trail, with a different outline in every cell. Heavy cloth swings less, but always moves.

CHECK EACH SHEET before answering: lay cell 1 over cell 3, and the legs, the arms and the hem are clearly in different places; cells 2 and 4 lift different feet; no two cells are the same picture; every cell matches the reference's size, colours and view."""


def slug(key):
    return key.replace('#', '-')


def jobs(pack):
    """[(batch, place, key, name, view, line)] for every legged creature, ten to a batch, a creature's
    views kept in one batch."""
    items = {i['key']: i for i in pack.sprites()}
    plans = [e for g in ORDER for e in NEEDED + HAVE if e[2] == g]
    out, batch, used = [], 1, 0
    for key, name, gait, look, extra in plans:
        views = ['front', 'back', 'left'] + ([] if items[key].get('mirror_safe') else ['right'])
        if used + len(views) > PER_BATCH:
            batch, used = batch + 1, 0
        for view in views:
            note = extra
            if 'profile' in extra and view in ('front', 'back'):
                note = f'Keep it facing straight {"at" if view == "front" else "away from"} the viewer in every cell.'
            line = f'{name}, {VIEWS[view]}, {BODY[gait]}: {look}.' + (f' {note}' if note else '')
            used += 1
            out.append((batch, used, key, name, view, line))
    return out


def prompt(batch, rows):
    head = (f'Batch B{batch:02d}: make these {len(rows)} jobs as {len(rows)} separate images, in this order, '
            'following the project instructions. The references are attached, named by job.\n')
    return head + '\n'.join(f'{n}. B{batch:02d}-{n:02d}: {line}' for b, n, k, nm, v, line in rows)


def build(pack_dir, out):
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    from sprites.pack import Pack
    from PIL import Image
    import numpy as np
    pack = Pack(pack_dir)
    items = {i['key']: i for i in pack.sprites()}
    rows = jobs(pack)
    os.makedirs(out, exist_ok=True)
    open(os.path.join(out, 'PROJECT_INSTRUCTIONS.txt'), 'w').write(INSTRUCTIONS + '\n')
    with open(os.path.join(out, 'jobs.csv'), 'w') as f:
        f.write('batch,place,key,view\n')
        for b, n, key, name, view, line in rows:
            f.write(f'B{b:02d},{n:02d},{key},{view}\n')
    for b in sorted({r[0] for r in rows}):
        mine = [r for r in rows if r[0] == b]
        d = os.path.join(out, f'B{b:02d}')
        os.makedirs(d, exist_ok=True)
        open(os.path.join(d, 'PROMPT.txt'), 'w').write(prompt(b, mine) + '\n')
        for _, n, key, name, view, line in mine:
            source = SWAPPED.get(key, {}).get(view, view)
            px = pack.image(dict(pack.frames(items[key], source, 'idle'))['idle_0'])
            if FLIPPED.get(key) == view:
                px = px[:, ::-1]
            im = Image.fromarray(np.ascontiguousarray(px), 'RGBA').resize((1024, 1024), Image.NEAREST)
            im.save(os.path.join(d, f'B{b:02d}-{n:02d}_{slug(key)}_{view}.png'), optimize=True)
    print(f'{len(rows)} jobs in {rows[-1][0]} batches in {out}')
    return rows


def md(pack_dir):
    sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    from sprites.pack import Pack
    rows = jobs(Pack(pack_dir))
    out = ['# Walk batches for ChatGPT', '',
           f'{len(rows)} sheets in {rows[-1][0]} batches of up to {PER_BATCH}: every two- and four-legged creature, '
           'front, back and left (and right for the one-sided), from the original (v1) frames. The project '
           'instructions go into the ChatGPT project once; each batch is one message with its references attached. '
           'Made by `tools/sprites/batches.py`.', '', '## Project instructions', '', '```text', INSTRUCTIONS, '```', '']
    for b in sorted({r[0] for r in rows}):
        out += [f'## B{b:02d}', '', '```text', prompt(b, [r for r in rows if r[0] == b]), '```', '']
    return '\n'.join(out)


if __name__ == '__main__':
    if len(sys.argv) == 3 and sys.argv[1] == 'md':
        print(md(sys.argv[2]))
    elif len(sys.argv) == 3:
        build(sys.argv[1], sys.argv[2])
    else:
        sys.exit(__doc__)
