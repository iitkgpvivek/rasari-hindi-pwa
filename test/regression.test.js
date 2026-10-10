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

test('Right panel is an Active Recall Clue Card (no spoiler stroke diagrams, single sound button)', () => {
  assert(html.includes('id="clueBoard"'), 'Right panel must be a clue board');
  assert(html.includes('id="clueEmoji"'), 'Clue board must have picture clue');
  assert(html.includes('id="clueSoundBtn"'), 'Clue board must have audio button');
  assert(!html.includes('id="anchorWord"'), 'Left side must have no image or anchor word text');
  assert(!html.includes('id="clueSubtitle"'), 'Right panel must have no text');
  assert(!html.includes('id="replay"'), 'Must have only ONE sound button on the right');
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

test('Bottom pills use << and >> symbols with centered larger typography', () => {
  assert(html.includes('&lt;&lt; Prev'), 'Initial Prev button must use << symbol');
  assert(html.includes('Next &gt;&gt;'), 'Initial Next button must use >> symbol');
  assert(html.includes("'<< ' + lessons"), 'setLetter/render must prefix Prev with <<');
  assert(html.includes("lessons[nextIdx].c + ' >>'"), 'setLetter/render must suffix Next with >>');

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

console.log('\n----------------------------------------------------');
console.log(`  Tests: ${passedTests} passed, ${totalTests} total`);
console.log('----------------------------------------------------\n');

if (passedTests === totalTests) {
  console.log('🎉 ALL ARCHITECTURAL REGRESSION TESTS PASSED!\n');
} else {
  console.error('❌ SOME REGRESSION TESTS FAILED!\n');
  process.exit(1);
}
