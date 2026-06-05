/**
 * Academy learning content for Joy-Per's Hub
 * Brand knowledge, fit zone education, and video resources.
 */

export const BRAND_KNOWLEDGE = [
  {
    id: "brand-hoka",
    name: "Hoka",
    overview: "Maximum cushion, minimal weight — built for runners and walkers who want cloud-like comfort.",
    technologies: [
      { name: "PROFLY", desc: "Firmer foam on top for stability, softer foam beneath for a cushy landing." },
      { name: "Meta-Rocker", desc: "Curved sole geometry that creates a smooth rolling motion from heel to toe." },
      { name: "Active Foot Frame", desc: "Deep heel cup that cradles the foot for natural support without rigid posts." },
    ],
    fittingTips: [
      "Tends to run half size small — always measure and try on",
      "Wide options (D for women, EE for men) available in most models",
      "Bondi series runs more true to size than Clifton",
      "Thick sole may feel unstable initially — have customers walk around the store",
    ],
  },
  {
    id: "brand-newbalance",
    name: "New Balance",
    overview: "Heritage brand known for wide widths, lifestyle crossover, and serious performance lines.",
    technologies: [
      { name: "Fresh Foam", desc: "Data-driven midsole with hexagonal foam pods for cushioning and flexibility." },
      { name: "FuelCell", desc: "Nitrogen-infused TPE foam for high-energy return — their speed platform." },
      { name: "ENCAP", desc: "EVA core surrounded by polyurethane rim for support and durability." },
    ],
    fittingTips: [
      "Offers widest range of width options in the industry (B, D, 2E, 4E, 6E)",
      "Numeric model names: 990, 1080, 880 — higher often means more cushion",
      "Made in USA models (990, 992, 993) run slightly roomier",
      "Lifestyle models (574, 327) fit differently than performance — always re-measure",
    ],
  },
  {
    id: "brand-clarks",
    name: "Clarks",
    overview: "British heritage comfort brand — leather craftsmanship meets modern cushion technology.",
    technologies: [
      { name: "Cushion Plus", desc: "Extra-padded insoles with shock-absorbing materials for all-day wear." },
      { name: "Ultimate Comfort", desc: "Tri-density OrthoLite footbed with arch support and moisture management." },
      { name: "Ortholite", desc: "Open-cell PU foam insoles that resist compression and wick moisture." },
    ],
    fittingTips: [
      "Sized in UK system — convert carefully (UK 8 ≈ US Men's 9, US Women's 10)",
      "Leather styles require a break-in period — warn customers about initial stiffness",
      "Unstructured line runs wider and more relaxed than traditional models",
      "Desert Boots run a full size large — always size down",
    ],
  },
  {
    id: "brand-ugg",
    name: "UGG",
    overview: "Beyond the classic boot — comfort lifestyle brand with proprietary wool and foam technologies.",
    technologies: [
      { name: "Treadlite", desc: "Durable, lightweight outsole with cushioning for outdoor and indoor use." },
      { name: "UGGpure Wool", desc: "Lyocell and wool blend lining that wicks moisture and regulates temperature." },
      { name: "PORON Foam", desc: "Energy-return cushioning that maintains performance over time." },
    ],
    fittingTips: [
      "Classic boots: size down half size — sheepskin stretches and molds to foot",
      "Sneakers and slides: true to size",
      "Snug fit is intentional — material loosens within 2-3 wears",
      "Recommend UGG Care Kit for suede/sheepskin protection",
    ],
  },
  {
    id: "brand-vans",
    name: "Vans",
    overview: "Skate-rooted lifestyle icon — simple construction, bold design, enduring street style.",
    technologies: [
      { name: "UltraCush", desc: "Sockliner with high-rebound foam for impact cushioning in Pro models." },
      { name: "ComfyCush", desc: "Lightweight foam outsole construction replacing traditional vulcanized rubber." },
      { name: "Duracap", desc: "Rubber underlay in high-wear areas for extended toe cap durability." },
    ],
    fittingTips: [
      "Generally true to size — Old Skool and Sk8-Hi are reliable benchmarks",
      "Vulcanized soles (Classic) have no arch support — recommend insoles for extended wear",
      "ComfyCush versions are slightly roomier than originals",
      "Slip-Ons run narrow — size up half for wider feet",
    ],
  },
];

