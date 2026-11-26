"""Exercise staging safeguards and registration of translucent poses."""

from pathlib import Path
from tempfile import TemporaryDirectory
import unittest

import numpy as np

from repaint_creature_sprites import PROTECTED_ATLASES, paint, prepare_pack


class SpritePaintBakeTest(unittest.TestCase):
    def test_rejects_source_and_live_atlas_directories(self):
        for directory in PROTECTED_ATLASES:
            with self.subTest(directory=directory):
                with self.assertRaisesRegex(ValueError, 'overlaps protected atlas directory'):
                    prepare_pack('reviewed', directory)

    def test_rejects_a_page_symlink_into_an_atlas(self):
        with TemporaryDirectory() as work:
            stage = Path(work)
            pack = stage / 'reviewed'
            pack.mkdir()
            page = 'creatures-0.png'
            (pack / page).symlink_to(PROTECTED_ATLASES[0] / 'reviewed' / page)
            with self.assertRaisesRegex(ValueError, 'overlaps protected atlas directory'):
                prepare_pack('reviewed', stage)

    def test_registers_and_paints_a_translucent_pose(self):
        idle = np.zeros((16, 16, 4), dtype=np.uint8)
        frame = idle.copy()
        idle[3:13, 4:12] = [60, 80, 65, 255]
        frame[4:14, 4:12] = [60, 80, 65, 32]
        painted = paint('deep_one', 'front', frame, idle, (4, 4, 12, 14), (4, 3, 12, 13),
                        None, None, True)
        np.testing.assert_array_equal(painted[..., 3], frame[..., 3])
        self.assertTrue(np.any(painted[4:14, 4:12, :3] != frame[4:14, 4:12, :3]))


if __name__ == '__main__':
    unittest.main()
