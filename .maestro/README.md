# Maestro E2E Flows — Joy-Per's Hub

End-to-end smoke tests that run the **real app** on a real simulator (or device).
Each flow is a small YAML file describing a user journey — Maestro launches
the app, drives it like a human, and asserts on what's visible on screen.

These complement (not replace) the Jest unit + RNTL component suites:

| Layer                      | Tool         | What it catches                            |
| -------------------------- | ------------ | ------------------------------------------ |
| Pure logic / stores        | Jest (unit)  | Logic bugs, state machine bugs             |
| Components in isolation    | Jest + RNTL  | Render bugs, prop wiring                   |
| **End-to-end user flows**  | **Maestro**  | **Navigation, real Supabase, native APIs** |

If a Maestro flow goes red on CI, something a real user would notice has broken.

---

## One-time setup

### 1. Install Maestro

```sh
curl -Ls "https://get.maestro.mobile.dev" | bash
```

This drops the `maestro` binary into `~/.maestro/bin/`. Add that to your
PATH (the installer prints the line to add). Confirm with:

```sh
maestro --version
```

### 2. Boot a simulator

iOS:
```sh
xcrun simctl list devices | grep Booted   # check
open -a Simulator                          # boot if needed
```

Android:
```sh
emulator -list-avds
emulator -avd Pixel_7_API_34 &
```

### 3. Build & install the dev app

The flows assume the app is **already installed** on the booted simulator.
Build once with:

```sh
# iOS
npx expo run:ios

# Android
npx expo run:android
```

Subsequent runs only need the app to be on the simulator — Maestro will
launch it for you.

---

## Running flows

```sh
# Run a single flow
maestro test .maestro/flows/login.yaml

# Run all flows
maestro test .maestro/flows/

# Live-edit a flow with the visual studio (very nice for authoring)
maestro studio
```

---

## Flow inventory

| File                            | What it covers                                                  |
| ------------------------------- | --------------------------------------------------------------- |
| `flows/login.yaml`              | Login with valid credentials → reaches Bulletin Board           |
| `flows/login_invalid.yaml`      | Login with bad credentials → error alert appears                |
| `flows/punch_in_out.yaml`       | Login → Work tab → Time Clock → CLOCK IN → CLOCK OUT            |
| `flows/view_schedule.yaml`      | Login → Work tab → Schedule sub-tab → schedule view renders     |

Each flow starts from a clean app launch (`launchApp:` resets state) so
they can be run in any order without coupling.

---

## Test credentials

Flows reference env vars `MAESTRO_TEST_NAME` and `MAESTRO_TEST_PASSWORD`
so credentials never live in source. Set them locally:

```sh
export MAESTRO_TEST_NAME="Test Employee"
export MAESTRO_TEST_PASSWORD="your-test-password"
```

Or pass per-run:

```sh
maestro test -e MAESTRO_TEST_NAME="..." -e MAESTRO_TEST_PASSWORD="..." .maestro/flows/login.yaml
```

For CI, store them as repository secrets and inject into the workflow.

---

## When to add a new flow

Add a Maestro flow when:
- You ship a new user-visible journey (onboarding, password reset, …)
- A bug slips through that pure unit tests couldn't have caught (real
  navigation, Supabase round-trip, native permission prompt)
- You're nervous about a release

Don't add a flow for every screen — that's what RNTL is for. Maestro
flows are expensive to run (~30s each) and brittle to UI redesigns.
Reserve them for high-stakes, multi-step journeys.
