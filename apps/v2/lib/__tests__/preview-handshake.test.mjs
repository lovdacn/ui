/**
 * Race characterization tests for the parent side of the `lvcn:*` preview
 * handshake (ANIMATION_MOTION_REMEDIATION_PLAN.md sections 5.1 and 15.6/A2.1).
 *
 * Deterministic by construction: no DOM, no real iframe, no wall-clock waiting.
 * A fake clock drives the retry interval and the readiness timeout, and a fake
 * message bus lets a test drop, delay, replay, or forge any message.
 *
 * Run with the Node test runner (no new dependencies):
 *   node --test apps/v2/lib/__tests__ apps/preview/src/lib/__tests__
 */
import assert from "node:assert/strict"
import test from "node:test"

import {
  createPreviewHandshake,
  projectPreviewHandshakeState,
  READY_REQUEST_INTERVAL_MS,
  READY_TIMEOUT_MS,
} from "../preview-protocol.ts"

const CHILD_ORIGIN = "https://lovdacn.expo.app"
const OTHER_ORIGIN = "https://evil.example"

/** Minimal deterministic replacement for setTimeout/setInterval. */
function createClock() {
  let now = 0
  let sequence = 0
  const scheduled = new Map()

  const timers = {
    setTimeout(handler, ms) {
      const id = ++sequence
      scheduled.set(id, { at: now + ms, every: null, handler })
      return id
    },
    clearTimeout(id) {
      scheduled.delete(id)
    },
    setInterval(handler, ms) {
      const id = ++sequence
      scheduled.set(id, { at: now + ms, every: ms, handler })
      return id
    },
    clearInterval(id) {
      scheduled.delete(id)
    },
  }

  function advance(ms) {
    const target = now + ms
    for (;;) {
      let dueId = null
      let due = null
      for (const [id, timer] of scheduled) {
        if (timer.at <= target && (due === null || timer.at < due.at)) {
          dueId = id
          due = timer
        }
      }
      if (due === null) break
      now = due.at
      if (due.every === null) scheduled.delete(dueId)
      else due.at = now + due.every
      due.handler()
    }
    now = target
  }

  return { timers, advance, get pending() { return scheduled.size } }
}

/**
 * A parent window whose `message` listeners can be driven by hand, plus a child
 * window that records everything the parent posts.
 */
function createBus() {
  const listeners = new Set()
  const posted = []
  const childWindow = {
    postMessage(message, targetOrigin) {
      posted.push({ message, targetOrigin })
    },
  }

  return {
    childWindow,
    posted,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    /** Deliver a message as if it came from the child iframe. */
    fromChild(data, { source = childWindow, origin = CHILD_ORIGIN } = {}) {
      for (const listener of [...listeners]) listener({ data, origin, source })
    },
    ofType(type) {
      return posted.filter((entry) => entry.message.type === type)
    },
    lastOfType(type) {
      const all = this.ofType(type)
      return all.length > 0 ? all[all.length - 1].message : null
    },
  }
}

function setup(options = {}) {
  const clock = createClock()
  const bus = createBus()
  const events = { ready: [], timeout: [], applied: [], states: [] }
  let sessionCounter = 0

  const handshake = createPreviewHandshake({
    childOrigin: CHILD_ORIGIN,
    getChildWindow: () => bus.childWindow,
    subscribe: (listener) => bus.subscribe(listener),
    timers: clock.timers,
    createSessionId: () => `session-${++sessionCounter}`,
    onState: (state) => events.states.push(state),
    onReady: (sessionId) => events.ready.push(sessionId),
    onTimeout: (sessionId) => events.timeout.push(sessionId),
    onApplied: (message) => events.applied.push(message),
    ...options,
  })

  return { clock, bus, events, handshake }
}

test("happy path: load triggers a request, readiness reveals and acks", () => {
  const { bus, handshake, events } = setup()
  handshake.start()
  handshake.handleLoad()

  const request = bus.lastOfType("lvcn:ready-request")
  assert.equal(request.sessionId, "session-1")
  assert.equal(bus.posted[0].targetOrigin, CHILD_ORIGIN, "never posts to a wildcard origin")
  assert.equal(handshake.getState().revealed, false)

  bus.fromChild({ type: "lvcn:ready", sessionId: request.sessionId })

  assert.equal(handshake.getState().phase, "ready")
  assert.equal(handshake.getState().revealed, true)
  assert.deepEqual(events.ready, ["session-1"])
  assert.equal(bus.ofType("lvcn:ready-ack").length, 1)
})

