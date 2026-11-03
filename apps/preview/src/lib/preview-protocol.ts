/**
 * `lvcn:*` preview handshake protocol — child (presenter) side of the contract.
 *
 * Mirror of `apps/v2/lib/preview-protocol.ts`. The message names, field names and
 * timing constants in the two files must stay identical; the paired test in
 * `__tests__/preview-child.test.mjs` runs both machines against one another so a
 * drift breaks a test rather than a preview.
 *
 * The presenter can be embedded (docs, blocks, customizer) or opened directly as
 * a top-level page. When it is top level there is no parent to talk to and the
 * machine stays inert.
 *
 * Origin handling: the parent origin is normally derived from `document.referrer`
 * before the first message is sent. When the referrer is unavailable — a common
 * local-development situation, e.g. a stripped `Referrer-Policy` — the first
 * `lvcn:ready` hello is posted with a `*` target because it carries nothing but
 * its own message name. The origin is then *locked* to the origin of the first
 * validated parent message, and every later post uses that exact origin. So no
 * configuration or applied payload is ever broadcast with a wildcard target.
 */

/** Message name constants. Keep in sync with the v2 mirror. */
export const READY_REQUEST_MESSAGE = 'lvcn:ready-request';
export const READY_MESSAGE = 'lvcn:ready';
export const READY_ACK_MESSAGE = 'lvcn:ready-ack';
export const PRESET_MESSAGE = 'lvcn:preset';
export const APPLIED_MESSAGE = 'lvcn:applied';

/** Matches the parent request interval; both sides retry at the same cadence. */
export const READY_RETRY_INTERVAL_MS = 250;

/**
 * Upper bound on unsolicited ready retries (250 ms × 40 = 10 s). After this the
 * child stops volunteering, but it still answers every `lvcn:ready-request`
 * forever, so a late parent can always complete the handshake.
 */
export const READY_MAX_ATTEMPTS = 40;

export type PreviewColorScheme = 'light' | 'dark';

export type ReadyRequestMessage = {
  type: typeof READY_REQUEST_MESSAGE;
  sessionId: string;
};

export type ReadyMessage = {
  type: typeof READY_MESSAGE;
  sessionId: string | null;
};

export type ReadyAckMessage = {
  type: typeof READY_ACK_MESSAGE;
  sessionId: string;
};

export type PresetMessage = {
  type: typeof PRESET_MESSAGE;
  sessionId: string;
  revision: number;
  colorScheme: PreviewColorScheme;
  preset?: string;
};

