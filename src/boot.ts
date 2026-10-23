/** Keep startup failures visible even when the game module cannot load or initialize. */
import { installCrashLog } from './ui/crashLog';
import { showCrash } from './ui/crashScreen';

installCrashLog();
void import('./main').then(
  () => document.getElementById('startup')?.remove(),
  (error: unknown) => {
    console.error(error);
    document.getElementById('startup')?.remove();
    showCrash('error', error instanceof Error ? error.message : String(error));
  },
);
