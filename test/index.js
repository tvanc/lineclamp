import LineClamp from '/src/LineClamp.js';

describe('LineClamp', () => {
  const assert = chai.assert;

  it('Strict', () => {
    const clamp = new LineClamp(
      document.getElementById('strict-tester'),
      {
        maxLines: 1,
        strict: true
      }
    );

    clamp.clamp();
    assert.isAtLeast(10, 50, 'Must be at least 50');
  });
});
