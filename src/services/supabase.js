import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not set. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env"
  );
}

// Track whether the real client was created successfully.
let _clientReady = false;
let _createError = null;

// Only create the real client if credentials are available.
// createClient("", "") can crash the app on startup.
let _supabase;
try {
  _supabase = createClient(
    supabaseUrl || "https://placeholder.supabase.co",
    supabaseAnonKey || "placeholder",
    {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    }
  );
  // Only mark ready if env vars were actually set
  _clientReady = Boolean(supabaseUrl && supabaseAnonKey);
} catch (e) {
  console.warn("Supabase client creation failed:", e);
  _clientReady = false;
  _createError = e.message || String(e);
  // Create a stub that returns errors for any query chain.
  // Uses a self-returning proxy pattern so any method chain works.
  const errResult = { data: null, error: new Error("Supabase not configured") };
  const chainable = () =>
    new Proxy(() => errResult, {
      get: () => chainable(),
      apply: () => errResult,
    });
  const queryProxy = new Proxy(
    {},
    { get: () => chainable() }
  );
  _supabase = {
    from: () => queryProxy,
    auth: {
      getSession: () => ({ data: { session: null } }),
      signInWithPassword: () => ({ data: null, error: new Error("Not configured") }),
      signOut: () => {},
      onAuthStateChange: () => {},
      updateUser: () => ({ error: new Error("Not configured") }),
      setSession: () => {},
    },
    functions: { invoke: () => ({ data: null, error: new Error("Not configured") }) },
  };
}

/**
 * Returns true if Supabase is fully configured and the client was created.
 * Stores use this to decide whether to use Supabase or fall back to mock data.
 */
export const isSupabaseConfigured = () => _clientReady;

// Temporary debug info — remove after debugging
export const getSupabaseDebugInfo = () => ({
  urlRaw: supabaseUrl,
  urlFirst20: supabaseUrl ? supabaseUrl.substring(0, 20) + "..." : "(empty)",
  urlType: typeof supabaseUrl,
  keySet: Boolean(supabaseAnonKey),
  keyFirst10: supabaseAnonKey ? supabaseAnonKey.substring(0, 10) + "..." : "(empty)",
  clientReady: _clientReady,
  createError: _createError,
});

export const supabase = _supabase;
