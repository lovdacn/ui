/**
 * Tests for the child (presenter) side of the `lvcn:*` preview handshake, plus a
 * paired end-to-end run of the real parent machine against the real child
 * machine over one fake message bus. The paired tests are what keep the two
 * mirrored protocol modules from drifting apart.
 *
 * Deterministic by construction: no DOM, no real iframe, no wall-clock waiting.
 *
 * Run with the Node test runner (no new dependencies), from the repository root:
 *   node --test apps/preview/src/lib/__tests__/preview-child.test.mjs
 */
import assert from 'node:assert/strict';
import test from 'node:test';

import {
  createPreviewChild,
  getReferrerOrigin,
  READY_MAX_ATTEMPTS,
  READY_RETRY_INTERVAL_MS,
} from '../preview-protocol.ts';
// Intentional cross-app import: both protocol mirrors are owned by the same
// workstream and only a test may reach across, never application code.
import {
  createPreviewHandshake,
  READY_REQUEST_INTERVAL_MS,
  READY_TIMEOUT_MS,
} from '../../../../v2/lib/preview-protocol.ts';

const PARENT_ORIGIN = 'https://lovdacn.dev';
const CHILD_ORIGIN = 'https://lovdacn.expo.app';
const OTHER_ORIGIN = 'https://evil.example';

/** Minimal deterministic replacement for setTimeout/setInterval. */
function createClock() {
  let now = 0;
  let sequence = 0;
  const scheduled = new Map();

  const timers = {
    setTimeout(handler, ms) {
      const id = ++sequence;
      scheduled.set(id, { at: now + ms, every: null, handler });
      return id;
    },
    clearTimeout(id) {
      scheduled.delete(id);
    },
    setInterval(handler, ms) {
      const id = ++sequence;
      scheduled.set(id, { at: now + ms, every: ms, handler });
      return id;
    },
    clearInterval(id) {
      scheduled.delete(id);
    },
  };

  function advance(ms) {
    const target = now + ms;
    for (;;) {
      let dueId = null;
      let due = null;
      for (const [id, timer] of scheduled) {
        if (timer.at <= target && (due === null || timer.at < due.at)) {
          dueId = id;
          due = timer;
        }
      }
      if (due === null) break;
      now = due.at;
      if (due.every === null) scheduled.delete(dueId);
      else due.at = now + due.every;
      due.handler();
    }
    now = target;
  }

  return { timers, advance, get pending() { return scheduled.size; } };
}

/** Child-only harness: a hand-driven parent window. */
function setupChild(options = {}) {
  const clock = createClock();
  const listeners = new Set();
  const posted = [];
  const parentWindow = {
    postMessage(message, targetOrigin) {
      posted.push({ message, targetOrigin });
    },
  };
  const presets = [];
  const acks = [];

  const child = createPreviewChild({
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getParent: () => parentWindow,
    initialParentOrigin: PARENT_ORIGIN,
    timers: clock.timers,
    onPreset: (message) => presets.push(message),
    onAcknowledged: (sessionId) => acks.push(sessionId),
    ...options,
  });

  return {
    child,
    clock,
    posted,
    presets,
    acks,
    parentWindow,
    fromParent(data, { source = parentWindow, origin = PARENT_ORIGIN } = {}) {
      for (const listener of [...listeners]) listener({ data, origin, source });
    },
    ofType(type) {
      return posted.filter((entry) => entry.message.type === type);
    },
    lastOfType(type) {
      const all = this.ofType(type);
      return all.length > 0 ? all[all.length - 1] : null;
    },
  };
}

test('the child says hello on mount without inventing a session', () => {
  const harness = setupChild();
  harness.child.start();

  const hello = harness.lastOfType('lvcn:ready');
  assert.deepEqual(hello.message, { type: 'lvcn:ready', sessionId: null });
  assert.equal(hello.targetOrigin, PARENT_ORIGIN, 'known origin is used, not a wildcard');
  assert.equal(harness.child.getSessionId(), null);
  harness.child.destroy();
});

test('every readiness request gets exactly one answer', () => {
  const harness = setupChild();
  harness.child.start();
  const before = harness.ofType('lvcn:ready').length;

  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });

  const answers = harness.ofType('lvcn:ready').slice(before);
  assert.equal(answers.length, 3);
  for (const answer of answers) {
    assert.deepEqual(answer.message, { type: 'lvcn:ready', sessionId: 's1' });
  }
  harness.child.destroy();
});

