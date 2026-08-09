/**
 * Characterization tests — canonical host routing, state precedence and dormant APIs.
 *
 * Covers plan sections 6.1 (shorthand routing), 5.3 / 6.2 (no invented endpoints) and
 * 8.1 (exit/repeat/reverse decision gate).
 *
 * These assert against `__motionInternals`, the engine's `@internal` surface. They are the
 * only way to verify press/focus routing deterministically without an interaction-capable
 * renderer, which this repository does not have.
 */
import assert from 'node:assert/strict';
import { before, describe, it } from 'node:test';

import { loadMotionEngine } from './harness/render.mjs';

let internals;

before(async () => {
  const engine = await loadMotionEngine({ platform: 'web', web: 'server' });
  internals = engine.__motionInternals;
  assert.ok(internals, 'motion.tsx must expose __motionInternals for engine tests');
});

describe('shorthand active targets route to the host channel', () => {
  it('a Pressable host routes a preset shorthand to press', () => {
    const n = internals.normalize({ activeAnimate: 'press', channel: 'press' });
    assert.deepEqual(n.press, { scale: 0.97 });
    assert.equal(n.semantic, undefined);
    assert.equal(n.focus, undefined);
  });

  it("Button's default press preset produces a press target", () => {
    const n = internals.normalize({ defaultActiveAnimate: 'press', channel: 'press' });
    assert.deepEqual(n.press, { scale: 0.97 });
  });

  it('a TextInput host routes a shorthand to focus', () => {
    const n = internals.normalize({ activeAnimate: { to: { scale: 1.02 } }, channel: 'focus' });
    assert.deepEqual(n.focus, { scale: 1.02 });
    assert.equal(n.press, undefined);
    assert.equal(n.semantic, undefined);
  });

  it('a View host routes a shorthand to the semantic channel', () => {
    const n = internals.normalize({ activeAnimate: { to: { opacity: 0.5 } }, channel: 'semantic' });
    assert.deepEqual(n.semantic, { opacity: 0.5 });
    assert.equal(n.press, undefined);
  });

  it('a semantically driven Pressable also receives the shorthand on the semantic channel', () => {
    const n = internals.normalize({
      activeAnimate: { to: { scale: 0.9 } },
      channel: 'press',
      semanticDriven: true,
    });
    assert.deepEqual(n.press, { scale: 0.9 });
    assert.deepEqual(n.semantic, { scale: 0.9 });
  });

  it('an explicit state map overrides the shorthand for that state only', () => {
    const n = internals.normalize({
      activeAnimate: { to: { scale: 0.9 }, states: { press: { to: { scale: 0.5 } } } },
      channel: 'press',
      semanticDriven: true,
    });
    assert.deepEqual(n.press, { scale: 0.5 });
    assert.deepEqual(n.semantic, { scale: 0.9 });
  });

  it('semantic aliases still collapse into one channel', () => {
    const n = internals.normalize({
      activeAnimate: { states: { checked: { to: { opacity: 0.4 } } } },
      channel: 'press',
    });
    assert.deepEqual(n.semantic, { opacity: 0.4 });
  });

  it('an explicit focus state reaches a Pressable host', () => {
    const n = internals.normalize({
      activeAnimate: { states: { focus: { to: { scale: 1.05 } } } },
      channel: 'press',
    });
    assert.deepEqual(n.focus, { scale: 1.05 });
  });
});

describe('state precedence', () => {
  const targets = {
    initial: {},
    idle: { scale: 1 },
    press: { scale: 0.9 },
    semantic: { scale: 1.1 },
    focus: { scale: 1.2 },
    hover: { scale: 1.3 },
    dragging: { scale: 1.4 },
  };
  const base = {
    pressed: false,
    hovered: false,
    focused: false,
    dragging: false,
    semantic: false,
    disabled: false,
  };

  it('idle wins when nothing is active', () => {
    const r = internals.resolveMotionTarget('scale', targets, base, 1);
    assert.deepEqual(r, { value: 1, active: false });
  });

  it('dragging outranks press', () => {
    const r = internals.resolveMotionTarget(
      'scale',
      targets,
      { ...base, dragging: true, pressed: true },
      1
    );
    assert.equal(r.value, 1.4);
  });

  it('press outranks semantic', () => {
    const r = internals.resolveMotionTarget(
      'scale',
      targets,
      { ...base, pressed: true, semantic: true },
      1
    );
    assert.equal(r.value, 0.9);
  });

  it('semantic outranks focus', () => {
    const r = internals.resolveMotionTarget(
      'scale',
      targets,
      { ...base, semantic: true, focused: true },
      1
    );
    assert.equal(r.value, 1.1);
  });

  it('focus outranks hover', () => {
    const r = internals.resolveMotionTarget(
      'scale',
      targets,
      { ...base, focused: true, hovered: true },
      1
    );
    assert.equal(r.value, 1.2);
  });

  it('disabled returns the idle value regardless of interaction state', () => {
    const r = internals.resolveMotionTarget(
      'scale',
      targets,
      { ...base, disabled: true, pressed: true, semantic: true },
      1
    );
    assert.deepEqual(r, { value: 1, active: false });
  });

  it('reports no value at all when nothing defines the property and no default is allowed', () => {
    const r = internals.resolveMotionTarget(
      'backgroundColor',
      { initial: {}, idle: {}, semantic: { backgroundColor: 'red' } },
      base,
      undefined
    );
    assert.equal(r.value, undefined);
  });

  it('returns the active endpoint for a one-sided property while active', () => {
    const r = internals.resolveMotionTarget(
      'backgroundColor',
      { initial: {}, idle: {}, semantic: { backgroundColor: 'red' } },
      { ...base, semantic: true },
      undefined
    );
    assert.deepEqual(r, { value: 'red', active: true });
  });
});

