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

## 5. Pedagogical Progression, Barakhadi & Infinite Word Practice Engine
1. **Focus Letter Invariant:** The focus letter (`idx`) stays locked during all practice. Clicking "✓ I'm done!" NEVER advances the letter. Only explicit tapping of `<< Prev Letter` or `Next Letter >>` changes the focus letter.
2. **3-Tier Scaffold Watermark:**
   - **Tier 0 (Trace):** High watermark opacity (`0.28`).
   - **Tier 1 (Ghost):** Faint watermark opacity (`0.10`).
   - **Tier 2 (Freehand):** Zero watermark (`0.0`).
3. **Step 2 (Barakhadi Matra Progression):**
   - Swars (`अ` to `अः`) DO NOT take matras: `#st2` disabled.
   - For consonants (`क` to `ज्ञ`), "I'm done" advances through all 12 Barakhadi matras starting from 'aa':
     `का`, `कि`, `की`, `कु`, `कू`, `कृ`, `के`, `कै`, `को`, `कौ`, `कं`, `कः` (since the root letter `क` is already mastered in Step 1).
   - Each matra combo follows the 3-tier scaffold (Trace $\to$ Ghost $\to$ Freehand).
4. **Step 3 (Infinite Word Practice Engine):**
   - Grade-appropriate curated word banks (`WORD_BANKS`) provide 10+ words per letter (e.g., `कमल`, `कबूतर`, `कलम`, `कार`, `काम`, `किताब`, `कील`, `कुत्ता`, `केला`, `कौआ`, `कैंची`, `कोट`).
   - The engine supports infinite practice rotation on the focus letter until the child explicitly taps `>>`.
5. **Mastery Star Criteria:**
   - ⭐ **1 Star (Letter Mastery):** Freehand completion of the letter (Tier 2 passed).
   - ⭐⭐ **2 Stars (Matra Mastery):** Completion of all 12 Barakhadi matras for consonants (or $\ge 3$ words for Swars).
   - ⭐⭐⭐ **3 Stars (Word Mastery):** Mastery of at least 10 words for that letter.
6. **NO Spoiler Stroke Diagrams:** The right clue card MUST NOT show the target text or stroke diagram. Only pure visual clues (SVG illustrations or emojis) and a single sound button are permitted. Faint guide is only shown via explicit `💡 Hint` button (3s timeout).
7. **Direct Bottom Navigation:** Bottom pills provide `<< Prev Letter` and `Next Letter >>` direct navigation.

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
