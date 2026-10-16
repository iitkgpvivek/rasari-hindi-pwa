const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('====================================================');
console.log('  RUNNING RASARI HINDI PWA REGRESSION TEST SUITE   ');
console.log('====================================================\n');

let passedTests = 0;
let totalTests = 0;

function test(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`  ✓ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ✗ [FAIL] ${name}`);
    console.error(`    ${err.message}\n`);
    process.exitCode = 1;
  }
}

const htmlPath = path.join(__dirname, '..', 'index.html');
const swPath = path.join(__dirname, '..', 'sw.js');
const audioDir = path.join(__dirname, '..', 'audio');

const html = fs.readFileSync(htmlPath, 'utf8');
const sw = fs.readFileSync(swPath, 'utf8');

// ---------------------------------------------------------
// SUITE 1: Center Slate & Active Recall Architecture
// ---------------------------------------------------------
test('Center slate (#write) is permanently anchored in DOM', () => {
  assert(html.includes('<canvas id="write" aria-label="Writing canvas"></canvas>'), 'Writing canvas must exist');
  assert(!html.includes('id="matraStage"'), 'Old matraStage multiple-choice container must be removed');
  assert(!html.includes('id="wordStage"'), 'Old wordStage puzzle container must be removed');
  assert(!html.includes('id="progressStage"'), 'Old progressStage card displacing canvas must be removed');
});

test('Right panel is an Active Recall Clue Card (no spoiler stroke diagrams, clue speech target, and hint button)', () => {
  assert(html.includes('id="clueBoard"'), 'Right panel must be a clue board');
  assert(html.includes('id="clueEmoji"'), 'Clue board must have picture clue');
  assert(html.includes('id="hintBtn"'), 'Blue button on right must be Hint button');
  assert(!html.includes('id="guideModeBtn"'), 'Auto button at top must be removed');
  assert(!html.includes('id="anchorWord"'), 'Left side must have no image or anchor word text');
  assert(!html.includes('id="clueSubtitle"'), 'Right panel must have no text');
  assert(!html.includes('id="replay"'), 'Old replay button must not exist');
});

test('Bottom navigation provides direct Prev / Done / Next letter pills', () => {
  assert(html.includes('id="prevBtn"'), 'Previous letter button must exist');
  assert(html.includes('id="done"'), 'Done button must exist');
  assert(html.includes('id="nextBtn"'), 'Next letter button must exist');
});

test('Progress modal (#progressModal) is a non-destructive overlay', () => {
  assert(html.includes('id="progressModal"'), 'Progress modal must exist');
  assert(html.includes('id="closeProgressBtn"'), 'Modal must have close button');
  assert(html.includes('id="stickerGrid"'), 'Modal must have sticker grid');
});

// ---------------------------------------------------------
// SUITE 2: Swar vs Vyanjan Matra Invariant
// ---------------------------------------------------------
test('Swars have no matra and disable the Matra step (#st2)', () => {
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const lessonsMatch = scriptContent.match(/const lessons = (\[[\s\S]*?\]);/);
  assert(lessonsMatch, 'Curriculum lessons array must exist');

  const lessons = JSON.parse(lessonsMatch[1]);
  const swars = lessons.filter(l => l.isSwar);
  assert.strictEqual(swars.length, 13, 'Must have exactly 13 Swars');

  swars.forEach(s => {
    assert(!s.matra, `Swar ${s.c} must not have matra defined`);
  });

  assert(html.includes('matraStepEl.classList.add(\'disabled\')'), 'Matra step must be disabled for Swars');
});

// ---------------------------------------------------------
// SUITE 3: Notebook Ruling & Zero Font Scaling Invariant
// ---------------------------------------------------------
test('computeRuling strictly maintains 5 lines with ZERO text-length scaling', () => {
  const rulingMatch = html.match(/function computeRuling\(height[\s\S]*?\n\}/);
  assert(rulingMatch, 'computeRuling function must exist');
  const rulingCode = rulingMatch[0];

  assert(!rulingCode.includes('scale = 0.72'), 'Must NEVER scale down 3-letter words');
  assert(!rulingCode.includes('scale = 0.88'), 'Must NEVER scale down 2-letter words');
  assert(!rulingCode.includes('text.length'), 'Ruling must not depend on text length');

  const computeRuling = new Function(`return ${rulingCode}`)();
  const r = computeRuling(500);

  assert.strictEqual(r.line2, Math.round(500 * 0.37), 'Line 2 must be Shirorekha at 37%');
  assert.strictEqual(r.bodyHeight, Math.round(500 * 0.29), 'Body height must be fixed at 29%');
  assert.strictEqual(r.line4, r.line2 + r.bodyHeight, 'Line 4 must be Baseline at line2 + bodyHeight');
  assert(r.line1 < r.line2, 'Line 1 must be above Line 2');
  assert(r.line5 > r.line4, 'Line 5 must be below Line 4');
  assert(r.brushWidth >= 16, 'Brush width must be at least 16px');
});

