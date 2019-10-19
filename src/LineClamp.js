/**
 * @typedef {Object} LineClampInit
 *
 * @property {Number} maxLines
 * The maximum number of lines to allow.
 *
 * @property {Boolean} useSoftClamp
 * If true, try reducing font size before trimming text.
 *
 * @property {Boolean} strict
 * Whether to strictly interpret the maximum number of lines.
 * If true, reduce font-size until the number of lines occupied by the text
 * is fewer than {@see maxLines}.
 * If false, reduce font-size until the element is shorter than the height of
 * one line at the time of initialization, times {@see maxLines}.
 *
 * @property {string} basisLineHeight
 * Line-height to use as the basis of calculations. Can be any valid CSS
 * value for line-height. Defaults to the height of one line of text in the
 * element at time of first clamp.

 * @property {number} minFontSize
 * The lowest font size to try before resorting to removing trailing text
 * (hard clamping).
 *
 * @property {number} maxFontSize
 * The max font size. We'll start with this font size then reduce until
 * text fits constraints, or font size is equal to {@see minFontSize}.
 */

/**
 * Reduces font size or trims text to make it fit within specified bounds.
 */
export default class LineClamp {
  /**
   * @param {HTMLElement} element
   * The element to clamp.
   *
   * @param {LineClampInit} [options]
   * Options for the behavior of the line clamp.
   */
  constructor(element, {
    maxLines = 1,
    useSoftClamp = true,
    strict = false,
    basisLineHeight = undefined,
    minFontSize = 1,
    maxFontSize = undefined,
  } = {}) {
    this._element = element;

    const style = this.computedStyle;

    if (undefined === basisLineHeight) {
      basisLineHeight = this.currentLineHeight;
    }

    if (undefined === maxFontSize) {
      maxFontSize = parseInt(style.fontSize, 10);
    }

    this.maxLines = maxLines;
    this.useSoftClamp = useSoftClamp;
    this.strict = strict;
    this.basisLineHeight = basisLineHeight;
    this.minFontSize = minFontSize;
    this.maxFontSize = maxFontSize;

    Object.defineProperty(this, 'originalWords', {
      writable: false,
      value:    element.textContent.split(/\s+/),
    });

    Object.defineProperty(this, 'updateHandler', {
      writable: false,
      value:    () => this.clampSoon(),
    });

    Object.defineProperty(this, 'observer', {
      writable: false,
      value:    new MutationObserver(this.updateHandler),
    });
  }

  get currentLineHeight() {
    return this._whileMeasuring(element => {
      const originalHtml = element.innerHTML;

      element.innerHTML = '&nbsp;';
      const height = element.clientHeight;
      element.innerHTML = originalHtml;

      return height;
    });
  }

  /**
   * @returns {CSSStyleDeclaration}
   */
  get computedStyle() {
    return window.getComputedStyle(this._element);
  }

  /**
   * @param {Boolean} [doInitialClamp]
   * If true, watch and clamp. If false, just watch.
   */
  watch(doInitialClamp = false) {
    if (this._watching) {
      return;
    }

    if (doInitialClamp) {
      this.clamp();
    }

    window.addEventListener('resize', this.updateHandler);

    // Minimum required to detect changes to text nodes,
    // and wholesale replacement via innerHTML
    this.observer.observe(this._element, {
      characterData: true,
      subtree:       true,
      childList:     true,
      attributes:    true,
    });

    this._watching = true;
  }

  unwatch() {
    this.observer.disconnect();
    window.removeEventListener('resize', this.updateHandler);

    this._watching = false;
  }

  clampSoon() {
    requestAnimationFrame(() => this.clamp());
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
    [this._element.textContent] = this.originalWords;

    for (let i = 1, len = this.originalWords.length; i < len; ++i) {
      this._element.textContent += ` ${this.originalWords[i]}`;

      if (this.shouldClamp()) {
        this._element.innerHTML = `${this.originalWords.slice(0, i)
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

    for (let i = this.maxFontSize; i >= this.minFontSize; --i) {
      if (this.shouldClamp()) {
        this._element.style.fontSize = `${i}px`;
      }
      else {
        this._element.style.removeProperty('min-height');
        return;
      }
    }

    this.hardClamp();
  }

  shouldClamp() {
    const style = this.computedStyle,
      padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom),
      innerHeight = parseInt(style.height, 10) - padding;

    if (this.strict) {
      return innerHeight / this.currentLineHeight > this.maxLines;
    }

    return innerHeight / this.basisLineHeight > this.maxLines;
  }

  _whileMeasuring(callback) {
    const { cssText } = this._element.style;
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

    const returnValue = callback(this._element);
    this._element.style.cssText = cssText;

    return returnValue;
  }
}
