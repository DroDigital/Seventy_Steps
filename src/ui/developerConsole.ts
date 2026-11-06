/** A browsable command console for demonstrations. The list is usable entirely with a pad. */
import { PAD_BUTTON } from '../core/padMap';
import { activePad } from '../core/pads';
import { button, createScreen, el, menuOpen, title, type Page } from './menuKit';

export interface DeveloperCommand {
  /** A complete, executable command, including any arguments. */
  command: string;
  description: string;
}

export interface DeveloperConsoleOptions {
  commands: readonly DeveloperCommand[];
  execute(line: string): string;
  /** Opening can be suspended while a transition or cutscene is in progress. */
  available?: () => boolean;
  onOpen?: () => void;
}

export interface DeveloperConsole {
  readonly open: boolean;
}

export function createDeveloperConsole(options: DeveloperConsoleOptions): DeveloperConsole {
  const screen = createScreen(180, '#050506dd');
  let line = '';
  let result = 'Choose a command or type one below.';
  let input: HTMLInputElement | null = null;
  let output: HTMLElement | null = null;
  let rows: { element: HTMLButtonElement; command: DeveloperCommand }[] = [];

  const filter = (): void => {
    const query = line.trim().toLowerCase();
    for (const row of rows) row.element.hidden = !!query && !`${row.command.command} ${row.command.description}`.toLowerCase().includes(query);
  };
  const run = (command: string): void => {
    if (!command.trim()) return;
    try {
      result = options.execute(command.trim());
    } catch (error) {
      result = `Command failed: ${error instanceof Error ? error.message : String(error)}`;
    }
    if (output) output.textContent = result;
    line = '';
    if (input) input.value = '';
    filter();
  };
  const close = (): void => screen.close();
  const page: Page = {
    back: close,
    backKeys: ['Backquote'],
    build(panel) {
      title(panel, 'DEVELOPER CONSOLE');
      el(panel, 'div', 'Type a command or choose one from the list. Backquote or double-tap D-pad Right opens the console.', 'font-size:12px;opacity:.7;margin:0 0 8px');
      input = el(panel, 'input');
      input.type = 'text';
      input.dataset.menuText = '';
      input.setAttribute('aria-label', 'Command');
      input.autocomplete = 'off';
      input.spellcheck = false;
      input.placeholder = 'Command or search…';
      input.value = line;
      input.style.cssText = 'box-sizing:border-box;width:100%;padding:8px;color:#ece9e2;background:#0b0a09;border:1px solid #9078bd77;font:13px monospace';
      // menuKit lets text editing reach this field; do not let the game hear it.
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' && !e.isComposing) {
          e.preventDefault();
          run(input?.value ?? '');
        }
      });
      input.addEventListener('keyup', (e) => e.stopPropagation());
      input.addEventListener('input', () => { line = input?.value ?? ''; filter(); });
      const list = el(panel, 'div');
      list.className = 'scroll';
      output = el(list, 'div', result, 'padding:8px 0;color:#c4b4df;font:12px/1.4 monospace;white-space:pre-wrap');
      output.setAttribute('role', 'status');
      output.setAttribute('aria-live', 'polite');
      rows = options.commands.map((command) => ({
        command,
        element: button(list, command.command, () => run(command.command), true, '', command.description),
      }));
      filter();
      button(panel, 'Close', close);
    },
  };
  const show = (): void => {
    if (screen.open || menuOpen() || options.available?.() === false) return;
    options.onOpen?.();
    screen.show(page);
  };
  addEventListener('keydown', (e) => {
    if (e.code !== 'Backquote' || e.repeat || e.ctrlKey || e.metaKey || e.altKey || screen.open || menuOpen()) return;
    if (options.available?.() === false) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    show();
  }, true);

  // D-pad Right has no gameplay action. Two separate taps cannot trigger a
  // combat action while the shortcut is being entered, unlike a stick chord.
  let wasDown = false;
  let lastTap = -Infinity;
  const pollShortcut = (): void => {
    const pad = activePad();
    const key = pad?.buttons[PAD_BUTTON.right];
    const down = !!key && (key.pressed || key.value > 0.5);
    const available = !menuOpen() && options.available?.() !== false;
    if (!available) lastTap = -Infinity;
    else if (down && !wasDown) {
      const now = performance.now();
      if (now - lastTap <= 500) {
        lastTap = -Infinity;
        show();
      } else lastTap = now;
    }
    wasDown = down;
    requestAnimationFrame(pollShortcut);
  };
  requestAnimationFrame(pollShortcut);
  return { get open() { return screen.open; } };
}
