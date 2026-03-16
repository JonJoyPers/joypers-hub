import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase credentials not set. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_KEY in .env"
  );
}

/**
 * Returns true if Supabase is configured (env vars are set).
 * Stores can use this to decide whether to use Supabase or fall back to mock data.
 */
export const isSupabaseConfigured = () =>
  Boolean(supabaseUrl && supabaseAnonKey);

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
} catch (e) {
  console.warn("Supabase client creation failed:", e);
  // Create a minimal stub so imports don't crash
  _supabase = {
    from: () => ({ select: () => ({ eq: () => ({ single: () => ({ data: null, error: new Error("Supabase not configured") }) }) }), insert: () => ({ select: () => ({ single: () => ({ data: null, error: new Error("Supabase not configured") }) }), error: new Error("Supabase not configured") }), update: () => ({ eq: () => ({ error: new Error("Supabase not configured") }) }), delete: () => ({ eq: () => ({ error: new Error("Supabase not configured") }) }) }),
    auth: { getSession: () => ({ data: { session: null } }), signInWithPassword: () => ({ data: null, error: new Error("Not configured") }), signOut: () => {}, onAuthStateChange: () => {}, updateUser: () => ({ error: new Error("Not configured") }), setSession: () => {} },
    functions: { invoke: () => ({ data: null, error: new Error("Not configured") }) },
  };
}

export const supabase = _supabase;
