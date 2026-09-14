// CodeMirror 6 extension: colour words that rhyme (phonetically) with the
// same rhyme-group colour. Presentation follows the real Rhymr app
// (rhyme/highlight.rs): each rhyme group is coloured by *text* colour, the
// way an IDE colours a keyword vs a string, rather than a highlighter-pen
// background fill — cycled across a 24-hue palette (var(--rhyme-0..23) in
// tokens.css) in the order groups first appear in the document, wrapping
// past 24. Hovering a group dims every other group to var(--rhyme-dim),
// also matching the real app's interaction.

import { Decoration, EditorView, ViewPlugin } from '@codemirror/view';
import { RangeSetBuilder } from '@codemirror/state';
import { doubleMetaphone } from 'double-metaphone';

// Lazy-load CMU dictionary; if unavailable, fall back gracefully
let cmuDict = null;
async function ensureCmuDictLoaded () {
  if (cmuDict) return;
  try {
    const mod = await import('cmu-pronouncing-dictionary');
    cmuDict = mod.dictionary || null;
  } catch (e) {
    cmuDict = null; // proceed without CMU dict
  }
}

// Distinct hues cycled across rhyme groups before the palette wraps —
// matches RhymeTuning::hue_count's default in the real app.
const HUE_COUNT = 24;

// Common function/filler words excluded from rhyme matching, ported from
// rhyme/highlight.rs STOPWORDS — without this, short high-frequency words
// (the, of, is, and, ...) coincidentally share a trailing sound often
// enough to swamp genuine rhymes in colour noise.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'of', 'in', 'on', 'at', 'to', 'is', 'it', 'if', 'as', 'so', 'no', 'do', 'be',
  'by', 'or', 'up', 'we', 'he', 'she', 'i', 'my', 'me', 'you', 'your', 'am', 'are', 'was',
  'were', 'been', 'being', 'and', 'but', 'for', 'nor', 'yet', 'with', 'from', 'into', 'onto',
  'than', 'then', 'this', 'that', 'these', 'those', 'there', 'their', 'they', 'them', 'its',
  'his', 'her', 'him', 'our', 'us', 'oh', 'ah', 'uh', 'well', 'just', 'not', 'all', 'any', 'can',
  'could', 'would', 'should', 'will', 'shall', 'may', 'might', 'must', 'did', 'does', 'done',
  'had', 'has', 'have', 'let', 'get', 'got', 'go', 'goes', 'one', 'two', 'out', 'off', 'down',
  'over', 'under', 'again', 'also', 'too', 'very', 'much', 'some', 'such', 'same', 'own', 'each',
  'every', 'both', 'few', 'more', 'most', 'other', 'only', 'which', 'who', 'whom', 'what',
  'when', 'where', 'why', 'how'
]);

/** CodeMirror theme for the rhyme-highlight decorations: a `.rhyme-hue-N`
 * class per palette entry, plus the hover-dim override. No background
 * fill and no forced font-weight — colour alone carries the grouping. */
export const rhymeHighlightTheme = EditorView.theme((() => {
  const rules = {
    '.rhyme-highlight': { transition: 'color 100ms ease' },
    '@media (prefers-reduced-motion: reduce)': {
      '.rhyme-highlight': { transitionDuration: '.001ms' }
    }
  };
  for (let i = 0; i < HUE_COUNT; i++) {
    rules[`.rhyme-hue-${i}`] = { color: `var(--rhyme-${i})` };
  }
  rules['.rhyme-highlight.rhyme-dim'] = { color: 'var(--rhyme-dim)' };
  return rules;
})());

// --- PHONETIC/RHYME UTILS ---

// Normalize word endings for rhyme (strip s, es, ed, ing)
/**
 * @param word
 */
function normalizeEnding (word) {
  return word
    .replace(/(ing|ed|es|s)$/i, '')
    .replace(/[^a-zA-Zy]/g, '');
}

