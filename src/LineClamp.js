const triggerEvent = (instance, type) => {
  instance.element.dispatchEvent(new CustomEvent(type));
};

/**
 * Reduces font size or trims text to make it fit within specified bounds.
 *
 * @todo test non left-to-right text
 * @todo Account for characters that cause tall lines (emojis, Zalgot text)
 * @todo Function with HTML nodes? Hard. Only maybe doable.
 *
 * @property
 */
export default class LineClamp {
  /**
   * @param {HTMLElement} element
   * The element to clamp.
   *
   * @param {Object} [options]
   * Options for the behavior of the line clamp.
   *
   * @param {number} [options.maxLines]
   * The maximum number of lines to allow. Defaults to 1.
   * To set a maximum height instead, use {@see maxHeight}
   *
   * @param {number} [options.maxHeight]
   * The maximum height (in pixels) of text in an element.
   * This option is undefined by default. Once set, it takes precedent over
   * {@see maxLines}.
   *
   * @param {boolean} [options.useSoftClamp]
   * If true, try reducing font size before trimming text.
   *
   * @param {string} [options.ellipsis]
   * The character with which to represent clipped trailing text.
   * This option takes effect when "hard" clamping is used.
   *
   * @param {number} [options.minFontSize]
   * The lowest font size to try before resorting to removing trailing text
   * (hard clamping). Defaults to 1.
   *
   * @param {number} [options.maxFontSize]
   * The max font size. We'll start with this font size then reduce until
   * text fits constraints, or font size is equal to {@see minFontSize}.
   */
  constructor(element, {
    maxLines = 1,
    maxHeight = undefined,
    useSoftClamp = true,
    minFontSize = 1,
    maxFontSize = undefined,
    ellipsis = '…',
  } = {}) {
    Object.defineProperty(this, 'originalWords', {
      writable: false,
      value:    element.textContent.split(/\s+/),
    });

    Object.defineProperty(this, 'updateHandler', {
      writable: false,
      value:    () => this.clamp(),
    });

    Object.defineProperty(this, 'observer', {
      writable: false,
      value:    new MutationObserver(this.updateHandler),
    });

    this.element = element;

    const style = this.computedStyle;

    this.maxLines = maxLines;
    this.maxHeight = maxHeight;

    if (undefined === maxFontSize) {
      maxFontSize = parseInt(style.fontSize, 10);
    }

    this.useSoftClamp = useSoftClamp;
    this.minFontSize = minFontSize;
    this.maxFontSize = maxFontSize;
    this.ellipsis = ellipsis;
  }

  /**
   * @returns {CSSStyleDeclaration}
   */
  get computedStyle() {
    return window.getComputedStyle(this.element);
  }

  /**
   * @returns {TextMetrics}
   */
  get textMetrics() {
    return this.whileMeasuring(element => {
      const originalHtml = element.innerHTML;
      const heightWithText = element.offsetHeight;

      element.innerHTML = '';
      const heightWithoutText = element.offsetHeight;
      const textHeight = heightWithText - heightWithoutText;

      // Fill element with single non-breaking space to find height of one line
      element.innerHTML = '&nbsp;';

      // Get height of element with only one line of text
      const heightWithOneLine = element.offsetHeight;
      const firstLineHeight = heightWithOneLine === heightWithoutText
        ? heightWithOneLine
        : heightWithOneLine - heightWithoutText;

      // Add another line
      element.innerHTML += '<br>&nbsp;';

      const additionalLineHeight = element.offsetHeight - heightWithOneLine;
      const lineCount = 1 + (heightWithText - heightWithOneLine) / additionalLineHeight;

      // Restore original content
      element.innerHTML = originalHtml;

      /**
       * @typedef {Object} TextMetrics
       *
       * @property {heightWithText}
       * The height of the element with its current text contents.
       *
       * @property {heightWithoutText}
       * The height of the element without any text.
       *
       * @property {textHeight}
       * The vertical space taken up by text.
       *
       * @property {heightWithOneLine}
       * The height of the element with only one line of text and without
       * minimum or maximum heights.

       * @property {firstLineHeight}
       * The height of the first line of text. This is the height of the element when
       * it contains only one line of text.

       * @property {additionalLineHeight}
       * The height that each line of text after the first adds to the element.
       *
       * @property {lineCount}
       * The number of lines of text the element contains.
       */
      return {
        heightWithText,
        heightWithoutText,
        textHeight,
        heightWithOneLine,
        firstLineHeight,
        additionalLineHeight,
        lineCount
      };
    });
  }