test('the child retries readiness until it is acknowledged', () => {
  const harness = setupChild();
  harness.child.start();
  assert.equal(harness.child.getReadyCount(), 1);

  harness.clock.advance(READY_RETRY_INTERVAL_MS * 3);
  assert.equal(harness.child.getReadyCount(), 4, 'retries on the shared interval');

  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });
  harness.fromParent({ type: 'lvcn:ready-ack', sessionId: 's1' });
  assert.equal(harness.child.isAcknowledged(), true);
  assert.deepEqual(harness.acks, ['s1']);

  const afterAck = harness.child.getReadyCount();
  harness.clock.advance(READY_RETRY_INTERVAL_MS * 20);
  assert.equal(harness.child.getReadyCount(), afterAck, 'retrying stops on the ack');
  assert.equal(harness.clock.pending, 0, 'no timer is left behind');
  harness.child.destroy();
});

test('unsolicited retries are bounded but requests are still answered forever', () => {
  const harness = setupChild();
  harness.child.start();

  harness.clock.advance(READY_RETRY_INTERVAL_MS * (READY_MAX_ATTEMPTS + 10));
  const capped = harness.child.getReadyCount();
  assert.ok(
    capped <= READY_MAX_ATTEMPTS + 1,
    `expected at most ${READY_MAX_ATTEMPTS + 1} hellos, saw ${capped}`
  );

  // A parent that shows up late still completes the handshake.
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 'late' });
  assert.equal(harness.child.getReadyCount(), capped + 1);
  assert.equal(harness.child.getSessionId(), 'late');
  harness.child.destroy();
});

test('an acknowledgment for another session is ignored', () => {
  const harness = setupChild();
  harness.child.start();
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });
  harness.fromParent({ type: 'lvcn:ready-ack', sessionId: 'other' });

  assert.equal(harness.child.isAcknowledged(), false);
  harness.child.destroy();
});

test('a new session restarts the child handshake', () => {
  const harness = setupChild();
  harness.child.start();
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });
  harness.fromParent({ type: 'lvcn:ready-ack', sessionId: 's1' });
  assert.equal(harness.child.isAcknowledged(), true);

  // The host remounted the frame: a different session id arrives.
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's2' });
  assert.equal(harness.child.getSessionId(), 's2');
  assert.equal(harness.child.isAcknowledged(), false);
  assert.deepEqual(harness.lastOfType('lvcn:ready').message, {
    type: 'lvcn:ready',
    sessionId: 's2',
  });
  harness.child.destroy();
});

test('configuration is applied only for the current session', () => {
  const harness = setupChild();
  harness.child.start();

  // Nothing to validate against yet.
  harness.fromParent({
    type: 'lvcn:preset',
    sessionId: 's1',
    revision: 1,
    colorScheme: 'dark',
  });
  assert.equal(harness.presets.length, 0);

  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });
  harness.fromParent({
    type: 'lvcn:preset',
    sessionId: 's1',
    revision: 1,
    colorScheme: 'dark',
    preset: 'aZ9',
  });
  assert.equal(harness.presets.length, 1);

  harness.fromParent({
    type: 'lvcn:preset',
    sessionId: 'other',
    revision: 2,
    colorScheme: 'light',
  });
  assert.equal(harness.presets.length, 1, 'foreign session dropped');
  harness.child.destroy();
});

test('replayed or out-of-order configuration cannot undo a newer one', () => {
  const harness = setupChild();
  harness.child.start();
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });

  harness.fromParent({ type: 'lvcn:preset', sessionId: 's1', revision: 2, colorScheme: 'dark' });
  harness.fromParent({ type: 'lvcn:preset', sessionId: 's1', revision: 1, colorScheme: 'light' });
  harness.fromParent({ type: 'lvcn:preset', sessionId: 's1', revision: 2, colorScheme: 'light' });
  harness.fromParent({ type: 'lvcn:preset', sessionId: 's1', revision: 3, colorScheme: 'light' });

  assert.deepEqual(
    harness.presets.map((message) => [message.revision, message.colorScheme]),
    [
      [2, 'dark'],
      [3, 'light'],
    ]
  );
  harness.child.destroy();
});

test('messages from the wrong source window or origin are ignored', () => {
  const harness = setupChild();
  harness.child.start();

  harness.fromParent(
    { type: 'lvcn:ready-request', sessionId: 's1' },
    { source: { postMessage() {} } }
  );
  assert.equal(harness.child.getSessionId(), null, 'wrong source rejected');

  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' }, { origin: OTHER_ORIGIN });
  assert.equal(harness.child.getSessionId(), null, 'wrong origin rejected');

  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });
  assert.equal(harness.child.getSessionId(), 's1');
  harness.child.destroy();
});

