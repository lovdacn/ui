/**
 * Characterization tests — semantic adapters owned by Agent 1.
 *
 * Covers plan sections 6.1 (Button default press), 6.3 (RadioGroup selected state),
 * 6.4 (Collapsible controlled/uncontrolled state) and 6.5 (preserved adapters).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { firstHost, h, hostsNamed, renderStatic } from './harness/render.mjs';

const { Button } = await import('@/components/ui/button');
const { Skeleton } = await import('@/components/ui/skeleton');
const { RadioGroup, RadioGroupItem } = await import('@/components/ui/radio-group');
const { Collapsible, CollapsibleContent, CollapsibleTrigger } = await import(
  '@/components/ui/collapsible'
);

/** Both endpoints supplied so the assertion is about routing, not about fallbacks. */
const OPACITY_MOTION = {
  animate: { to: { opacity: 1 } },
  activeAnimate: { to: { opacity: 0.25 } },
};

describe('Button', () => {
  it('selects the animated host because it supplies a default press preset', () => {
    const { log } = renderStatic(h(Button, null));
    assert.equal(firstHost(log, 'Pressable').animated, true);
  });

  it('registers the press preset scale on the animated style', () => {
    const { log } = renderStatic(h(Button, null));
    const { style } = firstHost(log, 'Pressable');
    assert.ok(Array.isArray(style.transform), 'expected the press preset to drive a transform');
    assert.deepEqual(
      style.transform.find((op) => 'scale' in op),
      { scale: 1 }
    );
  });

  it('falls back to the static host when the caller opts out', () => {
    const { log } = renderStatic(h(Button, { activeAnimate: false }));
    assert.equal(firstHost(log, 'Pressable').animated, false);
  });
});

describe('Skeleton', () => {
  it('lets the CSS pulse own the animation when no engine motion is requested', () => {
    const { log } = renderStatic(h(Skeleton, null));
    const entry = firstHost(log, 'View');
    assert.match(entry.props.className, /animate-pulse/);
    assert.equal(entry.animated, false);
  });

  it('hands the pulse to the engine when animate is supplied', () => {
    const { log } = renderStatic(h(Skeleton, { animate: 'pulse' }));
    const entry = firstHost(log, 'View');
    assert.doesNotMatch(entry.props.className, /animate-pulse/);
    assert.equal(entry.animated, true);
  });

  it('produces a static placeholder for animate={false}', () => {
    const { log } = renderStatic(h(Skeleton, { animate: false }));
    const entry = firstHost(log, 'View');
    assert.doesNotMatch(entry.props.className, /animate-pulse/);
    assert.equal(entry.animated, false);
  });
});

describe('RadioGroup selected state', () => {
  function renderGroup(value) {
    return renderStatic(
      h(
        RadioGroup,
        { value },
        h(RadioGroupItem, { key: 'a', value: 'a', ...OPACITY_MOTION }),
        h(RadioGroupItem, { key: 'b', value: 'b', ...OPACITY_MOTION })
      )
    );
  }

  it('activates only the item matching the root value', () => {
    const { log } = renderGroup('b');
    const items = hostsNamed(log, 'View').filter((entry) => entry.props.role === 'radio');
    assert.equal(items.length, 2, 'expected both items to render an animated host');
    assert.equal(items[0].style.opacity, 1, 'unselected item should stay idle');
    assert.equal(items[1].style.opacity, 0.25, 'selected item should be active');
  });

  it('follows a programmatic root value change', () => {
    const { log } = renderGroup('a');
    const items = hostsNamed(log, 'View').filter((entry) => entry.props.role === 'radio');
    assert.equal(items[0].style.opacity, 0.25);
    assert.equal(items[1].style.opacity, 1);
  });

  it('honours an explicit motionActive override', () => {
    const { log } = renderStatic(
      h(
        RadioGroup,
        { value: 'a' },
        h(RadioGroupItem, { value: 'a', motionActive: false, ...OPACITY_MOTION })
      )
    );
    const item = hostsNamed(log, 'View').find((entry) => entry.props.role === 'radio');
    assert.equal(item.style.opacity, 1);
  });

  it('keeps unrequested items on the static host', () => {
    const { log } = renderStatic(
      h(RadioGroup, { value: 'a' }, h(RadioGroupItem, { value: 'a' }))
    );
    const animated = hostsNamed(log, 'View').filter((entry) => entry.animated);
    assert.equal(animated.length, 0);
  });
});

describe('Collapsible open state', () => {
  it('derives open state for Trigger and Content when controlled open', () => {
    const { log } = renderStatic(
      h(
        Collapsible,
        { open: true, ...OPACITY_MOTION },
        h(CollapsibleTrigger, OPACITY_MOTION),
        h(CollapsibleContent, OPACITY_MOTION)
      )
    );
    assert.equal(firstHost(log, 'Pressable').style.opacity, 0.25, 'trigger should be active');
    const content = hostsNamed(log, 'View').find((entry) => entry.props.role === undefined);
    assert.ok(content, 'content should render while open');
  });

  it('derives closed state when controlled closed', () => {
    const { log } = renderStatic(
      h(
        Collapsible,
        { open: false, ...OPACITY_MOTION },
        h(CollapsibleTrigger, OPACITY_MOTION),
        h(CollapsibleContent, OPACITY_MOTION)
      )
    );
    assert.equal(firstHost(log, 'Pressable').style.opacity, 1, 'trigger should be idle');
  });

  it('derives open state from defaultOpen (uncontrolled)', () => {
    const { log } = renderStatic(
      h(
        Collapsible,
        { defaultOpen: true, ...OPACITY_MOTION },
        h(CollapsibleTrigger, OPACITY_MOTION),
        h(CollapsibleContent, OPACITY_MOTION)
      )
    );
    assert.equal(firstHost(log, 'Pressable').style.opacity, 0.25, 'trigger should be active');
    assert.equal(
      firstHost(log, 'View').style.opacity,
      0.25,
      'root should reflect the resolved open state'
    );
  });

  it('starts closed when uncontrolled without defaultOpen', () => {
    const { log } = renderStatic(
      h(
        Collapsible,
        OPACITY_MOTION,
        h(CollapsibleTrigger, OPACITY_MOTION),
        h(CollapsibleContent, OPACITY_MOTION)
      )
    );
    assert.equal(firstHost(log, 'Pressable').style.opacity, 1);
    assert.equal(firstHost(log, 'View').style.opacity, 1);
  });

  it('invokes the consumer onOpenChange exactly once per toggle', () => {
    let calls = 0;
    const { log } = renderStatic(
      h(
        Collapsible,
        { onOpenChange: () => (calls += 1), ...OPACITY_MOTION },
        h(CollapsibleTrigger, OPACITY_MOTION)
      )
    );
    const trigger = firstHost(log, 'Pressable');
    assert.equal(typeof trigger.props.onPress, 'function');
    trigger.props.onPress({});
    assert.equal(calls, 1);
  });

  it('keeps the static hosts when no motion is requested', () => {
    const { log } = renderStatic(
      h(Collapsible, { defaultOpen: true }, h(CollapsibleTrigger, null), h(CollapsibleContent, null))
    );
    assert.equal(
      log.filter((entry) => entry.animated).length,
      0,
      'no animated host should be created without motion props'
    );
  });
});