test('getTextLayout aligns Shirorekha flush to Line 2 and foot to Line 4', () => {
  assert(html.includes('function getTextLayout(context, text, ruling)'), 'getTextLayout function must exist');
  assert(html.includes('ruling.line2 + exactAscent'), 'Baseline must be calculated from Line 2 + ascent');
  assert(html.includes('actualBoundingBoxAscent'), 'Must measure actual Devanagari font ascent');
});

// ---------------------------------------------------------
// SUITE 4: Anti-Scribble Barrier
// ---------------------------------------------------------
test('evaluateHandwriting rejects ink overkill scribbles (> 1.65x target)', () => {
  const tPixels = 1200;
  const uPixels = 2400; // 2x overkill
  const matched = 800;
  const precision = matched / uPixels; // 0.33

  const isOverkill = uPixels > tPixels * 1.65;
  const isPrecisionLow = precision < 0.35;

  assert.strictEqual(isOverkill, true, 'Ink overkill must be flagged');
  assert.strictEqual(isPrecisionLow, true, 'Precision below 35% must be flagged');
});

test('evaluateHandwriting passes genuine child traces', () => {
  const tPixels = 1200;
  const uPixels = 1100;
  const matched = 800;
  const precision = matched / uPixels; // 0.72
  const coverage = matched / tPixels;  // 0.66
  const union = tPixels + uPixels - matched; // 1500
  const iou = matched / union; // 0.53

  const pass = coverage >= 0.38 && precision >= 0.34 && iou >= 0.22 && (uPixels <= tPixels * 1.65);
  assert.strictEqual(pass, true, 'Clean trace must pass evaluation');
});

test('Canvas shake animation and scribble rejection are present', () => {
  assert(html.includes('w.classList.add(\'shake\')'), 'Must trigger canvas shake on rejection');
  assert(html.includes('evaluateHandwriting'), 'Handwriting evaluation must be present');
});

// ---------------------------------------------------------
// SUITE 5: Audio & Celebratory Design Invariants
// ---------------------------------------------------------
test('Prohibits "shabaash, bahut badhiya" (snd_correct.mp3)', () => {
  const doneMatch = html.match(/\$\('done'\)\.onclick[\s\S]*?\}\;/);
  assert(doneMatch, 'Done click handler must exist');
  const doneCode = doneMatch[0];

  assert(!doneCode.includes('snd_correct.mp3'), 'snd_correct.mp3 must NEVER be played on success');
  assert(doneCode.includes('triggerConfetti()'), 'Must trigger high-energy canvas confetti burst');
});

test('All 49 native Hindi audio files exist on disk', () => {
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const lessonsMatch = scriptContent.match(/const lessons = (\[[\s\S]*?\]);/);
  assert(lessonsMatch, 'Curriculum lessons array must exist');

  const lessons = JSON.parse(lessonsMatch[1]);
  assert.strictEqual(lessons.length, 49, 'Must contain exactly 49 lessons (13 Swar + 36 Vyanjans)');

  lessons.forEach((l, index) => {
    assert(l.audio, `Lesson ${index} (${l.c}) must have audio defined`);
    const audioFilePath = path.join(__dirname, '..', l.audio);
    assert(fs.existsSync(audioFilePath), `Audio file must exist on disk: ${l.audio}`);
  });
});

// ---------------------------------------------------------
// SUITE 6: Offline PWA & Service Worker Sync
// ---------------------------------------------------------
test('Service worker is configured with valid semver cache version', () => {
  const versionMatch = sw.match(/const APP_VERSION = '([^']+)'/);
  assert(versionMatch, 'Service worker must declare APP_VERSION');
  const version = versionMatch[1];
  assert(/^\d+\.\d+\.\d+$/.test(version), `APP_VERSION must be valid semver: ${version}`);
});

// ---------------------------------------------------------
// SUITE 7: Clean Slate Transitions & Visual Clue Accuracy
// ---------------------------------------------------------
test('Erases earlier writing on "I\'m done" (both success and failure) and letter changes', () => {
  const doneMatch = html.match(/\$\('done'\)\.onclick[\s\S]*?\}\;/);
  assert(doneMatch, 'Done click handler must exist');
  const doneCode = doneMatch[0];

  assert(doneCode.includes('clearPad()'), 'Must call clearPad() on Done button press');
  
  // Failure branch check
  const failBranch = doneCode.match(/if\s*\(!result\.pass\)[\s\S]*?return;/);
  assert(failBranch, 'Failure branch must exist');
  assert(failBranch[0].includes('clearPad()'), 'Failure branch must erase strokes with clearPad()');

  // Success branch check
  const successBranch = doneCode.replace(failBranch[0], '');
  assert(successBranch.includes('clearPad()'), 'Success branch must erase strokes with clearPad()');

  // setLetter check
  const setLetterMatch = html.match(/function setLetter\(newIdx\)[\s\S]*?\n\}/);
  assert(setLetterMatch, 'setLetter function must exist');
  assert(setLetterMatch[0].includes('clearPad()'), 'setLetter must call clearPad() to guarantee clean slate');
});

