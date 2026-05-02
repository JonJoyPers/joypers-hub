/**
 * offlineQueue tests
 *
 * Critical path: when the network drops mid-shift, punches must queue locally
 * and sync reliably when connectivity returns. Failures here mean lost payroll
 * data, so the retry/drop semantics are tested explicitly.
 *
 * The global setup.js mocks this module out for store tests; here we import
 * the real module via jest.requireActual and mock its dependencies (AsyncStorage,
 * NetInfo, supabase) locally.
 *
 * NOTE: Jest hoists `jest.mock(...)` calls to the top of the file, so any
 * variables referenced inside a mock factory MUST be prefixed with `mock`
 * (Jest's allow-list for factory closures).
 */

// ── Per-file dependency mocks ─────────────────────────────
// These override the global setup.js mock for `../supabase` in this file only.

let mockShouldFail = false;
const mockInsertCalls = [];

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn((table) => ({
      insert: jest.fn((row) => {
        mockInsertCalls.push({ table, row });
        return Promise.resolve(
          mockShouldFail ? { error: new Error('insert failed') } : { error: null }
        );
      }),
    })),
  },
  isSupabaseConfigured: () => true,
}));

let mockStorage = {};
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn((k) => Promise.resolve(mockStorage[k] ?? null)),
  setItem: jest.fn((k, v) => {
    mockStorage[k] = v;
    return Promise.resolve();
  }),
  removeItem: jest.fn((k) => {
    delete mockStorage[k];
    return Promise.resolve();
  }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  fetch: jest.fn(() =>
    Promise.resolve({ isConnected: true, isInternetReachable: true })
  ),
  addEventListener: jest.fn(() => jest.fn()),
}));

// Bypass the global setup.js mock and load the real offlineQueue module
const {
  enqueue,
  getQueue,
  getPendingCount,
  processQueue,
  onSyncComplete,
  isOnline,
} = jest.requireActual('../offlineQueue');

// ── Test lifecycle ────────────────────────────────────────
beforeEach(() => {
  mockStorage = {};
  mockShouldFail = false;
  mockInsertCalls.length = 0;
  onSyncComplete(null); // reset module-level callback between tests
});

