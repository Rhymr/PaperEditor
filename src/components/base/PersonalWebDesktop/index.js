/**
 * @class PersonalWebDesktop
 * @classdesc A custom HTML element representing a personal web desktop environment.
 * Manages the creation, positioning, and interaction of desktop windows.
 * @augments HTMLElement
 */
export default class PersonalWebDesktop extends HTMLElement {
  shadowRoot = this.attachShadow({ mode: 'open' });

  lastOpenedX = 30;
  lastOpenedY = 30;
  openedWindows = new Map();
  currentlyFocusedWindow;
  highestZIndex = 1;
  taskbar;

  /**
   * Lifecycle method called when the element is added to the document.
   * Initializes the rendering and event listeners.
   */
  connectedCallback () {
    this.render();
    this.addEventListeners();
  }

  /**
   * Renders the personal web desktop interface.
   * Sets up the main desktop structure and taskbar.
   * @private
   */
  render () {
    this.shadowRoot.innerHTML = this.getStyles();

    const personalWebDesktop = document.createElement('div');
    personalWebDesktop.classList.add('paper-editor-desktop');

    const grid = document.createElement('desktop-grid');
    const desktopTaskbar = document.createElement('desktop-taskbar');
    this.taskbar = desktopTaskbar;

    personalWebDesktop.appendChild(grid);
    personalWebDesktop.appendChild(desktopTaskbar);

    this.shadowRoot.appendChild(personalWebDesktop);
  }

  /**
   * Adds event listeners to the desktop component.
   * Handles interactions like icon double-clicks and window management.
   * @private
   */
  addEventListeners () {
    this.shadowRoot.addEventListener('iconDoubleClick', this.handleIconDoubleClick.bind(this));
    this.shadowRoot.addEventListener('clickTab', this.handleClickTab.bind(this));
    this.shadowRoot.addEventListener('closeWindow', this.handleWindowClose.bind(this));
    this.shadowRoot.addEventListener('mousedown', this.handleWindowClick.bind(this));
  }

  /**
   * Handles window click events to bring the clicked window to the front.
   * @param {Event} event - The mousedown event.
   * @private
   */
  handleWindowClick (event) {
    const windowId = event.target.dataset.windowId;

    if (!windowId) return;

    const targetWindow = this.openedWindows.get(windowId);
    if (this.currentlyFocusedWindow !== targetWindow) {
      this.bringWindowToFront(targetWindow);
    }
  }

  /**
   * Handles window close events to remove the window from the desktop.
   * @param {CustomEvent} event - The closeWindow event.
   * @private
   */
  handleWindowClose (event) {
    const { id } = event.detail;
    const window = this.openedWindows.get(id);

    if (window) {
      window.remove();
      this.openedWindows.delete(id);
    }

    const removeTabEvent = new CustomEvent('removeTab', {
      detail: { id },
      bubbles: false,
      composed: true
    });

    this.taskbar.dispatchEvent(removeTabEvent);
  }

  /**
   * Handles icon double-click events to create and display a new window.
   * @param {CustomEvent} event - The iconDoubleClick event.
   * @private
   */
  handleIconDoubleClick (event) {
    const { windowTitle, windowTag, isResizable } = event.detail;

    const { windowId, desktopWindow } = this.createWindow(windowTitle, windowTag, isResizable);

    if (windowId === null) return;

    this.shadowRoot.appendChild(desktopWindow);
    this.bringWindowToFront(desktopWindow);
    this.positionWindow(desktopWindow);

    const customEvent = new CustomEvent('updateTaskbar', {
      detail: { windowTitle, windowId },
      bubbles: false,
      composed: true
    });

    this.taskbar.dispatchEvent(customEvent);
  }

  /**
   * Handles tab click events to toggle window visibility.
   * @param {CustomEvent} event - The clickTab event.
   * @private
   */
  handleClickTab (event) {
    const { windowId } = event.detail;
    const desktopWindow = this.openedWindows.get(windowId);

    if (!desktopWindow) return;

    const isWindowHidden = desktopWindow.style.display === 'none';
    const isWindowFocused = this.currentlyFocusedWindow === desktopWindow;

    if (isWindowHidden || !isWindowFocused) {
      desktopWindow.style.display = 'block';
      this.bringWindowToFront(desktopWindow);
    } else {
      desktopWindow.style.display = 'none';
    }
  }

  /**
   * Creates a new window element with specified attributes.
   * @param {string} windowTitle - The title of the window.
   * @param {string} tagName - The tag name for the window element.
   * @param {boolean} isResizable - Whether the window is resizable.
   * @returns {object} An object containing the windowId and the desktopWindow element.
   * @private
   */
  createWindow (windowTitle, tagName, isResizable) {
    const desktopWindow = tagName
      ? document.createElement(tagName)
      : document.createElement('desktop-window');
    desktopWindow.setAttribute('title', windowTitle);
    if (isResizable !== undefined) {
      desktopWindow.setAttribute('resizable', isResizable);
    }
    const windowId = this.generateUniqueId();
    desktopWindow.dataset.windowId = windowId;
    this.openedWindows.set(windowId, desktopWindow);

    return { windowId, desktopWindow };
  }

  /**
   * Generates a unique identifier for a window.
   * @returns {string} A unique window ID.
   * @private
   */
  generateUniqueId () {
    return Math.random().toString(36).substring(2, 8);
  }

  /**
   * Positions a window element on the desktop.
   * @param {HTMLElement} element - The window element to position.
   * @private
   */
  positionWindow (element) {
    setTimeout(() => {
      this.lastOpenedX += 20;
      this.lastOpenedY += 28;

      const maxX = window.innerWidth - element.offsetWidth;
      const maxY = window.innerHeight - (32 + element.offsetHeight); // 32 = taskbar height

      if (this.lastOpenedX > maxX) {
        this.lastOpenedX = 50;
      }

      if (this.lastOpenedY > maxY) {
        this.lastOpenedY = 50;
      }

      element.style.left = `${this.lastOpenedX}px`;
      element.style.top = `${this.lastOpenedY}px`;
    }, 0);
  }

  /**
   * Brings a window to the front by increasing its z-index.
   * @param {HTMLElement} desktopWindow - The window element to bring to the front.
   * @private
   */
  bringWindowToFront (desktopWindow) {
    this.currentlyFocusedWindow = desktopWindow;
    this.highestZIndex += 1;
    desktopWindow.style.zIndex = this.highestZIndex;

    const focusEvent = new CustomEvent('windowFocusChange', {
      detail: { focusedWindowId: desktopWindow.dataset.windowId }
    });
    window.dispatchEvent(focusEvent);
  }

  /**
   * Returns the styles for the personal web desktop.
   * @returns {string} The styles as a string.
   * @private
   */
  getStyles () {
    return `
      <style>
        .paper-editor-desktop {
          display: flex;
          flex-direction: column;
          min-width: 800px;
          min-height: 600px;
          width: 100svw;
          height: 100svh;
          overflow: hidden;

          @media (min-device-width: 1920px) {
            background-repeat: no-repeat;
            background-size: cover;
            background-image: url("assets/images/paper_Hd.jpg");
          }

          @media (max-device-width: 1919px) {
            background-repeat: no-repeat;
            background-size: cover;
            background-image: url("assets/images/paper_Hd.jpg");
          }
        }
      </style>
    `;
  }
}

customElements.define('paper-editor-desktop', PersonalWebDesktop);
