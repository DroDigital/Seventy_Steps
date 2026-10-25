#!/usr/bin/env python3
"""Pictures of the investigator from the .blend, drawn by Blender's Workbench engine (headless: it needs libEGL, `apt-get install libegl1 libgl1-mesa-dri`).

    python3 -I tools/player/preview.py turnaround [--blend f.blend] [--out f.png] [--weapon axe] [--size 380x640]
    python3 -I tools/player/preview.py sheet --clip cane.light1 [--frames 0,9,13,20] [--views front,side] [--out f.png]   (after animate.py has keyed the clips)

Colours are shown as the game's (half-stored, doubled here by the display), lit by one light from the upper left. Not the game's picture (the game's own
post pass dithers it into a palette): tools/player_shots.mjs takes that, from the running game.
"""
import os, sys, math
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy
import numpy as np
from mathutils import Vector

SCRATCH = os.environ.get('PLAYER_SCRATCH', os.path.join(HERE, 'build', 'shots'))
VIEWS = {'front': 0.0, 'q34': 40.0, 'side': 90.0, 'back': 180.0, 'q34b': 220.0}  # degrees about the vertical, 0 = looking at his face


def setup(blend, w, h, weapon='cane', drawn=False):
    bpy.ops.wm.open_mainfile(filepath=blend)
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_WORKBENCH'
    sc.render.resolution_x, sc.render.resolution_y = w, h
    sc.render.film_transparent = False
    sc.render.image_settings.file_format = 'PNG'
    sc.view_settings.view_transform = 'Standard'
    sc.display_settings.display_device = 'sRGB'
    sh = sc.display.shading
    sh.light = 'STUDIO'
    sh.color_type = 'VERTEX'
    sh.show_object_outline = True
    sh.object_outline_color = (0.0, 0.0, 0.0)
    sh.show_cavity = False
    sh.show_specular_highlight = False
    sh.studio_light = 'Default' if 'Default' in [s.name for s in bpy.context.preferences.studio_lights] else bpy.context.preferences.studio_lights[0].name
    sc.display.render_aa = 'OFF'
    world = bpy.data.worlds.new('w')
    world.color = (0.2, 0.21, 0.26)
    sc.world = world
    cam = bpy.data.objects.new('cam', bpy.data.cameras.new('cam'))
    cam.data.type = 'ORTHO'
    sc.collection.objects.link(cam)
    sc.camera = cam
    show_weapon(weapon, drawn)
    return sc, cam


def show_weapon(weapon, drawn=False, props=()):
    want = {f'arm:{"cane_drawn" if (weapon == "cane" and drawn) else weapon}', *[f'prop:{p}' for p in props]}
    for o in bpy.data.objects:
        g = o.get('game_group')
        if g and g != 'body':
            o.hide_viewport = o.hide_render = g not in want


def aim(cam, yaw_deg, centre=(0, 0, 0.98), height=2.15, dist=8.0, w=1, h=1):
    """Looks at `centre` (Blender axes) from `yaw_deg` about the vertical: 0 = in front of the face (the figure faces -y)."""
    a = math.radians(yaw_deg)
    c = Vector(centre)
    cam.location = c + Vector((math.sin(a) * dist * -1 * -1, -math.cos(a) * dist, 0.15))
    d = c - cam.location
    cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    cam.data.ortho_scale = height


def render(path):
    bpy.context.scene.render.filepath = path
    bpy.ops.render.render(write_still=True)


def compose(paths, out, label=None):
    from PIL import Image, ImageDraw
    ims = [Image.open(p).convert('RGB') for p in paths]
    w, h = ims[0].size
    sheet = Image.new('RGB', (w * len(ims), h))
    for i, im in enumerate(ims):
        sheet.paste(im, (i * w, 0))
    if label:
        ImageDraw.Draw(sheet).text((6, 4), label, fill=(240, 240, 220))
    sheet.save(out)


def turnaround(blend, out, weapon='cane', size=(380, 640), views=('front', 'q34', 'side', 'back'), drawn=False):
    sc, cam = setup(blend, size[0], size[1], weapon, drawn)
    os.makedirs(SCRATCH, exist_ok=True)
    paths = []
    for v in views:
        aim(cam, VIEWS[v])
        p = os.path.join(SCRATCH, f'_t_{v}.png')
        render(p)
        paths.append(p)
    compose(paths, out)
    print('wrote', out)


if __name__ == '__main__':
    a = sys.argv[1:]
    get = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    if a and a[0] == 'turnaround':
        w, h = (int(x) for x in get('--size', '380x640').split('x'))
        turnaround(get('--blend', os.path.join(HERE, 'build', 'investigator.blend')), get('--out', os.path.join(SCRATCH, 'turnaround.png')), get('--weapon', 'cane'), (w, h), tuple(get('--views', 'front,q34,side,back').split(',')), '--drawn' in a)