export type AppliedMessage = {
  type: typeof APPLIED_MESSAGE;
  sessionId: string;
  revision: number;
  colorScheme: PreviewColorScheme;
  preset?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function isColorScheme(value: unknown): value is PreviewColorScheme {
  return value === 'light' || value === 'dark';
}

export function isReadyRequestMessage(value: unknown): value is ReadyRequestMessage {
  return (
    isRecord(value) &&
    value.type === READY_REQUEST_MESSAGE &&
    typeof value.sessionId === 'string' &&
    value.sessionId.length > 0
  );
}

export function isReadyAckMessage(value: unknown): value is ReadyAckMessage {
  return (
    isRecord(value) &&
    value.type === READY_ACK_MESSAGE &&
    typeof value.sessionId === 'string' &&
    value.sessionId.length > 0
  );
}

export function isPresetMessage(value: unknown): value is PresetMessage {
  return (
    isRecord(value) &&
    value.type === PRESET_MESSAGE &&
    typeof value.sessionId === 'string' &&
    value.sessionId.length > 0 &&
    typeof value.revision === 'number' &&
    isColorScheme(value.colorScheme) &&
    (value.preset === undefined || typeof value.preset === 'string')
  );
}

/** Minimal structural view of `window.parent`. */
export type PreviewParentWindow = {
  postMessage: (message: unknown, targetOrigin: string) => void;
};

/** Minimal structural view of a `MessageEvent`. */
export type PreviewMessageEvent = {
  data: unknown;
  origin: string;
  source: unknown;
};

export type PreviewTimers = {
  setInterval: (handler: () => void, ms: number) => unknown;
  clearInterval: (handle: unknown) => void;
};

export const defaultPreviewTimers: PreviewTimers = {
  setInterval: (handler, ms) => setInterval(handler, ms),
  clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
};

export type PreviewChildOptions = {
  /** Registers a `message` listener and returns its cleanup function. */
  subscribe: (listener: (event: PreviewMessageEvent) => void) => () => void;
  /** `null` when this document is top level (nothing to hand shake with). */
  getParent: () => PreviewParentWindow | null;
  /** Origin derived from the referrer, or `null` when unknown. */
  initialParentOrigin?: string | null;
  /** Called for each accepted, in-session, newer-revision configuration. */
  onPreset?: (message: PresetMessage) => void;
  onAcknowledged?: (sessionId: string) => void;
  retryIntervalMs?: number;
  maxAttempts?: number;
  timers?: PreviewTimers;
};

export type PreviewChild = {
  start: () => void;
  destroy: () => void;
  handleMessage: (event: PreviewMessageEvent) => void;
  getSessionId: () => string | null;
  getParentOrigin: () => string | null;
  isAcknowledged: () => boolean;
  /** Number of `lvcn:ready` messages posted (hello + retries + answers). */
  getReadyCount: () => number;
  /** Reports an applied configuration for the current session. */
  postApplied: (payload: {
    revision: number;
    colorScheme: PreviewColorScheme;
    preset?: string;
  }) => boolean;
};

export function createPreviewChild(options: PreviewChildOptions): PreviewChild {
  const {
    subscribe,
    getParent,
    initialParentOrigin = null,
    onPreset,
    onAcknowledged,
    retryIntervalMs = READY_RETRY_INTERVAL_MS,
    maxAttempts = READY_MAX_ATTEMPTS,
    timers = defaultPreviewTimers,
  } = options;

  let parentOrigin: string | null = initialParentOrigin;
  let sessionId: string | null = null;
  let acknowledged = false;
  let attempts = 0;
  let readyCount = 0;
  let lastRevision = -1;
  let retryHandle: unknown = null;
  let unsubscribe: (() => void) | null = null;
  let disposed = false;

  function stopRetrying() {
    if (retryHandle !== null) {
      timers.clearInterval(retryHandle);
      retryHandle = null;
    }
  }

  function post(message: unknown): boolean {
    const parent = getParent();
    if (!parent) return false;
    try {
      // Wildcard only while the parent origin is still unknown, and only for the
      // ready hello, which carries no data of its own.
      parent.postMessage(message, parentOrigin ?? '*');
      return true;
    } catch {
      // Cross-origin restrictions or a detached parent: the retry loop covers it.
      return false;
    }
  }

  function sendReady() {
    if (disposed || acknowledged) return;
    if (post({ type: READY_MESSAGE, sessionId })) readyCount += 1;
  }

  function retryTick() {
    if (disposed || acknowledged) {
      stopRetrying();
      return;
    }
    attempts += 1;
    if (attempts > maxAttempts) {
      stopRetrying();
      return;
    }
    sendReady();
  }

  function handleMessage(event: PreviewMessageEvent) {
    if (disposed) return;

    const parent = getParent();
    if (!parent || event.source !== parent) return;
    if (parentOrigin !== null && event.origin !== parentOrigin) return;

    const data = event.data;

    if (isReadyRequestMessage(data)) {
      // First validated parent message locks the origin for every later post.
      if (parentOrigin === null) parentOrigin = event.origin;
      if (data.sessionId !== sessionId) {
        // New session (reload, retry, replaced src): answer it and start over.
        sessionId = data.sessionId;
        acknowledged = false;
        lastRevision = -1;
      }
      // Idempotent: every request gets exactly one answer.
      if (!acknowledged) sendReady();
      return;
    }

    if (isReadyAckMessage(data)) {
      if (parentOrigin === null) parentOrigin = event.origin;
      if (data.sessionId !== sessionId) return;
      if (acknowledged) return;
      acknowledged = true;
      stopRetrying();
      onAcknowledged?.(data.sessionId);
      return;
    }

    if (isPresetMessage(data)) {
      if (parentOrigin === null) parentOrigin = event.origin;
      if (sessionId === null || data.sessionId !== sessionId) return;
      // Out-of-order or replayed delivery must not undo a newer configuration.
      if (data.revision <= lastRevision) return;
      lastRevision = data.revision;
      onPreset?.(data);
    }
  }

  return {
    start() {
      if (disposed) return;
      unsubscribe?.();
      // Listener first: an answer that arrives immediately must not be missed.
      unsubscribe = subscribe(handleMessage);
      if (!getParent()) return;
      sendReady();
      retryHandle = timers.setInterval(retryTick, retryIntervalMs);
    },

    destroy() {
      disposed = true;
      stopRetrying();
      unsubscribe?.();
      unsubscribe = null;
    },

    handleMessage,
    getSessionId: () => sessionId,
    getParentOrigin: () => parentOrigin,
    isAcknowledged: () => acknowledged,
    getReadyCount: () => readyCount,

    postApplied(payload) {
      if (disposed || sessionId === null) return false;
      return post({
        type: APPLIED_MESSAGE,
        sessionId,
        revision: payload.revision,
        colorScheme: payload.colorScheme,
        preset: payload.preset,
      });
    },
  };
}

/** Origin of the embedding document, or `null` when it cannot be determined. */
export function getReferrerOrigin(referrer: string | undefined | null): string | null {
  if (!referrer) return null;
  try {
    return new URL(referrer).origin;
  } catch {
    return null;
  }
}
