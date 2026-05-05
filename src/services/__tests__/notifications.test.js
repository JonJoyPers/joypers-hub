/**
 * notifications service tests
 *
 * Critical path: push notifications are how messages reach off-shift staff.
 * The module is *full* of defensive try/catch so a broken push setup doesn't
 * crash the app — but defensive code that isn't tested isn't actually
 * defensive. These tests pin every graceful-degradation path:
 *
 *   - simulator (Device.isDevice = false)         → returns null, no token call
 *   - permission denied                            → returns null, no token call
 *   - permission API throws                        → returns null, no crash
 *   - missing EAS projectId (Expo Go)              → returns null, no token call
 *   - happy path (Supabase configured)             → upserts token row
 *   - happy path (Supabase NOT configured)         → returns token, no DB write
 *   - savePushToken DB error                       → does not throw
 *   - getExpoPushTokenAsync throws                 → outer catch returns null
 *
 * Per-file mocks override the global setup.js stub for `../supabase` and
 * `../notifications`.
 *
 * As with offlineQueue.test.js, factory closures must use `mock`-prefixed
 * names so Jest's hoist allow-list lets them through.
 */

// ── Per-file mocks ────────────────────────────────────────

const mockGetPermissions = jest.fn();
const mockRequestPermissions = jest.fn();
const mockSetNotificationHandler = jest.fn();
const mockSetNotificationChannelAsync = jest.fn().mockResolvedValue(undefined);
const mockGetExpoPushTokenAsync = jest.fn();
const mockGetLastNotificationResponseAsync = jest.fn();
const mockAddNotificationReceivedListener = jest.fn();
const mockAddNotificationResponseReceivedListener = jest.fn();

jest.mock('expo-notifications', () => ({
  setNotificationHandler: (...a) => mockSetNotificationHandler(...a),
  getPermissionsAsync: (...a) => mockGetPermissions(...a),
  requestPermissionsAsync: (...a) => mockRequestPermissions(...a),
  setNotificationChannelAsync: (...a) => mockSetNotificationChannelAsync(...a),
  AndroidImportance: { MAX: 5 },
  getExpoPushTokenAsync: (...a) => mockGetExpoPushTokenAsync(...a),
  getLastNotificationResponseAsync: (...a) =>
    mockGetLastNotificationResponseAsync(...a),
  addNotificationReceivedListener: (...a) =>
    mockAddNotificationReceivedListener(...a),
  addNotificationResponseReceivedListener: (...a) =>
    mockAddNotificationResponseReceivedListener(...a),
}));

const mockIsDevice = { value: true };
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice.value;
  },
}));

const mockProjectId = { value: 'eas-proj-123' };
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    get expoConfig() {
      return {
        extra: { eas: { projectId: mockProjectId.value } },
      };
    },
  },
}));

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' },
}));

let mockSupabaseConfigured = true;
const mockUpsert = jest.fn();
const mockDelete = jest.fn(() => ({
  eq: jest.fn().mockResolvedValue({ error: null }),
}));

jest.mock('../supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      upsert: (...a) => mockUpsert(...a),
      delete: (...a) => mockDelete(...a),
    })),
  },
  isSupabaseConfigured: () => mockSupabaseConfigured,
}));

// Bypass the global setup.js stub of ../notifications — we want the real one
const {
  registerForPushNotifications,
  unregisterPushToken,
  addNotificationListeners,
  getInitialNotification,
} = jest.requireActual('../notifications');

// ── Lifecycle ─────────────────────────────────────────────

let consoleSpy;
beforeEach(() => {
  mockGetPermissions.mockReset();
  mockRequestPermissions.mockReset();
  mockGetExpoPushTokenAsync.mockReset();
  mockGetLastNotificationResponseAsync.mockReset();
  mockAddNotificationReceivedListener.mockReset();
  mockAddNotificationResponseReceivedListener.mockReset();
  mockUpsert.mockReset();
  mockUpsert.mockResolvedValue({ error: null });
  mockDelete.mockClear();
  mockIsDevice.value = true;
  mockProjectId.value = 'eas-proj-123';
  mockSupabaseConfigured = true;

  // Silence the intentional warn/error noise; assert on it where it matters.
  consoleSpy = {
    log: jest.spyOn(console, 'log').mockImplementation(() => {}),
    warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
    error: jest.spyOn(console, 'error').mockImplementation(() => {}),
  };
});

afterEach(() => {
  consoleSpy.log.mockRestore();
  consoleSpy.warn.mockRestore();
  consoleSpy.error.mockRestore();
});

// ── Tests ─────────────────────────────────────────────────

describe('registerForPushNotifications — graceful degradation', () => {
  test('returns null on simulator (Device.isDevice=false), no permission probe', async () => {
    mockIsDevice.value = false;

    const token = await registerForPushNotifications('emp-1');

    expect(token).toBeNull();
    expect(mockGetPermissions).not.toHaveBeenCalled();
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test('returns null when permission already denied (no re-prompt)', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    // Already granted → goes straight through. Test the OPPOSITE path:
    mockGetPermissions.mockResolvedValueOnce({ status: 'denied' });
    mockRequestPermissions.mockResolvedValue({ status: 'denied' });

    const token = await registerForPushNotifications('emp-1');

    expect(token).toBeNull();
    expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test('returns null when permission probe THROWS (does not crash)', async () => {
    mockGetPermissions.mockRejectedValue(new Error('perm api boom'));

    const token = await registerForPushNotifications('emp-1');

    expect(token).toBeNull();
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringMatching(/push permission/i),
      expect.any(Error)
    );
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test('returns null when EAS projectId is missing (Expo Go scenario)', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockProjectId.value = undefined;

    const token = await registerForPushNotifications('emp-1');

    expect(token).toBeNull();
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringMatching(/projectId not found/i)
    );
  });

  test('returns null when getExpoPushTokenAsync THROWS (outer catch)', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockRejectedValue(new Error('token api down'));

    const token = await registerForPushNotifications('emp-1');

    expect(token).toBeNull();
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringMatching(/registerForPushNotifications failed/i),
      expect.any(Error)
    );
  });
});

