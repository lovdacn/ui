/**
 * Regression tests — `asChild` motion hosts must keep their children.
 *
 * When an adapter hands the primitive an animated host with `asChild`, the JSX child wins over
 * the spread `children` prop, so the component's real content is dropped unless it is passed to
 * the animated host explicitly. These tests pin that behaviour for every Agent 1-owned adapter
 * that renders content.
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { h, renderStatic } from './harness/render.mjs';

const { AspectRatio } = await import('@/components/ui/aspect-ratio');
const { Avatar, AvatarFallback } = await import('@/components/ui/avatar');
const { Label } = await import('@/components/ui/label');
const { Tabs, TabsList, TabsTrigger } = await import('@/components/ui/tabs');
const { Toggle } = await import('@/components/ui/toggle');
const { Text } = await import('@/components/ui/text');

const MOTION = { animate: { to: { opacity: 1 } } };

function markerCount(markup) {
  return markup.split('MARKER').length - 1;
}

describe('children survive the animated host', () => {
  it('AspectRatio keeps its children', () => {
    const { markup } = renderStatic(h(AspectRatio, MOTION, h(Text, null, 'MARKER')));
    assert.equal(markerCount(markup), 1);
  });

  it('Avatar keeps its children', () => {
    const { markup } = renderStatic(h(Avatar, MOTION, h(AvatarFallback, null, h(Text, null, 'MARKER'))));
    assert.equal(markerCount(markup), 1);
  });

  it('AvatarFallback keeps its children', () => {
    const { markup } = renderStatic(h(Avatar, null, h(AvatarFallback, MOTION, h(Text, null, 'MARKER'))));
    assert.equal(markerCount(markup), 1);
  });

  it('Label keeps its text', () => {
    const { markup } = renderStatic(h(Label, MOTION, 'MARKER'));
    assert.equal(markerCount(markup), 1);
  });

  it('Tabs keeps its children', () => {
    const { markup } = renderStatic(
      h(Tabs, { value: 'a', ...MOTION }, h(TabsList, null, h(TabsTrigger, { value: 'a' }, h(Text, null, 'MARKER'))))
    );
    assert.equal(markerCount(markup), 1);
  });

  it('TabsList keeps its children', () => {
    const { markup } = renderStatic(
      h(Tabs, { value: 'a' }, h(TabsList, MOTION, h(TabsTrigger, { value: 'a' }, h(Text, null, 'MARKER'))))
    );
    assert.equal(markerCount(markup), 1);
  });

  it('TabsTrigger keeps its children', () => {
    const { markup } = renderStatic(
      h(Tabs, { value: 'a' }, h(TabsList, null, h(TabsTrigger, { value: 'a', ...MOTION }, h(Text, null, 'MARKER'))))
    );
    assert.equal(markerCount(markup), 1);
  });

  it('Toggle keeps its children', () => {
    const { markup } = renderStatic(h(Toggle, { pressed: false, ...MOTION }, h(Text, null, 'MARKER')));
    assert.equal(markerCount(markup), 1);
  });
});
