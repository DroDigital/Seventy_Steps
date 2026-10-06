# Localization

The interface is in English, German, French and Spanish. The language is set in **Settings › Display › Language** (a button
that steps through them) and kept with the settings; a first launch takes the browser's own (`navigator.languages`), and is
English where it is none of these.

## How it works

- `core/i18n.ts`: `t('area.name', { place: value })` reads a line in the language chosen, and the English one where a language
  lacks it. `setLocale`, `detectLocale`.
- `data/lang/en.ts` is the source: every line, by key. `de.ts`, `fr.ts` and `es.ts` are typed `Record<Key, string>`, so a line added
  to English **fails their compile** until it is translated. `tests/i18n.test.ts` keeps their `{places}` the same as the English, none
  empty, none left over from a line that is gone, lines in capitals in capitals, and every hint's `{button}` a button that exists.
- The Language setting holds a place in `LANGS` (`data/lang/index.ts`), so a new language goes at the end of that list.

## What is translated

The menus (title, difficulty, slots, pause, settings, controls, rise), the hints, the HUD's labels and notices, the mind's bands, the
crash screen, and the buttons' names.

## What is not (yet), and stays English in every language

- **The story:** people's dialogue (`data/npcs*.ts`), quests, documents and notes, the opening's cards, the bestiary, lore lines, what
  is overheard, death lines, epitaphs, epilogues, credits, place and region names. About 100 KB of text (`wc -c src/data/{npcs,npcsFar,
  quests,documents,intro,bestiaryNotes,bestiaryFacts,loreLines,overheard,epilogues,credits,deathLines,placeNames}.ts`).
- **Other interface:** the Elder Sign menu (Grow, Arms, Travel), the map's words, the journal and arms pages, the ending card, the shop,
  the dialogue's chrome, achievements, weapon and ware names.
- **The voices:** every spoken line is an English recording (`public/voice`). Subtitles in another language would need the lines
  keyed (they are named by their words) and the recordings kept; a localized cast is a separate production.
- **Fonts:** the serif stack (`hudKit.SERIF`) covers Latin scripts. Cyrillic is in the system serifs; Chinese, Japanese and Korean fall
  back to a system face and have not been looked at.

## Adding a language

1. `src/data/lang/xx.ts`: copy `es.ts`, translate every value (keep `{places}` and the capitals).
2. Add it to `LANGS` in `data/lang/index.ts`. `npm run check` says what is missing.
3. Look at the settings page and the HUD in it: longer words (German) wrap in the menus and the HUD's lines.

## Moving a line over

Replace the literal with `t('area.name')` (a new key in `en.ts`; the compiler then asks for it in the others). A dynamic key is
`t(`set.${id}` as Key)`. Uppercase lines are kept uppercase in the table, not by `.toUpperCase()` (some letters change case oddly across
languages).
