/**
 * messageStore tests (mock mode)
 *
 * Realtime + Supabase paths are out of scope here; setup.js mocks
 * Supabase as unconfigured so the store falls back to seeded mock
 * data. These tests pin the selector + mock-mode mutation behaviour
 * that the UI relies on.
 */

import { useMessageStore } from '../messageStore';

// Snapshot the seeded state so each test starts from the same baseline
const initialSnapshot = JSON.parse(
  JSON.stringify({
    conversations: useMessageStore.getState().conversations,
    messages: useMessageStore.getState().messages,
    participantProfiles: {},
    loading: false,
    _subscription: null,
  })
);

beforeEach(() => {
  useMessageStore.setState(JSON.parse(JSON.stringify(initialSnapshot)));
});

describe('messageStore (mock mode)', () => {
  describe('initial state', () => {
    test('loads seeded conversations and messages', () => {
      const s = useMessageStore.getState();
      expect(s.conversations.length).toBeGreaterThan(0);
      expect(s.messages.length).toBeGreaterThan(0);
      expect(s.loading).toBe(false);
    });
  });

  describe('getConversationsForUser', () => {
    test('returns only conversations the user participates in', () => {
      const result = useMessageStore.getState().getConversationsForUser('u002');
      expect(result.length).toBeGreaterThan(0);
      result.forEach((c) => expect(c.participants).toContain('u002'));
    });

    test('returns empty array for non-participant', () => {
      const result = useMessageStore.getState().getConversationsForUser('ghost');
      expect(result).toEqual([]);
    });

    test('sorts by lastMessage.timestamp descending', () => {
      const result = useMessageStore.getState().getConversationsForUser('u002');
      for (let i = 1; i < result.length; i++) {
        const prev = new Date(result[i - 1].lastMessage.timestamp).getTime();
        const curr = new Date(result[i].lastMessage.timestamp).getTime();
        expect(prev).toBeGreaterThanOrEqual(curr);
      }
    });
  });

  describe('getMessages', () => {
    test('filters by conversationId', () => {
      const msgs = useMessageStore.getState().getMessages('conv001');
      expect(msgs.length).toBeGreaterThan(0);
      msgs.forEach((m) => expect(m.conversationId).toBe('conv001'));
    });

    test('returns empty array for unknown conversation', () => {
      expect(useMessageStore.getState().getMessages('does_not_exist')).toEqual([]);
    });

    test('sorts ascending by timestamp (oldest first — chat order)', () => {
      const msgs = useMessageStore.getState().getMessages('conv001');
      for (let i = 1; i < msgs.length; i++) {
        const prev = new Date(msgs[i - 1].timestamp).getTime();
        const curr = new Date(msgs[i].timestamp).getTime();
        expect(prev).toBeLessThanOrEqual(curr);
      }
    });
  });

  describe('getTotalUnread', () => {
    test('sums unread counts only across conversations the user participates in', () => {
      // From seed: u001 is in conv001 with unreadCount.u001 = 1 — total 1
      expect(useMessageStore.getState().getTotalUnread('u001')).toBe(1);
      // u005 is in conv002 with unreadCount.u005 = 1 — total 1
      expect(useMessageStore.getState().getTotalUnread('u005')).toBe(1);
      // u004 is in conv002 (0 unread) and conv003 (1 unread) — total 1
      expect(useMessageStore.getState().getTotalUnread('u004')).toBe(1);
    });

    test('returns 0 for user with no conversations', () => {
      expect(useMessageStore.getState().getTotalUnread('ghost')).toBe(0);
    });
  });

  describe('getOrCreateConversation', () => {
    test('returns existing conversation when both users already share one', async () => {
      const conv = await useMessageStore
        .getState()
        .getOrCreateConversation('u001', 'u002');
      expect(conv.id).toBe('conv001');
      // Order doesn't matter
      const reversed = await useMessageStore
        .getState()
        .getOrCreateConversation('u002', 'u001');
      expect(reversed.id).toBe('conv001');
    });

    test('creates a new conversation in mock mode when none exists', async () => {
      const before = useMessageStore.getState().conversations.length;
      const conv = await useMessageStore
        .getState()
        .getOrCreateConversation('u010', 'u011');

      expect(conv).toBeDefined();
      expect(conv.id).toMatch(/^conv_/);
      expect(conv.participants).toEqual(['u010', 'u011']);
      expect(conv.unreadCount).toEqual({ u010: 0, u011: 0 });
      expect(useMessageStore.getState().conversations.length).toBe(before + 1);
    });
  });

  describe('sendMessage (mock mode)', () => {
    test('appends message and updates lastMessage on the conversation', async () => {
      const before = useMessageStore.getState().messages.length;
      await useMessageStore.getState().sendMessage('conv001', 'u001', 'Test ping');

      const state = useMessageStore.getState();
      expect(state.messages.length).toBe(before + 1);

      const last = state.messages[state.messages.length - 1];
      expect(last.text).toBe('Test ping');
      expect(last.senderId).toBe('u001');
      expect(last.conversationId).toBe('conv001');
      expect(last.read).toBe(false);

      const conv = state.conversations.find((c) => c.id === 'conv001');
      expect(conv.lastMessage.text).toBe('Test ping');
      expect(conv.lastMessage.senderId).toBe('u001');
    });

    test('increments unreadCount for the OTHER participant only', async () => {
      const convBefore = useMessageStore
        .getState()
        .conversations.find((c) => c.id === 'conv001');
      const u002UnreadBefore = convBefore.unreadCount.u002 || 0;
      const u001UnreadBefore = convBefore.unreadCount.u001 || 0;

      await useMessageStore.getState().sendMessage('conv001', 'u001', 'Hi');

      const convAfter = useMessageStore
        .getState()
        .conversations.find((c) => c.id === 'conv001');
      expect(convAfter.unreadCount.u002).toBe(u002UnreadBefore + 1);
      // Sender's own unread count is unchanged
      expect(convAfter.unreadCount.u001).toBe(u001UnreadBefore);
    });
  });

  describe('markConversationRead', () => {
    test("zeros the user's unread count for that conversation", async () => {
      // u001 has 1 unread in conv001 from the seed
      await useMessageStore.getState().markConversationRead('conv001', 'u001');

      const conv = useMessageStore
        .getState()
        .conversations.find((c) => c.id === 'conv001');
      expect(conv.unreadCount.u001).toBe(0);
    });

    test('marks incoming messages as read but leaves own messages untouched', async () => {
      // In conv001 seed: msg001 sent by u001 (read=true), msg002 sent by u002 (read=false)
      await useMessageStore.getState().markConversationRead('conv001', 'u001');

      const msgs = useMessageStore.getState().messages;
      const msg001 = msgs.find((m) => m.id === 'msg001'); // sent by u001
      const msg002 = msgs.find((m) => m.id === 'msg002'); // sent by u002
      expect(msg001.read).toBe(true); // already true, untouched
      expect(msg002.read).toBe(true); // newly marked
    });

    test('does not affect unread counts in other conversations', async () => {
      const otherBefore = useMessageStore
        .getState()
        .conversations.find((c) => c.id === 'conv002');
      await useMessageStore.getState().markConversationRead('conv001', 'u001');
      const otherAfter = useMessageStore
        .getState()
        .conversations.find((c) => c.id === 'conv002');
      expect(otherAfter.unreadCount).toEqual(otherBefore.unreadCount);
    });
  });
});
