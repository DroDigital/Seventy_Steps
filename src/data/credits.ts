/**
 * The credits (playtest round 12: there were none, nor any third-party notices), shown after an
 * ending and from the title and pause menus (ui/credits.ts). The recorded sounds are credited in
 * full, file by file, in public/audio/CREDITS.md; here, by the recordists. The voices of the people and
 * the horrors are synthetic, and said to be (public/voice/CREDITS.md), in a quiet block of tools at the foot. Data only.
 */

export interface CreditBlock {
  heading: string;
  lines: readonly string[];
  quiet?: boolean; // set small and dim, below the names (the tools and technologies)
  title?: boolean; // the first line is set large, as a name on a title card is (the studio's)
}

export const CREDITS: readonly CreditBlock[] = [
  { heading: 'A GAME BY', lines: ['Digital Dro Studios'], title: true },
  { heading: 'DESIGNED, WRITTEN AND DIRECTED BY', lines: ['Alessandro A. Foddis', '© 2026 Digital Dro Studios · All rights reserved'] },
  { heading: 'AFTER THE STORIES OF', lines: ['H. P. Lovecraft', 'and the tales he revised and wrote with Zealia Bishop, Hazel Heald, Sonia Greene, Harry Houdini, E. Hoffmann Price, Kenneth Sterling, and the authors of "The Challenge from Beyond"'] },
  { heading: 'RECORDED SOUNDS', lines: ['from Freesound, dedicated to the public domain (CC0 1.0), cut and treated for the game:', 'Craig Smith (craigsmith)', 'Breviceps', 'EvaMusik', 'fonografico', 'corkob', 'Lsoundaccount', 'TheKingOfGeeks360', 'waterboy920'] },
  {
    heading: 'MODELS, FLAMES AND SURFACES',
    lines: [
      'free models and animations, reduced, coloured and set for the game:',
      'licensed CC BY 4.0: FlukierJupiter · andrewriddle · KRei · Mad_Lobster_Workshop · Jochon · rkuhlf · INGSOC1984 · carismah',
      'Heliona · Özlem Çandır · KIFIR · vertexgrocer · davdadams',
      'Samuel Francis Johnson (Oneironauticus) · TheoClarke · Goblinatron (PSX Dungeon) · BlenderVoyage · bobjh · Marin PETTE · 3D Vault',
      'Bruno Macchioni · Bl4ckGh0st · mynameismary · Animex · zacharykozak',
      'dedicated to the public domain (CC0 1.0): Kenney · Quaternius · Kay Lousberg · chilly_durango · Elegant Crow · SigilsVault · RotoPoly',
      'Kyle Fuji · Poly Haven · MilkAndBanana · rubberduck · Fertile Soil Productions · pistachio · Paul Wortmann · Goth Scarecrow · ZomBCool',
    ],
  },
  { heading: 'TITLE THEME', lines: ['"Subterranean Pulse"'] },
  { heading: '', lines: ['Thank you for dreaming.'] },
  {
    heading: 'TOOLS',
    quiet: true,
    lines: [
      'the voices of the people and the horrors are synthesised voices, made with ElevenLabs (Eleven v4)',
      'the fifteen tracks of the realms and the forty-eight boss themes were made with Suno',
      'the code was written with the help of Claude Code, from Anthropic',
      'the textures and effects are made in code; the models are free ones, baked for the game and credited above',
    ],
  },
  {
    heading: 'SOFTWARE',
    quiet: true,
    lines: ['three.js · MIT License · © 2010–2026 three.js authors', 'Electron · MIT License · © Electron contributors, with Chromium under its own licences', 'IM Fell English · © Igino Marini · SIL Open Font License 1.1', 'Special Elite · © 2010 Brian J. Bonislawsky DBA Astigmatic · Apache License 2.0', 'built with TypeScript and Vite'],
  },
];
