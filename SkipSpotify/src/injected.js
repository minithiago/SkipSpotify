// Se ejecuta en el contexto de la página (world: MAIN) antes de que cargue Spotify.
// Spotify reproduce el audio con elementos <audio>/<video> que a menudo no están
// en el DOM, así que interceptamos play() para tener referencia a todos ellos.
(() => {
  'use strict';

  const EVENT_IN = 'skipspotify:command';
  const MAX_RATE = 16;
  // Solo saltamos al final (seek) al principio del anuncio; después únicamente
  // aceleramos. Así evitamos saltar la canción siguiente si el DOM se actualiza tarde.
  const SEEK_WINDOW_MS = 2500;

  const mediaElements = new Set();
  // Estado original de cada elemento que hemos modificado durante un anuncio.
  const touched = new Map();
  let adActive = false;
  let adStartedAt = 0;
  let settings = { fastForward: true };

  const originalPlay = HTMLMediaElement.prototype.play;
  HTMLMediaElement.prototype.play = function (...args) {
    track(this);
    if (adActive) speedUp(this);
    return originalPlay.apply(this, args);
  };

  const originalCreateElement = Document.prototype.createElement;
  Document.prototype.createElement = function (tagName, ...args) {
    const el = originalCreateElement.call(this, tagName, ...args);
    if (el instanceof HTMLMediaElement) track(el);
    return el;
  };

  function track(el) {
    if (mediaElements.has(el)) return;
    mediaElements.add(el);
    // Si el anuncio carga metadatos después de detectarlo, lo aceleramos entonces.
    el.addEventListener('loadedmetadata', () => { if (adActive) speedUp(el); });
    el.addEventListener('durationchange', () => { if (adActive) speedUp(el); });
  }

  function allMedia() {
    document.querySelectorAll('audio, video').forEach(track);
    return [...mediaElements];
  }

  function speedUp(el) {
    if (!touched.has(el)) {
      touched.set(el, { muted: el.muted, playbackRate: el.playbackRate });
    }
    try {
      el.muted = true;
      if (!settings.fastForward) return;
      el.playbackRate = MAX_RATE;
      const inSeekWindow = Date.now() - adStartedAt < SEEK_WINDOW_MS;
      if (inSeekWindow && Number.isFinite(el.duration) && el.duration > 1 && el.currentTime < el.duration - 0.5) {
        el.currentTime = el.duration - 0.25;
      }
    } catch (_) {
      // Algunos elementos (p. ej. con MediaSource) rechazan ciertos valores; no es crítico.
    }
  }

  function restore() {
    for (const [el, state] of touched) {
      try {
        el.playbackRate = state.playbackRate === MAX_RATE ? 1 : state.playbackRate;
        el.muted = state.muted;
      } catch (_) {}
    }
    touched.clear();
  }

  window.addEventListener(EVENT_IN, (event) => {
    const detail = event.detail || {};
    if (detail.settings) settings = { ...settings, ...detail.settings };

    if (detail.type === 'ad-start') {
      adActive = true;
      adStartedAt = Date.now();
      allMedia().forEach(speedUp);
    } else if (detail.type === 'ad-tick' && adActive) {
      allMedia().forEach(speedUp);
    } else if (detail.type === 'ad-end') {
      adActive = false;
      restore();
    }
  });
})();
