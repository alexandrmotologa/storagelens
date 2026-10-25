import { seedIndexedDbPlayground } from './seed_indexeddb';
import { seedOpfsPlayground } from './seed_opfs';
import { seedCachePlayground } from './seed_cache';
import { seedWebStoragePlayground } from './seed_webstorage';

export async function seedAllPlaygroundStores(): Promise<{
  indexedDb: boolean;
  opfs: boolean;
  cache: boolean;
  webStorage: boolean;
}> {
  let indexedDb = false;
  let opfs = false;
  let cache = false;
  let webStorage = false;

  try {
    await seedIndexedDbPlayground();
    indexedDb = true;
  } catch (e) {
    console.error('IndexedDB seed failed:', e);
  }

  try {
    await seedOpfsPlayground();
    opfs = true;
  } catch (e) {
    console.error('OPFS seed failed:', e);
  }

  try {
    await seedCachePlayground();
    cache = true;
  } catch (e) {
    console.error('Cache seed failed:', e);
  }

  try {
    seedWebStoragePlayground();
    webStorage = true;
  } catch (e) {
    console.error('WebStorage seed failed:', e);
  }

  return { indexedDb, opfs, cache, webStorage };
}
