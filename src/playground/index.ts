import { seedIndexedDbPlayground } from './seed_indexeddb';
import { seedOpfsPlayground } from './seed_opfs';
import { seedCachePlayground } from './seed_cache';

export async function seedAllPlaygroundStores(): Promise<{
  indexedDb: boolean;
  opfs: boolean;
  cache: boolean;
}> {
  let indexedDb = false;
  let opfs = false;
  let cache = false;

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

  return { indexedDb, opfs, cache };
}
