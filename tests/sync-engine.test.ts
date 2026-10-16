import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isOnline,
  getPendingSync,
  savePendingSync,
  clearPendingSync,
  flushPendingSync,
  getLastSyncTime,
  setLastSyncTime,
  getOfflineSinceTime,
  setOfflineSinceTime,
  OFFLINE_SYNC_KEY,
} from '../src/syncEngine';
import {seed} from '../src/core';

// Ensure localStorage mock is present in Node environment if missing
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => {
      store.set(key, String(val));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => store.clear(),
    key: (i: number) => Array.from(store.keys())[i] ?? null,
    length: 0,
  };
}

test('isOnline reports true by default or follows navigator.onLine', () => {
  assert.equal(typeof isOnline(), 'boolean');
});

test('savePendingSync and getPendingSync correctly persist and retrieve offline queue', () => {
  clearPendingSync();
  assert.equal(getPendingSync(), null);

  const doc1 = seed();
  doc1.title = 'Test Label Offline';
  const documents = [doc1];

  savePendingSync({
    userId: 'user_123',
    documents,
    activeId: doc1.id,
  });

  const pending = getPendingSync();
  assert.ok(pending);
  assert.equal(pending.userId, 'user_123');
  assert.equal(pending.documents.length, 1);
  assert.equal(pending.documents[0].title, 'Test Label Offline');
  assert.equal(pending.activeId, doc1.id);
  assert.equal(pending.status, 'pending');

  clearPendingSync();
  assert.equal(getPendingSync(), null);
});

test('flushPendingSync successfully flushes pending items when online', async () => {
  clearPendingSync();
  const doc = seed();
  doc.title = 'Sync Me';

  savePendingSync({
    userId: 'user_abc',
    documents: [doc],
    activeId: doc.id,
  });

  let savedUserId = '';
  let savedDocCount = 0;
  const mockCloudSaver = async (userId: string, docs: typeof doc[], activeId: string) => {
    savedUserId = userId;
    savedDocCount = docs.length;
  };

  const result = await flushPendingSync(mockCloudSaver, 'user_abc');
  assert.equal(result.success, true);
  assert.equal(result.syncedCount, 1);
  assert.equal(savedUserId, 'user_abc');
  assert.equal(savedDocCount, 1);
  assert.equal(getPendingSync(), null);
  assert.ok(getLastSyncTime() !== null);
});

test('flushPendingSync keeps pending queue if cloud saver throws error', async () => {
  clearPendingSync();
  const doc = seed();

  savePendingSync({
    userId: 'user_err',
    documents: [doc],
    activeId: doc.id,
  });

  const failingCloudSaver = async () => {
    throw new Error('Supabase network timeout');
  };

  const result = await flushPendingSync(failingCloudSaver, 'user_err');
  assert.equal(result.success, false);
  assert.equal(result.syncedCount, 0);
  assert.match(result.error ?? '', /Supabase network timeout/);

  // Still preserved in pending queue
  const pending = getPendingSync();
  assert.ok(pending);
  assert.equal(pending.lastError, 'Supabase network timeout');
  assert.ok(pending.retryCount >= 2);

  clearPendingSync();
});

test('getOfflineSinceTime and setOfflineSinceTime correctly persist and clear offline timestamp', () => {
  setOfflineSinceTime(null);
  assert.equal(getOfflineSinceTime(), null);

  const testTime = 1760000000000;
  setOfflineSinceTime(testTime);
  assert.equal(getOfflineSinceTime(), testTime);

  setOfflineSinceTime(null);
  assert.equal(getOfflineSinceTime(), null);
});
