"""Reads a source scene (.blend, .fbx, .obj, .glb/.gltf) with Blender's own importers (`pip install bpy`) and hands back its meshes as plain
triangles for the baker (tools/models/bake_boss_models.py): world space, y up (a Blender scene is z up, front toward -y: its -y becomes
the game's +z, so a model that faces the front view faces the way every prop does), a colour for each face (the texture under the face,
averaged over it; else the material's colour; else the vertex colour: a face takes the colour of the point of its map it stands on, as a
low-poly figure is drawn), a material class for each face, and the posed or modified shape (an armature's pose, a modifier's work) as
Blender evaluates it. Textures a scene lost the paths of are found again by name in the folders it is told of. Offline only."""
import glob, math, os, re, sys
import numpy as np
import bpy
import bmesh

# Material classes (the baked class byte; src/render/modelKit.ts reads them).
STONE, WOOD, LEAF, ROCK, SLAB, COBBLE, BRICK, CLOTH, METAL, BONE, GLOW = 0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11
CLASSES = {'stone': STONE, 'wood': WOOD, 'leaf': LEAF, 'rock': ROCK, 'slab': SLAB, 'cobble': COBBLE, 'brick': BRICK, 'cloth': CLOTH, 'metal': METAL, 'bone': BONE, 'glow': GLOW}

# What a material's name says it is made of, before its colour does.
NAME_RULES = [
    (r'fire|flame|ember|emiss|lava|glow|lamp_?light|^light$', GLOW),
    (r'bone|skull|ivory|tooth|ribcage|spine|pelvis', BONE),
    (r'leaf|leaves|grass|foliage|vine|moss|bush|hair|flowers?|petal', LEAF),
    (r'fabric|flag|banner|cloth|rug|carpet|rope|canvas|sheet|curtain|blue_', CLOTH),
    (r'metal|iron|steel|gold|bronze|copper|chain|rust|pipe|valve|silver|nail|^dark$|gate', METAL),
    (r'wood|bark|plank|log|trunk|timber|door|beam|barrel|crate|chest|pallet|shingle', WOOD),
    (r'brick', BRICK),
    (r'cobble|pave|floor_?tile|road', COBBLE),
    (r'slab|floor|marble|limestone|concrete|sandstone', SLAB),
    (r'rock|basalt|stone|granite|cliff|boulder|dirt|ground|sand', ROCK),
]

def srgb(c):
    """Blender holds colours linear; the game's palette is display sRGB (ColorManagement is off)."""
    c = np.clip(np.asarray(c, dtype=np.float64), 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * np.power(c, 1 / 2.4) - 0.055)

def classify_name(name, default=None):
    low = (name or '').lower()
    for pat, cls in NAME_RULES:
        if re.search(pat, low):
            return cls
    return default

def classify_colour(rgb):
    """What a plain face is by its colour alone (the old baker's rule): leaves are green, wood is brown, the rest stone."""
    r, g, b = rgb
    mx, mn = max(rgb), min(rgb)
    sat = (mx - mn) / mx if mx > 0 else 0
    if g > r * 1.08 and g > b * 1.08 and sat > 0.18: return LEAF
    if r > g * 1.12 and g > b * 1.05 and sat > 0.28: return WOOD
    return STONE

class quiet:
    """Blender prints a line for every image an FBX embeds that is not on the disk (the texture archive is found by `relink` instead): this keeps them off the console."""
    def __enter__(self):
        sys.stdout.flush(); sys.stderr.flush()
        self.saved = [os.dup(1), os.dup(2)]
        null = os.open(os.devnull, os.O_WRONLY)
        os.dup2(null, 1); os.dup2(null, 2); os.close(null)
    def __exit__(self, *a):
        sys.stdout.flush(); sys.stderr.flush()
        os.dup2(self.saved[0], 1); os.dup2(self.saved[1], 2)
        for fd in self.saved: os.close(fd)

def load(path, textures=()):
    """Opens a source scene in an empty Blender session. A .blend with a broken shape key (the human basemeshes) still loads. `textures`:
    folders where an image the scene lost the path of is found again by its file name (a Windows path in a .blend, the texture archive
    kept beside a model archive)."""
    with quiet():
        _load(path, textures)

def _load(path, textures):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    ext = os.path.splitext(path)[1].lower()
    if ext == '.blend':
        try:
            bpy.ops.wm.open_mainfile(filepath=path)
        except RuntimeError as e:
            if 'ShapeKey' not in str(e):
                raise
    elif ext == '.fbx':
        bpy.ops.import_scene.fbx(filepath=path)
    elif ext in ('.glb', '.gltf'):
        bpy.ops.import_scene.gltf(filepath=path)
    elif ext == '.obj':
        bpy.ops.wm.obj_import(filepath=path)
    else:
        raise ValueError('unknown source ' + path)
    relink(textures, force=ext == '.fbx')
    _images.clear()
    _alphas.clear()

