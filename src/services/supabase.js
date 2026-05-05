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
  // Create a stub that returns errors for any query chain.
  //
  // Real Supabase queries chain arbitrarily deep:
  //   from('x').select('y').eq('a', 1).order('created_at').limit(10)
  //
  // The stub must survive any depth of property access AND any number
  // of intermediate calls, then resolve with {data:null, error} when
  // awaited. We do this by making the proxy thenable: the chain stays
  // chainable until something `await`s it, at which point `then` is
  // accessed and we resolve with errResult.
  const errResult = { data: null, error: new Error("Supabase not configured") };
  const makeChainable = () => {
    const target = function () {};
    return new Proxy(target, {
      // Any property access keeps the chain alive — except `then`, which
      // makes the proxy awaitable so `await supabase.from(x).select(y)`
      // resolves to errResult instead of a never-ending proxy.
      get: (_t, prop) => {
        if (prop === "then") {
          return (resolve) => resolve(errResult);
        }
        return makeChainable();
      },
      // Calling the proxy as a function (e.g. `.select('*')`) returns
      // another chainable, so `.eq(...)`, `.order(...)`, etc. keep working.
      apply: () => makeChainable(),
    });
  };
  _supabase = {
    from: () => makeChainable(),
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

export const supabase = _supabase;

// Expose raw URL/key for direct fetch calls (avoids supabase.functions.invoke issues)
export const supabaseEdgeFunctionUrl = (fnName) =>
  `${supabaseUrl || ""}/functions/v1/${fnName}`;
export const supabaseApiKey = supabaseAnonKey || "";
