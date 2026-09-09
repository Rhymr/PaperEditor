# Paper Editor

An earlier, browser-based build of [Rhymr](https://github.com/Rhymr/WinMac)'s
editor. It runs the core writing tools — live rhyme highlighting, a syllable
gutter and Datamuse rhyme search — inside a small "personal web desktop" shell
(draggable windows, a taskbar, a settings page).

It is **not** the full app. No projects or file tree, no built-in version
control, no themes, no offline pronunciation resolver. The real Rhymr is the
Rust + GTK4 desktop application in [`Rhymr/WinMac`](https://github.com/Rhymr/WinMac);
this build is kept alive only to power the **Try online** preview on the Rhymr
site.

**Live:** <https://rhymr.github.io/PaperEditor/>

## What's inside

- **Editor** — CodeMirror 6 with custom extensions under
  `src/components/PaperEditor/codemirror/`:
  - `rhymeHighlighter.js` — colours rhyming words as you type
  - `syllableCounter.js` / `syllableGutter.js` — per-line syllable counts in the gutter
  - `wordsCount.js` — live word count
  - `completions.js` — word autocompletion
- **Rhyme Search** (`src/components/RhymeSearch/`) — Datamuse-backed lookups,
  grouped results.
- **Desktop shell** (`src/components/base/`) — `PersonalWebDesktop`,
  `DesktopWindow`, `DesktopGrid`, `DesktopIcon`, `DesktopTaskbar`.
- **Settings** and **File History** panels.
- Pronunciation/phonetics from `cmu-pronouncing-dictionary` and
  `double-metaphone`; a bundled word list in `src/public/words.json`.

## Develop

```bash
npm install
npm run dev      # vite dev server
npm run build    # -> build/   (Vite, root: src, base: './')
npm run serve    # preview the build
npm run lint     # htmlhint + stylelint + eslint
```

Asset paths are document-relative and `base` is `'./'`, so a build can be
mounted at any sub-path (the Rhymr site serves it under `/demo/app/`).

## Licence

See `LICENSE`. Bundled third-party data (CMU Pronouncing Dictionary, word list)
is under its own terms.
