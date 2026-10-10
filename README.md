# Rasari Hindi Writing Gym — PWA

## What's included
- `index.html`: app interface and touchscreen writing canvas
- `background.jpg`: the cleaned storybook-style background art
- `manifest.webmanifest`: install metadata
- `sw.js`: offline caching
- `icon-192.png`, `icon-512.png`: app icons

## Install on an Android tablet
A PWA must be served from an HTTPS website (or localhost). Opening `index.html` as a downloaded `content://` file does not enable installation or service workers.

1. Upload the contents of this folder to an HTTPS static host (for example, a Vercel project or GitHub Pages).
2. Open the HTTPS URL in Chrome on the tablet.
3. Use Chrome's menu (⋮) → **Install app** or **Add to Home screen**.
4. Open the installed Rasari icon. After the first visit, the core files are cached for offline use.

## Important limitations in this prototype
- Handwriting is drawn on the canvas, but the app does not automatically grade handwriting.
- The “I'm done!” flow records a practice attempt; it does not infer correctness.
- Sound playback uses the device's speech synthesis, which may pronounce isolated Devanagari characters differently depending on installed voices.
- The background and some decorative elements are artwork; the controls and practice letters are HTML/canvas layers.
