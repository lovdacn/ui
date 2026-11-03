/**
 * Characterization tests — shared motion engine visibility and style ownership.
 *
 * Covers plan sections 5.2 (SSR/hydration-safe entrances), 5.3 (no invented colors),
 * 6.2 (transform/radius ownership) and 7.1 (no-motion fast path).
 *
 * Run from the repository root:
 *   node --import ./apps/preview/tests/motion/harness/register.mjs --test apps/preview/tests/motion
 */
import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';

import {
  firstHost,
  h,
  loadMotionEngine,
  renderStatic,
  setReducedMotion,
} from './harness/render.mjs';

describe('static/server output is visible', () => {
  let motion;

  before(async () => {
    motion = await loadMotionEngine({ platform: 'web', web: 'server' });
  });

  it('fade-in renders at full opacity in static output', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: 'fade-in' }));
    assert.equal(firstHost(log, 'View').style.opacity, 1);
  });

  it('slide-up renders at its final offset and full opacity', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: 'slide-up' }));
    const { style } = firstHost(log, 'View');
    assert.equal(style.opacity, 1);
    assert.deepEqual(
      style.transform.find((op) => 'translateY' in op),
      { translateY: 0 }
    );
  });

  it('zoom-in renders at full scale and full opacity', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: 'zoom-in' }));
    const { style } = firstHost(log, 'View');
    assert.equal(style.opacity, 1);
    assert.deepEqual(
      style.transform.find((op) => 'scale' in op),
      { scale: 1 }
    );
  });

  it('a custom entrance config is visible in static output', () => {
    const { log } = renderStatic(
      h(motion.MotionView, { animate: { initial: { opacity: 0, scale: 0.5 }, to: { opacity: 1, scale: 1 } } })
    );
    const { style } = firstHost(log, 'View');
    assert.equal(style.opacity, 1);
    assert.deepEqual(
      style.transform.find((op) => 'scale' in op),
      { scale: 1 }
    );
  });
});

describe('hydration output matches static output', () => {
  let motion;

  before(async () => {
    motion = await loadMotionEngine({ platform: 'web', web: 'hydrating' });
  });

  it('a host rendered during hydration skips its entrance instead of hiding', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: 'fade-in' }));
    assert.equal(firstHost(log, 'View').style.opacity, 1);
  });
});

describe('client mounts after page load may animate in', () => {
  let motion;

  before(async () => {
    motion = await loadMotionEngine({ platform: 'web', web: 'loaded' });
  });

  it('a host mounted after load starts from its entrance value', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: 'fade-in' }));
    assert.equal(firstHost(log, 'View').style.opacity, 0);
  });
});

describe('native entrances are preserved', () => {
  let motion;

  before(async () => {
    motion = await loadMotionEngine({ platform: 'ios', web: 'server' });
  });

  after(() => {
    globalThis.__TEST_PLATFORM__ = 'web';
  });

  it('ios starts fade-in from the entrance value', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: 'fade-in' }));
    assert.equal(firstHost(log, 'View').style.opacity, 0);
  });
});

describe('reduced motion is final from the first paint', () => {
  let motion;

  before(async () => {
    setReducedMotion(true);
    motion = await loadMotionEngine({ platform: 'ios', web: 'server' });
  });

  after(() => {
    setReducedMotion(false);
    globalThis.__TEST_PLATFORM__ = 'web';
  });

  it('never emits the hidden entrance value', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: 'fade-in' }));
    assert.equal(firstHost(log, 'View').style.opacity, 1);
  });

  it('applies reduceMotion="always" even when the system preference is off', async () => {
    setReducedMotion(false);
    const engine = await loadMotionEngine({ platform: 'ios', web: 'server' });
    const { log } = renderStatic(h(engine.MotionView, { animate: 'fade-in', reduceMotion: 'always' }));
    assert.equal(firstHost(log, 'View').style.opacity, 1);
  });
});

describe('colors are never invented', () => {
  let motion;

  before(async () => {
    motion = await loadMotionEngine({ platform: 'web', web: 'server' });
  });

  it('an active-only backgroundColor does not become numeric zero while idle', () => {
    motion.__motionInternals.resetDevWarnings();
    const { log, warnings } = renderStatic(
      h(motion.MotionView, { activeAnimate: { to: { backgroundColor: '#ff0000' } }, motionActive: false })
    );
    const { style } = firstHost(log, 'View');
    assert.notEqual(style.backgroundColor, 0);
    assert.equal(style.backgroundColor, undefined);
    assert.ok(
      warnings.some((line) => line.includes('backgroundColor')),
      `expected a development warning about the one-sided color, got: ${JSON.stringify(warnings)}`
    );
  });

  it('rejects an active-only color instead of inventing an idle endpoint', () => {
    motion.__motionInternals.resetDevWarnings();
    const { log, warnings } = renderStatic(
      h(motion.MotionText, { activeAnimate: { to: { color: '#00ff00' } }, motionActive: true })
    );
    assert.equal(firstHost(log, 'Text').style.color, undefined);
    assert.ok(
      warnings.some((line) => line.includes('color')),
      `expected a development warning about the one-sided color, got: ${JSON.stringify(warnings)}`
    );
  });

  it('two-sided colors animate normally', () => {
    const { log } = renderStatic(
      h(motion.MotionView, {
        animate: { to: { backgroundColor: '#000000' } },
        activeAnimate: { to: { backgroundColor: '#ffffff' } },
        motionActive: true,
      })
    );
    assert.equal(firstHost(log, 'View').style.backgroundColor, '#ffffff');
  });
});

