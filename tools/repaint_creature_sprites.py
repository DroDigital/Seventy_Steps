#!/usr/bin/env python3
"""Bake material texture and anatomical detail onto registered sprite poses.

Needs Pillow, NumPy and SciPy. Run with a staging directory, then validate and
install the pages with tools/install_sprite_paint.py.
"""
import argparse
from concurrent.futures import ProcessPoolExecutor
from functools import lru_cache
from hashlib import sha256
import json
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import distance_transform_edt, gaussian_filter, map_coordinates, maximum_filter

from reviewed_look import measure_lights, read_pack
from sprites.materials import BASE, MAT, MATERIALS, material_map
from sprites.paint_forms import FRONT, SECONDARY
from sprites.paint_registration import register

ART = Path(__file__).resolve().parent / 'sprites'
LUMA = np.array([.25, .64, .11], dtype=np.float32)
GAME_LUMA = np.array([.2126, .7152, .0722], dtype=np.float32)
# Keep these forms' material accents within their muted, realm-graded palettes.
CHROMA = {
    'being_of_ib': .89, 'curwen_pit_thing': .88, 'mi_go#eldritch': .87,
    'nug': .75, 'yeb': .87, 'zann_window_thing': .78,
}
# Feature spacing in texels, and the contrast of each relief and hue treatment.
RELIEF = {
    'hide': (27, 30, .42), 'flesh': (35, 35, .59), 'bone': (26, 28, .25),
    'scale': (32, 33, .42), 'chitin': (29, 32, .45), 'membrane': (35, 30, .51),
    'slime': (32, 30, .36), 'fur': (24, 27, .32), 'feather': (33, 29, .35),
    'cloth': (22, 27, .23), 'leather': (27, 28, .34), 'metal': (25, 30, .22),
    'stone': (30, 29, .32), 'spectral': (42, 27, .40), 'wood': (32, 29, .37),
}


