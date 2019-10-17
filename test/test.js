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
      ''
    );
  });
});
