# The world editor (round 110)

A tool for changing the open world by hand, in the game, and sending the changes to be made into a
pull request. It is in development builds only (`npm run dev`); a release build (`npm run build`,
the desktop shell, Steam, itch.io) has none of it, only the committed edits it lays.

## Using it

1. `npm run dev`, open the game, continue or start a journey, then press **F8** in the open world
   (or open `http://localhost:5173/?edit`, which goes straight to the world with the editor open).
2. The world stands still and a panel opens at the right. Fly with the **right mouse button held**:
   the mouse looks, **W A S D** move, **Q E** sink and rise, **Shift** is faster, the **wheel** sets
   the pace.
3. **Click** a thing to take hold of it. Props (trees, rocks, houses, walls, lamps, set pieces,
   an arena's dressing and walls, the hearts, braziers and sets a dungeon's rooms lay) are boxed in yellow; foes' posts are red
   boxes, sites (Elder Signs, gates, tomes and notes, arenas, dungeon doors, allies) blue ones.
4. With a thing held:
   - **G** moves it over the ground (**X** or **Z** keeps it to one axis), **R** turns it,
     **S** sizes it, **H** raises or lowers it. **Ctrl** snaps (half metres, 15°, tenths).
     **Click** or **Enter** keeps the move; **Esc** or a right click drops it.
   - **Del** (or **X**) removes it, **Ctrl+D** copies it, **F** frames it.
   - The panel's fields set its place, turn, size, house style, a set piece's scale, tint, flame
     (any piece can be given a lamp, fire, torch, window or sigil light) and whether it is walked
     over, a new seed (another look of the same kind), a foe post's creature, a site's facing.
   - **Ctrl+Z** undoes, **Ctrl+Y** (or Ctrl+Shift+Z) redoes.
5. **Add** puts a new prop, set piece, light (street lamp, fire pit, torch, brazier, lantern post)
   or foe's post at the middle of the view, facing the camera.
6. Every change is kept in this browser and shown at once: props, lights and dressing are built
   again where they stand. A moved site, and the foes already risen, follow on **Reload world**.
   You can leave the editor (F8) and play over the edits before sending them.
7. **Send**: write a note if you like, then **Download file** (or **Copy as text**) and post the
   file (or the text) in the project chat, asking for a PR. **Open file…** takes a file back in to
   go on with it; **Discard all** goes back to what the game's files hold (undoable).

## The file

```json
{
  "format": "seventy-steps-world-edits",
  "version": 1,
  "made": "2026-11-07T10:30:00.000Z",
  "note": "Clear the road into Arkham and light it",
  "base": ["…keys of the committed edits it was made over…"],
  "edits": [
    { "prop": { "group": "region:arkham", "kind": "rock", "at": [612.43, 1210.08] }, "remove": true },
    { "prop": { "group": "arena:colour_out_of_space", "kind": "set", "piece": "ss_brazier", "at": [140.2, 151.9] }, "set": { "x": 142.0, "yaw": 1.57, "look": { "lit": "fire" } } },
    { "add": "k3j9qa", "region": "arkham", "prop": { "kind": "lamp", "x": 600, "y": 12.4, "z": 1200, "w": 0.12, "d": 0, "h": 3.4, "yaw": 0, "seed": 123 } },
    { "spawn": "p:arkham:12", "set": { "x": 640, "z": 1188, "entity": "ghoul" } },
    { "add": "q8w2ee", "foe": { "entity": "deep_one", "region": "arkham", "x": 655, "z": 1190, "yaw": 3.14 } },
    { "site": { "site": "sign", "region": "arkham", "id": "arkham_heath" }, "set": { "at": [244, 190], "face": "n" } }
  ]
}
```

Each edit names what it changes by where it came from, so it maps back onto the source:

| Edit | Names | Source |
| --- | --- | --- |
| a prop changed or removed | `group` (`region:<id>`, `arena:<first boss>`, `dungeon:<id>`), `kind`, set `piece`, and `at`, the spot its planner laid it on, to the centimetre | the planner (`world/regionPlan.ts`, `arenaPlace.ts`, `placements.ts`'s dungeons) |
| a prop added | an id, its region and the whole prop | laid with the region's own props |
| a foe's post changed or removed | its spawn id (`p:<region>:<n>`, `poi:…`, `room:…`, `boss:…`) | `planSpawns.ts`, `poiPlan.ts`, `roomFurnish.ts`, `arenaPlace.ts` |
| a foe's post added | an id; its spawn id is `edit:<id>` | |
| a site moved or turned | kind, region, id (a tome by its name, an arena by its first boss) and `at` in the region's own metres | `data/sites.ts` (and `data/documents.ts`'s notes) exactly as written there |

A prop's change holds only what was changed. A move that gives no `y` keeps the prop as high over
the ground as it stood. The export holds the whole working set (the committed edits and the new),
and `base` names the committed edits it was made over.

## Making it a PR (for the thread that takes it)

1. Save the posted file (or text) as e.g. `/tmp/world-edits.json`.
2. `node tools/world_edits.mjs describe /tmp/world-edits.json` lists the edits in words (for the PR).
3. `node tools/world_edits.mjs apply /tmp/world-edits.json` writes `src/data/worldEdits.ts` (the
   export's set, with any edit committed since the export kept). Node 22.18 or later.
4. `npm run check`: `tests/worldEdits.test.ts` keeps every committed edit finding what it names. An
   edit whose target a later change of the planners moved fails it: drop it, or ask for it again.
5. When a site was moved, its edit may instead be folded into `data/sites.ts` (its `at` is already in
   that file's metres) and taken out of the edits; the prop edits stay as data, since the props are
   laid by code from the world's seed.

## How it works

- `src/world/edits/`: the format (`editTypes`), its keys, merge, check and the data file's text
  (`editFile`, run by the tool in Node as it is), the edits in force (`editStore`), and where they
  are laid (`editApply`): a region plan's props and foes' posts as they are bucketed by chunk, an
  arena's and a dungeon's dressing before their colliders, the sites as `placements.ts` stands them.
  A prop an edit made keeps a note of what it was laid as (`originOf`), so it is named the same
  however far it is moved. `editRefresh.putInForce` lays a new set over what is already built.
- `src/editor/` (development builds only, loaded by a dynamic import behind `import.meta.env.DEV`):
  `worldEditor` (the glue), `editorInput` (keys and mouse, heard before the game's and kept from
  it), `editorCamera`, `editorItems` (what can be held, its box, a ray's pick), `editorModes`
  (move, turn, size, raise), `editorOverlay` (the boxes, drawn over the finished picture),
  `editorPanel` + `editorFields` + `editorKinds`, `editorSession` (undo, redo, the export),
  `editorSpots` (what to build again), `editorIO`, `editorBoot` (the working set in localStorage).
- `render/worldScene.ts` `rebuild(keys)`: the chunks and sites a change touched built again at once.

Not covered: the terrain, roads and the land's shape, dungeon walls and rooms, the boss places'
ground and water (`world/places/`), and the creatures themselves (`data/entities`).
