"""Pack 41, 'PSX Bookshelves & Food Shelves' by Munchkin Gaming (itch.io, free for commercial use, not to be resold or redistributed as assets; the pack's own images are AI-assisted):
its abandoned ('Horror') bookcases only, wood and books, for the library and the archives (round 74). No supermarket shelf is taken."""
from manifest import M, add
import sources as S

def ps(id, file, **kw):
    return M(id, f'p41/Horror/{file}.glb', None, kit='p41', cls=S.WOOD, classes={'.': S.WOOD}, **kw)

add(
    ps('ps_bookcase', 'Bookcase_Tall', fit={'height': 2.5}, solids='box'),
    ps('ps_bookcase_low', 'Bookcase_Short', fit={'height': 1.5}, solids='box'),
    ps('ps_bookbay', 'LibraryBay', fit={'height': 2.8}, solids='box'),
    ps('ps_bookpile', 'BookPile', fit={'width': 0.9}, solids='none'),
    ps('ps_wallshelf', 'WallShelf', fit={'width': 1.5}, solids='none'),
)