describe('no invented endpoints', () => {
  it('never defines a numeric default for a color or radius', () => {
    for (const key of ['color', 'backgroundColor', 'borderColor', 'borderRadius']) {
      assert.equal(
        key in internals.NUMERIC_DEFAULTS,
        false,
        `${key} must not have an invented numeric default`
      );
    }
  });

  it('keeps safe defaults for opacity and transforms', () => {
    assert.equal(internals.NUMERIC_DEFAULTS.opacity, 1);
    assert.equal(internals.NUMERIC_DEFAULTS.scale, 1);
    assert.equal(internals.NUMERIC_DEFAULTS.translateX, 0);
    assert.equal(internals.NUMERIC_DEFAULTS.rotate, '0deg');
  });

  it('flags a one-sided color as unsupported for interpolation', () => {
    const n = internals.normalize({
      activeAnimate: { to: { backgroundColor: 'red' } },
      channel: 'semantic',
    });
    assert.equal(n.oneSided.backgroundColor, true);
  });

  it('does not flag a color that has both endpoints', () => {
    const n = internals.normalize({
      animate: { to: { backgroundColor: 'blue' } },
      activeAnimate: { to: { backgroundColor: 'red' } },
      channel: 'semantic',
    });
    assert.ok(!n.oneSided.backgroundColor);
  });

  it('flags a one-sided radius', () => {
    const n = internals.normalize({
      activeAnimate: { to: { borderRadius: 24 } },
      channel: 'semantic',
    });
    assert.equal(n.oneSided.borderRadius, true);
  });
});

describe('dormant exit/repeat/reverse APIs', () => {
  it('warns when an inert exit target is supplied', () => {
    internals.resetDevWarnings();
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.map(String).join(' '));
    try {
      internals.normalize({ animate: { to: { opacity: 1 }, exit: { opacity: 0 } }, channel: 'semantic' });
    } finally {
      console.warn = originalWarn;
    }
    assert.ok(
      warnings.some((line) => line.includes('exit')),
      `expected a deprecation warning for exit, got: ${JSON.stringify(warnings)}`
    );
  });

  it('warns when repeat or reverse is supplied', () => {
    internals.resetDevWarnings();
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.map(String).join(' '));
    try {
      internals.normalize({
        animate: { to: { opacity: 1 }, repeat: 3, reverse: true },
        channel: 'semantic',
      });
    } finally {
      console.warn = originalWarn;
    }
    assert.ok(
      warnings.some((line) => line.includes('repeat')),
      `expected a deprecation warning for repeat, got: ${JSON.stringify(warnings)}`
    );
    assert.ok(
      warnings.some((line) => line.includes('reverse')),
      `expected a deprecation warning for reverse, got: ${JSON.stringify(warnings)}`
    );
  });

  it('warns that an exit-only preset does nothing as an idle animation', () => {
    internals.resetDevWarnings();
    const warnings = [];
    const originalWarn = console.warn;
    console.warn = (...args) => warnings.push(args.map(String).join(' '));
    try {
      internals.normalize({ animate: 'fade-out', channel: 'semantic' });
    } finally {
      console.warn = originalWarn;
    }
    assert.ok(
      warnings.some((line) => line.includes('fade-out')),
      `expected a warning for the exit-only preset, got: ${JSON.stringify(warnings)}`
    );
  });
});

describe('motion configuration detection', () => {
  it('reports no motion for an empty configuration', () => {
    assert.equal(internals.hasMotionConfig({}), false);
  });

  it('reports no motion when everything is explicitly disabled', () => {
    assert.equal(internals.hasMotionConfig({ animate: false, activeAnimate: false }), false);
  });

  it('reports motion for a preset', () => {
    assert.equal(internals.hasMotionConfig({ animate: 'fade-in' }), true);
  });

  it('reports motion for an active configuration', () => {
    assert.equal(internals.hasMotionConfig({ activeAnimate: { to: { scale: 0.9 } } }), true);
  });

  it('reports motion for a component default', () => {
    assert.equal(internals.hasMotionConfig({ defaultActiveAnimate: 'press' }), true);
  });
});
