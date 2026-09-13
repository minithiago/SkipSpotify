const DEFAULTS = { enabled: true, muteTab: true, fastForward: true, adsSkipped: 0 };
const TOGGLES = ['enabled', 'fastForward', 'muteTab'];

const countEl = document.getElementById('count');

chrome.storage.local.get(DEFAULTS, (settings) => {
  countEl.textContent = settings.adsSkipped;
  for (const key of TOGGLES) {
    const input = document.getElementById(key);
    input.checked = settings[key];
    input.addEventListener('change', () => chrome.storage.local.set({ [key]: input.checked }));
  }
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.adsSkipped) countEl.textContent = changes.adsSkipped.newValue;
});

document.getElementById('reset').addEventListener('click', () => {
  chrome.storage.local.set({ adsSkipped: 0 });
});
