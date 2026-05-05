/**
 * ErrorBoundary tests
 *
 * The crash net for the entire app. If a screen tree throws during render,
 * this component is what stands between the user and a hard white-screen.
 * Worth a few tests so a refactor doesn't quietly disable the safety net.
 *
 * RNTL test (.rntl.test.jsx) — needs real React rendering to trigger
 * componentDidCatch / getDerivedStateFromError.
 */

import React from 'react';
import { Text } from 'react-native';
import { render, screen, fireEvent } from '@testing-library/react-native';
import ErrorBoundary from '../ErrorBoundary';

// A child that throws on demand. Toggle by re-rendering with shouldThrow=true.
function Bomb({ shouldThrow, message = 'kaboom' }) {
  if (shouldThrow) throw new Error(message);
  return <Text>safe child</Text>;
}

let consoleErrSpy;
beforeEach(() => {
  // ErrorBoundary calls console.error in componentDidCatch — and React
  // itself logs the error too. Silence both so the test output stays clean.
  consoleErrSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterEach(() => {
  consoleErrSpy.mockRestore();
});

describe('ErrorBoundary', () => {
  test('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow={false} />
      </ErrorBoundary>
    );
    expect(screen.getByText('safe child')).toBeTruthy();
  });

  test('renders fallback UI with the thrown error message', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow message="manifest blew up" />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('manifest blew up')).toBeTruthy();
    expect(screen.getByText('TRY AGAIN')).toBeTruthy();
  });

  test('falls back to generic message when error has no message', () => {
    function ThrowEmpty() {
      // eslint-disable-next-line no-throw-literal
      throw new Error();
    }
    render(
      <ErrorBoundary>
        <ThrowEmpty />
      </ErrorBoundary>
    );
    expect(screen.getByText(/An unexpected error occurred/i)).toBeTruthy();
  });

  test('logs caught errors to console.error', () => {
    render(
      <ErrorBoundary>
        <Bomb shouldThrow message="logged this" />
      </ErrorBoundary>
    );
    expect(consoleErrSpy).toHaveBeenCalledWith(
      'ErrorBoundary caught:',
      expect.any(Error),
      expect.any(String)
    );
  });

  test('TRY AGAIN button resets the error state and re-renders children', () => {
    // Use a wrapper whose state we can flip externally so re-render after
    // reset shows a non-throwing tree.
    function Wrapper() {
      const [crash, setCrash] = React.useState(true);
      return (
        <>
          <ErrorBoundary>
            <Bomb shouldThrow={crash} />
          </ErrorBoundary>
          <Text onPress={() => setCrash(false)} testID="defuse">
            defuse
          </Text>
        </>
      );
    }

    render(<Wrapper />);

    // Initially the boundary is showing the fallback
    expect(screen.getByText('Something went wrong')).toBeTruthy();

    // Defuse the bomb, then tap TRY AGAIN to reset the boundary.
    fireEvent.press(screen.getByTestId('defuse'));
    fireEvent.press(screen.getByText('TRY AGAIN'));

    expect(screen.queryByText('Something went wrong')).toBeNull();
    expect(screen.getByText('safe child')).toBeTruthy();
  });
});