@lru_cache
def atlas_cells(name, count):
    mode = 'RGBA' if name == 'anatomy' else 'RGB'
    with Image.open(ART / 'paint' / f'{name}.png') as opened:
        sheet = opened.convert(mode)
    cell = sheet.width // 4
    images = []
    for index in range(count):
        x, y = (index % 4) * cell, (index // 4) * cell
        tile = sheet.crop((x + 2, y + 2, x + cell - 2, y + cell - 2))
        if name == 'anatomy':
            # Ignore translucent fringe beyond the form while keeping its soft edge.
            solid = tile.getchannel('A').point(lambda value: 255 if value > 110 else 0)
            tile = tile.crop(solid.getbbox())
        images.append(np.asarray(tile.resize((96, 96), Image.Resampling.LANCZOS), dtype=np.float32))
    return images


@lru_cache
def surface_fields():
    fields = []
    for tile in atlas_cells('surfaces', len(MATERIALS)):
        lum = tile @ LUMA
        # Keep the larger ridges and clusters through minification. The source
        # pose provides the large form shading under the material relief.
        local = gaussian_filter(lum, 1.15) - gaussian_filter(lum, 12)
        relief = np.clip(local / max(np.std(local) * 2.1, 1), -1.2, 1.2)
        chroma = gaussian_filter(tile - lum[..., None], (1.1, 1.1, 0))
        fields.append(np.dstack((relief, chroma)))
    return fields


def sample(image, x, y, mode):
    return np.stack([map_coordinates(channel, (y, x), order=1, mode=mode, prefilter=False)
                     for channel in image.transpose(2, 0, 1)], axis=-1)


def normalized_grid(shape, bounds):
    y, x = np.indices(shape, dtype=np.float32)
    left, top, right, bottom = bounds
    return (x + .5 - left) / (right - left), (y + .5 - top) / (bottom - top)


def paint(key, direction, rgba, reference, bounds, ref_bounds, eye, glint, register_pose):
    texture_seed = sha256(key.encode()).digest()
    geometry_seed = sha256(f'{key}/{direction}'.encode()).digest()
    alpha = rgba[..., 3]
    rgb = rgba[..., :3].astype(np.float32)
    lum = rgb @ LUMA
    solid = alpha > 32
    depth = distance_transform_edt(solid)
    soft_depth = np.clip((depth - .45) / 2.4, 0, 1)
    internal = np.clip((depth - 1) / 2.6, 0, 1)
    x, y = normalized_grid(lum.shape, bounds)
    mat = material_map(key, direction, rgba, x, y)

    if register_pose:
        u, v = register(reference, rgba)
    else:
        left, top, right, bottom = ref_bounds
        u = left + x * (right - left) - .5
        v = top + y * (bottom - top) - .5
    left, top, right, bottom = ref_bounds
    px, py = u - left + .5, v - top + .5
    anchor_x, anchor_y = px / (right - left), py / (bottom - top)

    # Modest resculpting of the authored light and shadows keeps faces legible
    # in dark places while retaining dark cavities and existing anatomy.
    weight = np.clip((lum - 10) / 62, 0, 1)
    broad = gaussian_filter(lum * solid, 1.3) / np.maximum(gaussian_filter(solid.astype(np.float32), 1.3), .01)
    modeling = np.clip(lum - broad, -27, 27) * .28
    lifted = lum + weight * (6.5 + 9 * np.sin(lum * np.pi / 255))
    nearby_edges = np.clip(np.hypot(*np.gradient(broad)) / 32, 0, .63)
    paintable = soft_depth * weight * (1 - nearby_edges * .6) * np.clip(alpha / 224, 0, 1)
    painted = lifted[..., None] + (rgb - lum[..., None]) * 1.10 + (modeling * soft_depth)[..., None]
    scale = np.clip(np.sqrt((bottom - top) / 48), .79, 1.57)
    for name, field in zip(MATERIALS, surface_fields()):
        mask = (mat == MAT[name]) & (alpha != 0)
        if not np.any(mask):
            continue
        spacing, contrast, tint = RELIEF[name]
        factor = 95 / (spacing * scale)
        # The gentle warp breaks up rows of repeating features. Stable phase
        # and orientation are shared by every frame of this form and view.
        sign = -1 if direction == 'right' else 1
        tx = factor * (sign * px + .18 * py + 1.7 * np.sin(py * .19)) + texture_seed[0]
        ty = factor * (py - .09 * px + 1.4 * np.sin(px * .20)) + texture_seed[1]
        surface = sample(field, tx[mask], ty[mask], 'reflect')
        light = contrast * surface[:, 0]
        gloss = np.maximum(surface[:, 0] - .53, 0) * (14 if name in ('slime', 'scale', 'metal', 'flesh') else 4)
        color = (light + gloss)[:, None] + surface[:, 1:] * tint
        strength = paintable[mask]
        if name in ('slime', 'membrane', 'chitin', 'spectral'):
            # Blue and green glints on dark wet material need to survive the
            # game's low resolution and fog, even when the original is near black.
            low_light = np.clip((lum[mask] - 4) / 28, 0, 1)
            sheen = np.maximum(surface[:, 0] - .24, 0) * low_light
            color += sheen[:, None] * np.array([4, 15, 20])
            strength = np.maximum(strength, soft_depth[mask] * low_light * .77)
        painted[mask] += color * strength[:, None]

    if direction == 'front':
        marks = FRONT.get(key, ())
    else:
        base = MATERIALS[BASE[key]]
        mark = SECONDARY.get(base)
        marks = [(mark[0], .42 + geometry_seed[0] / 1600, .53, mark[3] * .90, mark[4],
                  mark[5] * .88, mark[6])] if mark and key in FRONT else []

    for index, cx, cy, width, height, strength, surfaces in marks:
        decal = atlas_cells('anatomy', 16)[index]
        dx = ((anchor_x - cx) / width + .5) * 95
        dy = ((anchor_y - cy) / height + .5) * 95
        mask = (dx >= 0) & (dx <= 95) & (dy >= 0) & (dy <= 95)
        mask &= np.isin(mat, [MAT[name] for name in surfaces.split()]) & (internal > 0)
        if not np.any(mask):
            continue
        detail = sample(decal, dx[mask], dy[mask], 'nearest')
        value = detail[:, :3] @ LUMA
        relief = np.clip((value - 101) * .93, -65, 64)
        decal_tone = (detail[:, :3] - value[:, None]) * .72 + relief[:, None]
        patch = painted[mask] + decal_tone + (rgb[mask] - painted[mask]) * .30
        a = strength * (detail[:, 3] / 255) * internal[mask] * np.clip((lum[mask] - 12) / 49, 0, 1)
        painted[mask] += (patch - painted[mask]) * a[:, None]

    protected = (alpha <= 8)
    if glint:
        color = np.round(np.array(glint) * 255)
        protected |= np.sum(np.abs(rgb - color), axis=-1) <= 3
    if eye and direction == 'front':
        cx, cy, radius = eye[:3]
        distance = np.hypot(u - cx * rgba.shape[1], v - cy * rgba.shape[0])
        protected |= (distance < radius * rgba.shape[1] + 1.5) & (lum > 24)
    # Keep compact high-chroma emission marks even on forms that do not have
    # a dedicated light key. Large painted lengths of cloth still get texture.
    saturated = (rgb.max(-1) - rgb.min(-1) > 114) & (rgb.max(-1) > 175)
    contrast = lum - broad
    protected |= saturated & (contrast > 18)
    if key in CHROMA:
        gray = (painted @ GAME_LUMA)[..., None]
        painted = gray + (painted - gray) * CHROMA[key]
    protection = maximum_filter(protected & solid, size=3) & ~protected
    painted[protection] = (painted[protection] + rgb[protection]) * .5
    result = rgba.copy()
    result[..., :3] = np.where(protected[..., None], rgb, np.clip(np.rint(painted), 0, 255)).astype(np.uint8)
    if glint:
        # The shader uses an RGB key for emissive marks. A new highlight must
        # never acquire that key by rounding or by clipping a channel.
        alias = (~protected) & (np.abs(result[..., :3] - color).sum(axis=-1) <= 3)
        result[..., 1][alias] = color[1] + (4 if color[1] < 128 else -4)
    return result


def pack_frames(pack, target, eyes, glints, selected, jobs, register_pose):
    source = ART / 'source' / pack
    manifest = json.loads((source / 'index.json').read_text())
    pages = []
    for page in manifest['pages']:
        with Image.open(source / page['file']) as im:
            pages.append(np.array(im.convert('RGBA')))

    def crop(frame):
        x, y = frame['x'], frame['y']
        return pages[frame['page']][y:y + frame['height'], x:x + frame['width']].copy()

    if set(manifest['entities']) - BASE.keys():
        raise ValueError(f'{pack} contains a form with no material assignment')
    seen = set()
    queued = []
    for key, entity in manifest['entities'].items():
        if selected and key not in selected:
            continue
        for view in entity['directions'].values():
            direction = view['sourceDirection']
            actions = view['actions']
            ref_frame = manifest['frames'][actions['idle'][0]]
            ref = crop(ref_frame)
            for frame_ids in actions.values():
                for index in frame_ids:
                    if index in seen:
                        continue
                    seen.add(index)
                    frame = manifest['frames'][index]
                    queued.append((frame, (key, direction, crop(frame), ref, frame['bounds'],
                                           ref_frame['bounds'], eyes.get(key), glints.get(key), register_pose)))
    if not selected and len(seen) != len(manifest['frames']):
        raise ValueError(f'{pack} has unregistered frames: {set(range(len(manifest["frames"]))) - seen}')

    with ProcessPoolExecutor(max_workers=jobs) as pool:
        args = [args for _, args in queued]
        for (frame, _), texture in zip(queued, pool.map(paint_task, args, chunksize=8), strict=True):
            x, y = frame['x'], frame['y']
            pages[frame['page']][y:y + frame['height'], x:x + frame['width']] = texture

    (target / pack).mkdir(parents=True, exist_ok=True)
    for page, pixels in zip(manifest['pages'], pages, strict=True):
        Image.fromarray(pixels).save(target / pack / page['file'])
    print(f'{pack}: painted {len(seen)} frames', flush=True)


def paint_task(args):
    return paint(*args)


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('output', type=Path)
    parser.add_argument('--jobs', type=int, default=2)
    parser.add_argument('--forms', nargs='+', help='Limit a preview to the specified form keys')
    parser.add_argument('--quick', action='store_true', help='Use bounding-box registration for a fast preview')
    opts = parser.parse_args()
    if unknown := set(opts.forms or []) - BASE.keys():
        parser.error(f'unknown forms: {", ".join(sorted(unknown))}')
    eyes, glints = measure_lights(*read_pack(ART / 'source' / 'reviewed'))
    for pack_name in ('reviewed', 'allies'):
        pack_frames(pack_name, opts.output, eyes, glints, opts.forms, opts.jobs, not opts.quick)
