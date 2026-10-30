# Font credits

> Seventy Steps itself is © 2026 Alessandro A. Foddis (DigitalDro), all rights reserved (see `LICENSE`). This file credits the work of others:
> the licences named here (CC0, CC BY, OFL, Apache and the like) apply to that work only, never to the game.

The interface's typefaces (round 74), set in `src/ui/hudKit.ts` and loaded by `src/ui/fonts.ts`. Their licences allow the fonts to be
embedded in a game and sold with it; the licence texts are beside the files. The files here are the fonts with their outlines and
features left as released, **cut down** to the Latin letters, punctuation and symbols the game prints (Basic Latin, Latin-1, Latin
Extended-A, œ, general punctuation, €, ™, the arrows, −, ≥, ▲, ◇) and packed as WOFF2. That is the change Apache 2.0 asks to be stated
for Special Elite.

- `IMFellEnglish-Regular.woff2`, `IMFellEnglish-Italic.woff2`: **IM Fell English**, a digitisation by Igino Marini of the types of the
  Fell collection, cut in the seventeenth century. Copyright (c) 2010, Igino Marini. Licence: SIL Open Font License 1.1,
  `OFL-IMFellEnglish.txt`. It has one weight, oldstyle figures and no arrows, minus sign, ≥, ▲ or ◇, which the system serif behind it
  in `SERIF` supplies. Source: https://github.com/google/fonts/tree/main/ofl/imfellenglish
- `SpecialElite-Regular.woff2`: **Special Elite**, a worn typewriter face, set in the intro's telegram until round 101 (no card uses it now; the file stays loaded). Copyright (c) 2010 by Brian J.
  Bonislawsky DBA Astigmatic (AOETI). Licence: Apache License 2.0, `LICENSE-SpecialElite.txt`. It has no arrows, ≥, ▲ or ◇. Source:
  https://github.com/google/fonts/tree/main/apache/specialelite

- `EBGaramond-Regular.woff2`, `EBGaramond-Italic.woff2`: **EB Garamond**, by Georg Duffner and Octavio Pardo. Licence: SIL Open Font License 1.1, `OFL-EBGaramond.txt`. The variable originals were instantiated at weight 400, subset to Latin letters and the game's symbols, and packed as WOFF2. Source: https://github.com/google/fonts/tree/main/ofl/ebgaramond
