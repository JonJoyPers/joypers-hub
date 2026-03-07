import { useScheduleStore } from '../scheduleStore';

describe('scheduleStore (mock mode)', () => {
  test('initial state has mock shifts', () => {
    const state = useScheduleStore.getState();
    expect(state.shifts.length).toBeGreaterThan(0);
    expect(state.loading).toBe(false);
  });

  test('getShiftsForDate filters by date string', () => {
    const shifts = useScheduleStore.getState().shifts;
    const date = shifts[0]?.date;
    if (!date) return;

    const filtered = useScheduleStore.getState().getShiftsForDate(date);
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach((s) => expect(s.date).toBe(date));
  });

  test('getShiftsForDate returns sorted by startTime', () => {
    const shifts = useScheduleStore.getState().shifts;
    const date = shifts[0]?.date;
    if (!date) return;

    const filtered = useScheduleStore.getState().getShiftsForDate(date);
    for (let i = 1; i < filtered.length; i++) {
      expect(filtered[i - 1].startTime.localeCompare(filtered[i].startTime))
        .toBeLessThanOrEqual(0);
    }
  });

  test('getShiftsForUser filters by userId', () => {
    const shifts = useScheduleStore.getState().shifts;
    const userId = shifts[0]?.userId;
    if (!userId) return;

    const filtered = useScheduleStore.getState().getShiftsForUser(userId);
    expect(filtered.length).toBeGreaterThan(0);
    filtered.forEach((s) => expect(s.userId).toBe(userId));
  });

  test('addShift adds a new shift to state', async () => {
    const before = useScheduleStore.getState().shifts.length;
    const shift = await useScheduleStore.getState().addShift({
      userId: 'u004',
      date: '2026-03-10',
      startTime: '09:00',
      endTime: '17:00',
      type: 'opening',
    });

    expect(shift).toBeDefined();
    expect(shift.userId).toBe('u004');
    expect(shift.type).toBe('opening');
    expect(useScheduleStore.getState().shifts.length).toBe(before + 1);
  });

  test('removeShift removes a shift from state', async () => {
    const shift = await useScheduleStore.getState().addShift({
      userId: 'u004',
      date: '2026-03-11',
      startTime: '10:00',
      endTime: '18:00',
      type: 'mid',
    });

    const before = useScheduleStore.getState().shifts.length;
    await useScheduleStore.getState().removeShift(shift.id);
    const after = useScheduleStore.getState().shifts.length;
    expect(after).toBe(before - 1);
    expect(useScheduleStore.getState().shifts.find((s) => s.id === shift.id)).toBeUndefined();
  });

  test('getShiftsForWeek returns shifts within 7-day range', () => {
    const shifts = useScheduleStore.getState().shifts;
    if (shifts.length === 0) return;

    // Find the Monday of the first shift's week
    const firstDate = new Date(shifts[0].date + 'T00:00:00');
    const day = firstDate.getDay();
    const diff = firstDate.getDate() - day + (day === 0 ? -6 : 1);
    firstDate.setDate(diff);
    const mondayStr = firstDate.toISOString().split('T')[0];

    const weekShifts = useScheduleStore.getState().getShiftsForWeek(mondayStr);
    expect(weekShifts.length).toBeGreaterThan(0);
  });
});
