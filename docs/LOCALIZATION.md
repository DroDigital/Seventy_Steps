# Localization

The game is in English, German, French and Spanish: the interface and, since 1.5.0, the whole story. The language is set in
**Settings › Display › Language** (a button that steps through them) and kept with the settings; a first launch takes the browser's
own (`navigator.languages`), and is English where it is none of these. The voices are English in every language: what is shown is
translated, what is heard is the English recording.

## How it works

Two lookups, both in `core/i18n.ts`:

- **The interface: `t('area.name', { place: value })`.** `data/lang/en.ts` is the source: every line, by key. `de.ts`, `fr.ts` and
  `es.ts` are typed `Record<Key, string>`, so a line added to English **fails their compile** until it is translated. Some areas keep
  their lines in tables of their own, spread into each language's: `data/lang/pages/` (the journal, the lead, the bestiary's words,
  the ending card), `data/lang/screens/` (the Elder Sign's menu, the levels and the mind's upgrades, reinforcement moved, the relics,
  the arms page, the find card, the shop, the prompts of a fight, the omens of the night, the mounts' names) and `data/lang/map/` (the
  map's key, its row of keys and its marks' cards). `tests/i18n.test.ts` keeps their `{places}` the same as the English, none empty,
  none left over from a line that is gone, lines in capitals in capitals, and every hint's `{button}` a button that exists.
- **The story: `story(text)`.** A line of the story is looked up by its English words in `data/lang/story/<lang>/`, and is the English
  where a language has none. The data files keep their English, so a voice's recording, which is named by its words
  (`data/speech.ts`), is still found by them: the English goes to the ear and `story()` to the eye. Each language's tables are kept
  by **domain**, and in each domain by the **id of the source entry** they translate (a person's id, a creature's roster id, a
  document's name, a realm's id), so the demo build can cut them by the same ids it cuts the sources by (`tools/demo/rules/story.ts`).
  The domains are listed in `STORY_DOMAINS` (`data/lang/story/index.ts`) and read from the English by `tests/storyText.ts`:

  | domain | what is shown |
  | --- | --- |
  | `intro` | the opening's cards |
  | `people`, `rumors`, `overheard`, `fates` | what each person says, the rumour of a horror's fall, what they mutter, what became of them |
  | `quests` | each quest's title, its stages and its line once done |
  | `documents` | every tome, note and letter |
  | `places` | the realms, their named places, Elder Signs, gates and dungeons |
  | `creatures` | names (and variants'), the tale each is from, field notes, epithets, epitaphs |
  | `pois` | the secrets of the land: names and their lines |
  | `deaths`, `blows` | what is read under UNMADE: how every blow is met (the library's and each horror's own), a fall's, the sea's, the stone's, each realm's fragments |
  | `lore` | the lines under the veil: Lovecraft's, the dream's lessons, the descent's |
  | `scenes` | the cutscenes' captions and titles, the horrors' spoken lines as shown, each ending's narration, choice, title and lines |
  | `arms`, `wares`, `achievements` | weapons (how each handles, where it is had, its temper), relics, the merchants' wares, the achievements |
  | `rooms`, `ways`, `credits` | the words a dungeon's room says as it is entered, the omens of each horror's court, the credits |

- **Provably complete.** `tests/storyI18n.test.ts` fails if any line the game shows has no translation in a language, if a
  translation's `{places}` differ from its English, if a translation is left over after its English changed or went (so an edited
  English line is found at once), if one English line is given two translations anywhere across the domains, or if a language's lines
  are mostly the English. `tests/demo/story.test.ts` holds the demo build to the same for what the demo shows.

## Choices made

- **Forms of address.** German says *Ihr/euch* to the player throughout (the interface, the journal, the bestiary, the endings);
  the people say *Sie*, Zadok and Curtis *Ihr*, the priests and the horrors *du*. French says *vous*; the priests and the horrors *tu*.
  Spanish says *tú*; the people *usted*, the priests and the horrors *tú*.
- **Fixed names** (kept the same everywhere; the clash test holds them): the Elder Sign is *Ältestes Zeichen*, *Signe des Anciens*,
  *Signo Arcano*; Echoes *Echos*, *Échos*, *Ecos*; Insight *Einsicht*, *discernement*, *discernimiento*; the Ancient Ones *die
  Uralten*, *les Très-Anciens*, *los Ancestrales*; the Old Ones *die Großen Alten*, *les Grands Anciens*, *los Primigenios*; the
  Crawling Chaos *das Kriechende Chaos*, *le Chaos rampant*, *el Caos Reptante*. Lovecraft's tales go by their published titles
  (*Cthulhus Ruf*, *L'Appel de Cthulhu*, *La llamada de Cthulhu*). Untranslatable chants (*Ph'nglui mglw'nafh…*, *Tekeli-li*) stay.
- **Left out.** The courts' discoveries (`discover_*` quests, the vigil's omens in `systems/vigilCall.ts`) were switched off in round 69
  and are not shown, so they are not translated. The developer pages (`?bestiary`, `?mounts`, `?bench`, the debug panel and console)
  stay English. The pad's buttons keep the names printed on them (View, Menu, Options, Create).
- **Not yet read by a native speaker.** Every translation was written for 1.5.0 without one; each language wants a reader before
  release, and a line changed is changed in its table (`data/lang/story/<lang>/<domain>.ts` or the key's table).

## Fonts

The serif stack (`hudKit.SERIF`) leads with IM Fell English (round 74, `public/fonts`), which covers English, German, French and
Spanish (Basic Latin, Latin-1, Latin Extended-A, œ). It has no Cyrillic, Greek, arrows, minus sign, ≥, ▲ or ◇: those, and Chinese,
Japanese and Korean, fall back to the system serifs behind it. A language that needs more than Latin would need its own face added to
`ui/fonts` and the stack.

## Adding a language

1. `src/data/lang/xx.ts` and its `pages/`, `screens/` and `map/` tables: copy the Spanish ones and translate every value (keep
   `{places}` and the capitals).
2. `src/data/lang/story/xx/`: a table for each domain (copy the Spanish ones), registered in `index.ts` there and in `STORY` in
   `data/lang/story/index.ts`.
3. Add it to `LANGS` in `data/lang/index.ts`. `npm run check` says what is missing.
4. Look at the settings page, the HUD and the Elder Sign's menu in it: longer words (German) wrap in the menus and the HUD's lines.

## Moving a line over

- An interface line: replace the literal with `t('area.name')` (a new key in the English table; the compiler then asks for it in the
  others). Uppercase lines are kept uppercase in the table, not by `.toUpperCase()` (some letters change case oddly across languages).
- A line of the story: show it through `story(text)` where it is drawn, and have `tests/storyText.ts` list it under its domain; the
  test then names it as untranslated in every language until its table holds it.
