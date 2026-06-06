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
    description: "The PROFLY, Active Foot Frame, and Meta-Rocker exactly as Hoka explains them.",
    questions: [
      [
        "In the video, the Active Foot Frame is compared to:",
        [
          "A motorcycle helmet",
          "A bucket seat in a race car",
          "A backpack frame",
          "A hammock",
        ],
        1,
        "Hoka's narrator uses the bucket-seat analogy — the foot sits into the midsole rather than on top of it.",
      ],
      [
        "How does the PROFLY midsole arrange its two foam densities?",
        [
          "Same foam everywhere — just one density",
          "Firmer foam under the heel, softer under the toes",
          "Softer foam under the heel, firmer foam under the toes",
          "Two layers stacked vertically — firmer on top, softer on bottom",
        ],
        2,
        "The video specifies soft foam under the heel for a plush landing, firmer foam under the toes for a snappier push-off.",
      ],
      [
        "The Meta-Rocker is built into the shoe at:",
        [
          "The heel only",
          "The forefoot only",
          "Both the heel and the forefoot, near the metatarsal joints",
          "The lace eyelets",
        ],
        2,
        "Curvature is built into both ends of the mid/outsole near the metatarsal joints, complementing your natural stride.",
      ],
      [
        "What does the Meta-Rocker do to the height difference between heel and toe?",
        [
          "Increases it for more lift",
          "Keeps it the same as a normal shoe",
          "Reduces it, and propels you forward",
          "Eliminates it entirely (zero drop)",
        ],
        2,
        "Per the video, Meta-Rocker reduces heel-to-toe height difference and propels you forward through the stride.",
      ],
    ],
  },
  {
    id: "video-quiz-v02",
    videoId: "v02",
    title: "Brooks Aurora BL Check",
    category: "product",
    description: "The Aurora BL launch spot — Blue Line, DNA LOFT v3, and Glide Roll.",
    questions: [
      [
        "The shoe featured in the video is called the:",
        [
          "Brooks Glycerin Max",
          "Aurora BL",
          "Adrenaline GTS",
          "Brooks Ghost",
        ],
        1,
        "The spot launches the Aurora BL — a limited-edition release from Brooks's Blue Line innovation team.",
      ],
      [
        "\"Blue Line\" in the video refers to:",
        [
          "A Brooks colorway",
          "Brooks's forward-thinking footwear engineering and innovation team",
          "A trail marathon series",
          "The lacing system",
        ],
        1,
        "Blue Line is Brooks's innovation lab — where engineers prototype the brand's most advanced gear.",
      ],
      [
        "Per the video, DNA LOFT v3 is the first ever:",
        [
          "Carbon-plated foam",
          "Recycled-rubber foam",
          "Nitrogen-injected DNA LOFT",
          "Gel-based DNA LOFT",
        ],
        2,
        "The Aurora BL debuted the first nitrogen-injected DNA LOFT v3, delivering softer, lighter, more responsive strides.",
      ],
      [
        "The shoe's Glide Roll technology is described as:",
        [
          "A small wheel set under the heel",
          "A strategically shaped heel and toe with independent forefoot and heel for smooth transitions",
          "A rolling lace tightening system",
          "A removable arch insert",
        ],
        1,
        "Glide Roll = the heel/toe shaping plus independent forefoot and heel, giving smooth transitions and an effortless foot strike.",
      ],
    ],
  },
  {
    id: "video-quiz-v03",
    videoId: "v03",
    title: "ASICS GEL Check",
    category: "product",
    description: "Straight from the ASICS engineer — what GEL solves and how it works.",
    questions: [
      [
        "Per the engineer, the problem GEL is designed to solve is:",
        [
          "Sweaty feet inside the shoe",
          "The huge impact runners receive from the ground",
          "Outsole wear over time",
          "Heat buildup in the midsole",
        ],
        1,
        "The engineer explains GEL exists because runners receive huge impact from the ground during running — and that impact is an injury risk.",
      ],
      [
        "The technical property the engineer uses to describe how GEL absorbs impact is:",
        [
          "Compression cushioning",
          "Shear deformation",
          "Tensile stretching",
          "Air displacement",
        ],
        1,
        "The video calls it out by name — \"shear deformation.\" The specific gel shape deforms a lot under load, soaking up the impact.",
      ],
      [
        "Which ASICS model does the engineer call out as a personal favorite?",
        [
          "GEL-Kayano",
          "Cumulus",
          "Novablast",
          "Metaspeed Sky",
        ],
        1,
        "The engineer names the Cumulus — its GEL has \"excellent absorption property\" and a very specific structure.",
      ],
      [
        "Sources of inspiration the engineer cites include:",
        [
          "Concrete and steel beams",
          "His cat or dog and a kitchen sponge",
          "Race cars and motorcycles",
          "Birds and fish",
        ],
        1,
        "He says he gets inspiration from his cat or dog, and from looking at a kitchen sponge every morning.",
      ],
    ],
  },
  // v04 has no captions on YouTube (the Fresh Foam X video is music + visuals
  // only), so this quiz stays on generic Fresh Foam X subject-matter knowledge
  // rather than video-specific quotes. Worth revisiting if we swap in a video
  // with an actual voiceover.
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
    description: "The three pronation types, the wet-footprint test, and when to send to a pro.",
    questions: [
      [
        "Per the video, the three main types of pronation are:",
        [
          "Light, medium, heavy",
          "Neutral, over-pronation, under-pronation (supination)",
          "Inside, outside, neutral",
          "Sprinter, jogger, walker",
        ],
        1,
        "The video defines three types: neutral, over-pronation, and under-pronation — also called supination.",
      ],
      [
        "In the wet footprint test, a full footprint with little arch visible suggests:",
        [
          "Neutral pronation",
          "Under-pronation",
          "Over-pronation or flat feet",
          "A very high arch",
        ],
        2,
        "Per the video: a full footprint with little arch shape indicates over-pronation or flat feet.",
      ],
      [
        "The video describes the shoe-wear and wet-footprint tests as:",
        [
          "Definitive medical diagnostics",
          "Rough guides that shouldn't be relied on alone",
          "Replacements for professional gait analysis",
          "Useful only for sprinters",
        ],
        1,
        "The video repeatedly calls these methods a \"rough guide\" — don't rely solely on them.",
      ],
      [
        "For the most accurate pronation assessment, the video recommends:",
        [
          "Buying several pairs and comparing how they feel",
          "Doing the mirror test more carefully",
          "Visiting a running store or podiatrist for a gait analysis",
          "Watching slow-motion videos of yourself on your phone",
        ],
        2,
        "The video says the most accurate path is a professional gait analysis — often using treadmill video — at a running store or podiatrist.",
      ],
    ],
  },
  {
    id: "video-quiz-v06",
    videoId: "v06",
    title: "Brannock Device Check",
    category: "technique",
    description: "Foot Geekz on weight-bearing measurement, the side slider, and the longest toe.",
    questions: [
      [
        "According to the video, the Brannock device has been used in the shoe industry for:",
        [
          "About 25 years",
          "About 50 years",
          "Over 100 years",
          "Just a few decades",
        ],
        2,
        "The narrator notes the device has been in use for over 100 years.",
      ],
      [
        "The video says the customer should be measured:",
        [
          "Sitting down with no weight",
          "Standing up with full weight on the device",
          "Lying on their back",
          "With one foot lifted off the ground",
        ],
        1,
        "Standing weight lets the foot splay — the arch may drop and the foot elongates, so sitting gives an inaccurate measurement.",
      ],
      [
        "If a customer's second or third toe is longer than their big toe, you should:",
        [
          "Always measure to the big toe anyway",
          "Measure to whichever toe is longest",
          "Subtract half a size to compensate",
          "Skip the length measurement entirely",
        ],
        1,
        "Always measure to the longest toe so no toe ends up squeezed inside the shoe.",
      ],
      [
        "The small slider on the side of the device is used to measure:",
        [
          "Heel-to-toe length",
          "Arch length",
          "Width only",
          "Sock thickness",
        ],
        1,
        "The side slider measures arch length, which can differ from heel-to-toe length and matters especially for pronators whose arches elongate.",
      ],
    ],
  },
  {
    id: "video-quiz-v07",
    videoId: "v07",
    title: "REI Trail Shoe Check",
    category: "technique",
    description: "Trail shoe categories, drop, and how REI says to pick.",
    questions: [
      [
        "This REI video focuses specifically on:",
        [
          "Track racing spikes",
          "Trail running shoes",
          "Cross-trainers for the gym",
          "Walking shoes",
        ],
        1,
        "REI's guide is about trail running shoes — not road shoes or training shoes.",
      ],
      [
        "The three trail shoe categories the video covers are:",
        [
          "Road, race, recovery",
          "Light trail, rugged trail, off-trail",
          "Daily, long-run, recovery",
          "Easy, medium, hard",
        ],
        1,
        "Light trail (smooth groomed trails), rugged trail (technical singletrack), off-trail (heaviest, most protective).",
      ],
      [
        "A shoe with a 0–4 mm heel-to-toe drop encourages you to land:",
        [
          "On your heel",
          "On your forefoot or midfoot",
          "Sideways on the lateral edge",
          "With your full sole flat",
        ],
        1,
        "Per the video, low drop (0–4 mm) encourages forefoot/midfoot landing; higher drop (8–12 mm) encourages heel striking.",
      ],
      [
        "Per the video, the easiest way to pick a new shoe's drop is to:",
        [
          "Always go zero-drop",
          "Pick the highest drop available",
          "Match the drop of your current running or athletic shoes",
          "Drop a millimeter every six months",
        ],
        2,
        "If you don't know what drop is right, the video says match what you're already used to — your stride doesn't have to change.",
      ],
    ],
  },
  {
    id: "video-quiz-v08",
    videoId: "v08",
    title: "Gait Analysis Check",
    category: "technique",
    description: "The three-angle DIY gait analysis the video walks through.",
    questions: [
      [
        "Per the video, you should have a friend record you from how many angles?",
        [
          "One — just from behind",
          "Two — front and side",
          "Three — back, front, and side",
          "Four — back, front, side, and overhead",
        ],
        2,
        "The video specifies three angles: back, front, and side — each shows something different.",
      ],
      [
        "During the recording, the video recommends being:",
        [
          "In your most cushioned trainers",
          "In motion-control shoes",
          "Barefoot or in neutral shoes",
          "In racing flats",
        ],
        2,
        "Neutral or barefoot keeps cushioning and posting from masking your natural mechanics.",
      ],
      [
        "The back-view recording is best for spotting:",
        [
          "Stride length",
          "Arm swing",
          "Excessive inward or outward heel rolling (pronation/supination)",
          "Shoe brand",
        ],
        2,
        "From behind, you can see how the heel strikes and whether it rolls excessively in or out.",
      ],
      [
        "Per the video, the front-view recording lets you check:",
        [
          "Whether your knees track over your feet or collapse inward",
          "Your foot strike pattern only",
          "Your shoe color",
          "Your arm swing only",
        ],
        0,
        "The front view exposes knee tracking — inward collapse is a common alignment issue worth catching.",
      ],
    ],
  },
  {
    id: "video-quiz-v09",
    videoId: "v09",
    title: "Pronation vs Supination Check",
    category: "technique",
    description: "The PT's anatomical breakdown — the three motions that make up each.",
    questions: [
      [
        "The PT describes pronation as the foot:",
        [
          "Rolling outward off the ground",
          "Flattening to the ground as you step over it and put weight through it",
          "Lifting completely off the ground",
          "Landing rigid with no movement",
        ],
        1,
        "Per the video, pronation = the foot flattening to the ground as you load it through the stride.",
      ],
      [
        "Per the video, pronation is the combination of:",
        [
          "Plantarflexion, adduction, and inversion",
          "Dorsiflexion, abduction, and eversion",
          "Inversion, eversion, and rotation",
          "Flexion, extension, and rotation",
        ],
        1,
        "The video defines pronation as dorsiflexion + abduction + eversion at the foot.",
      ],
      [
        "Per the video, supination is the combination of:",
        [
          "Dorsiflexion, abduction, and eversion",
          "Plantarflexion, adduction, and inversion",
          "Flexion, extension, and rotation",
          "Rotation, eversion, and abduction",
        ],
        1,
        "Supination is the opposite triad: plantarflexion + adduction + inversion.",
      ],
      [
        "The PT describes the supinated foot as a:",
        [
          "Flat foot",
          "Pronated foot",
          "High-arched foot",
          "Neutral foot",
        ],
        2,
        "Supination is associated with the high-arched foot per the video.",
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
