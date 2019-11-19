# LineClamp

Limit text to a given height or number of lines by reducing font 
size or trimming text. Works on inline and block elements with any combination
of border, padding, line-height, min-height, and max-height.

## Installation
```bash
npm install --save-dev @tvanc/lineclamp
```

## Usage
```javascript
import LineClamp from '@tvanc/lineclamp';
const element = document.getElementById('#long-marketing-title');

// Create a clamp set to one line
const clamp = new LineClamp(element, {maxLines: 1});

// Apply the clamp.
clamp.apply();

// Watch for layout changes, reclamp if necessary
clamp.watch();

// Stop watching
clamp.unwatch();

// Get text metrics (height, number of lines)
clamp.calculateTextMetrics();
```

### Methods and properties

#### Instance methods
| Method          | Description   |
| --------------- | ------------- |
| `watch()`       | Watch for changes. |
| `unwatch()`     | Stop watching for changes. |
| `apply()`       | Apply the clamp. Whether `softClamp()` or `hardClamp()` is used depends on the value of the `useSoftClamp` property. |
| `softClamp()`   | Reduce font size until text height or line count are within constraints. If font size is reduced to `minFontSize` and text still exceeds constraints, resort to using `hardClamp()`. |
| `hardClamp()`   | Trim text content to force it to fit within the maximum number of lines. |
| `shouldClamp()` | Detect whether text exceeds the specified `maxHeight` or `maxLines`. |

#### Options
| Property       | Type    | Default     | Description |
| -------------- | ------- | ----------- | ----------- |
| `maxLines`     | Number  | `1`         | The maximum number of lines to allow. Defaults to 1. To set a maximum height instead, use `@see maxHeight`. |
| `maxHeight`    | Number  | `undefined` | The maximum height (in pixels) of text in an element. This option is undefined by default. Once set, it takes precedent over `maxLines`. Note that this applies to the height of the text, not the element itself. |
| `useSoftClamp` | Boolean | `false`     | Whether to attempt soft clamping before resorting to hard clamping. |
| `ellipsis`     | Boolean | `1`         | The minimum font size before a soft clamp turns into a hard clamp. |
| `minFontSize`  | Boolean | `1`         | The minimum font size before a soft clamp turns into a hard clamp. |
| `maxFontSize`  | Boolean | computed font-size | The maximum font size to use for the element when soft clamping. We start with this number and then decrement towards `minFontSize`. |

#### Events
Add listeners for these events to the clamped element.
 
| Event                 | Description |
| --------------------- | ----------- |
| `lineclamp.softclamp` | Emitted when the element is softly clamped. |
| `lineclamp.hardclamp` | Emitted when the element is hard clamped. |
| `lineclamp.clamp`     | Emitted when any kind of clamping occurs. If `.apply()` results in both soft and hard clamping, only one `lineclamp.clamp` event is issued, after `lineclamp.softclamp` and `lineclamp.hardclamp` have fired. |
