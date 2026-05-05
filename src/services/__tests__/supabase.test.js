/**
 * supabase service tests
 *
 * The supabase module is loaded ONCE at app startup and constructs the
 * client based on env vars. If env vars are missing OR the client throws
 * during creation, we fall back to a Proxy-based stub so any chained
 * query (e.g. supabase.from('x').select('y').eq('z', 1)) returns a safe
 * error result instead of crashing the app.
 *
 * That fallback is critical defensive code — a single TypeError from the
 * stub on app boot would brick every screen. These tests pin both the
 * configured-client path and the unconfigured-stub path.
 *
 * Module isolation: each test calls jest.resetModules() and reloads the
 * supabase module fresh inside jest.isolateModules() so we can flip env
 * vars between scenarios.
 */

// `babel-preset-expo` rewrites every `process.env.EXPO_PUBLIC_*` reference
// into an import from `expo/virtual/env`, which is shipped as ESM and is
// NOT transformed by the unit project (see jest.config.js
// transformIgnorePatterns). Stub it here so the rewritten import resolves
// to a plain object whose `env` getter just returns the current process.env
// — that way our env-var manipulation between tests still takes effect.
jest.mock(
  'expo/virtual/env',
  () => ({
    get env() {
      return process.env;
    },
  }),
  { virtual: true }
);

const mockCreateClient = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: (...args) => mockCreateClient(...args),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

const ORIGINAL_ENV = { ...process.env };

beforeEach(() => {
  mockCreateClient.mockReset();
  // Default: createClient returns a benign object so happy-path tests
  // don't have to repeat themselves.
  mockCreateClient.mockReturnValue({
    from: jest.fn(),
    auth: {},
    functions: {},
  });
  jest.resetModules();
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

function loadModuleWith(env) {
  let mod;
  jest.isolateModules(() => {
    if (env.url === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_URL;
    else process.env.EXPO_PUBLIC_SUPABASE_URL = env.url;
    if (env.key === undefined) delete process.env.EXPO_PUBLIC_SUPABASE_KEY;
    else process.env.EXPO_PUBLIC_SUPABASE_KEY = env.key;
    // Bypass setup.js's global stub of '../supabase' — this file IS the test
    // for supabase, so we want the real module.
    mod = jest.requireActual('../supabase');
  });
  return mod;
}

// ── Tests ─────────────────────────────────────────────────

describe('supabase — configured path', () => {
  test('isSupabaseConfigured() is true when both env vars are set', () => {
    const mod = loadModuleWith({
      url: 'https://abc.supabase.co',
      key: 'anon-key',
    });
    expect(mod.isSupabaseConfigured()).toBe(true);
    expect(mockCreateClient).toHaveBeenCalledWith(
      'https://abc.supabase.co',
      'anon-key',
      expect.objectContaining({
        auth: expect.objectContaining({
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        }),
      })
    );
  });

  test('exposes the real client returned by createClient', () => {
    const fakeClient = {
      from: jest.fn(),
      auth: { real: true },
      functions: {},
    };
    mockCreateClient.mockReturnValueOnce(fakeClient);

    const mod = loadModuleWith({
      url: 'https://abc.supabase.co',
      key: 'anon-key',
    });

    expect(mod.supabase).toBe(fakeClient);
  });

  test('supabaseEdgeFunctionUrl composes URL from env', () => {
    const mod = loadModuleWith({
      url: 'https://abc.supabase.co',
      key: 'anon-key',
    });
    expect(mod.supabaseEdgeFunctionUrl('send-push')).toBe(
      'https://abc.supabase.co/functions/v1/send-push'
    );
  });
});

describe('supabase — unconfigured path (env vars missing)', () => {
  // When env is missing, the module STILL calls createClient with placeholder
  // values (so it doesn't crash on app boot in dev), but isSupabaseConfigured
  // returns false. Stores then know to use mock data.

  test('isSupabaseConfigured() is false when URL is missing', () => {
    const mod = loadModuleWith({ url: undefined, key: 'anon-key' });
    expect(mod.isSupabaseConfigured()).toBe(false);
  });

  test('isSupabaseConfigured() is false when key is missing', () => {
    const mod = loadModuleWith({ url: 'https://abc.supabase.co', key: undefined });
    expect(mod.isSupabaseConfigured()).toBe(false);
  });

  test('isSupabaseConfigured() is false when both are missing', () => {
    const mod = loadModuleWith({ url: undefined, key: undefined });
    expect(mod.isSupabaseConfigured()).toBe(false);
  });

  test('supabaseEdgeFunctionUrl uses empty base when URL is missing', () => {
    const mod = loadModuleWith({ url: undefined, key: undefined });
    expect(mod.supabaseEdgeFunctionUrl('foo')).toBe('/functions/v1/foo');
  });

  test('supabaseApiKey is empty string when key is missing', () => {
    const mod = loadModuleWith({ url: undefined, key: undefined });
    expect(mod.supabaseApiKey).toBe('');
  });
});

describe('supabase — stub fallback (createClient throws)', () => {
  // This is the CRITICAL defensive path: if @supabase/supabase-js itself
  // explodes during construction (corrupt SDK install, AsyncStorage
  // unavailable, etc.), we install a Proxy-based stub so every subsequent
  // chain still resolves to {data:null, error:Error} instead of TypeError.

  function loadWithCrashingCreateClient() {
    let mod;
    jest.isolateModules(() => {
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://abc.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_KEY = 'anon-key';
      mockCreateClient.mockImplementationOnce(() => {
        throw new Error('SDK init failed');
      });
      // Suppress the warn() the module emits in this branch
      const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      mod = jest.requireActual('../supabase');
      warnSpy.mockRestore();
    });
    return mod;
  }

  test('reports unconfigured even though env vars are present', () => {
    const mod = loadWithCrashingCreateClient();
    expect(mod.isSupabaseConfigured()).toBe(false);
  });

  test('supabase.from(table).select() resolves to {data:null, error}', async () => {
    const mod = loadWithCrashingCreateClient();
    const result = await mod.supabase.from('punches').select('*');
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  test('supabase.from(table).select(...).eq(...).limit(...) deep chain stays safe', async () => {
    const mod = loadWithCrashingCreateClient();
    const result = await mod.supabase
      .from('messages')
      .select('id, body')
      .eq('employee_id', 'e1')
      .order('created_at', { ascending: false })
      .limit(10);
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  test('supabase.auth.signInWithPassword returns an error result (does not throw)', () => {
    const mod = loadWithCrashingCreateClient();
    const result = mod.supabase.auth.signInWithPassword({
      email: 'a@b.c',
      password: 'x',
    });
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  test('supabase.auth.getSession returns null session (does not throw)', () => {
    const mod = loadWithCrashingCreateClient();
    const { data } = mod.supabase.auth.getSession();
    expect(data.session).toBeNull();
  });

  test('supabase.functions.invoke returns an error result (does not throw)', () => {
    const mod = loadWithCrashingCreateClient();
    const result = mod.supabase.functions.invoke('send-push', {
      body: { token: 'x' },
    });
    expect(result.data).toBeNull();
    expect(result.error).toBeInstanceOf(Error);
  });

  test('supabase.auth.signOut and updateUser do not throw', () => {
    const mod = loadWithCrashingCreateClient();
    expect(() => mod.supabase.auth.signOut()).not.toThrow();
    const updateResult = mod.supabase.auth.updateUser({ password: 'new' });
    expect(updateResult.error).toBeInstanceOf(Error);
  });
});
