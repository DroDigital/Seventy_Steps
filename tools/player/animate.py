#!/usr/bin/env python3
"""Keys the investigator's clips (tools/player/clips/*.py, solved by clipkit.py) into Blender Actions on his rig, one Action for each clip, a key on every 60 Hz
frame, and reads them back through Blender's own evaluation to prove the rig plays what was written. The .blend is then what clipbake.py bakes from, and
what a person opens to see him swing: the object's own location travels with the actor's root (the game moves that itself; the bake leaves it out).

    python3 -I tools/player/animate.py [--blend f.blend] [--only cane.light1,roll] [--module cane] [--check]          (needs `pip install bpy numpy scipy`)

Each Action carries custom properties the bake and the previews read: `game_frames`, `game_loop`, `game_weapon`, `game_props`, `game_markers` (JSON).
"""
import os, sys, json
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import bpy
import numpy as np
import frame as F
import rigmath as RM

BLEND = os.path.join(HERE, 'build', 'investigator.blend')
JOINT_ORDER = F.ORDER


def rest_matrices(rig):
    return {b.name: np.array(b.matrix_local) for b in rig.data.bones}


def key_clip(rig, clip, rest):
    """The Action for a solved Clip: location of the pelvis and the root, a quaternion for every joint, a key on every frame, linear between."""
    name = clip.id
    if name in bpy.data.actions:
        bpy.data.actions.remove(bpy.data.actions[name])
    act = bpy.data.actions.new(name)
    slot = act.slots.new(id_type='OBJECT', name=rig.name)
    cb = act.layers.new('Layer').strips.new(type='KEYFRAME').channelbag(slot, ensure=True)
    n = len(clip.poses)
    loc, quat = {j: np.zeros((n, 3)) for j in JOINT_ORDER}, {j: np.zeros((n, 4)) for j in JOINT_ORDER}
    for i, pose in enumerate(clip.poses):
        for j, (l, q) in RM.local_transforms(pose, rest).items():
            loc[j][i], quat[j][i] = l, q
    for j in JOINT_ORDER:  # one hemisphere along time, so a spline of the keys takes the short way round
        for i in range(1, n):
            if np.dot(quat[j][i], quat[j][i - 1]) < 0:
                quat[j][i] = -quat[j][i]

    def curve(path, idx, values):
        fc = cb.fcurves.new(path, index=idx)
        fc.keyframe_points.add(n)
        co = np.empty(n * 2)
        co[0::2], co[1::2] = np.arange(n), values
        fc.keyframe_points.foreach_set('co', co)
        fc.keyframe_points.foreach_set('interpolation', [1] * n)  # linear
        fc.update()

    for j in JOINT_ORDER:
        for k in range(4):
            curve(f'pose.bones["{j}"].rotation_quaternion', k, quat[j][:, k])
        if j == 'body':
            for k in range(3):
                curve(f'pose.bones["{j}"].location', k, loc[j][:, k])
    root = np.array([clip.root(t) for t in range(n)])  # (x, y, z) in the game's axes: the object travels in Blender's
    bl = F.to_blender(root)
    for k in range(3):
        curve('location', k, bl[:, k])
    for m, f in clip.markers.items():
        act.pose_markers.new(m).frame = int(round(f))
    act['game_frames'] = clip.frames
    act['game_loop'] = bool(clip.loop)
    act['game_markers'] = json.dumps({k: float(v) for k, v in clip.markers.items()})
    act['game_weapon'] = clip.weapon if hasattr(clip, 'weapon') else clip.m.weapon
    act['game_props'] = json.dumps(list(getattr(clip, 'props', [])))
    act['game_drawn'] = bool(getattr(clip, 'drawn', False))
    act.use_fake_user = True
    act.use_cyclic = bool(clip.loop)
    return act


def play(rig, act, frame):
    rig.animation_data.action = act
    rig.animation_data.action_slot = act.slots[0]
    bpy.context.scene.frame_set(frame)
    return {b.name: np.array(b.matrix) for b in rig.pose.bones}


def check(rig, clip, act, rest, tolerance=2e-4):
    """Blender's evaluation of the Action against the numbers the DSL solved: the joint rotations and the pelvis, every frame. -> the worst error."""
    worst = 0.0
    for i, pose in enumerate(clip.poses):
        got = RM.pose_from_matrices(play(rig, act, i), rest)
        for j in JOINT_ORDER:
            a, b = pose[j], got[j]
            worst = max(worst, 1 - abs(float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))))
        worst = max(worst, float(np.abs(pose['body_pos'] - got['body_pos']).max()))
    return worst


def build(blend=BLEND, only=None, verify=False, modules=None):
    import clips as C
    bpy.ops.wm.open_mainfile(filepath=blend)
    rig = bpy.data.objects['Investigator_Rig']
    rig.animation_data_create()
    rest = rest_matrices(rig)
    made = C.all_clips(only, modules)
    report = []
    for clip in made:
        clip.solve()
        act = key_clip(rig, clip, rest)
        err = check(rig, clip, act, rest) if verify else None
        over = max((max(r.over.values(), default=0.0) for r in clip.rigs), default=0.0)
        report.append((clip.id, clip.frames, over, err))
    rig.animation_data.action = None
    bpy.ops.wm.save_as_mainfile(filepath=blend, compress=True)
    for cid, n, over, err in report:
        print(f'{cid:18s} {n:4d} frames  out of reach by up to {over * 100:4.1f} cm' + (f'  rig check {err:.1e}' if err is not None else ''))
    return report


if __name__ == '__main__':
    a = sys.argv[1:]
    get = lambda k, d=None: a[a.index(k) + 1] if k in a else d
    only = get('--only')
    build(get('--blend', BLEND), only.split(',') if only else None, '--check' in a, get('--module').split(',') if get('--module') else None)
