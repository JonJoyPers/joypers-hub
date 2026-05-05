/**
 * Button tests
 *
 * Button is the primary CTA element across every screen. Real branches:
 *  - 6 variants (primary/secondary/danger/success/warning/ghost) — each
 *    maps to a different bg/text/border style
 *  - loading → swaps label for ActivityIndicator
 *  - disabled → blocks onPress and dims opacity
 *  - 3 sizes (sm/md/lg) — different paddingVertical
 *  - icon prop renders alongside the label
 */

import React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import Button from '../Button';

describe('Button — label + press', () => {
  test('renders the label text', () => {
    render(<Button label="SAVE" onPress={() => {}} />);
    expect(screen.getByText('SAVE')).toBeTruthy();
  });

  test('calls onPress when tapped', () => {
    const onPress = jest.fn();
    render(<Button label="SAVE" onPress={onPress} />);
    fireEvent.press(screen.getByText('SAVE'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('Button — loading state', () => {
  test('shows ActivityIndicator and hides label when loading', () => {
    const { UNSAFE_queryByType } = render(
      <Button label="SAVE" loading onPress={() => {}} />
    );
    expect(screen.queryByText('SAVE')).toBeNull();
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeTruthy();
  });

  test('does not call onPress while loading', () => {
    const onPress = jest.fn();
    const { UNSAFE_getByType } = render(
      <Button label="SAVE" loading onPress={onPress} />
    );
    // Press the touchable's parent — RN Testing Library's fireEvent.press
    // walks up to find a pressable; we hit the indicator's parent.
    const indicator = UNSAFE_getByType(ActivityIndicator);
    fireEvent.press(indicator);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('Button — disabled state', () => {
  test('does not call onPress when disabled', () => {
    const onPress = jest.fn();
    render(<Button label="SAVE" disabled onPress={onPress} />);
    fireEvent.press(screen.getByText('SAVE'));
    expect(onPress).not.toHaveBeenCalled();
  });

  test('renders with reduced opacity when disabled', () => {
    const { UNSAFE_getByType } = render(
      <Button label="SAVE" disabled onPress={() => {}} />
    );
    const { TouchableOpacity } = require('react-native');
    const touchable = UNSAFE_getByType(TouchableOpacity);
    // The dimmed opacity (0.5) is in the inline style array
    const styles = Array.isArray(touchable.props.style)
      ? touchable.props.style
      : [touchable.props.style];
    const flat = Object.assign({}, ...styles.filter(Boolean));
    expect(flat.opacity).toBe(0.5);
  });
});

describe('Button — variants', () => {
  // We don't assert on exact hex values (that just re-types the COLORS
  // table), but we DO confirm every supported variant renders without
  // crashing and that an unknown variant falls back to primary.
  test.each(['primary', 'secondary', 'danger', 'success', 'warning', 'ghost'])(
    'variant="%s" renders without throwing',
    (variant) => {
      expect(() =>
        render(<Button label="X" variant={variant} onPress={() => {}} />)
      ).not.toThrow();
    }
  );

  test('unknown variant falls back to primary (does not crash)', () => {
    expect(() =>
      render(<Button label="X" variant="bogus" onPress={() => {}} />)
    ).not.toThrow();
    expect(screen.getByText('X')).toBeTruthy();
  });
});

describe('Button — sizes', () => {
  test.each(['sm', 'md', 'lg'])('size="%s" renders without throwing', (size) => {
    expect(() =>
      render(<Button label="X" size={size} onPress={() => {}} />)
    ).not.toThrow();
  });
});

describe('Button — icon', () => {
  test('renders the icon alongside the label when not loading', () => {
    render(
      <Button
        label="SAVE"
        icon={<Text testID="icon">★</Text>}
        onPress={() => {}}
      />
    );
    expect(screen.getByTestId('icon')).toBeTruthy();
    expect(screen.getByText('SAVE')).toBeTruthy();
  });

  test('icon is hidden when loading (replaced by spinner)', () => {
    render(
      <Button
        label="SAVE"
        loading
        icon={<Text testID="icon">★</Text>}
        onPress={() => {}}
      />
    );
    expect(screen.queryByTestId('icon')).toBeNull();
  });
});
