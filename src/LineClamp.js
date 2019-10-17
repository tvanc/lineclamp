export default class LineClamp {
  /**
   * @param {HTMLElement} element
   * The element to clamp.
   *
   * @param {Object} [options]
   * Options.
   *
   * @param {Number} [options.maxLines]
   * The maximum number of lines to allow.
   *
   * @param {Boolean} [options.useSoftClamp]
   * If true, try reducing font size before trimming text.
   *
   * @param {Boolean} [options.strict]
   * Whether to strictly interpret the maximum number of lines.
   * If false, will reduce font-size until the element is shorter than the line-height it had
   * when it was first watched, times maxLines.
   * If true, will reduce font-size until the number of lines occupied by the text is fewer than
   *
   * @param {string} [options.basisLineHeight]
   * Line-height to use as the basis of calculations. Can be any valid CSS
   * value for line-height. Defaults to the height of one line of text in the
   * element at time of first clamp.
   */
  constructor(element, {
    maxLines = 1,
    useSoftClamp = true,
    strict = false,
    basisLineHeight = undefined,
    minFontSize = 1
  }) {
    this._element = element;

    const style = this._getStyle();

    if (basisLineHeight === undefined) {
      basisLineHeight = this.currentLineHeight;
    }

    this._originalWords = element.textContent.split(/\s+/);
    this._originalFontSize = parseInt(style.fontSize, 10);

    this.maxLines = maxLines;
    this.useSoftClamp = useSoftClamp;
    this.strict = strict;
    this.basisLineHeight = basisLineHeight;
    this.minFontSize = minFontSize;

    this._resizeHandler = () => this._resetClampTimer();
  }

  /**
   * @return MutationObserver
   */
  get observer() {
    if (!this._observer) {
      this._observer = new MutationObserver(() => this.clamp());
    }

    return this._observer;
  }

  get currentLineHeight () {
    return this._whileMeasuring(element => {
      const originalHtml = element.innerHTML;

      element.innerHTML = '&nbsp;';
      const height = element.clientHeight;
      element.innerHTML = originalHtml;

      return height;
    });
  }

  /**
   * @param {Boolean} [doInitialClamp]
   * If true, watch and clamp. If false, just watch.
   */
  watch(doInitialClamp = false) {
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

  unwatch() {
    this._disconnectMutationObserver();
    window.removeEventListener('resize', this._resizeHandler);

    this._watching = false;
  }

  /**
   * Conduct either soft clamping or hard clamping, according to the value of
   * property {@see useSoftClamp}.
   */
  clamp() {
    if (!this._element.offsetHeight) {
      return;
    }

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

  /**
   * Trims text content to force it to fit within the demanded number of lines.
   */
  hardClamp() {
    // const style = this.getStyle();
    // const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    this._element.style.minHeight = '0';
    [this._element.textContent] = this._originalWords;

    for (let i = 1, len = this._originalWords.length; i < len; ++i) {
      this._element.textContent += ` ${this._originalWords[i]}`;

      if (this._shouldClamp()) {
        this._element.innerHTML = `${this._originalWords.slice(0, i)
          .join(' ')} &hellip;`;
        break;
      }
    }

    this._element.style.removeProperty('min-height');
  }

  /**
   * Reduce font size until the text fits within the specified number of lines.
   * If it still doesn't fit, resort to using {@see hardClamp()}.
   */
  softClamp() {
    this._element.style.fontSize = '';
    this._element.style.minHeight = '0';

    for (let i = this._originalFontSize; i >= this.minFontSize; --i) {
      if (this._shouldClamp()) {
        this._element.style.fontSize = `${i}px`;
      }
      else {
        this._element.style.removeProperty('min-height');
        return;
      }
    }

    this.hardClamp();
  }

  _whileMeasuring(callback) {
    this._enterMeasuringState();
    const returnValue = callback(this._element);
    this._exitMeasuringState();

    return returnValue;
  }

  _enterMeasuringState() {
    if (this._measuring) {
      return;
    }

    this._oldStyles = this._element.style.cssText;
    const stylesToUpdate = [
      'padding',
      'paddingTop',
      'paddingRight',
      'paddingBottom',
      'paddingLeft',
      'paddingBlockStart',
      'paddingInlineEnd',
      'paddingBlockEnd',
      'paddingInlineStart',
    ];

    for (const property of stylesToUpdate) {
      this._element.style[property] = '0';
    }

    this._measuring = true;
  }

  _exitMeasuringState() {
    this._measuring = false;
    this._element.style.cssText = this._oldStyles;
  }

  /**
   * Watch for changes to _element.
   * @private
   */
  _observeMutations() {
    // Minimum required to detect changes to text nodes,
    // and wholesale replacement via innerHTML
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
  _disconnectMutationObserver() {
    this.observer.disconnect();
  }

  /**
   * Clamp at the next available opportunity.
   * @private
   */
  _resetClampTimer() {
    requestAnimationFrame(() => this.clamp());
  }

  _shouldClamp() {
    const style = this._getStyle(),
      padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
      innerHeight = parseInt(style.height, 10) - padding;

    if (this.strict) {
      return innerHeight / this.currentLineHeight > this.maxLines;
    }

    return innerHeight / this.basisLineHeight > this.maxLines;
  }

  _getStyle() {
    return window.getComputedStyle(this._element);
  }
}
