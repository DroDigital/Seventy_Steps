#!/usr/bin/env python3
"""Writes the table of where every boss model came from and where it stands (docs/BOSS_MODELS.md): its pack, its source file (or the form made in
code), the metres and triangles it was baked to, and the places whose planners name it. Needs no Blender: the manifests are read with the source
reader stubbed out. Run: python3 -I tools/models/boss/mapping.py > docs/BOSS_MODELS.md   (after tools/models/bake_boss_models.py)"""
import glob, os, re, sys, types

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, '..', '..', '..')
sys.path.insert(0, HERE)

class Stub(types.ModuleType):
    def __getattr__(self, name):
        if name.startswith('__'):
            raise AttributeError(name)
        return hash(name) % 97
sys.modules['sources'] = Stub('sources')
import manifest as MF

PACKS = {
    'p01': ('3D Retro Medieval/Fantasy Building Kit', 'chilly_durango', 'CC0'), 'p02': ('Nature Kit', 'Kenney', 'CC0'),
    'p03': ('Ultimate Stylized Nature', 'Quaternius', 'CC0'), 'p04': ('3D Retro Shacks Shanties Sheds & Gantries', 'chilly_durango', 'CC0'),
    'p05': ('PSX Style Modular Low Poly Graveyard (Free)', 'BlenderVoyage', 'CC BY 4.0'), 'p06': ('PSX Style Low Poly Modular Castle', 'BlenderVoyage', 'CC BY 4.0'),
    'p08': ('Modular Temple Pack', 'Fertile Soil Productions', 'CC0'), 'p09': ('Ultimate Modular Ruins', 'Quaternius', 'CC0'),
    'p13': ('Human Basemeshes', 'pistachio', 'CC0'),
    'p15': ('3D dungeon debris: skull and bones', 'Paul Wortmann', 'CC0'), 'p16': ('Hexagon Kit', 'Kenney', 'CC0'),
    'p17': ('Columnar Basalt', 'bobjh', 'CC BY 4.0'), 'p18': ('Dungeon Pack 1.1 (Free)', 'Kay Lousberg', 'CC0'),
    'p19': ('Dead trees (Low-poly)', 'Goth Scarecrow', 'CC0'), 'p20': ('Alien buildings extension pack', 'rubberduck', 'CC0'),
    'p21': ('Modular Wooden Pier', 'Poly Haven', 'CC0'), 'p22': ('Roman theater of Palmyra', 'Marin PETTE', 'CC BY 4.0'),
    'p23': ('Wajia Flute', '3D Vault', 'CC BY 4.0'), 'p24': ('Egyptian Temple', 'Bruno Macchioni', 'CC BY 4.0'),
    'p25': ('Low Poly Black Castle', 'Bl4ckGh0st', 'CC BY 4.0'), 'p26': ('Theatre stage', 'mynameismary', 'CC BY 4.0'),
    'p27': ('Snake statue', 'Animex', 'CC BY 4.0'), 'p28': ('Temple Ruins Asset Pack', 'Bl4ckGh0st', 'CC BY 4.0'),
    'p29': ('Ancient Ruins (Modular)', 'zacharykozak', 'CC BY 4.0'),
    'p30': ('Alembic', 'FlukierJupiter', 'CC BY 4.0'), 'p31': ('American Old Barn', 'andrewriddle', 'CC BY 4.0'),
    'p32': ('Armillary sphere', 'KRei', 'CC BY 4.0'), 'p33': ('Brain in a Jar', 'Mad_Lobster_Workshop', 'CC BY 4.0'),
    'p34': ('Brazier', 'Jochon', 'CC BY 4.0'), 'p35': ('Coral', 'rkuhlf', 'CC BY 4.0'),
    'p36': ('Gothic Cloaked Figure - Building Wall Statue', 'INGSOC1984', 'CC BY 4.0'), 'p37': ('Hourglass', 'carismah', 'CC BY 4.0'),
    'p38': ('Museum Showcase - Die Vitrine', 'Samuel Francis Johnson (Oneironauticus)', 'CC BY 4.0'), 'p39': ('Stone Altar', 'TheoClarke', 'CC BY 4.0'),
    'p40': ('PSX Dungeon', 'Goblinatron', 'CC BY 4.0'), 'p41': ('PSX Bookshelves & Food Shelves', 'Munchkin Gaming', 'free for commercial use, no redistribution as assets'),
    'p42': ('Modular Cathedral Kit', 'SigilsVault', 'CC0'), 'p43': ('Sewers Modular Assets', 'RotoPoly', 'CC0'),
    'p44': ("Kyle's Mushroom Pack", 'Kyle Fuji', 'CC0'), 'p45': ('Poly Haven: mirror, pipes, bottle, roots', 'Poly Haven', 'CC0'),
    'p46': ('Lab Assets', 'MilkAndBanana', 'CC0'), 'p47': ('Retro Modular House Pack', 'Elegant Crow', 'CC0'),
    'p48': ('Modular Cave Kit', 'Kenney', 'CC0'), 'p49': ('Retro Fantasy Kit', 'Kenney', 'CC0'),
    'proc': ('Made in code', 'this repository', '-'),
}

