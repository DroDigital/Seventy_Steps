#!/usr/bin/env python3
"""Verify and install painted creature pages, their demo subset and measured lighting data.

Run python3 tools/install_sprite_paint.py <painted-pages>. The input has reviewed/ and allies/
subdirectories with the same PNG names and frame rectangles as tools/sprites/source/.
Requires Pillow and NumPy. All validation and demo packing finish before installation.
"""
import argparse
from hashlib import sha256
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
from tempfile import TemporaryDirectory

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'tools/sprites/source'
FULL = ROOT / 'public/creatures'
DEMO = ROOT / 'tools/demo/art/creatures'


def digest(data):
    return sha256(data).hexdigest()


def build_pack(name, painted, target):
    source = SOURCE / name
    manifest = json.loads((source / 'index.json').read_bytes())
    target.mkdir(parents=True)
    registration = (source / 'source-index.json').read_bytes()
    if digest(registration) != manifest['sourceIndexSha256']:
        raise ValueError(f'{name}: source registration checksum differs')
    (target / 'source-index.json').write_bytes(registration)

    for number, page in enumerate(manifest['pages']):
        filename = page['file']
        original_path = source / filename
        if digest(original_path.read_bytes()) != page['sha256']:
            raise ValueError(f'{name}/{filename}: source page checksum differs')
        with Image.open(original_path) as image:
            original = np.asarray(image.convert('RGBA'))
        with Image.open(painted / filename) as image:
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


def install(staged, backup):
    """Replace only the files built here. Restore the previous set if a replacement fails."""
    backup.mkdir()
    written = []
    try:
        for i, (new, live) in enumerate(staged):
            old = backup / str(i) if live.exists() else None
            if old:
                shutil.copyfile(live, old)
            os.replace(new, live)
            written.append((live, old))
    except BaseException:
        for live, old in reversed(written):
            if old:
                os.replace(old, live)
            else:
                live.unlink()
        raise


def main(painted):
    with TemporaryDirectory(prefix='.sprite-paint-', dir=ROOT) as work:
        stage = Path(work)
        full, demo = stage / 'full', stage / 'demo'
        for name in ('reviewed', 'allies'):
            build_pack(name, painted / name, full / name)
        measured = stage / 'reviewedLook.ts'
        subprocess.run([sys.executable, str(ROOT / 'tools/reviewed_look.py'), '--pack', str(full / 'reviewed'), '--out', str(measured)], check=True)
        subprocess.run([sys.executable, str(ROOT / 'tools/demo/pack_art.py'), '--source', str(full), '--out', str(demo)], check=True)
        files = [(path, live / path.relative_to(folder)) for folder, live in ((full, FULL), (demo, DEMO))
                 for path in sorted(folder.glob('*/*'))]
        files.append((measured, ROOT / 'src/data/reviewedLook.ts'))
        install(files, stage / 'backup')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('painted_pages', type=Path)
    main(parser.parse_args().painted_pages)