export const FIT_ZONE = [
  {
    id: "fz-anatomy",
    title: "Foot Anatomy",
    icon: "foot",
    sections: [
      {
        subtitle: "Arch Types",
        body: "Normal (medium) arch: foot rolls inward slightly — neutral pronation. Flat (low) arch: foot rolls inward excessively — overpronation. High arch: foot rolls outward — supination/underpronation. Use the wet test or a Brannock device to identify arch type.",
      },
      {
        subtitle: "Pronation & Supination",
        body: "Pronation is the natural inward roll of the foot during walking. Overpronation needs stability or motion-control shoes. Supination (underpronation) needs neutral, cushioned shoes. Check wear patterns on old shoes — medial wear = overpronation, lateral wear = supination.",
      },
    ],
  },
  {
    id: "fz-measuring",
    title: "Measuring Techniques",
    icon: "ruler",
    sections: [
      {
        subtitle: "Using the Brannock Device",
        body: "Have the customer stand with full weight on the device. Measure both length (heel to longest toe) and width (ball girth). The arch length indicator helps when toe length and arch length differ — go with the larger measurement.",
      },
      {
        subtitle: "Both-Feet Rule",
        body: "ALWAYS measure both feet. Up to 80% of people have one foot larger than the other. Fit to the larger foot — a slightly roomy shoe is better than a tight one. Re-measure at each visit; feet change with age, weight, and activity.",
      },
      {
        subtitle: "Time of Day",
        body: "Feet swell throughout the day. Best fitting time: afternoon or evening. If fitting in the morning, allow a thumb's width (about 0.5 inches) of extra room at the toe box.",
      },
    ],
  },
  {
    id: "fz-widths",
    title: "Width Fitting",
    icon: "arrows",
    sections: [
      {
        subtitle: "Men's Width Scale",
        body: "B = Narrow, D = Standard/Medium, E = Wide, EE (2E) = Extra Wide, 4E/6E = available in select brands (New Balance, ASICS). Most men default to D — but always measure.",
      },
      {
        subtitle: "Women's Width Scale",
        body: "AA = Narrow, B = Standard/Medium, D = Wide, EE (2E) = Extra Wide. Most women default to B. Women's D is equivalent to Men's B.",
      },
    ],
  },
  {
    id: "fz-conditions",
    title: "Common Conditions",
    icon: "heart",
    sections: [
      {
        subtitle: "Plantar Fasciitis",
        body: "Inflammation of the plantar fascia — sharp heel pain, especially first steps in the morning. Recommend: arch support, cushioned heel, slight heel drop (10-12mm), firm heel counter. Brands: Hoka Bondi, New Balance 990, Clarks with OrthoLite.",
      },
      {
        subtitle: "Bunions",
        body: "Bony bump at the base of the big toe — needs a wide, flexible toe box. Avoid pointed-toe shoes. Recommend: wide-width models, soft/stretchy uppers, minimal seams over the bunion area.",
      },
      {
        subtitle: "Flat Feet",
        body: "Collapsed arch causes overpronation. Recommend: stability shoes with medial post, motion control for severe cases. Avoid minimalist or zero-drop shoes. Try: New Balance 860, ASICS Kayano.",
      },
      {
        subtitle: "Heel Spurs & Metatarsalgia",
        body: "Heel spurs: bony growth on the calcaneus — similar treatment to plantar fasciitis. Metatarsalgia: pain in the ball of the foot — needs forefoot cushioning, rocker soles, and metatarsal pads. Hoka's Meta-Rocker is excellent for both.",
      },
    ],
  },
];

