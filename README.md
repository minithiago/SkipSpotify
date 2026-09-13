# SkipSpotify

Extensión de Chrome (Manifest V3) que detecta los anuncios de audio en
[Spotify Web](https://open.spotify.com) y los salta.

## Cómo funciona

1. **Detección** (`src/content.js`): observa el atributo `data-testadtype` de la barra
   de reproducción (`[data-testid="now-playing-bar"]`), que vale `ad-type-none` con
   música y cambia durante un anuncio. Como respaldo busca el subtítulo de anuncio
   `[data-testid="context-item-info-ad-subtitle"]`.
2. **Salto** (`src/injected.js`, en el contexto de la página): intercepta los
   elementos `<audio>`/`<video>` que crea Spotify y, durante el anuncio, los silencia,
   los pone a velocidad x16 y adelanta el audio hasta el final.
3. **Silencio garantizado** (`background.js`): silencia la pestaña mientras dura el
   anuncio y la restaura al terminar (solo si la silenció la extensión).
4. Si el botón "Siguiente" está habilitado, también lo pulsa.

El popup permite activar/desactivar cada parte y muestra cuántos anuncios se han saltado.

## Instalación

1. Abre `chrome://extensions`.
2. Activa **Modo de desarrollador** (arriba a la derecha).
3. Pulsa **Cargar descomprimida** y elige esta carpeta.
4. Recarga la pestaña de Spotify Web.

## Si deja de funcionar

Spotify cambia su web a menudo. Los selectores están al principio de
`src/content.js` (`SELECTORS`); abre la consola en open.spotify.com durante un anuncio
y busca los mensajes `[SkipSpotify]` para comprobar si se detecta.
