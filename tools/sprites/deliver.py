#!/usr/bin/env python3
"""The delivery to the library's author: one zip of every creature folder that changed, whole, and the
gallery page.

  python3 deliver.py <pack> <published pack> <out.zip> [--theirs-from <dir>] [--theirs key:side ...]

<pack> is the working pack (what walk4.py and fromsheet.py wrote), <published pack> a fresh
`sprite_review.py fetch --all` of the published one (the page saved as previews/library.html, the
host's injected /cdn-cgi/ script dropped). A creature folder (`sprites/<name>`, or a boss's `bosses/<name>`)
goes in whole when any frame in it differs from the published pack: every file the page lists under it, the new frames
from the pack and the rest from the published pack. A zip of loose frames is only safe unzipped by
merging; one that replaces folders instead (Finder's "Replace") deletes all else in them, and that is
how the author's folder lost 1,465 files to walk_fix_v3. --theirs names sides the author drew
themselves (Codex's Deep One and Curwen walks): their frames exist only in the author's folder, so
none are written, and the page lists move_2 and move_3 for them by the paths of their move_0. When their
creature folder goes in for other sides, --theirs-from names a copy of the author's own files (their idle and move
frames, at the pack's paths), which go in as they are, so that folder too is whole and safe to replace. Every
idle and move frame the page lists must be in the working pack (or be theirs), and every file of a
whole folder in one of the two packs, or the delivery is refused."""
import json, os, re, sys, zipfile

PAGES = ('previews/library.html', 'library.html', 'index.html')
HOST_SCRIPT = re.compile(r'<script>(?:(?!</script>).)*?/cdn-cgi/(?:(?!</script>).)*?</script>', re.S)
STAMP = (2026, 10, 6, 0, 0, 0)       # a fixed time, so the same pack is the same zip


def _rel(path):
    return os.path.normpath(path[3:] if path.startswith('../') else path)


def _listed(data):
    """Every file the gallery lists, as paths from the pack's root."""
    if isinstance(data, dict):
        return [p for v in data.values() for p in _listed(v)]
    if isinstance(data, list):
        return [p for v in data for p in _listed(v)]
    return [_rel(data)] if isinstance(data, str) and data.startswith('../') else []


def _folder(rel):
    return '/'.join(rel.split('/')[:2])


def _page(root):
    page = next(p for p in PAGES if os.path.exists(os.path.join(root, p)))
    return open(os.path.join(root, page), encoding='utf-8').read()


def main(pack, published, out, theirs, theirs_from=None):
    html = HOST_SCRIPT.sub('', _page(pack))
    m = re.search(r'(<script id="pack-data"[^>]*>)(.*?)(</script>)', html, re.S)
    data = json.loads(m.group(2))
    items = {i['key']: i for i in data['items']}
    skip = set()
    for label in theirs:
        key, side = label.split(':')
        fr = items[key]['frames'][side]
        prefix = fr['move_0'].rsplit('/', 1)[0]
        for n in ('move_2', 'move_3'):
            fr[n] = f'{prefix}/{n}.png'
        skip.add(os.path.dirname(_rel(fr['move_0'])))
    missing = [p for i in data['items'] if i.get('renderer') == 'sprite' for fr in i['frames'].values()
               for n, p in fr.items() if n.startswith(('idle', 'move')) and not os.path.exists(os.path.join(pack, _rel(p)))
               and os.path.dirname(_rel(p)) not in skip]    # (fetch copies idle and move frames only)
    if missing:
        sys.exit(f'{len(missing)} listed frames are not in the pack, e.g. {missing[0]}')
    page = html[:m.start(2)] + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + html[m.end(2):]
    changed = []
    walks = [w for top in ('sprites', 'bosses') for w in sorted(os.walk(os.path.join(pack, top)))]
    for folder, _, files in walks:
        for f in sorted(files):
            path = os.path.join(folder, f)
            rel = os.path.relpath(path, pack)
            old = os.path.join(published, rel)
            if os.path.dirname(rel) in skip:
                continue
            if not os.path.exists(old) or open(old, 'rb').read() != open(path, 'rb').read():
                changed.append(rel)
    folders = {_folder(r) for r in changed}
    whole = sorted({r for r in _listed(data['items']) if _folder(r) in folders and os.path.dirname(r) not in skip}
                   | set(changed))
    if theirs_from:     # the author's own frames for their sides, where their folder goes in whole
        mine = [t for t in skip if _folder(t) in folders]
        short = [r for r in _listed(data['items']) if os.path.dirname(r) in mine
                 and not os.path.exists(os.path.join(theirs_from, r))]
        if short:
            sys.exit(f'{len(short)} of the author\'s own frames are not in {theirs_from}, e.g. {short[0]}')
        whole = sorted(set(whole) | {os.path.relpath(os.path.join(d, f), theirs_from) for t in mine
                                     for d, _, fs in os.walk(os.path.join(theirs_from, t)) for f in fs})
    roots = (pack, published) + ((theirs_from,) if theirs_from else ())
    source = {r: next((os.path.join(root, r) for root in roots if os.path.exists(os.path.join(root, r))
                       and not (root != theirs_from and os.path.dirname(r) in skip)), None) for r in whole}
    lacking = [r for r, s in source.items() if s is None]
    if lacking:
        sys.exit(f'{len(lacking)} files of the folders to deliver whole are in neither pack, e.g. {lacking[0]} '
                 '(fetch the published pack with --all)')
    mixed = sorted({_folder(d) for d in skip if not (theirs_from and os.path.isdir(os.path.join(theirs_from, d)))}
                   & folders)
    if mixed:
        print(f'warning: {", ".join(mixed)} also hold sides the author drew: this zip must be merged over their folder')
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr(zipfile.ZipInfo('previews/library.html', STAMP), page.encode('utf-8'))
        for rel in whole:
            z.writestr(zipfile.ZipInfo(rel, STAMP), open(source[rel], 'rb').read())
    print(f'{out}: previews/library.html and {len(whole)} files in {len(folders)} whole creature folders '
          f'({len(changed)} new frames in {len({os.path.dirname(r) for r in changed})} sides)')


if __name__ == '__main__':
    args = sys.argv[1:]
    theirs_from = None
    if '--theirs-from' in args:
        i = args.index('--theirs-from')
        theirs_from, args = args[i + 1], args[:i] + args[i + 2:]
    if '--theirs' in args:
        i = args.index('--theirs')
        args, theirs = args[:i], args[i + 1:]
    else:
        theirs = []
    if len(args) != 3:
        sys.exit(__doc__)
    main(*args, theirs, theirs_from)
