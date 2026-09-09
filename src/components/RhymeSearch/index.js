import DesktopWindow from '../base/DesktopWindow/index.js';
import { getPerfectRhymes, getNearRhymes, getPhrases, getNames } from './datamuse.js';

export default class RhymeSearch extends DesktopWindow {
  static get tagName () {
    return 'rhyme-search';
  }

  constructor () {
    super({
      title: 'Rhyme Search',
      resizable: true
    });
    this._wordsList = null;
    this._wordsListLoading = null;
    this._currentResults = [];
    this._currentPage = 1;
    this._resultsPerPage = 15;
  }

  connectedCallback () {
    super.connectedCallback();
    // Set initial and minimum window size
    if (!this.style.width) {
      this.style.width = '380px';
    }
    if (!this.style.height) {
      this.style.height = '520px';
    }
    this.style.minWidth = '380px';
    this.style.minHeight = '520px';
    this.style.maxWidth = '560px';
    this.style.maxHeight = '760px';

    // Set dark mode background like Paper Editor
    const body = this.shadowRoot.querySelector('.window__body');
    body.style.cssText = `
      margin: 0;
      padding: 0;
      display: flex;
      flex-direction: column;
      background: #1e1e1e;
      color: #fff;
      height: 100%;
      width: 100%;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
    `;

    this.renderSearchUI();
    this.addSearchHandlers();
  }

  renderSearchUI () {
    const style = document.createElement('style');
    style.textContent = `
      .search-wrap {
        display: flex;
        flex-direction: column;
        height: 100%;
        overflow: hidden;
      }
      .search-header {
        flex: 0 0 auto;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
        background: #1e1e1e;
        border-bottom: 1px solid #333;
      }
      .search-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      .search-bar {
        flex: 1;
        display: flex;
        align-items: center;
        background: #2d2d2d;
        border: 1px solid #444;
        border-radius: 8px;
        padding: 8px 10px;
        gap: 10px;
      }
      .search-bar:focus-within {
        border-color: #666;
      }
      .search-input {
        flex: 1;
        font-size: inherit;
        border: none;
        outline: none;
        background: transparent;
        color: #fff;
        padding: 0;
      }
      .search-input::placeholder {
        color: #888;
      }
      .search-icon-btn {
        width: 16px;
        height: 16px;
        flex-shrink: 0;
        opacity: 0.6;
      }
      .results-container {
        flex: 1;
        overflow-y: auto;
        padding: 8px 16px 16px;
        background: #1e1e1e;
        scrollbar-width: none;
        -ms-overflow-style: none;
      }
      .results-container::-webkit-scrollbar {
        display: none;
        width: 0;
        height: 0;
      }
      .pagination {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 12px;
        padding: 16px;
        border-top: 1px solid #333;
      }
      .pagination-btn {
        background: #2d2d2d !important;
        border: 1px solid #444 !important;
        color: #fff;
        padding: 8px 16px;
        border-radius: 4px;
        cursor: pointer;
        font-size: inherit;
        transition: background 0.2s;
      }
      .pagination-btn:hover:not(:disabled) {
        background: #3d3d3d;
      }
      .pagination-btn:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
      .pagination-info {
        color: #888;
        font-size: inherit;
      }
      .result-item {
        padding: 12px 0;
        border-bottom: 1px solid #333;
        cursor: pointer;
      }
      .result-item:hover {
        background: #2a2a2a;
        margin: 0 -16px;
        padding-left: 16px;
        padding-right: 16px;
      }
      .result-word {
        font-size: inherit;
        color: #fff;
        font-weight: 500;
        margin-bottom: 4px;
      }
      .result-meta {
        font-size: inherit;
        color: #888;
        display: flex;
        gap: 8px;
        align-items: center;
      }
      .result-type {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 3px;
        background: #333;
        color: #aaa;
        font-size: inherit;
      }
      .result-score {
        color: #666;
      }
      .empty-state {
        color: #888;
        padding: 24px;
        text-align: center;
        font-size: inherit;
      }
      .loading-state {
        color: #888;
        padding: 24px;
        text-align: center;
        font-size: inherit;
      }
    `;

    const container = document.createElement('div');
    container.className = 'search-wrap';
    container.innerHTML = `
      <div class="search-header">
        <img src="assets/images/desktop-icons/website.png" alt="Rhyme Search" class="search-icon" />
        <form id="search-form" class="search-bar" autocomplete="off">
          <input id="search-input" class="search-input" type="text" placeholder="Type a word to search for rhymes" />
          <svg class="search-icon-btn" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </form>
      </div>
      <div id="results-container" class="results-container">
<!--        <div class="empty-state">Type a word to search for rhymes</div>-->
      </div>
      <div id="pagination" class="pagination" style="display: none;">
        <button id="prev-btn" class="pagination-btn">Previous</button>
        <span id="pagination-info" class="pagination-info"></span>
        <button id="next-btn" class="pagination-btn">Next</button>
      </div>
    `;

    this.shadowRoot.appendChild(style);
    this.body.appendChild(container);
  }

