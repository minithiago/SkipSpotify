// Silencia/restaura la pestaña de Spotify y muestra un indicador en el icono.
// Solo desilenciamos pestañas que silenciamos nosotros, para no pisar al usuario.

async function getMutedByUs() {
  const { mutedTabs = [] } = await chrome.storage.session.get('mutedTabs');
  return new Set(mutedTabs);
}

async function saveMutedByUs(set) {
  await chrome.storage.session.set({ mutedTabs: [...set] });
}

async function mute(tabId) {
  const tab = await chrome.tabs.get(tabId);
  const mutedTabs = await getMutedByUs();
  if (!tab.mutedInfo?.muted) {
    await chrome.tabs.update(tabId, { muted: true });
    mutedTabs.add(tabId);
    await saveMutedByUs(mutedTabs);
  }
  await chrome.action.setBadgeBackgroundColor({ tabId, color: '#e22134' });
  await chrome.action.setBadgeText({ tabId, text: 'AD' });
}

async function unmute(tabId) {
  const mutedTabs = await getMutedByUs();
  if (mutedTabs.has(tabId)) {
    await chrome.tabs.update(tabId, { muted: false });
    mutedTabs.delete(tabId);
    await saveMutedByUs(mutedTabs);
  }
  await chrome.action.setBadgeText({ tabId, text: '' });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender.tab?.id;
  if (tabId === undefined) return;

  const handler = message.action === 'mute' ? mute : message.action === 'unmute' ? unmute : null;
  if (!handler) return;

  handler(tabId)
    .then(() => sendResponse({ ok: true }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));
  return true; // respuesta asíncrona
});

chrome.tabs.onRemoved.addListener(async (tabId) => {
  const mutedTabs = await getMutedByUs();
  if (mutedTabs.delete(tabId)) await saveMutedByUs(mutedTabs);
});