test("a dropped first ready is recovered by the next request", () => {
  const { bus, clock, handshake } = setup()
  handshake.start()
  handshake.handleLoad()

  // The child answered, but the message never arrived: nothing is delivered here.
  assert.equal(handshake.getState().requests, 1)
  assert.equal(handshake.getState().revealed, false)

  clock.advance(READY_REQUEST_INTERVAL_MS)
  assert.equal(handshake.getState().requests, 2, "the request is retried")

  bus.fromChild({ type: "lvcn:ready", sessionId: handshake.getState().sessionId })
  assert.equal(handshake.getState().revealed, true)
})

test("readiness sent before the parent listener exists is recovered on load", () => {
  const { bus, handshake } = setup()

  // Child posted `lvcn:ready` while the parent had no listener at all.
  bus.fromChild({ type: "lvcn:ready", sessionId: null })

  handshake.start()
  handshake.handleLoad()
  const request = bus.lastOfType("lvcn:ready-request")
  assert.ok(request, "load asks again rather than trusting the lost event")

  bus.fromChild({ type: "lvcn:ready", sessionId: request.sessionId })
  assert.equal(handshake.getState().revealed, true)
})

test("an unsolicited child hello triggers an immediate request", () => {
  const { bus, handshake } = setup()
  handshake.start()
  const before = handshake.getState().requests

  bus.fromChild({ type: "lvcn:ready", sessionId: null })

  assert.equal(handshake.getState().requests, before + 1)
  assert.equal(handshake.getState().revealed, false, "a hello is not readiness")
})

test("the legacy one-shot host stays transparent for the same ordering", () => {
  // Characterizes the defect the protocol replaces: a single `lvcn:ready` posted
  // before the parent effect ran was lost forever and `ready` never became true.
  const bus = createBus()
  bus.fromChild({ type: "lvcn:ready" })

  let ready = false
  const unsubscribe = bus.subscribe((event) => {
    if (event.data?.type === "lvcn:ready") ready = true
  })
  // The legacy host had no request, no retry, no timeout and no onLoad recovery,
  // so nothing else can happen after this point.
  assert.equal(ready, false, "legacy host is permanently stuck at opacity-0")
  unsubscribe()

  // Same ordering, new protocol: revealed.
  const { bus: bus2, handshake } = setup()
  bus2.fromChild({ type: "lvcn:ready", sessionId: null })
  handshake.start()
  handshake.handleLoad()
  bus2.fromChild({ type: "lvcn:ready", sessionId: handshake.getState().sessionId })
  assert.equal(handshake.getState().revealed, true)
})

test("a stale ready from a previous session is ignored", () => {
  const { bus, handshake } = setup()
  handshake.start()
  handshake.handleLoad()
  const staleSession = handshake.getState().sessionId

  // `src` changed: the old document's answer must not reveal the new one.
  handshake.restart()
  handshake.handleLoad()
  const freshSession = handshake.getState().sessionId
  assert.notEqual(freshSession, staleSession)
  assert.equal(handshake.getState().requests, 1, "request count resets per session")

  bus.fromChild({ type: "lvcn:ready", sessionId: staleSession })
  assert.equal(handshake.getState().revealed, false, "stale session rejected")
  assert.equal(bus.ofType("lvcn:ready-ack").length, 0)

  bus.fromChild({ type: "lvcn:ready", sessionId: freshSession })
  assert.equal(handshake.getState().revealed, true)
})

test("a post-ready iframe reload opens a fresh hidden session", () => {
  const { bus, clock, handshake, events } = setup()
  handshake.start()
  handshake.handleLoad()
  const previousSession = handshake.getState().sessionId
  bus.fromChild({ type: "lvcn:ready", sessionId: previousSession })
  assert.equal(handshake.getState().revealed, true)

  handshake.handleLoad()
  const replacementSession = handshake.getState().sessionId
  assert.notEqual(replacementSession, previousSession)
  assert.deepEqual(handshake.getState(), {
    phase: "connecting",
    sessionId: replacementSession,
    requests: 1,
    revealed: false,
  })
  assert.equal(bus.lastOfType("lvcn:ready-request").sessionId, replacementSession)

  bus.fromChild({ type: "lvcn:ready", sessionId: previousSession })
  assert.equal(handshake.getState().revealed, false, "old document cannot reveal the replacement")

  bus.fromChild({ type: "lvcn:ready", sessionId: replacementSession })
  assert.equal(handshake.getState().revealed, true)
  assert.deepEqual(events.ready, [previousSession, replacementSession])
  handshake.destroy()
  assert.equal(clock.pending, 0)
})

