"""The walk checks: what a creature's idle and move frames must hold, measured on their silhouettes
(alpha over 40). Each finding names the creature, the direction, the check and the numbers, so it
can be handed back to whoever draws the frames as it stands. The limits are in LIMITS."""
import numpy as np

LIMITS = dict(
    side_walk_frames=4,   # a profile walk needs contact, passing, contact, passing
    ground_px=1,          # feet on the idle's ground line, within a pixel
    grounded_row=56,      # an idle whose lowest pixel is at or below this row stands on the ground
    height_px=3,          # height against the idle: this many pixels, or HEIGHT_SHARE of it
    height_share=0.08,
    pair_area=0.15,       # the two halves of a stride drawn the same size, within this share
    leg_motion=0.12,      # the legs' band must change by at least this share between strides
    torso_px=3,           # the upper body steady across the cycle, within this many pixels
    leg_swap=0.10,        # move_2 and move_0 (and 3 and 1) must differ in the legs by at least this share
    turned=0.10,          # a side frame matching its idle this much better mirrored faces the other way
    alpha=40,
)
SIDES = ('left', 'right')


def mask(rgba):
    return rgba[..., 3] > LIMITS['alpha']


def shape(m):
    """Bounds, area, the upper body's x (the top 40% of the silhouette) and the legs' band."""
    ys, xs = np.nonzero(m)
    if not len(xs):
        return None
    y0, y1 = int(ys.min()), int(ys.max())
    h = y1 - y0 + 1
    top = m[y0:y0 + max(2, int(h * 0.4))]
    return dict(top=y0, bottom=y1, left=int(xs.min()), right=int(xs.max()), height=h,
                area=int(m.sum()), torso_x=float(np.nonzero(top)[1].mean()),
                legs=(y0 + int(h * 0.65), y1 + 1))


def _shifted(a, dx, dy):
    """The frame moved dx right and dy down; what leaves the canvas is dropped."""
    out = np.zeros_like(a)
    h, w = a.shape[:2]
    out[max(dy, 0):h + min(dy, 0), max(dx, 0):w + min(dx, 0)] = \
        a[max(-dy, 0):h - max(dy, 0), max(-dx, 0):w - max(dx, 0)]
    return out


def _mismatch(a, ref, rows):
    """How far a frame's head and upper body are from the idle's: where one is drawn and the other
    not, and the colour where both are, as a share of what either draws."""
    ma, mr = mask(a)[rows], mask(ref)[rows]
    colour = np.abs(a[rows, :, :3].astype(int) - ref[rows, :, :3].astype(int)).sum(-1) / 765
    return ((ma ^ mr).sum() + 2 * (colour * (ma & mr)).sum()) / max(1, (ma | mr).sum())


def facing(a, ref, reach=3):
    """Above 0 the frame faces the way its idle does, below 0 the other way: how much better its head
    and upper body (the top 60% of the idle) match the idle's as drawn than mirrored, each set over
    the idle by its upper body and feet, then tried a few pixels either way. Near 0 it cannot tell
    (a blob, a figure seen from the front)."""
    r = shape(mask(ref))
    rows = slice(r['top'], r['top'] + max(3, int(r['height'] * 0.6)))

    def best(x):
        s = shape(mask(x))
        dx, dy = round(r['torso_x'] - s['torso_x']), r['bottom'] - s['bottom']
        return min(_mismatch(_shifted(x, dx + i, dy + j), ref, rows)
                   for i in range(-reach, reach + 1) for j in range(-2, 3))
    same, flipped = best(a), best(a[:, ::-1])
    return (flipped - same) / max(1e-6, flipped + same)


def _f(item, direction, check, detail, fix=None, **numbers):
    return dict(key=item['key'], name=item.get('display_name', item['key']), direction=direction,
                check=check, detail=detail, fix=fix, numbers=numbers)