  /**
   * Watch for changes that may affect layout and reclamp if necessary.
   */
  watch() {
    if (!this._watching) {
      window.addEventListener('resize', this.updateHandler);

      // Minimum required to detect changes to text nodes,
      // and wholesale replacement via innerHTML
      this.observer.observe(this.element, {
        characterData: true,
        subtree:       true,
        childList:     true,
        attributes:    true,
      });

      this._watching = true;
    }

    return this;
  }

  /**
   * Stop watching for layout changes.
   *
   * @returns {LineClamp}
   */
  unwatch() {
    this.observer.disconnect();
    window.removeEventListener('resize', this.updateHandler);

    this._watching = false;
    return this;
  }

  /**
   * Conduct either soft clamping or hard clamping, according to the value of
   * property {@see useSoftClamp}.
   */
  clamp() {
    if (this.element.offsetHeight) {
      const previouslyWatching = this._watching;

      // Ignore internally started mutations, lest we recurse into oblivion
      this.unwatch();

      if (this.useSoftClamp) {
        this.softClamp();
      }
      else {
        this.hardClamp();
      }

      // Resume observation if previously watching
      if (previouslyWatching) {
        this.watch(false);
      }
    }

    return this;
  }

  /**
   * Trims text until it fits within constraints.
   */
  hardClamp() {
    if (this.shouldClamp()) {
      for (let i = 0, len = this.originalWords.length; i < len; ++i) {
        let currentText = this.originalWords.slice(0, i).join(' ');
        this.element.textContent = currentText;

        if (this.shouldClamp()) {
          do {
            currentText = currentText.slice(0, -1);
            this.element.innerHTML = currentText + this.ellipsis;
          }
          while (this.shouldClamp());

          break;
        }
      }

      triggerEvent(this, 'lineclamp.hardClamp');
      triggerEvent(this, 'lineclamp.clamp');
    }

    this.element.style.removeProperty('min-height');

    return this;
  }

  /**
   * Reduces font size until the text fits within the specified number of lines.
   * If it still doesn't fit, resorts to using {@see hardClamp()}.
   */
  softClamp() {
    this.element.style.fontSize = '';

    if (this.shouldClamp()) {
      let done = false;

      for (let i = this.maxFontSize; i >= this.minFontSize; --i) {
        this.element.style.fontSize = `${i}px`;
        if (!this.shouldClamp()) {
          done = true;

          break;
        }
      }

      triggerEvent(this, 'lineclamp.softClamp');

      if (!done) {
        this.hardClamp();
      }
      else {
        triggerEvent(this, 'lineclamp.clamp');
      }
    }

    return this;
  }

  shouldClamp() {
    const {lineCount, heightWithText} = this.textMetrics;

    if (undefined !== this.maxHeight) {
      return heightWithText > this.maxHeight;
    }

    if (this.maxLines) {
      return lineCount > this.maxLines;
    }

    throw new Error('maxLines or maxHeight must be set before calling shouldClamp().');
  }

  /**
   * @param callback
   * @returns {*}
   * @private
   */
  whileMeasuring(callback) {
    const previouslyWatching = this._watching;
    const oldStyles = this.element.style.cssText;
    const newStyles = 'min-height:0!important;max-height:none!important';

    // Unwatch before beginning our own mutations, lest we recurse
    this.unwatch();

    // Append, don't replace
    this.element.style.cssText += ';' + newStyles;

    // Execute callback while reliable measurements can be made
    const returnValue = callback(this.element);
    this.element.style.cssText = oldStyles;

    if (previouslyWatching) {
      this.watch(false);
    }

    return returnValue;
  }
}
