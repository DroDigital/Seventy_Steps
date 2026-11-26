# Level design: the dungeons as Souls levels

Round 127. The request was: "do the absolute best you can do for 2.", which was the second point of a review: *design the dungeons the way Souls levels are designed*.

Before this round, every dungeon was a tree of rooms. Each room had one way in, from its parent. Going deeper meant walking every room back again, and nothing ever opened behind you. Souls levels work the other way round:

- the way on winds forward and **folds back** on itself;
- a door that was barred on the way in **is opened from the far side**, so the next run is short;
- a **ledge** can be dropped from but never climbed;
- something **lies in wait** where the room invites a careless step;
- through a **window** you see a place you have not reached yet.

This document covers four things:

- [the vocabulary](#the-vocabulary): how to write each of those five things;
- [the rules the layout enforces](#the-rules-the-layout-enforces);
- [the audits](#the-audits) that keep every dungeon honest;
- [the 28 dungeons](#the-28-dungeons), one line each.

## The vocabulary

The room tree is kept as it was: `room(...)` in `src/data/roomBuild.ts`, each room with its `from` and its `dir`. The second ways are listed after the rooms, as `links`.

```ts
links: [link('passage', 'crypt', 'shortcut'), link('pantry', 'sump', 'drop'), link('balcony', 'aisle', 'window')],
```

| Kind | What it is | Who walks it | Code |
|---|---|---|---|
| `open` | A second doorway between two rooms: a loop. | Both ways. | `world/dungeonLinks.ts` |
| `shortcut` | A doorway shut by a door barred on `from`'s side. Press E at the bar ("lift the bar", "draw the bolt" or "throw the lever", by its kind) to open it for good. From `to`'s side the door rattles and holds ("Barred from the other side"). | Once opened, both ways. | `world/shortcutPlan.ts`, `systems/shortcuts.ts`, `render/shortcutViews.ts`, `data/shortcutLooks.ts`, `data/shortcutSounds.ts` |
| `drop` | A doorway on a ledge 1.2–2.4 m over the lower room, `to`. The ledge's face is a wall from the lower floor up to the doorway's sill. | Down only. | `world/dungeonWalls.ts`, `systems/drops.ts` |
| `window` | A barred opening (a grate) between two rooms, 1.1 m to 2.7 m high, whose floors may stand up to 3.2 m apart. | Nobody: it is for seeing through. | `world/dungeonWalls.ts`, `render/grateShape.ts` |
| `lurk` | Foes on a room (`lurk: ['ghoul']`). They are laid hidden, cannot be targeted or locked on, and spring at an investigator within `AMBUSH.reach` (4.2 m) whom they can see, or who brushes within 2.2 m of them. | — | `systems/ambush.ts`, `render/lurkFx.ts`, `world/roomFurnish.ts` |

More on shortcuts and drops:

- **Persistence.** An opened shortcut is kept in the save as `cut:<dungeon>:<from>><to>` in `ow.told`, so the save format does not change. A new journey (NG+) bars every door again: `cycles.ts` carries hints and finds, nothing else.
- **The seal.** While a door is barred, its collider fills the doorway. It is taken out of the world `SHORTCUT.solidFor` frames after the bar is lifted, once the leaves have swung well aside.
- **The door's look.** It follows the kit of the `from` room:
  - plank kits: a beam across the door;
  - grille kits: a bolt;
  - slab and membrane kits: a lever;
  - curtain kits: a bronze grille;
  - kits with no door: an iron gate.
- **Falling.** Inside a dungeon, a body whose ground falls away by more than `DROP.snap` (0.6 m) in a step keeps its height and falls to the new ground with gravity `DROP.gravity` (22). It lands with `Dropped` (heard and felt from 1.6 m). A teleport or a rising sets the body down where it is put; it never falls.
- **The ledge.** It is drawn in the lower room's half of the wall, so its top lies beside the upper floor, not inside it. Its collider fills the whole wall's thickness: a body that steps past the wall's middle is pushed out on the lower side, and falls.
- **Peace.** A foe lying in wait never springs at an investigator who is out of reach: at peace on arriving, in a talk, in a cutscene, or in a fog. A rest lays it in wait again.

The numbers live in `src/data/levelTuning.ts` (`LINK`, `SHORTCUT`, `AMBUSH`, `DROP`).

## The rules the layout enforces

`layLinks` (`world/dungeonLinks.ts`) refuses a link with an error that `validateWorld` reports, in any of these cases:

- **The rooms must meet side by side.** The two rooms have to share a side, centred on both. Every doorway of the kit sits at the middle of a side: a corridor's lanes, a hall's plan, its pillars and its set all keep to it. A wide hall therefore meets another room only in the middle of a side.
- **Stairs and bridges are joined only at their far end.** Their other sides are the drop into the void or the ramp's walls.
- **No link touches a boss's room.** A boss's hall keeps its one doorway and the fog that stands in it.
- **One way per side.** A side that already has a doorway or a window takes no other.
- **Levels must fit the kind:**

  | Kind | Floors where the two rooms meet |
  |---|---|
  | `open`, `shortcut` | Level with each other. |
  | `drop` | `from` stands 1.2–2.4 m above `to`. |
  | `window` | At most 3.2 m apart. |

- **No lurkers in a room with an Elder Sign** (`world/dungeonKit.ts`).

What a link changes elsewhere:

- A window and a link's doorway are kept clear exactly as a tree's doorway is. This covers:
  - the hall sets (`world/hallSet.ts`);
  - the room plans and inlays (`world/roomStyle.ts`);
  - the dressing (`render/dungeonDressing.ts`) and the wall frames (`render/roomWalls.ts`);
  - the corridor lanes (`world/dungeonParts.ts`).
- A room that a link passes through is no dead end, so the Echo caches move (`world/caches.ts`).
- The boss fog and door plan skips shortcuts and drops (`world/gatePlan.ts`): they have their own doors.

## The audits

- **`tests/levelDesign.test.ts`** reads every dungeon as a graph. Tree doorways and open links go both ways; a shortcut goes both ways once opened and not at all before; a drop goes one way, down. It checks that:
  - every dungeon lays out with no fault;
  - every dungeon but the Stairs of Slumber and the Ultimate Void has a shortcut or a drop, and every one with an Elder Sign has a shortcut;
  - every shortcut's far side can be reached from the door with every shortcut shut and no insight, and lies further in than its near side;
  - opening a shortcut brings its far side **two rooms or more** nearer the Elder Sign or the door;
  - no drop leaves anyone where they cannot walk out, and every ledge can be reached without insight;
  - something lies in wait in every dungeon but the Stairs of Slumber, never more than two in a room, never in a sign's room;
  - no window or link opens on a boss's room;
  - every dungeon still has an Echo cache;
  - the story still holds, where the people describe a place:
    - the Witch House's sign on the stair landing, the closet off it to the west (behind the veil), the garret above it (Peaslee);
    - Tsath's temple stair, the span and N'kai beyond, in that order (Zamacona);
    - the Mi-Go cities east of the landing (Akeley);
    - the Ultimate Void's span north of the First Gate (the quest);
    - Pnakotus's reading hall before Peaslee's account (Peaslee).
- **`tests/levelRuntime.test.ts`** plays the vocabulary in a world game:
  - a shortcut rattles from its near side, opens from its far side, and lets a body through only once its seal is off;
  - an opened shortcut is kept through a save and barred again on NG+;
  - a lurker is laid hidden and untouchable, stays hidden beyond its reach, never springs at peace, and springs at a brush;
  - a drop is fallen over several frames, is heard, and cannot be climbed.
- **`tests/dungeonLinks.test.ts`** covers the layout of each kind on a small test house:
  - which links are refused;
  - the boss's doorway;
  - the window's grate;
  - the drop's ledge;
  - the shortcut's seal.

To see a dungeon's plan, print it with `node tools/dungeon_map.mjs [--cells] [id ...]`.

Each room shows three lines:

1. its id;
2. its kind and floor height: `c` corridor, `h` hall, `s` stair (from height > to height), `p` pit, `b` bridge, `w` well;
3. its foes.

After the floor height, a room may carry these marks:

| Mark | Meaning |
|---|---|
| `*` | An Elder Sign. |
| `!` | A boss. |
| `@` | A realm's gate. |
| `?` | The room is behind the veil (needs insight). |
| `~` | Something lies in wait there. |

Its walls carry these marks:

| Mark | Meaning |
|---|---|
| `IN` | The way in. |
| `??` | A doorway behind the veil. |
| `S` + arrow | A shortcut; the arrow points away from its bar. |
| `D` + arrow | A drop; the arrow points down. |
| `##` | A window. |

On an east or west wall only the first letter of a mark fits.

## The 28 dungeons

Read "door → boss 7 → 3" as: from the door, the boss's room is 7 rooms away with the shortcut barred and 3 once it is open. Every number is measured by `tests/levelDesign.test.ts`'s graph.

**The lairs** have no Elder Sign. The long way goes round, and the straight way, the stair or the hall, is the one barred from beyond.

| Dungeon | The second way | What it saves |
|---|---|---|
| Muñoz's Rooms | shortcut, stairs → hall | door → boss 7 → 3 |
| Cellars of the Castle | shortcut, down → gate | door → boss 7 → 3 |
| The Crypt Below the Castle | shortcut, climb → bones | door → boss 8 → 4 |
| The Old Churchyard | shortcut, grave → lychgate | door → boss 7 → 3 |
| The Deserted House | drop, landing → stair hall (2.4 m) | the way back down |
| The Tomb in the Swamp | shortcut, steps → slab | door → boss 7 → 3 |
| The Shunned House | drop, gable → parlour (2.4 m) | the way back down |
| The Vaults under Red Hook | shortcut, trapdoor → dance hall | door → boss 9 → 3 |
| The Old Captain's House | shortcut, front hall → gate | door → boss 6 → 2 |
| The Whateley Farmhouse | shortcut, loft → kitchen | door → boss 8 → 4 |
| The Waite House | shortcut, stairs → parlour | door → boss 8 → 4 |
| The Sculptor's Tower | shortcut, turret → foot | door → boss 7 → 3 |
| The Rue d'Auseil | shortcut, first flight → street | door → boss 8 → 4 |

**The legacy dungeons** have an Elder Sign. The shortcut folds the far side back to the sign or the door.

| Dungeon | The second way | What it saves |
|---|---|---|
| University Library | shortcut, lift → circulation; the Elder Sign is deep, in the archive | door → archive 8 → 4, both ways |
| The Witch House | shortcut, front stair → parlour; drop, pantry → sump; lurkers in the kitchen and the sump | the parlour, kitchen and pantry each 2 rooms nearer the sign; with the drop, the whole house is one circuit |
| Sentinel Hill | shortcut, the sheer stair → the terrace at the foot | sign → boss 7 → 3 |
| Y'ha-nthlei | shortcut, the sluice → the drowned hall | sign → boss 8 → 4 |
| Curwen's Catacombs | shortcut, passage → crypt; the hidden ossuary leads to Curwen's study | sign → laboratory (the second horror) 7 → 3 |
| Starry Wisdom Church | shortcut, tower → aisle; window, balcony over the aisle | sign → boss 10 → 4 |
| Akeley Farmhouse | shortcut, the Mi-Go lift → the barn | sign → the cylinders 7 → 3 |
| Elder Thing City | shortcut, ramp → plaza | sign → boss 10 → 4 |
| Archives of the Great Race | shortcut, the return stair → the reading hall | sign → boss 8 → 4 |
| Tsath | shortcut, the temple hall → the avenue; window, cloister over the Yoth pit | sign → boss 10 → 4 |
| Ulthar to Kadath | shortcut, the road → Ulthar | sign → boss 7 → 3 |
| Risen R'lyeh | shortcut, passage → vestibule | sign → boss 7 → 3 |
| Mi-Go Cities | shortcut, passage → the fungus garden | sign → boss 9 → 3 |

Two dungeons keep their one way, by design:

- **The Stairs of Slumber.** The tale counts its seventy steps and its seven hundred. It has no shortcut and nothing lying in wait.
- **The Ultimate Void.** 'Umr at-Tawil's hall lies across the span north of the First Gate, in the quest's own words. It has no shortcut, but one thing lies in wait.