  addSearchHandlers () {
    const form = this.shadowRoot.getElementById('search-form');
    const input = this.shadowRoot.getElementById('search-input');
    const resultsContainer = this.shadowRoot.getElementById('results-container');
    const pagination = this.shadowRoot.getElementById('pagination');
    const prevBtn = this.shadowRoot.getElementById('prev-btn');
    const nextBtn = this.shadowRoot.getElementById('next-btn');
    const paginationInfo = this.shadowRoot.getElementById('pagination-info');

    const renderResults = () => {
      const start = (this._currentPage - 1) * this._resultsPerPage;
      const end = start + this._resultsPerPage;
      const pageResults = this._currentResults.slice(start, end);
      const totalPages = Math.ceil(this._currentResults.length / this._resultsPerPage);

      if (pageResults.length === 0) {
        resultsContainer.innerHTML = '<div class="empty-state">No results found</div>';
        pagination.style.display = 'none';
        return;
      }

      const resultsHTML = pageResults.map(({ word, score, type }) => {
        return `
          <div class="result-item">
            <div class="result-word">${word}</div>
            <div class="result-meta">
              <span class="result-type">${type}</span>
              <span class="result-score">Score: ${score}</span>
            </div>
          </div>
        `;
      }).join('');

      resultsContainer.innerHTML = resultsHTML;

      // Add click handlers to result items
      resultsContainer.querySelectorAll('.result-item').forEach(item => {
        item.addEventListener('click', () => {
          const word = item.querySelector('.result-word').textContent;
          const url = `https://www.rhymezone.com/r/rhyme.cgi?Word=${encodeURIComponent(word)}&typeofrhyme=perfect`;
          window.open(url, '_blank', 'noopener');
        });
      });

      // Update pagination
      if (totalPages > 1) {
        pagination.style.display = 'flex';
        paginationInfo.textContent = `Page ${this._currentPage} of ${totalPages}`;
        prevBtn.disabled = this._currentPage === 1;
        nextBtn.disabled = this._currentPage === totalPages;
      } else {
        pagination.style.display = 'none';
      }
    };

    const performSearch = async (q) => {
      const query = (q || '').trim();
      if (!query) {
        resultsContainer.innerHTML = '<div class="empty-state">Type a word to search for rhymes</div>';
        pagination.style.display = 'none';
        this._currentResults = [];
        this._currentPage = 1;
        return;
      }

      resultsContainer.innerHTML = '<div class="loading-state">Searching...</div>';
      pagination.style.display = 'none';

      try {
        const [perfect, near, phrases, names] = await Promise.all([
          getPerfectRhymes(query),
          getNearRhymes(query),
          getPhrases(query),
          getNames(query)
        ]);

        const formatItem = (item, type) => ({
          word: item.word,
          score: item.score || 0,
          type
        });

        const items = [
          ...perfect.map(i => formatItem(i, 'Perfect')),
          ...near.map(i => formatItem(i, 'Near')),
          ...phrases.map(i => formatItem(i, 'Phrase')),
          ...names.map(i => formatItem(i, 'Name'))
        ];

        items.sort((a, b) => b.score - a.score || a.word.localeCompare(b.word));

        this._currentResults = items;
        this._currentPage = 1;
        renderResults();
      } catch (e) {
        resultsContainer.innerHTML = '<div class="empty-state">Error fetching results. Please try again.</div>';
        pagination.style.display = 'none';
        // eslint-disable-next-line no-console
        console.error(e);
      }
    };

    prevBtn.addEventListener('click', () => {
      if (this._currentPage > 1) {
        this._currentPage--;
        renderResults();
        resultsContainer.scrollTop = 0;
      }
    });

    nextBtn.addEventListener('click', () => {
      const totalPages = Math.ceil(this._currentResults.length / this._resultsPerPage);
      if (this._currentPage < totalPages) {
        this._currentPage++;
        renderResults();
        resultsContainer.scrollTop = 0;
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      performSearch(input.value);
    });

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        input.value = '';
        resultsContainer.innerHTML = '<div class="empty-state">Type a word to search for rhymes</div>';
      }
    });

    // Auto-focus the input
    input.focus();
  }

  /**
   * Creates the control panel for the chat application.
   * @returns {HTMLElement} The control panel element.
   */
  createControlPanel () {
    const controlPanel = document.createElement('div');
    controlPanel.classList.add('window__control-panel');

    controlPanel.innerHTML = `
        <div class="window__dropdown">
          <div class="window__dropdown-activator">Type</div>
          <div class="window__dropdown-content">
            <div class="window__dropdown-choice">A</div>
            <div class="window__dropdown-choice">B</div>
            <div class="window__dropdown-choice">C</div>
          </div>
        </div>
        <div class="window__dropdown">
          <div class="window__dropdown-activator">Filter</div>
          <div class="window__dropdown-content">
            <div class="window__dropdown-choice">A</div>
            <div class="window__dropdown-choice">B</div>
            <div class="window__dropdown-choice">C</div>
          </div>
        </div>
      `;

    return controlPanel;
  }

  async getRandomWordFromList () {
    try {
      const words = await this.getWordsList();
      if (!Array.isArray(words) || words.length === 0) return null;
      const idx = Math.floor(Math.random() * words.length);
      const pick = words[idx];
      if (typeof pick === 'string') return pick;
      if (pick && typeof pick.word === 'string') return pick.word;
      return null;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to get random word', e);
      return null;
    }
  }

  async getWordsList () {
    if (this._wordsList) return this._wordsList;
    if (this._wordsListLoading) return this._wordsListLoading;

    const tryPaths = ['words.json', './words.json'];
    this._wordsListLoading = (async () => {
      for (const p of tryPaths) {
        try {
          const res = await fetch(p);
          if (res.ok) {
            const data = await res.json();
            this._wordsList = data;
            return data;
          }
        } catch (_) { /* ignore and try next */ }
      }
      this._wordsList = [];
      return this._wordsList;
    })();
    return this._wordsListLoading;
  }
}

// Register with the browser so PersonalWebDesktop can spawn it
customElements.define(RhymeSearch.tagName, RhymeSearch);