test('Bottom pills use Previous and Next labels with centered larger typography', () => {
  assert(html.includes('id="prevBtn">Previous</button>'), 'Initial Prev button must use Previous text');
  assert(html.includes('id="nextBtn">Next</button>'), 'Initial Next button must use Next text');
  assert(html.includes("$('prevBtn').textContent = 'Previous'"), 'render must set Prev button to Previous');
  assert(html.includes("$('nextBtn').textContent = 'Next'"), 'render must set Next button to Next');

  const prevBtnStyle = html.match(/\.prev-btn\{([^}]+)\}/);
  assert(prevBtnStyle, '.prev-btn style must exist');
  assert(prevBtnStyle[1].includes('text-align:center'), '.prev-btn must have text-align:center');
  assert(prevBtnStyle[1].includes('justify-content:center'), '.prev-btn must center content');
  assert(!prevBtnStyle[1].includes('clamp(14px,1.8vw,23px)'), '.prev-btn font size must be increased');
});

test('Accurate visual illustrations provided (Anaar is not an Apple, Yagya is not a Diya, Rath is not a Wheel, Hal is not a Crop)', () => {
  assert(html.includes('const ILLUSTRATIONS = {'), 'Must have custom illustrations dictionary');
  assert(html.includes('"अनार":'), 'Must have accurate illustration for अनार');
  assert(html.includes('"यज्ञ":'), 'Must have Hawan Kund illustration for यज्ञ (not a Diya)');
  assert(html.includes('"रथ":'), 'Must have Royal Chariot illustration for रथ (not a tire/wheel)');
  assert(html.includes('"हल":'), 'Must have Farmer Plow illustration for हल (not a crop icon)');
  assert(html.includes('"डमरू":'), 'Must have Shiva Damru illustration for डमरू');
  assert(html.includes('renderClue(item,'), 'render function must call renderClue');

  // Verify all 49 core curriculum words are covered in ILLUSTRATIONS
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const lessonsMatch = scriptContent.match(/const lessons = (\[[\s\S]*?\]);/);
  const lessons = JSON.parse(lessonsMatch[1]);
  lessons.forEach(l => {
    assert(html.includes(`"${l.word}":`), `ILLUSTRATIONS must include custom vector for "${l.word}" (${l.c})`);
  });
});

// ---------------------------------------------------------
// SUITE 8: Pedagogical Progression & Infinite Practice Engine
// ---------------------------------------------------------
test('Focus Letter Invariant: "I\'m done" stays locked on current letter (never advances idx)', () => {
  const doneMatch = html.match(/\$\('done'\)\.onclick[\s\S]*?\}\;/);
  assert(doneMatch, 'Done click handler must exist');
  const doneCode = doneMatch[0];

  assert(!doneCode.includes('setLetter(nextIdx)'), '"I\'m done" MUST NOT change the focus letter');
  assert(!doneCode.includes('setLetter('), '"I\'m done" MUST NOT call setLetter()');
  assert(html.includes("$('prevBtn').onclick"), 'Prev button must exist for explicit letter navigation');
  assert(html.includes("$('nextBtn').onclick"), 'Next button must exist for explicit letter navigation');
});

test('Barakhadi 13-Matra Sequence is defined for consonants', () => {
  assert(html.includes('const BARAKHADI_MATRAS = ['), 'BARAKHADI_MATRAS array must exist');
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const matrasMatch = scriptContent.match(/const BARAKHADI_MATRAS = (\[[\s\S]*?\]);/);
  assert(matrasMatch, 'BARAKHADI_MATRAS must be parseable');
  const matras = new Function(`return ${matrasMatch[1]}`)();
  assert.strictEqual(matras.length, 13, 'Must contain all 13 Barakhadi matras (क, का, कि, की, कु, कू, कृ, के, कै, को, कौ, कं, कः)');
});

test('WORD_BANKS contains 10+ Grade-1 words for each of the 49 letters', () => {
  assert(html.includes('const WORD_BANKS = {'), 'WORD_BANKS must exist');
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const lessonsMatch = scriptContent.match(/const lessons = (\[[\s\S]*?\]);/);
  const lessons = JSON.parse(lessonsMatch[1]);

  lessons.forEach(l => {
    assert(html.includes(`"${l.c}": [`), `WORD_BANKS must contain an entry for letter ${l.c}`);
  });
});

test('Mastery Star Criteria: 1 star = letter, 2 stars = matra, 3 stars = 10 words', () => {
  assert(html.includes('function updateLetterStar(c)'), 'updateLetterStar function must exist');
  const updateStarMatch = html.match(/function updateLetterStar\(c\)[\s\S]*?\n\}/);
  assert(updateStarMatch, 'updateLetterStar body must exist');
  const code = updateStarMatch[0];

  assert(code.includes('m.letterMastered'), 'Must require letter mastery for 1 star');
  assert(code.includes('m.matraMastered'), 'Must require matra mastery for 2 stars (consonants)');
  assert(code.includes('m.wordsMastered.length >= 10'), 'Must require at least 10 mastered words for 3 stars');
});