test('an unknown parent origin is locked to the first validated message', () => {
  const harness = setupChild({ initialParentOrigin: null });
  harness.child.start();

  // Only the hello may use a wildcard target, and it carries no data.
  assert.deepEqual(harness.lastOfType('lvcn:ready'), {
    message: { type: 'lvcn:ready', sessionId: null },
    targetOrigin: '*',
  });

  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' }, { origin: PARENT_ORIGIN });
  assert.equal(harness.child.getParentOrigin(), PARENT_ORIGIN);
  assert.equal(harness.lastOfType('lvcn:ready').targetOrigin, PARENT_ORIGIN);

  // A different origin can no longer talk to us.
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 'hijack' }, { origin: OTHER_ORIGIN });
  assert.equal(harness.child.getSessionId(), 's1');

  harness.child.postApplied({ revision: 1, colorScheme: 'dark', preset: 'aZ9' });
  const applied = harness.lastOfType('lvcn:applied');
  assert.equal(applied.targetOrigin, PARENT_ORIGIN, 'payloads never use a wildcard target');
  assert.deepEqual(applied.message, {
    type: 'lvcn:applied',
    sessionId: 's1',
    revision: 1,
    colorScheme: 'dark',
    preset: 'aZ9',
  });
  harness.child.destroy();
});

test('a top-level presenter stays inert', () => {
  const harness = setupChild({ getParent: () => null });
  harness.child.start();

  assert.equal(harness.posted.length, 0);
  assert.equal(harness.clock.pending, 0, 'no retry loop without a parent');
  assert.equal(harness.child.postApplied({ revision: 1, colorScheme: 'light' }), false);
  harness.child.destroy();
});

test('destroy stops the retry loop and the listener', () => {
  const harness = setupChild();
  harness.child.start();
  harness.child.destroy();

  const posted = harness.posted.length;
  harness.clock.advance(READY_RETRY_INTERVAL_MS * 10);
  harness.fromParent({ type: 'lvcn:ready-request', sessionId: 's1' });

  assert.equal(harness.posted.length, posted);
  assert.equal(harness.clock.pending, 0);
});

test('getReferrerOrigin extracts an origin or reports none', () => {
  assert.equal(getReferrerOrigin('https://lovdacn.dev/docs/button'), 'https://lovdacn.dev');
  assert.equal(getReferrerOrigin('http://localhost:3000/create'), 'http://localhost:3000');
  assert.equal(getReferrerOrigin(''), null);
  assert.equal(getReferrerOrigin(null), null);
  assert.equal(getReferrerOrigin(undefined), null);
  assert.equal(getReferrerOrigin('not a url'), null);
});

/* --------------------------------------------------------------------------
 * Paired: the real parent machine against the real child machine.
 * -------------------------------------------------------------------------- */

function setupPair({ requireConfirmation = false, drop = () => false } = {}) {
  const clock = createClock();
  const parentListeners = new Set();
  const childListeners = new Set();
  const log = [];

  // Each side's view of the other. Object identity is what the source checks use.
  const childWindow = {
    postMessage(message, targetOrigin) {
      log.push({ direction: 'parent->child', message, targetOrigin });
      if (drop({ direction: 'parent->child', message })) return;
      for (const listener of [...childListeners]) {
        listener({ data: message, origin: PARENT_ORIGIN, source: parentWindow });
      }
    },
  };
  const parentWindow = {
    postMessage(message, targetOrigin) {
      log.push({ direction: 'child->parent', message, targetOrigin });
      if (drop({ direction: 'child->parent', message })) return;
      for (const listener of [...parentListeners]) {
        listener({ data: message, origin: CHILD_ORIGIN, source: childWindow });
      }
    },
  };

  const applied = [];
  const config = { colorScheme: 'light', preset: 'aB1' };
  let revision = 0;
  let parent;

  parent = createPreviewHandshake({
    childOrigin: CHILD_ORIGIN,
    requireConfirmation,
    getChildWindow: () => childWindow,
    subscribe: (listener) => {
      parentListeners.add(listener);
      return () => parentListeners.delete(listener);
    },
    timers: clock.timers,
    createSessionId: () => 'paired-session',
    onReady: () => {
      revision += 1;
      parent.sendPreset({ revision, ...config });
    },
    onApplied: (message) => {
      applied.push(message);
      if (
        message.revision === revision &&
        message.colorScheme === config.colorScheme &&
        message.preset === config.preset
      ) {
        parent.confirm();
      }
    },
  });

  const child = createPreviewChild({
    subscribe: (listener) => {
      childListeners.add(listener);
      return () => childListeners.delete(listener);
    },
    getParent: () => parentWindow,
    initialParentOrigin: null,
    timers: clock.timers,
    onPreset: (message) => {
      // Stands in for the presenter applying the theme and echoing it back.
      child.postApplied({
        revision: message.revision,
        colorScheme: message.colorScheme,
        preset: message.preset,
      });
    },
  });

  return {
    clock,
    parent,
    child,
    log,
    applied,
    config,
    setConfig(next) {
      Object.assign(config, next);
    },
    sendCurrentConfig() {
      revision += 1;
      parent.sendPreset({ revision, ...config });
    },
  };
}

