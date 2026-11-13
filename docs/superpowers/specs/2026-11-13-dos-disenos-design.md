# Café Andén: dos diseños con selector

Fecha: 2026-11-13

## Intención

La landing actual (`index.html`, `styles.css`, `main.js`) se hizo con otro agente y se parece demasiado a la referencia https://benditavibra.cl/. El problema está en el lenguaje visual: el mismo verde `#31402D`, una crema casi idéntica, grano sobre el verde, el ancho de 1240px, el título del hero que sube por líneas desde una máscara, el par de botones "Ver carta / Cómo llegar" y la línea de horario en el hero. El sitio es un demo de portafolio de Soto Dev (`cafeteria.sotodev.cl`) y tiene que verse como diseño propio.

Solución: el mismo café, con el mismo contenido, en **dos diseños** que el visitante cambia desde el navbar ("Diseño 1 / Diseño 2"). Además de corregir el parecido, el selector sirve como argumento de venta: muestra que se puede adaptar la página a la marca de cada cliente.

## Objetivos

- Diseño 1: conservar la estructura y la portada actuales (foto a pantalla completa con el título encima, que al usuario le gusta), cambiando todo lo que delata la referencia.
- Diseño 2: un diseño nuevo, cálido y redondeado, según el mockup aprobado.
- Un selector visible en el navbar de ambos diseños.
- Los dos diseños comparten textos, fotos, horario y lógica de WhatsApp. Cada dato está en un solo lugar en el JS.

## No objetivos

- No se cambian los textos, la historia, los precios ni las fotos, salvo lo indicado aquí.
- No hay backend nuevo. Sigue siendo un sitio estático en Cloudflare Workers assets.
- No se agrega nada con temática "andén" o metro (letreros, líneas, tableros). Esa dirección se descartó.

## Anti-objetivos (fracaso aunque funcione)

- Que cualquiera de los dos diseños vuelva a usar el verde/crema/dorado, el grano o la animación de líneas con máscara de la referencia.
- Que el selector rompa la página o cause un salto feo (que pierda la sección donde estaba el visitante).
- Que el Diseño 2 tenga etiquetas tipo píldora con emoji sobre los títulos de sección ("💻 Para trabajar"). El usuario las rechazó explícitamente.

## Restricciones

- HTML/CSS/JS sin framework, como ahora. El build sigue siendo `build.mjs` (copia a `dist/` e inyecta `GOOGLE_MAPS_API_KEY` en el HTML). Ahora debe procesar ambos HTML.
- Los dos diseños mantienen `noindex` (meta y `_headers`).
- Contraste AA en todo el texto.
- Mobile-first: sin scroll horizontal, gutter mínimo de 16px y la barra fija de WhatsApp en móvil (comportamiento actual) en ambos diseños.
- `prefers-reduced-motion` respetado en ambos.

## Lo decidido

### Rutas y selector

- Diseño 1 en `/` (`index.html`). Diseño 2 en `/calido` (`calido.html`). Cloudflare assets sirve `calido.html` en `/calido`. *(Nombre de la ruta: decisión de Claude.)*
- El selector es un control de dos segmentos, "Diseño 1 | Diseño 2", en el navbar de ambos. El activo se ve marcado. En móvil, donde se ocultan los links del nav, el selector **sigue visible**.
- Al cambiar se conserva la sección actual: ambas páginas usan los mismos `id` de sección (`#carta`, `#trabajar`, `#pedir`, `#historia`, `#llegar`) y el link del selector se actualiza con el hash de la sección visible. *(Decisión de Claude.)*
- No hay redirección automática según la última elección. Cada URL muestra siempre su diseño, para que los links compartidos sean estables. *(Decisión de Claude.)*

### Diseño 1: el actual, sin el ADN de la referencia

Misma estructura de secciones y layout que hoy: hero a pantalla completa, carta con columnas desfasadas y lista, "Para trabajar" con foto a sangre y datos, pedidos en dos columnas, historia, cómo llegar con mapa, footer. Misma tipografía (Archivo). Cambios:

- **Paleta "azul tinta + naranja"** (aprobada por el usuario):
  - tinta `#1E2638` (reemplaza a los verdes como fondo oscuro, botones oscuros y bloques de pedidos/footer); una variante más profunda para el footer queda a criterio del builder
  - claro `#EEF0F1` (reemplaza la crema como fondo y texto sobre oscuro); un segundo tono claro para "Cómo llegar" (hoy `--sand`) queda a criterio del builder, en la misma familia fría
  - naranja de relleno `#BF5520` con **texto blanco**. El usuario quiere el naranja con letras blancas. Se usa `#BF5520` en vez de `#E07A3F` porque blanco sobre `#E07A3F` da ~3:1 y no pasa AA; sobre `#BF5520` da ~4,6:1.
  - naranja de texto `#E07A3F`, solo como color de texto sobre fondos oscuros o foto (por ejemplo "bien hecho." en el título del hero)
  - los degradados sobre las fotos se tiñen con la tinta, no con el verde
  - `theme-color` y `favicon.svg` pasan a la nueva paleta