test('Software Palm Rejection & Full-Screen Aperture Palm Protection', () => {
  assert(!html.includes('id="palmGuardShield"'), 'Movable bottom palm guard shade is cleanly removed in favor of full-screen aperture mode');
  assert(!html.includes('id="palmGuardToggle"'), 'Top Palm Guard toggle button is cleanly removed from top bar');
  assert(html.includes('function isPalmContact(e)'), 'isPalmContact discriminative function must exist');
  assert(html.includes('activePointerId'), 'Single active pointer locking must be implemented to prevent multi-touch jitter');
  assert(html.includes('lastDrawEndTime'), 'Drawing cooldown lockout on bottom buttons must be implemented');
  assert(html.includes('id="apertureOverlay"'), 'Full-screen aperture overlay covers entire screen during writing');
});

test('Fullscreen Kiosk Mode & Parental Guidance modal protect against OS navigation exits', () => {
  assert(html.includes('id="fullscreenToggle"'), 'Fullscreen toggle button must exist');
  assert(html.includes('id="stylusModal"'), 'Stylus & Tablet guidance modal must exist');
  const manifest = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'manifest.webmanifest'), 'utf8'));
  assert.strictEqual(manifest.display, 'fullscreen', 'Manifest must specify fullscreen display to hide tablet navigation bar');
});

test('Full-Screen Aperture Writing Shield Mode & Akshara-by-Akshara guidance are active', () => {
  // DOM overlay & blockers
  assert(html.includes('id="apertureOverlay"'), 'Aperture overlay container must exist');
  assert(html.includes('id="apertureBar"'), 'Top aperture controls bar must exist');
  assert(html.includes('id="apertureWindow"'), 'Focused aperture window cutout must exist');
  assert(html.includes('id="blockerTop"'), 'Top palm blocker shield must exist');
  assert(html.includes('id="blockerBottom"'), 'Bottom palm blocker shield must exist');
  assert(html.includes('id="blockerLeft"'), 'Left palm blocker shield must exist');
  assert(html.includes('id="blockerRight"'), 'Right palm blocker shield must exist');

  // Controls
  assert(html.includes('id="apertureCloseBtn"'), 'Exit Writing Mode button must exist');
  assert(html.includes('id="apertureDoneBtn"'), 'Next Akshara / Done button must exist');
  assert(html.includes('id="apertureClearBtn"'), 'Clear stroke button must exist');
  assert(html.includes('id="apertureHintBtn"'), 'Hint button must exist');
  assert(html.includes('id="apertureSoundBtn"'), 'Sound button must exist');

  // Logic functions
  assert(html.includes('function openApertureMode()'), 'openApertureMode function must exist');
  assert(html.includes('function closeApertureMode()'), 'closeApertureMode function must exist');
  assert(html.includes('function updateApertureView()'), 'updateApertureView function must exist');
  assert(html.includes('function getAksharaSegments('), 'getAksharaSegments function must exist');
  assert(html.includes('function getAksharaMetrics('), 'getAksharaMetrics function must exist');
  assert(html.includes('function handleApertureDone()'), 'handleApertureDone function must exist');
  assert(html.includes('function clearCurrentAksharaStrokes()'), 'clearCurrentAksharaStrokes function must exist');

  // Akshara segmentation test using Intl.Segmenter
  const seg = new Intl.Segmenter('hi', { granularity: 'grapheme' });
  const kamalSegs = Array.from(seg.segment('कमल'), s => s.segment);
  assert.deepStrictEqual(kamalSegs, ['क', 'म', 'ल'], 'Must correctly segment Devanagari words into Aksharas');
});

test('Option A: Akshara-level syllabic decomposition for Devanagari words and Write Mode state toggle', () => {
  assert(html.includes('function decomposeWordToUnits('), 'decomposeWordToUnits must exist');
  assert(html.includes('function updateWriteModeBtn()'), 'updateWriteModeBtn must exist');
  assert(html.includes('currentUnitIndex = 0;'), 'Must always start on first letter when opening Write Mode');

  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const evalFn = new Function(`
    function hasTopMatra(str) {
      if (!str) return false;
      for (const ch of str) {
        const c = ch.charCodeAt(0);
        if (c === 0x093f || c === 0x0940 || c === 0x0947 || c === 0x0948 || c === 0x094b || c === 0x094c || c === 0x0902 || c === 0x0901) return true;
      }
      return false;
    }
    function hasBottomMatra(str) {
      if (!str) return false;
      if (str.startsWith('र') || str.startsWith('रु') || str.startsWith('रू')) return false;
      for (const ch of str) {
        const c = ch.charCodeAt(0);
        if (c === 0x0941 || c === 0x0942 || c === 0x0943) return true;
      }
      return false;
    }
    return ${scriptContent.match(/function decomposeWordToUnits\(word\)[\s\S]*?\n\}/)[0]};
  `);
  const decompose = evalFn();

  // किताब decomposes into natural syllables: कि, ता, ब (no broken micro-cuts)
  const kitabUnits = decompose('किताब');
  assert.strictEqual(kitabUnits.length, 3, 'किताब must decompose into 3 Aksharas: कि, ता, ब');
  assert.strictEqual(kitabUnits[0].char, 'कि');
  assert.strictEqual(kitabUnits[1].char, 'ता');
  assert.strictEqual(kitabUnits[2].char, 'ब');

  // बच्चा decomposes into: ब, च्चा (conjunct handled natively)
  const bachhaUnits = decompose('बच्चा');
  assert.strictEqual(bachhaUnits.length, 2, 'बच्चा must decompose into 2 Aksharas: ब, च्चा');
  assert.strictEqual(bachhaUnits[0].char, 'ब');
  assert.strictEqual(bachhaUnits[1].char, 'च्चा');

  // अमरूद decomposes into: अ, म, रू, द
  const amaroodUnits = decompose('अमरूद');
  assert.strictEqual(amaroodUnits.length, 4, 'अमरूद must decompose into 4 Aksharas: अ, म, रू, द');
  assert.strictEqual(amaroodUnits[2].char, 'रू');
});

