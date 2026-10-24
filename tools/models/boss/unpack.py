"""Unpacks the supplied asset collection (Seventy_Steps_Boss_Assets: one folder a pack, `packs/NN-name/`, each with its zip or loose files) into
the layout the baker's manifest names: `<work>/pNN/...`, the graveyard's models in `p05a` and its textures in `p05b`. Idempotent. Offline only.
Run: python3 -I tools/models/boss/unpack.py <Seventy_Steps_Boss_Assets> <work dir>   (needs `pip install py7zr` for pack 17)"""
import glob, os, shutil, sys, zipfile

def unzip(zf, dest):
    os.makedirs(dest, exist_ok=True)
    with zipfile.ZipFile(zf) as z:
        z.extractall(dest)

def main(root, work):
    packs = os.path.join(root, 'packs')
    for d in sorted(os.listdir(packs)):
        n = d[:2]
        src = os.path.join(packs, d)
        dest = os.path.join(work, 'p' + n)
        if os.path.exists(dest) and os.listdir(dest):
            continue
        if n == '05':  # the models, and the textures the free version leaves out
            unzip(os.path.join(src, 'HalloweenGraveyardFreeVersion.zip'), os.path.join(work, 'p05a'))
            unzip(os.path.join(src, 'halloweengraveyardtextures.zip'), os.path.join(work, 'p05b'))
            continue
        os.makedirs(dest, exist_ok=True)
        if n == '17':
            import py7zr
            with py7zr.SevenZipFile(os.path.join(src, 'basalt_columns.7z')) as z:
                z.extractall(dest)
            continue
        for zf in glob.glob(os.path.join(src, '*.zip')):
            if n == '15' and '_1_0' in zf:  # the first skull-and-bones set repeats the second's
                continue
            unzip(zf, dest)
        for f in glob.glob(os.path.join(src, '*')):  # loose models (a pack that is not zipped)
            if os.path.isfile(f) and f.lower().endswith(('.glb', '.fbx', '.obj', '.blend', '.png')):
                shutil.copy(f, dest)
            elif os.path.isdir(f) and not os.listdir(dest):
                shutil.copytree(f, os.path.join(dest, os.path.basename(f)), dirs_exist_ok=True)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
