import * as Sentry from "@sentry/react-native";

export function initSentry() {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.log("Sentry DSN not configured — error monitoring disabled");
    return;
  }

  Sentry.init({
    dsn,
    tracesSampleRate: 0.2,
    environment: __DEV__ ? "development" : "production",
    enabled: !__DEV__,
  });
}

export { Sentry };
