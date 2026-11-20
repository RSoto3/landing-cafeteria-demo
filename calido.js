// Diseño 2. Shared logic (WhatsApp, hours, map, mobile bar, reveal) lives in shared.js.
import {
  initWhatsApp, initStatus, initWaBar, initMap, initReveal, initDesignSwitch, initStickyNav, initMenu,
} from './shared.js';

initWhatsApp();
initStatus();
initWaBar(['#inicio', '#pedir', '.footer']);
initMap();
initDesignSwitch();
initStickyNav('.nav');

initMenu();

// Photos are the one scroll motion; text is simply there
initReveal('.card__img, .arch, .order__img, .story__img, .mapa');

// Menu tabs: without JS both lists show with their titles
const rest = document.getElementById('rest');
if (rest) {
  const buttons = [...rest.querySelectorAll('.tabs__btn')];
  const panels = [...rest.querySelectorAll('[data-panel]')];
  const select = (tab) => {
    buttons.forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
    panels.forEach((p) => { p.hidden = p.dataset.panel !== tab; });
  };
  buttons.forEach((b) => b.addEventListener('click', () => select(b.dataset.tab)));
  rest.classList.add('js-tabs');
  select('bebidas');
}
