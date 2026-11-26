"""Round 125, a contact sheet of the flora library drawn by Blender's Cycles (build.py --sheet out.png --atlas atlas.png): each species a
row, its variants side by side, its bark and leaves in a New England October's colours with their baked light, the leaf cards cut out
by the atlas (a PNG of render/textureFoliage.ts's, made from the game's own generator; docs/FLORA.md says how), under a pale moon.
"""
import math

import bpy

LEAVES = [(0.62, 0.34, 0.2), (0.7, 0.52, 0.26), (0.5, 0.28, 0.18), (0.42, 0.42, 0.26)]
SLOT = {4: (0.3, 0.36, 0.36), 5: (0.24, 0.29, 0.29), 6: (0.55, 0.56, 0.47), 7: (0.6, 0.45, 0.28), 8: (0.2, 0.17, 0.15), 9: (0.38, 0.2, 0.15), 10: (0.4, 0.33, 0.3),
        16: (0.4, 0.33, 0.3), 17: (0.32, 0.26, 0.24), 18: (0.94, 0.92, 0.86), 19: (0.24, 0.22, 0.21), 20: (0.72, 0.62, 0.46), 21: (0.7, 0.7, 0.66), 22: (0.5, 0.5, 0.48)}


def colour(slot):
    return LEAVES[slot] if slot < 4 else SLOT.get(slot, (0.5, 0.5, 0.5))


def to_b(p):
    return (p.x, -p.z, p.y)


def mesh_object(name, pts, faces, cols, uvs, mat, at):
    me = bpy.data.meshes.new(name)
    me.from_pydata([to_b(p) for p in pts], [], faces)
    attr = me.color_attributes.new('Col', 'FLOAT_COLOR', 'CORNER')
    uv = me.uv_layers.new(name='UV')
    for poly in me.polygons:
        for li in poly.loop_indices:
            vi = me.loops[li].vertex_index
            c = cols[vi]
            attr.data[li].color = (c[0], c[1], c[2], 1.0)
            uv.data[li].uv = uvs[vi]
    ob = bpy.data.objects.new(name, me)
    ob.location = at
    ob.data.materials.append(mat)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def material(name, atlas):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    bsdf = nt.nodes['Principled BSDF']
    bsdf.inputs['Roughness'].default_value = 1.0
    col = nt.nodes.new('ShaderNodeVertexColor')
    col.layer_name = 'Col'
    if atlas:
        tex = nt.nodes.new('ShaderNodeTexImage')
        tex.image = atlas
        tex.interpolation = 'Closest'
        mix = nt.nodes.new('ShaderNodeMix')
        mix.data_type = 'RGBA'
        mix.blend_type = 'MULTIPLY'
        mix.inputs['Factor'].default_value = 1.0
        nt.links.new(col.outputs['Color'], mix.inputs[6])
        nt.links.new(tex.outputs['Color'], mix.inputs[7])
        nt.links.new(mix.outputs[2], bsdf.inputs['Base Color'])
        nt.links.new(tex.outputs['Alpha'], bsdf.inputs['Alpha'])
    else:
        nt.links.new(col.outputs['Color'], bsdf.inputs['Base Color'])
    return m


def sheet(shown, out, atlas_path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    atlas = bpy.data.images.load(atlas_path) if atlas_path else None
    bark_m, leaf_m = material('bark', None), material('leaf', atlas)
    rows = {}
    for key, parts, info in shown:
        rows.setdefault(key.rsplit('.', 1)[0], []).append((key, parts, info))
    y = 0.0
    width = 0.0
    for name, models in rows.items():
        scale = max(m[2]['h'] for m in models)
        x = 0.0
        for key, (wood, leaf, cards), info in models:
            k = 6.0 / max(scale, 0.5)
            at = (x, 0.0, -y)
            if wood.pos:
                cols = [tuple(c * a for c in colour(s)) for s, a in zip(wood.slot, wood.ao)]
                ob = mesh_object(key + '.wood', wood.pos, wood.tris, cols, [(u / 2, v / 2) for u, v in wood.uv], bark_m, at)
                ob.scale = (k, k, k)
            if leaf:
                cols = [tuple(c * a for c in colour(s)) for s, a in zip(leaf.slot, leaf.ao)]
                ob = mesh_object(key + '.caps', leaf.pos, leaf.tris, cols, [(u / 2, v / 2) for u, v in leaf.uv], leaf_m, at)
                ob.scale = (k, k, k)
            if cards:
                pts, faces, cols, uvs = [], [], [], []
                for c in cards:
                    i = len(pts)
                    pts.extend(c.corners())
                    faces.append((i, i + 1, i + 2, i + 3))
                    col_, row_ = c.cell % 4, c.cell // 4
                    for (u, v), a in zip(((0, c.v0), (1, c.v0), (1, c.v1), (0, c.v1)), c.ao):
                        uvs.append(((col_ + 0.004 + u * 0.992) / 4, (row_ + 0.004 + v * 0.992) / 4))
                        cols.append(tuple(q * a for q in colour(c.slot)))
                ob = mesh_object(key + '.cards', pts, faces, cols, uvs, leaf_m, at)
                ob.scale = (k, k, k)
            x += 7.5
        width = max(width, x)
        y += 8.0
    span = y - 8.0 + 7.0  # rows 8 apart, each model 6 tall from its row's foot
    cam = bpy.data.cameras.new('cam')
    cam.type = 'ORTHO'
    cam.ortho_scale = max(width, span) * 1.04
    co = bpy.data.objects.new('cam', cam)
    co.location = (width / 2 - 3.75, -60.0, (6.5 - (y - 8.0)) / 2)
    co.rotation_euler = (math.radians(90), 0, 0)
    sc.collection.objects.link(co)
    sc.camera = co
    sun = bpy.data.lights.new('moon', 'SUN')
    sun.energy = 3.0
    so = bpy.data.objects.new('moon', sun)
    so.rotation_euler = (math.radians(50), math.radians(10), math.radians(-35))
    sc.collection.objects.link(so)
    world = bpy.data.worlds.new('w')
    world.use_nodes = True
    world.node_tree.nodes['Background'].inputs['Color'].default_value = (0.05, 0.07, 0.1, 1)
    world.node_tree.nodes['Background'].inputs['Strength'].default_value = 1.6
    sc.world = world
    sc.render.engine = 'CYCLES'
    sc.cycles.device = 'CPU'
    sc.cycles.samples = 12
    sc.cycles.use_denoising = False
    sc.render.resolution_x = 1800
    sc.render.resolution_y = int(1800 * span / max(width, 1))
    sc.render.filepath = out
    bpy.ops.render.render(write_still=True)
