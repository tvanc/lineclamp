import LineClamp from '/src/LineClamp.js';

describe('LineClamp', () => {
  const assert = chai.assert;

  it('Strict', () => {
    const element = document.getElementById('strictTester');
    const clamp = new LineClamp(element, {
      maxLines: 1,
      strict:   true,
    });

    clamp.clamp();

    assert.equal(
      clamp.currentLineHeight,
      element.clientHeight,
      'Element reduced to one strict line.'
    );
  });

  it('Lenient', () => {
    const element = document.getElementById('lenientTester');
    const clamp = new LineClamp(element, {
      maxLines: 1,
      strict:   false,
    });

    clamp.clamp();

    const currentLineHeight = clamp.currentLineHeight;
    const currentHeight = element.clientHeight;

    assert.isTrue(
      element.clientHeight > currentLineHeight
      && currentHeight % currentLineHeight === 0,
      'One line in original font size.'
    );
  });
});