def used_by():
    places = {}
    for f in sorted(glob.glob(os.path.join(ROOT, 'src', 'world', 'places', '*.ts'))):
        name = os.path.basename(f)[:-3]
        if name == 'index':
            continue
        text = open(f).read()
        for m in re.finditer(r"`([a-z]{2,3}_[a-z0-9_]*)\$\{", text): # (an id built from a prefix: `st_rock_${n}`)
            places.setdefault(m.group(1) + '*', set()).add(name)
        for m in re.finditer(r"'([a-z]{2,3}_[a-z0-9_]+)'", text):
            places.setdefault(m.group(1), set()).add(name)
    for f in sorted(glob.glob(os.path.join(ROOT, 'src', 'data', 'hallSets*.ts')) + [os.path.join(ROOT, 'src', 'data', 'roomSets.ts')]): # (round 74: the halls' and rooms' sets stand them too)
        here = os.path.basename(f)[:-3]
        owner = here
        for line in open(f).read().split('\n'):
            m = re.match(r"^  '?([a-z_]+(?:/[a-z_]+)?)'?: \{", line)
            if m:
                owner = m.group(1)
            for u in re.finditer(r"(?:put|row)\('([a-z]{2,3}_[a-z0-9_]+)'", line):
                places.setdefault(u.group(1), set()).add(owner)
    return places

def index():
    out = {}
    for m in re.finditer(r"^  (\w+): \{ kit: '(\w+)', x0: ([-\d.]+), x1: ([-\d.]+), y0: ([-\d.]+), y1: ([-\d.]+), z0: ([-\d.]+), z1: ([-\d.]+),.*tris: (\d+)", open(os.path.join(ROOT, 'src', 'data', 'models', 'bossIndex.ts')).read(), re.M):
        g = m.groups()
        out[g[0]] = (float(g[3]) - float(g[2]), float(g[5]) - float(g[4]), float(g[7]) - float(g[6]), int(g[8]))
    return out

def main():
    models, idx, used = MF.load_all(), index(), used_by()
    for key in [k for k in used if k.endswith('*')]:
        for i in idx:
            if i.startswith(key[:-1]):
                used.setdefault(i, set()).update(used[key])
    print('# The boss places\' models: source and use\n')
    print('Generated by `tools/models/boss/mapping.py` from the manifests (`tools/models/boss/manifest_*.py`) and the baked index (`src/data/models/bossIndex.ts`).')
    print('A model\'s id is what the planners in `src/world/places/` and the sets of the boss halls and rooms (`src/data/hallSets*.ts`, `src/data/roomSets.ts`) name; `size` is its baked box (x × y × z metres) before a planner scales it. Licences and the changes made: `src/data/models/CREDITS.md`.\n')
    for kit in PACKS:
        mine = [m for m in models if (m.kit or 'proc') == kit and m.id in idx]
        if not mine:
            continue
        title, by, lic = PACKS[kit]
        print(f'## {kit.replace("p", "Pack ") if kit != "proc" else "Made in code"}: {title}\n')
        if kit != 'proc':
            print(f'By {by}; licence {lic}.\n')
        print('| game id | source | size (m) | triangles | stood by |')
        print('|---|---|---|---|---|')
        for m in mine:
            x, y, z, t = idx[m.id]
            src = m.src.split('/', 1)[-1] if not m.src.startswith('proc:') else '`' + m.src + '`'
            sel = f' ({m.select})' if m.select and isinstance(m.select, str) and kit != 'proc' else ''
            print(f'| `{m.id}` | {src}{sel} | {x:.1f} × {y:.1f} × {z:.1f} | {t} | {", ".join(sorted(used.get(m.id, []))) or "-"} |')
        print()

if __name__ == '__main__':
    main()
