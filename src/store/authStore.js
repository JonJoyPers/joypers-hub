import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import {
  findUserByCredentials,
  findUserByPin,
  updateUserData,
} from "../data/mockUsers";
import { unregisterPushToken } from "../services/notifications";

/**
 * authStore — manages the authenticated user session
 *
 * Supabase mode: email/password via supabase.auth, PIN via edge function
 * Mock fallback: original mock data when Supabase is not configured
 */
export const useAuthStore = create((set, get) => ({
  user: null,
  loginMode: null,
  loginError: null,
  loading: false,
  mustChangePassword: false,

  /**
   * Initialize auth — call once on app mount.
   * Restores session from AsyncStorage and listens for auth changes.
   */
  initialize: async () => {
    if (!isSupabaseConfigured()) return;

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        const profile = await get()._fetchProfile(session.user.id);
        if (profile) {
          const mustChange = session.user.user_metadata?.must_change_password === true;
          set({ user: profile, loginMode: "mobile", mustChangePassword: mustChange });
        }
      }

      supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_OUT") {
          set({ user: null, loginMode: null });
        } else if (session && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED")) {
          const profile = await get()._fetchProfile(session.user.id);
          if (profile) {
            set({ user: profile, loginMode: get().loginMode || "mobile" });
          }
        }
      });
    } catch (e) {
      console.warn("Auth initialize failed:", e);
    }
  },

  /**
   * Login with email/password (mobile login).
   * Falls back to mock data if Supabase is not configured.
   */
  loginWithCredentials: async (name, password) => {
    set({ loginError: null, loading: true });

    if (!isSupabaseConfigured()) {
      const user = findUserByCredentials(name, password);
      set({ loading: false });
      if (user) {
        set({ user, loginMode: "mobile" });
        return true;
      }
      set({ loginError: "Invalid name or password. Please try again." });
      return false;
    }

    // Supabase: try email/password auth
    try {
      // First look up email from the name (employees table)
      const { data: emp, error: empError } = await supabase
        .from("employees")
        .select("email")
        .ilike("name", name)
        .eq("is_active", true)
        .single();

      if (empError) {
        console.warn("Employee lookup failed:", empError.message);
      }

      const email = emp?.email || name; // Allow direct email login too

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      set({ loading: false });

      if (error) {
        set({ loginError: error.message });
        return false;
      }

      const profile = await get()._fetchProfile(data.user.id);
      if (profile) {
        const mustChange = data.user.user_metadata?.must_change_password === true;
        set({ user: profile, loginMode: "mobile", mustChangePassword: mustChange });
        return true;
      }

      set({ loginError: "Account not linked to an employee profile." });
      return false;
    } catch (e) {
      console.warn("Login error:", e);
      set({ loading: false, loginError: e.message || "Login failed. Check your connection." });
      return false;
    }
  },

  /**
   * Login with PIN (kiosk mode).
   * Falls back to mock data if Supabase is not configured.
   */
  loginWithPin: async (pin) => {
    set({ loginError: null, loading: true });

    if (!isSupabaseConfigured()) {
      const user = findUserByPin(pin);
      set({ loading: false });
      if (user) {
        set({ user, loginMode: "kiosk" });
        return user;
      }
      set({ loginError: "PIN not recognized." });
      return null;
    }

    // Call edge function for PIN login
    const { data, error } = await supabase.functions.invoke("pin-login", {
      body: { pin },
    });

    set({ loading: false });

    if (error || !data?.user) {
      set({ loginError: "PIN not recognized." });
      return null;
    }

    // Set the session from the edge function response
    if (data.access_token) {
      await supabase.auth.setSession({
        access_token: data.access_token,
        refresh_token: data.refresh_token,
      });
    }

    set({ user: data.user, loginMode: "kiosk" });
    return data.user;
  },

  /**
   * Change password and clear the must_change_password flag.
   */
  changePassword: async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
      data: { must_change_password: false },
    });
    if (error) throw error;
    set({ mustChangePassword: false });
  },

  clearLoginError: () => set({ loginError: null }),

  /**
   * Update current user's profile fields.
   */
  updateUser: async (fields) => {
    const currentUser = get().user;
    if (!currentUser) return;

    const updated = { ...currentUser, ...fields };
    set({ user: updated });

    if (!isSupabaseConfigured()) {
      updateUserData(currentUser.id, fields);
      return;
    }

    await supabase.from("employees").update(fields).eq("id", currentUser.id);
  },

  /**
   * Logout — clears session.
   */
  logout: async () => {
    await unregisterPushToken();
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    set({ user: null, loginMode: null, loginError: null, mustChangePassword: false });
  },

  /**
   * Internal: fetch employee profile from Supabase by auth user ID.
   */
  _fetchProfile: async (authUserId) => {
    const { data } = await supabase
      .from("employees")
      .select("*")
      .eq("id", authUserId)
      .single();

    if (!data) return null;

    // Map DB columns to the shape the app expects
    return {
      id: data.id,
      name: data.name,
      firstName: data.first_name || data.name.split(" ")[0],
      email: data.email,
      role: data.role,
      department: data.department,
      title: data.title,
      pin: null, // Never expose PIN to client
      avatar: data.avatar_url,
      hireDate: data.hire_date,
      birthday: data.birthday,
      tags: data.worker_type === "remote" ? ["Remote"] : [],
    };
  },
}));
