import { create } from "zustand";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { BULLETIN_POSTS } from "../data/mockBulletin";

/**
 * appStore — global UI and feature state
 *
 * Bulletin + social posts backed by Supabase when configured.
 * Trivia and kiosk mode remain client-only.
 */
export const useAppStore = create((set, get) => ({
  // ── Kiosk Mode ─────────────────────────────────────────
  isKioskMode: false,
  setKioskMode: (val) => set({ isKioskMode: val }),

  // ── Active Tab ─────────────────────────────────────────
  activeTab: "TimeClock",
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ── Trivia / Academy Session ───────────────────────────
  triviaSession: null,

  startTriviaSession: (questions) =>
    set({
      triviaSession: {
        questions,
        currentIndex: 0,
        score: 0,
        complete: false,
        answers: [],
      },
    }),

  answerTrivia: (selectedIndex) => {
    const { triviaSession } = get();
    if (!triviaSession || triviaSession.complete) return;

    const q = triviaSession.questions[triviaSession.currentIndex];
    const correct = selectedIndex === q.correct;
    const answers = [
      ...triviaSession.answers,
      { questionId: q.id, selectedIndex, correct },
    ];
    const score = triviaSession.score + (correct ? 1 : 0);
    const nextIndex = triviaSession.currentIndex + 1;
    const complete = nextIndex >= triviaSession.questions.length;

    set({
      triviaSession: {
        ...triviaSession,
        currentIndex: nextIndex,
        score,
        complete,
        answers,
      },
    });

    return { correct, score, complete };
  },

  resetTriviaSession: () => set({ triviaSession: null }),

  // ── Bulletin Posts ─────────────────────────────────────
  bulletinPosts: isSupabaseConfigured() ? [] : [...BULLETIN_POSTS],
  bulletinUnread: 3,
  markBulletinRead: () => set({ bulletinUnread: 0 }),

  fetchBulletinPosts: async () => {
    if (!isSupabaseConfigured()) return;

    const { data } = await supabase
      .from("bulletin_posts")
      .select("*, author:employees(id, name, role)")
      .order("pinned", { ascending: false })
      .order("created_at", { ascending: false });

    if (data) {
      const posts = data.map((row) => ({
        id: String(row.id),
        type: row.type,
        pinned: row.pinned,
        title: row.title,
        body: row.body,
        author: row.author?.name || "Unknown",
        authorRole: row.author?.role || "employee",
        date: row.created_at,
        emoji: row.emoji,
        tags: row.tags || [],
        eventDate: row.event_date,
      }));
      set({ bulletinPosts: posts });
    }
  },

  addBulletinPost: async ({
    title,
    body,
    type,
    emoji,
    tags,
    pinned,
    author,
    authorRole,
    eventDate,
    authorId,
  }) => {
    if (!isSupabaseConfigured()) {
      const post = {
        id: `b_${Date.now()}`,
        type,
        pinned: !!pinned,
        title,
        body,
        author,
        authorRole,
        date: new Date().toISOString(),
        emoji,
        tags,
        ...(eventDate ? { eventDate } : {}),
      };
      set((s) => ({ bulletinPosts: [post, ...s.bulletinPosts] }));
      return;
    }

    const { data, error } = await supabase
      .from("bulletin_posts")
      .insert({
        title,
        body,
        type,
        emoji,
        tags,
        pinned: !!pinned,
        author_id: authorId,
        event_date: eventDate,
      })
      .select("*, author:employees(id, name, role)")
      .single();

    if (error) {
      console.error("Failed to add bulletin post:", error.message);
      return;
    }

    const post = {
      id: String(data.id),
      type: data.type,
      pinned: data.pinned,
      title: data.title,
      body: data.body,
      author: data.author?.name || author,
      authorRole: data.author?.role || authorRole,
      date: data.created_at,
      emoji: data.emoji,
      tags: data.tags || [],
      eventDate: data.event_date,
    };
    set((s) => ({ bulletinPosts: [post, ...s.bulletinPosts] }));
  },

  // ── Social Feed ────────────────────────────────────────
  socialPosts: isSupabaseConfigured()
    ? []
    : [
        {
          id: "sp001",
          authorId: "u002",
          authorName: "Marcus Reid",
          authorRole: "manager",
          content:
            "Just wrapped training with the new team on the Heritage Collection talking points. These shoes literally sell themselves once the construction story is told right.",
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          likes: ["u004", "u005", "u007"],
          comments: [
            {
              id: "c001",
              authorId: "u004",
              authorName: "Jordan",
              content:
                "The Goodyear welt story always gets them. Customers love knowing it's resolvable.",
              timestamp: new Date(
                Date.now() - 90 * 60 * 1000
              ).toISOString(),
            },
          ],
        },
        {
          id: "sp002",
          authorId: "u001",
          authorName: "Diana Voss",
          authorRole: "admin",
          content:
            "February closed as our strongest February in 3 years. This is entirely a team effort. Every conversation, every fitting — it adds up. Proud of this crew.",
          timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(),
          likes: ["u002", "u003", "u004", "u005", "u006", "u007", "u008"],
          comments: [
            {
              id: "c002",
              authorId: "u005",
              authorName: "Priya",
              content: "Let's keep it going into March!",
              timestamp: new Date(
                Date.now() - 24 * 60 * 60 * 1000
              ).toISOString(),
            },
            {
              id: "c003",
              authorId: "u006",
              authorName: "Devon",
              content: "February is usually tough. This felt different.",
              timestamp: new Date(
                Date.now() - 22 * 60 * 60 * 1000
              ).toISOString(),
            },
          ],
        },
        {
          id: "sp003",
          authorId: "u007",
          authorName: "Aisha Monroe",
          authorRole: "employee",
          content:
            "Stock room is looking cleaner than ever back here. If you need a size quickly during a sale, the new bin system should make pulls under 60 seconds. You're welcome",
          timestamp: new Date(Date.now() - 50 * 60 * 60 * 1000).toISOString(),
          likes: ["u001", "u002", "u003", "u004"],
          comments: [],
        },
      ],

  fetchSocialPosts: async () => {
    if (!isSupabaseConfigured()) return;

    const { data: posts } = await supabase
      .from("social_posts")
      .select("*, author:employees(id, name, role)")
      .order("created_at", { ascending: false });

    if (!posts) return;

    // Fetch likes and comments for all posts
    const postIds = posts.map((p) => p.id);

    const [{ data: likes }, { data: comments }] = await Promise.all([
      supabase.from("social_likes").select("*").in("post_id", postIds),
      supabase
        .from("social_comments")
        .select("*, author:employees(id, name)")
        .in("post_id", postIds)
        .order("created_at"),
    ]);

    const socialPosts = posts.map((p) => ({
      id: String(p.id),
      authorId: p.author_id,
      authorName: p.author?.name || "Unknown",
      authorRole: p.author?.role || "employee",
      content: p.content,
      timestamp: p.created_at,
      likes: (likes || [])
        .filter((l) => l.post_id === p.id)
        .map((l) => l.employee_id),
      comments: (comments || [])
        .filter((c) => c.post_id === p.id)
        .map((c) => ({
          id: String(c.id),
          authorId: c.author_id,
          authorName: c.author?.name || "Unknown",
          content: c.content,
          timestamp: c.created_at,
        })),
    }));

    set({ socialPosts });
  },

  addSocialPost: async (authorId, authorName, authorRole, content) => {
    if (!isSupabaseConfigured()) {
      const post = {
        id: `sp_${Date.now()}`,
        authorId,
        authorName,
        authorRole,
        content,
        timestamp: new Date().toISOString(),
        likes: [],
        comments: [],
      };
      set((s) => ({ socialPosts: [post, ...s.socialPosts] }));
      return;
    }

    const { data, error } = await supabase
      .from("social_posts")
      .insert({ author_id: authorId, content })
      .select("*, author:employees(id, name, role)")
      .single();

    if (error) {
      console.error("Failed to add social post:", error.message);
      return;
    }

    const post = {
      id: String(data.id),
      authorId: data.author_id,
      authorName: data.author?.name || authorName,
      authorRole: data.author?.role || authorRole,
      content: data.content,
      timestamp: data.created_at,
      likes: [],
      comments: [],
    };
    set((s) => ({ socialPosts: [post, ...s.socialPosts] }));
  },

  toggleLike: async (postId, userId) => {
    // Optimistic update
    set((s) => ({
      socialPosts: s.socialPosts.map((p) => {
        if (p.id !== postId) return p;
        const liked = p.likes.includes(userId);
        return {
          ...p,
          likes: liked
            ? p.likes.filter((id) => id !== userId)
            : [...p.likes, userId],
        };
      }),
    }));

    if (!isSupabaseConfigured()) return;

    const numPostId = parseInt(postId, 10);
    if (isNaN(numPostId)) return;

    // Check if already liked
    const { data: existing } = await supabase
      .from("social_likes")
      .select("id")
      .eq("post_id", numPostId)
      .eq("employee_id", userId)
      .single();

    if (existing) {
      await supabase.from("social_likes").delete().eq("id", existing.id);
    } else {
      await supabase
        .from("social_likes")
        .insert({ post_id: numPostId, employee_id: userId });
    }
  },

  addComment: async (postId, authorId, authorName, content) => {
    const comment = {
      id: `c_${Date.now()}`,
      authorId,
      authorName,
      content,
      timestamp: new Date().toISOString(),
    };

    // Optimistic update
    set((s) => ({
      socialPosts: s.socialPosts.map((p) =>
        p.id === postId
          ? { ...p, comments: [...p.comments, comment] }
          : p
      ),
    }));

    if (!isSupabaseConfigured()) return;

    const numPostId = parseInt(postId, 10);
    if (isNaN(numPostId)) return;

    await supabase.from("social_comments").insert({
      post_id: numPostId,
      author_id: authorId,
      content,
    });
  },
}));
