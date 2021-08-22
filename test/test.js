import LineClamp from "/src/LineClamp.js"

const { expect, assert } = chai

describe("LineClamp", () => {
  it("Limits to one line in reduced font size", () => {
    const element = getAndShowById("strictTester")
    const clamp = new LineClamp(element, {
      maxLines: 1,
      useSoftClamp: true,
    })

    const softClampSpy = chai.spy.on(clamp, "softClamp")
    const hardClampSpy = chai.spy.on(clamp, "hardClamp")

    clamp.apply()

    assert.equal(
      clamp.calculateTextMetrics().firstLineHeight,
      element.clientHeight,
      "Element reduced to one strict line."
    )

    clamp.apply()

    expect(softClampSpy).to.have.been.called()
    expect(hardClampSpy).not.to.have.been.called()
  })

  it("Limits to height of one line in original font size", () => {
    const element = getAndShowById("heightTester")
    const clamp = new LineClamp(element, { useSoftClamp: true })
    const startingLineHeight = clamp.calculateTextMetrics().firstLineHeight
    clamp.maxHeight = startingLineHeight

    clamp.apply()

    const currentLineHeight = clamp.calculateTextMetrics().firstLineHeight
    const currentHeight = element.clientHeight

    assert.isAbove(
      currentHeight,
      currentLineHeight,
      "Element is taller than one line in its reduced font size."
    )

    assert.strictEqual(
      currentHeight / currentLineHeight,
      2,
      "Element height is twice current line height (two lines)"
    )

    assert.isAtMost(
      currentHeight,
      startingLineHeight,
      "Current height equal to or less than starting height"
    )
  })

  it("Hard clamps to one line", () => {
    const element = getAndShowById("hardClampTester")
    const clamp = new LineClamp(element, {
      maxLines: 1,
      useSoftClamp: false,
    })

    clamp.apply()

    const { firstLineHeight } = clamp.calculateTextMetrics()

    assert.isTrue(
      element.clientHeight === firstLineHeight,
      "Element is only one line high"
    )
  })

  it("Soft clamp hardens if necessary", () => {
    const element = getAndShowById("softClampTester")
    const clamp = new LineClamp(element, {
      maxLines: 1,
      minFontSize: 48,
      useSoftClamp: true,
      strict: true,
    })

    const softClampSpy = chai.spy.on(clamp, "softClamp")
    const hardClampSpy = chai.spy.on(clamp, "hardClamp")

    clamp.apply()

    expect(softClampSpy).to.have.been.called()
    expect(hardClampSpy).to.have.been.called()
  })

  it("Events trigger properly", () => {
    const element = getAndShowById("eventsTester")
    const clamp = new LineClamp(element, {
      useSoftClamp: true,
      maxLines: 1,
    })

    // Guarantee softClamp() will escalate to hardClamp()
    clamp.minFontSize = clamp.maxFontSize - 1

    let softClampTriggeredFirst = false
    let hardClampTriggeredNext = false
    let plainClampTriggeredLast = false

    element.addEventListener(
      "lineclamp.softclamp",
      // Ensure correct order
      () => (softClampTriggeredFirst = !hardClampTriggeredNext)
    )

    element.addEventListener(
      "lineclamp.hardclamp",
      // Ensure correct order
      () => (hardClampTriggeredNext = softClampTriggeredFirst)
    )

    element.addEventListener(
      "lineclamp.clamp",
      () => (plainClampTriggeredLast = hardClampTriggeredNext)
    )

    clamp.apply()

    assert(softClampTriggeredFirst, "Soft clamp triggered first")
    assert(hardClampTriggeredNext, "Hard clamp triggered next")
    assert(plainClampTriggeredLast, "Plain clamp triggered last")
  })

  it("Reclamps on DOM mutation", (done) => {
    const element = getAndShowById("mutationTester")
    const clamp = new LineClamp(element, { minFontSize: 48, maxLines: 1 })
    const clampSpy = chai.spy.on(clamp, "apply")

    clamp.watch()

    expect(clampSpy).not.to.have.been.called()

    element.addEventListener("lineclamp.hardclamp", () => {
      expect(clampSpy).to.have.been.called()
      done()
    })

    element.innerHTML = element.innerHTML + " "
  })

  it("Padding, border, min-height, and font-size are taken into account", () => {
    const element = getAndShowById("dimensionsTester")
    const clamp = new LineClamp(element, { maxLines: 1 })

    clamp.apply()

    const { firstLineHeight } = clamp.calculateTextMetrics()
    const currentHeight = element.offsetHeight

    assert.isAbove(
      currentHeight,
      firstLineHeight,
      "Element is taller than the line height."
    )
  })

  it("Works for inline text", () => {
    // We have to just take this for granted. There's no other way to get the
    // number of lines to test against.
    const expectedLineCount = 3
    const element = getAndShowById("displayInlineTester")
    const clamp = new LineClamp(element, { maxLines: expectedLineCount })
    const { lineCount } = clamp.calculateTextMetrics()

    // How do I prove there are three lines algorithmically?
    assert.equal(lineCount, expectedLineCount, "Inline text is correct height.")
  })

  it(
    "No softclamp event triggered if no change in font size",
    getNoOpTest(
      "softClampOnlyFiresIfTriggeredTester",
      "lineclamp.softclamp",
      true
    )
  )

  it(
    "No hardclamp event if no lines removed",
    getNoOpTest(
      "hardClampOnlyFiresIfTriggeredTester",
      "lineclamp.hardclamp",
      false
    )
  )
})

function getAndShowById(id) {
  const el = document.getElementById(id)
  const tester = el.closest(".tester")

  tester.classList.add("active")

  return el
}

function getNoOpTest(elId, event, useSoftClamp) {
  return () => {
    const el = getAndShowById(elId)
    const clamp = new LineClamp(el, { maxLines: 1, useSoftClamp })
    const handler = (e) => console.log(`[${event} test]: ${e.type} fired`)

    // Listener for event type, `event`
    const givenEventSpy = chai.spy(handler)
    const genericEventSpy = chai.spy(handler)

    el.addEventListener(event, givenEventSpy)
    el.addEventListener("lineclamp.clamp", genericEventSpy)

    clamp.apply()

    expect(givenEventSpy).not.to.have.been.called()
    expect(genericEventSpy).not.to.have.been.called()
  }
}
