"""Draws baked models from four sides (front = +z first) onto one sheet, for checking which way a model faces and where its openings are.
Run: python3 -I tools/models/boss/look.py <work dir> <out.png> <id> [<id> ...]  (the models are read from the sources again, not from the pack)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
import numpy as np
from PIL import Image
import sources as S, pack as P, preview as V, manifest as MF
import importlib.util
spec = importlib.util.spec_from_file_location('bake', os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'bake_boss_models.py'))

def main(work, out, ids):
    models = {m.id: m for m in MF.load_all()}
    rows = []
    for i in ids:
        m = models[i]
        S.load(os.path.join(work, m.src), [os.path.join(work, t) for t in m.textures])
        objs = S.mesh_objects(m.select, m.exclude)
        soup, _ = S.soup_of(objs, classes=m.classes, drop=m.drop, default_cls=m.cls, decimate_to=m.decimate or None, cut=m.cut)
        pos, col, cls, _ = soup.done()
        pos = P.rotate_y(pos, m.rot)
        pos, _, _ = P.fitted(pos, m.fit, m.squash)
        luma = col @ np.array([.299, .587, .114])
        shade = np.clip(0.55 + 0.9 * np.minimum(1, luma * 1.3), 0, 1.5)
        rows.append([V.render(pos, np.clip(np.array([.55, .55, .52]) * shade[:, None], 0, 1), 200, az, 12) for az in (0, 90, 180, 270)] + [V.render(pos, np.clip(np.array([.55, .55, .52]) * shade[:, None], 0, 1), 200, 0, 80)])
    img = Image.new('RGB', (200 * 5, 200 * len(rows)))
    for r, row in enumerate(rows):
        for c, cell in enumerate(row):
            img.paste(cell, (c * 200, r * 200))
    img.save(out)

main(sys.argv[1], sys.argv[2], sys.argv[3:])