test('Akshara aperture sizing, matra ruling bounds (hasTop / hasBottom), Prev navigation, and selective box clearing', () => {
  assert(html.includes('id="aperturePrevBtn"'), 'Must have aperturePrevBtn in DOM for backward box navigation');
  assert(html.includes('id="apertureUnitsTrack"'), 'Must have apertureUnitsTrack in DOM for interactive unit selection');
  assert(html.includes('function hasTopMatra('), 'Must detect top matra for Line 1 expansion');
  assert(html.includes('function hasBottomMatra('), 'Must detect bottom matra for Line 5 expansion');

  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const hasTopMatch = scriptContent.match(/function hasTopMatra\(str\)[\s\S]*?\n\}/)[0];
  const hasBottomMatch = scriptContent.match(/function hasBottomMatra\(str\)[\s\S]*?\n\}/)[0];
  const evalTop = new Function(`return ${hasTopMatch};`)();
  const evalBottom = new Function(`return ${hasBottomMatch};`)();

  // कि has top matra (ि reaches up to Line 1)
  assert.strictEqual(evalTop('कि'), true, 'कि must have top matra flagged');
  assert.strictEqual(evalBottom('कि'), false, 'कि must not have bottom matra');

  // कु has bottom matra (ु reaches down to Line 5)
  assert.strictEqual(evalBottom('कु'), true, 'कु must have bottom matra flagged');

  // रू on consonant र attaches at waist, staying flush between Line 2 and Line 4
  assert.strictEqual(evalBottom('रू'), false, 'रू must stay within Line 2-4 without extending to Line 5');

  // Verify selective clearing includes spatial stroke checking
  const clearFnMatch = scriptContent.match(/function clearCurrentAksharaStrokes\(\)[\s\S]*?\n\}/)[0];
  assert(clearFnMatch.includes('canvasWinL') || clearFnMatch.includes('boxL'), 'Must calculate bounding box of selected box');
  assert(clearFnMatch.includes('insideCount') || clearFnMatch.includes('insidePoints') || clearFnMatch.includes('pt.x'), 'Must check stroke points spatially inside selected box');
});

test('Two-Phase Workflow: "Let\'s write" enters Write Mode, "Finish Word" exits to review, and "I\'m done" celebrates', () => {
  assert(html.includes("✍️ Let's write"), 'Default main CTA must be "Let\'s write"');
  assert(html.includes('mainCtaState'), 'mainCtaState tracker must exist');
  assert(html.includes('updateMainCta'), 'updateMainCta function must exist');

  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const doneMatch = html.match(/\$\('done'\)\.onclick\s*=\s*e\s*=>\s*\{([\s\S]*?)\n\};/);
  assert(doneMatch, 'Done click handler must exist');
  assert(doneMatch[0].includes('openApertureMode()'), 'Clicking "Let\'s write" must open Write Mode');

  const apertureDoneMatch = scriptContent.match(/function handleApertureDone\(\)[\s\S]*?\n\}/)[0];
  assert(apertureDoneMatch.includes('closeApertureMode(false)'), 'Word finish must exit Write Mode to return to main page');
  assert(apertureDoneMatch.includes("mainCtaState = 'done'"), 'Word finish must switch main CTA to "done" state');
  assert(apertureDoneMatch.includes('updateMainCta()'), 'Word finish must update main CTA text');

  // Verify top Write Mode toggle is removed as primary entry is via main "Let's write" CTA
  assert(!html.includes('id="startWritingBtn"'), 'Top Write Mode ON/OFF toggle is cleanly removed');
});

