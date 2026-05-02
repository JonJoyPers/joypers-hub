/**
 * timeclockStore.getTodayHours — deterministic payroll math
 *
 * The original timeclockStore.test.js only smoke-tests this method (>= 0).
 * This file pre-seeds known punch sequences and asserts exact hour totals
 * so payroll math regressions are caught at PR time.
 */

import { useTimeclockStore } from '../timeclockStore';

// Build an ISO timestamp at H:M today
const todayAt = (h, m = 0) => {
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

// Build an ISO timestamp at H:M yesterday
const yesterdayAt = (h, m = 0) => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  d.setHours(h, m, 0, 0);
  return d.toISOString();
};

beforeEach(() => {
  useTimeclockStore.setState({ punches: [], loading: false });
});

describe('timeclockStore.getTodayHours (deterministic)', () => {
  test('returns 0 when user has no punches', () => {
    expect(useTimeclockStore.getState().getTodayHours('u1')).toBe(0);
  });

  test('returns 4h for a clean clock_in → clock_out (8:00 → 12:00)', () => {
    useTimeclockStore.setState({
      punches: [
        { id: '1', userId: 'u1', type: 'clock_in', timestamp: todayAt(8) },
        { id: '2', userId: 'u1', type: 'clock_out', timestamp: todayAt(12) },
      ],
    });

    expect(useTimeclockStore.getState().getTodayHours('u1')).toBe(4);
  });

  test('subtracts unpaid lunch (8→12 work + 12→13 lunch + 13→17 work = 8h paid)', () => {
    useTimeclockStore.setState({
      punches: [
        { id: '1', userId: 'u1', type: 'clock_in',    timestamp: todayAt(8) },
        { id: '2', userId: 'u1', type: 'lunch_start', timestamp: todayAt(12) },
        { id: '3', userId: 'u1', type: 'lunch_end',   timestamp: todayAt(13) },
        { id: '4', userId: 'u1', type: 'clock_out',   timestamp: todayAt(17) },
      ],
    });

    expect(useTimeclockStore.getState().getTodayHours('u1')).toBe(8);
  });

  test('does NOT deduct rest breaks — break_start/break_end are paid time', () => {
    // 8:00 clock_in → 17:00 clock_out, with a 15-min break in between.
    // Per current store logic, break_start/break_end are ignored, so the
    // entire 9h span is counted as paid time. This test pins that behavior
    // so a future change to deduct breaks fails loudly here.
    useTimeclockStore.setState({
      punches: [
        { id: '1', userId: 'u1', type: 'clock_in',    timestamp: todayAt(8) },
        { id: '2', userId: 'u1', type: 'break_start', timestamp: todayAt(10) },
        { id: '3', userId: 'u1', type: 'break_end',   timestamp: todayAt(10, 15) },
        { id: '4', userId: 'u1', type: 'clock_out',   timestamp: todayAt(17) },
      ],
    });

    expect(useTimeclockStore.getState().getTodayHours('u1')).toBe(9);
  });

  test('handles split shift (clock_in → clock_out → clock_in → clock_out)', () => {
    useTimeclockStore.setState({
      punches: [
        { id: '1', userId: 'u1', type: 'clock_in',  timestamp: todayAt(8) },
        { id: '2', userId: 'u1', type: 'clock_out', timestamp: todayAt(11) },
        { id: '3', userId: 'u1', type: 'clock_in',  timestamp: todayAt(14) },
        { id: '4', userId: 'u1', type: 'clock_out', timestamp: todayAt(17) },
      ],
    });

    // 3h + 3h = 6h
    expect(useTimeclockStore.getState().getTodayHours('u1')).toBe(6);
  });

  test('counts ongoing time when still clocked in (no clock_out yet)', () => {
    // Clock in 1 hour ago — total should be ~1.0
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    useTimeclockStore.setState({
      punches: [{ id: '1', userId: 'u1', type: 'clock_in', timestamp: oneHourAgo }],
    });

    const hours = useTimeclockStore.getState().getTodayHours('u1');
    expect(hours).toBeGreaterThanOrEqual(0.9);
    expect(hours).toBeLessThanOrEqual(1.1);
  });

  test('ignores punches from other users', () => {
    useTimeclockStore.setState({
      punches: [
        { id: '1', userId: 'other_user', type: 'clock_in',  timestamp: todayAt(8) },
        { id: '2', userId: 'other_user', type: 'clock_out', timestamp: todayAt(17) },
      ],
    });

    expect(useTimeclockStore.getState().getTodayHours('u1')).toBe(0);
  });

  test('ignores punches from yesterday', () => {
    useTimeclockStore.setState({
      punches: [
        { id: '1', userId: 'u1', type: 'clock_in',  timestamp: yesterdayAt(8) },
        { id: '2', userId: 'u1', type: 'clock_out', timestamp: yesterdayAt(17) },
      ],
    });

    expect(useTimeclockStore.getState().getTodayHours('u1')).toBe(0);
  });

  test('rounds to one decimal place', () => {
    // 2h 7m = 2.116... → should round to 2.1
    useTimeclockStore.setState({
      punches: [
        { id: '1', userId: 'u1', type: 'clock_in',  timestamp: todayAt(8) },
        { id: '2', userId: 'u1', type: 'clock_out', timestamp: todayAt(10, 7) },
      ],
    });

    expect(useTimeclockStore.getState().getTodayHours('u1')).toBe(2.1);
  });
});
