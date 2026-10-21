"""Contact sheets of a finished creature (docs/MODELS.md): its rest pose from four sides, then each
clip at six of its frames (an attack's: rest, gathering, wound up, the strike, the follow-through,
recovered), labelled, so a model and its motion can be judged without opening Blender. Written as
`<out>/<id>-<page>.png`, eight rows a page. Workbench, flat, in the vertex colours as the game reads them."""

import math
import os

import bpy
import numpy as np
from mathutils import Vector

CELL = 224
COLS = 6
ROWS = 8


def _frames(c):
    n = c.frames
    if c.meta.get('strike') is not None:
        s, e = c.strike, c.end or c.strike + 4
        return [0, max(1, s // 2), max(0, s - 2), s, min(n, e + max(2, (n - e) // 4)), n]
    if c.loop:
        return [round(n * i / COLS) for i in range(COLS)]
    return [round(n * i / (COLS - 1)) for i in range(COLS)]


def _setup(kit, rig):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x = sc.render.resolution_y = CELL
    sc.render.film_transparent = False
    sc.view_settings.view_transform = 'Standard'
    sh = sc.display.shading
    sh.light, sh.color_type, sh.show_shadows, sh.show_cavity = 'STUDIO', 'VERTEX', True, False
    sh.show_object_outline = True
    world = bpy.data.worlds.new('w')
    world.color = (0.42, 0.42, 0.45)
    sc.world = world
    me = bpy.data.meshes.new('ground')
    s = max(kit.H, kit.R * 4) * 1.6
    me.from_pydata([(-s, -s, 0), (s, -s, 0), (s, s, 0), (-s, s, 0)], [], [(0, 1, 2, 3)])
    col = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    for d in col.data:
        d.color = (0.2, 0.2, 0.21, 1)
    g = bpy.data.objects.new('ground', me)
    sc.collection.objects.link(g)
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = 40
    txt = bpy.data.objects.new('label', bpy.data.curves.new('label', 'FONT'))
    sc.collection.objects.link(txt)
    txt.parent = cam
    txt.location = (-0.43, 0.38, -1)
    txt.scale = (0.055, 0.055, 0.055)
    txt.data.body = ''
    tm = txt.data
    tm.materials.append(bpy.data.materials.new('label'))
    return cam, txt


def _aim(cam, kit, view):
    h = max(kit.H, 0.6) + kit.hover
    reach = max(kit.H * 0.6, kit.R * 2.2, 1.0)
    d = max(h * 1.45, reach * 2.2)
    dirs = {'front': (0, -1, 0.15), 'side': (-1, 0, 0.15), 'back': (0, 1, 0.15), 'three': (-0.7, -1, 0.35), 'face': (-0.5, -1, 0.1)}
    v = Vector(dirs[view]).normalized()
    target = Vector((0, -0.15 * reach, h * 0.48))
    if view == 'face':
        lo, hi = kit.m.bounds()
        target, d = Vector((0, (lo[1] + 0.2 * (hi[1] - lo[1])), hi[2] * 0.85)), max(0.9, h * 0.55)
    cam.location = target + v * d
    cam.rotation_euler = (target - cam.location).to_track_quat('-Z', 'Y').to_euler()


def _render(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    img = bpy.data.images.load(path)
    img.colorspace_settings.name = 'Non-Color'
    a = np.array(img.pixels[:], dtype=np.float32).reshape(CELL, CELL, 4)
    bpy.data.images.remove(img)
    return a


def sheets(kit, rig, actions, out_dir, view='three'):
    os.makedirs(out_dir, exist_ok=True)
    cam, txt = _setup(kit, rig)
    tmp = os.path.join(out_dir, '_cell.png')
    rows = []
    rest = []
    rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0)
        pb.location = (0, 0, 0)
        pb.scale = (1, 1, 1)
    layered = {o.name.split('@')[1]: o for o in bpy.context.scene.objects if '@' in o.name}
    show = lambda eldritch: [setattr(o, 'hide_render', (name == 'eldritch') != eldritch) for name, o in layered.items() if name in ('eldritch', 'plain')]
    show(False)
    for v in ('front', 'side', 'back', 'three', 'face'):
        _aim(cam, kit, v)
        txt.data.body = f'{kit.id} {v}'
        rest.append(_render(tmp))
    if 'eldritch' in layered:
        show(True)
        _aim(cam, kit, 'face')
        txt.data.body = 'eldritch'
        rest.append(_render(tmp))
        show(False)
    rows.append(rest)
    _aim(cam, kit, view)
    by_name = {a.name: a for a in actions}
    for name, c in kit.clips.items():
        rig.animation_data.action = by_name[name]
        row = []
        for f in _frames(c):
            bpy.context.scene.frame_set(f)
            mark = '*' if f == c.strike else ''
            txt.data.body = f'{name} {f}/{c.frames}{mark}'
            row.append(_render(tmp))
        rows.append(row)
    os.remove(tmp)
    paths = []
    for p in range(math.ceil(len(rows) / ROWS)):
        chunk = rows[p * ROWS:(p + 1) * ROWS]
        sheet = np.zeros((len(chunk) * CELL, COLS * CELL, 4), dtype=np.float32)
        for r, row in enumerate(chunk):
            for ci, cell in enumerate(row):
                y = (len(chunk) - 1 - r) * CELL  # Blender's images start at the bottom
                sheet[y:y + CELL, ci * CELL:(ci + 1) * CELL] = cell
        img = bpy.data.images.new(f'sheet{p}', COLS * CELL, len(chunk) * CELL, alpha=True)
        img.colorspace_settings.name = 'Non-Color'
        img.pixels.foreach_set(sheet.ravel())
        path = os.path.join(out_dir, f'{kit.id}-{p + 1}.png')
        img.filepath_raw = path
        img.file_format = 'PNG'
        img.save()
        paths.append(path)
    return paths