- **Sin grano**: se elimina el `::before` con ruido SVG.
- **Hero**: el título lleva "bien hecho." en naranja de texto. Los botones pasan a "Ver la carta" (naranja relleno, texto blanco) y "Pedir para retirar" (borde claro, va a `#pedir`). Se quita la línea de horario/servicios bajo los botones (era calco de la referencia); el estado abierto/cerrado ya vive en "Cómo llegar".
- **Animación del título**: se reemplaza el "line-up" con máscara. El nuevo efecto queda a criterio del builder, con una condición: que no sea texto subiendo desde una máscara (por ejemplo, palabras con fundido y un leve desplazamiento escalonado).
- El ancho máximo pasa de `1240px` a otro valor (por ejemplo 1200 o 1280). *(Decisión de Claude: detalle menor, pero coincidía exacto.)*
- El día de hoy en el horario se resalta con el naranja de relleno y texto blanco.

Referencia visual: `.superpowers/brainstorm/1968-1794541703/content/paleta-d1-v4.html`, opción 1 (con el naranja corregido como se indica arriba).

### Diseño 2: cálido redondeado

Referencia visual aprobada: `.superpowers/brainstorm/1968-1794541703/content/estructura-b-v3.html`, **sin las etiquetas `.kicker`** (las píldoras con emoji sobre cada título). Los títulos quedan solos.

- **Paleta**: fondo durazno claro `#FBEFE6`, café `#3A2318` (texto, bloques oscuros), durazno `#F6B48F` (resaltados), salvia `#9DBF9A` (sticker, ficha), blanco (tarjetas). Texto secundario `#7A6257`, a verificar AA sobre el fondo.
- **Tipografía**: Bricolage Grotesque (títulos) + Work Sans (texto), desde Google Fonts.
- **Lenguaje**: esquinas grandes (24–32px), botones y precios en píldora, una palabra clave de cada título resaltada con fondo durazno levemente girado.
- **Secciones**, en este orden:
  1. **Portada**: foto grande enmarcada (margen alrededor y esquinas de 32px, no de borde a borde) con degradado café abajo. El nav flota encima: logo "andén" en píldora clara, links en un grupo de píldoras, botón WhatsApp durazno y el selector. Abajo a la izquierda: píldora de estado abierto/cerrado (en vivo, usa la misma lógica que el horario), título "Café de barrio, / bien hecho." con "bien hecho." resaltado, bajada y un botón "Ver la carta". Abajo a la derecha: sticker circular salvia girado, "Wifi + enchufes en todas las mesas".
  2. **Carta** (`#carta`): título "Lo que más sale." y bajada; 4 tarjetas blancas (foto, nombre, precio en píldora, una línea de descripción); debajo, una tarjeta blanca con el resto de la carta en dos columnas, con pestañas en píldora **Café / Para comer / Dulce** que filtran la lista (JS). Las pestañas deben ser accesibles (roles de tab o botones con `aria-pressed`) y sin JS se muestra todo.
  3. **Para trabajar** (`#trabajar`): foto en arco a la izquierda y texto con 4 fichas de color (durazno, salvia, blanco, café) con 300 Mb / 22 / 2º piso / $1.000.
  4. **Pedir** (`#pedir`): bloque café redondeado; 3 pasos con número en círculo durazno; botón WhatsApp; a la derecha, la foto del barista con una burbuja estilo WhatsApp con el mensaje de ejemplo.
  5. **Historia** (`#historia`): retrato de Ignacio con una notita blanca girada (el pie de foto) y el texto con los datos en píldoras.
  6. **Cómo llegar** (`#llegar`): mapa de Google en tarjeta redondeada (misma lógica de llave y foto de respaldo que hoy) y una tarjeta blanca con dirección, formas de llegar en píldoras y horario con hoy resaltado en durazno.
  7. **Footer**: bloque café redondeado con "andén" grande y el pitch de Soto Dev con la línea de créditos de fotos.
- **Pestañas de la carta**: son solo dos, **Café y bebidas / Para comer**, y corresponden a las dos listas que ya existen en `index.html`. No hay pestaña "Dulce" (el mockup la mostraba, pero obligaba a inventar o duplicar contenido). *(Decisión de Claude.)*
- **Textos del Diseño 2**:
  - Los títulos de sección y la palabra resaltada se toman del mockup aprobado: "Lo que **más sale.**", "Quédate **un rato largo.**", "Pídelo por WhatsApp y pasa a buscarlo.", "Antes aquí había una **ferretería.**" y "A media cuadra **del metro.**".
  - El resto del texto (bajadas, pasos, historia, horario, formas de llegar) se porta desde `index.html`.
  - Las descripciones de las 4 tarjetas se recortan a una frase, la más característica de cada una.
  - Nombres de productos idénticos a `index.html`.

  *(Decisión de Claude. El usuario aprobó el mockup con esos títulos.)*
- En la portada (`#inicio`), el link del selector va sin hash.
- Movimiento: revelado suave al hacer scroll, coherente con el estilo. Detalle a criterio del builder.

### JS compartido

- Hay un solo lugar para el horario (`HOURS`), el texto de WhatsApp y la lógica del mapa y de la barra móvil. Los usan ambos diseños.
- Lo específico de cada diseño (selectores de revelado, parallax del Diseño 1, pestañas del Diseño 2) va separado. La forma exacta (dos archivos, módulos, o un archivo con detección por `data-design` en `<html>`) queda a criterio del builder.

## A criterio del builder

- Organización de archivos CSS/JS y nombres de clases.
- Comportamiento responsive del Diseño 2 (cuántas columnas por breakpoint, cómo se apila la portada y dónde va el sticker en móvil), respetando las restricciones.
- Tonos derivados de la paleta (hover, bordes, segundo tono claro), siempre que pasen AA.
- La animación nueva del título del Diseño 1, dentro de la condición indicada.
- Metadatos OG del Diseño 2 (puede reutilizar `og.jpg`).
