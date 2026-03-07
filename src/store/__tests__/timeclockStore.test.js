import { useTimeclockStore } from '../timeclockStore';

describe('timeclockStore (mock mode)', () => {
  test('initial state has mock punches', () => {
    const state = useTimeclockStore.getState();
    expect(state.punches.length).toBeGreaterThan(0);
    expect(state.loading).toBe(false);
  });

  test('currentStatus returns clocked_out for unknown user', () => {
    const status = useTimeclockStore.getState().currentStatus('unknown_user');
    expect(status).toBe('clocked_out');
  });

  test('getPunchesForUser filters by userId', () => {
    const punches = useTimeclockStore.getState().getPunchesForUser('u004');
    expect(punches.length).toBeGreaterThan(0);
    punches.forEach((p) => expect(p.userId).toBe('u004'));
  });

  test('getPunchesForUser returns sorted by timestamp descending', () => {
    const punches = useTimeclockStore.getState().getPunchesForUser('u004');
    for (let i = 1; i < punches.length; i++) {
      expect(new Date(punches[i - 1].timestamp).getTime())
        .toBeGreaterThanOrEqual(new Date(punches[i].timestamp).getTime());
    }
  });

  test('clockIn adds a punch and updates state', async () => {
    const before = useTimeclockStore.getState().punches.length;
    const punch = await useTimeclockStore.getState().clockIn('test_user');

    expect(punch).toBeDefined();
    expect(punch.type).toBe('clock_in');
    expect(punch.userId).toBe('test_user');
    expect(useTimeclockStore.getState().punches.length).toBe(before + 1);
  });

  test('clockOut adds a clock_out punch', async () => {
    const punch = await useTimeclockStore.getState().clockOut('test_user');
    expect(punch.type).toBe('clock_out');
  });

  test('startBreak / endBreak add correct punch types', async () => {
    const breakStart = await useTimeclockStore.getState().startBreak('test_user');
    expect(breakStart.type).toBe('break_start');
    expect(breakStart.note).toBe('Break');

    const breakEnd = await useTimeclockStore.getState().endBreak('test_user');
    expect(breakEnd.type).toBe('break_end');
  });

  test('startLunch / endLunch add correct punch types', async () => {
    const lunchStart = await useTimeclockStore.getState().startLunch('test_user');
    expect(lunchStart.type).toBe('lunch_start');

    const lunchEnd = await useTimeclockStore.getState().endLunch('test_user');
    expect(lunchEnd.type).toBe('lunch_end');
  });

  test('currentStatus reflects latest punch type', async () => {
    const uid = 'status_test_user';
    await useTimeclockStore.getState().clockIn(uid);
    expect(useTimeclockStore.getState().currentStatus(uid)).toBe('clocked_in');

    await useTimeclockStore.getState().startBreak(uid);
    expect(useTimeclockStore.getState().currentStatus(uid)).toBe('on_break');

    await useTimeclockStore.getState().endBreak(uid);
    expect(useTimeclockStore.getState().currentStatus(uid)).toBe('clocked_in');

    await useTimeclockStore.getState().startLunch(uid);
    expect(useTimeclockStore.getState().currentStatus(uid)).toBe('on_lunch');

    await useTimeclockStore.getState().endLunch(uid);
    expect(useTimeclockStore.getState().currentStatus(uid)).toBe('clocked_in');

    await useTimeclockStore.getState().clockOut(uid);
    expect(useTimeclockStore.getState().currentStatus(uid)).toBe('clocked_out');
  });

  test('getTodayHours calculates working hours', async () => {
    const uid = 'hours_test_user';
    // Clock in, then hours should be > 0 (since getTodayHours includes time until now)
    await useTimeclockStore.getState().clockIn(uid);
    const hours = useTimeclockStore.getState().getTodayHours(uid);
    expect(hours).toBeGreaterThanOrEqual(0);
  });
});