describe('radius ownership', () => {
  let motion;

  before(async () => {
    motion = await loadMotionEngine({ platform: 'web', web: 'server' });
  });

  it('an active-only borderRadius does not overwrite a static radius while idle', () => {
    const { log } = renderStatic(
      h(motion.MotionView, {
        style: { borderRadius: 12 },
        activeAnimate: { to: { borderRadius: 24 } },
        motionActive: false,
      })
    );
    assert.equal(firstHost(log, 'View').style.borderRadius, 12);
  });

  it('keeps the static radius while active too, because the animation is rejected', () => {
    motion.__motionInternals.resetDevWarnings();
    const { log, warnings } = renderStatic(
      h(motion.MotionView, {
        style: { borderRadius: 12 },
        activeAnimate: { to: { borderRadius: 24 } },
        motionActive: true,
      })
    );
    assert.equal(firstHost(log, 'View').style.borderRadius, 12);
    assert.ok(
      warnings.some((line) => line.includes('borderRadius')),
      `expected a development warning about the one-sided radius, got: ${JSON.stringify(warnings)}`
    );
  });

  it('animates the radius when both endpoints are supplied', () => {
    const { log } = renderStatic(
      h(motion.MotionView, {
        style: { borderRadius: 12 },
        animate: { to: { borderRadius: 8 } },
        activeAnimate: { to: { borderRadius: 24 } },
        motionActive: true,
      })
    );
    assert.equal(firstHost(log, 'View').style.borderRadius, 24);
  });
});

describe('transform ownership', () => {
  let motion;

  before(async () => {
    motion = await loadMotionEngine({ platform: 'web', web: 'server' });
  });

  it('composes a static transform from the style prop with animated transforms', () => {
    const { log } = renderStatic(
      h(motion.MotionView, {
        style: { transform: [{ rotate: '45deg' }] },
        activeAnimate: { to: { scale: 0.9 } },
        motionActive: true,
      })
    );
    const { style } = firstHost(log, 'View');
    assert.deepEqual(style.transform, [{ rotate: '45deg' }, { scale: 0.9 }]);
  });

  it('warns and lets motion win when both sides drive the same transform key', () => {
    motion.__motionInternals.resetDevWarnings();
    const { log, warnings } = renderStatic(
      h(motion.MotionView, {
        style: { transform: [{ scale: 2 }] },
        activeAnimate: { to: { scale: 0.9 } },
        motionActive: true,
      })
    );
    const { style } = firstHost(log, 'View');
    assert.deepEqual(style.transform, [{ scale: 0.9 }]);
    assert.ok(
      warnings.some((line) => line.includes('transform')),
      `expected a development warning about the transform conflict, got: ${JSON.stringify(warnings)}`
    );
  });
});

describe('no-motion fast path', () => {
  let motion;

  before(async () => {
    motion = await loadMotionEngine({ platform: 'web', web: 'server' });
  });

  it('renders a raw View when no motion is configured', () => {
    const { log } = renderStatic(h(motion.MotionView, null));
    assert.equal(firstHost(log, 'View').animated, false);
  });

  it('renders a raw Text when no motion is configured', () => {
    const { log } = renderStatic(h(motion.MotionText, null, 'hello'));
    assert.equal(firstHost(log, 'Text').animated, false);
  });

  it('renders a raw Pressable when no motion is configured', () => {
    const { log } = renderStatic(h(motion.MotionPressable, null));
    assert.equal(firstHost(log, 'Pressable').animated, false);
  });

  it('renders a raw TextInput when no motion is configured', () => {
    const { log } = renderStatic(h(motion.MotionTextInput, null));
    assert.equal(firstHost(log, 'TextInput').animated, false);
  });

  it('treats animate={false} as no motion', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: false }));
    assert.equal(firstHost(log, 'View').animated, false);
  });

  it('selects the animated host as soon as any motion prop is configured', () => {
    const { log } = renderStatic(h(motion.MotionView, { animate: 'fade-in' }));
    assert.equal(firstHost(log, 'View').animated, true);
  });

  it('keeps className and style on the static host', () => {
    const { log } = renderStatic(
      h(motion.MotionView, { className: 'bg-accent', style: { padding: 4 } })
    );
    const entry = firstHost(log, 'View');
    assert.equal(entry.props.className, 'bg-accent');
    assert.equal(entry.style.padding, 4);
  });

  it('does not leak motion props to the static host', () => {
    const { log } = renderStatic(
      h(motion.MotionView, { animate: false, activeAnimate: false, motionActive: false, reduceMotion: 'never' })
    );
    const entry = firstHost(log, 'View');
    for (const key of ['animate', 'activeAnimate', 'motionActive', 'reduceMotion']) {
      assert.equal(key in entry.props, false, `${key} leaked to the raw host`);
    }
  });
});
