/**
 * leaveStore tests
 *
 * Most leaveStore methods require Supabase (no mock fallback by design),
 * but the pure selectors (getBalance, getPendingRequests) and the
 * "supabase not configured" early-exit branches are covered here.
 *
 * The global setup.js mocks supabase as unconfigured, so these tests
 * verify that mutating methods are safe no-ops in that mode.
 */

import { useLeaveStore } from '../leaveStore';

beforeEach(() => {
  useLeaveStore.setState({
    leaveTypes: [],
    requests: [],
    balances: {},
    loading: false,
  });
});

describe('leaveStore', () => {
  describe('initial state', () => {
    test('starts empty', () => {
      const s = useLeaveStore.getState();
      expect(s.leaveTypes).toEqual([]);
      expect(s.requests).toEqual([]);
      expect(s.balances).toEqual({});
      expect(s.loading).toBe(false);
    });
  });

  describe('getBalance selector', () => {
    test('returns 0 for unknown leave type', () => {
      expect(useLeaveStore.getState().getBalance('vacation')).toBe(0);
    });

    test('returns the stored balance for a known leave type', () => {
      useLeaveStore.setState({ balances: { vacation: 80, sick: 40 } });
      expect(useLeaveStore.getState().getBalance('vacation')).toBe(80);
      expect(useLeaveStore.getState().getBalance('sick')).toBe(40);
    });

    test('returns 0 (not undefined) for missing key — safe for math', () => {
      useLeaveStore.setState({ balances: { vacation: 80 } });
      const result = useLeaveStore.getState().getBalance('personal');
      expect(result).toBe(0);
      // Critical: must be a number so `balance - hoursRequested` doesn't NaN
      expect(typeof result).toBe('number');
    });
  });

  describe('getPendingRequests selector', () => {
    test('returns empty array when no requests', () => {
      expect(useLeaveStore.getState().getPendingRequests()).toEqual([]);
    });

    test('returns only requests with status=pending', () => {
      useLeaveStore.setState({
        requests: [
          { id: 1, status: 'pending', employeeId: 'e1' },
          { id: 2, status: 'approved', employeeId: 'e2' },
          { id: 3, status: 'pending', employeeId: 'e3' },
          { id: 4, status: 'declined', employeeId: 'e4' },
          { id: 5, status: 'cancelled', employeeId: 'e5' },
        ],
      });

      const pending = useLeaveStore.getState().getPendingRequests();
      expect(pending).toHaveLength(2);
      expect(pending.map((r) => r.id).sort()).toEqual([1, 3]);
      expect(pending.every((r) => r.status === 'pending')).toBe(true);
    });
  });

  describe('safety when Supabase is not configured', () => {
    test('fetchLeaveTypes is a no-op', async () => {
      await useLeaveStore.getState().fetchLeaveTypes();
      expect(useLeaveStore.getState().leaveTypes).toEqual([]);
    });

    test('fetchRequests is a no-op', async () => {
      await useLeaveStore.getState().fetchRequests('e1');
      expect(useLeaveStore.getState().requests).toEqual([]);
      // loading should not be left in a stuck state
      expect(useLeaveStore.getState().loading).toBe(false);
    });

    test('fetchBalances is a no-op', async () => {
      await useLeaveStore.getState().fetchBalances('e1');
      expect(useLeaveStore.getState().balances).toEqual({});
    });

    test('submitRequest returns null and does not mutate state', async () => {
      const result = await useLeaveStore.getState().submitRequest({
        employeeId: 'e1',
        leaveTypeId: 1,
        startDate: '2026-04-01',
        endDate: '2026-04-05',
        hours: 40,
        reason: 'trip',
      });

      expect(result).toBeNull();
      expect(useLeaveStore.getState().requests).toEqual([]);
    });

    test('reviewRequest returns null', async () => {
      const result = await useLeaveStore.getState().reviewRequest(1, 'approve');
      expect(result).toBeNull();
    });

    test('cancelRequest is a no-op (does not throw)', async () => {
      await expect(useLeaveStore.getState().cancelRequest(1)).resolves.toBeUndefined();
    });
  });
});
