# Café Andén · landing demo

Landing de demostración para una cafetería ficticia de Ñuñoa. Portafolio de [Soto Dev](https://sotodev.cl).

Sitio estático: HTML, CSS y JS sin frameworks.

## Desarrollo

El JS usa módulos ES, así que no funciona abriendo `index.html` directo (`file://`). Usa el server de Cloudflare, que corre el build y sirve `/calido` igual que en producción:

```sh
npx wrangler dev
```

Diseño 1 en `/` y Diseño 2 en `/calido`. Un server estático simple (por ejemplo `python -m http.server`) no resuelve `/calido`, así que el selector de diseño daría 404. Sin key de Google Maps se muestra una foto en lugar del mapa.

## Tests

```sh
node --test "tests/*.test.mjs"
```

## Build

```sh
node build.mjs
```

Copia el sitio a `dist/` e inyecta la key del mapa desde la variable `GOOGLE_MAPS_API_KEY` (o desde un `.env` local, ver `.env.example`).

La key es de navegador: debe tener habilitada la Maps Embed API y estar restringida por dominio.

## Fotos

Unsplash: Qiming Chen, Louis Hansel, Macarena Navarro, Seungmin Yoon, Supradoc y Manuel Figueroa.
