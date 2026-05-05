/**
 * Presentational components — smoke tests
 *
 * Card, EmptyState, FAB, ScreenHeader are pure presentational wrappers
 * with little or no conditional logic. Giving each its own file would be
 * dishonest about its complexity — instead we batch their smoke tests
 * here and assert the few behaviours that *would* matter if they broke:
 *
 *  - Card renders children and accepts an accentColor without throwing.
 *  - EmptyState renders title (always) + subtitle (when provided)
 *    + an optional icon node.
 *  - FAB renders, fires onPress, and accepts a custom icon override.
 *  - ScreenHeader renders title (always), eyebrow (uppercased when
 *    provided), subtitle (when provided), and a right slot.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import Card from '../Card';
import EmptyState from '../EmptyState';
import FAB from '../FAB';
import ScreenHeader from '../ScreenHeader';

// SafeAreaProvider with deterministic insets so ScreenHeader's paddingTop
// math doesn't depend on simulator chrome.
const withInsets = (ui) => (
  <SafeAreaProvider
    initialMetrics={{
      frame: { x: 0, y: 0, width: 320, height: 640 },
      insets: { top: 20, left: 0, right: 0, bottom: 0 },
    }}
  >
    {ui}
  </SafeAreaProvider>
);

// ── Card ──────────────────────────────────────────────────

describe('Card', () => {
  test('renders children', () => {
    render(
      <Card>
        <Text>card content</Text>
      </Card>
    );
    expect(screen.getByText('card content')).toBeTruthy();
  });

  test('accepts accentColor without throwing', () => {
    expect(() =>
      render(
        <Card accentColor="#ff00ff">
          <Text>x</Text>
        </Card>
      )
    ).not.toThrow();
  });
});

// ── EmptyState ────────────────────────────────────────────

describe('EmptyState', () => {
  test('renders the title', () => {
    render(<EmptyState title="No messages" />);
    expect(screen.getByText('No messages')).toBeTruthy();
  });

  test('renders the subtitle when provided', () => {
    render(<EmptyState title="No messages" subtitle="Check back later" />);
    expect(screen.getByText('Check back later')).toBeTruthy();
  });

  test('omits the subtitle when not provided', () => {
    render(<EmptyState title="No messages" />);
    expect(screen.queryByText(/Check back/)).toBeNull();
  });

  test('renders the icon slot when provided', () => {
    render(
      <EmptyState icon={<Text testID="empty-icon">📭</Text>} title="empty" />
    );
    expect(screen.getByTestId('empty-icon')).toBeTruthy();
  });
});

// ── FAB ───────────────────────────────────────────────────

describe('FAB', () => {
  test('renders the default + icon (lucide Plus) and fires onPress', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(<FAB onPress={onPress} />);
    const { TouchableOpacity } = require('react-native');
    fireEvent.press(UNSAFE_getByType(TouchableOpacity));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  test('accepts a custom icon override', () => {
    render(
      <FAB onPress={() => {}} icon={<Text testID="custom-icon">★</Text>} />
    );
    expect(screen.getByTestId('custom-icon')).toBeTruthy();
  });
});

// ── ScreenHeader ──────────────────────────────────────────

describe('ScreenHeader', () => {
  test('renders the title', () => {
    render(withInsets(<ScreenHeader title="Dashboard" />));
    expect(screen.getByText('Dashboard')).toBeTruthy();
  });

  test('uppercases the eyebrow when provided', () => {
    render(withInsets(<ScreenHeader eyebrow="today" title="Dashboard" />));
    expect(screen.getByText('TODAY')).toBeTruthy();
  });

  test('renders subtitle when provided', () => {
    render(
      withInsets(
        <ScreenHeader title="Dashboard" subtitle="Welcome back, Jane" />
      )
    );
    expect(screen.getByText('Welcome back, Jane')).toBeTruthy();
  });

  test('renders the right slot when provided', () => {
    render(
      withInsets(
        <ScreenHeader
          title="Dashboard"
          right={<Text testID="right-slot">⚙</Text>}
        />
      )
    );
    expect(screen.getByTestId('right-slot')).toBeTruthy();
  });
});
