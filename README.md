# LineClamp

A tool for limiting the number of lines of text in an element.

## Installation
### via npm
```bash
npm i -D lineclamp
```

### git clone
```bash
git clone https://github.com/truribe/lineclamp.git
```

## Usage
```javascript
import LineClamp from 'lineclamp';
const element = document.getElementById('#long-marketing-content');
// Limit to three lines
const clamp = new LineClamp(element, 3);

// Watch and clamp
clamp.watch(true);

// Just watch
clamp.watch();
```

### Methods and properties
#### Instance methods

| Method        | Description   |
| ------------- | ------------- |
| watch()       | Watch for changes. |
| unwatch()     | Stop watching for changes. |
| clamp()       | Apply the clamp. Whether `softClamp()` or `hardClamp()` is used depends on the value of the `useSoftClamp` property. |
| softClamp()   | Reduces font size until the text fits within the specified number of lines. If it still doesn't fit then resorts to using `hardClamp()` |
| hardClamp()   | Trims text content to force it to fit within the maximum number of lines. |

#### Instance properties

| Property     | Type    | Default | Description |
|--------------|---------|---------|-------------|
| maxLines     | Number  | 1       | The maximum number of lines to allow before the clampdown. |
| useSoftClamp | Boolean | True    | Whether to attempt soft clamping before resorting to hard clamping. |
| strict       | Boolean | False   | Whether to work strictly off the number of lines, or to work off the height of the element. |
| minFontSize  | Boolean | 1       | The minimum font size before a soft clamp turns into a hard clamp. |

## Development
Testing isn't currently implemented. Use the following command to build.
`gulp build`