test("a post-confirmation iframe reload also returns to connecting", () => {
  const { bus, handshake } = setup({ requireConfirmation: true })
  handshake.start()
  handshake.handleLoad()
  const previousSession = handshake.getState().sessionId
  bus.fromChild({ type: "lvcn:ready", sessionId: previousSession })
  handshake.confirm()
  assert.equal(handshake.getState().phase, "confirmed")

  handshake.handleLoad()
  assert.notEqual(handshake.getState().sessionId, previousSession)
  assert.equal(handshake.getState().phase, "connecting")
  assert.equal(handshake.getState().revealed, false)
  handshake.destroy()
})

test("a new child hello recovers a reload even when its load event was missed", () => {
  const { bus, handshake } = setup()
  handshake.start()
  handshake.handleLoad()
  const previousSession = handshake.getState().sessionId
  bus.fromChild({ type: "lvcn:ready", sessionId: previousSession })

  bus.fromChild({ type: "lvcn:ready", sessionId: null })
  const replacementSession = handshake.getState().sessionId
  assert.notEqual(replacementSession, previousSession)
  assert.equal(handshake.getState().revealed, false)
  assert.equal(bus.lastOfType("lvcn:ready-request").sessionId, replacementSession)
  handshake.destroy()
})

test("frame projection hides a replacement before its passive effect runs", () => {
  const readySnapshot = {
    frameKey: "first::0",
    state: { phase: "ready", sessionId: "session-1", requests: 1, revealed: true },
  }

  assert.equal(projectPreviewHandshakeState("first::0", readySnapshot).revealed, true)
  assert.deepEqual(projectPreviewHandshakeState("second::0", readySnapshot), {
    phase: "connecting",
    sessionId: null,
    requests: 0,
    revealed: false,
  })
})

test("rapid src replacement cannot reveal through a detached frame", () => {
  const clock = createClock()
  const bus = createBus()
  const detached = { postMessage() {} }
  let current = detached

  const handshake = createPreviewHandshake({
    childOrigin: CHILD_ORIGIN,
    getChildWindow: () => current,
    subscribe: (listener) => bus.subscribe(listener),
    timers: clock.timers,
    createSessionId: () => "session-x",
  })
  handshake.start()
  const session = handshake.getState().sessionId

  // The iframe was replaced; `contentWindow` is a different object now.
  current = bus.childWindow
  bus.fromChild({ type: "lvcn:ready", sessionId: session }, { source: detached })
  assert.equal(handshake.getState().revealed, false, "old window is not the current window")

  bus.fromChild({ type: "lvcn:ready", sessionId: session })
  assert.equal(handshake.getState().revealed, true)
  handshake.destroy()
})

test("a correct message from the wrong source window is ignored", () => {
  const { bus, handshake } = setup()
  handshake.start()
  handshake.handleLoad()

  bus.fromChild(
    { type: "lvcn:ready", sessionId: handshake.getState().sessionId },
    { source: { postMessage() {} } }
  )
  assert.equal(handshake.getState().revealed, false)
})

test("a correct message from the wrong origin is ignored", () => {
  const { bus, handshake } = setup()
  handshake.start()
  handshake.handleLoad()

  bus.fromChild(
    { type: "lvcn:ready", sessionId: handshake.getState().sessionId },
    { origin: OTHER_ORIGIN }
  )
  assert.equal(handshake.getState().revealed, false)
})

test("a child that never answers is revealed by the timeout", () => {
  const { clock, handshake, events, bus } = setup()
  handshake.start()
  handshake.handleLoad()

  clock.advance(READY_TIMEOUT_MS - 1)
  assert.equal(handshake.getState().revealed, false)

  clock.advance(1)
  assert.equal(handshake.getState().phase, "unreachable")
  assert.equal(handshake.getState().revealed, true, "never permanently transparent")
  assert.equal(events.timeout.length, 1)

  const requestsAtTimeout = bus.ofType("lvcn:ready-request").length
  clock.advance(READY_REQUEST_INTERVAL_MS * 10)
  assert.equal(
    bus.ofType("lvcn:ready-request").length,
    requestsAtTimeout,
    "retrying stops once the timeout fired"
  )
  handshake.destroy()
  assert.equal(clock.pending, 0, "no timer is left behind")
})

