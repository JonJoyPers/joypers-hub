import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../services/supabase";

// ── Seed Data (mock fallback) ────────────────────────────
const SEED_CONVERSATIONS = [
  {
    id: "conv001",
    participants: ["u001", "u002"],
    lastMessage: {
      text: "Sounds good, I'll prep the talking points for Friday.",
      senderId: "u002",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    },
    unreadCount: { u001: 1, u002: 0 },
  },
  {
    id: "conv002",
    participants: ["u004", "u005"],
    lastMessage: {
      text: "Can you cover my shift Saturday? I'll take your Sunday.",
      senderId: "u004",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    },
    unreadCount: { u004: 0, u005: 1 },
  },
  {
    id: "conv003",
    participants: ["u002", "u004"],
    lastMessage: {
      text: "Great work on the Heritage demo yesterday. Keep it up!",
      senderId: "u002",
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    },
    unreadCount: { u002: 0, u004: 1 },
  },
];

const SEED_MESSAGES = [
  {
    id: "msg001",
    conversationId: "conv001",
    senderId: "u001",
    text: "Marcus, can we go over the Spring Campaign roll-out plan this Friday?",
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: "msg002",
    conversationId: "conv001",
    senderId: "u002",
    text: "Sounds good, I'll prep the talking points for Friday.",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "msg003",
    conversationId: "conv002",
    senderId: "u005",
    text: "Hey Jordan! Are you free this weekend?",
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
    read: true,
  },
  {
    id: "msg004",
    conversationId: "conv002",
    senderId: "u004",
    text: "Can you cover my shift Saturday? I'll take your Sunday.",
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
  {
    id: "msg005",
    conversationId: "conv003",
    senderId: "u002",
    text: "Great work on the Heritage demo yesterday. Keep it up!",
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    read: false,
  },
];

/**
 * messageStore — direct messaging with Supabase Realtime
 */
export const useMessageStore = create((set, get) => ({
  conversations: isSupabaseConfigured() ? [] : [...SEED_CONVERSATIONS],
  messages: isSupabaseConfigured() ? [] : [...SEED_MESSAGES],
  loading: false,
  _subscription: null,

  /**
   * Fetch conversations for a user from Supabase.
   */
  fetchConversations: async (userId) => {
    if (!isSupabaseConfigured()) return;

    set({ loading: true });

    // Get conversations where user is a participant
    const { data: participantRows } = await supabase
      .from("conversation_participants")
      .select("conversation_id, unread_count")
      .eq("employee_id", userId);

    if (!participantRows || participantRows.length === 0) {
      set({ conversations: [], loading: false });
      return;
    }

    const convIds = participantRows.map((p) => p.conversation_id);
    const unreadMap = Object.fromEntries(
      participantRows.map((p) => [p.conversation_id, p.unread_count])
    );

    // Get all participants for these conversations
    const { data: allParticipants } = await supabase
      .from("conversation_participants")
      .select("conversation_id, employee_id, unread_count")
      .in("conversation_id", convIds);

    // Get latest message per conversation
    const { data: latestMessages } = await supabase
      .from("messages")
      .select("*")
      .in("conversation_id", convIds)
      .order("created_at", { ascending: false });

    // Build conversation objects
    const conversations = convIds.map((convId) => {
      const participants = (allParticipants || [])
        .filter((p) => p.conversation_id === convId)
        .map((p) => p.employee_id);

      const unreadCount = {};
      (allParticipants || [])
        .filter((p) => p.conversation_id === convId)
        .forEach((p) => {
          unreadCount[p.employee_id] = p.unread_count;
        });

      const lastMsg = (latestMessages || []).find(
        (m) => m.conversation_id === convId
      );

      return {
        id: String(convId),
        participants,
        lastMessage: lastMsg
          ? {
              text: lastMsg.text,
              senderId: lastMsg.sender_id,
              timestamp: lastMsg.created_at,
            }
          : { text: "", senderId: "", timestamp: new Date().toISOString() },
        unreadCount,
      };
    });

    set({
      conversations: conversations.sort(
        (a, b) =>
          new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
      ),
      loading: false,
    });
  },

  /**
   * Subscribe to new messages via Supabase Realtime.
   */
  subscribeToMessages: (userId) => {
    if (!isSupabaseConfigured()) return;

    const subscription = supabase
      .channel("messages-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const msg = payload.new;
          const newMessage = {
            id: String(msg.id),
            conversationId: String(msg.conversation_id),
            senderId: msg.sender_id,
            text: msg.text,
            timestamp: msg.created_at,
            read: msg.read,
          };

          set((s) => ({
            messages: [...s.messages, newMessage],
            conversations: s.conversations.map((c) => {
              if (c.id !== String(msg.conversation_id)) return c;
              return {
                ...c,
                lastMessage: {
                  text: msg.text,
                  senderId: msg.sender_id,
                  timestamp: msg.created_at,
                },
                unreadCount:
                  msg.sender_id !== userId
                    ? {
                        ...c.unreadCount,
                        [userId]: (c.unreadCount[userId] || 0) + 1,
                      }
                    : c.unreadCount,
              };
            }),
          }));
        }
      )
      .subscribe();

    set({ _subscription: subscription });
  },

  /**
   * Unsubscribe from Realtime.
   */
  unsubscribe: () => {
    const sub = get()._subscription;
    if (sub) {
      supabase.removeChannel(sub);
      set({ _subscription: null });
    }
  },

  // ── Getters ──────────────────────────────────────────

  getConversationsForUser: (userId) =>
    get()
      .conversations.filter((c) => c.participants.includes(userId))
      .sort(
        (a, b) =>
          new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp)
      ),

  getMessages: (conversationId) =>
    get()
      .messages.filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),

  getTotalUnread: (userId) =>
    get().conversations.reduce((sum, c) => {
      if (!c.participants.includes(userId)) return sum;
      return sum + (c.unreadCount[userId] || 0);
    }, 0),

  getOrCreateConversation: async (userId, otherUserId) => {
    const existing = get().conversations.find(
      (c) =>
        c.participants.includes(userId) && c.participants.includes(otherUserId)
    );
    if (existing) return existing;

    if (!isSupabaseConfigured()) {
      const newConv = {
        id: `conv_${Date.now()}`,
        participants: [userId, otherUserId],
        lastMessage: {
          text: "",
          senderId: "",
          timestamp: new Date().toISOString(),
        },
        unreadCount: { [userId]: 0, [otherUserId]: 0 },
      };
      set((s) => ({ conversations: [newConv, ...s.conversations] }));
      return newConv;
    }

    // Create conversation in Supabase
    const { data: conv } = await supabase
      .from("conversations")
      .insert({})
      .select()
      .single();

    if (!conv) return null;

    // Add both participants
    await supabase.from("conversation_participants").insert([
      { conversation_id: conv.id, employee_id: userId },
      { conversation_id: conv.id, employee_id: otherUserId },
    ]);

    const newConv = {
      id: String(conv.id),
      participants: [userId, otherUserId],
      lastMessage: {
        text: "",
        senderId: "",
        timestamp: new Date().toISOString(),
      },
      unreadCount: { [userId]: 0, [otherUserId]: 0 },
    };
    set((s) => ({ conversations: [newConv, ...s.conversations] }));
    return newConv;
  },

  // ── Actions ──────────────────────────────────────────

  sendMessage: async (conversationId, senderId, text) => {
    if (!isSupabaseConfigured()) {
      // Mock mode — same as before
      const msg = {
        id: `msg_${Date.now()}`,
        conversationId,
        senderId,
        text,
        timestamp: new Date().toISOString(),
        read: false,
      };

      set((s) => {
        const conv = s.conversations.find((c) => c.id === conversationId);
        const otherUserId = conv?.participants.find((p) => p !== senderId);
        return {
          messages: [...s.messages, msg],
          conversations: s.conversations.map((c) => {
            if (c.id !== conversationId) return c;
            return {
              ...c,
              lastMessage: { text, senderId, timestamp: msg.timestamp },
              unreadCount: {
                ...c.unreadCount,
                [otherUserId]: (c.unreadCount[otherUserId] || 0) + 1,
              },
            };
          }),
        };
      });
      return;
    }

    // Supabase mode — insert message (Realtime handles local state update)
    const { error } = await supabase.from("messages").insert({
      conversation_id: parseInt(conversationId, 10),
      sender_id: senderId,
      text,
    });

    if (error) {
      console.error("Failed to send message:", error.message);
    }

    // Increment unread for other participants
    const conv = get().conversations.find((c) => c.id === conversationId);
    if (conv) {
      const others = conv.participants.filter((p) => p !== senderId);
      for (const otherId of others) {
        await supabase.rpc("increment_unread", {
          p_conversation_id: parseInt(conversationId, 10),
          p_employee_id: otherId,
        });
      }
    }
  },

  markConversationRead: async (conversationId, userId) => {
    set((s) => ({
      conversations: s.conversations.map((c) => {
        if (c.id !== conversationId) return c;
        return {
          ...c,
          unreadCount: { ...c.unreadCount, [userId]: 0 },
        };
      }),
      messages: s.messages.map((m) => {
        if (m.conversationId !== conversationId || m.senderId === userId)
          return m;
        return { ...m, read: true };
      }),
    }));

    if (!isSupabaseConfigured()) return;

    // Reset unread count in Supabase
    await supabase
      .from("conversation_participants")
      .update({ unread_count: 0 })
      .eq("conversation_id", parseInt(conversationId, 10))
      .eq("employee_id", userId);

    // Mark messages as read
    await supabase
      .from("messages")
      .update({ read: true })
      .eq("conversation_id", parseInt(conversationId, 10))
      .neq("sender_id", userId);
  },

  /**
   * Fetch messages for a specific conversation.
   */
  fetchMessages: async (conversationId) => {
    if (!isSupabaseConfigured()) return;

    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", parseInt(conversationId, 10))
      .order("created_at");

    if (data) {
      const msgs = data.map((m) => ({
        id: String(m.id),
        conversationId: String(m.conversation_id),
        senderId: m.sender_id,
        text: m.text,
        timestamp: m.created_at,
        read: m.read,
      }));

      set((s) => ({
        messages: [
          ...s.messages.filter((m) => m.conversationId !== conversationId),
          ...msgs,
        ],
      }));
    }
  },
}));
