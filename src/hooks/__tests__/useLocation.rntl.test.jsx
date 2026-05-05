/**
 * useLocation hook tests
 *
 * Critical path: this hook gates remote clock-in. If permissions handling
 * misfires, employees physically cannot punch in from outside the store.
 *
 * Mocks the three side-effects the hook touches:
 *   - expo-location  (permissions + GPS)
 *   - Alert          (denial UX)
 *   - Linking        (open Settings)
 *
 * NOTE: We do NOT `jest.requireActual('react-native')` — that pulls in
 * the native bridge (DevMenu, Clipboard, etc.) and explodes under jest-expo.
 * Instead we provide a minimal RN surface stub. The hook only references
 * Alert, Linking, and Platform — that's all we need.
 */

import { renderHook, act, waitFor } from '@testing-library/react-native';

// ── Mocks ─────────────────────────────────────────────────

const mockRequestPermissions = jest.fn();
const mockGetCurrentPosition = jest.fn();

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: (...args) =>
    mockRequestPermissions(...args),
  getCurrentPositionAsync: (...args) => mockGetCurrentPosition(...args),
  Accuracy: { High: 4 },
}));

const mockAlert = jest.fn();
const mockOpenSettings = jest.fn();

// IMPORTANT: jest-expo's preset already supplies a working react-native mock
// for rendering. We only override the three named exports the hook uses.
// Using doMock + manual partial would risk breaking RNTL itself, so we
// patch through the global Alert/Linking after import instead.
import { Alert, Linking } from 'react-native';
Alert.alert = (...args) => mockAlert(...args);
Linking.openSettings = (...args) => mockOpenSettings(...args);

import { useLocation } from '../useLocation';

// ── Lifecycle ─────────────────────────────────────────────

beforeEach(() => {
  mockRequestPermissions.mockReset();
  mockGetCurrentPosition.mockReset();
  mockAlert.mockReset();
  mockOpenSettings.mockReset();
});

// ── Tests ─────────────────────────────────────────────────

describe('useLocation', () => {
  describe('initial permission probe (mount effect)', () => {
    test('sets permissionGranted=true when permissions are granted on mount', async () => {
      mockRequestPermissions.mockResolvedValue({ status: 'granted' });

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(result.current.permissionGranted).toBe(true);
      });
      expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
    });

    test('leaves permissionGranted=false when permissions are denied on mount', async () => {
      mockRequestPermissions.mockResolvedValue({ status: 'denied' });

      const { result } = renderHook(() => useLocation());

      await waitFor(() => {
        expect(mockRequestPermissions).toHaveBeenCalledTimes(1);
      });
      expect(result.current.permissionGranted).toBe(false);
    });
  });

  describe('getLocation — granted', () => {
    test('returns lat/lng when GPS read succeeds', async () => {
      mockRequestPermissions.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPosition.mockResolvedValue({
        coords: { latitude: 43.65, longitude: -79.38 },
      });

      const { result } = renderHook(() => useLocation());
      await waitFor(() => expect(result.current.permissionGranted).toBe(true));

      let coords;
      await act(async () => {
        coords = await result.current.getLocation();
      });

      expect(coords).toEqual({ latitude: 43.65, longitude: -79.38 });
      expect(mockGetCurrentPosition).toHaveBeenCalledTimes(1);
      expect(mockAlert).not.toHaveBeenCalled();
    });

    test('returns null and alerts when GPS read throws', async () => {
      mockRequestPermissions.mockResolvedValue({ status: 'granted' });
      mockGetCurrentPosition.mockRejectedValue(new Error('gps offline'));

      const { result } = renderHook(() => useLocation());
      await waitFor(() => expect(result.current.permissionGranted).toBe(true));

      let coords;
      await act(async () => {
        coords = await result.current.getLocation();
      });

      expect(coords).toBeNull();
      expect(mockAlert).toHaveBeenCalledWith(
        'Location Error',
        expect.stringMatching(/unable to get/i)
      );
    });
  });

  describe('getLocation — re-prompts on first call when not granted at mount', () => {
    test('upgrades to granted on second prompt and returns coords', async () => {
      // First prompt (mount): denied. Second prompt (getLocation): granted.
      mockRequestPermissions
        .mockResolvedValueOnce({ status: 'denied' })
        .mockResolvedValueOnce({ status: 'granted' });
      mockGetCurrentPosition.mockResolvedValue({
        coords: { latitude: 1, longitude: 2 },
      });

      const { result } = renderHook(() => useLocation());
      await waitFor(() =>
        expect(mockRequestPermissions).toHaveBeenCalledTimes(1)
      );

      let coords;
      await act(async () => {
        coords = await result.current.getLocation();
      });

      expect(mockRequestPermissions).toHaveBeenCalledTimes(2);
      expect(coords).toEqual({ latitude: 1, longitude: 2 });
      expect(mockAlert).not.toHaveBeenCalled();
    });

    test('still denied on second prompt → alert + return null', async () => {
      mockRequestPermissions.mockResolvedValue({ status: 'denied' });

      const { result } = renderHook(() => useLocation());
      await waitFor(() =>
        expect(mockRequestPermissions).toHaveBeenCalledTimes(1)
      );

      let coords;
      await act(async () => {
        coords = await result.current.getLocation();
      });

      expect(coords).toBeNull();
      expect(mockGetCurrentPosition).not.toHaveBeenCalled();
      expect(mockAlert).toHaveBeenCalledWith(
        'Location Required',
        expect.stringMatching(/gps location is required/i),
        expect.any(Array)
      );
    });

    test('alert "Open Settings" button calls Linking.openSettings', async () => {
      mockRequestPermissions.mockResolvedValue({ status: 'denied' });

      const { result } = renderHook(() => useLocation());
      await waitFor(() =>
        expect(mockRequestPermissions).toHaveBeenCalledTimes(1)
      );

      await act(async () => {
        await result.current.getLocation();
      });

      const buttons = mockAlert.mock.calls[0][2];
      const settingsBtn = buttons.find((b) => b.text === 'Open Settings');
      expect(settingsBtn).toBeDefined();

      settingsBtn.onPress();
      expect(mockOpenSettings).toHaveBeenCalledTimes(1);
    });
  });
});
