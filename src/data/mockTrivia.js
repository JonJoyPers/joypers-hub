/**
 * Joy-Per's Academy Trivia Bank
 * Categories: history | product | technique | culture | brand
 * difficulty: easy | medium | hard
 */
export const TRIVIA_QUESTIONS = [
  // ── HISTORY ──────────────────────────────────────────────
  {
    id: "q001",
    category: "history",
    difficulty: "easy",
    question: "In what year was Joy-Per's founded?",
    options: ["1946", "1951", "1961", "1975"],
    correct: 1,
    explanation: "Joy-Per's opened its first location in 1951, celebrating 75 years of excellence in 2026.",
  },
  {
    id: "q002",
    category: "history",
    difficulty: "easy",
    question: "What does the name 'Joy-Per's' represent?",
    options: [
      "The founder's nickname",
      "Joy + Performance — the brand's core mission",
      "A French word for 'fine shoe'",
      "A street in the original store's neighborhood",
    ],
    correct: 1,
    explanation: "Joy + Performance: the idea that great footwear should bring joy without sacrificing function.",
  },
  {
    id: "q003",
    category: "history",
    difficulty: "medium",
    question: "Joy-Per's 75th Anniversary celebration is centered around which milestone year?",
    options: ["2024", "2025", "2026", "2027"],
    correct: 2,
    explanation: "2026 marks 75 years since Joy-Per's founding. The anniversary date is April 5, 2026.",
  },
  {
    id: "q004",
    category: "history",
    difficulty: "hard",
    question: "Which decade saw Joy-Per's expand from one to five locations?",
    options: ["1960s", "1970s", "1980s", "1990s"],
    correct: 2,
    explanation: "The 1980s were Joy-Per's biggest growth decade, driven by the luxury footwear boom.",
  },
  {
    id: "q005",
    category: "history",
    difficulty: "medium",
    question: "Joy-Per's was among the first independent retailers to carry which iconic brand when it launched in the US?",
    options: ["Church's English Shoes", "Allen Edmonds", "Alden", "Johnston & Murphy"],
    correct: 0,
    explanation: "Joy-Per's was an early stockist for Church's when they entered the US market, cementing the store's reputation for heritage curation.",
  },

  // ── PRODUCT KNOWLEDGE ────────────────────────────────────
  {
    id: "q006",
    category: "product",
    difficulty: "easy",
    question: "What does 'Goodyear welt' refer to in shoe construction?",
    options: [
      "A rubber sole brand",
      "A stitching method connecting the upper, welt, and outsole",
      "A type of waterproof coating",
      "A heel reinforcement technique",
    ],
    correct: 1,
    explanation: "Goodyear welting is a premium construction method allowing resoling. Invented by Charles Goodyear Jr. in 1869.",
  },
  {
    id: "q007",
    category: "product",
    difficulty: "easy",
    question: "What is 'full-grain leather'?",
    options: [
      "Leather with the grain sanded smooth",
      "The outermost layer of the hide — strongest and most durable",
      "A type of synthetic leather",
      "Leather from grain-fed animals",
    ],
    correct: 1,
    explanation: "Full-grain retains the entire grain layer, making it the most durable and breathable leather available.",
  },
  {
    id: "q008",
    category: "product",
    difficulty: "medium",
    question: "What is a 'last' in shoemaking?",
    options: [
      "The final coat of polish applied",
      "The foot-shaped mold around which a shoe is constructed",
      "The last stitch in hand-sewn shoes",
      "A measurement system for shoe width",
    ],
    correct: 1,
    explanation: "A last is the 3D form that gives a shoe its shape. Different lasts produce dramatically different fits.",
  },
  {
    id: "q009",
    category: "product",
    difficulty: "medium",
    question: "Blake construction differs from Goodyear welt in what key way?",
    options: [
      "Blake uses glue instead of stitching",
      "Blake stitches through the insole directly to the outsole — thinner profile, harder to resole",
      "Blake shoes have no welt at all",
      "Blake is only used for athletic shoes",
    ],
    correct: 1,
    explanation: "Blake stitching creates a sleeker, more flexible shoe but limits resoling options. Common in Italian dress shoes.",
  },
  {
    id: "q010",
    category: "product",
    difficulty: "hard",
    question: "What is a 'storm welt' typically used for?",
    options: [
      "Extra weatherproofing on country and outdoor shoes",
      "A decorative welt on dress shoes",
      "A wider welt for large feet",
      "A synthetic welt on budget shoes",
    ],
    correct: 0,
    explanation: "Storm welts are folded up around the upper to create a barrier against moisture — ideal for hunting and country boots.",
  },
  {
    id: "q011",
    category: "product",
    difficulty: "easy",
    question: "Suede is made from which part of the hide?",
    options: [
      "The outer grain layer",
      "The inner split layer — softer and more porous",
      "Sheepskin only",
      "Synthetic microfiber",
    ],
    correct: 1,
    explanation: "Suede comes from the underside split of the hide. Its nap texture is softer but more vulnerable to moisture and stains.",
  },
  {
    id: "q012",
    category: "product",
    difficulty: "medium",
    question: "What does 'D' width mean in US men's sizing?",
    options: [
      "Narrow",
      "Standard/Medium width",
      "Wide",
      "Extra Wide",
    ],
    correct: 1,
    explanation: "D is the standard medium width for men's shoes. E is wide, EE is extra wide, B or C is narrow.",
  },
  {
    id: "q013",
    category: "product",
    difficulty: "hard",
    question: "Which construction method is most associated with Norwegian craftsmen and waterproof country footwear?",
    options: [
      "Blake stitch",
      "Cemented construction",
      "Norwegian welt",
      "Bolognese construction",
    ],
    correct: 2,
    explanation: "Norwegian welt, also called 'veldtschoen,' turns the upper outward and stitches it to both the welt and outsole for superior water resistance.",
  },

  // ── SALES TECHNIQUE ──────────────────────────────────────
  {
    id: "q014",
    category: "technique",
    difficulty: "easy",
    question: "What is the first step in any proper footwear fitting?",
    options: [
      "Ask the customer their usual size",
      "Measure both feet — they are often different sizes",
      "Show them the most expensive option first",
      "Check their current shoe brand",
    ],
    correct: 1,
    explanation: "Always measure both feet. Most people have a dominant foot that's larger. Fit to the larger foot.",
  },
  {
    id: "q015",
    category: "technique",
    difficulty: "medium",
    question: "A customer says 'I just want to browse.' The best response is:",
    options: [
      "Leave them completely alone",
      "Follow them closely in case they need help",
      "Greet warmly, give space, then re-engage with a specific question after 2 minutes",
      "Immediately show them your best sellers",
    ],
    correct: 2,
    explanation: "The third-step approach: warm welcome → give autonomy → strategic re-engagement. This honors their independence while keeping the sale alive.",
  },
  {
    id: "q016",
    category: "technique",
    difficulty: "medium",
    question: "What is 'price anchoring' in a retail context?",
    options: [
      "Matching competitor prices",
      "Presenting a premium option first to make subsequent prices feel more reasonable",
      "Offering a price guarantee",
      "Anchoring shoes to display stands",
    ],
    correct: 1,
    explanation: "Anchoring sets the first price seen as the reference point. Show the $450 option before the $280 option and $280 feels like a deal.",
  },
  {
    id: "q017",
    category: "technique",
    difficulty: "hard",
    question: "Which psychological principle explains why customers feel worse about losing a deal than they feel good about gaining a discount of equal value?",
    options: [
      "Social proof",
      "Reciprocity",
      "Loss aversion",
      "Scarcity bias",
    ],
    correct: 2,
    explanation: "Loss aversion (Kahneman & Tversky): losses feel approximately 2x more powerful than equivalent gains. 'Only 2 pairs left' converts better than '10% off.'",
  },
  {
    id: "q018",
    category: "technique",
    difficulty: "easy",
    question: "When closing a sale, which phrase is most effective?",
    options: [
      "'Would you like to buy these?'",
      "'Do you want to think about it?'",
      "'Shall I get these boxed up for you?'",
      "'These are pretty expensive, are you sure?'",
    ],
    correct: 2,
    explanation: "Assumptive closes ('Shall I get these boxed up?') presuppose agreement and reduce cognitive friction. Avoid introducing doubt.",
  },

  // ── BRAND & CULTURE ──────────────────────────────────────
  {
    id: "q019",
    category: "brand",
    difficulty: "easy",
    question: "What are Joy-Per's three core brand colors?",
    options: [
      "Black, Gold, White",
      "Deep Charcoal, Parchment Cream, Transformative Teal",
      "Navy, Silver, Burgundy",
      "Brown, Tan, Forest Green",
    ],
    correct: 1,
    explanation: "Deep Charcoal (#1A1A1A), Parchment Cream (#F5F5DC), and Transformative Teal (#008080) represent sophistication, warmth, and forward movement.",
  },
  {
    id: "q020",
    category: "brand",
    difficulty: "medium",
    question: "What does 'Neuro-Retail' mean at Joy-Per's?",
    options: [
      "Using brain-scanning technology to pick shoes",
      "Applying behavioral psychology principles to the retail sales process",
      "A new line of athletic performance footwear",
      "AI-powered inventory management",
    ],
    correct: 1,
    explanation: "Neuro-Retail is the application of cognitive science — anchoring, loss aversion, identity signaling, social proof, and sensory encoding — to deepen customer engagement.",
  },
  {
    id: "q021",
    category: "brand",
    difficulty: "easy",
    question: "Joy-Per's primary mission statement is centered around:",
    options: [
      "Selling the most shoes per square foot",
      "Outpricing competitors",
      "Joy + Performance — creating footwear experiences that elevate daily life",
      "Becoming the largest chain in the country",
    ],
    correct: 2,
    explanation: "Every customer interaction should reinforce Joy + Performance: the belief that the right shoe elevates confidence, comfort, and capability.",
  },
  {
    id: "q022",
    category: "culture",
    difficulty: "medium",
    question: "How long does Joy-Per's expect a new associate to reach full product knowledge proficiency?",
    options: [
      "1 week",
      "30 days",
      "90 days",
      "6 months",
    ],
    correct: 2,
    explanation: "The 90-day onboarding program covers construction, fitting, brand heritage, and neuro-retail sales techniques systematically.",
  },
  {
    id: "q023",
    category: "culture",
    difficulty: "hard",
    question: "The 'identity mirror' sales principle means:",
    options: [
      "Showing customers their reflection in the fitting mirror",
      "Reflecting a customer's identity and values back to them through product selection",
      "Matching shoe color to clothing",
      "A store display technique using mirrors",
    ],
    correct: 1,
    explanation: "The shoe you recommend should speak to who the customer believes they are — or aspires to be. Great footwear is an identity statement.",
  },
  {
    id: "q024",
    category: "product",
    difficulty: "hard",
    question: "What is 'patina' in the context of leather shoes?",
    options: [
      "A type of waterproof spray",
      "The natural darkening and color variation leather develops with use and conditioning",
      "A brand of shoe cream",
      "A factory finish applied to the leather",
    ],
    correct: 1,
    explanation: "Patina is the beauty mark of a well-worn and cared-for shoe. It's the accumulated color depth from use, polish layers, and natural oxidation — unique to each pair.",
  },
  {
    id: "q025",
    category: "technique",
    difficulty: "hard",
    question: "What is the 'sensory encoding' principle in Neuro-Retail?",
    options: [
      "Playing music to relax customers",
      "Creating multi-sensory touchpoints (touch, smell, sound) that encode the product in memory and drive purchase",
      "Using bright store lighting",
      "Encoding product data in barcodes",
    ],
    correct: 1,
    explanation: "Sensory encoding uses touch (grain texture), smell (leather), and sound (the click of a well-made heel) to create emotional memory — turning browsers into buyers.",
  },
];

export const CATEGORIES = ["history", "product", "technique", "culture", "brand"];
export const DIFFICULTIES = ["easy", "medium", "hard"];

export const getQuestionsByCategory = (cat) =>
  TRIVIA_QUESTIONS.filter((q) => q.category === cat);

export const getQuestionsByDifficulty = (diff) =>
  TRIVIA_QUESTIONS.filter((q) => q.difficulty === diff);

export const getRandomQuestions = (count = 10) => {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};