// ── Tests ─────────────────────────────────────────────────
describe('offlineQueue', () => {
  describe('basic queue ops', () => {
    test('getQueue returns empty array when storage is empty', async () => {
      const q = await getQueue();
      expect(q).toEqual([]);
    });

    test('enqueue adds an item with id, queuedAt, retryCount=0', async () => {
      await enqueue({
        type: 'punch',
        employeeId: 'e1',
        punchType: 'clock_in',
        timestamp: '2026-01-01T10:00:00Z',
      });

      const q = await getQueue();
      expect(q).toHaveLength(1);
      expect(q[0].id).toMatch(/^oq_/);
      expect(q[0].queuedAt).toBeDefined();
      expect(q[0].retryCount).toBe(0);
      expect(q[0].employeeId).toBe('e1');
      expect(q[0].punchType).toBe('clock_in');
    });

    test('getPendingCount reflects queue length', async () => {
      expect(await getPendingCount()).toBe(0);

      await enqueue({ type: 'punch', employeeId: 'e1', punchType: 'clock_in', timestamp: 't1' });
      await enqueue({ type: 'punch', employeeId: 'e2', punchType: 'clock_out', timestamp: 't2' });

      expect(await getPendingCount()).toBe(2);
    });
  });

  describe('processQueue — success path', () => {
    test('syncs queued punch and clears queue', async () => {
      await enqueue({
        type: 'punch',
        employeeId: 'e1',
        punchType: 'clock_in',
        timestamp: '2026-01-01T10:00:00Z',
      });

      const result = await processQueue();

      expect(result).toEqual({ synced: 1, failed: 0, dropped: 0 });
      expect(await getPendingCount()).toBe(0);
      expect(mockInsertCalls).toHaveLength(1);
      expect(mockInsertCalls[0].table).toBe('punches');
      expect(mockInsertCalls[0].row).toMatchObject({
        employee_id: 'e1',
        type: 'clock_in',
        timestamp: '2026-01-01T10:00:00Z',
      });
    });

    test('formats GPS as PostgreSQL point string (longitude,latitude)', async () => {
      await enqueue({
        type: 'punch',
        employeeId: 'e1',
        punchType: 'clock_in',
        timestamp: '2026-01-01T10:00:00Z',
        location: { latitude: 43.6532, longitude: -79.3832 },
      });

      await processQueue();

      expect(mockInsertCalls[0].row.location).toBe('(-79.3832,43.6532)');
    });

    test('omits location when not provided', async () => {
      await enqueue({
        type: 'punch',
        employeeId: 'e1',
        punchType: 'clock_in',
        timestamp: '2026-01-01T10:00:00Z',
      });

      await processQueue();

      expect(mockInsertCalls[0].row.location).toBeUndefined();
    });

    test('handles multiple queued punches in a single pass', async () => {
      for (let i = 0; i < 3; i++) {
        await enqueue({
          type: 'punch',
          employeeId: `e${i}`,
          punchType: 'clock_in',
          timestamp: `2026-01-01T1${i}:00:00Z`,
        });
      }

      const result = await processQueue();

      expect(result.synced).toBe(3);
      expect(mockInsertCalls).toHaveLength(3);
      expect(await getPendingCount()).toBe(0);
    });
  });

  describe('processQueue — retry & drop semantics', () => {
    test('requeues with incremented retryCount when insert fails', async () => {
      mockShouldFail = true;

      await enqueue({ type: 'punch', employeeId: 'e1', punchType: 'clock_in', timestamp: 't1' });

      const result = await processQueue();

      expect(result).toEqual({ synced: 0, failed: 1, dropped: 0 });
      const q = await getQueue();
      expect(q).toHaveLength(1);
      expect(q[0].retryCount).toBe(1);
    });

    test('drops items after MAX_RETRIES (5) consecutive failures', async () => {
      mockShouldFail = true;

      await enqueue({ type: 'punch', employeeId: 'e1', punchType: 'clock_in', timestamp: 't1' });

      // Passes 1–4: retryCount goes 0→1, 1→2, 2→3, 3→4 — still requeued
      for (let i = 1; i <= 4; i++) {
        const r = await processQueue();
        expect(r.failed).toBe(1);
        expect(r.dropped).toBe(0);
        const q = await getQueue();
        expect(q[0].retryCount).toBe(i);
      }

      // Pass 5: retryCount 4→5 — at MAX_RETRIES, item is dropped
      const final = await processQueue();
      expect(final).toEqual({ synced: 0, failed: 0, dropped: 1 });
      expect(await getPendingCount()).toBe(0);
    });

    test('recovers after transient failure — retried item syncs on next pass', async () => {
      mockShouldFail = true;
      await enqueue({ type: 'punch', employeeId: 'e1', punchType: 'clock_in', timestamp: 't1' });

      const failResult = await processQueue();
      expect(failResult.failed).toBe(1);
      expect(await getPendingCount()).toBe(1);

      // Network recovers
      mockShouldFail = false;
      const successResult = await processQueue();
      expect(successResult.synced).toBe(1);
      expect(await getPendingCount()).toBe(0);
    });
  });

  describe('processQueue — sync callback', () => {
    test('invokes onSyncComplete callback when synced > 0', async () => {
      const cb = jest.fn();
      onSyncComplete(cb);

      await enqueue({ type: 'punch', employeeId: 'e1', punchType: 'clock_in', timestamp: 't1' });
      await processQueue();

      expect(cb).toHaveBeenCalledTimes(1);
      expect(cb).toHaveBeenCalledWith({ synced: 1, failed: 0, dropped: 0 });
    });

    test('does NOT invoke callback when nothing was synced', async () => {
      const cb = jest.fn();
      onSyncComplete(cb);

      mockShouldFail = true;
      await enqueue({ type: 'punch', employeeId: 'e1', punchType: 'clock_in', timestamp: 't1' });
      await processQueue();

      expect(cb).not.toHaveBeenCalled();
    });

    test('callback failure does not crash the queue processor', async () => {
      const cb = jest.fn(() => {
        throw new Error('callback boom');
      });
      onSyncComplete(cb);

      await enqueue({ type: 'punch', employeeId: 'e1', punchType: 'clock_in', timestamp: 't1' });
      const result = await processQueue();

      // Sync still succeeded even though callback threw
      expect(result.synced).toBe(1);
      expect(await getPendingCount()).toBe(0);
    });
  });

  describe('isOnline', () => {
    test('returns true when connected and reachable', async () => {
      expect(await isOnline()).toBe(true);
    });
  });
});
