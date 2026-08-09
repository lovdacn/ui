/**
 * `lvcn:*` preview handshake protocol — parent (v2 host) side of the contract.
 *
 * The presenter lives on a different origin inside an iframe, so readiness can
 * never depend on a single fire-and-forget event: if the child posts before the
 * parent listener exists, the message is gone and the frame would stay
 * transparent forever. Instead both sides speak an idempotent, session-scoped
 * handshake that can be replayed any number of times:
 *
 *   parent  --lvcn:ready-request(sessionId)-->  child   (repeated until answered)
 *   child   --lvcn:ready(sessionId)---------->  parent  (repeated until acked)
 *   parent  --lvcn:ready-ack(sessionId)------>  child   (stops both retries)
 *   parent  --lvcn:preset(sessionId, rev)---->  child   (configuration delivery)
 *   child   --lvcn:applied(sessionId, rev)--->  parent  (optional confirmation)
 *
 * `lvcn:ready` with `sessionId: null` is the child's unsolicited "hello" on
 * mount. It is intentionally *not* accepted as readiness — there is no session to
 * validate yet — it only tells the parent to send its `lvcn:ready-request`
 * immediately instead of waiting for the next retry tick.
 *
 * The child mirror of this file is `apps/preview/src/lib/preview-protocol.ts`.
 * Message names, field names, and timing constants must stay identical in both.
 * Both files are deliberately dependency-free and side-effect-injected
 * (subscription, target window, timers, session ids) so the races in section 5.1
 * of ANIMATION_MOTION_REMEDIATION_PLAN.md can be tested deterministically
 * without a browser or a live iframe. See `__tests__/preview-handshake.test.mjs`.
 */

/** Message name constants. Keep in sync with the presenter mirror. */
export const READY_REQUEST_MESSAGE = "lvcn:ready-request"
export const READY_MESSAGE = "lvcn:ready"
export const READY_ACK_MESSAGE = "lvcn:ready-ack"
export const PRESET_MESSAGE = "lvcn:preset"
export const APPLIED_MESSAGE = "lvcn:applied"

/**
 * How often the parent re-sends `lvcn:ready-request` while waiting. Short enough
 * that a dropped message costs a barely perceptible delay.
 */
export const READY_REQUEST_INTERVAL_MS = 250

/**
 * How long the parent waits before it gives up and reveals a recoverable state.
 * This is the guarantee that a loaded iframe is never left at `opacity: 0`.
 */
export const READY_TIMEOUT_MS = 5_000

export type PreviewColorScheme = "light" | "dark"

/** Parent → child: "are you there? this is the current session". */
export type ReadyRequestMessage = {
  type: typeof READY_REQUEST_MESSAGE
  sessionId: string
}

/** Child → parent: "I am there". `null` session = unsolicited mount hello. */
export type ReadyMessage = {
  type: typeof READY_MESSAGE
  sessionId: string | null
}

/** Parent → child: "I heard you, stop retrying". */
export type ReadyAckMessage = {
  type: typeof READY_ACK_MESSAGE
  sessionId: string
}

/** Parent → child: configuration for the current session. */
export type PresetMessage = {
  type: typeof PRESET_MESSAGE
  sessionId: string
  /** Monotonic per session; lets the child drop out-of-order deliveries. */
  revision: number
  colorScheme: PreviewColorScheme
  preset?: string
}

/** Child → parent: "the configuration of this revision is now on screen". */
export type AppliedMessage = {
  type: typeof APPLIED_MESSAGE
  sessionId: string
  revision: number
  colorScheme: PreviewColorScheme
  preset?: string
}

export type PreviewMessage =
  | ReadyRequestMessage
  | ReadyMessage
  | ReadyAckMessage
  | PresetMessage
  | AppliedMessage

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null
}

function isColorScheme(value: unknown): value is PreviewColorScheme {
  return value === "light" || value === "dark"
}