test("configuration changed before readiness is delivered with the final values", () => {
  const clock = createClock()
  const bus = createBus()
  const config = { colorScheme: "light", preset: "aB1" }
  let handshake

  handshake = createPreviewHandshake({
    childOrigin: CHILD_ORIGIN,
    getChildWindow: () => bus.childWindow,
    subscribe: (listener) => bus.subscribe(listener),
    timers: clock.timers,
    createSessionId: () => "session-1",
    // Mirrors the hook: readiness always sends the newest configuration.
    onReady: () => handshake.sendPreset({ revision: 1, ...config }),
  })
  handshake.start()
  handshake.handleLoad()

  // The user toggled dark mode and shuffled while the frame was still connecting.
  config.colorScheme = "dark"
  config.preset = "aZ9"

  bus.fromChild({ type: "lvcn:ready", sessionId: "session-1" })

  const preset = bus.lastOfType("lvcn:preset")
  assert.deepEqual(preset, {
    type: "lvcn:preset",
    sessionId: "session-1",
    revision: 1,
    colorScheme: "dark",
    preset: "aZ9",
  })
  const ackIndex = bus.posted.findIndex((entry) => entry.message.type === "lvcn:ready-ack")
  const presetIndex = bus.posted.findIndex((entry) => entry.message.type === "lvcn:preset")
  assert.ok(ackIndex < presetIndex, "acknowledge first, then configure")
  handshake.destroy()
})

test("repeated readiness for the same session is idempotent", () => {
  const { bus, handshake, events } = setup()
  handshake.start()
  handshake.handleLoad()
  const session = handshake.getState().sessionId

  bus.fromChild({ type: "lvcn:ready", sessionId: session })
  bus.fromChild({ type: "lvcn:ready", sessionId: session })
  bus.fromChild({ type: "lvcn:ready", sessionId: session })

  assert.deepEqual(events.ready, [session], "onReady runs once per session")
  assert.equal(bus.ofType("lvcn:ready-ack").length, 3, "every answer is acknowledged")
})

test("retrying stops as soon as the child is ready", () => {
  const { bus, clock, handshake } = setup()
  handshake.start()
  handshake.handleLoad()
  bus.fromChild({ type: "lvcn:ready", sessionId: handshake.getState().sessionId })

  const requests = bus.ofType("lvcn:ready-request").length
  clock.advance(READY_REQUEST_INTERVAL_MS * 20)
  assert.equal(bus.ofType("lvcn:ready-request").length, requests)
  handshake.destroy()
  assert.equal(clock.pending, 0)
})

test("confirmation hosts wait for the applied echo but still fail open", () => {
  const { bus, handshake, events } = setup({ requireConfirmation: true })
  handshake.start()
  handshake.handleLoad()
  bus.fromChild({ type: "lvcn:ready", sessionId: handshake.getState().sessionId })

  assert.equal(handshake.getState().phase, "ready")
  assert.equal(handshake.getState().revealed, false, "not revealed on readiness alone")

  bus.fromChild({
    type: "lvcn:applied",
    sessionId: handshake.getState().sessionId,
    revision: 1,
    colorScheme: "dark",
    preset: "aZ9",
  })
  assert.equal(events.applied.length, 1)

  handshake.confirm()
  assert.equal(handshake.getState().phase, "confirmed")
  assert.equal(handshake.getState().revealed, true)
  handshake.destroy()
})

test("a confirmation host that is never confirmed is revealed by the timeout", () => {
  const { bus, clock, handshake } = setup({ requireConfirmation: true })
  handshake.start()
  handshake.handleLoad()
  bus.fromChild({ type: "lvcn:ready", sessionId: handshake.getState().sessionId })

  clock.advance(READY_TIMEOUT_MS)
  assert.equal(handshake.getState().phase, "unreachable")
  assert.equal(handshake.getState().revealed, true)
  handshake.destroy()
})

test("an applied echo from another session is dropped", () => {
  const { bus, handshake, events } = setup({ requireConfirmation: true })
  handshake.start()
  bus.fromChild({
    type: "lvcn:applied",
    sessionId: "session-999",
    revision: 1,
    colorScheme: "light",
  })
  assert.equal(events.applied.length, 0)
  handshake.destroy()
})

test("late events after destroy cannot change state", () => {
  const { bus, clock, handshake } = setup()
  handshake.start()
  handshake.handleLoad()
  const session = handshake.getState().sessionId
  handshake.destroy()

  bus.fromChild({ type: "lvcn:ready", sessionId: session })
  clock.advance(READY_TIMEOUT_MS * 2)

  assert.equal(handshake.getState().revealed, false)
  assert.equal(handshake.getState().phase, "connecting")
  assert.equal(clock.pending, 0)
})

test("malformed and forged payloads are rejected", () => {
  const { bus, handshake } = setup()
  handshake.start()
  handshake.handleLoad()

  for (const payload of [
    null,
    undefined,
    "lvcn:ready",
    42,
    { type: "lvcn:ready-request", sessionId: handshake.getState().sessionId },
    { type: "lvcn:ready", sessionId: 7 },
    { type: "lvcn:applied", sessionId: handshake.getState().sessionId },
  ]) {
    bus.fromChild(payload)
  }

  assert.equal(handshake.getState().revealed, false)
  handshake.destroy()
})
