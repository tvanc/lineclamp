import LineClamp from '/src/LineClamp.js';

const {expect, assert} = chai;

describe('LineClamp', () => {
  it('Limits to one line in reduced font size', () => {
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

  it('Limits to height of one line in original font size.', () => {
    const element = document.getElementById('lenientTester');
    const clamp = new LineClamp(element, {
      maxLines: 1,
      strict:   false,
    });

    const startingHeight = clamp.currentLineHeight;

    clamp.clamp();

    const currentLineHeight = clamp.currentLineHeight;
    const currentHeight = element.clientHeight;

    assert.isAbove(
      currentHeight,
      currentLineHeight,
      'Element is taller than one line in its reduced font size.'
    );

    assert.strictEqual(
      currentHeight % currentLineHeight,
      0,
      'Current height is a clean multiple of the current line height'
    );

    assert.isAtMost(
      currentHeight,
      startingHeight,
      'Current height equal to or less than starting height'
    );
  });

  it('Hard clamps to one line.', () => {
    const element = document.getElementById('hardClampTester');
    const clamp = new LineClamp(element, {
      maxLines:     1,
      useSoftClamp: false,
    });

    clamp.clamp();

    assert.isTrue(
      element.clientHeight === clamp.currentLineHeight,
      'Element is only one line high'
    );
  });

  it('Soft clamp hardens if necessary.', () => {
    const element = document.getElementById('softClampTester');
    const clamp = new LineClamp(element, {
      minFontSize:  48,
      useSoftClamp: true,
      strict:       true
    });

    const softClampSpy = chai.spy.on(clamp, 'softClamp');
    const hardClampSpy = chai.spy.on(clamp, 'hardClamp');

    clamp.clamp();

    expect(softClampSpy).to.have.been.called();
    expect(hardClampSpy).to.have.been.called();
  });

  it('Events trigger properly', () => {
    const element = document.getElementById('eventsTester');
    const clamp = new LineClamp(element);

    // Guarantee softClamp() will escalate to hardClamp()
    clamp.minFontSize = clamp.maxFontSize;

    let softClampTriggeredFirst = false;
    let hardClampTriggeredNext = false;
    let plainClampTriggeredLast = false;

    element.addEventListener(
      'lineclamp.softClamp',
      // Ensure correct order
      () => softClampTriggeredFirst = !hardClampTriggeredNext
    );

    element.addEventListener(
      'lineclamp.hardClamp',
      // Ensure correct order
      () => hardClampTriggeredNext = softClampTriggeredFirst
    );

    element.addEventListener(
      'lineclamp.clamp',
      () => plainClampTriggeredLast = hardClampTriggeredNext
    );

    clamp.clamp();

    assert(softClampTriggeredFirst, 'Soft clamp triggered first');
    assert(hardClampTriggeredNext, 'Hard clamp triggered next');
    assert(plainClampTriggeredLast, 'Plain clamp triggered last');
  });

  it('Reclamps on DOM mutation', done => {
    const element = document.getElementById('mutationTester');
    const clamp = new LineClamp(element, {minFontSize: 48});
    const clampSpy = chai.spy.on(clamp, 'clamp');

    clamp.watch();

    expect(clampSpy).not.to.have.been.called();

    element.addEventListener(
      'lineclamp.hardClamp',
      () => {
        expect(clampSpy).to.have.been.called();
        done();
      }
    );

    element.innerHTML = element.innerHTML + ' ';
  });

  it('Padding, border, min-height, and font-size are taken into account', () => {
    const element = document.getElementById('dimensionsTester');
    const clamp = new LineClamp(element, {maxLines: 1});

    clamp.clamp();

    const currentLineHeight = clamp.currentLineHeight;
    const currentHeight = element.offsetHeight;

    assert.isAbove(
      currentHeight,
      currentLineHeight,
      'Element is taller than the line height.'
    );
  });
});