export function isReadyRequestMessage(value: unknown): value is ReadyRequestMessage {
  return (
    isRecord(value) &&
    value.type === READY_REQUEST_MESSAGE &&
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0
  )
}

export function isReadyMessage(value: unknown): value is ReadyMessage {
  if (!isRecord(value) || value.type !== READY_MESSAGE) return false
  return (
    value.sessionId === null ||
    value.sessionId === undefined ||
    typeof value.sessionId === "string"
  )
}

export function isReadyAckMessage(value: unknown): value is ReadyAckMessage {
  return (
    isRecord(value) &&
    value.type === READY_ACK_MESSAGE &&
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0
  )
}

export function isPresetMessage(value: unknown): value is PresetMessage {
  return (
    isRecord(value) &&
    value.type === PRESET_MESSAGE &&
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0 &&
    typeof value.revision === "number" &&
    isColorScheme(value.colorScheme) &&
    (value.preset === undefined || typeof value.preset === "string")
  )
}

export function isAppliedMessage(value: unknown): value is AppliedMessage {
  return (
    isRecord(value) &&
    value.type === APPLIED_MESSAGE &&
    typeof value.sessionId === "string" &&
    value.sessionId.length > 0 &&
    typeof value.revision === "number" &&
    isColorScheme(value.colorScheme) &&
    (value.preset === undefined || typeof value.preset === "string")
  )
}

/**
 * True for an unsolicited child hello (`sessionId` absent or null). A hello must
 * never be treated as readiness for the current session.
 */
export function isChildHello(value: unknown): boolean {
  return isReadyMessage(value) && (value.sessionId === null || value.sessionId === undefined)
}

let fallbackSessionCounter = 0