// Collapse similar phonemes (e.g., S/Z, D/T)
/**
 * @param phoneme
 */
function collapsePhoneme (phoneme) {
  return phoneme
    .replace(/Z/g, 'S')
    .replace(/D/g, 'T')
    .replace(/V/g, 'F')
    .replace(/B/g, 'P')
    .replace(/G/g, 'K');
}

// --- SYLLABLE SPLITTING AND PHONEME EXTRACTION ---
// Split CMUdict phoneme string into syllables using stress markers (0, 1, 2)
/**
 * @param phonemes
 */
function splitPhonemesIntoSyllables (phonemes) {
  const syllables = [];
  let current = [];
  for (let i = 0; i < phonemes.length; i++) {
    current.push(phonemes[i]);
    if (/\d/.test(phonemes[i])) { // stress marker = syllable boundary
      syllables.push(current);
      current = [];
    }
  }
  if (current.length) syllables.push(current);
  return syllables;
}

// Get all words and their positions in the document
/**
 * @param docText
 */
function getWordsWithPositions (docText) {
  const wordRegex = /\b\w+\b/g;
  let match;
  const words = [];
  while ((match = wordRegex.exec(docText)) !== null) {
    words.push({ word: match[0], from: match.index, to: match.index + match[0].length });
  }
  return words;
}

// --- Syllable-to-Text Alignment: Map phoneme syllables to word substrings ---
// Returns [{from, to, text, phonemes, key}] for each syllable in the word
/**
 * @param word
 * @param from
 * @param to
 * @param syllables
 */
function alignSyllablesToText (word, from, to, syllables) {
  // Greedy alignment: for each syllable, try to match the largest substring containing all its vowels
  const result = [];
  const lowerWord = word.toLowerCase();
  // Find all vowel positions in the word
  const vowels = /[aeiouy]/g;
  const vowelIndices = [];
  let m;
  while ((m = vowels.exec(lowerWord)) !== null) {
    vowelIndices.push(m.index);
  }
  // If we have as many vowels as syllables, use vowel positions as split points
  if (vowelIndices.length >= syllables.length) {
    const splits = [0];
    // For each syllable except the last, split after the corresponding vowel
    for (let i = 1; i < syllables.length; i++) {
      splits.push(vowelIndices[i - 1] + 1);
    }
    splits.push(word.length);
    for (let i = 0; i < syllables.length; i++) {
      const start = from + splits[i];
      const end = from + splits[i + 1];
      result.push({
        text: word.slice(splits[i], splits[i + 1]),
        from: start,
        to: end,
        phonemes: syllables[i].map(collapsePhoneme),
        key: syllables[i].map(collapsePhoneme).join(' ')
      });
    }
    return result;
  }
  // Fallback: even split
  let charIdx = 0;
  const partLen = Math.floor(word.length / syllables.length);
  for (let i = 0; i < syllables.length; i++) {
    const start = from + charIdx;
    const end = (i === syllables.length - 1) ? to : (from + charIdx + partLen);
    result.push({
      text: word.slice(start - from, end - from),
      from: start,
      to: end,
      phonemes: syllables[i].map(collapsePhoneme),
      key: syllables[i].map(collapsePhoneme).join(' ')
    });
    charIdx += end - start;
  }
  return result;
}

/**
 * @param doc
 */
