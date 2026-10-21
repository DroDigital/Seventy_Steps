"""Checks a finished creature and writes it as `public/models/<id>.glb`, its facts in the scene's
extras (`seventy`), which tools/blender/manifest.py gathers into src/data/modelManifest.ts."""

import json
import os

import bpy

MAX_BONES = 64
MAX_MATERIALS = 4


def facts(kit):
    lo, hi = kit.m.bounds()
    clips = {}
    for n, c in kit.clips.items():
        e = {'frames': c.frames, 'loop': c.loop}
        for k in ('strike', 'end', 'stride'):
            if c.meta.get(k) is not None:
                e[k] = c.meta[k]
        clips[n] = e
    eyes = [[b, round(p[0], 4), round(p[2], 4), round(-p[1], 4), *(round(x, 3) for x in rgb), layer] for b, p, rgb, layer in kit.m.eyes]
    return {
        'id': kit.id,
        'height': round(hi[2], 3),
        'width': round(max(hi[0] - lo[0], hi[1] - lo[1]), 3),
        'tris': kit.m.tris(),
        'bones': len(kit.r.bones),
        'materials': list(kit.m.materials),
        'layers': sorted(kit.m.layers),
        'clips': clips,
        'eyes': eyes,
    }


def check(kit):
    """Problems that stop the export, and warnings that do not."""
    f, errors, warnings = facts(kit), [], []
    if f['tris'] > kit.budget():
        errors.append(f"{f['tris']} triangles: over the {kit.spec['tier']} budget of {kit.budget()}")
    if f['bones'] > MAX_BONES:
        errors.append(f"{f['bones']} bones: over {MAX_BONES}")
    if len(f['materials']) > MAX_MATERIALS:
        errors.append(f"{len(f['materials'])} materials: over {MAX_MATERIALS} (each is a draw call)")
    for n, c in kit.clips.items():
        if n.startswith('atk.') and not (c.strike is not None and len(c.keys) >= 4 and any(abs(k[0] - c.strike) <= 2 for k in c.keys)):
            errors.append(f'{n}: needs at least 4 keys, one within 2 frames of its strike ({c.strike})')
        if len(c.keys) < 2:
            errors.append(f'{n}: a single key does not move')
    lo, hi = kit.m.bounds()
    h = kit.H
    if not 0.7 * h <= hi[2] <= 1.6 * h and kit.hover == 0:
        warnings.append(f'stands {hi[2]:.2f} m tall: its body in the game is {h:.2f} m')
    if lo[2] < -0.08:
        warnings.append(f'reaches {lo[2]:.2f} m below its feet')
    if not kit.m.eyes:
        warnings.append('no eyes marked: the game glows none out of the dark')
    return errors, warnings + kit.notes


def export(kit, rig, objs, out_dir):
    bpy.context.scene['seventy'] = json.dumps(facts(kit))
    bpy.ops.object.select_all(action='DESELECT')
    for o in [rig, *objs]:
        o.select_set(True)
    bpy.context.view_layer.objects.active = rig
    os.makedirs(out_dir, exist_ok=True)
    path = os.path.join(out_dir, f'{kit.id}.glb')
    bpy.ops.export_scene.gltf(
        filepath=path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=False,
        export_texcoords=True,
        export_normals=True,
        export_tangents=False,
        export_vertex_color='ACTIVE',
        export_all_vertex_colors=False,
        export_materials='EXPORT',
        export_image_format='NONE',
        export_extras=True,
        export_skins=True,
        export_all_influences=False,
        export_def_bones=False,
        export_leaf_bone=False,
        export_morph=False,
        export_animations=True,
        export_animation_mode='ACTIONS',
        export_force_sampling=False,
        export_optimize_animation_size=True,
        export_reset_pose_bones=True,
        export_anim_slide_to_zero=False,
        export_cameras=False,
        export_lights=False,
    )
    return path
