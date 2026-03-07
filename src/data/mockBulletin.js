/**
 * Joy-Per's Hub — Bulletin Board mock data
 * type: "birthday" | "anniversary" | "promo" | "event" | "announcement" | "recognition"
 * pinned: shown at top regardless of date
 */

const today = new Date();
const upcoming = (daysAhead, h = 9) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() + daysAhead);
  dt.setHours(h, 0, 0, 0);
  return dt.toISOString();
};
const past = (daysAgo, h = 9) => {
  const dt = new Date(today);
  dt.setDate(dt.getDate() - daysAgo);
  dt.setHours(h, 0, 0, 0);
  return dt.toISOString();
};

export const BULLETIN_POSTS = [
  // ── PINNED / ANNOUNCEMENTS ───────────────────────────────
  {
    id: "b001",
    type: "event",
    pinned: true,
    title: "75th Anniversary — April 5, 2026",
    body: "Our biggest milestone is almost here. Joy-Per's turns 75 on April 5, 2026. Expect in-store celebrations, exclusive anniversary collections, and a very special team event. Details coming soon.",
    author: "Diana Voss",
    authorRole: "admin",
    date: upcoming(0),
    emoji: "🎉",
    tags: ["#75th", "#Anniversary", "#AllHands"],
    eventDate: "2026-04-05T10:00:00.000Z",
  },
  {
    id: "b002",
    type: "promo",
    pinned: true,
    title: "Spring Campaign — 'Walk Into Something New'",
    body: "Our Spring 2026 campaign launches March 15. Key message: 'Walk Into Something New.' Focus on full-grain leathers and the new Heritage Sneaker line. Talking points available in the Academy.",
    author: "Marcus Reid",
    authorRole: "manager",
    date: upcoming(0),
    emoji: "🌱",
    tags: ["#Campaign", "#Spring2026", "#Sales"],
    eventDate: "2026-03-15T09:00:00.000Z",
  },

  // ── UPCOMING BIRTHDAYS ────────────────────────────────────
  {
    id: "b003",
    type: "birthday",
    pinned: false,
    title: "Happy Birthday, Priya!",
    body: "Wishing Priya Nair a wonderful birthday! Priya has been a core part of the sales floor team since 2021. Make sure to wish her well when you see her.",
    author: "Diana Voss",
    authorRole: "admin",
    date: upcoming(2),
    emoji: "🎂",
    tags: ["#Birthday", "#Priya"],
  },
  {
    id: "b004",
    type: "birthday",
    pinned: false,
    title: "Birthday shoutout — Jordan Blake!",
    body: "Jordan turns another year wiser this week. His product knowledge and customer relationships make him one of the most trusted voices on the floor.",
    author: "Marcus Reid",
    authorRole: "manager",
    date: upcoming(5),
    emoji: "🎂",
    tags: ["#Birthday", "#Jordan"],
  },

  // ── WORK ANNIVERSARIES ───────────────────────────────────
  {
    id: "b005",
    type: "anniversary",
    pinned: false,
    title: "5 Years of Sophie Tran!",
    body: "Sophie hits her 5-year mark this month. From day one she's transformed our inventory process. Thank you, Sophie — we wouldn't run without you.",
    author: "Diana Voss",
    authorRole: "admin",
    date: upcoming(8),
    emoji: "⭐",
    tags: ["#Anniversary", "#5Years", "#Sophie"],
  },

  // ── PROMOS & EVENTS ──────────────────────────────────────
  {
    id: "b006",
    type: "promo",
    pinned: false,
    title: "VIP Preview Night — Heritage Collection",
    body: "We're hosting a private VIP preview for our top 50 loyalty members on March 28. All staff should be familiar with the Heritage Collection talking points before then. Dress code: sharp casual.",
    author: "Diana Voss",
    authorRole: "admin",
    date: upcoming(10),
    emoji: "🥂",
    tags: ["#VIP", "#Heritage", "#Event"],
    eventDate: upcoming(10),
  },
  {
    id: "b007",
    type: "event",
    pinned: false,
    title: "Inventory Audit — March 22",
    body: "Full inventory count on March 22, starting at 7:00 AM. All floor staff please arrive 30 minutes early. Sophie will lead. No personal items on the floor during audit.",
    author: "Sophie Tran",
    authorRole: "manager",
    date: upcoming(4),
    emoji: "📦",
    tags: ["#Inventory", "#Audit", "#AllStaff"],
    eventDate: upcoming(4),
  },
  {
    id: "b008",
    type: "promo",
    pinned: false,
    title: "Goodyear Welt Weekend — March 29–30",
    body: "Double loyalty points on all Goodyear-welted styles this weekend. Make sure customers know about our complimentary resoling service — it's a major differentiator. Push the construction story.",
    author: "Marcus Reid",
    authorRole: "manager",
    date: upcoming(11),
    emoji: "🔨",
    tags: ["#Promo", "#GoodyearWelt", "#Weekend"],
    eventDate: upcoming(11),
  },

  // ── RECOGNITION ──────────────────────────────────────────
  {
    id: "b009",
    type: "recognition",
    pinned: false,
    title: "Team Win — Highest February in 3 Years!",
    body: "February 2026 closed as our highest February in 3 years. This is a direct result of the team's commitment to the Neuro-Retail approach. Thank you all. Details in the admin dashboard.",
    author: "Diana Voss",
    authorRole: "admin",
    date: past(1),
    emoji: "📈",
    tags: ["#Win", "#Sales", "#TeamFirst"],
  },
  {
    id: "b010",
    type: "recognition",
    pinned: false,
    title: "Spotlight: Aisha Monroe",
    body: "Aisha single-handedly reorganized our stock room last week, cutting pull times by 40%. That kind of initiative is exactly what makes Joy-Per's run. Aisha — you're seen.",
    author: "Sophie Tran",
    authorRole: "manager",
    date: past(3),
    emoji: "👏",
    tags: ["#Recognition", "#Aisha", "#BackOfHouse"],
  },

  // ── GENERAL ANNOUNCEMENTS ────────────────────────────────
  {
    id: "b011",
    type: "announcement",
    pinned: false,
    title: "New Uniform Policy — Effective March 1",
    body: "Starting March 1, all floor staff should wear the Joy-Per's branded apron during peak hours (Fri–Sun, 11am–6pm). Aprons are in the stock room. See Marcus or Sophie with questions.",
    author: "Diana Voss",
    authorRole: "admin",
    date: past(5),
    emoji: "📋",
    tags: ["#Policy", "#Uniform", "#AllStaff"],
  },
  {
    id: "b012",
    type: "announcement",
    pinned: false,
    title: "Academy Trivia Challenge — This Month",
    body: "This month's challenge: score 80%+ on the Product Knowledge quiz in the Academy section. Top scorer gets a $50 store credit. The challenge closes March 31.",
    author: "Diana Voss",
    authorRole: "admin",
    date: past(7),
    emoji: "🏆",
    tags: ["#Academy", "#Challenge", "#Trivia"],
  },
];

export const getPinnedPosts = () => BULLETIN_POSTS.filter((p) => p.pinned);

export const getUnpinnedPosts = () =>
  BULLETIN_POSTS.filter((p) => !p.pinned).sort(
    (a, b) => new Date(b.date) - new Date(a.date)
  );

export const getPostsByType = (type) =>
  BULLETIN_POSTS.filter((p) => p.type === type);
