/**
 * FormInput tests
 *
 * FormInput is mostly a styled wrapper around <TextInput>, but it has
 * a few real branches worth pinning:
 *  - label prop (rendered when truthy, omitted when null/undefined)
 *  - editable=false → disables input + dims opacity
 *  - multiline → switches to a tall input with top-aligned text
 *  - secureTextEntry / keyboardType / placeholder forwarded correctly
 *  - onChangeText fires with the new value
 */

import React from 'react';
import { TextInput } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import FormInput from '../FormInput';

describe('FormInput — label rendering', () => {
  test('renders the label when provided', () => {
    render(<FormInput label="Email" value="" onChangeText={() => {}} />);
    expect(screen.getByText('Email')).toBeTruthy();
  });

  test('omits the label node when not provided', () => {
    render(<FormInput value="" onChangeText={() => {}} />);
    // Nothing else renders text, so any text query should be empty
    expect(screen.queryByText(/.+/)).toBeNull();
  });
});

describe('FormInput — value + onChangeText', () => {
  test('forwards value to the underlying TextInput', () => {
    const { UNSAFE_getByType } = render(
      <FormInput value="hello" onChangeText={() => {}} />
    );
    const input = UNSAFE_getByType(TextInput);
    expect(input.props.value).toBe('hello');
  });

  test('fires onChangeText with the new text', () => {
    const onChangeText = jest.fn();
    const { UNSAFE_getByType } = render(
      <FormInput value="" onChangeText={onChangeText} />
    );
    fireEvent.changeText(UNSAFE_getByType(TextInput), 'typed');
    expect(onChangeText).toHaveBeenCalledWith('typed');
  });
});

describe('FormInput — placeholder + keyboardType + secureTextEntry', () => {
  test('forwards placeholder to TextInput', () => {
    const { UNSAFE_getByType } = render(
      <FormInput
        value=""
        placeholder="you@example.com"
        onChangeText={() => {}}
      />
    );
    expect(UNSAFE_getByType(TextInput).props.placeholder).toBe(
      'you@example.com'
    );
  });

  test('forwards keyboardType (e.g. "email-address")', () => {
    const { UNSAFE_getByType } = render(
      <FormInput
        value=""
        keyboardType="email-address"
        onChangeText={() => {}}
      />
    );
    expect(UNSAFE_getByType(TextInput).props.keyboardType).toBe(
      'email-address'
    );
  });

  test('forwards secureTextEntry', () => {
    const { UNSAFE_getByType } = render(
      <FormInput value="" secureTextEntry onChangeText={() => {}} />
    );
    expect(UNSAFE_getByType(TextInput).props.secureTextEntry).toBe(true);
  });
});

describe('FormInput — editable=false', () => {
  test('marks the underlying TextInput as not editable', () => {
    const { UNSAFE_getByType } = render(
      <FormInput value="readonly" editable={false} onChangeText={() => {}} />
    );
    expect(UNSAFE_getByType(TextInput).props.editable).toBe(false);
  });
});

describe('FormInput — multiline', () => {
  test('forwards multiline=true to TextInput', () => {
    const { UNSAFE_getByType } = render(
      <FormInput value="" multiline onChangeText={() => {}} />
    );
    expect(UNSAFE_getByType(TextInput).props.multiline).toBe(true);
  });
});
