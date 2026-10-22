# Triangles and draws at the open arenas: main (before the houses) against PR 152

Measured 22 Oct 2026 in a software-rendered Chromium (so no frame timing, only counts), through `window.pipeline.renderer.info.render` read at eight headings at each spot after 25 s of settling, taking the largest. The counts include every pass (the moon's and lantern's shadows, the sea's reflection), so they are about 2x what the main picture alone draws. Each spot was measured once, and the same eight benchmark places differ by up to 270k between two runs on main (the town's lamps read 564k on one and 294k on another), so read differences under about 250k as noise.

Spots: the *heart* of each open arena, and the *court* 22 m outside its gate (on main, where an arena has no gate, 22 m beyond a notional wall at the arena's radius + 18 m, southward). Script: `tools/` has none for this; it was a Playwright page script that teleported with `teleport` from `systems/checkpoints.ts` and read the renderer's info (about 60 lines; see HANDOFF.md).

Result: across the nineteen arenas the houses add 52k triangles on average at the heart and nothing measurable at the court (−24k, noise). The largest single reading is 667k (Black Man's heart) against 639k on main's heaviest arena, and the existing benchmark places reach 553k (the sea). The 802k the PR description quoted was not reproduced. Draw calls stay at 100 to 280.

| spot | main draws | main k tris | PR 152 draws | PR 152 k tris | change k tris |
|---|---|---|---|---|---|
| colour_out_of_space:heart | 108 | 261 | 129 | 357 | +96 |
| colour_out_of_space:court | 133 | 380 | 140 | 469 | +89 |
| black_man:heart | 235 | 633 | 249 | 667 | +34 |
| black_man:court | 154 | 397 | 161 | 590 | +193 |
| shub_niggurath:heart | 122 | 279 | 122 | 355 | +76 |
| shub_niggurath:court | 187 | 476 | 234 | 572 | +96 |
| medusa_gorgon:heart | 107 | 273 | 109 | 277 | +4 |
| medusa_gorgon:court | 114 | 372 | 143 | 378 | +6 |
| martins_beach_horror:heart | 225 | 343 | 227 | 378 | +35 |
| martins_beach_horror:court | 219 | 525 | 224 | 501 | -24 |
| simon_orne:heart | 183 | 370 | 156 | 235 | -135 |
| simon_orne:court | 134 | 338 | 174 | 327 | -11 |
| edward_hutchinson:heart | 241 | 639 | 230 | 609 | -30 |
| edward_hutchinson:court | 155 | 415 | 188 | 528 | +113 |
| colossus_pyramids:heart | 171 | 313 | 138 | 355 | +42 |
| colossus_pyramids:court | 227 | 578 | 230 | 580 | +2 |
| yig:heart | 183 | 241 | 161 | 340 | +99 |
| yig:court | 226 | 577 | 184 | 463 | -114 |
| nug:heart | 168 | 300 | 124 | 355 | +55 |
| nug:court | 223 | 577 | 99 | 317 | -260 |
| bokrug:heart | 128 | 237 | 116 | 256 | +19 |
| bokrug:court | 225 | 578 | 229 | 579 | +1 |
| other_gods:heart | 113 | 268 | 105 | 259 | -9 |
| other_gods:court | 226 | 577 | 127 | 376 | -201 |
| cthulhu:heart | 108 | 176 | 100 | 226 | +50 |
| cthulhu:court | 228 | 577 | 113 | 309 | -268 |
| hastur:heart | 108 | 156 | 161 | 221 | +65 |
| hastur:court | 185 | 364 | 162 | 284 | -80 |
| yog_sothoth:heart | 83 | 112 | 95 | 139 | +27 |
| yog_sothoth:court | 122 | 370 | 106 | 251 | -119 |
| azathoth:heart | 81 | 155 | 101 | 243 | +88 |
| azathoth:court | 114 | 282 | 136 | 247 | -35 |
| zkauba:heart | 165 | 294 | 277 | 647 | +353 |
| zkauba:court | 142 | 429 | 230 | 610 | +181 |
| daemon_pipers:heart | 147 | 280 | 194 | 370 | +90 |
| daemon_pipers:court | 134 | 361 | 134 | 309 | -52 |
| ancient_ones:heart | 151 | 395 | 221 | 426 | +31 |
| ancient_ones:court | 222 | 564 | 269 | 585 | +21 |
| bench:town and lamps | 224 | 564 | 186 | 294 | -270 |
| bench:moor and weather | 124 | 303 | 140 | 276 | -27 |
| bench:sea and reflection | 283 | 505 | 301 | 553 | +48 |
| bench:ice city, dungeon | 149 | 236 | 149 | 247 | +11 |
| bench:vaults, torches | 162 | 398 | 157 | 385 | -13 |
| bench:the sunken city, a colossus | 105 | 178 | 118 | 195 | +17 |
| bench:fungus cities | 147 | 239 | 141 | 227 | -12 |
| bench:the court beyond | 113 | 154 | 140 | 162 | +8 |
