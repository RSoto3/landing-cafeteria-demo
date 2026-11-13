# Dos diseños con selector: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Que Café Andén tenga dos diseños propios, el actual rebrandeado en `/` y uno nuevo cálido en `/calido`, con un selector en el navbar y JS compartido.

**Architecture:** Sitio estático sin framework. La lógica común (WhatsApp, horario y estado, mapa, barra móvil, selector, revelado al hacer scroll y contadores) se mueve a un módulo ES `shared.js`. Lo importan `main.js` (Diseño 1) y `calido.js` (Diseño 2). Cada diseño tiene su HTML y su CSS. `build.mjs` copia ambos e inyecta la key del mapa en los dos.

**Tech Stack:** HTML, CSS y JS (módulos ES), Node 24 (`node --test` para los tests, sin dependencias), Cloudflare Workers assets.

**Spec:** `docs/superpowers/specs/2026-11-13-dos-disenos-design.md` (aprobado). Mockups de referencia en `.superpowers/brainstorm/1968-1794541703/content/`: `paleta-d1-v4.html` (opción 1) y `estructura-b-v3.html`.

## Global Constraints

- Prohibido en cualquier archivo del sitio: `#31402D`, `#242F21`, `#F4EDE1`, `#EAE0CE`, `feTurbulence` (grano), `@keyframes line-up` y `1240px`.
- Diseño 1, paleta: tinta `#1E2638`, claro `#EEF0F1`, naranja relleno `#BF5520` con texto `#FFFFFF`, naranja de texto `#E07A3F` (solo sobre oscuro o foto).
- Diseño 2, paleta: fondo `#FBEFE6`, café `#3A2318`, durazno `#F6B48F`, salvia `#9DBF9A`, blanco `#FFFFFF`, secundario `#7A6257`. Fuentes Bricolage Grotesque (títulos) y Work Sans (texto).
- Diseño 2: sin `.kicker` ni etiquetas con emoji sobre los títulos.
- Todo el texto con contraste AA (≥ 4.5:1; ≥ 3:1 si es ≥ 24px, o ≥ 18.66px en negrita).
- Ambos HTML: `<meta name="robots" content="noindex, nofollow">`.
- Ids de sección idénticos en ambos: `inicio`, `carta`, `trabajar`, `pedir`, `historia`, `llegar`.
- Móvil: sin scroll horizontal, gutter mínimo de 16px, barra fija de WhatsApp y selector visible.
- `prefers-reduced-motion`: sin animaciones y todo el contenido visible.
- Sin JS, todo el contenido es visible: el revelado se condiciona a la clase `.js`, y las pestañas muestran ambas listas.
- Textos: los del `index.html` actual. En el Diseño 2, los títulos de sección y la palabra resaltada vienen del spec, y la descripción de cada tarjeta es una frase.
- Git: no hagas commit. Cada task termina en un checkpoint; el usuario decide cuándo commitear.

## Review Focus

1. **Horario fuera de horario:** domingo, antes de abrir, después de cerrar o sábado a las 20:00. Cada caso debe decir el texto correcto ("abre mañana" / "abre el lunes"). → tests de `statusText` en Task 1.
2. **Sin key del mapa (abrir local o build sin env):** ambos diseños muestran la foto de respaldo y el botón de ruta, nunca un iframe roto. → test de build en Task 4 y verificación manual en Task 5.
3. **Cambiar de diseño desde una sección:** se llega a la misma sección del otro diseño. Desde la portada, sin hash. → test de `designHref` en Task 1.
4. **Teléfono angosto (360px):** el selector, el logo y el botón de WhatsApp caben en el nav de ambos diseños sin desbordar. → verificación en Task 5.
5. **Sin JS o con reduced motion:** nada queda invisible (opacidad 0 o clip-path), y en el Diseño 2 las dos listas de la carta se ven. → test estático en Task 3 y verificación en Task 5.

---

## Estructura de archivos