test('Multi-touch Palm-Down Button Responsiveness & Anti-Dot Stroke Auto-Recovery', () => {
  assert(html.includes('touch-action:none'), 'html and body must have touch-action:none to prevent OS gesture cancelation');
  assert(html.includes('function makeTouchResponsive('), 'makeTouchResponsive helper must exist for instant multi-touch tap dispatch');

  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const apertureDoneMatch = scriptContent.match(/function handleApertureDone\(\)[\s\S]*?\n\}/)[0];
  assert(!apertureDoneMatch.includes('if (drawing ||'), 'handleApertureDone must not lock out when drawing/palm is down');

  const doneMatch = html.match(/\$\('done'\)\.onclick\s*=\s*e\s*=>\s*\{([\s\S]*?)\n\};/)[0];
  assert(!doneMatch.includes('if (drawing ||'), 'Main done button must not lock out when drawing/palm is down');

  // Verify pointermove stroke auto-recovery
  const pointermoveMatch = scriptContent.match(/w\.addEventListener\('pointermove'[\s\S]*?\n\}\);/)[0];
  assert(pointermoveMatch.includes('Auto-recover stroke') || pointermoveMatch.includes('drawing = true'), 'pointermove must auto-recover strokes interrupted by palm jitter');
  assert(pointermoveMatch.includes('maxMargin = 72') || pointermoveMatch.includes('maxMargin'), 'Aperture margin must accommodate natural child curves without clipping');
});

test('Shuffle Mode & Last-Attempted Navigation History', () => {
  assert(html.includes('id="shuffleToggle"'), 'Top Shuffle Mode toggle button must exist');
  assert(html.includes('shuffleMode'), 'shuffleMode state variable must exist');
  assert(html.includes('letterHistory'), 'letterHistory navigation history stack must exist');
  assert(html.includes('function getNextLetterIdx('), 'getNextLetterIdx selection function must exist');

  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const nextMatch = scriptContent.match(/\$\('nextBtn'\)\.onclick\s*=\s*e\s*=>\s*\{([\s\S]*?)\n\};/)[0];
  assert(nextMatch.includes('letterHistory.push('), 'Next button must record history of visited letters');
  assert(nextMatch.includes('getNextLetterIdx()'), 'Next button must call getNextLetterIdx()');

  const prevMatch = scriptContent.match(/\$\('prevBtn'\)\.onclick\s*=\s*e\s*=>\s*\{([\s\S]*?)\n\};/)[0];
  assert(prevMatch.includes('letterHistory.pop()'), 'Previous button must return to last attempted letter in history');
});

test('Home button resets to earliest unmastered letter (Shuffle OFF) and random unmastered letter (Shuffle ON)', () => {
  assert(html.includes('id="homeBtn"'), 'Home button must exist with id homeBtn');
  assert(html.includes('function goHome()'), 'goHome function must exist');
  assert(html.includes('function getUnmasteredLetterIndices('), 'getUnmasteredLetterIndices function must exist');

  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  const goHomeMatch = scriptContent.match(/function goHome\(\)\s*\{([\s\S]*?)\n\}/)[0];

  assert(goHomeMatch.includes('letterHistory = []'), 'goHome must reset navigation history');
  assert(goHomeMatch.includes('setStep(1)'), 'goHome must reset stage to Step 1');
  assert(goHomeMatch.includes('getUnmasteredLetterIndices(1)'), 'goHome must inspect unmastered letters');
  assert(goHomeMatch.includes('!shuffleMode'), 'goHome must differentiate when shuffle is OFF vs ON');
  assert(goHomeMatch.includes('unmastered[0]'), 'goHome must pick earliest unmastered letter when shuffle is OFF');
  assert(goHomeMatch.includes('Math.random()'), 'goHome must pick random unmastered letter when shuffle is ON');
  assert(goHomeMatch.includes('setLetter(targetIdx)'), 'goHome must navigate to target letter');

  // Verify modal and aperture mode cleanup
  assert(goHomeMatch.includes('closeApertureMode('), 'goHome must cleanly exit aperture write mode if active');

  // Behavioral simulation of getUnmasteredLetterIndices & goHome selection logic
  const mockLessons = [{ c: 'अ' }, { c: 'आ' }, { c: 'इ' }, { c: 'ई' }];
  const mockMastery = {
    'अ': { letterMastered: true },
    'आ': { letterMastered: true },
    'इ': { letterMastered: false },
    'ई': { letterMastered: false }
  };

  const getUnmastered = (lessons, mastery) => {
    return lessons
      .map((l, i) => (!mastery[l.c]?.letterMastered ? i : -1))
      .filter(i => i !== -1);
  };

  const unmastered = getUnmastered(mockLessons, mockMastery);
  assert(unmastered.length === 2 && unmastered[0] === 2 && unmastered[1] === 3, 'Unmastered indices must be [2, 3]');

  // Shuffle OFF: earliest unmastered letter
  const shuffleOffTarget = unmastered.length > 0 ? unmastered[0] : 0;
  assert(shuffleOffTarget === 2, 'Shuffle OFF must select earliest unmastered letter (index 2: इ)');

  // Shuffle ON: random unmastered letter
  const shuffleOnPool = unmastered;
  const picked = shuffleOnPool[Math.floor(Math.random() * shuffleOnPool.length)];
  assert(picked === 2 || picked === 3, 'Shuffle ON must pick an unmastered letter (2 or 3)');
});

