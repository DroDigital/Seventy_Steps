"""The skeleton: bones named and placed in rest-pose metres, made into a Blender armature.

`root` always stands at the feet (the creature's origin in the game); every other bone hangs from it.
`sym_bone` makes a `.L` bone on the creature's left (+X) and its `.R` twin; `chain` a run of bones
through points (a tail, a tentacle, a neck), named `<name>.0`, `<name>.1`, ...
"""

import bpy

from .geo import mirror_name, norm, sub


class Rig:
    def __init__(self):
        self.bones = {}  # name -> (head, tail, parent, deform)
        self.order = []
        self.bone('root', (0, 0, 0), (0, 0, 0.25), None)

    def bone(self, name, head, tail, parent='root', deform=True):
        assert name not in self.bones, f'bone {name} twice'
        assert parent is None or parent in self.bones, f'bone {name}: no parent {parent}'
        self.bones[name] = (tuple(head), tuple(tail), parent, deform)
        self.order.append(name)
        return name

    def sym_bone(self, name, head, tail, parent='root', deform=True):
        """`name.L` at (head, tail) on the left, and `name.R` mirrored; a parent ending in .L is swapped too."""
        left = self.bone(f'{name}.L', head, tail, parent, deform)
        flip = lambda p: (-p[0], p[1], p[2])
        self.bone(f'{name}.R', flip(head), flip(tail), mirror_name(parent) if parent else None, deform)
        return left

    def chain(self, name, points, parent='root', sym=False):
        """Bones from each point to the next; returns their names (the left ones, with `sym`)."""
        names, up = [], parent
        for i in range(len(points) - 1):
            n = f'{name}.{i}'
            if sym:
                self.sym_bone(n, points[i], points[i + 1], up)
                up = n + '.L'
                names.append(n + '.L')
            else:
                up = self.bone(n, points[i], points[i + 1], up)
                names.append(n)
        return names

    def head(self, name):
        return self.bones[name][0]

    def tail(self, name):
        return self.bones[name][1]

    def build(self, name='rig'):
        arm = bpy.data.armatures.new(name)
        ob = bpy.data.objects.new(name, arm)
        bpy.context.scene.collection.objects.link(ob)
        bpy.context.view_layer.objects.active = ob
        bpy.ops.object.mode_set(mode='EDIT')
        for n in self.order:
            head, tail, parent, deform = self.bones[n]
            b = arm.edit_bones.new(n)
            b.head, b.tail = head, tail
            d = norm(sub(tail, head))
            b.align_roll((0, -1, 0) if abs(d[2]) > 0.7 else (0, 0, 1))  # local Z toward the front on an upright bone, up on a level one
            b.use_deform = deform
            if parent:
                b.parent = arm.edit_bones[parent]
        bpy.ops.object.mode_set(mode='OBJECT')
        for pb in ob.pose.bones:
            pb.rotation_mode = 'QUATERNION'
        return ob
