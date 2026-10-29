/** A small live comparison control, only on ?studies. No saved settings or new game state. */
import { SURFACE_STUDIES, surfaceStudyIndex } from '../render/surfaceStudy';

export function installSurfaceStudies(select: (mode: number) => void): void {
  const query = new URLSearchParams(location.search);
  select(surfaceStudyIndex(query.get('study')));
  if (!query.has('studies')) return;
  document.getElementById('surface-studies')?.remove();
  const panel = document.createElement('aside');
  panel.id = 'surface-studies';
  panel.setAttribute('aria-label', 'Surface rendering comparison');
  panel.style.cssText = 'position:fixed;left:20px;bottom:20px;z-index:10000;color:#eee7da;background:#101416ed;border:1px solid #596066;border-radius:10px;padding:14px 16px;font:13px/1.5 system-ui;max-width:calc(100vw - 72px);box-shadow:0 8px 32px #0005;pointer-events:auto';
  const heading = document.createElement('div');
  heading.textContent = 'SURFACE STUDIES';
  heading.style.cssText = 'font-size:10px;letter-spacing:2px;color:#9ca8aa;margin-bottom:9px';
  const choices = document.createElement('div');
  choices.style.cssText = 'display:flex;gap:6px;flex-wrap:wrap';
  const detail = document.createElement('div');
  detail.style.cssText = 'margin-top:9px;color:#bec5c3';
  const buttons: HTMLButtonElement[] = [];
  const choose = (index: number): void => {
    select(index);
    for (const [i, button] of buttons.entries()) {
      button.setAttribute('aria-pressed', String(i === index));
      button.style.background = i === index ? '#d6d4ba' : '#242c30';
      button.style.color = i === index ? '#101416' : '#eee7da';
    }
    detail.textContent = SURFACE_STUDIES[index].detail;
    const url = new URL(location.href);
    url.searchParams.set('study', SURFACE_STUDIES[index].id);
    history.replaceState(null, '', url);
  };
  SURFACE_STUDIES.forEach((study, index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = study.name;
    button.style.cssText = 'border:1px solid #596066;border-radius:5px;padding:7px 11px;font:inherit;cursor:pointer';
    button.addEventListener('click', () => choose(index));
    buttons.push(button);
    choices.append(button);
  });
  panel.addEventListener('pointerdown', (event) => event.stopPropagation());
  panel.addEventListener('click', (event) => event.stopPropagation());
  panel.append(heading, choices, detail);
  document.body.append(panel);
  choose(surfaceStudyIndex(query.get('study')));
}