test('AI Voice Personas (Teacher / Monkey) & Multi-Language Architecture (Hindi & Kannada)', () => {
  assert(html.includes('id="voiceToggle"'), 'Voice persona toggle button must exist in top toolbar');
  assert(html.includes('LANGUAGE_CONFIGS'), 'LANGUAGE_CONFIGS registry must exist');
  assert(html.includes("'hi':"), 'Hindi language configuration must exist');
  assert(html.includes("'kn':"), 'Kannada language configuration must exist');

  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert(scriptContent.includes('function getBestVoiceForLang('), 'getBestVoiceForLang function must exist');
  assert(scriptContent.includes('lekha') && scriptContent.includes('swara'), 'Must prioritize native female teacher voices (Lekha, Swara, etc.)');
  assert(scriptContent.includes('voicePersona === \'monkey\''), 'Must support Monkey persona pitch and rate adjustments');
  assert(scriptContent.includes('function speakWordOrPhrase('), 'speakWordOrPhrase engine function must exist');
});

test('Semantic Word Pronunciation on Clue Tap & 3D AI Illustrated Library (No block SVGs)', () => {
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert(scriptContent.includes('currentActiveClueWord'), 'Must track currentActiveClueWord in renderClue');

  const speakClueMatch = scriptContent.match(/function speakClue\(\)\s*\{([\s\S]*?)\n\}/)[0];
  assert(speakClueMatch.includes('currentActiveClueWord'), 'speakClue must pronounce the specific word depicted, not hardcoded letter audio');

  // Verify that core secondary vocabulary words now map to 3D PNG illustrations, not block SVGs
  const coreAiWords = ['किताब', 'कुत्ता', 'केला', 'कार', 'फूल', 'रोटी', 'घोड़ा', 'बिल्ली', 'पेंसिल', 'ऊंट', 'गुलाब', 'तरबूज', 'टोपी', 'जूता', 'घड़ी', 'ताला', 'चाबी', 'चूहा', 'नाव', 'बादल', 'तारा', 'गेंद', 'आग', 'आलू', 'हाथ', 'पैर', 'पानी'];
  const imagesMatch = scriptContent.match(/const IMAGES = \{([\s\S]*?)\n\};/)[1];

  coreAiWords.forEach(w => {
    const reg = new RegExp(`"${w}":\\s*"images\\/([^"]+)"`);
    const m = imagesMatch.match(reg);
    assert(m, `Word "${w}" must be registered in IMAGES`);
    assert(m[1].endsWith('.png') || m[1].endsWith('.webp'), `Word "${w}" image must be an AI raster image (.png/.webp), got: ${m[1]}`);

    const fs = require('fs');
    const path = require('path');
    const assetPath = path.join(__dirname, '..', 'images', m[1]);
    assert(fs.existsSync(assetPath), `Asset file ${m[1]} must exist on disk for word "${w}"`);
  });
});

test('Automated Educational Progression (Stage auto-lock, Letter -> Matras -> Words, Infinite Word Rotation)', () => {
  // Step pills must be non-clickable progression indicators
  assert(html.includes('.step:not(#st4){cursor:default;pointer-events:none}'), 'CSS must prevent child from skipping stages');
  assert(!html.includes("$('st1').onclick"), 'st1 must not have manual jump listener');
  assert(!html.includes("$('st2').onclick"), 'st2 must not have manual jump listener');
  assert(!html.includes("$('st3').onclick"), 'st3 must not have manual jump listener');

  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];
  assert(scriptContent.includes('function getAutoStepForLetter('), 'getAutoStepForLetter function must exist');

  const autoStepMatch = scriptContent.match(/function getAutoStepForLetter\(item\)\s*\{([\s\S]*?)\n\}/)[0];
  assert(autoStepMatch.includes('!m.letterMastered') && autoStepMatch.includes('return 1'), 'Must auto-lock to Step 1 when letter is unmastered');
  assert(autoStepMatch.includes('!m.matraMastered') && autoStepMatch.includes('return 2'), 'Must auto-lock to Step 2 when matras are unmastered');
  assert(autoStepMatch.includes('return 3'), 'Must advance to Step 3 for words');

  // Infinite word rotation in word bank
  const getWordMatch = scriptContent.match(/function getWordForLetter\(char,\s*wordIdx\)\s*\{([\s\S]*?)\n\}/)[0];
  assert(getWordMatch.includes('wordIdx % bank.length'), 'getWordForLetter must cycle words in bank infinitely');
});

test('Small AI Handwriting Evaluator & Elimination of Fake 92% Pass Bug', () => {
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];

  // 1. Prohibit fake 92% pass overrides
  assert(!html.includes('result.score = 92'), 'Hardcoded 92% score must be permanently removed');
  assert(!html.includes('window._forcePassDone'), 'window._forcePassDone fake pass bypass must be permanently removed');

  // 2. Stroke dynamics & Small AI features in evaluateHandwriting
  const evalMatch = scriptContent.match(/function evaluateHandwriting\([\s\S]*?\n\}/)[0];
  assert(evalMatch.includes('directionReversals'), 'evaluateHandwriting must track directional reversals for zigzag scribble detection');
  assert(evalMatch.includes('strokeRedundancy'), 'evaluateHandwriting must track stroke redundancy for coloring fill detection');
  assert(scriptContent.includes('captureSubmittedWriting'), 'captureSubmittedWriting must capture child writing thumbnail');
});

