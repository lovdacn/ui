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

function normalizeImportant(className) {
  return className.replace(/!$/g, '');
}

function isNativeHostileClass(className) {
  const normalized = normalizeImportant(className);
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
    normalized.includes('[a]')
  );
}

function filterNativeSafeStyleClasses(_marker, classString) {
  return classString
    .split(/\s+/)
    .map(normalizeImportant)
    .filter((className) => !isNativeHostileClass(className))
    .join(' ');
}

function isTextClass(className) {
  const normalized = normalizeImportant(className);
  const terminal = normalized.split(':').at(-1);
  return TEXT_TOKEN_PATTERN.test(normalized) || TEXT_KEYWORDS.has(terminal);
}

function extractTextClasses(classString) {
  return classString
    .split(/\s+/)
    .filter(Boolean)
    .filter(isTextClass)
    .join(' ');
}

function extractContainerClasses(classString) {
  return classString
    .split(/\s+/)
    .filter(Boolean)
    .filter((className) => !isTextClass(className))
    .join(' ');
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
  extractContainerClasses,
  extractTextClasses,
  filterNativeSafeStyleClasses,
  isNativeHostileClass,
  mergeClasses,
  parseCssStyleSheet,
  resolveMarker,
};
