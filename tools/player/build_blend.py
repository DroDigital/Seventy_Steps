#!/usr/bin/env python3
"""Builds the investigator in Blender: the armature of the game's joints (frame.py), the body as one mesh skinned rigidly to them (a vertex belongs to one
bone), and the weapons and props as meshes of their own, hidden until a move shows them. Writes tools/player/build/investigator.blend.

    python3 -I tools/player/build_blend.py [--out file.blend]          (needs `pip install bpy numpy scipy`; node tools/player/export_data.mjs first)

Each mesh carries the game's own data, so bake_player.py can read the .blend and nothing else: a colour for each face (the `Col` attribute, half the game's
value so Blender shows it unclipped: COLOUR_GAIN 2), and custom properties `game_joint`, `game_group`, `game_tex`, `game_emissive`, `game_at`.
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy
import numpy as np
import frame as F
import model as M

COLOUR_GAIN = 2.0
OUT = os.path.join(HERE, 'build', 'investigator.blend')


def clear():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def make_armature():
    arm_data = bpy.data.armatures.new('Investigator')
    rig = bpy.data.objects.new('Investigator_Rig', arm_data)
    bpy.context.scene.collection.objects.link(rig)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.mode_set(mode='EDIT')
    kids = {}
    for j, (p, _) in F.JOINTS.items():
        kids.setdefault(p, []).append(j)
    for j in F.ORDER:
        b = arm_data.edit_bones.new(j)
        head = F.to_blender(F.REST[j])
        # the bone points on to its first child's joint, else a short way along the limb (up for the trunk, down for a limb's end)
        child = next((c for c in kids.get(j, []) if F.JOINTS[c][1] != (0, 0, 0)), None)
        tail = F.to_blender(F.REST[child]) if child else head + F.to_blender(np.array([0, -0.08 if j.startswith(('hand', 'foot', 'lantern')) else 0.08, 0.0]))
        if np.linalg.norm(tail - head) < 1e-4:
            tail = head + np.array([0, 0, 0.06])
        if j.startswith('foot'):
            tail = head + F.to_blender(np.array([0, -0.07, 0.15]))
        b.head, b.tail = head, tail
        b.roll = 0
    for j, (p, _) in F.JOINTS.items():
        if p:
            arm_data.edit_bones[j].parent = arm_data.edit_bones[p]
    bpy.ops.object.mode_set(mode='OBJECT')
    rig.show_in_front = True
    arm_data.display_type = 'OCTAHEDRAL'
    return rig


def to_object(name, shape, joint, rig, extra=None, at=(0, 0, 0)):
    """A Shape (joint frame, game axes) as a mesh object in armature space, every vertex weighted wholly to `joint`."""
    off = F.REST[joint] + np.asarray(at, float)
    verts = F.to_blender(shape.v + off)
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata(verts.tolist(), [], shape.f.tolist())
    mesh.update()
    mesh.polygons.foreach_set('use_smooth', [False] * len(mesh.polygons))
    attr = mesh.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    cols = np.repeat(shape.c / COLOUR_GAIN, 3, axis=0)  # a colour for each corner of each face, in face order
    rgba = np.concatenate([cols, np.ones((len(cols), 1))], axis=1)
    attr.data.foreach_set('color', rgba.ravel())
    mesh.color_attributes.active_color = attr
    mesh.color_attributes.render_color_index = 0
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    vg = obj.vertex_groups.new(name=joint)
    vg.add(list(range(len(verts))), 1.0, 'REPLACE')
    mod = obj.modifiers.new('Armature', 'ARMATURE')
    mod.object = rig
    obj.parent = rig
    obj['game_joint'] = joint
    for k, v in (extra or {}).items():
        obj[k] = v
    return obj


def build(out=OUT):
    clear()
    rig = make_armature()
    rig['game_joints'] = json.dumps({j: [p, list(o)] for j, (p, o) in F.JOINTS.items()})
    body = [p for p in M.parts() if p.group == 'body']
    # one skinned mesh for the body: its parts joined, each vertex on its own bone
    from kit import Shape
    objs = [to_object(p.name, p.shape, p.joint, rig, {'game_group': p.group, 'game_tex': p.tex, 'game_emissive': p.emissive}) for p in body]
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    objs[0].name = 'Investigator'
    objs[0].data.name = 'Investigator'
    for p in M.parts():
        if p.group == 'body':
            continue
        o = to_object(p.name, p.shape, p.joint, rig, {'game_group': p.group, 'game_tex': p.tex, 'game_emissive': p.emissive, 'game_at': list(p.at)}, at=p.at)
        o.hide_viewport = o.hide_render = p.group != 'arm:cane'
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
    print('wrote', out)


if __name__ == '__main__':
    args = sys.argv[1:]
    build(args[args.index('--out') + 1] if '--out' in args else OUT)
