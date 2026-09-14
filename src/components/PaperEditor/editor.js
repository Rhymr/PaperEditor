import { basicSetup } from 'codemirror';
import { EditorView } from '@codemirror/view';
import { EditorState } from '@codemirror/state';
import { autocompletion } from '@codemirror/autocomplete';
import { rhymrEditorTheme } from './theme.js';
import { syllableCounter, syllableCountCache } from './codemirror/syllableGutter.js';
import { englishCompletions } from './codemirror/completions.js';
import { phoneticRhymeHighlighter, rhymeHighlightTheme } from './codemirror/rhymeHighlighter.js';

const SAMPLE_DOC = `Stars are burning through the night,
Chasing shadows toward the light,
Every step feels wrong or right,
Nothing here is black or white.

Waves are rolling with the sound,
Echoes chasing what we found,
Feet are steady on the ground,
Time keeps spinning round and round.
`;

/**
 * Mounts the CodeMirror 6 editor into `host` with Rhymr's rhyme
 * highlighting, syllable gutter and autocompletion wired in.
 * @param {HTMLElement} host - Element to mount the editor into.
 * @returns {EditorView} The created editor view.
 */
export function createEditor (host) {
  const state = EditorState.create({
    doc: SAMPLE_DOC,
    extensions: [
      basicSetup,
      rhymrEditorTheme,
      EditorView.lineWrapping,
      EditorView.contentAttributes.of({ spellcheck: 'true', autocapitalize: 'off', autocorrect: 'off' }),
      autocompletion({ override: [englishCompletions] }),
      syllableCounter(),
      EditorView.updateListener.of(update => {
        if (update.docChanged && update.changes.length > 10) {
          syllableCountCache.clear();
        }
      }),
      rhymeHighlightTheme,
      phoneticRhymeHighlighter
    ]
  });

  const view = new EditorView({ state, parent: host });
  view.focus();
  return view;
}
