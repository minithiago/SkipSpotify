// Detecta anuncios en el reproductor de Spotify Web y coordina el salto.
(() => {
  'use strict';

  const EVENT_OUT = 'skipspotify:command';
  const LOG_PREFIX = '%c[SkipSpotify]';
  const LOG_STYLE = 'color:#1db954;font-weight:bold';

  const SELECTORS = {
    nowPlayingBar: '[data-testid="now-playing-bar"]',
    adSubtitle: '[data-testid="context-item-info-ad-subtitle"]',
    skipForward: '[data-testid="control-button-skip-forward"]',
  };

  const DEFAULTS = { enabled: true, muteTab: true, fastForward: true, adsSkipped: 0 };
  let settings = { ...DEFAULTS };
  let adActive = false;
  let tickTimer = null;

  const log = (...args) => console.log(LOG_PREFIX, LOG_STYLE, ...args);

  function isAdPlaying() {
    const bar = document.querySelector(SELECTORS.nowPlayingBar);
    const adType = bar?.getAttribute('data-testadtype');
    if (adType && adType !== 'ad-type-none') return true;
    return !!document.querySelector(SELECTORS.adSubtitle);
  }

  function sendToPage(type) {
    window.dispatchEvent(new CustomEvent(EVENT_OUT, {
      detail: { type, settings: { fastForward: settings.fastForward } },
    }));
  }

  function sendToBackground(message) {
    try {
      chrome.runtime.sendMessage(message).catch(() => {});
    } catch (_) {
      // El contexto de la extensión se invalida al recargarla; ignorar.
    }
  }

  function clickSkipIfEnabled() {
    const btn = document.querySelector(SELECTORS.skipForward);
    if (btn && !btn.disabled && btn.getAttribute('aria-disabled') !== 'true') btn.click();
  }

  function onAdStart() {
    adActive = true;
    log('Anuncio detectado, saltando…');
    if (settings.muteTab) sendToBackground({ action: 'mute' });
    sendToPage('ad-start');
    clickSkipIfEnabled();

    settings.adsSkipped += 1;
    try {
      chrome.storage.local.set({ adsSkipped: settings.adsSkipped });
    } catch (_) {}

    // Mientras dure el anuncio seguimos empujando: Spotify puede cargar el audio
    // del anuncio o reiniciar la velocidad después de nuestra primera acción.
    clearInterval(tickTimer);
    tickTimer = setInterval(() => {
      sendToPage('ad-tick');
      clickSkipIfEnabled();
    }, 500);
  }

  function onAdEnd() {
    adActive = false;
    clearInterval(tickTimer);
    tickTimer = null;
    log('Fin del anuncio, restaurando audio.');
    sendToPage('ad-end');
    sendToBackground({ action: 'unmute' });
  }

  function check() {
    const ad = settings.enabled && isAdPlaying();
    if (ad && !adActive) onAdStart();
    else if (!ad && adActive) onAdEnd();
  }

  // Observamos todo el documento porque la barra de reproducción se re-renderiza
  // (React) y un observer sobre un nodo concreto podría quedarse huérfano.
  function startObserving() {
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ['data-testadtype', 'data-testid'],
    });
    setInterval(check, 1000); // Red de seguridad por si algún cambio no dispara el observer.
    check();
  }

  chrome.storage.local.get(DEFAULTS, (stored) => {
    settings = { ...DEFAULTS, ...stored };
    // Por si la pestaña quedó silenciada tras recargar en mitad de un anuncio.
    sendToBackground({ action: 'unmute' });
    startObserving();
    log('Activo.');
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    for (const [key, { newValue }] of Object.entries(changes)) settings[key] = newValue;
    if ('enabled' in changes || 'muteTab' in changes || 'fastForward' in changes) {
      if (adActive) onAdEnd();
      check();
    }
  });
})();
