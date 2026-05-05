/**
 * Avatar tests
 *
 * Avatar has two real branches worth pinning:
 *  - URI provided  → renders an <Image> source
 *  - URI absent    → renders initials computed from the name
 *
 * Plus the initials computation itself ("First Middle Last" → "FM" once
 * sliced to 2 chars) — that logic has bitten more than one design system.
 */

import React from 'react';
import { render, screen } from '@testing-library/react-native';
import Avatar from '../Avatar';

describe('Avatar — initials path', () => {
  test('renders 2-letter initials from a two-word name', () => {
    render(<Avatar name="Jane Doe" />);
    expect(screen.getByText('JD')).toBeTruthy();
  });

  test('takes only the first two initials when name has 3+ words', () => {
    render(<Avatar name="Mary Jane Watson" />);
    expect(screen.getByText('MJ')).toBeTruthy();
  });

  test('handles a single-word name (one initial)', () => {
    render(<Avatar name="Madonna" />);
    expect(screen.getByText('M')).toBeTruthy();
  });

  test('uppercases lowercase names', () => {
    render(<Avatar name="alice cooper" />);
    expect(screen.getByText('AC')).toBeTruthy();
  });

  test('falls back to "?" when name is missing', () => {
    render(<Avatar />);
    expect(screen.getByText('?')).toBeTruthy();
  });
});

describe('Avatar — image path', () => {
  test('renders an <Image> when uri is provided (initials suppressed)', () => {
    const { UNSAFE_getByType } = render(
      <Avatar name="Jane Doe" uri="https://example.com/avatar.png" />
    );
    // No initials text — image takes over
    expect(screen.queryByText('JD')).toBeNull();
    // The Image component is mounted with the right uri
    const { Image } = require('react-native');
    const img = UNSAFE_getByType(Image);
    expect(img.props.source).toEqual({ uri: 'https://example.com/avatar.png' });
  });
});

describe('Avatar — sizing', () => {
  // The size prop maps to a SIZES table; we don't assert on numeric pixel
  // values (that's just re-typing the lookup), but we DO confirm that all
  // four supported keys render without crashing.
  test.each(['sm', 'md', 'lg', 'xl'])(
    'size="%s" renders without throwing',
    (size) => {
      expect(() =>
        render(<Avatar name="Jane Doe" size={size} />)
      ).not.toThrow();
    }
  );

  test('unknown size falls back to md (does not crash)', () => {
    expect(() =>
      render(<Avatar name="Jane Doe" size="bogus" />)
    ).not.toThrow();
    expect(screen.getByText('JD')).toBeTruthy();
  });
});
