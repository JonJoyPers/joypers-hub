/**
 * Smoke test proving the RNTL component-test pipeline works end-to-end.
 *
 * Badge.jsx exports three pure presentational components. Perfect for
 * verifying the harness without dragging in navigation, Zustand, or async.
 *
 * If this file passes, the @testing-library/react-native + jest-expo
 * combination is wired correctly and component tests can be expanded
 * to screens, forms, and interactive flows.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { UnreadBadge, RoleBadge, TypePill } from '../Badge';

describe('UnreadBadge', () => {
  test('renders nothing when count is 0', () => {
    const { toJSON } = render(<UnreadBadge count={0} />);
    expect(toJSON()).toBeNull();
  });

  test('renders nothing when count is undefined', () => {
    const { toJSON } = render(<UnreadBadge />);
    expect(toJSON()).toBeNull();
  });

  test('renders the count when > 0', () => {
    render(<UnreadBadge count={5} />);
    expect(screen.getByText('5')).toBeTruthy();
  });

  test('clamps to "99+" when count exceeds 99', () => {
    render(<UnreadBadge count={250} />);
    expect(screen.getByText('99+')).toBeTruthy();
  });
});

describe('RoleBadge', () => {
  test('renders the role text in uppercase', () => {
    render(<RoleBadge role="manager" />);
    expect(screen.getByText('MANAGER')).toBeTruthy();
  });

  test('handles missing role without crashing', () => {
    const { toJSON } = render(<RoleBadge />);
    // Empty string becomes empty uppercase — still renders the View tree
    expect(toJSON()).not.toBeNull();
  });
});

describe('TypePill', () => {
  test('renders the label in uppercase', () => {
    render(<TypePill label="urgent" />);
    expect(screen.getByText('URGENT')).toBeTruthy();
  });

  test('renders empty when label is missing', () => {
    const { toJSON } = render(<TypePill />);
    expect(toJSON()).not.toBeNull();
  });
});