export const VIDEO_RESOURCES = [
  {
    category: "Shoe Technology",
    videos: [
      { id: "v01", title: "Hoka Technology Overview", source: "HOKA TV", duration: "", url: "https://www.youtube.com/watch?v=e4Isj2ZqQb4" },
      { id: "v02", title: "Brooks DNA LOFT v3 Explained", source: "Brooks Running", duration: "", url: "https://www.youtube.com/watch?v=2A8IUWovPLM" },
      { id: "v03", title: "ASICS GEL Technology", source: "ASICS", duration: "", url: "https://www.youtube.com/watch?v=1cJvW7Tjb38" },
      { id: "v04", title: "New Balance Fresh Foam X", source: "New Balance", duration: "", url: "https://www.youtube.com/watch?v=lEK6z2uQzkg" },
    ],
  },
  {
    category: "Foot Health & Fitting",
    videos: [
      { id: "v05", title: "Understanding Pronation", source: "All Sorts Of Running", duration: "", url: "https://www.youtube.com/watch?v=nCqL-wqAxDw" },
      { id: "v06", title: "How to Use a Brannock Device", source: "Foot Geekz", duration: "", url: "https://www.youtube.com/watch?v=khsBN-3tF0c" },
      { id: "v07", title: "Choosing the Right Running Shoe", source: "REI", duration: "", url: "https://www.youtube.com/watch?v=bJOTN_D6tMk" },
    ],
  },
  {
    category: "Gait & Biomechanics",
    videos: [
      { id: "v08", title: "Gait Analysis Basics", source: "Athletes Training Room", duration: "", url: "https://www.youtube.com/watch?v=fwSu98yvgCY" },
      { id: "v09", title: "Pronation vs Supination Explained", source: "Next Level PT", duration: "", url: "https://www.youtube.com/watch?v=4P0509Yhq7Y" },
    ],
  },
];

/**
 * Per-video comprehension quizzes — one short subject-matter quiz per Learn
 * tab video so we can check whether sales associates actually absorbed the
 * training. Shape matches the academy_questions row shape in
 * SupabaseQuizSession, so the same quiz player renders both.
 *
 * Each quiz id is namespaced "video-quiz-<videoId>" so the screen can resolve
 * a quiz directly from a tapped video, and AcademyScreen treats the prefix
 * the same way it treats "fallback-" — purely local, never round-trips to
 * Supabase.
 */
function mkQuestion(prefix, idx, text, options, correct, explanation) {
  return {
    id: `${prefix}-q${idx + 1}`,
    question_text: text,
    option_a: options[0],
    option_b: options[1],
    option_c: options[2],
    option_d: options[3],
    correct_option: ["A", "B", "C", "D"][correct],
    explanation,
    sort_order: idx,
  };
}