| Archivo | Responsabilidad |
|---|---|
| `shared.js` (nuevo) | Datos y lógica común: `HOURS`, `WA_URL`, `statusText`, `designHref` (funciones puras) e inicializadores del DOM |
| `main.js` (modificado) | Solo el Diseño 1: grupos de revelado y parallax. Importa `shared.js` |
| `index.html` / `styles.css` (modificados) | Diseño 1 rebrandeado y con selector |
| `calido.html` / `calido.css` / `calido.js` (nuevos) | Diseño 2 |
| `favicon.svg` (modificado) | Nueva paleta del Diseño 1 (lo comparten ambos diseños) |
| `build.mjs` (modificado) | Copia los archivos nuevos e inyecta la key en ambos HTML |
| `tests/shared.test.mjs` (nuevo) | Tests unitarios de las funciones puras |
| `tests/site.test.mjs` (nuevo) | Checks estáticos sobre los archivos (paleta prohibida, ids, noindex, contraste) |
| `tests/build.test.mjs` (nuevo) | Build con y sin key |
| `README.md` (modificado) | Cómo correr local (los módulos ES no funcionan con `file://`) y los tests |

Correr los tests: `node --test tests/`

---

### Task 1: Módulo compartido `shared.js` y `main.js` migrado

**Files:**
- Create: `shared.js`, `tests/shared.test.mjs`
- Modify: `main.js` (todo), `index.html:278` (`<script type="module" src="main.js"></script>`), `README.md` (sección Desarrollo)

**Interfaces:**
- Produces (exports de `shared.js`):
  - `HOURS: Record<0..6, [open:number, close:number] | null>` (mismo valor que hoy en `main.js:13-17`)
  - `WA_URL: string`, igual que hoy
  - `statusText(day: number, hour: number): { text: string, open: boolean }`, pura, con los textos actuales de `main.js:45-55`
  - `designHref(base: '/' | '/calido', sectionId: string | null): string`. Devuelve `base` si `sectionId` es `null` o `'inicio'`; si no, `base + '#' + sectionId`.
  - `initWhatsApp(): void`: setea `.js-wa`
  - `initStatus(): void`: actualiza cada `[data-estado]` (texto y clases `estado--open|closed`, quita `hidden`) y `li[data-days]` → `is-today`, cada 60 s
  - `initWaBar(hideSelectors: string[]): void`: lógica actual de `#wa-bar`
  - `initMap(): void`: lógica actual del `.mapa__frame`, sin cambios
  - `initDesignSwitch(): void`: para cada `a[data-design-link]` (atributo con valor `/` o `/calido`), mantiene `href = designHref(valor, idDeLaSecciónVisible)` con un IntersectionObserver sobre `[id]` de las secciones listadas en Global Constraints
  - `initReveal({ groups: string[], images: string }): void`: la lógica actual de revelado escalonado, el `countUp` de `[data-count]` y la rama de reduced motion
  - `prefersReducedMotion: boolean`
- `main.js` queda como: imports, `init*()` con los selectores actuales del Diseño 1 (`initWaBar(['.hero', '#pedir', '.footer'])`, `initReveal` con `REVEAL_GROUPS`/`IMG_REVEAL` actuales) y el parallax actual.
- `index.html`: el `<p class="estado" id="estado" hidden>` pasa a tener también `data-estado`.

- [ ] **Step 1: Escribir los tests que fallan** en `tests/shared.test.mjs` (`import { statusText, designHref } from '../shared.js'`). Los tests corren en Node, así que `shared.js` no puede tocar `document` ni `window` al importarse; todo el acceso al DOM va dentro de los `init*`, y `prefersReducedMotion` se calcula con guarda `typeof window !== 'undefined'`.
  - `statusText(1, 10)` → `{ open: true, text: 'Abierto ahora · cierra a las 20:30' }`
  - `statusText(1, 6)` → `{ open: false, text: 'Cerrado · abre hoy a las 7:30' }`
  - `statusText(1, 21)` → `{ open: false, text: 'Cerrado · abre mañana a las 7:30' }`
  - `statusText(6, 20)` → `{ open: false, text: 'Cerrado · abre el lunes a las 7:30' }` (cierra a las 20:00 exacto; el domingo está cerrado)
  - `statusText(0, 12)` → `{ open: false, text: 'Cerrado · abre mañana a las 7:30' }`
  - `statusText(6, 9)` → `open: true`, `'... cierra a las 20:00'`
  - `designHref('/calido', 'carta')` → `'/calido#carta'`; `designHref('/', 'inicio')` → `'/'`; `designHref('/calido', null)` → `'/calido'`
