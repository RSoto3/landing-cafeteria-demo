// Diseño 1. Shared logic (WhatsApp, hours, map, mobile bar, reveal) lives in shared.js.
import {
  initWhatsApp, initStatus, initWaBar, initMap, initReveal, initDesignSwitch, initStickyNav, initMenu, prefersReducedMotion,
} from './shared.js';

initWhatsApp();
initStatus();
initWaBar(['.hero', '#pedir', '.footer']);
initMap();
initDesignSwitch();
initStickyNav('#topbar');

initMenu();

// Photos are the one scroll motion; text is simply there
initReveal('.prod, .historia__foto, .pedir__foto');

// Parallax on full-bleed photos (only while on screen)
if (!prefersReducedMotion && 'IntersectionObserver' in window) {
  const layers = [...document.querySelectorAll('.hero__img, .bleed__img')].map((img) => ({
    img, box: img.parentElement, active: false,
  }));
  const parallaxIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      const l = layers.find((x) => x.box === e.target);
      if (l) l.active = e.isIntersecting;
    });
  });
  layers.forEach((l) => parallaxIO.observe(l.box));

  let ticking = false;
  const vh = () => window.innerHeight;
  function parallax() {
    ticking = false;
    layers.forEach(({ img, box, active }) => {
      if (!active) return;
      const r = box.getBoundingClientRect();
      // -1 when the section enters from below, +1 when it leaves at the top
      const progress = (vh() / 2 - (r.top + r.height / 2)) / (vh() / 2 + r.height / 2);
      img.style.translate = `0 ${(progress * 8).toFixed(2)}%`;
      img.style.scale = img.classList.contains('hero__img') ? '' : '1.18';
    });
  }
  window.addEventListener('scroll', () => {
    if (!ticking) { ticking = true; requestAnimationFrame(parallax); }
  }, { passive: true });
  parallax();
}
