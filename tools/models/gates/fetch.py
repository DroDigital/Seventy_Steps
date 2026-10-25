#!/usr/bin/env python3
"""Fetches the free sources of the arena gates (docs/GATES.md) into a work dir, one folder a source, `w01` and on, the layout
tools/models/boss/manifest_gates.py names. Poly Haven's models are CC0 (read from the asset's own info.json, which is kept); Kenney's kits are CC0
(the kit's License.txt is kept). Nothing is fetched that is not CC0 or CC BY. Offline afterwards: bake_boss_models.py reads the work dir.
The Sketchfab models (w20: the Aztec double-headed serpent, w21: the Demons Gate; both CC BY 4.0, credited in src/data/models/CREDITS.md) need a sign-in to
download and are not fetched: download each as glTF by hand into <work dir>/w20 and /w21 (scene.gltf, scene.bin, license.txt).
Run: python3 -I tools/models/gates/fetch.py <work dir>   (network; standard library only)"""
import io, json, os, re, sys, urllib.request, zipfile

H = {'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64) seventy-steps-asset-fetch'}

# folder -> Poly Haven asset
POLY = {'w01': 'large_iron_gate', 'w02': 'large_castle_door', 'w03': 'namaqualand_boulder_03'}
# folder -> (Kenney asset page, the model files wanted from its GLB folder)
KENNEY = {
    'w10': ('castle-kit', ['metal-gate']),
    'w11': ('modular-dungeon-kit', ['gate-metal-bars']),
}


def fetch(url):
    return urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=180).read()


def poly(asset, out, res='1k'):
    files = json.loads(fetch(f'https://api.polyhaven.com/files/{asset}'))['gltf'][res]['gltf']
    os.makedirs(out, exist_ok=True)
    open(f'{out}/{asset}.gltf', 'wb').write(fetch(files['url']))
    for name, inc in files['include'].items():
        os.makedirs(os.path.dirname(f'{out}/{name}') or out, exist_ok=True)
        open(f'{out}/{name}', 'wb').write(fetch(inc['url']))
    info = json.loads(fetch(f'https://api.polyhaven.com/info/{asset}'))
    json.dump(info, open(f'{out}/info.json', 'w'), indent=1)
    print(asset, 'by', info.get('authors'), '->', out)


def kenney(page, wanted, out):
    html = fetch(f'https://kenney.nl/assets/{page}').decode('utf8', 'replace')
    url = re.search(r'https://kenney\.nl/media/pages/assets/[^"\']*\.zip', html).group(0)
    z = zipfile.ZipFile(io.BytesIO(fetch(url)))
    os.makedirs(out, exist_ok=True)
    for n in z.namelist():
        base = os.path.basename(n)
        if n.lower().endswith('license.txt') or ('GLB format' in n and os.path.splitext(base)[0] in wanted):
            open(f'{out}/{base}', 'wb').write(z.read(n))
    print(page, '->', out, sorted(os.listdir(out)))


if __name__ == '__main__':
    work = sys.argv[1]
    for d, a in POLY.items():
        poly(a, os.path.join(work, d))
    for d, (page, wanted) in KENNEY.items():
        kenney(page, wanted, os.path.join(work, d))
