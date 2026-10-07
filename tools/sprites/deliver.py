#!/usr/bin/env python3
"""The delivery to the library's author: one zip of the frames that changed, and the gallery page.

  python3 deliver.py <pack> <published pack> <out.zip> [--theirs key:side ...]

<pack> is the working pack (what walk4.py and fromsheet.py wrote), <published pack> a fresh
`sprite_review.py fetch` of the published one (the page saved as previews/library.html, the host's
injected /cdn-cgi/ script dropped). The zip holds `previews/library.html` and every frame under
`sprites/` that differs from the published pack, at its own path, so the author lays it over their
folder. --theirs names sides the author drew themselves (Codex's Deep One and Curwen walks): their
frames exist only in the author's folder, so none are written, and the page lists move_2 and move_3
for them by the paths of their move_0. Every frame the page lists must then be in the working pack
(or be theirs), or the delivery is refused."""
import json, os, re, sys, zipfile

PAGES = ('previews/library.html', 'library.html', 'index.html')
HOST_SCRIPT = re.compile(r'<script>(?:(?!</script>).)*?/cdn-cgi/(?:(?!</script>).)*?</script>', re.S)
STAMP = (2026, 10, 6, 0, 0, 0)       # a fixed time, so the same pack is the same zip


def _rel(path):
    return os.path.normpath(path[3:] if path.startswith('../') else path)


def _page(root):
    page = next(p for p in PAGES if os.path.exists(os.path.join(root, p)))
    return open(os.path.join(root, page), encoding='utf-8').read()


def main(pack, published, out, theirs):
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
    for folder, _, files in sorted(os.walk(os.path.join(pack, 'sprites'))):
        for f in sorted(files):
            path = os.path.join(folder, f)
            rel = os.path.relpath(path, pack)
            old = os.path.join(published, rel)
            if os.path.dirname(rel) in skip:
                continue
            if not os.path.exists(old) or open(old, 'rb').read() != open(path, 'rb').read():
                changed.append(rel)
    with zipfile.ZipFile(out, 'w', zipfile.ZIP_DEFLATED) as z:
        z.writestr(zipfile.ZipInfo('previews/library.html', STAMP), page.encode('utf-8'))
        for rel in changed:
            z.writestr(zipfile.ZipInfo(rel, STAMP), open(os.path.join(pack, rel), 'rb').read())
    sides = {os.path.dirname(r) for r in changed}
    print(f'{out}: previews/library.html and {len(changed)} frames in {len(sides)} folders')


if __name__ == '__main__':
    args = sys.argv[1:]
    if '--theirs' in args:
        i = args.index('--theirs')
        args, theirs = args[:i], args[i + 1:]
    else:
        theirs = []
    if len(args) != 3:
        sys.exit(__doc__)
    main(*args, theirs)
