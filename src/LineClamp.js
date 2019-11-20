/**
 * Reduces font size or trims text to make it fit within specified bounds.
 *
 * Supports clamping by number of lines or text height.
 *
 * Known limitations:
 * 1. Characters that distort line heights (emojis, zalgo) may cause
 * unexpected results.
 * 2. Calling {@see hardClamp()} wipes child elements. Future updates may allow
 * inline child elements to be preserved.
 *
 * @todo Split text metrics into own library
 * @todo Test non-LTR text
 */
export default class LineClamp {
  /**
   * @param {HTMLElement} element
   * The element to clamp.
   *
   * @param {Object} [options]
   * Options to govern clamping behavior.
   *
   * @param {number} [options.maxLines]
   * The maximum number of lines to allow. Defaults to 1.
   * To set a maximum height instead, use {@see options.maxHeight}
   *
   * @param {number} [options.maxHeight]
   * The maximum height (in pixels) of text in an element.
   * This option is undefined by default. Once set, it takes precedence over
   * {@see options.maxLines}. Note that this applies to the height of the text, not
   * the element itself. Restricting the height of the element can be achieved
   * with CSS <code>max-height</code>.
   *
   * @param {boolean} [options.useSoftClamp]
   * If true, reduce font size (soft clamp) to at least {@see options.minFontSize}
   * before resorting to trimming text. Defaults to false.
   *
   * @param {string} [options.ellipsis]
   * The character with which to represent clipped trailing text.
   * This option takes effect when "hard" clamping is used.
   *
   * @param {number} [options.minFontSize]
   * The lowest font size, in pixels, to try before resorting to removing
   * trailing text (hard clamping). Defaults to 1.
   *
   * @param {number} [options.maxFontSize]
   * The maximum font size in pixels. We'll start with this font size then
   * reduce until text fits constraints, or font size is equal to
   * {@see options.minFontSize}. Defaults to the element's initial computed font size.
   */
  constructor(element, {
    maxLines = 1,
    maxHeight = undefined,
    useSoftClamp = false,
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
      value:    () => this.apply(),
    });

    Object.defineProperty(this, 'observer', {
      writable: false,
      value:    new MutationObserver(this.updateHandler),
    });

    if (undefined === maxFontSize) {
      maxFontSize = parseInt(window.getComputedStyle(element).fontSize, 10);
    }

    this.element = element;
    this.maxLines = maxLines;
    this.maxHeight = maxHeight;
    this.useSoftClamp = useSoftClamp;
    this.minFontSize = minFontSize;
    this.maxFontSize = maxFontSize;
    this.ellipsis = ellipsis;
  }

  /**
   * Gather metrics about the layout of the element's text.
   * This is a somewhat expensive operation - call with care.
   *
   * @returns {TextMetrics}
   * Layout metrics for the clamped element's text.
   */
  calculateTextMetrics() {
    return this.whileMeasuring(element => {
      const originalHtml = element.innerHTML;
      const naturalHeight = element.offsetHeight;

      // Remove all content so we can measure the element's height
      element.innerHTML = '';

      const naturalHeightWithoutText = element.offsetHeight;
      const textHeight = naturalHeight - naturalHeightWithoutText;

      // Fill element with single non-breaking space to find height of one line
      element.innerHTML = '&nbsp;';

      // Get height of element with only one line of text
      const naturalHeightWithOneLine = element.offsetHeight;
      const firstLineHeight = naturalHeightWithOneLine - naturalHeightWithoutText;

      // Add another line
      element.innerHTML += '<br>&nbsp;';

      const additionalLineHeight = element.offsetHeight - naturalHeightWithOneLine;
      const lineCount = 1 + (
        (naturalHeight - naturalHeightWithOneLine) / additionalLineHeight
      );

      // Restore original content
      element.innerHTML = originalHtml;

      /**
       * @typedef {Object} TextMetrics
       *
       * @property {textHeight}
       * The vertical space required to display the element's current text.
       * This is <em>not</em> necessarily the same as the height of the element.
       * This number may even be greater than the element's height in cases
       * where the text overflows the element's block axis.
       *
       * @property {naturalHeightWithOneLine}
       * The height of the element with only one line of text and without
       * minimum or maximum heights. This information may be helpful when
       * dealing with inline elements (and potentially other scenarios), where
       * the first line of text does not increase the element's height.
       *
       * @property {firstLineHeight}
       * The height that the first line of text adds to the element, i.e., the
       * difference between the height of the element while empty and the height
       * of the element while it contains one line of text. This number may be
       * zero for inline elements because the first line of text does not
       * increase the height of inline elements.

       * @property {additionalLineHeight}
       * The height that each line of text after the first adds to the element.
       *
       * @property {lineCount}
       * The number of lines of text the element contains.
       */
      return {
        textHeight,
        naturalHeightWithOneLine,
        firstLineHeight,
        additionalLineHeight,
        lineCount,
      };
    });
  }

  /**
   * Execute a callback while the element is in a state conducive to gathering
   * text metrics (i.e., minimum and maximum height are unset).
   *
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

  /**
   * Watch for changes that may affect layout. Respond by reclamping if
   * necessary.
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
   * property {@see LineClamp.useSoftClamp}.
   */
  apply() {
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
   * Trims text until it fits within constraints
   * (maximum height or number of lines).
   *
   * @see {LineClamp.maxLines}
   * @see {LineClamp.maxHeight}
   */
  hardClamp() {
    if (this.shouldClamp()) {
      for (let i = 0, len = this.originalWords.length; i < len; ++i) {
        let currentText = this.originalWords.slice(0, i)
          .join(' ');

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

      // Broadcast more specific hardClamp event first
      emit(this, 'lineclamp.hardclamp');
      emit(this, 'lineclamp.clamp');
    }

    this.element.style.removeProperty('min-height');

    return this;
  }

  /**
   * Reduces font size until text fits within the specified height or number of
   * lines. Resorts to using {@see hardClamp()} if text still exceeds clamp
   * parameters.
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

      // Emit specific softClamp event first
      emit(this, 'lineclamp.softclamp');

      // Don't emit `lineclamp.clamp` event twice.
      if (!done) {
        this.hardClamp();
      }
      else {
        // hardClamp emits `lineclamp.clamp` too. Only emit from here if we're
        // not also hard clamping.
        emit(this, 'lineclamp.clamp');
      }
    }

    return this;
  }

  /**
   * @returns {boolean}
   * Whether height of text or number of lines exceed constraints.
   *
   * @see LineClamp.maxHeight
   * @see LineClamp.maxLines
   */
  shouldClamp() {
    const { lineCount, textHeight } = this.calculateTextMetrics();

    if (undefined !== this.maxHeight) {
      return textHeight > this.maxHeight;
    }

    if (undefined !== this.maxLines) {
      return lineCount > this.maxLines;
    }

    throw new Error('maxLines or maxHeight must be set before calling shouldClamp().');
  }
}

function emit (instance, type) {
  instance.element.dispatchEvent(new CustomEvent(type));
}
