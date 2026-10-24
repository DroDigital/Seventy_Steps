/** Keep startup failures visible even when the game module cannot load or initialize. */
import { installCrashLog } from './ui/crashLog';
import { showCrash } from './ui/crashScreen';
import { loadFonts } from './ui/fonts';

installCrashLog();
void loadFonts() // never rejects: a font that fails leaves the system serif in its place
  .then(() => import('./main'))
  .then(
    () => document.getElementById('startup')?.remove(),
    (error: unknown) => {
      console.error(error);
      document.getElementById('startup')?.remove();
      showCrash('error', error instanceof Error ? error.message : String(error));
    },
  );