export const VIDEO_QUIZZES = [
  {
    id: "video-quiz-v01",
    videoId: "v01",
    title: "Hoka Technology Check",
    category: "product",
    description: "Meta-Rocker, PROFLY, and how Hoka actually fits on the floor.",
    questions: [
      [
        "What is Hoka's Meta-Rocker?",
        [
          "A curved sole geometry that creates a smooth heel-to-toe roll",
          "A removable foam insert in the heel",
          "A wide forefoot platform for stability",
          "A breathable mesh upper panel",
        ],
        0,
        "Meta-Rocker is Hoka's signature curved midsole geometry — it rolls the foot smoothly through the gait cycle.",
      ],
      [
        "PROFLY foam is best described as:",
        [
          "A single-density foam tuned for energy return",
          "A dual-density setup — firmer on top for stability, softer below for cushion",
          "A nitrogen-infused racing compound",
          "A gel insert under the heel",
        ],
        1,
        "PROFLY pairs a firmer top layer with a softer bottom layer to balance support and a cushy landing.",
      ],
      [
        "The Active Foot Frame is Hoka's:",
        [
          "Reinforced toe cap",
          "Deep heel cradle that holds the foot without rigid posts",
          "Plastic shank under the arch",
          "Pull-tab heel loop",
        ],
        1,
        "Active Foot Frame is a deep, cupped midsole that cradles the heel for natural support.",
      ],
      [
        "A common mistake when fitting Hoka is:",
        [
          "Recommending the Bondi to flat-footed customers",
          "Forgetting that most Hokas tend to run half a size small",
          "Pairing them with cushioned insoles",
          "Lacing them through the top eyelet",
        ],
        1,
        "Hoka usually runs about half a size small — always offer the next half up to try on.",
      ],
    ],
  },
  {
    id: "video-quiz-v02",
    videoId: "v02",
    title: "Brooks DNA LOFT v3 Check",
    category: "product",
    description: "What makes the latest DNA LOFT different, and who it's for.",
    questions: [
      [
        "DNA LOFT v3 is Brooks's:",
        [
          "Outsole rubber compound",
          "Nitrogen-infused supercritical midsole foam",
          "Heel counter material",
          "Lacing system",
        ],
        1,
        "v3 is a nitrogen-infused supercritical foam — Brooks's lightest, softest, most responsive midsole to date.",
      ],
      [
        "Compared to earlier DNA LOFT, v3 is:",
        [
          "Heavier and firmer",
          "Lighter, softer, and more responsive",
          "The same foam in a new color",
          "A leather-based material",
        ],
        1,
        "Nitrogen infusion drops weight and adds bounce versus the older DNA LOFT formulations.",
      ],
      [
        "DNA LOFT v3 debuted in which Brooks line?",
        [
          "Adrenaline GTS",
          "Ghost Max",
          "Glycerin / Glycerin Max",
          "Beast 20",
        ],
        2,
        "It launched in the Glycerin — Brooks's premium neutral daily trainer.",
      ],
      [
        "The best customer match for a DNA LOFT v3 shoe is:",
        [
          "Someone wanting maximum stability or motion control",
          "Someone seeking soft, plush daily cushion",
          "Someone needing carbon-plate race-day shoes",
          "Someone with severe overpronation",
        ],
        1,
        "DNA LOFT v3 shoes are plush neutral trainers — not stability shoes and not racers.",
      ],
    ],
  },
  {
    id: "video-quiz-v03",
    videoId: "v03",
    title: "ASICS GEL Check",
    category: "product",
    description: "What GEL is, where it lives in the shoe, and who benefits.",
    questions: [
      [
        "GEL technology in ASICS shoes is primarily:",
        [
          "A rubber outsole compound",
          "A silicone-based cushion insert that absorbs impact",
          "A breathable upper material",
          "A type of lacing system",
        ],
        1,
        "GEL is a viscous, silicone-based insert engineered to attenuate shock at impact.",
      ],
      [
        "GEL is typically placed in the:",
        [
          "Entire outsole",
          "Heel and/or forefoot pockets of the midsole",
          "Toe box",
          "Tongue padding",
        ],
        1,
        "Most ASICS models embed GEL in the rearfoot, forefoot, or both — where impact peaks.",
      ],
      [
        "The flagship ASICS model long associated with heavy GEL cushioning is the:",
        [
          "GEL-Kayano",
          "Novablast",
          "Metaspeed Sky",
          "GT-2000 Lite",
        ],
        0,
        "The Kayano is the long-running stability flagship built around GEL.",
      ],
      [
        "A customer who lands hard on their heels is a strong candidate for:",
        [
          "A minimalist shoe with no GEL",
          "A GEL-equipped model with rearfoot cushioning",
          "A racing flat",
          "A water shoe",
        ],
        1,
        "Rearfoot GEL is purpose-built to soften heavy heel strikes.",
      ],
    ],
  },
  {
    id: "video-quiz-v04",
    videoId: "v04",
    title: "Fresh Foam X Check",
    category: "product",
    description: "What \"X\" means, the hexagonal pods, and Fresh Foam vs FuelCell.",
    questions: [
      [
        "The \"X\" in Fresh Foam X signals:",
        [
          "An extra-wide last",
          "An evolved, more cushioned and responsive version of Fresh Foam",
          "A racing-only model",
          "A women's-specific fit",
        ],
        1,
        "New Balance uses \"X\" to mark the newer, softer, bouncier Fresh Foam formulation.",
      ],
      [
        "Fresh Foam's midsole geometry is sculpted using:",
        [
          "Random foam pours",
          "Data-driven hexagonal foam pods",
          "Carbon-plate inserts",
          "An air bladder",
        ],
        1,
        "Fresh Foam midsoles are tuned with hexagonal pods that vary by location to shape ride feel.",
      ],
      [
        "Compared to FuelCell, Fresh Foam X is positioned as:",
        [
          "A high-energy racing platform",
          "A softer, plush daily-trainer platform",
          "A walking-shoe-only material",
          "A waterproof outsole",
        ],
        1,
        "FuelCell is NB's race/speed foam; Fresh Foam X is the cushioned daily ride.",
      ],
      [
        "Fresh Foam X is featured most prominently in which NB family?",
        [
          "990v6",
          "1080",
          "327",
          "574",
        ],
        1,
        "The 1080 is NB's premium-cushion Fresh Foam X flagship.",
      ],
    ],
  },
  {
    id: "video-quiz-v05",
    videoId: "v05",
    title: "Pronation Check",
    category: "technique",
    description: "Recognizing pronation, overpronation, and what each foot needs.",
    questions: [
      [
        "Pronation is best defined as:",
        [
          "The natural inward roll of the foot during the gait cycle",
          "The forward push-off from the toes",
          "The outward roll of the foot",
          "The pause between steps",
        ],
        0,
        "Pronation is the normal inward roll that helps the foot absorb impact.",
      ],
      [
        "Overpronation describes a foot that:",
        [
          "Rolls outward excessively",
          "Rolls inward excessively, often paired with a low arch",
          "Stays perfectly neutral",
          "Doesn't move at all during stance",
        ],
        1,
        "Overpronators collapse too far inward and often benefit from stability shoes.",
      ],
      [
        "Heavy wear on the inside (medial) edge of an old shoe suggests:",
        [
          "Supination",
          "Overpronation",
          "Neutral gait",
          "A worn lacing system",
        ],
        1,
        "Medial wear shows the foot is rolling too far inward through the stride.",
      ],
      [
        "A neutral pronator typically does best in:",
        [
          "A motion-control shoe",
          "A neutral, cushioned shoe",
          "A racing flat with no cushion",
          "A rigid hiking boot",
        ],
        1,
        "Neutral feet don't need corrective posting — neutral cushion rides best.",
      ],
    ],
  },
  {
    id: "video-quiz-v06",
    videoId: "v06",
    title: "Brannock Device Check",
    category: "technique",
    description: "Measuring properly: weight, both feet, and arch length.",
    questions: [
      [
        "The Brannock device measures:",
        [
          "Foot length only",
          "Foot length, width, and arch length",
          "Calf circumference",
          "Outsole wear pattern",
        ],
        1,
        "All three measurements matter — length, width, and arch length.",
      ],
      [
        "The customer should be measured:",
        [
          "Sitting down with no weight on the device",
          "Standing with full weight on the device",
          "Wearing thick socks while seated",
          "With one foot lifted off the ground",
        ],
        1,
        "Feet spread under load — standing weight gives the true working size.",
      ],
      [
        "When heel-to-toe length and arch length differ, you should:",
        [
          "Always use heel-to-toe length",
          "Always use arch length",
          "Go with the larger of the two measurements",
          "Average the two values",
        ],
        2,
        "Picking the larger value protects the longest part of the foot inside the shoe.",
      ],
      [
        "You should measure:",
        [
          "Only the dominant foot",
          "Both feet, at every visit",
          "Only at the customer's first appointment",
          "Only the larger foot",
        ],
        1,
        "Up to 80% of people have asymmetric feet — measure both, fit to the larger.",
      ],
    ],
  },
  {
    id: "video-quiz-v07",
    videoId: "v07",
    title: "Running Shoe Selection Check",
    category: "technique",
    description: "Matching runners to shoes — fit, replacement, and try-on.",
    questions: [
      [
        "The most important first step in matching a runner to a shoe is:",
        [
          "Picking the trendiest model",
          "Identifying foot shape, arch type, and gait",
          "Matching the color to their outfit",
          "Starting with the cheapest pair",
        ],
        1,
        "Fit and biomechanics drive the recommendation — style and price come later.",
      ],
      [
        "Running shoes generally need to be replaced every:",
        [
          "50–100 miles",
          "300–500 miles",
          "1,000–1,500 miles",
          "Two years regardless of mileage",
        ],
        1,
        "Midsole foam compresses and loses rebound after roughly 300–500 miles of running.",
      ],
      [
        "When trying on running shoes, a customer should:",
        [
          "Wear their thinnest socks for the tightest possible fit",
          "Wear their running socks and leave a thumb's width at the toe",
          "Pick a snug heel-to-toe fit with no extra room",
          "Always size down half a size",
        ],
        1,
        "A thumb's width at the toe accounts for forward foot slide and end-of-day swelling.",
      ],
      [
        "A heavy heel-striker who runs long distances is best served by:",
        [
          "A zero-drop minimalist shoe",
          "A cushioned trainer with adequate heel stack",
          "A track spike",
          "A skate shoe",
        ],
        1,
        "Heel-strike running benefits from rearfoot cushion and a moderate heel-to-toe drop.",
      ],
    ],
  },
  {
    id: "video-quiz-v08",
    videoId: "v08",
    title: "Gait Analysis Check",
    category: "technique",
    description: "Phases of gait, what to watch for, and the old-shoe tell.",
    questions: [
      [
        "The gait cycle is broken into two main phases:",
        [
          "Lift and drop",
          "Stance and swing",
          "Front and back",
          "Run and walk",
        ],
        1,
        "Stance = foot on the ground; swing = foot in the air.",
      ],
      [
        "During a normal stance phase, the foot:",
        [
          "Stays completely rigid",
          "Strikes, rolls inward (pronates), then pushes off",
          "Rolls only outward",
          "Lifts straight up",
        ],
        1,
        "Normal stance: heel strike → pronation for absorption → toe-off.",
      ],
      [
        "Filming a customer walking on a treadmill from behind helps reveal:",
        [
          "Their height",
          "Their pronation pattern and rearfoot motion",
          "Only their stride length",
          "Their shoe brand",
        ],
        1,
        "A rear view shows exactly how the heel and rearfoot move under load.",
      ],
      [
        "The first thing to check on a customer's old shoes is:",
        [
          "The brand label",
          "The outsole wear pattern",
          "The lace condition",
          "The tongue length",
        ],
        1,
        "Wear patterns tell you how the foot is actually striking and rolling.",
      ],
    ],
  },
  {
    id: "video-quiz-v09",
    videoId: "v09",
    title: "Pronation vs Supination Check",
    category: "technique",
    description: "Spotting supinators and steering them to the right category.",
    questions: [
      [
        "Supination (underpronation) is:",
        [
          "Excessive inward foot roll",
          "Insufficient inward roll — the foot stays on its outside edge",
          "A perfectly neutral gait",
          "Backwards walking",
        ],
        1,
        "Supinators don't pronate enough, so impact stays on the outside edge.",
      ],
      [
        "Wear on the outside (lateral) edge of an old shoe suggests:",
        [
          "Overpronation",
          "Supination",
          "Neutral gait",
          "Improper lacing",
        ],
        1,
        "Lateral wear is the signature pattern of underpronation.",
      ],
      [
        "The best shoe category for a supinator is:",
        [
          "Motion-control or heavy stability",
          "Neutral, well-cushioned",
          "Minimalist zero-drop",
          "Steel-toed work boot",
        ],
        1,
        "Supinators need cushion to compensate for poor shock absorption — not corrective posting.",
      ],
      [
        "Putting a supinator into a heavy stability shoe will likely:",
        [
          "Fix their pronation",
          "Push them further onto the outer edge and worsen discomfort",
          "Have no effect at all",
          "Make them faster",
        ],
        1,
        "Medial posts meant for overpronators shove supinators even further outward — wrong direction.",
      ],
    ],
  },
].map((quiz) => ({
  ...quiz,
  question_count: quiz.questions.length,
  questions: quiz.questions.map((q, i) =>
    mkQuestion(quiz.id, i, q[0], q[1], q[2], q[3]),
  ),
}));

/**
 * Find the comprehension quiz attached to a Learn-tab video, if one exists.
 * Used by the player modal's "Quiz me on this" button.
 */
export function getQuizForVideo(videoId) {
  return VIDEO_QUIZZES.find((q) => q.videoId === videoId) || null;
}
