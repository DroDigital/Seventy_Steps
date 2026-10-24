"""Lists the mesh objects of a source scene with their size in game space (x right, y up, z front) and triangle counts, to write the manifest from.
Run: python3 -I tools/models/boss/inspect_source.py <file> [<texture folder> ...]"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import numpy as np
import bpy
import sources as S

def main(path, textures):
    S.load(path, textures)
    for o in sorted(S.mesh_objects(), key=lambda o: o.name):
        me = o.data
        pts = S.to_game(np.array([list(o.matrix_world @ v.co) for v in me.vertices]))
        if not len(pts):
            continue
        lo, hi = pts.min(axis=0), pts.max(axis=0)
        tris = sum(len(p.vertices) - 2 for p in me.polygons)
        mats = ','.join(s.material.name for s in o.material_slots if s.material)[:60]
        print(f'{o.name[:40]:40s} tris={tris:6d} size={hi[0]-lo[0]:6.2f} {hi[1]-lo[1]:6.2f} {hi[2]-lo[2]:6.2f}  lo=({lo[0]:.1f},{lo[1]:.1f},{lo[2]:.1f})  {mats}')

main(sys.argv[1], sys.argv[2:])
