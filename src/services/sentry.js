// Sentry removed — was crashing app on native startup.
// Re-add once the app is stable and Sentry org/project are configured.

export function initSentry() {
  // no-op
}

export const Sentry = {
  captureException: () => {},
  captureMessage: () => {},
};