test('paired: child mounted before the host completes the handshake', () => {
  const pair = setupPair();
  // Worst realistic ordering: the presenter is already running and shouting into
  // the void before the host has any listener.
  pair.child.start();
  pair.parent.start();
  pair.parent.handleLoad();

  assert.equal(pair.parent.getState().revealed, true);
  assert.equal(pair.child.isAcknowledged(), true);
  assert.equal(pair.child.getSessionId(), 'paired-session');
  assert.equal(pair.child.getParentOrigin(), PARENT_ORIGIN);
  pair.parent.destroy();
  pair.child.destroy();
});

test('paired: host started before the child recovers on the retry interval', () => {
  const pair = setupPair();
  pair.parent.start();
  pair.parent.handleLoad();
  assert.equal(pair.parent.getState().revealed, false);

  // The presenter finishes booting only now; the parent's next request finds it.
  pair.child.start();
  assert.equal(pair.parent.getState().revealed, true);
  pair.parent.destroy();
  pair.child.destroy();
});

test('paired: every dropped ready is recovered well inside the timeout', () => {
  let dropped = 0;
  const pair = setupPair({
    drop: ({ direction, message }) => {
      if (direction === 'child->parent' && message.type === 'lvcn:ready' && dropped < 3) {
        dropped += 1;
        return true;
      }
      return false;
    },
  });

  pair.parent.start();
  pair.parent.handleLoad();
  pair.child.start();
  assert.equal(pair.parent.getState().revealed, false, 'the answers were lost');

  pair.clock.advance(READY_RETRY_INTERVAL_MS * 4);
  assert.equal(dropped, 3);
  assert.equal(pair.parent.getState().revealed, true);
  assert.ok(
    READY_RETRY_INTERVAL_MS * 4 < READY_TIMEOUT_MS,
    'recovery happens long before the fail-open timeout'
  );
  pair.parent.destroy();
  pair.child.destroy();
});

test('paired: dropped requests are also recovered', () => {
  let dropped = 0;
  const pair = setupPair({
    drop: ({ direction, message }) => {
      if (
        direction === 'parent->child' &&
        message.type === 'lvcn:ready-request' &&
        dropped < 2
      ) {
        dropped += 1;
        return true;
      }
      return false;
    },
  });

  pair.child.start();
  pair.parent.start();
  pair.parent.handleLoad();
  pair.clock.advance(READY_REQUEST_INTERVAL_MS * 3);

  assert.equal(dropped, 2);
  assert.equal(pair.parent.getState().revealed, true);
  pair.parent.destroy();
  pair.child.destroy();
});

test('paired: a theme change before readiness still wins', () => {
  const pair = setupPair();
  pair.parent.start();
  pair.parent.handleLoad();

  // Toggled while the frame was still connecting.
  pair.setConfig({ colorScheme: 'dark', preset: 'aZ9' });
  pair.child.start();

  assert.equal(pair.parent.getState().revealed, true);
  const lastPreset = pair.log
    .filter((entry) => entry.message.type === 'lvcn:preset')
    .pop().message;
  assert.equal(lastPreset.colorScheme, 'dark');
  assert.equal(lastPreset.preset, 'aZ9');
  assert.equal(pair.applied.at(-1).colorScheme, 'dark');
  pair.parent.destroy();
  pair.child.destroy();
});

test('paired: a confirmation host reveals only on an exact echo', () => {
  const pair = setupPair({ requireConfirmation: true });
  pair.child.start();
  pair.parent.start();
  pair.parent.handleLoad();

  assert.equal(pair.parent.getState().phase, 'confirmed');
  assert.equal(pair.parent.getState().revealed, true);

  // A later change round-trips over postMessage without reloading the frame.
  pair.setConfig({ colorScheme: 'dark' });
  pair.sendCurrentConfig();
  assert.equal(pair.applied.at(-1).colorScheme, 'dark');
  pair.parent.destroy();
  pair.child.destroy();
});

test('paired: no message is ever posted to a wildcard target except the hello', () => {
  const pair = setupPair();
  pair.child.start();
  pair.parent.start();
  pair.parent.handleLoad();
  pair.setConfig({ colorScheme: 'dark' });
  pair.sendCurrentConfig();

  const wildcards = pair.log.filter((entry) => entry.targetOrigin === '*');
  assert.ok(wildcards.length > 0, 'the first hello has no known origin yet');
  for (const entry of wildcards) {
    assert.deepEqual(entry.message, { type: 'lvcn:ready', sessionId: null });
  }
  pair.parent.destroy();
  pair.child.destroy();
});

test('paired: cleanup leaves no timers behind', () => {
  const pair = setupPair();
  pair.child.start();
  pair.parent.start();
  pair.parent.handleLoad();
  pair.parent.destroy();
  pair.child.destroy();

  assert.equal(pair.clock.pending, 0);
});