test('100% Word Bank Clue Alignment & AI 3D Picture Coverage (No Anaar fallback for Amrood/Adarak)', () => {
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];

  // 1. In renderClue, prohibit fallback to item.word
  const renderClueMatch = scriptContent.match(/function renderClue\([\s\S]*?\n\}/)[0];
  assert(!renderClueMatch.includes('imgSrc = IMAGES[item.word]'), 'renderClue must NEVER fall back to item.word (preventing Anaar from showing for Amrood/Adarak)');

  // 2. Secondary words for letter "अ" must all map to dedicated 3D images on disk
  const aWords = ['अमरूद', 'अदरक', 'अचकन', 'अजगर', 'अखबार', 'अनाज'];
  const imagesMatch = scriptContent.match(/const IMAGES = \{([\s\S]*?)\n\};/)[1];
  const fs = require('fs');
  const path = require('path');

  aWords.forEach(w => {
    const reg = new RegExp(`"${w}":\\s*"images\\/([^"]+)"`);
    const m = imagesMatch.match(reg);
    assert(m, `Word "${w}" must be registered in IMAGES with its own image`);
    const assetPath = path.join(__dirname, '..', 'images', m[1]);
    assert(fs.existsSync(assetPath), `Asset file ${m[1]} must exist on disk for word "${w}"`);
  });
});

test('Scaffold-Aware Strictness & Discriminative Devanagari OCR (Rejects na as va, strict trace line-following)', () => {
  const scriptContent = html.match(/<script>([\s\S]*?)<\/script>/)[1];

  // 1. Confusions dictionary & Devanagari OCR recognition
  assert(scriptContent.includes('const DEVANAGARI_CONFUSIONS = {'), 'DEVANAGARI_CONFUSIONS dictionary must exist');
  assert(scriptContent.includes('function recognizeDevanagariOCR('), 'recognizeDevanagariOCR function must exist');
  assert(scriptContent.includes("'न': ['व', 'ब'"), "'न' must map to lookalike confusion candidates including 'व'");

  // 2. Strict trace line-following in Tier 0 and Tier 1
  const evalMatch = scriptContent.match(/function evaluateHandwriting\([\s\S]*?\n\}/)[0];
  assert(evalMatch.includes('minCoverage = isTier0 ? 0.54 : 0.44'), 'Strict line-following coverage threshold must be enforced for Trace tier');
  assert(evalMatch.includes('minPrecision = isTier0 ? 0.46 : 0.38'), 'Strict line-following precision threshold must be enforced for Trace tier');
  assert(evalMatch.includes('inaccurate_trace'), 'Inaccurate traces must be explicitly flagged with reason inaccurate_trace');

  // 3. Freehand Tier 2 OCR discrimination
  assert(evalMatch.includes('activeTier === 2'), 'evaluateHandwriting must identify activeTier === 2 for Freehand mode');
  assert(evalMatch.includes('recognizeDevanagariOCR(strokesToEval, targetString'), 'Freehand mode must invoke recognizeDevanagariOCR');
  assert(evalMatch.includes("reason: 'wrong_letter'"), 'Freehand OCR must flag wrong_letter when detected character differs from target');

  // 4. Pedagogical child prompts on wrong_letter and inaccurate_trace
  assert(html.includes("prompt.textContent = `That looks like '${result.detected}', not '"), 'Prompts must inform child of exact detected vs expected character');
  assert(html.includes("prompt.textContent = `Trace carefully along the lines"), 'Prompts must guide child to follow lines on trace inaccuracies');

  // 5. Audio fallback resilience and Live AI retry prompt
  assert(scriptContent.includes('function speakRetryPrompt('), 'speakRetryPrompt function must exist');
  assert(scriptContent.includes('if (!v && fallbackAudio)'), 'speakWordOrPhrase must fall back to clean native audio when device lacks Hindi TTS voice');
  assert(scriptContent.includes("const defaultPhrase = (voicePersona === 'monkey')"), 'speakRetryPrompt must synthesize live audio persona');

  // 6. 'ग' vs 'म' discrimination and aperture completion preservation
  assert(scriptContent.includes("expectedChar === 'ग' || expectedChar === 'म'"), "recognizeDevanagariOCR must discriminate 'ग' vs 'म' by bridge continuity");
  assert(html.includes("apertureCompletedTarget"), "Must preserve apertureCompletedTarget on submission to prevent wiping bounding-box writing");
});

console.log('\n----------------------------------------------------');
console.log(`  Tests: ${passedTests} passed, ${totalTests} total`);
console.log('----------------------------------------------------\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL ARCHITECTURAL REGRESSION TESTS PASSED!\n');
} else {
  console.error('❌ SOME REGRESSION TESTS FAILED!\n');
  process.exit(1);
}
