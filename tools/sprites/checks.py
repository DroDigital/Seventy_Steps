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
