/** Bootstrap for `node --test`: install globals the RN sources expect, then the loader hooks. */
globalThis.__DEV__ = true;
globalThis.__TEST_PLATFORM__ = globalThis.__TEST_PLATFORM__ ?? 'web';
globalThis.__TEST_REDUCED_MOTION__ = false;

await import('./hooks.mjs');
