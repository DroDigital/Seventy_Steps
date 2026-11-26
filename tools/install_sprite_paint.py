#!/usr/bin/env python3
"""Verify and install painted creature pages, their demo subset and measured lighting data.

Run python3 tools/install_sprite_paint.py <painted-pages>. The input has reviewed/ and allies/
subdirectories containing the baked PNGs and paint receipts from repaint_creature_sprites.py.
Requires Pillow and NumPy. All validation and demo packing finish before installation.
"""
import argparse
from io import BytesIO
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image

from sprites.paint_receipt import digest, read_receipt, read_source_page

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/sprites/source'
FULL = ROOT / 'public/creatures'
DEMO = ROOT / 'tools/demo/art/creatures'


def build_pack(name, painted, target, lighting_source=None):
    source = SOURCE / name
    index_bytes = (source / 'index.json').read_bytes()
    manifest = json.loads(index_bytes)
    painted_hashes = read_receipt(painted, index_bytes, manifest['pages'])
    target.mkdir(parents=True)
    registration = (source / 'source-index.json').read_bytes()
    if digest(registration) != manifest['sourceIndexSha256']:
        raise ValueError(f'{name}: source registration checksum differs')
    (target / 'source-index.json').write_bytes(registration)
    if lighting_source is not None:
        lighting_source.mkdir(parents=True)
        (lighting_source / 'index.json').write_bytes(index_bytes)

    for number, page in enumerate(manifest['pages']):
        filename = page['file']
        original_bytes = read_source_page(source, page)
        if lighting_source is not None:
            (lighting_source / filename).write_bytes(original_bytes)
        with Image.open(BytesIO(original_bytes)) as image:
            original = np.asarray(image.convert('RGBA'))
        painted_bytes = (painted / filename).read_bytes()
        if digest(painted_bytes) != painted_hashes[filename]:
            raise ValueError(f'{painted / filename}: painted page checksum differs from its receipt')
        with Image.open(BytesIO(painted_bytes)) as image:
            if image.format != 'PNG' or image.mode != 'RGBA' or image.size != (page['width'], page['height']):
                raise ValueError(f'{name}/{filename}: expected an RGBA PNG on the registered canvas')
            result = np.asarray(image)
            # Production PNGs use the same RGBA8, non-interlaced encoding as the original atlases.
            image.save(target / filename, format='PNG', compress_level=7)

        if not np.array_equal(original[..., 3], result[..., 3]):
            raise ValueError(f'{name}/{filename}: transparency changed')
        outside_frames = np.ones(result.shape[:2], dtype=bool)
        for frame in manifest['frames']:
            if frame['page'] != number:
                continue
            x, y = frame['x'], frame['y']
            rect = np.s_[y:y + frame['height'], x:x + frame['width']]
            old, new = original[rect], result[rect]
            if digest(old.tobytes()) != frame['pixelSha256']:
                raise ValueError(f"{frame['source']}: source frame checksum differs")
            if not np.any(np.any(old[..., :3] != new[..., :3], axis=2) & (new[..., 3] > 0)):
                raise ValueError(f"{frame['source']}: no visible pixels repainted")
            outside_frames[rect] = False
            frame['pixelSha256'] = digest(new.tobytes())
        if np.any(result[..., 3][outside_frames]):
            raise ValueError(f'{name}/{filename}: painted pixels in atlas gutter')
        encoded = (target / filename).read_bytes()
        page['sha256'] = digest(encoded)
        if 'pngBytes' in page:
            page['pngBytes'] = len(encoded)

    # Preserve the source packs' existing formatting so the manifest diff shows only the new hashes.
    style = {'indent': 2} if name == 'allies' else {'separators': (',', ':')}
    (target / 'index.json').write_text(json.dumps(manifest, **style) + '\n')
    print(f"{name}: {manifest['entityCount']} forms, {manifest['frameCount']} painted frames", flush=True)
    return digest(index_bytes)


def atlas_updates(staged, live):
    """Install the staged packs and drop only obsolete numbered atlas pages."""
    updates = []
    for name, prefix in [('reviewed', 'creatures'), ('allies', 'allies')]:
        files = sorted((staged / name).iterdir())
        destination = live / name
        updates.extend((path, destination / path.name) for path in files)
        staged_names = {path.name for path in files}
        updates.extend((None, path) for path in sorted(destination.glob(f'{prefix}-*.png'))
                       if (path.is_file() or path.is_symlink())
                       and re.fullmatch(rf'{prefix}-[0-9]+\.png', path.name)
                       and path.name not in staged_names)
    return updates


def install(staged, backup):
    """Apply replacements and removals. Restore the previous set if either fails."""
    backup.mkdir()
    written = []
    try:
        for i, (new, live) in enumerate(staged):
            old = backup / str(i) if live.exists() or live.is_symlink() else None
            if old is not None:
                shutil.copy2(live, old, follow_symlinks=False)
            if new is None:
                live.unlink(missing_ok=True)
            else:
                os.replace(new, live)
            written.append((live, old))
    except BaseException:
        for live, old in reversed(written):
            if old is not None:
                os.replace(old, live)
            else:
                live.unlink(missing_ok=True)
        raise


def main(painted):
    with TemporaryDirectory(prefix='.sprite-paint-', dir=ROOT) as work:
        stage = Path(work)
        full, demo = stage / 'full', stage / 'demo'
        lighting_source = stage / 'lighting-source'
        source_hashes = {}
        for name in ('reviewed', 'allies'):
            source_hashes[name] = build_pack(
                name, painted / name, full / name,
                lighting_source=lighting_source if name == 'reviewed' else None,
            )
        measured = stage / 'reviewedLook.ts'
        subprocess.run([sys.executable, str(ROOT / 'tools/reviewed_look.py'), '--pack', str(full / 'reviewed'),
                        '--light-source', str(lighting_source), '--out', str(measured)], check=True)
        subprocess.run([sys.executable, str(ROOT / 'tools/demo/pack_art.py'), '--source', str(full), '--out', str(demo)], check=True)
        for name, expected in source_hashes.items():
            if digest((SOURCE / name / 'index.json').read_bytes()) != expected:
                raise ValueError(f'{name}: source manifest changed during installation. Bake the pack again.')
        files = atlas_updates(full, FULL) + atlas_updates(demo, DEMO)
        files.append((measured, ROOT / 'src/data/reviewedLook.ts'))
        install(files, stage / 'backup')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('painted_pages', type=Path)
    main(parser.parse_args().painted_pages)
