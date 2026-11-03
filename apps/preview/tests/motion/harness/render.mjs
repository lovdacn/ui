/** Test helpers: static rendering, render-log queries, platform/reduced-motion scenarios. */
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderLog, resetRenderLog } from './stubs/react-native.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const MOTION_SOURCE = path.resolve(HERE, '..', '..', '..', 'src', 'components', 'ui', 'motion.tsx');

export const h = React.createElement;

/**
 * Render to static markup. This runs the render phase only — no effects — so it is the
 * closest available approximation of static/server output and of the first client paint.
 */
export function renderStatic(element) {
  resetRenderLog();
  const warnings = [];
  const originalWarn = console.warn;
  console.warn = (...args) => warnings.push(args.map(String).join(' '));
  try {
    const markup = renderToStaticMarkup(element);
    return { markup, log: renderLog.map((entry) => ({ ...entry })), warnings };
  } finally {
    console.warn = originalWarn;
  }
}

export function hostsNamed(log, name) {
  return log.filter((entry) => entry.host === name);
}

export function firstHost(log, name) {
  const found = hostsNamed(log, name);
  if (found.length === 0) {
    throw new Error(`No "${name}" host was rendered. Rendered: ${log.map((e) => e.host).join(', ')}`);
  }
  return found[0];
}

export function setPlatform(os) {
  globalThis.__TEST_PLATFORM__ = os;
}

export function setReducedMotion(enabled) {
  globalThis.__TEST_REDUCED_MOTION__ = enabled;
}

let motionInstanceCounter = 0;

/**
 * Import a FRESH copy of the motion engine.
 *
 * The engine latches its web entrance policy at module scope, so each scenario
 * (static/server, hydration, post-load client mount, native) needs its own instance.
 *
 * @param {{ platform?: string, web?: 'server' | 'hydrating' | 'loaded' }} options
 */
export async function loadMotionEngine(options = {}) {
  const { platform = 'web', web = 'server' } = options;
  setPlatform(platform);

  if (web === 'server') {
    delete globalThis.window;
    delete globalThis.document;
    delete globalThis.addEventListener;
  } else {
    const listeners = new Map();
    globalThis.document = { readyState: web === 'loaded' ? 'complete' : 'loading' };
    // A browser exposes these on the global object itself, which is what the engine reads.
    globalThis.addEventListener = (type, listener) => listeners.set(type, listener);
    globalThis.removeEventListener = (type) => listeners.delete(type);
    globalThis.dispatchEvent = (type) => listeners.get(type)?.();
    globalThis.requestAnimationFrame = (callback) => setTimeout(callback, 0);
  }

  motionInstanceCounter += 1;
  const url = `${pathToFileURL(MOTION_SOURCE).href}?instance=${motionInstanceCounter}`;
  const engine = await import(url);

  // Let the queued frame callbacks that arm the web entrance policy run. Poll rather than
  // sleep so the scenario is deterministic under parallel test execution.
  if (web === 'loaded' && platform === 'web') {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      if (engine.__motionInternals?.entranceAllowed()) break;
      await new Promise((resolve) => setTimeout(resolve, 1));
    }
  } else {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return engine;
}