function buildRhymeDecorations (doc) {
  const builder = new RangeSetBuilder();
  const docText = doc.toString();
  const words = getWordsWithPositions(docText);
  // Step 1: Collect all syllables and their positions
  const syllableInstances = [];
  for (const { word, from, to } of words) {
    if (STOPWORDS.has(word.toLowerCase())) continue;
    const base = normalizeEnding(word.toLowerCase());
    let lookup = cmuDict && cmuDict[base];
    if (!lookup && base.endsWith('y')) {
      lookup = cmuDict ? (cmuDict[base.slice(0, -1) + 'ee'] || cmuDict[base]) : null;
    }
    if (lookup) {
      const phonemes = lookup.split(' ');
      const syllables = splitPhonemesIntoSyllables(phonemes);
      const wordSyllables = alignSyllablesToText(word, from, to, syllables);
      for (const syl of wordSyllables) {
        syllableInstances.push(syl);
      }
    } else {
      // Fallback: double metaphone on the word ending, highlighting the
      // last few letters (same region heuristic as the CMU path uses for
      // an unrecognized-word rhyme key).
      const metaphones = doubleMetaphone(base).filter(Boolean);
      if (metaphones.length) {
        const start = Math.max(0, word.length - 3);
        syllableInstances.push({
          text: word.slice(start),
          from: from + start,
          to,
          key: metaphones.join(' ')
        });
      }
    }
  }
  // Step 2: Group syllables by rhyme key
  const rhymeGroups = new Map(); // key -> [syllableInstance]
  for (const syl of syllableInstances) {
    if (!rhymeGroups.has(syl.key)) rhymeGroups.set(syl.key, []);
    rhymeGroups.get(syl.key).push(syl);
  }
  // Step 3: Assign a hue (0..23, wrapping) to each group with >1 member,
  // in the order the group first appears in the document.
  const rhymeHueMap = new Map();
  let hueIdx = 0;
  for (const [key, group] of rhymeGroups.entries()) {
    if (group.length > 1) {
      rhymeHueMap.set(key, hueIdx % HUE_COUNT);
      hueIdx++;
    }
  }
  // Step 4: Highlight all matching syllables in all words
  for (const syl of syllableInstances) {
    const hue = rhymeHueMap.get(syl.key);
    if (hue !== undefined) {
      builder.add(syl.from, syl.to, Decoration.mark({
        class: `rhyme-highlight rhyme-hue-${hue}`,
        attributes: {
          'data-rhyme-group': syl.key,
          title: `Rhymes with: ${syl.key}`
        }
      }));
    }
  }
  return builder.finish();
}

/**
 * @param root
 * @param key
 */
function setDimmed (root, key) {
  root.querySelectorAll('.rhyme-highlight').forEach(node => {
    node.classList.toggle('rhyme-dim', node.getAttribute('data-rhyme-group') !== key);
  });
}

/**
 * @param root
 */
function clearDimmed (root) {
  root.querySelectorAll('.rhyme-highlight.rhyme-dim').forEach(node => {
    node.classList.remove('rhyme-dim');
  });
}

export const phoneticRhymeHighlighter = ViewPlugin.fromClass(
  class {
    constructor (view) {
      this.view = view;
      this.decorations = buildRhymeDecorations(view.state.doc);

      this.onMouseOver = (event) => {
        const el = event.target.closest && event.target.closest('.rhyme-highlight');
        if (!el) return;
        setDimmed(view.contentDOM, el.getAttribute('data-rhyme-group'));
      };
      this.onMouseOut = (event) => {
        const el = event.target.closest && event.target.closest('.rhyme-highlight');
        if (!el) return;
        clearDimmed(view.contentDOM);
      };
      view.contentDOM.addEventListener('mouseover', this.onMouseOver);
      view.contentDOM.addEventListener('mouseout', this.onMouseOut);

      // Fire-and-forget load of CMU dict; remeasure once loaded
      ensureCmuDictLoaded().then(() => {
        this.decorations = buildRhymeDecorations(view.state.doc);
        view.requestMeasure();
      });
    }

    update (update) {
      if (update.docChanged) { this.decorations = buildRhymeDecorations(update.state.doc); }
    }

    destroy () {
      this.view.contentDOM.removeEventListener('mouseover', this.onMouseOver);
      this.view.contentDOM.removeEventListener('mouseout', this.onMouseOut);
    }
  },
  {
    decorations: v => v.decorations
  }
);