- [ ] **Step 2:** `node --test tests/` → FALLA (no existe `shared.js`)
- [ ] **Step 3:** Implementar `shared.js` moviendo el código de `main.js` (no reescribirlo) y dejar `main.js` como se describe arriba.
- [ ] **Step 4:** `node --test tests/` → PASA
- [ ] **Step 5:** Levantar un server local (`npx --yes serve -l 8080 .` o `python -m http.server 8080`) y abrir `/`. Revisar en la consola que no haya errores; el estado abierto/cerrado, el día de hoy, el revelado, los contadores y el parallax deben funcionar igual que antes.
- [ ] **Step 6:** En `README.md`, cambiar "Abre `index.html` en el navegador" por el comando del server local, y agregar `node --test tests/`.
- [ ] **Step 7: Checkpoint.** Sin commit; reportar al usuario.

---

### Task 2: Diseño 1 rebrandeado

**Files:**
- Modify: `styles.css`, `index.html`, `favicon.svg`
- Create: `tests/site.test.mjs`

**Interfaces:**
- Consumes: Task 1 (`data-estado`)
- Produces: un helper de test `contrast(hexA, hexB): number` (ratio WCAG) dentro de `tests/site.test.mjs`, que Task 3 reutiliza en el mismo archivo

- [ ] **Step 1: Escribir los tests que fallan** en `tests/site.test.mjs` (lee los archivos con `fs`):
  - `index.html`, `styles.css`, `favicon.svg` (y luego los de Task 3) no contienen ninguno de los valores prohibidos de Global Constraints (comparar en minúsculas)
  - `styles.css` contiene `#1E2638`, `#EEF0F1`, `#BF5520`, `#E07A3F` (sin importar mayúsculas)
  - `index.html`: `theme-color` es `#1E2638`, tiene noindex, no tiene `class="hero__meta"` y contiene los textos `Ver la carta` y `Pedir para retirar`
  - contraste: `contrast('#FFFFFF','#BF5520') >= 4.5`, `contrast('#EEF0F1','#1E2638') >= 4.5`, `contrast('#E07A3F','#1E2638') >= 3`
- [ ] **Step 2:** `node --test tests/` → FALLA en las aserciones de paleta y hero
- [ ] **Step 3: Paleta en `styles.css`.** Reemplazar los tokens de `:root` (líneas 1-12) por la nueva paleta. Agregar `--accent: #BF5520`, `--accent-text: #E07A3F` y `--on-accent: #FFFFFF`; los tonos derivados (fondo de "Cómo llegar", tinta profunda del footer, `--muted`) los decide el implementador, frío y AA. Teñir con la tinta los `rgba(18,22,15,…)` de los degradados y sombras. Cambiar `--max` a `1200px`. Los colores de `.estado--open/closed` deben pasar AA sobre el nuevo fondo.
- [ ] **Step 4: Sin grano.** Borrar el bloque "Grain on flat green surfaces" (`styles.css:461-471`).
- [ ] **Step 5: Hero.**
  - En `index.html:50`, envolver "bien hecho." en `<span class="hero__accent">`, con color `var(--accent-text)`.
  - Botones de `index.html:53-54`: "Ver la carta" → `#carta`, `btn--accent` (fondo `--accent`, texto `--on-accent`, hover más oscuro); "Pedir para retirar" → `#pedir`, `btn--outline`.
  - Borrar `.hero__meta` (HTML línea 56 y CSS).
  - Los demás botones `btn--cream` pasan a `btn--accent` o `btn--light`, a criterio del implementador, consistentes con la paleta.
  - El día de hoy (`.horario li.is-today`) va con `--accent` y texto blanco.
- [ ] **Step 6: Animación del título.** Borrar el mecanismo de máscara (`.hero__title .line` con `overflow:hidden`, `@keyframes line-up`). Usar un fundido por palabra con desplazamiento corto (por ejemplo `translateY(.25em)`) y un retraso escalonado. Puede quedar el marcado `<span>` por palabra o por línea, pero sin `overflow:hidden` como máscara. Se desactiva con reduced motion.
- [ ] **Step 7:** En `favicon.svg`, el fondo pasa a `#1E2638` y la letra a `#EEF0F1`; en `index.html`, `theme-color` pasa a `#1E2638`.
- [ ] **Step 8:** `node --test tests/` → PASA
- [ ] **Step 9:** Revisión visual en el server local a 1440px y 375px contra `paleta-d1-v4.html`, opción 1, con el naranja corregido. Que no quede ningún resto de verde o crema (revisar hovers, focus y la barra móvil).
- [ ] **Step 10: Checkpoint.**

---

### Task 3: Diseño 2 (`/calido`)

**Files:**
- Create: `calido.html`, `calido.css`, `calido.js`
- Modify: `tests/site.test.mjs`

