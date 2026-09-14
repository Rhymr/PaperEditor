import { EditorView } from '@codemirror/view';

/**
 * CodeMirror theme built entirely from the shared design tokens
 * (src/styles/tokens.css) so the editor tracks the same Darcula /
 * IntelliJ-Light palette as the rest of the shell, in both themes, with
 * no separate light/dark theme object to keep in sync.
 */
export const rhymrEditorTheme = EditorView.theme({
  '&': {
    height: '100%',
    backgroundColor: 'var(--bg)',
    color: 'var(--text)',
    fontSize: '14px'
  },
  '&.cm-focused': {
    outline: 'none'
  },
  '.cm-scroller': {
    fontFamily: 'var(--mono-font-family)',
    lineHeight: '1.7'
  },
  '.cm-content': {
    caretColor: 'var(--text-bright)',
    padding: '10px 0'
  },
  '.cm-line': {
    padding: '0 12px'
  },
  '.cm-cursor, .cm-dropCursor': {
    borderLeftColor: 'var(--text-bright)'
  },
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground, .cm-content ::selection': {
    backgroundColor: 'color-mix(in srgb, var(--selection) 35%, transparent)'
  },
  '.cm-activeLine': {
    backgroundColor: 'color-mix(in srgb, var(--panel) 45%, transparent)'
  },
  '.cm-gutters': {
    backgroundColor: 'var(--panel-2)',
    color: 'var(--text-muted)',
    border: 'none',
    borderRight: '1px solid var(--border)'
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'color-mix(in srgb, var(--panel) 65%, transparent)'
  },
  '.cm-lineNumbers .cm-gutterElement': {
    color: 'var(--text-muted)'
  },
  '.cm-syllableCounter': {
    color: 'var(--syllable)',
    fontFamily: 'var(--mono-font-family)'
  },
  '.cm-tooltip': {
    backgroundColor: 'var(--panel)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius)',
    color: 'var(--text)'
  },
  '.cm-tooltip-autocomplete ul li[aria-selected]': {
    backgroundColor: 'var(--selection)',
    color: 'var(--on-accent)'
  }
});
