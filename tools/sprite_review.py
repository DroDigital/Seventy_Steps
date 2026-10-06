#!/usr/bin/env python3
"""Reviews a creature sprite pack's walks (docs/SPRITE_QA.md); needs `pip install pillow numpy`.

  python3 tools/sprite_review.py fetch <url> <dir>     copy a published pack's page and idle/move frames
  python3 tools/sprite_review.py audit <dir> [--report docs/SPRITE_REVIEW.md] [--json out.json] [--strict]
  python3 tools/sprite_review.py sheets <dir> <out> [key,key...]   contact sheets for review by eye
  python3 tools/sprite_review.py fix <dir> <out>       the mends that need no drawing, on a copy

<dir> is the pack's root: the folder holding previews/library.html (or a fetched index.html).
--strict exits 1 while any finding the tool cannot mend remains (a glider's two keys are advice, not
a failure): a gate for each new delivery."""
import argparse, json, os, sys

sys.path.insert(0, os.path.dirname(__file__))
from sprites import pack as packs, checks, sheet, fix, report  # noqa: E402

NOTES = os.path.join(os.path.dirname(__file__), 'sprites', 'notes.json')


def load(root):
    with open(NOTES, encoding='utf-8') as f:
        notes = json.load(f)
    p = packs.Pack(root)
    return p, checks.audit(p, notes)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest='cmd', required=True)
    f = sub.add_parser('fetch'); f.add_argument('url'); f.add_argument('dir')
    a = sub.add_parser('audit'); a.add_argument('dir'); a.add_argument('--report'); a.add_argument('--json')
    a.add_argument('--strict', action='store_true'); a.add_argument('--source')
    s = sub.add_parser('sheets'); s.add_argument('dir'); s.add_argument('out'); s.add_argument('keys', nargs='?')
    x = sub.add_parser('fix'); x.add_argument('dir'); x.add_argument('out')
    args = ap.parse_args()

    if args.cmd == 'fetch':
        packs.fetch(args.url, args.dir)
        return
    p, found = load(args.dir)
    if args.cmd == 'audit':
        by = {}
        for item in found:
            by[item['check']] = by.get(item['check'], 0) + 1
        print(f'{len(p.sprites())} sprite sets, {len(found)} findings: ' +
              ', '.join(f'{k} {v}' for k, v in sorted(by.items())))
        if args.report:
            with open(args.report, 'w', encoding='utf-8') as out:
                out.write(report.markdown(p, found, args.source or f'`{args.dir}`'))
            print(f'report in {args.report}')
        if args.json:
            with open(args.json, 'w', encoding='utf-8') as out:
                json.dump(found, out, indent=1)
        open_ = [i for i in found if i['check'] != 'glide-frames' and
                 not (i.get('fix') and i['check'] in report.MENDED)]
        if args.strict and open_:
            sys.exit(1)
    elif args.cmd == 'sheets':
        sheet.write(p, found, args.out, set(args.keys.split(',')) if args.keys else None)
    elif args.cmd == 'fix':
        fix.write(p, found, args.out)


if __name__ == '__main__':
    main()
