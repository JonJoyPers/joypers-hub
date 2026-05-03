/**
 * RNTL setup helper.
 *
 * Force-evaluates Expo's lazy WinterCG globals (TextDecoder, URL,
 * __ExpoImportMetaRegistry, structuredClone, etc.) DURING the test phase
 * so their underlying `require()` calls happen while
 * `isInsideTestCode === true`.
 *
 * Without this touch, RNTL's automatic cleanup (which runs after each
 * test and reads various globals during unmount) can trigger the lazy
 * `require('./ImportMetaRegistry')` AFTER Jest has flipped
 * `isInsideTestCode = false`, throwing:
 *
 *   ReferenceError: You are trying to `import` a file outside of the
 *   scope of the test code.
 *
 * By touching the getters here, we cache their values eagerly while the
 * runtime is still "inside" the test.
 */

/* eslint-disable no-unused-expressions */

// Touch each lazy WinterCG global. Reading them triggers the underlying
// require + caches the result on the global. After this point, accessing
// them (e.g. during cleanup) is a plain property read — no re-requires.
const lazyGlobals = [
  'TextDecoder',
  'TextDecoderStream',
  'TextEncoderStream',
  'URL',
  'URLSearchParams',
  '__ExpoImportMetaRegistry',
  'structuredClone',
];

for (const name of lazyGlobals) {
  try {
    // eslint-disable-next-line no-undef
    globalThis[name];
  } catch {
    // best-effort — some globals aren't defined on every environment
  }
}
