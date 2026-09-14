/**
 * @class RhymrShell
 * @classdesc Root shell for the web preview: a single-window IDE layout
 * (toolbar, editor, bottom-docked tool panel, status bar) styled after the
 * real Rhymr app, replacing the old Windows-XP "personal web desktop".
 * @augments HTMLElement
 */
export default class RhymrShell extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: 'open' });

  dockOpen = true;

  connectedCallback () {
    this.render();
    this.addEventListeners();
  }

  render () {
    this.shadowRoot.innerHTML = this.getStyles();

    const shell = document.createElement('div');
    shell.className = 'shell';
    shell.innerHTML = `
      <div class="toolbar">
        <span class="toolbar__label">Rhymr &mdash; demo.txt</span>
        <div class="toolbar__spacer"></div>
        <button class="toolbar__btn" id="dock-toggle" type="button"
                aria-pressed="true" aria-label="Toggle Rhyme Search" title="Rhyme Search">
          <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.4">
            <rect x="1.5" y="1.5" width="13" height="13" rx="1"></rect>
            <path d="M1.5 10.5h13"></path>
          </svg>
          <span>Rhyme Search</span>
        </button>
      </div>
      <div class="main">
        <div class="editor-host" id="editor-host">
          <p class="editor-host__placeholder">Loading editor&hellip;</p>
        </div>
        <div class="dock" id="dock"></div>
      </div>
      <div class="statusbar">
        <span class="statusbar__item" id="status-words">0 words</span>
        <span class="statusbar__item" id="status-syllables">0 syllables</span>
        <div class="toolbar__spacer"></div>
        <span class="statusbar__item" id="status-cursor">1:1</span>
      </div>
    `;

    this.shadowRoot.appendChild(shell);

    this.shell = shell;
    this.editorHost = shell.querySelector('#editor-host');
    this.dock = shell.querySelector('#dock');
    this.dockToggle = shell.querySelector('#dock-toggle');
    this.statusWords = shell.querySelector('#status-words');
    this.statusSyllables = shell.querySelector('#status-syllables');
    this.statusCursor = shell.querySelector('#status-cursor');
  }

  addEventListeners () {
    this.dockToggle.addEventListener('click', () => this.toggleDock());
  }

  toggleDock (open = !this.dockOpen) {
    this.dockOpen = open;
    this.dock.classList.toggle('dock--open', open);
    this.dockToggle.setAttribute('aria-pressed', String(open));
  }

  getStyles () {
    return `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          font-family: var(--ui-font-family);
          color: var(--text);
        }

        .shell {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          background: var(--bg);
        }

        .toolbar {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: .5rem;
          height: 38px;
          padding: 0 .6rem;
          background: var(--panel);
          border-bottom: 1px solid var(--border);
        }

        .toolbar__label {
          font-family: var(--mono-font-family);
          font-size: .78rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .toolbar__spacer { flex: 1 1 auto; }

        .toolbar__btn {
          display: inline-flex;
          align-items: center;
          gap: .4rem;
          font-family: inherit;
          font-size: .78rem;
          color: var(--text);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--radius);
          padding: .3rem .5rem;
          cursor: pointer;
        }
        .toolbar__btn svg { width: 14px; height: 14px; flex-shrink: 0; }
        .toolbar__btn:hover { background: var(--bg); border-color: var(--border); }
        .toolbar__btn[aria-pressed="true"] { color: var(--text-bright); background: var(--bg); border-color: var(--border); }
        .toolbar__btn:focus-visible { outline: 2px solid var(--selection); outline-offset: -2px; }

        .main {
          flex: 1 1 auto;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .editor-host {
          flex: 1 1 auto;
          min-height: 0;
          overflow: hidden;
          background: var(--bg);
        }

        .editor-host__placeholder {
          margin: 1rem;
          font-family: var(--mono-font-family);
          font-size: .82rem;
          color: var(--text-muted);
        }

        .dock {
          flex: 0 0 0;
          min-height: 0;
          overflow: hidden;
          background: var(--panel);
          border-top: 1px solid var(--border);
          transition: flex-basis var(--dock-transition, 140ms ease);
        }
        .dock--open {
          flex-basis: min(38%, 320px);
        }

        @media (max-width: 640px) {
          .dock--open { flex-basis: min(50%, 280px); }
          .toolbar__btn span { display: none; }
        }

        .statusbar {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 1rem;
          height: 24px;
          padding: 0 .6rem;
          background: var(--panel);
          border-top: 1px solid var(--border);
          font-family: var(--mono-font-family);
          font-size: .72rem;
          color: var(--text-muted);
        }

        @media (prefers-reduced-motion: reduce) {
          .dock { transition-duration: .001ms; }
        }
      </style>
    `;
  }
}

customElements.define('rhymr-shell', RhymrShell);
