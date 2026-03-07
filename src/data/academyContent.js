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
      { id: "v01", title: "Hoka Technology Overview", source: "Hoka", duration: "3:45", url: "https://www.youtube.com/watch?v=qGGSzn_kEJU" },
      { id: "v02", title: "Brooks DNA LOFT Explained", source: "Brooks Running", duration: "2:30", url: "https://www.youtube.com/watch?v=i-OhM9s3o_8" },
      { id: "v03", title: "ASICS GEL Technology", source: "ASICS", duration: "4:12", url: "https://www.youtube.com/watch?v=4F9mETGCMmE" },
      { id: "v04", title: "New Balance Fresh Foam X", source: "New Balance", duration: "2:58", url: "https://www.youtube.com/watch?v=WNms8aF6yKA" },
    ],
  },
  {
    category: "Foot Health & Fitting",
    videos: [
      { id: "v05", title: "Understanding Pronation", source: "Runner's World", duration: "5:20", url: "https://www.youtube.com/watch?v=Y_1rQWkIb6o" },
      { id: "v06", title: "How to Use a Brannock Device", source: "Aetrex", duration: "3:15", url: "https://www.youtube.com/watch?v=ePJ1MVs1Z_M" },
      { id: "v07", title: "Choosing the Right Running Shoe", source: "REI", duration: "6:30", url: "https://www.youtube.com/watch?v=dEkUq-Rs-Tc" },
    ],
  },
  {
    category: "Gait & Biomechanics",
    videos: [
      { id: "v08", title: "Gait Analysis Basics", source: "PhysioTutors", duration: "7:45", url: "https://www.youtube.com/watch?v=brFM6ByxGBA" },
      { id: "v09", title: "Overpronation vs Supination", source: "The Run Experience", duration: "4:50", url: "https://www.youtube.com/watch?v=MbVPH8F8mMI" },
    ],
  },
];
