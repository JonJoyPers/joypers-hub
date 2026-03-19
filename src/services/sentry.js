// Sentry error tracking — defensive wrapper that never crashes the app.
// If @sentry/react-native is missing or DSN is unset, everything falls back to no-ops.

const NOOP_SENTRY = {
  captureException: () => {},
  captureMessage: () => {},
  captureEvent: () => {},
  setUser: () => {},
  setTag: () => {},
  setExtra: () => {},
  setContext: () => {},
  addBreadcrumb: () => {},
  withScope: (cb) => {
    try { cb({ setTag() {}, setExtra() {}, setLevel() {} }); } catch (_) {}
  },
  wrap: (fn) => fn,
};

let _sentry = NOOP_SENTRY;
let _initialized = false;

/**
 * Initialize Sentry. Safe to call at module top-level inside a try/catch.
 * Returns true if Sentry was successfully initialized, false otherwise.
 */
export function initSentry() {
  if (_initialized) return true;

  try {
    const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

    if (!dsn) {
      console.log("Sentry: no DSN configured, running in no-op mode");
      return false;
    }

    // Dynamic require so the app doesn't crash if the package isn't installed
    const SentryModule = require("@sentry/react-native");

    SentryModule.init({
      dsn,
      // Adjust sample rates for production — capture 20% of transactions
      tracesSampleRate: __DEV__ ? 1.0 : 0.2,
      // Don't send events in dev unless you explicitly want to debug Sentry
      enabled: !__DEV__,
      // Attach stack traces to all messages
      attachStacktrace: true,
      // Prevent Sentry from crashing the app on init errors
      enableNative: true,
      enableNativeCrashHandling: true,
    });

    _sentry = SentryModule;
    _initialized = true;
    console.log("Sentry: initialized successfully");
    return true;
  } catch (e) {
    console.warn("Sentry: initialization failed, falling back to no-op:", e?.message || e);
    _sentry = NOOP_SENTRY;
    _initialized = false;
    return false;
  }
}

/**
 * Get the current Sentry instance (real or no-op).
 * Always safe to call — never throws.
 */
export const Sentry = new Proxy(NOOP_SENTRY, {
  get(_target, prop) {
    try {
      if (prop in _sentry && typeof _sentry[prop] === "function") {
        return (...args) => {
          try {
            return _sentry[prop](...args);
          } catch (e) {
            console.warn(`Sentry.${String(prop)} failed:`, e?.message || e);
          }
        };
      }
      return _sentry[prop];
    } catch (_) {
      return NOOP_SENTRY[prop];
    }
  },
});
