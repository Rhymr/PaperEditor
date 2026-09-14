import { getPerfectRhymes, getNearRhymes, getPhrases, getNames } from '../RhymeSearch/datamuse.js';

/**
 * @class RhymeSearchPanel
 * @classdesc Bottom-docked Rhyme Search tool panel — a Datamuse-backed
 * rhyme lookup, styled after the real app's dock tool windows instead of
 * the old floating XP window.
 * @augments HTMLElement
 */
export default class RhymeSearchPanel extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: 'open' });

  currentResults = [];
  currentPage = 1;
  resultsPerPage = 12;

  connectedCallback () {
    this.render();
    this.addEventListeners();
  }

  render () {
    this.shadowRoot.innerHTML = this.getStyles();

    const panel = document.createElement('div');
    panel.className = 'panel';
    panel.innerHTML = `
      <div class="panel__header">
        <span class="panel__title">Rhyme Search</span>
        <form id="search-form" class="search-bar" autocomplete="off">
          <svg class="search-bar__icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
          <input id="search-input" class="search-bar__input" type="text"
                 placeholder="Type a word to search for rhymes" aria-label="Search for rhymes">
        </form>
      </div>
      <div id="results" class="results" role="list">
        <p class="empty-state">Type a word to search for rhymes.</p>
      </div>
      <div id="pagination" class="pagination" hidden>
        <button id="prev-btn" class="pagination__btn" type="button">&larr; Prev</button>
        <span id="pagination-info" class="pagination__info"></span>
        <button id="next-btn" class="pagination__btn" type="button">Next &rarr;</button>
      </div>
    `;

    this.shadowRoot.appendChild(panel);

    this.form = panel.querySelector('#search-form');
    this.input = panel.querySelector('#search-input');
    this.results = panel.querySelector('#results');
    this.pagination = panel.querySelector('#pagination');
    this.paginationInfo = panel.querySelector('#pagination-info');
    this.prevBtn = panel.querySelector('#prev-btn');
    this.nextBtn = panel.querySelector('#next-btn');
  }

  addEventListeners () {
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.performSearch(this.input.value);
    });

    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.input.value = '';
        this.showEmpty('Type a word to search for rhymes.');
      }
    });

    this.prevBtn.addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.renderResults();
      }
    });

    this.nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(this.currentResults.length / this.resultsPerPage);
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.renderResults();
      }
    });
  }

  showEmpty (message) {
    this.results.innerHTML = `<p class="empty-state">${message}</p>`;
    this.pagination.hidden = true;
    this.currentResults = [];
    this.currentPage = 1;
  }

  async performSearch (raw) {
    const query = (raw || '').trim();
    if (!query) {
      this.showEmpty('Type a word to search for rhymes.');
      return;
    }

    this.results.innerHTML = '<p class="loading-state">Searching&hellip;</p>';
    this.pagination.hidden = true;

    try {
      const [perfect, near, phrases, names] = await Promise.all([
        getPerfectRhymes(query),
        getNearRhymes(query),
        getPhrases(query),
        getNames(query)
      ]);

      const formatItem = (item, type) => ({ word: item.word, score: item.score || 0, type });
      const items = [
        ...perfect.map(i => formatItem(i, 'Perfect')),
        ...near.map(i => formatItem(i, 'Near')),
        ...phrases.map(i => formatItem(i, 'Phrase')),
        ...names.map(i => formatItem(i, 'Name'))
      ];
      items.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));

      this.currentResults = items;
      this.currentPage = 1;
      this.renderResults();
    } catch (e) {
      this.results.innerHTML = '<p class="empty-state">Couldn&rsquo;t reach Datamuse. Check your connection and try again.</p>';
      this.pagination.hidden = true;
      // eslint-disable-next-line no-console
      console.error(e);
    }
  }

  renderResults () {
    const start = (this.currentPage - 1) * this.resultsPerPage;
    const pageResults = this.currentResults.slice(start, start + this.resultsPerPage);
    const totalPages = Math.ceil(this.currentResults.length / this.resultsPerPage);

    if (pageResults.length === 0) {
      this.showEmpty('No results found.');
      return;
    }

    this.results.innerHTML = pageResults.map(({ word, score, type }) => `
      <a class="result" role="listitem" href="https://www.rhymezone.com/r/rhyme.cgi?Word=${encodeURIComponent(word)}&typeofrhyme=perfect"
         target="_blank" rel="noopener">
        <span class="result__word">${word}</span>
        <span class="result__type">${type}</span>
        <span class="result__score">${score}</span>
      </a>
    `).join('');

    if (totalPages > 1) {
      this.pagination.hidden = false;
      this.paginationInfo.textContent = `Page ${this.currentPage} of ${totalPages}`;
      this.prevBtn.disabled = this.currentPage === 1;
      this.nextBtn.disabled = this.currentPage === totalPages;
    } else {
      this.pagination.hidden = true;
    }
  }

  getStyles () {
    return `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          font-family: var(--ui-font-family);
        }

        .panel {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        .panel__header {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: .6rem;
          padding: .5rem .6rem;
          border-bottom: 1px solid var(--border);
        }

        .panel__title {
          font-family: var(--mono-font-family);
          font-size: .72rem;
          font-weight: 500;
          letter-spacing: .06em;
          text-transform: uppercase;
          color: var(--text-muted);
          flex-shrink: 0;
        }

        .search-bar {
          flex: 1 1 auto;
          display: flex;
          align-items: center;
          gap: .45rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: .35rem .55rem;
        }
        .search-bar:focus-within { border-color: var(--selection); }
        .search-bar__icon { width: 14px; height: 14px; flex-shrink: 0; color: var(--text-muted); }
        .search-bar__input {
          flex: 1 1 auto;
          min-width: 0;
          border: none;
          outline: none;
          background: transparent;
          color: var(--text);
          font: inherit;
          font-size: .82rem;
        }
        .search-bar__input::placeholder { color: var(--text-muted); }

        .results {
          flex: 1 1 auto;
          min-height: 0;
          overflow-y: auto;
          padding: .25rem .4rem;
        }

        .result {
          display: flex;
          align-items: baseline;
          gap: .6rem;
          padding: .4rem .5rem;
          border-radius: var(--radius);
          text-decoration: none;
          color: inherit;
        }
        .result:hover, .result:focus-visible { background: var(--panel-2); }
        .result:focus-visible { outline: 2px solid var(--selection); outline-offset: -2px; }
        .result__word {
          font-size: .88rem;
          color: var(--text-bright);
          font-weight: 600;
        }
        .result__type {
          font-family: var(--mono-font-family);
          font-size: .68rem;
          color: var(--text-muted);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: .05rem .35rem;
        }
        .result__score {
          margin-left: auto;
          font-family: var(--mono-font-family);
          font-size: .72rem;
          color: var(--text-muted);
        }

        .empty-state, .loading-state {
          padding: 1.5rem 1rem;
          text-align: center;
          font-size: .82rem;
          color: var(--text-muted);
        }

        .pagination {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: .5rem;
          padding: .4rem .6rem;
          border-top: 1px solid var(--border);
          font-family: var(--mono-font-family);
          font-size: .72rem;
          color: var(--text-muted);
        }
        .pagination__btn {
          font: inherit;
          color: var(--text);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: .3rem .55rem;
          cursor: pointer;
        }
        .pagination__btn:hover:not(:disabled) { background: var(--panel-2); }
        .pagination__btn:disabled { opacity: .4; cursor: not-allowed; }
        .pagination__btn:focus-visible { outline: 2px solid var(--selection); outline-offset: -2px; }
      </style>
    `;
  }
}

customElements.define('rhyme-search-panel', RhymeSearchPanel);
