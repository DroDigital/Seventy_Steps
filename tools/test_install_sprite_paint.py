"""Run with python3 -m unittest discover -s tools -p test_install_sprite_paint.py."""

import json
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

from PIL import Image

import install_sprite_paint as installer
from sprites.paint_receipt import digest, write_receipt


PAGE = 'creatures-0.png'


def write_sprite(path, color):
    image = Image.new('RGBA', (3, 3))
    image.putpixel((1, 1), (*color, 255))
    image.save(path)


def write_source(folder, color):
    folder.mkdir(parents=True, exist_ok=True)
    write_sprite(folder / PAGE, color)
    registration = b'{}'
    (folder / 'source-index.json').write_bytes(registration)
    pages = [{'file': PAGE, 'width': 3, 'height': 3, 'sha256': digest((folder / PAGE).read_bytes())}]
    manifest = {
        'sourceIndexSha256': digest(registration),
        'entityCount': 1,
        'frameCount': 1,
        'pages': pages,
        'frames': [{
            'page': 0, 'x': 1, 'y': 1, 'width': 1, 'height': 1, 'source': 'idle.png',
            'sourceSha256': digest(bytes(color)), 'pixelSha256': digest(bytes((*color, 255))),
        }],
    }
    index = json.dumps(manifest).encode()
    (folder / 'index.json').write_bytes(index)
    return index


def write_file(root, name, content):
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(content)


def snapshot(root):
    return {path.relative_to(root).as_posix(): path.read_bytes()
            for path in root.rglob('*') if path.is_file()}


OLD_ART = {
    'reviewed/index.json': b'old reviewed index',
    'reviewed/creatures-0.png': b'old first page',
    'reviewed/creatures-1.png': b'obsolete reviewed page',
    'reviewed/creatures-concept.png': b'untouched concept',
    'allies/allies-0.png': b'old ally page',
    'allies/allies-1.png': b'obsolete ally page',
    'allies/notes.txt': b'untouched notes',
}

NEW_ART = {
    'reviewed/index.json': b'new reviewed index',
    'reviewed/creatures-0.png': b'new first page',
    'allies/allies-0.png': b'new ally page',
}


def prepare_atlases(root, new_art):
    updates = []
    for edition in ('full', 'demo'):
        staged, live = root / edition / 'staged', root / edition / 'live'
        for name, content in OLD_ART.items():
            write_file(live, name, content)
        for name, content in new_art.items():
            write_file(staged, name, content)
        updates.extend(installer.atlas_updates(staged, live))
    return updates


class InstallSpritePaintTest(unittest.TestCase):
    def test_rejects_old_paint_after_a_source_rgb_change_with_the_same_alpha(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'source' / 'reviewed'
            painted = root / 'painted'
            painted.mkdir()
            index = write_source(source, (15, 25, 35))
            write_sprite(painted / PAGE, (10, 20, 30))
            write_receipt(painted, index, {PAGE: digest((painted / PAGE).read_bytes())})
            with patch.object(installer, 'SOURCE', source.parent):
                installer.build_pack('reviewed', painted, root / 'first-install')
                write_source(source, (20, 35, 40))
                destination = root / 'second-install'
                with self.assertRaisesRegex(ValueError, 'source manifest changed since the bake'):
                    installer.build_pack('reviewed', painted, destination)
                self.assertFalse(destination.exists())

    def test_rejects_a_painted_page_replaced_after_its_receipt(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            source = root / 'source' / 'reviewed'
            painted = root / 'painted'
            painted.mkdir()
            index = write_source(source, (15, 25, 35))
            write_sprite(painted / PAGE, (10, 20, 30))
            write_receipt(painted, index, {PAGE: digest((painted / PAGE).read_bytes())})
            write_sprite(painted / PAGE, (50, 55, 60))
            with patch.object(installer, 'SOURCE', source.parent):
                with self.assertRaisesRegex(ValueError, 'painted page checksum differs from its receipt'):
                    installer.build_pack('reviewed', painted, root / 'install')

    def test_removes_obsolete_atlas_pages_in_both_editions(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            installer.install(prepare_atlases(root, NEW_ART), root / 'backup')
            expected = {**OLD_ART, **NEW_ART}
            del expected['reviewed/creatures-1.png']
            del expected['allies/allies-1.png']
            for edition in ('full', 'demo'):
                self.assertEqual(snapshot(root / edition / 'live'), expected)

    def test_rolls_back_page_deletions_and_replacements_on_install_failure(self):
        with TemporaryDirectory() as directory:
            root = Path(directory)
            updates = prepare_atlases(root, {**NEW_ART, 'reviewed/creatures-2.png': b'new page'})
            metadata = root / 'reviewedLook.ts'
            metadata.write_bytes(b'old metadata')
            updates.append((root / 'missing-staged-metadata.ts', metadata))
            with self.assertRaises(FileNotFoundError):
                installer.install(updates, root / 'backup')
            for edition in ('full', 'demo'):
                self.assertEqual(snapshot(root / edition / 'live'), OLD_ART)
            self.assertEqual(metadata.read_bytes(), b'old metadata')
