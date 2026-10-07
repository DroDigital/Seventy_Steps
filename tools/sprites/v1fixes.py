#!/usr/bin/env python3
"""The library's v1 defects that need no drawing (Codex's review of the author's folder, counterchecked):

  python3 v1fixes.py <pack>

- innsmouth_hybrid: the base form's LEFT and RIGHT sets were swapped in v1, idles and walk alike (the eldritch
  form is right): the two folders change places, frames and all, walk4's frames with them (each side's
  were made from that side's own).
- cthulhu: the turnaround's left view faces right and its right view left: the page's two paths change places.
- the gallery page: the load error ("Unable to load selected view.") now clears when the selected view loads
  or another creature is picked; the banner counts entries "accepted" (it reads their accepted flags, not
  whether their files load).

Run it once, on a pack whose frames are converted (deliver.py zips what it leaves); a pack it has already
mended is refused, since a second run would swap Innsmouth's sides back."""
import json, os, re, sys

CTHULHU = ('"left":"../bosses/cthulhu/turnaround/left-v1.png"', '"right":"../bosses/cthulhu/turnaround/right-v1.png"')
PAGE_EDITS = [
    ("function select(item){current=item;", "function select(item){$('load-error').hidden=true;current=item;"),
    ("for(const id of ['native','enlarged'])$(id).onerror=()=>{reviewErrors.push($(id).src);$('load-error').hidden=false;"
     "$('load-error').textContent='Unable to load selected view.';};",
     "const viewLoaded=()=>{if($('load-error').dataset.kind==='view'&&['native','enlarged'].every(id=>$(id).complete"
     "&&$(id).naturalWidth))$('load-error').hidden=true;};for(const id of ['native','enlarged']){$(id).onerror=()=>"
     "{reviewErrors.push($(id).src);$('load-error').hidden=false;$('load-error').dataset.kind='view';"
     "$('load-error').textContent='Unable to load selected view.';};$(id).addEventListener('load',viewLoaded);}"),
    ("im.onerror=()=>{reviewErrors.push(path);$('load-error').hidden=false;",
     "im.onerror=()=>{reviewErrors.push(path);$('load-error').hidden=false;$('load-error').dataset.kind='file';"),
    ("' entries complete · '", "' entries accepted · '"),
]


def main(pack):
    page_path = os.path.join(pack, 'previews/library.html')
    page = open(page_path, encoding='utf-8').read()
    if "' entries accepted · '" in page:
        sys.exit('this pack is already mended (a second run would swap Innsmouth back)')
    m = re.search(r'(<script id="pack-data"[^>]*>)(.*?)(</script>)', page, re.S)
    data = m.group(2)
    left, right = CTHULHU
    if data.count(left) != 1 or data.count(right) != 1:
        sys.exit("cthulhu's left and right views are not where v1 has them")
    data = data.replace(left, '\0').replace(right, right.replace('right-v1', 'left-v1'))
    data = data.replace('\0', left.replace('left-v1', 'right-v1'))
    page = page[:m.start(2)] + data + page[m.end(2):]
    for old, new in PAGE_EDITS:
        if page.count(old) != 1:
            sys.exit(f'the page has changed: {old[:50]}… not found once')
        page = page.replace(old, new)

    base = os.path.join(pack, 'sprites/innsmouth_hybrid/64x64')
    tmp = os.path.join(base, '_swap')
    os.rename(os.path.join(base, 'left'), tmp)
    os.rename(os.path.join(base, 'right'), os.path.join(base, 'left'))
    os.rename(tmp, os.path.join(base, 'right'))
    open(page_path, 'w', encoding='utf-8').write(page)
    print('innsmouth_hybrid: left and right sets swapped; cthulhu: left and right views swapped; '
          'page: the load error clears, the banner says accepted')


if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
