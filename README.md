## SkipSpotify

Chrome extension (Manifest V3) that detects audio ads on [Spotify Web](https://open.spotify.com) and skips them.

### How it works

- **Detection** (`src/content.js`): monitors the `data-testadtype` attribute of the playback bar (`[data-testid="now-playing-bar"]`), which is `ad-type-none` during music playback and changes when an ad is playing. As a fallback, it looks for the ad subtitle element (`[data-testid="context-item-info-ad-subtitle"]`).
- **Skipping** (`src/injected.js`, running in the page context): intercepts the `<audio>` and `<video>` elements created by Spotify and, during ads, mutes them, sets the playback speed to 16x, and seeks to the end of the audio.
- **Guaranteed silence** (`background.js`): mutes the browser tab while the ad is playing and restores the previous state when the ad ends (only if it was muted by the extension).
- If the **Next** button is enabled, it will also be clicked automatically.

The popup allows enabling/disabling each feature and displays how many ads have been skipped.

### Installation

- Open `chrome://extensions`.
- Enable **Developer mode** (top right corner).
- Click **Load unpacked** and select this folder.
- Reload the Spotify Web tab.

### If it stops working

Spotify frequently updates its web interface. The selectors are defined at the beginning of `src/content.js` (`SELECTORS`). Open the console on `open.spotify.com` while an ad is playing and look for `[SkipSpotify]` messages to verify that ad detection is working.
