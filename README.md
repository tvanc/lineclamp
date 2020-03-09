# LineClamp

Limit text to a given height or number of lines by reducing font
size or trimming text. Works on inline and block elements with any combination
of border, padding, line-height, min-height, and max-height.

## Installation

```bash
npm install @tvanc/lineclamp
```

## Examples

View [examples](https://codepen.io/collection/AEwzoQ/) on CodePen.

## Usage

```javascript
import LineClamp from "@tvanc/lineclamp"
const element = document.getElementById("#long-marketing-title")

// Create a clamp set to one line
const clamp = new LineClamp(element, { maxLines: 1 })

// Apply the clamp.
clamp.apply()

// Watch for layout changes, reclamp if necessary
clamp.watch()

// Stop watching
clamp.unwatch()

// Get text metrics (total height, number of lines, line heights)
// https://github.com/tvanc/lineclamp#getting-text-metrics
clamp.calculateTextMetrics()
```

### Methods

| Method                                            | Description                                                                                                                                                                                     |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `watch()`                                         | Watch for changes.                                                                                                                                                                              |
| `unwatch()`                                       | Stop watching for changes.                                                                                                                                                                      |
| `apply()`                                         | Apply the clamp. Whether `softClamp()` or `hardClamp()` is used depends on the value of the `useSoftClamp` option.                                                                              |
| `softClamp()`                                     | Reduce font size until text height or line count are within constraints. If font size is reduced to `minFontSize` and text still exceeds constraints, optionally resort to using `hardClamp()`. |
| `hardClamp()`                                     | Trim text content to force it to fit within the maximum number of lines.                                                                                                                        |
| `shouldClamp()`                                   | Detect whether text exceeds the specified `maxHeight` or `maxLines`.                                                                                                                            |
| [`calculateTextMetrics()`](#getting-text-metrics) | Get metrics regarding the element's text, like number of lines, text height, and line height.                                                                                                   |

### Options

These options can be passed as the second argument to the constructor, or set
directly on the object.

| Option                | Type    | Default            | Description                                                                                                                                                                                                         |
| --------------------- | ------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maxLines`            | Number  | `1`                | The maximum number of lines to allow. Defaults to 1. To set a maximum height instead, use `maxHeight`.                                                                                                              |
| `maxHeight`           | Number  | `undefined`        | The maximum height (in pixels) of text in an element. This option is undefined by default. Once set, it takes precedence over `maxLines`. Note that this applies to the height of the text, not the element itself. |
| `useSoftClamp`        | Boolean | `false`            | Whether to attempt soft clamping before resorting to hard clamping.                                                                                                                                                 |
| `hardClampAsFallback` | Boolean | `true`             | If true, resort to hard clamping if soft clamping reaches the minimum font size and still doesn't fit within the max height or number of lines                                                                      |
| `ellipsis`            | Boolean | `1`                | The character with which to represent clipped trailing text. This option takes effect when "hard" clamping is used.                                                                                                 |
| `minFontSize`         | Boolean | `1`                | The minimum font size before a soft clamp turns into a hard clamp.                                                                                                                                                  |
| `maxFontSize`         | Boolean | computed font-size | The maximum font size to use for the element when soft clamping. We start with this number and then decrement towards `minFontSize`.                                                                                |

### Events

Add listeners to the clamped element, not the clamp itself.

| Event                 | Description                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `lineclamp.softclamp` | Emitted when the element is softly clamped.                                                                                                                                                                   |
| `lineclamp.hardclamp` | Emitted when the element is hard clamped.                                                                                                                                                                     |
| `lineclamp.clamp`     | Emitted when any kind of clamping occurs. If `.apply()` results in both soft and hard clamping, only one `lineclamp.clamp` event is issued, after `lineclamp.softclamp` and `lineclamp.hardclamp` have fired. |

#### Example

```javascript
import LineClamp from "@tvanc/lineclamp"
const element = document.getElementById("#clampedElement")

const clamp = new LineClamp(element)
const listener = event => console.log(event.type)

element.addEventListener("lineclamp.softclamp", listener)
element.addEventListener("lineclamp.hardclamp", listener)
element.addEventListener("lineclamp.clamp", listener)

// softClamp() emits 'lineclamp.softclamp' and 'lineclamp.clamp', or nothing
// if clamping unnecessary
clamp.softClamp()

// hardClamp() emits 'lineclamp.hardclamp' and 'lineclamp.clamp', or nothing
// if clamping unnecessary
clamp.hardClamp()

// apply() can emit 'lineclamp.softclamp' and/or 'lineclamp.hardclamp' followed
// by 'lineclamp.clamp', or nothing if clamping is unnecessary
clamp.apply()
```

### Getting Text Metrics

Unfortunately, there is no native API for counting the number of lines or
determining line height. The computed CSS line-height can return "`normal`",
which isn't useful for calculations. The only (mostly) sure-fire solution is to
compare the height of the element with no text to the height of the element
with one line with one line of text. That gets you the height of the first line.

Subsequent lines can have different heights than the first - though
all subsequent lines will be the same height as each other
(barring things that can distort line heights, like certain characters). So you
have to add an additional line to know the height of the next lines.

This module does all that. The information it gleans is made available via the
`calculateTextMetrics()` method:

```javascript
import LineClamp from "@tvanc/lineclamp"
const element = document.getElementById("#long-marketing-title")
const clamp = new LineClamp(element)

// Get text metrics
const metrics = clamp.calculateTextMetrics()
```

`calculateTextMetrics()` returns an object with the following information.

| Property                   | Description                                                                                                                                                                                                                                                                                                                  |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `textHeight`               | The vertical space in pixels required to display the element's current text.                                                                                                                                                                                                                                                 |
| `naturalHeightWithOneLine` | The height of the element with only one line of text and without minimum or maximum heights.                                                                                                                                                                                                                                 |
| `firstLineHeight`          | The height that the first line of text adds to the element, i.e., the difference between the height of the element while empty and the height of the element while it contains one line of text. This number may be zero for inline elements because the first line of text does not increase the height of inline elements. |
| `additionalLineHeight`     | The height that each line of text after the first adds to the element.                                                                                                                                                                                                                                                       |
| `lineCount`                | The number of lines of text the element contains.                                                                                                                                                                                                                                                                            |
