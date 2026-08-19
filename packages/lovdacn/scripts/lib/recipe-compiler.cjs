'use strict';

const { twMerge } = require('tailwind-merge');

const RULE_PATTERN = /\.cn-([\w-]+)\s*\{\s*@apply\s+([^;]+);/g;
const TEXT_TOKEN_PATTERN = /(?:^|:)(?:text|font|leading|tracking|decoration|underline-offset)-/;
const TEXT_KEYWORDS = new Set([
  'uppercase',
  'lowercase',
  'capitalize',
  'normal-case',
  'italic',
  'not-italic',
  'underline',
  'overline',
  'line-through',
  'no-underline',
  'text-left',
  'text-center',
  'text-right',
  'text-justify',
  'text-start',
  'text-end',
]);

/**
 * Markers whose recipe legitimately owns a fixed visual box. These are glyph or
 * track surfaces with no intrinsic text to grow around, so a hard height is the
 * design intent rather than a clipping hazard.
 */
const FIXED_BOX_MARKERS = new Set([
  'cn-checkbox',
  'cn-checkbox-indicator',
  'cn-radio-group-item',
  'cn-radio-group-indicator',
  'cn-radio-group-indicator-icon',
  'cn-switch',
  'cn-switch-thumb',
  'cn-progress',
  'cn-progress-indicator',
  'cn-separator',
  'cn-skeleton',
  'cn-spinner',
  'cn-avatar',
  'cn-avatar-image',
  'cn-avatar-fallback',
  'cn-aspect-ratio',
]);

/**
 * Split a class string into tokens while keeping arbitrary values intact.
 *
 * Tailwind arbitrary values may contain spaces and commas, e.g.
 * `bg-[color-mix(in_oklch, var(--a), var(--b)_5%)]`. A naive split on
 * whitespace would shred those into meaningless fragments, so bracket depth is
 * tracked and only top-level whitespace separates tokens.
 */
function tokenizeClassString(classString) {
  if (!classString) return [];
  const tokens = [];
  let current = '';
  let depth = 0;

  for (const char of String(classString)) {
    if (char === '[' || char === '(') depth += 1;
    else if (char === ']' || char === ')') depth = Math.max(0, depth - 1);

    if (depth === 0 && /\s/.test(char)) {
      if (current) tokens.push(current);
      current = '';
      continue;
    }
    current += char;
  }
  if (current) tokens.push(current);
  return tokens;
}

function normalizeImportant(className) {
  return className.replace(/!$/g, '');
}

/** The utility part of a class, with any variant prefixes removed. */
function terminalUtility(className) {
  return normalizeImportant(className).split(':').at(-1) || '';
}

function isShadowClass(className) {
  const terminal = terminalUtility(className);
  return terminal === 'shadow' || terminal.startsWith('shadow-');
}

function isRadiusClass(className) {
  const terminal = terminalUtility(className);
  return terminal === 'rounded' || terminal.startsWith('rounded-');
}

/**
 * A ring that is present at rest, rather than scoped to an interaction state or
 * to a web branch.
 *
 * NativeWind documents every ring-width utility as web-only:
 * https://nativewind.dev/docs/tailwind/borders/ring-width
 *
 * A resting ring therefore cannot be part of a cross-platform recipe: on web it
 * paints a second outline next to the border, and on native its behaviour is
 * unsupported or engine dependent.
 */
function isRestingRingClass(className) {
  const normalized = normalizeImportant(className);
  const terminal = terminalUtility(normalized);
  if (terminal === 'ring-0' || terminal.startsWith('ring-offset')) return false;
  if (!(terminal === 'ring' || terminal.startsWith('ring-'))) return false;
  return !/(?:^|:)(?:focus|focus-visible|focus-within|active|hover|aria-|data-|group-|web)/.test(
    normalized
  );
}

/**
 * Web-only state and paint selectors. These are valid CSS but have no native
 * equivalent, so they must live in a `Platform.select({ web: ... })` branch
 * rather than in a literal that both platforms read.
 *
 * `aria-invalid:` is a web validation selector and is filtered; other `aria-*`
 * variants such as `aria-expanded:` map to real native accessibility state and
 * are preserved.
 */
function isWebOnlyStateClass(className) {
  const normalized = normalizeImportant(className);
  return (
    normalized.startsWith('focus-visible:') ||
    normalized.includes(':focus-visible:') ||
    normalized.startsWith('aria-invalid:') ||
    normalized.includes(':aria-invalid:') ||
    normalized.startsWith('bg-clip-') ||
    normalized === 'transition-all' ||
    normalized.startsWith('transition-[') ||
    normalized === 'outline-hidden' ||
    normalized.startsWith('outline-')
  );
}

function isNativeHostileClass(className) {
  const normalized = normalizeImportant(className);
  const terminal = terminalUtility(normalized);
  return (
    normalized === '' ||
    normalized === '!' ||
    normalized === 'grid' ||
    normalized === 'inline-flex' ||
    normalized.startsWith('grid-') ||
    normalized.startsWith('place-') ||
    normalized.startsWith('col-') ||
    normalized.startsWith('row-') ||
    normalized.startsWith('data-') ||
    normalized.startsWith('group-data-') ||
    normalized.startsWith('has-data-') ||
    normalized.startsWith('not-data-') ||
    normalized.includes('group-data') ||
    normalized.includes('group-has-data') ||
    normalized.includes('has-data') ||
    normalized.startsWith('focus:') ||
    normalized.startsWith('group-focus') ||
    normalized.startsWith('supports-') ||
    normalized.startsWith('animate-') ||
    normalized.startsWith('fade-') ||
    normalized.startsWith('zoom-') ||
    normalized.startsWith('slide-') ||
    normalized.startsWith('duration-') ||
    normalized.startsWith('origin-') ||
    normalized.startsWith('cursor-') ||
    normalized.includes(':animate-') ||
    normalized.includes(':fade-') ||
    normalized.includes(':zoom-') ||
    normalized.includes(':slide-') ||
    normalized.includes(':duration-') ||
    normalized.includes(':focus') ||
    normalized.includes('focus:') ||
    normalized.includes('group-focus') ||
    normalized.includes('--') ||
    normalized.startsWith('[') ||
    normalized.includes(']:') ||
    normalized.includes('*:') ||
    normalized.includes('text-balance') ||
    normalized.includes('text-pretty') ||
    normalized.includes('has-[') ||
    normalized.includes('**:') ||
    normalized.includes('*:[') ||
    normalized.includes('[&_') ||
    normalized.includes('[a]') ||
    // Zero line height clips glyphs under Android font metrics and at large
    // accessibility font scales. `leading-tight` is the scalable alternative.
    terminal === 'leading-none' ||
    isRestingRingClass(normalized) ||
    isWebOnlyStateClass(normalized)
  );
}

/**
 * Rewrite a recipe's fixed height into a minimum height.
 *
 * A style may express a compact visual box, but on native the text inside that
 * box still has to fit. `h-5` on a badge means a 20 px box that clips its own
 * label once an icon or a larger font scale pushes the content past 20 px;
 * `min-h-5` keeps the compact resting appearance and lets the box grow.
 */
function applyNativeHeightPolicy(marker, classes) {
  if (FIXED_BOX_MARKERS.has(marker)) return classes;
  return classes.map((className) => {
    const normalized = normalizeImportant(className);
    const match = normalized.match(/^((?:[\w-]+:)*)h-(\d+(?:\.\d+)?)$/);
    if (!match) return className;
    return `${match[1]}min-h-${match[2]}`;
  });
}

/**
 * Reduce a recipe to the classes that are safe in a cross-platform literal.
 *
 * A single native view cannot both cast an unclipped outer shadow and clip its
 * descendants. Combining `overflow-hidden` with a shadow also forces Android to
 * rasterize the clip path and the border stroke separately, which thins the
 * corner arcs relative to the straight edges. Whenever a recipe owns an outer
 * shadow, clipping is therefore dropped: border, radius and shadow stay on one
 * node so the corners are geometrically exact, matching upstream
 * react-native-reusables.
 *
 * `extractShadowWrapperClasses` / `extractClippedSurfaceClasses` remain
 * available for a component that genuinely needs a two-host split, but such a
 * component must give the shadow wrapper its own background: a transparent view
 * has no shape to cast a shadow from.
 */
function filterNativeSafeStyleClasses(marker, classString) {
  const safeClasses = applyNativeHeightPolicy(
    marker,
    tokenizeClassString(classString)
      .map(normalizeImportant)
      .filter((className) => !isNativeHostileClass(className))
  );

  const ownsShadow = safeClasses.some(isShadowClass);
  const filtered = ownsShadow
    ? safeClasses.filter((className) => terminalUtility(className) !== 'overflow-hidden')
    : safeClasses;

  return filtered.join(' ');
}

/**
 * Enforce the shadow-versus-clipping contract on an already merged class list.
 *
 * `filterNativeSafeStyleClasses` can only inspect the recipe. A style whose
 * recipe carries clipping but no shadow keeps that clipping, and the component's
 * own base literal may still contribute a shadow; the two meet only after
 * tailwind-merge. This is the final gate before a literal is written.
 */
function dropClippingWhenShadowed(classString) {
  const classes = tokenizeClassString(classString);
  if (!classes.some(isShadowClass)) return classString;
  const kept = classes.filter((className) => terminalUtility(className) !== 'overflow-hidden');
  return kept.length === classes.length ? classString : kept.join(' ');
}

/** The subset of a Card recipe that belongs on the non-clipping shadow wrapper. */
function extractShadowWrapperClasses(classString) {
  return tokenizeClassString(classString)
    .filter((className) => isShadowClass(className) || isRadiusClass(className))
    .join(' ');
}

/** The subset of a Card recipe that belongs on the clipped inner surface. */
function extractClippedSurfaceClasses(classString) {
  return tokenizeClassString(classString)
    .filter((className) => !isShadowClass(className))
    .join(' ');
}

function isTextClass(className) {
  const normalized = normalizeImportant(className);
  const terminal = normalized.split(':').at(-1);
  return TEXT_TOKEN_PATTERN.test(normalized) || TEXT_KEYWORDS.has(terminal);
}

function extractTextClasses(classString) {
  return tokenizeClassString(classString).filter(isTextClass).join(' ');
}

function extractContainerClasses(classString) {
  return tokenizeClassString(classString)
    .filter((className) => !isTextClass(className))
    .join(' ');
}

function parseCssStyleSheet(cssContent) {
  const styleMap = {};
  let match;
  RULE_PATTERN.lastIndex = 0;
  while ((match = RULE_PATTERN.exec(cssContent)) !== null) {
    const className = `cn-${match[1]}`;
    styleMap[className] = match[2].trim().replace(/\s+/g, ' ');
  }
  return styleMap;
}

function resolveMarker(styleMap, marker, target = 'all') {
  if (!Object.prototype.hasOwnProperty.call(styleMap, marker)) return '';
  const safe = filterNativeSafeStyleClasses(marker, styleMap[marker]);
  if (target === 'text') return extractTextClasses(safe);
  if (target === 'container') return extractContainerClasses(safe);
  return safe;
}

function mergeClasses(...classes) {
  return twMerge(classes.filter(Boolean).join(' '));
}

function assertRequiredMarkers(styleName, styleMap, markers) {
  const missing = markers.filter((marker) => !styleMap[marker]);
  if (missing.length > 0) {
    throw new Error(`Style "${styleName}" is missing required recipe markers: ${missing.join(', ')}`);
  }
}

function assertNoRecipeMarkers(value, label = 'generated output') {
  if (/\bcn-[\w-]+\b/.test(value)) {
    throw new Error(`${label} still contains unresolved cn-* recipe markers`);
  }
}

module.exports = {
  assertNoRecipeMarkers,
  assertRequiredMarkers,
  dropClippingWhenShadowed,
  extractClippedSurfaceClasses,
  extractContainerClasses,
  extractShadowWrapperClasses,
  extractTextClasses,
  filterNativeSafeStyleClasses,
  isNativeHostileClass,
  isRadiusClass,
  isRestingRingClass,
  isShadowClass,
  isWebOnlyStateClass,
  mergeClasses,
  parseCssStyleSheet,
  resolveMarker,
  terminalUtility,
  tokenizeClassString,
};
