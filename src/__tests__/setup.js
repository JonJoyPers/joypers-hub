// Mock Supabase as unconfigured so stores use mock fallback
jest.mock('../services/supabase', () => ({
  supabase: {},
  isSupabaseConfigured: () => false,
}));

// Mock notifications service
jest.mock('../services/notifications', () => ({
  registerForPushNotifications: jest.fn(),
  unregisterPushToken: jest.fn(),
  addNotificationListeners: jest.fn(() => jest.fn()),
}));

// Mock offline queue
jest.mock('../services/offlineQueue', () => ({
  enqueue: jest.fn(),
  getQueue: jest.fn().mockResolvedValue([]),
  getPendingCount: jest.fn().mockResolvedValue(0),
  processQueue: jest.fn().mockResolvedValue({ synced: 0, failed: 0, dropped: 0 }),
  startOfflineSync: jest.fn(),
  stopOfflineSync: jest.fn(),
  isOnline: jest.fn().mockResolvedValue(true),
  onSyncComplete: jest.fn(),
}));