def relink(folders, force=False):
    """Points every image at the file of its name found in `folders` (recursively); an image that already has data is left alone unless `force`."""
    index = {}
    for f in folders:
        for p in glob.glob(os.path.join(f, '**', '*'), recursive=True):
            if os.path.isfile(p) and p.lower().endswith(('.png', '.jpg', '.jpeg', '.tga', '.bmp')):
                index.setdefault(os.path.basename(p).lower(), p)
    for img in bpy.data.images:
        name = os.path.basename((img.filepath or img.name).replace('\\', '/')).lower()
        base = re.sub(r'\.\d{3}$', '', name)
        for key in (name, base):
            if key in index and (force or not img.has_data or img.size[0] == 0):
                img.filepath = index[key]
                img.reload()
                break

_images = {}

def image_array(img, side=96):
    """An image as a small (h, w, 3) array of display sRGB, read once (None for an image with no data)."""
    if img.name in _images:
        return _images[img.name]
    arr = None
    try:
        w, h = img.size
        if w and h:
            tmp = img.copy()
            tmp.scale(min(side, w), min(side, h))
            arr = np.array(tmp.pixels[:], dtype=np.float32).reshape(tmp.size[1], tmp.size[0], tmp.channels)[:, :, :3]
            bpy.data.images.remove(tmp)
    except Exception:
        arr = None
    _images[img.name] = arr
    return arr

_alphas = {}

def image_alpha(img, side=96):
    """An image's alpha as a small (h, w, 1) array, read once (None for an image with no alpha or no data): where a texture is clear, as the glass of a jar or a bulb is."""
    if img.name in _alphas:
        return _alphas[img.name]
    arr = None
    try:
        w, h = img.size
        if w and h and img.channels >= 4:
            tmp = img.copy()
            tmp.scale(min(side, w), min(side, h))
            arr = np.array(tmp.pixels[:], dtype=np.float32).reshape(tmp.size[1], tmp.size[0], tmp.channels)[:, :, 3:4]
            bpy.data.images.remove(tmp)
    except Exception:
        arr = None
    _alphas[img.name] = arr
    return arr

def material_info(mat):
    """(base colour in display sRGB, the image feeding it or None) for a material."""
    if mat is None:
        return np.array([0.5, 0.5, 0.5]), None
    col, img = None, None
    if mat.use_nodes and mat.node_tree:
        links = mat.node_tree.links
        for n in mat.node_tree.nodes:
            if n.type == 'BSDF_PRINCIPLED':
                bc = n.inputs['Base Color']
                col = srgb(bc.default_value[:3])
                stack = [l.from_node for l in links if l.to_socket == bc]
                seen = 0
                while stack and seen < 12:  # an image behind a mix or an adjustment: the first one found
                    node = stack.pop()
                    seen += 1
                    if node.type == 'TEX_IMAGE' and node.image:
                        img = node.image
                        break
                    stack += [l.from_node for l in links if l.to_node == node]
                break
        if col is None:
            for n in mat.node_tree.nodes:
                if n.type == 'TEX_IMAGE' and n.image:
                    img = n.image
                    break
    if col is None:
        col = srgb(mat.diffuse_color[:3])
    return col, img

def sample_face(arr, uvs):
    """The mean colour of the image under a triangle (its three corners' UVs): the middle and a point toward each corner."""
    h, w = arr.shape[:2]
    mid = uvs.mean(axis=0)
    pts = [mid] + [mid * 0.4 + c * 0.6 for c in uvs]
    px = [arr[min(h - 1, int((p[1] % 1.0) * h)), min(w - 1, int((p[0] % 1.0) * w))] for p in pts]
    return np.mean(px, axis=0)

def to_game(p):
    """Blender (x right, y back, z up) to the game (x right, y up, z front): (x, z, -y), a proper rotation."""
    return np.stack([p[..., 0], p[..., 2], -p[..., 1]], axis=-1)

class Soup:
    """The triangles of a model: pos (n,3,3) in game space, col (n,3) display sRGB 0..1, cls (n,) material class, mat (n,) material slot."""
    def __init__(self):
        self.parts = []

    def add(self, pos, col, cls, mat):
        self.parts.append((pos, col, cls, mat))

    def done(self):
        if not self.parts:
            return np.zeros((0, 3, 3)), np.zeros((0, 3)), np.zeros(0, dtype=np.int32), np.zeros(0, dtype=np.int32)
        return tuple(np.concatenate([p[i] for p in self.parts]) for i in range(4))

def mesh_objects(select=None, exclude=None):
    """Mesh objects of the session by name (regex fullmatch; a list is alternatives)."""
    objs = [o for o in bpy.data.objects if o.type == 'MESH']
    if select:
        pats = [select] if isinstance(select, str) else list(select)
        objs = [o for o in objs if any(re.fullmatch(p, o.name) for p in pats)]
    if exclude:
        pats = [exclude] if isinstance(exclude, str) else list(exclude)
        objs = [o for o in objs if not any(re.fullmatch(p, o.name) for p in pats)]
    return objs

