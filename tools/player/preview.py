#!/usr/bin/env python3
"""Pictures of the investigator from the .blend, drawn by Blender's Workbench engine (headless: it needs libEGL, `apt-get install libegl1 libgl1-mesa-dri`).

    python3 -I tools/player/preview.py turnaround [--blend f.blend] [--out f.png] [--weapon axe] [--size 380x640]
    python3 -I tools/player/preview.py sheet --clip cane.light1 [--frames 0,9,13,20 | --every 3] [--views q34,side] [--out f.png]   (after animate.py has keyed the clips)

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
    want = {f'arm:{"cane_drawn" if (weapon == "cane" and drawn) else weapon}', *[f'prop:{p}' for p in props if p != 'gun'], 'flame', 'gun' if 'gun' in props else 'holstered'}
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


def tip_trail(rig, act, frames, length):
    """The business end of the weapon in the right hand at each frame, in Blender's world (for drawing its path over the pictures)."""
    import rigmath as RM
    import frame as F
    rest = {b.name: np.array(b.matrix_local) for b in rig.data.bones}
    out = []
    for f in frames:
        bpy.context.scene.frame_set(f)
        pose = RM.pose_from_matrices({b.name: np.array(b.matrix) for b in rig.pose.bones}, rest)
        W = RM.game_world(pose)['handR']
        tip = (W @ np.array([0, -length, 0.02, 1.0]))[:3]
        out.append(Vector(F.to_blender(tip)) + rig.location)
    return out


def sheet(blend, clip, frames, views, out, size=(230, 400), trail=True):
    """A contact sheet of a clip: a row for each view, a column for each frame, the weapon's tip drawn as a trail (red through the hit window), the frame number under it."""
    import json
    from PIL import Image, ImageDraw
    from bpy_extras.object_utils import world_to_camera_view
    sc, cam = setup(blend, size[0], size[1])
    rig = bpy.data.objects['Investigator_Rig']
    rig.animation_data_create()
    act = bpy.data.actions[clip]
    rig.animation_data.action = act
    rig.animation_data.action_slot = act.slots[0]
    weapon, drawn = act.get('game_weapon', 'cane'), bool(act.get('game_drawn'))
    show_weapon(weapon, drawn, json.loads(act.get('game_props', '[]')))
    marks = json.loads(act['game_markers'])
    n = int(act['game_frames'])
    frames = [min(f, n) for f in frames]
    length = {'cane': 0.94, 'axe': 0.8, 'razor': 0.275, 'cutlass': 0.77, 'rapier': 1.13}.get(weapon, 0.94)
    tips = tip_trail(rig, act, range(0, n + 1), length) if trail else None
    os.makedirs(SCRATCH, exist_ok=True)
    rows = []
    for v in views:
        cells = []
        for f in frames:
            bpy.context.scene.frame_set(f)
            aim(cam, VIEWS[v], centre=tuple(rig.location + Vector((0, 0, 0.98))))
            p = os.path.join(SCRATCH, f'_s_{v}_{f}.png')
            render(p)
            im = Image.open(p).convert('RGB')
            d = ImageDraw.Draw(im)
            bpy.context.view_layer.update()
            if tips:
                pts = []
                for t in range(0, f + 1):
                    c = world_to_camera_view(sc, cam, tips[t])
                    pts.append((c.x * size[0], (1 - c.y) * size[1]))
                for t in range(1, len(pts)):
                    hot = 'hit0' in marks and marks['hit0'] <= t <= marks.get('hit1', marks['hit0'])
                    d.line([pts[t - 1], pts[t]], fill=(255, 70, 40) if hot else (255, 210, 90), width=2)
            hit = 'hit0' in marks and marks['hit0'] <= f < marks['hit1']
            d.rectangle([0, 0, size[0] - 1, size[1] - 1], outline=(255, 60, 40) if hit else (60, 60, 70))
            d.text((5, size[1] - 14), f'{f}' + (' HIT' if hit else '') + ''.join(f' {k}' for k, m in marks.items() if k not in ('hit0', 'hit1') and abs(m - f) < 0.5), fill=(255, 255, 255))
            cells.append(im)
        row = Image.new('RGB', (size[0] * len(cells), size[1]))
        for i, im in enumerate(cells):
            row.paste(im, (i * size[0], 0))
        rows.append(row)
    sheet_im = Image.new('RGB', (rows[0].width, size[1] * len(rows)))
    for i, r in enumerate(rows):
        sheet_im.paste(r, (0, i * size[1]))
    ImageDraw.Draw(sheet_im).text((6, 4), clip, fill=(240, 240, 220))
    sheet_im.save(out)
    print('wrote', out)


if __name__ == '__main__':
    a = sys.argv[1:]
    get = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    if a and a[0] == 'sheet':
        blend = get('--blend', os.path.join(HERE, 'build', 'investigator.blend'))
        clip = get('--clip')
        every = get('--every')
        if get('--frames'):
            fr = [int(x) for x in get('--frames').split(',')]
        else:  # every Nth frame of the clip (default: about ten across it)
            bpy.ops.wm.open_mainfile(filepath=blend)
            n = int(bpy.data.actions[clip]['game_frames'])
            step = int(every) if every else max(1, n // 9)
            fr = list(range(0, n + 1, step))
        sheet(blend, clip, fr, tuple(get('--views', 'q34,side').split(',')), get('--out', os.path.join(SCRATCH, f'sheet_{clip}.png')))
    elif a and a[0] == 'turnaround':
        w, h = (int(x) for x in get('--size', '380x640').split('x'))
        turnaround(get('--blend', os.path.join(HERE, 'build', 'investigator.blend')), get('--out', os.path.join(SCRATCH, 'turnaround.png')), get('--weapon', 'cane'), (w, h), tuple(get('--views', 'front,q34,side,back').split(',')), '--drawn' in a)
