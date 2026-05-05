/**
 * sentry service tests
 *
 * sentry.js is a *defensive wrapper* around @sentry/react-native: it must
 * never crash the app, even if the SDK is missing, the DSN is unset, or
 * an individual capture call throws. Every store and screen calls
 * Sentry.captureException(...) in catch blocks — if any of those calls
 * leaked an exception of their own, we'd loop into the very crash we're
 * trying to report.
 *
 * Module isolation via jest.isolateModules so each test reloads sentry.js
 * with a fresh _sentry binding and _initialized flag.
 */

// `babel-preset-expo` rewrites process.env.EXPO_PUBLIC_* into an import
// from `expo/virtual/env`. Stub it so our env mutations between tests
// take effect (same trick as supabase.test.js).
jest.mock(
  'expo/virtual/env',
  () => ({
    get env() {
      return process.env;
    },
  }),
  { virtual: true }
);

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  jest.resetModules();
  delete process.env.EXPO_PUBLIC_SENTRY_DSN;
  // __DEV__ is a global in RN runtime; default to false so enabled flag flips on
  global.__DEV__ = false;
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function loadSentryModule() {
  let mod;
  jest.isolateModules(() => {
    mod = jest.requireActual('../sentry');
  });
  return mod;
}

// ── Tests ─────────────────────────────────────────────────

describe('initSentry — DSN missing', () => {
  test('returns false and logs when DSN is not set', () => {
    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mod = loadSentryModule();

    const result = mod.initSentry();

    expect(result).toBe(false);
    expect(logSpy).toHaveBeenCalledWith(
      expect.stringMatching(/no DSN configured/i)
    );
    logSpy.mockRestore();
  });

  test('Sentry.captureException is a no-op (does not throw)', () => {
    const mod = loadSentryModule();
    mod.initSentry();
    expect(() => mod.Sentry.captureException(new Error('test'))).not.toThrow();
  });

  test('Sentry.withScope swallows errors thrown inside the callback', () => {
    const mod = loadSentryModule();
    mod.initSentry();

    expect(() =>
      mod.Sentry.withScope(() => {
        throw new Error('inside scope');
      })
    ).not.toThrow();
  });
});

describe('initSentry — SDK missing or init throws', () => {
  test('returns false when @sentry/react-native cannot be required', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@o.ingest.sentry.io/1';

    // Force the require('@sentry/react-native') to throw inside initSentry
    jest.doMock('@sentry/react-native', () => {
      throw new Error('module not installed');
    });

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = loadSentryModule();

    const result = mod.initSentry();

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/initialization failed/i),
      expect.any(String)
    );
    warnSpy.mockRestore();
    jest.dontMock('@sentry/react-native');
  });

  test('returns false when Sentry.init() itself throws', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@o.ingest.sentry.io/1';

    jest.doMock('@sentry/react-native', () => ({
      init: () => {
        throw new Error('init exploded');
      },
    }));

    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = loadSentryModule();

    const result = mod.initSentry();

    expect(result).toBe(false);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/initialization failed/i),
      expect.any(String)
    );

    // And critically — Sentry.captureException still doesn't throw afterward
    expect(() => mod.Sentry.captureException(new Error('x'))).not.toThrow();

    warnSpy.mockRestore();
    jest.dontMock('@sentry/react-native');
  });
});

describe('initSentry — DSN present, SDK loads cleanly', () => {
  test('returns true, calls SDK init with expected options, and routes captures through', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@o.ingest.sentry.io/1';

    const mockInit = jest.fn();
    const mockCaptureException = jest.fn();
    const mockSetUser = jest.fn();

    jest.doMock('@sentry/react-native', () => ({
      init: mockInit,
      captureException: mockCaptureException,
      setUser: mockSetUser,
    }));

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mod = loadSentryModule();

    const result = mod.initSentry();

    expect(result).toBe(true);
    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://abc@o.ingest.sentry.io/1',
        attachStacktrace: true,
        enabled: true, // because __DEV__ = false in beforeEach
        tracesSampleRate: 0.2,
      })
    );

    // Captures now flow to the real SDK
    const err = new Error('routed');
    mod.Sentry.captureException(err);
    expect(mockCaptureException).toHaveBeenCalledWith(err);

    mod.Sentry.setUser({ id: 'e1' });
    expect(mockSetUser).toHaveBeenCalledWith({ id: 'e1' });

    logSpy.mockRestore();
    jest.dontMock('@sentry/react-native');
  });

  test('second initSentry call short-circuits and does not re-init the SDK', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@o.ingest.sentry.io/1';

    const mockInit = jest.fn();
    jest.doMock('@sentry/react-native', () => ({ init: mockInit }));

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mod = loadSentryModule();

    expect(mod.initSentry()).toBe(true);
    expect(mod.initSentry()).toBe(true);
    expect(mockInit).toHaveBeenCalledTimes(1);

    logSpy.mockRestore();
    jest.dontMock('@sentry/react-native');
  });

  test('tracesSampleRate is 1.0 when __DEV__ is true (and enabled flips false)', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@o.ingest.sentry.io/1';
    global.__DEV__ = true;

    const mockInit = jest.fn();
    jest.doMock('@sentry/react-native', () => ({ init: mockInit }));

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const mod = loadSentryModule();

    mod.initSentry();

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ tracesSampleRate: 1.0, enabled: false })
    );

    logSpy.mockRestore();
    jest.dontMock('@sentry/react-native');
  });
});

describe('Sentry proxy — per-call defensive wrapping', () => {
  test('a real SDK method that throws is caught and logged (not propagated)', () => {
    process.env.EXPO_PUBLIC_SENTRY_DSN = 'https://abc@o.ingest.sentry.io/1';

    jest.doMock('@sentry/react-native', () => ({
      init: jest.fn(),
      captureException: () => {
        throw new Error('SDK exploded mid-capture');
      },
    }));

    const logSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = loadSentryModule();

    mod.initSentry();

    // The capture call must NOT throw, even though the SDK does.
    expect(() => mod.Sentry.captureException(new Error('x'))).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringMatching(/Sentry\.captureException failed/i),
      expect.any(String)
    );

    logSpy.mockRestore();
    warnSpy.mockRestore();
    jest.dontMock('@sentry/react-native');
  });

  test('accessing a non-function property on Sentry returns the underlying value', () => {
    const mod = loadSentryModule();
    mod.initSentry();
    // No-op Sentry has function-only members; accessing a missing prop
    // should return undefined (or the underlying noop value), never throw.
    expect(() => mod.Sentry.somethingUndefined).not.toThrow();
  });
});