describe('registerForPushNotifications — happy path', () => {
  test('returns token and upserts row when Supabase is configured', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[abc123]',
    });

    const token = await registerForPushNotifications('emp-42');

    expect(token).toBe('ExponentPushToken[abc123]');
    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const [row, opts] = mockUpsert.mock.calls[0];
    expect(row).toMatchObject({
      employee_id: 'emp-42',
      token: 'ExponentPushToken[abc123]',
      platform: 'ios',
    });
    expect(row.updated_at).toBeDefined();
    expect(opts).toEqual({ onConflict: 'token' });
  });

  test('returns token but skips DB write when Supabase NOT configured', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[x]' });
    mockSupabaseConfigured = false;

    const token = await registerForPushNotifications('emp-1');

    expect(token).toBe('ExponentPushToken[x]');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  test('returns token even when employeeId is missing (skips DB write)', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[y]' });

    const token = await registerForPushNotifications(null);

    expect(token).toBe('ExponentPushToken[y]');
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  test('does not throw when savePushToken DB upsert returns an error', async () => {
    mockGetPermissions.mockResolvedValue({ status: 'granted' });
    mockGetExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[z]' });
    mockUpsert.mockResolvedValue({ error: { message: 'db down' } });

    const token = await registerForPushNotifications('emp-9');

    // Token is still returned — the DB error is logged and swallowed.
    expect(token).toBe('ExponentPushToken[z]');
    expect(consoleSpy.error).toHaveBeenCalledWith(
      expect.stringMatching(/failed to save push token/i),
      'db down'
    );
  });
});

describe('addNotificationListeners', () => {
  test('wires receive + tap subscriptions and returns a cleanup fn', () => {
    const receivedRemove = jest.fn();
    const responseRemove = jest.fn();
    let receivedHandler;
    let responseHandler;

    mockAddNotificationReceivedListener.mockImplementation((cb) => {
      receivedHandler = cb;
      return { remove: receivedRemove };
    });
    mockAddNotificationResponseReceivedListener.mockImplementation((cb) => {
      responseHandler = cb;
      return { remove: responseRemove };
    });

    const onReceive = jest.fn();
    const onTap = jest.fn();
    const cleanup = addNotificationListeners({ onReceive, onTap });

    // Fire fake notifications and confirm callbacks bridged correctly
    receivedHandler({ id: 'n1' });
    expect(onReceive).toHaveBeenCalledWith({ id: 'n1' });

    responseHandler({
      notification: { request: { content: { data: { route: '/messages' } } } },
    });
    expect(onTap).toHaveBeenCalledWith({ route: '/messages' });

    cleanup();
    expect(receivedRemove).toHaveBeenCalledTimes(1);
    expect(responseRemove).toHaveBeenCalledTimes(1);
  });
});

describe('getInitialNotification', () => {
  test('returns the data payload when a tap-from-killed response exists', async () => {
    mockGetLastNotificationResponseAsync.mockResolvedValue({
      notification: {
        request: { content: { data: { messageId: 'm-7' } } },
      },
    });

    const data = await getInitialNotification();

    expect(data).toEqual({ messageId: 'm-7' });
  });

  test('returns null when no prior response exists', async () => {
    mockGetLastNotificationResponseAsync.mockResolvedValue(null);

    const data = await getInitialNotification();

    expect(data).toBeNull();
  });

  test('swallows errors and returns null', async () => {
    mockGetLastNotificationResponseAsync.mockRejectedValue(new Error('boom'));

    const data = await getInitialNotification();

    expect(data).toBeNull();
    expect(consoleSpy.warn).toHaveBeenCalledWith(
      expect.stringMatching(/getInitialNotification failed/i),
      expect.any(Error)
    );
  });
});

describe('unregisterPushToken', () => {
  test('no-ops when Supabase not configured', async () => {
    mockSupabaseConfigured = false;

    await expect(unregisterPushToken()).resolves.toBeUndefined();
    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test('no-ops when EAS projectId is missing', async () => {
    mockProjectId.value = undefined;

    await unregisterPushToken();

    expect(mockGetExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  test('deletes the token row when configured', async () => {
    mockGetExpoPushTokenAsync.mockResolvedValue({
      data: 'ExponentPushToken[abc]',
    });

    await unregisterPushToken();

    expect(mockGetExpoPushTokenAsync).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  test('swallows errors silently', async () => {
    mockGetExpoPushTokenAsync.mockRejectedValue(new Error('no token'));

    await expect(unregisterPushToken()).resolves.toBeUndefined();
    // logged at console.log not error — defensive behaviour
    expect(consoleSpy.log).toHaveBeenCalledWith(
      expect.stringMatching(/unregisterPushToken skipped/i),
      expect.any(String)
    );
  });
});