/** Opaque, per-iframe-load session identifier. */
export function createSessionId(): string {
  const webCrypto = typeof globalThis === "undefined" ? undefined : globalThis.crypto
  if (webCrypto && typeof webCrypto.randomUUID === "function") {
    return webCrypto.randomUUID()
  }
  fallbackSessionCounter += 1
  return `lvcn-${Date.now().toString(36)}-${fallbackSessionCounter}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

/* ------------------------------------------------------------------------- *
 * Parent state machine
 *
 *   connecting --lvcn:ready(matching session)--> ready
 *   ready      --confirm()---------------------> confirmed  (confirmation hosts)
 *   connecting|ready --timeout----------------> unreachable
 *
 * `revealed` is the invariant that matters: it becomes true on readiness (or
 * confirmation) *and* on timeout, so no path leaves a loaded iframe transparent.
 * ------------------------------------------------------------------------- */

export type PreviewHandshakePhase = "connecting" | "ready" | "confirmed" | "unreachable"

export type PreviewHandshakeState = {
  phase: PreviewHandshakePhase
  /** Session of the current iframe load; `null` before the first start. */
  sessionId: string | null
  /** Number of `lvcn:ready-request` messages sent for the current session. */
  requests: number
  /** True as soon as the iframe may be shown to the user. */
  revealed: boolean
}

export type PreviewHandshakeSnapshot = {
  frameKey: string
  state: PreviewHandshakeState
}

/**
 * Projects hook state onto the iframe generation currently being rendered.
 * React replaces a keyed iframe during render, before the passive effect can
 * start its handshake. A snapshot from the previous key must therefore fail
 * closed synchronously instead of revealing the replacement for one paint.
 */
export function projectPreviewHandshakeState(
  frameKey: string,
  snapshot: PreviewHandshakeSnapshot
): PreviewHandshakeState {
  if (snapshot.frameKey === frameKey) return snapshot.state
  return { phase: "connecting", sessionId: null, requests: 0, revealed: false }
}

/** Minimal structural view of `iframe.contentWindow`. */
export type PreviewChildWindow = {
  postMessage: (message: unknown, targetOrigin: string) => void
}

/** Minimal structural view of a `MessageEvent`. */
export type PreviewMessageEvent = {
  data: unknown
  origin: string
  source: unknown
}

export type PreviewTimers = {
  setTimeout: (handler: () => void, ms: number) => unknown
  clearTimeout: (handle: unknown) => void
  setInterval: (handler: () => void, ms: number) => unknown
  clearInterval: (handle: unknown) => void
}

export const defaultPreviewTimers: PreviewTimers = {
  setTimeout: (handler, ms) => setTimeout(handler, ms),
  clearTimeout: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
  setInterval: (handler, ms) => setInterval(handler, ms),
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
}

export type PreviewHandshakeOptions = {
  /** Exact origin the presenter is served from. Messages from anywhere else are dropped. */
  childOrigin: string
  /** Resolved lazily: the iframe may not be mounted yet, or may have been replaced. */
  getChildWindow: () => PreviewChildWindow | null
  /** Registers a `message` listener and returns its cleanup function. */
  subscribe: (listener: (event: PreviewMessageEvent) => void) => () => void
  onState?: (state: PreviewHandshakeState) => void
  /** Runs once per session right after the ack — the place to push configuration. */
  onReady?: (sessionId: string) => void
  onApplied?: (message: AppliedMessage) => void
  onTimeout?: (sessionId: string) => void
  /**
   * When true, `lvcn:ready` alone does not reveal the frame; the host calls
   * `confirm()` once the child reports the configuration is actually on screen.
   * The safety timeout stays armed until then.
   */
  requireConfirmation?: boolean
  requestIntervalMs?: number
  timeoutMs?: number
  createSessionId?: () => string
  timers?: PreviewTimers
}

export type PreviewHandshake = {
  getState: () => PreviewHandshakeState
  /** Subscribes and opens the first session. */
  start: () => void
  /** Drops the old session and opens a new one (src change or manual retry). */
  restart: () => void
  /** Wire to the iframe `load` event. */
  handleLoad: () => void
  handleMessage: (event: PreviewMessageEvent) => void
  /** Marks the current session confirmed (only meaningful with `requireConfirmation`). */
  confirm: () => void
  /** Sends `lvcn:preset` for the current session. False when there is nothing to send to. */
  sendPreset: (config: {
    revision: number
    colorScheme: PreviewColorScheme
    preset?: string
  }) => boolean
  destroy: () => void
}

export function createPreviewHandshake(options: PreviewHandshakeOptions): PreviewHandshake {
  const {
    childOrigin,
    getChildWindow,
    subscribe,
    onState,
    onReady,
    onApplied,
    onTimeout,
    requireConfirmation = false,
    requestIntervalMs = READY_REQUEST_INTERVAL_MS,
    timeoutMs = READY_TIMEOUT_MS,
    createSessionId: makeSessionId = createSessionId,
    timers = defaultPreviewTimers,
  } = options

  let state: PreviewHandshakeState = {
    phase: "connecting",
    sessionId: null,
    requests: 0,
    revealed: false,
  }
  let retryHandle: unknown = null
  let timeoutHandle: unknown = null
  let unsubscribe: (() => void) | null = null
  let disposed = false
  let hasObservedLoad = false

  function emit(next: Partial<PreviewHandshakeState>) {
    state = { ...state, ...next }
    onState?.(state)
  }

  function stopRetrying() {
    if (retryHandle !== null) {
      timers.clearInterval(retryHandle)
      retryHandle = null
    }
  }

  function stopTimeout() {
    if (timeoutHandle !== null) {
      timers.clearTimeout(timeoutHandle)
      timeoutHandle = null
    }
  }

  function post(message: unknown): boolean {
    const child = getChildWindow()
    if (!child) return false
    try {
      child.postMessage(message, childOrigin)
      return true
    } catch {
      // A navigating or detached frame can throw; the retry loop covers it.
      return false
    }
  }

  function sendReadyRequest() {
    if (disposed || state.sessionId === null) return
    if (state.phase === "ready" || state.phase === "confirmed") return
    post({ type: READY_REQUEST_MESSAGE, sessionId: state.sessionId })
    emit({ requests: state.requests + 1 })
  }

  function requestImmediately() {
    stopRetrying()
    sendReadyRequest()
    retryHandle = timers.setInterval(sendReadyRequest, requestIntervalMs)
  }

  function beginSession() {
    stopRetrying()
    stopTimeout()
    hasObservedLoad = false

    const sessionId = makeSessionId()
    // Reset before any timer is armed so a stale reveal can never leak forward.
    state = { phase: "connecting", sessionId, requests: 0, revealed: false }
    onState?.(state)

    // The retry loop and the safety timeout are armed here rather than from
    // `load`: a `load` event that never fires — or that fired before the element
    // had its handler — must not be able to strand the frame.
    retryHandle = timers.setInterval(sendReadyRequest, requestIntervalMs)
    timeoutHandle = timers.setTimeout(() => {
      timeoutHandle = null
      if (disposed || state.revealed) return
      stopRetrying()
      emit({ phase: "unreachable", revealed: true })
      onTimeout?.(sessionId)
    }, timeoutMs)
  }

  function markReady() {
    const sessionId = state.sessionId
    if (sessionId === null) return

    stopRetrying()
    post({ type: READY_ACK_MESSAGE, sessionId })

    if (requireConfirmation) {
      // Keep the safety timeout armed: readiness is not yet a visible frame.
      emit({ phase: "ready" })
    } else {
      stopTimeout()
      emit({ phase: "ready", revealed: true })
    }

    onReady?.(sessionId)
  }

  function handleMessage(event: PreviewMessageEvent) {
    if (disposed || state.sessionId === null) return

    // Source first: an identical message from another frame or the opener must
    // not be able to reveal this iframe.
    const child = getChildWindow()
    if (!child || event.source !== child) return
    if (event.origin !== childOrigin) return

    const data = event.data

    if (isReadyMessage(data)) {
      if (isChildHello(data)) {
        // A hello after readiness can only come from a replacement document:
        // the acknowledged child has already stopped its hello retry loop.
        if (state.phase !== "connecting") beginSession()
        requestImmediately()
        return
      }
      // Stale session (previous `src`, previous document) — ignore.
      if (data.sessionId !== state.sessionId) return
      // Idempotent: repeated readiness for one session re-acks and nothing more.
      if (state.phase === "connecting") markReady()
      else post({ type: READY_ACK_MESSAGE, sessionId: state.sessionId })
      return
    }

    if (isAppliedMessage(data)) {
      if (data.sessionId !== state.sessionId) return
      onApplied?.(data)
    }
  }

  return {
    getState: () => state,

    start() {
      if (disposed) return
      unsubscribe?.()
      unsubscribe = subscribe(handleMessage)
      beginSession()
    },

    restart() {
      if (disposed) return
      beginSession()
    },

    handleLoad() {
      if (disposed || state.sessionId === null) return

      // The first load belongs to the session opened by start()/restart(). Any
      // later load means the iframe navigated in place and its new document no
      // longer knows the old session, even if the parent was already ready.
      if (hasObservedLoad) beginSession()
      hasObservedLoad = true

      // A delayed first load can arrive after the same document already became
      // ready through its mount hello. Do not throw that valid session away.
      if (state.phase === "ready" || state.phase === "confirmed") return
      requestImmediately()
    },

    handleMessage,

    confirm() {
      if (disposed || state.sessionId === null) return
      if (state.phase === "unreachable" || state.phase === "confirmed") return
      stopRetrying()
      stopTimeout()
      emit({ phase: "confirmed", revealed: true })
    },

    sendPreset(config) {
      if (disposed || state.sessionId === null) return false
      return post({
        type: PRESET_MESSAGE,
        sessionId: state.sessionId,
        revision: config.revision,
        colorScheme: config.colorScheme,
        preset: config.preset,
      })
    },

    destroy() {
      disposed = true
      stopRetrying()
      stopTimeout()
      unsubscribe?.()
      unsubscribe = null
    },
  }
}
