/**
 * Created by travis on 11/29/2016.
 */

/**
 * @param elm
 * @param maxLines
 * @constructor
 */
export default class LineClamp {
  /**
   * @param {HTMLElement} elm The element to clamp.
   * @param {Number} [maxLines] The maximum number of lines to allow.
   * @param {Boolean} [useSoftClamp] If true, try reducing font size before trimming text.
   * @param {Boolean} [strict]
   * Whether to strictly interpret the maximum number of lines.
   * If false, will reduce font-size until the element is shorter than the line-height it had
   * when it was first watched, times maxLines.
   * If true, will reduce font-size until the number of lines occupied by the text is fewer than
   * maxLines.
   */
  constructor (elm, maxLines = 1, useSoftClamp = true, strict = false) {
    const style      = this._getStyle(),
          lineHeight = parseInt(style.lineHeight, 10);

    this._element = elm;
    this._originalWords = elm.textContent.split(/\s+/);
    this._maxHeight = lineHeight * this.maxLines;
    this._originalFontSize = parseInt(style.fontSize, 10);

    this.maxLines = maxLines;
    this.useSoftClamp = useSoftClamp;
    this.minFontSize = 1;
    this.strict = strict;

    this._resizeHandler = () => {
      this._resetClampTimer();
    };
  }

  /**
   * @return MutationObserver
   */
  get observer () {
    if (!this._observer) {
      this._observer = new MutationObserver(() => {
        this.clamp();
      });
    }

    return this._observer;
  }

  /**
   * @param {Boolean} [doInitialClamp]
   * If true, watch and clamp. If false, just watch.
   */
  watch (doInitialClamp = false) {
    if (doInitialClamp) {
      this.clamp();
    }

    if (this._watching) {
      return;
    }

    window.addEventListener('resize', this._resizeHandler);
    this._observeMutations();

    this._watching = true;
  }

  unwatch () {
    this._disconnectMutationObserver();
    window.removeEventListener('resize', this._resizeHandler);

    this._watching = false;
  }

  /**
   * Conduct either soft clamping or hard clamping, according to the value of property
   * `useSoftClamp`.
   */
  clamp () {
    if (this._element.offsetHeight) {
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
  }

  /**
   * Trims text content to force it to fit within the demanded number of lines.
   */
  hardClamp () {
    // const style = this.getStyle();
    // const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    [this._element.textContent] = this._originalWords;

    for (let i = 1, len = this._originalWords.length; i < len; ++i) {
      this._element.textContent += ` ${this._originalWords[i]}`;

      if (this._shouldClamp()) {
        this._element.innerHTML = `${this._originalWords.slice(0, i).join(' ')} &hellip;`;
        break;
      }
    }
  }

  /**
   * Reduces font size until the text fits within the specified number of lines. If it still
   * doesn't fit then resorts to using hardClamp()
   *
   * @see hardCLamp()
   */
  softClamp () {
    this._element.style.fontSize = '';

    for (let i = this._originalFontSize; i >= this.minFontSize; --i) {
      if (this._shouldClamp()) {
        this._element.style.fontSize = `${i}px`;
      }
      else {
        return;
      }
    }

    this.hardClamp();
  }


  /**
   * Watch for changes to _element.
   * @private
   */
  _observeMutations () {
    // Minimum required to detect changes to text nodes, and wholesale replacement via innerHTML
    this.observer.observe(this._element, {
      characterData: true,
      subtree:       true,
      childList:     true,
      attributes:    true,
    });
  }

  /**
   * Stop watching for changes to _element.
   * @private
   */
  _disconnectMutationObserver () {
    this.observer.disconnect();
  }

  /**
   * Clamp at the next available opportunity.
   * @private
   */
  _resetClampTimer () {
    requestAnimationFrame(() => {
      return this.clamp();
    });
  }

  _shouldClamp () {
    const style       = this._getStyle(),
          padding     = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
          innerHeight = parseInt(style.height, 10) - padding;

    if (this.strict) {
      return Math.floor(innerHeight / parseInt(style.lineHeight, 10)) > this.maxLines;
    }

    return innerHeight > this._maxHeight;
  }

  _getStyle () {
    return window.getComputedStyle(this._element);
  }
}
