"""Check that every front landmark survives the material mask and bake."""

import unittest
from unittest.mock import patch

import numpy as np

from repaint_creature_sprites import ART, paint
from reviewed_look import frame_pixels, measure_lights, read_pack
from sprites.paint_forms import FRONT


class SpritePaintLandmarksTest(unittest.TestCase):
    def test_each_landmark_paints_visible_pixels(self):
        source = ART / 'source'
        reviewed = read_pack(source / 'reviewed')
        eyes, glints = measure_lights(*reviewed)
        for manifest, pages in (reviewed, read_pack(source / 'allies')):
            frames = manifest['frames']
            for key, entity in manifest['entities'].items():
                if key not in FRONT:
                    continue
                actions = entity['directions']['front']['actions']
                anchor = frames[actions['idle'][0]]
                idle = frame_pixels(pages, anchor).astype(np.uint8)
                unseen = dict(enumerate(FRONT[key]))

                # Start with the idle and let later poses prove coverage for
                # landmarks that the idle temporarily occludes.
                poses = dict.fromkeys([actions['idle'][0], *(i for ids in actions.values() for i in ids)])
                for index in poses:
                    frame = frames[index]
                    rgba = frame_pixels(pages, frame).astype(np.uint8)
                    args = (key, 'front', rgba, idle, frame['bounds'], anchor['bounds'],
                            eyes.get(key), glints.get(key), True)
                    with patch.dict(FRONT, {key: ()}):
                        undecorated = paint(*args)[..., :3].astype(np.int16)
                    for slot, mark in list(unseen.items()):
                        with patch.dict(FRONT, {key: (mark,)}):
                            decorated = paint(*args)[..., :3]
                        changed = np.any(np.abs(decorated - undecorated) >= 2, axis=-1)
                        if np.count_nonzero(changed & (rgba[..., 3] >= 77)) >= 6:
                            del unseen[slot]
                    if not unseen:
                        break

                with self.subTest(form=key):
                    self.assertEqual({}, unseen, 'front landmarks without visible coverage')


if __name__ == '__main__':
    unittest.main()