def check_direction(pack, item, direction, notes):
    """Every finding for one direction of one creature."""
    out = []
    idle = pack.frames(item, direction, 'idle')
    move = pack.frames(item, direction, 'move')
    if not idle or not move:
        return out
    glide = notes.get('motion') == 'glide'
    ref = shape(mask(pack.image(idle[0][1])))
    frames = [(n, p, shape(mask(pack.image(p)))) for n, p in idle[1:] + move]
    if direction in SIDES and len(move) < LIMITS['side_walk_frames'] and not glide:
        out.append(_f(item, direction, 'walk-frames',
                      f'{len(move)}-frame profile walk; it needs {LIMITS["side_walk_frames"]} '
                      '(contact, passing, contact on the other foot, passing)', frames=len(move)))
    elif direction in SIDES and len(move) < LIMITS['side_walk_frames']:
        out.append(_f(item, direction, 'glide-frames',
                      f'no stride (it slides, oozes or flies) and a {len(move)}-key move: let the engine move it '
                      '(a bob, a squash, a sway) or draw four keys', frames=len(move)))
    size = pack.image(idle[0][1]).shape
    for name, path, s in [(idle[0][0], idle[0][1], ref)] + frames:
        if s['top'] == 0 or s['left'] == 0 or s['right'] == size[1] - 1 or s['bottom'] == size[0] - 1:
            out.append(_f(item, direction, 'edge', f'{name} touches the canvas edge', frame=name))
    if direction in SIDES:
        for name, path, s in frames:
            score = facing(pack.image(path), pack.image(idle[0][1]))
            if score < -LIMITS['turned']:
                out.append(_f(item, direction, 'turned',
                              f'{name} faces the other way from the idle (mirrored, its head and upper body match '
                              f'the idle\'s better: {score:+.2f}); redraw it facing {direction}',
                              frame=name, score=round(float(score), 2)))
    grounded = ref['bottom'] >= LIMITS['grounded_row'] and not notes.get('flies') and not glide
    for name, path, s in frames:
        drop = s['bottom'] - ref['bottom']
        if grounded and abs(drop) > LIMITS['ground_px']:
            out.append(_f(item, direction, 'ground',
                          f'{name} stands {abs(drop)} px {"below" if drop > 0 else "above"} the idle\'s ground line',
                          fix='shift', frame=name, px=drop))
        dh = s['height'] - ref['height']
        if name.startswith('move') and not glide and \
                abs(dh) > max(LIMITS['height_px'], LIMITS['height_share'] * ref['height']):
            out.append(_f(item, direction, 'height',
                          f'{name} is {abs(dh)} px {"taller" if dh > 0 else "shorter"} than the idle '
                          f'({s["height"]} against {ref["height"]}): off model', frame=name, px=dh))
    if len(move) >= 2:
        a, b = [s for n, p, s in frames if n.startswith('move')][:2]
        share = abs(a['area'] - b['area']) / max(a['area'], b['area'])
        if share > LIMITS['pair_area']:
            out.append(_f(item, direction, 'pair-size',
                          f'move_0 and move_1 differ by {share:.0%} in area: two different drawings, not one stride',
                          share=round(share, 2)))
        if not glide:
            m0, m1 = mask(pack.image(move[0][1])), mask(pack.image(move[1][1]))
            y0, y1 = min(a['legs'][0], b['legs'][0]), max(a['legs'][1], b['legs'][1])
            union = (m0 | m1)[y0:y1].sum()
            change = (m0 ^ m1)[y0:y1].sum() / union if union else 0
            if change < LIMITS['leg_motion']:
                out.append(_f(item, direction, 'legs-still',
                              f'the legs change by {change:.0%} between strides: it glides', change=round(float(change), 2)))
        moves = [s for n, p, s in frames if n.startswith('move')]
        xs = [s['torso_x'] for s in moves]
        if not glide and max(xs) - min(xs) > LIMITS['torso_px']:
            out.append(_f(item, direction, 'torso-drift',
                          f'the upper body shifts {max(xs) - min(xs):.1f} px across the walk: it jitters',
                          fix='centre', px=round(max(xs) - min(xs), 1)))
    if not glide and len(move) >= 4:
        out += _same_leg(pack, item, direction, move)
    return out


def _same_leg(pack, item, direction, move):
    """The second half of a four-frame walk must lead with the other leg: move_2 is the mirror of
    move_0's stride, not a copy of it. A copy keeps the same leg in front for ever, which is the walk
    that reads as one leg dragging behind."""
    out = []
    for a, b in ((0, 2), (1, 3)):
        A, B = pack.image(move[a][1]).astype(int), pack.image(move[b][1]).astype(int)
        ma, mb = A[..., 3] > LIMITS['alpha'], B[..., 3] > LIMITS['alpha']
        s = shape(ma | mb)
        y0, y1 = s['legs']
        union = (ma | mb)[y0:y1]
        differ = ((ma ^ mb) | (np.abs(A[..., :3] - B[..., :3]).sum(-1) > 40))[y0:y1] & union
        share = differ.sum() / max(1, union.sum())
        if share < LIMITS['leg_swap']:
            out.append(_f(item, direction, 'same-leg',
                          f'{move[b][0]} repeats {move[a][0]} in the legs ({share:.0%} different): the same leg '
                          f'stays in front all cycle; in {move[b][0]} the other leg must lead', share=round(float(share), 2)))
    return out


def audit(pack, notes):
    """Every finding of the pack, and the creatures checked."""
    findings = []
    for item in pack.sprites():
        n = notes.get(item['key'], {})
        for direction in ('front', 'left', 'back', 'right'):
            findings += check_direction(pack, item, direction, n)
        for line in n.get('eye', []):
            findings.append(_f(item, line.get('direction', 'left'), line['check'], line['detail'],
                               fix=line.get('fix')))
    return findings
