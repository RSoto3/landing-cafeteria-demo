# Café Andén · landing demo

Landing de demostración para una cafetería ficticia de Ñuñoa. Portafolio de [Soto Dev](https://sotodev.cl).

Sitio estático: HTML, CSS y JS sin frameworks.

## Desarrollo

Abre `index.html` en el navegador. Sin key de Google Maps se muestra una foto en lugar del mapa.

## Build

```sh
node build.mjs
```

Copia el sitio a `dist/` e inyecta la key del mapa desde la variable `GOOGLE_MAPS_API_KEY` (o desde un `.env` local, ver `.env.example`).

La key es de navegador: debe tener habilitada la Maps Embed API y estar restringida por dominio.

## Fotos

Unsplash: Qiming Chen, Louis Hansel, Macarena Navarro, Seungmin Yoon, Supradoc y Manuel Figueroa.