**Interfaces:**
- Consumes: de Task 1, `initWhatsApp`, `initStatus`, `initWaBar`, `initMap`, `initReveal`, `initDesignSwitch` (este último se cablea en Task 4); de Task 2, el helper `contrast`
- Produces: `calido.html` con las secciones `#inicio` (portada), `#carta`, `#trabajar`, `#pedir`, `#historia`, `#llegar`; footer `.footer`; `#wa-bar`; `[data-estado]` en la portada y en "Cómo llegar"; `#horario li[data-days]`; `.mapa` con `.mapa__fallback` + `.mapa__frame[data-src]` (mismo `data-src` con `__GOOGLE_MAPS_API_KEY__` que `index.html`)

- [ ] **Step 1: Agregar los tests que fallan** a `tests/site.test.mjs`:
  - `calido.html` existe y tiene noindex, los 6 ids, `data-estado`, `id="horario"`, `__GOOGLE_MAPS_API_KEY__`, `<script type="module" src="calido.js">` y `rel="icon" href="favicon.svg"`
  - `calido.html` y `calido.css` no contienen `kicker` ni valores prohibidos
  - `calido.html` contiene los títulos `más sale.`, `un rato largo.`, `Pídelo por WhatsApp y pasa a buscarlo.`, `ferretería.` y `del metro.`
  - pestañas: hay exactamente dos botones de pestaña, con los textos `Café y bebidas` y `Para comer`
  - sin JS: ninguna regla de `calido.css` que aplique `opacity: 0`, `clip-path` o `hidden` a contenido va fuera de un selector que empiece con `.js ` (implementar: buscar las reglas con `opacity:\s*0` y comprobar que su selector contiene `.js`)
  - contraste: `#7A6257` sobre `#FBEFE6` ≥ 4.5; `#3A2318` sobre `#F6B48F` ≥ 4.5; `#3A2318` sobre `#9DBF9A` ≥ 4.5; `#FBEFE6` sobre `#3A2318` ≥ 4.5. Si `#7A6257` falla, oscurecerlo hasta que pase y usar ese valor en `calido.css`.
- [ ] **Step 2:** `node --test tests/` → FALLA
- [ ] **Step 3: `calido.html`.** Seguir `estructura-b-v3.html` sección por sección, sin las `.kicker`. Head: los mismos meta que `index.html` (noindex, OG con `og:url` `https://cafeteria.sotodev.cl/calido`), `theme-color` `#3A2318` y Google Fonts `Bricolage+Grotesque:opsz,wght@12..96,400..800` + `Work+Sans:wght@400;500;600`. Los textos siguen la regla de Global Constraints:
  - descripción de cada tarjeta (una frase, sacada de `index.html`): Capuchino "El que más pedimos a la hora de almuerzo."; Cortado en vaso "Lo pide medio barrio a las 8 de la mañana, camino al metro."; Torta tres chocolates "La hace Carmen los jueves."; Café helado + scone "Para los días de calor: cualquier café helado más un scone de queso o de naranja."
  - Usar las mismas imágenes con `srcset` y `alt` que `index.html`. El hero lleva `fetchpriority="high"` y preload.
  - La nav lleva un hueco para el selector (marcado en Task 4).
- [ ] **Step 4: Pestañas de la carta.** Hay dos `<button type="button" aria-pressed>` y dos `<ul>` con los ítems actuales de `index.html:121-137`. Sin JS se ven ambas listas, con su título visible. `calido.js` agrega la clase `.js-tabs`: solo entonces se oculta la lista no activa (`hidden`) y los botones conmutan `aria-pressed`. Por defecto queda activa "Café y bebidas".
- [ ] **Step 5: `calido.css`.** Tokens de la paleta de Global Constraints, radios de 24–32px, píldoras y resaltado girado. El responsive lo decide el implementador: 4 tarjetas → 2 → 1 columna, la portada apilada en móvil y el sticker reubicado o reducido. Barra móvil `.wa-bar` en café con texto claro. Revelado suave condicionado a `.js`, con un bloque de reduced motion como el de `styles.css:451-459`.
- [ ] **Step 6: `calido.js`.** Imports de `shared.js` con `initWhatsApp()`, `initStatus()`, `initWaBar(['#inicio', '#pedir', '.footer'])`, `initMap()` e `initReveal({...})` con los grupos del Diseño 2, más las pestañas. Sin parallax.
- [ ] **Step 7:** `node --test tests/` → PASA
- [ ] **Step 8:** Revisión visual en `/calido` a 1440px, 768px y 375px contra `estructura-b-v3.html`. Probar también con JS deshabilitado: todo debe verse, con las dos listas.
- [ ] **Step 9: Checkpoint.**

