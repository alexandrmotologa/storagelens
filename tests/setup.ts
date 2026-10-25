import 'fake-indexeddb/auto';

// Ensure structuredClone is available
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (val: unknown) => JSON.parse(JSON.stringify(val));
}
