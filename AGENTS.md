# Rasari Hindi Writing Gym — Architectural Rules & Guidelines

This document defines the strict, non-negotiable architectural principles, visual layout rules, and algorithmic thresholds for the Rasari Hindi Writing Gym PWA. Any AI agent or developer modifying this repository MUST adhere to these rules to preserve the educational efficacy for 6-to-7-year-old learners (Grade 1).

---

## 1. The Sacred Center Slate Rule (Writing-First Experience)
- **The center blackboard (`#write`) is ALWAYS visible and active.**
- **NEVER** hide the writing canvas, replace it with multiple-choice buttons, or overlay puzzle stations.
- The child MUST physically write in every stage:
  - **Step 1 (Today's letter):** Recalls and writes the core letter (e.g. `क`, `आ`).
  - **Step 2 (Matra writing):** Writes the letter with matra (e.g. `का`, `के`).
  - **Step 3 (Word writing):** Writes the full word (e.g. `कमल`, `आम`, `खत`).
  - **Step 4 (★ Progress):** Opens a non-destructive sticker book modal (`#progressModal`). Closing the modal returns directly to the writing pad.

---

## 2. Pixel-Perfect 5-Line Notebook Ruling & Zero Font Scaling
In Indian elementary schools, Grade 1 children learn Hindi using 5-line ruling notebooks. The visual guidelines are strictly defined:
- **Line 1 (Upper Matra Guide - Dashed Sky Blue `#8ecdf7`):** Reserved for top matras (`े`, `ै`, `ो`, `ौ`, `ं`, `ँ`).
- **Line 2 (Shirorekha / Top Bar - Bold Solid Navy `#124170`):** The horizontal head bar of ALL consonants and vowels MUST sit flush on this line (0px gap).
- **Line 3 (Midline Guide - Dashed Teal `#5cc4bb`):** The middle anchor (loop of `क`, waist of `अ`/`आ`).
- **Line 4 (Baseline - Bold Solid Navy `#124170`):** The bottom foot of ALL consonants MUST sit flush on this line (0px gap).
- **Line 5 (Lower Matra Guide - Dashed Pink `#fca5b9`):** Reserved for bottom matras (`ु`, `ू`, `ृ`).

### Strict Technical Invariants:
1. **ZERO SCALING:** Letters and words MUST **NEVER** scale down (`scale = 1.0` always). A 1-letter character (`क`), a 2-letter word (`आम`), a 3-letter word (`कमल`), and a 4-letter word (`टमाटर`) MUST share the **exact same font size, height, and stroke thickness**.
2. **Exact Glyph Alignment (`getTextLayout`):**
   - Measure actual Devanagari font metrics on the device canvas (`actualBoundingBoxAscent` and `actualBoundingBoxDescent`).
   - Compute `baselineY = line2 + ascent`.
   - Never use arbitrary Latin font baselines or divisors (e.g. `0.68`).
3. **Ink Width:** Maintain `brushWidth = Math.max(16, Math.round(bodyHeight * 0.12))` to ensure clean strokes on touch tablets without filling glyph loops.

---

## 3. Discriminative Anti-Scribble Barrier
Children often scribble in frustration or playfulness. The handwriting evaluator (`evaluateHandwriting`) MUST reject scribbles with immediate tactile feedback:
1. **Ink Overkill Limit:** If user ink `uPixels > tPixels * 1.65`, reject with `reason: 'scribble'`.
2. **Negative Space Precision Check:** If precision (`matched / uPixels < 0.35`), reject with `reason: 'scribble'`.
3. **Shirorekha Presence Check:** If top zone (zones 0, 1, 2) lacks horizontal stroke when target requires it, apply structure penalty.
4. **Rejection Feedback:**
   - Trigger canvas shake animation (`#write.shake`).
   - Prompt: `"Don't scribble! Follow the lines ✍️"`.
   - Play gentle retry sound (`audio/snd_tryagain.mp3`).

---

## 4. Audio & Celebratory Design Rules
1. **NO Dull Audio:** The lackluster voice audio ("shabaash, bahut badhiya" / `snd_correct.mp3`) is **permanently prohibited**.
2. **Visual Excitement:** Success MUST trigger a 60fps high-energy Canvas Confetti particle burst (`triggerConfetti()`), gold stars, and banana treat counter increments.
3. **Authentic Pronunciation:** Letter tapping and "Hear again" MUST play native, high-quality Hindi `.mp3` files located in `audio/*.mp3` (no OS synthesis bugs like "dollar se anaar").

---

## 5. Active Recall (Retrieval Practice) & Swar-Matra Rules
1. **NO Spoiler Stroke Diagrams:** The right card MUST NOT draw the solved stroke diagram or spell out the word. It must show ONLY the visual/audio clue (e.g. 🥭 Picture + sound button). The child must construct the word in their own head.
2. **Hint On Demand:** Only when child explicitly taps `💡 Hint` does a faint guide watermark temporarily appear on the writing slate for 3 seconds.
3. **Swar vs Vyanjan Invariant:** Swars (`अ` to `अः`) DO NOT take matras. When a Swar is in focus, the Matra tab (`#st2`) MUST be disabled. Vyanjans cycle across diverse Grade 1 matras (`ा, ि, ी, ु, ू, े, ो`).
4. **Direct Bottom Navigation:** Bottom pills provide `⇦ Prev Letter` and `Next Letter ⇨` direct navigation, alongside the central `✓ I'm done!` button.

---

## 6. Offline PWA & Service Worker Rules
1. The app MUST operate completely offline without external CDNs or API calls.
2. Any commit that updates `index.html` or assets MUST bump `APP_VERSION` in `sw.js` (e.g., `1.7.0`).
3. The PWA toast (`#update-toast`) must notify the tablet of new service worker updates.

---

## 7. Regression Testing
Run the automated test suite before committing any changes:
```bash
npm test
```
All tests in `test/regression.test.js` must pass.