---

### Task 4: Selector de diseño y build

**Files:**
- Modify: `index.html` (nav), `styles.css`, `calido.html` (nav), `calido.css`, `main.js`, `calido.js`, `build.mjs`, `tests/site.test.mjs`
- Create: `tests/build.test.mjs`

**Interfaces:**
- Consumes: `initDesignSwitch()` y `designHref()` de Task 1
- Marcado del selector (igual en ambos HTML, estilo propio de cada diseño):
  ```html
  <div class="switch" role="group" aria-label="Elegir diseño">
    <a data-design-link="/" href="/" aria-current="page">Diseño 1</a>
    <a data-design-link="/calido" href="/calido">Diseño 2</a>
  </div>
  ```
  `aria-current="page"` va en el link del diseño actual. Ese segmento se ve marcado y su link sigue funcionando.

- [ ] **Step 1: Escribir los tests que fallan:**
  - `site.test.mjs`: ambos HTML contienen `data-design-link="/"` y `data-design-link="/calido"`; en `index.html`, `aria-current="page"` está en el link `/`; en `calido.html`, en el link `/calido`
  - `build.test.mjs`: correr `node build.mjs` con `execFileSync`, una vez con `env: { ...process.env, GOOGLE_MAPS_API_KEY: 'TESTKEY' }` y otra con la variable vacía. Si hay un `.env` local, la corrida "sin key" no es confiable: correrla con `cwd` en una copia temporal del proyecto sin `.env`. Con key: `dist/index.html` y `dist/calido.html` contienen `key=TESTKEY` y no `__GOOGLE_MAPS_API_KEY__`; existen `dist/calido.css`, `dist/calido.js` y `dist/shared.js`. Sin key: ambos conservan el placeholder.
- [ ] **Step 2:** `node --test tests/` → FALLA
- [ ] **Step 3:** Agregar el selector al nav de ambos HTML y llamar a `initDesignSwitch()` en `main.js` y `calido.js`. Estilos:
  - Diseño 1: control segmentado con borde claro de 1.5px y radio de 3px; el activo con fondo claro y texto tinta (como en `paleta-d1-v4.html`).
  - Diseño 2: grupo de píldoras, el activo en café.
  - En móvil (`max-width: 859px`) los links del nav se ocultan, pero el selector no. A 360px tienen que caber el logo, el selector y el botón de WhatsApp; si no caben, el botón de WhatsApp del nav se oculta en móvil, porque ya está la barra fija.
- [ ] **Step 4:** En `build.mjs`, `FILES` pasa a incluir `calido.html`, `calido.css`, `calido.js` y `shared.js`. Aplicar el reemplazo de la key a `index.html` y a `calido.html`.
- [ ] **Step 5:** `node --test tests/` → PASA
- [ ] **Step 6:** Correr `node build.mjs`, servir `dist/` y verificar que `/calido` responde. Con `npx wrangler dev`, que respeta el `html_handling` de assets, confirmar que `/calido` sirve `calido.html` sin redirigir a otra cosa.
- [ ] **Step 7: Checkpoint.**

---

### Task 5: Verificación final en navegador

**Files:** ninguno (solo correcciones si aparecen)

- [ ] **Step 1:** `node --test tests/` → todo PASA
- [ ] **Step 2:** Con `dist/` servido, en ambos diseños, a 1440px y 360px:
  - no hay scroll horizontal (`document.documentElement.scrollWidth <= innerWidth`)
  - el selector se ve
  - hacer clic en "Diseño 2" estando en `#trabajar` lleva a `/calido#trabajar`; desde la portada, a `/calido`
  - el estado abierto/cerrado se ve en el Diseño 2 (portada y "Cómo llegar")
  - sin key, el mapa muestra la foto de respaldo y el botón de ruta
  - la barra móvil de WhatsApp aparece y desaparece igual que antes
- [ ] **Step 3:** Con reduced motion emulado (DevTools → Rendering), en ambos diseños todo el contenido es visible y estático.
- [ ] **Step 4:** Comparación final con https://benditavibra.cl/ lado a lado. Ninguno de los dos diseños debe compartir paleta, grano, animación del título ni el par de botones del hero.
- [ ] **Step 5:** Reportar al usuario con capturas o descripción y la lista de checkpoints. Preguntar si quiere commit y deploy.