def decimate(me, target, planar=3.0):
    """Reduces a mesh toward `target` triangles: doubles welded, coplanar faces dissolved, the rest collapsed."""
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
    if planar:
        bmesh.ops.dissolve_limit(bm, angle_limit=math.radians(planar), verts=bm.verts, edges=bm.edges)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    n = len(me.polygons)
    if target and n > target:
        tmp = bpy.data.objects.new('dec', me)
        bpy.context.scene.collection.objects.link(tmp)
        mod = tmp.modifiers.new('dec', 'DECIMATE')
        mod.decimate_type = 'COLLAPSE'
        mod.ratio = max(0.02, target / n)
        mod.use_collapse_triangulate = True
        bpy.context.view_layer.objects.active = tmp
        dg = bpy.context.evaluated_depsgraph_get()
        new = bpy.data.meshes.new_from_object(tmp.evaluated_get(dg), depsgraph=dg)
        bpy.data.objects.remove(tmp)
        return new
    return me

def pose_armature(arm, pose):
    """Sets pose bone rotations (degrees, Euler XYZ in each bone's own frame) by bone name."""
    for name, rot in pose.items():
        pb = arm.pose.bones.get(name)
        if pb:
            pb.rotation_mode = 'XYZ'
            pb.rotation_euler = [math.radians(a) for a in rot]
    bpy.context.view_layer.update()

def bone_point(arm, name, tail=False):
    """A posed bone's head (or tail) in the game's frame."""
    pb = arm.pose.bones[name]
    v = arm.matrix_world @ (pb.tail if tail else pb.head)
    return to_game(np.array([v.x, v.y, v.z]))

def soup_of(objs, classes=None, drop=None, default_cls=None, decimate_to=None, planar=3.0, cut=None, drop_alpha=0.0):
    """The triangles of `objs`, as Blender evaluates them (armature posed, modifiers applied). `classes`: {material name regex: class} before the
    name rules; `drop`: material name regexes whose faces are returned apart as the second soup (a flame's anchor is read from them);
    `decimate_to`: a triangle count to reduce each object toward; `cut`: (point, normal) bisecting planes keeping the side the normal points to;
    `drop_alpha`: faces whose texture is clearer than this (a glass wall) are returned apart with the dropped ones."""
    out, dropped = Soup(), Soup()
    classes = classes or {}
    drop = [drop] if isinstance(drop, str) else (drop or [])
    for obj in objs:
        dg = bpy.context.evaluated_depsgraph_get()
        me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg), preserve_all_data_layers=True, depsgraph=dg)
        mats = [s.material for s in obj.material_slots] or [None]
        mw = np.array(obj.matrix_world)
        if cut:
            me.transform(__import__('mathutils').Matrix(mw.tolist()))
            mw = np.eye(4)
            bm = bmesh.new()
            bm.from_mesh(me)
            for (pt, nrm) in cut:  # blender space
                geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
                bmesh.ops.bisect_plane(bm, geom=geom, plane_co=pt, plane_no=nrm, clear_inner=True)
            bm.to_mesh(me)
            bm.free()
        if decimate_to:
            me = decimate(me, decimate_to, planar)
        me.calc_loop_triangles()
        verts = np.empty(len(me.vertices) * 3, dtype=np.float64)
        me.vertices.foreach_get('co', verts)
        verts = (np.c_[verts.reshape(-1, 3), np.ones(len(me.vertices))] @ mw.T)[:, :3]
        uvs = None
        if me.uv_layers.active:
            uvs = np.empty(len(me.loops) * 2, dtype=np.float64)
            me.uv_layers.active.data.foreach_get('uv', uvs)
            uvs = uvs.reshape(-1, 2)
        vcol = None
        if len(me.color_attributes):
            attr = me.color_attributes[0]
            buf = np.empty(len(attr.data) * 4, dtype=np.float32)
            attr.data.foreach_get('color', buf)
            vcol = (attr.domain, buf.reshape(-1, 4)[:, :3])
        infos = [material_info(m) for m in mats]
        for t in me.loop_triangles:
            mi = t.material_index if t.material_index < len(mats) else 0
            name = mats[mi].name if mats[mi] else ''
            base, img = infos[mi]
            col = np.array(base, dtype=np.float64)
            arr = image_array(img) if img else None
            if arr is not None and uvs is not None:
                col = np.array(sample_face(arr, uvs[list(t.loops)]), dtype=np.float64)
            elif vcol is not None:
                dom, data = vcol
                col = srgb(data[list(t.loops) if dom == 'CORNER' else list(t.vertices)].mean(axis=0))
            cls = next((c for pat, c in classes.items() if re.search(pat, name, re.I)), None)
            if cls is None:
                cls = classify_name(name, default_cls)
            if cls is None:
                cls = classify_colour(col)
            tri = to_game(verts[list(t.vertices)])
            clear = False
            if drop_alpha and img is not None and uvs is not None:
                alpha = image_alpha(img)
                clear = alpha is not None and float(sample_face(alpha, uvs[list(t.loops)])[0]) < drop_alpha
            target = dropped if clear or any(re.search(p, name, re.I) for p in drop) else out
            target.add(tri[None], col[None], np.array([cls], dtype=np.int32), np.array([mi], dtype=np.int32))
        bpy.data.meshes.remove(me)
    return out, dropped
