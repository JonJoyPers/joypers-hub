# Testing — Architecture & Philosophy

> **TL;DR.** Three layers, one rule: each layer tests what the layer below
> can't. Don't write tests that duplicate coverage from a tier below — and
> don't pretend a tier above will catch what the current tier missed.

```
              ┌────────────────────────────────────┐
   slow,      │       Maestro E2E (.maestro/)      │   real device,
   high       │   real navigation + Supabase + OS  │   real failure
   value      └────────────────────────────────────┘
              ┌────────────────────────────────────┐
              │   RNTL components (jest-expo)      │
              │   render output + prop wiring      │
              └────────────────────────────────────┘
   fast,      ┌────────────────────────────────────┐
   high       │     Jest unit (jest-expo)          │   pure logic,
   density    │     stores · services · hooks      │   deterministic
              └────────────────────────────────────┘
```

Run the bottom two layers in **~1.1 seconds**. Pre-push hook makes that
non-negotiable. Maestro is opt-in and runs against a booted simulator.

---

## What goes where

| Code under test                              | Layer                | Why                                                                 |
| -------------------------------------------- | -------------------- | ------------------------------------------------------------------- |
| Pure functions (date math, formatters)       | **Jest unit**        | Deterministic. Fast. No mocks needed.                               |
| Zustand stores (`src/store/*Store.js`)       | **Jest unit**        | State machines — they survive UI rewrites. Where 90% of bugs live.  |
| Services (`src/services/*.js`)               | **Jest unit**        | API clients, queues, defensive wrappers. Branchy code.              |
| Hooks (`src/hooks/*.js`)                     | **Jest + RNTL**      | Renderer-coupled. RNTL gives clean render/unmount semantics.        |
| UI primitives (`src/components/*.jsx`)       | **Jest + RNTL**      | Stable design-system layer. Render + prop branches.                 |
| Screen render (no interaction)               | **Maestro**          | Mocking nav + 3 stores + safe-area + supabase costs more than value |
| Multi-step user journeys                     | **Maestro**          | Real navigation, real Supabase, real native APIs. The whole point.  |

### What we deliberately do NOT test

- **Screens with Jest.** A screen wires together a navigator, 1–3 stores,
  hooks, services, and child components. Mocking all of that produces a
  test of the mocks, not the screen. Use Maestro for screens.
- **Exact pixel values, fonts, colors.** That's just re-typing the
  StyleSheet. We test that variants/sizes don't crash, not their pixel math.
- **Implementation details of stores.** Tests assert on observable state
  transitions, never on internal helpers.

---

## Running tests

```bash
# Jest (unit + RNTL) — runs both projects in one shot
npm test

# Watch mode while developing
npm test -- --watch

# A single file
npm test -- src/store/__tests__/scheduleStore.test.js

# Coverage (HTML report → coverage/lcov-report/index.html)
npm test -- --coverage

# Maestro E2E (requires booted simulator + app installed)
npm run e2e             # all flows
npm run e2e:login       # one flow
npm run e2e:studio      # visual flow authoring
```

---

## Project layout

```
src/
├── store/__tests__/                 ← Zustand store tests (unit project)
│   ├── authStore.test.js
│   ├── scheduleStore.test.js
│   └── …
├── services/__tests__/              ← Service tests (unit project)
│   ├── supabase.test.js
│   ├── sentry.test.js
│   ├── notifications.test.js
│   └── …
├── components/__tests__/            ← Component tests (RNTL project)
│   ├── Button.rntl.test.jsx
│   ├── HtmlBody.rntl.test.jsx
│   ├── presentational.rntl.test.jsx
│   └── …
└── hooks/__tests__/                 ← Hook tests (RNTL project)
    └── useLocation.rntl.test.jsx

.maestro/                            ← E2E flows
├── README.md                        ← install + setup
├── config.yaml                      ← appId, timeout
├── flows/
│   ├── login.yaml
│   ├── login_invalid.yaml
│   ├── punch_in_out.yaml
│   └── view_schedule.yaml
└── subflows/
    └── login.yaml                   ← reusable
```

### Two Jest projects, one runner

`jest.config.js` defines two projects so RNTL component tests don't slow
down the pure-logic suite:

- **`unit`** — `*.test.js` only, jsdom environment, no RN renderer
- **`component`** — `*.rntl.test.jsx`, jest-expo preset, full RN renderer

`npm test` runs both. They share no config so a heavy RNTL setup never
leaks into a unit test.

---

## When to add a test

| You are…                                     | Write…                                     |
| -------------------------------------------- | ------------------------------------------ |
| Adding a pure function                       | A unit test in the same `__tests__/` dir   |
| Adding a Zustand action                      | A unit test asserting state before/after   |
| Fixing a bug (any layer)                     | A test that fails on the old code first    |
| Adding a UI primitive                        | An RNTL test covering each prop branch     |
| Adding a multi-step user flow                | A Maestro flow                             |
| Refactoring without behavior change          | Don't add tests — existing ones must pass  |

### The bug-fix test pattern

For every fix, write the regression test **first**, against the broken
code, and confirm it fails. Then apply the fix, and confirm it passes.
This is how `fix(supabase): stub now survives arbitrary deep query chains`
and `fix(schedule-store): prevent duplicate shift IDs on rapid addShift`
landed — both tests fail without the fix, both pass with it.

---

## CI / pre-push discipline

A pre-push hook (`.githooks/pre-push`) runs `npm test` before every push.
It's auto-installed by `npm install` via the `prepare` script wiring
`core.hooksPath` to `.githooks`.

To bypass in an emergency (don't make this a habit):

```bash
git push --no-verify
```

Maestro flows are **not** run by the hook — they need a simulator.
Run them manually before any release-bound push.

---

## Adding a new test — quick reference

### Unit test (store / service / pure function)

```js
// src/services/__tests__/myService.test.js
import { myFn } from "../myService";

describe("myService.myFn", () => {
  test("happy path", () => {
    expect(myFn(1, 2)).toBe(3);
  });

  test("edge case", () => {
    expect(() => myFn(null)).not.toThrow();
  });
});
```

### RNTL component test

```jsx
// src/components/__tests__/MyThing.rntl.test.jsx
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react-native";
import MyThing from "../MyThing";

describe("MyThing", () => {
  test("renders the label", () => {
    render(<MyThing label="hello" />);
    expect(screen.getByText("hello")).toBeTruthy();
  });
});
```

### Maestro flow

```yaml
# .maestro/flows/my_flow.yaml
appId: com.joypersshoes.hub
tags:
  - smoke
---
- launchApp:
    clearState: true
- runFlow:
    file: ../subflows/login.yaml
- tapOn: "Work"
- assertVisible: "WORK"
```

---

## Current coverage snapshot

As of last update:

- **20 Jest test suites · 239 tests · ~1.1s**
- **4 Maestro flows · login (happy + sad), punch in/out, view schedule**
- **2 production bugs** caught + fixed during the test-pyramid build
  (`fix(supabase)`, `fix(schedule-store)`)

Run `npm test -- --listTests | wc -l` to see the live count.
