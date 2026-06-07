-- One-time seed of the 9 Learn-tab modules/videos/quizzes/36 questions
-- so the web portal and the mobile app's Supabase path share the same
-- content as the hardcoded fallback in src/data/academyContent.js.
--
-- Idempotent: skips entirely if academy_modules already has any rows,
-- so re-applying this migration is safe.
--
-- Question content matches the transcript-aligned rewrite in commit
-- 61cad0a (or current academyContent.js). Quiz v04 (Fresh Foam X) has
-- no captioned source video, so its questions stay on generic Fresh
-- Foam X product knowledge — revisit if/when that video is replaced.

DO $$
DECLARE
  mod_tech    int;
  mod_health  int;
  mod_gait    int;
  q01 int; q02 int; q03 int; q04 int;
  q05 int; q06 int; q07 int;
  q08 int; q09 int;
BEGIN
  IF EXISTS (SELECT 1 FROM academy_modules) THEN
    RAISE NOTICE 'academy_modules already populated — skipping seed';
    RETURN;
  END IF;

  ------------------------------------------------------------------
  -- Modules (one per VIDEO_RESOURCES category)
  ------------------------------------------------------------------
  INSERT INTO academy_modules (title, description, category, is_active)
    VALUES ('Shoe Technology',
            'Brand-specific midsole, foam, and rocker technologies from Hoka, Brooks, ASICS, and New Balance.',
            'Shoe Technology', true)
    RETURNING id INTO mod_tech;

  INSERT INTO academy_modules (title, description, category, is_active)
    VALUES ('Foot Health & Fitting',
            'Pronation, the Brannock device, and how to match runners to the right shoe.',
            'Foot Health & Fitting', true)
    RETURNING id INTO mod_health;

  INSERT INTO academy_modules (title, description, category, is_active)
    VALUES ('Gait & Biomechanics',
            'How to perform a basic gait analysis and recognize pronation vs supination.',
            'Gait & Biomechanics', true)
    RETURNING id INTO mod_gait;

  ------------------------------------------------------------------
  -- Quizzes (9 — one per Learn-tab video)
  ------------------------------------------------------------------
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('Hoka Technology Check', 'Product Knowledge', true)
    RETURNING id INTO q01;
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('Brooks Aurora BL Check', 'Product Knowledge', true)
    RETURNING id INTO q02;
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('ASICS GEL Check', 'Product Knowledge', true)
    RETURNING id INTO q03;
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('Fresh Foam X Check', 'Product Knowledge', true)
    RETURNING id INTO q04;
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('Pronation Check', 'Foot Health & Fitting', true)
    RETURNING id INTO q05;
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('Brannock Device Check', 'Foot Health & Fitting', true)
    RETURNING id INTO q06;
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('REI Trail Shoe Check', 'Foot Health & Fitting', true)
    RETURNING id INTO q07;
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('Gait Analysis Check', 'Gait & Biomechanics', true)
    RETURNING id INTO q08;
  INSERT INTO academy_quizzes (title, category, is_active)
    VALUES ('Pronation vs Supination Check', 'Gait & Biomechanics', true)
    RETURNING id INTO q09;

  ------------------------------------------------------------------
  -- Videos (linked to module and to the matching quiz)
  ------------------------------------------------------------------
  INSERT INTO academy_videos (module_id, title, url, duration, source, sort_order, quiz_id)
  VALUES
    (mod_tech,   'Hoka Technology Overview',       'https://www.youtube.com/watch?v=e4Isj2ZqQb4', '', 'HOKA TV',                0, q01),
    (mod_tech,   'Brooks DNA LOFT v3 Explained',   'https://www.youtube.com/watch?v=2A8IUWovPLM', '', 'Brooks Running',         1, q02),
    (mod_tech,   'ASICS GEL Technology',           'https://www.youtube.com/watch?v=1cJvW7Tjb38', '', 'ASICS',                  2, q03),
    (mod_tech,   'New Balance Fresh Foam X',       'https://www.youtube.com/watch?v=lEK6z2uQzkg', '', 'New Balance',            3, q04),
    (mod_health, 'Understanding Pronation',        'https://www.youtube.com/watch?v=nCqL-wqAxDw', '', 'All Sorts Of Running',   0, q05),
    (mod_health, 'How to Use a Brannock Device',   'https://www.youtube.com/watch?v=khsBN-3tF0c', '', 'Foot Geekz',             1, q06),
    (mod_health, 'Choosing the Right Running Shoe','https://www.youtube.com/watch?v=bJOTN_D6tMk', '', 'REI',                    2, q07),
    (mod_gait,   'Gait Analysis Basics',           'https://www.youtube.com/watch?v=fwSu98yvgCY', '', 'Athletes Training Room', 0, q08),
    (mod_gait,   'Pronation vs Supination Explained','https://www.youtube.com/watch?v=4P0509Yhq7Y','', 'Next Level PT',         1, q09);

  ------------------------------------------------------------------
  -- Questions (4 per quiz, 36 total). options is jsonb (array of 4
  -- strings); correct_index is 0-based.
  ------------------------------------------------------------------

  -- q01 — Hoka
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q01, 'In the video, the Active Foot Frame is compared to:',
          '["A motorcycle helmet","A bucket seat in a race car","A backpack frame","A hammock"]'::jsonb,
          1,
          'Hoka''s narrator uses the bucket-seat analogy — the foot sits into the midsole rather than on top of it.',
          0),
    (q01, 'How does the PROFLY midsole arrange its two foam densities?',
          '["Same foam everywhere — just one density","Firmer foam under the heel, softer under the toes","Softer foam under the heel, firmer foam under the toes","Two layers stacked vertically — firmer on top, softer on bottom"]'::jsonb,
          2,
          'The video specifies soft foam under the heel for a plush landing, firmer foam under the toes for a snappier push-off.',
          1),
    (q01, 'The Meta-Rocker is built into the shoe at:',
          '["The heel only","The forefoot only","Both the heel and the forefoot, near the metatarsal joints","The lace eyelets"]'::jsonb,
          2,
          'Curvature is built into both ends of the mid/outsole near the metatarsal joints, complementing your natural stride.',
          2),
    (q01, 'What does the Meta-Rocker do to the height difference between heel and toe?',
          '["Increases it for more lift","Keeps it the same as a normal shoe","Reduces it, and propels you forward","Eliminates it entirely (zero drop)"]'::jsonb,
          2,
          'Per the video, Meta-Rocker reduces heel-to-toe height difference and propels you forward through the stride.',
          3);

  -- q02 — Brooks Aurora BL
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q02, 'The shoe featured in the video is called the:',
          '["Brooks Glycerin Max","Aurora BL","Adrenaline GTS","Brooks Ghost"]'::jsonb,
          1,
          'The spot launches the Aurora BL — a limited-edition release from Brooks''s Blue Line innovation team.',
          0),
    (q02, '"Blue Line" in the video refers to:',
          '["A Brooks colorway","Brooks''s forward-thinking footwear engineering and innovation team","A trail marathon series","The lacing system"]'::jsonb,
          1,
          'Blue Line is Brooks''s innovation lab — where engineers prototype the brand''s most advanced gear.',
          1),
    (q02, 'Per the video, DNA LOFT v3 is the first ever:',
          '["Carbon-plated foam","Recycled-rubber foam","Nitrogen-injected DNA LOFT","Gel-based DNA LOFT"]'::jsonb,
          2,
          'The Aurora BL debuted the first nitrogen-injected DNA LOFT v3, delivering softer, lighter, more responsive strides.',
          2),
    (q02, 'The shoe''s Glide Roll technology is described as:',
          '["A small wheel set under the heel","A strategically shaped heel and toe with independent forefoot and heel for smooth transitions","A rolling lace tightening system","A removable arch insert"]'::jsonb,
          1,
          'Glide Roll = the heel/toe shaping plus independent forefoot and heel, giving smooth transitions and an effortless foot strike.',
          3);

  -- q03 — ASICS GEL
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q03, 'Per the engineer, the problem GEL is designed to solve is:',
          '["Sweaty feet inside the shoe","The huge impact runners receive from the ground","Outsole wear over time","Heat buildup in the midsole"]'::jsonb,
          1,
          'The engineer explains GEL exists because runners receive huge impact from the ground during running — and that impact is an injury risk.',
          0),
    (q03, 'The technical property the engineer uses to describe how GEL absorbs impact is:',
          '["Compression cushioning","Shear deformation","Tensile stretching","Air displacement"]'::jsonb,
          1,
          'The video calls it out by name — "shear deformation." The specific gel shape deforms a lot under load, soaking up the impact.',
          1),
    (q03, 'Which ASICS model does the engineer call out as a personal favorite?',
          '["GEL-Kayano","Cumulus","Novablast","Metaspeed Sky"]'::jsonb,
          1,
          'The engineer names the Cumulus — its GEL has "excellent absorption property" and a very specific structure.',
          2),
    (q03, 'Sources of inspiration the engineer cites include:',
          '["Concrete and steel beams","His cat or dog and a kitchen sponge","Race cars and motorcycles","Birds and fish"]'::jsonb,
          1,
          'He says he gets inspiration from his cat or dog, and from looking at a kitchen sponge every morning.',
          3);

  -- q04 — Fresh Foam X (no captions on source video — generic subject-matter)
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q04, 'The "X" in Fresh Foam X signals:',
          '["An extra-wide last","An evolved, more cushioned and responsive version of Fresh Foam","A racing-only model","A women''s-specific fit"]'::jsonb,
          1,
          'New Balance uses "X" to mark the newer, softer, bouncier Fresh Foam formulation.',
          0),
    (q04, 'Fresh Foam''s midsole geometry is sculpted using:',
          '["Random foam pours","Data-driven hexagonal foam pods","Carbon-plate inserts","An air bladder"]'::jsonb,
          1,
          'Fresh Foam midsoles are tuned with hexagonal pods that vary by location to shape ride feel.',
          1),
    (q04, 'Compared to FuelCell, Fresh Foam X is positioned as:',
          '["A high-energy racing platform","A softer, plush daily-trainer platform","A walking-shoe-only material","A waterproof outsole"]'::jsonb,
          1,
          'FuelCell is NB''s race/speed foam; Fresh Foam X is the cushioned daily ride.',
          2),
    (q04, 'Fresh Foam X is featured most prominently in which NB family?',
          '["990v6","1080","327","574"]'::jsonb,
          1,
          'The 1080 is NB''s premium-cushion Fresh Foam X flagship.',
          3);

  -- q05 — Understanding Pronation
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q05, 'Per the video, the three main types of pronation are:',
          '["Light, medium, heavy","Neutral, over-pronation, under-pronation (supination)","Inside, outside, neutral","Sprinter, jogger, walker"]'::jsonb,
          1,
          'The video defines three types: neutral, over-pronation, and under-pronation — also called supination.',
          0),
    (q05, 'In the wet footprint test, a full footprint with little arch visible suggests:',
          '["Neutral pronation","Under-pronation","Over-pronation or flat feet","A very high arch"]'::jsonb,
          2,
          'Per the video: a full footprint with little arch shape indicates over-pronation or flat feet.',
          1),
    (q05, 'The video describes the shoe-wear and wet-footprint tests as:',
          '["Definitive medical diagnostics","Rough guides that shouldn''t be relied on alone","Replacements for professional gait analysis","Useful only for sprinters"]'::jsonb,
          1,
          'The video repeatedly calls these methods a "rough guide" — don''t rely solely on them.',
          2),
    (q05, 'For the most accurate pronation assessment, the video recommends:',
          '["Buying several pairs and comparing how they feel","Doing the mirror test more carefully","Visiting a running store or podiatrist for a gait analysis","Watching slow-motion videos of yourself on your phone"]'::jsonb,
          2,
          'The video says the most accurate path is a professional gait analysis — often using treadmill video — at a running store or podiatrist.',
          3);

  -- q06 — Brannock Device
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q06, 'According to the video, the Brannock device has been used in the shoe industry for:',
          '["About 25 years","About 50 years","Over 100 years","Just a few decades"]'::jsonb,
          2,
          'The narrator notes the device has been in use for over 100 years.',
          0),
    (q06, 'The video says the customer should be measured:',
          '["Sitting down with no weight","Standing up with full weight on the device","Lying on their back","With one foot lifted off the ground"]'::jsonb,
          1,
          'Standing weight lets the foot splay — the arch may drop and the foot elongates, so sitting gives an inaccurate measurement.',
          1),
    (q06, 'If a customer''s second or third toe is longer than their big toe, you should:',
          '["Always measure to the big toe anyway","Measure to whichever toe is longest","Subtract half a size to compensate","Skip the length measurement entirely"]'::jsonb,
          1,
          'Always measure to the longest toe so no toe ends up squeezed inside the shoe.',
          2),
    (q06, 'The small slider on the side of the device is used to measure:',
          '["Heel-to-toe length","Arch length","Width only","Sock thickness"]'::jsonb,
          1,
          'The side slider measures arch length, which can differ from heel-to-toe length and matters especially for pronators whose arches elongate.',
          3);

  -- q07 — REI Trail Shoe
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q07, 'This REI video focuses specifically on:',
          '["Track racing spikes","Trail running shoes","Cross-trainers for the gym","Walking shoes"]'::jsonb,
          1,
          'REI''s guide is about trail running shoes — not road shoes or training shoes.',
          0),
    (q07, 'The three trail shoe categories the video covers are:',
          '["Road, race, recovery","Light trail, rugged trail, off-trail","Daily, long-run, recovery","Easy, medium, hard"]'::jsonb,
          1,
          'Light trail (smooth groomed trails), rugged trail (technical singletrack), off-trail (heaviest, most protective).',
          1),
    (q07, 'A shoe with a 0–4 mm heel-to-toe drop encourages you to land:',
          '["On your heel","On your forefoot or midfoot","Sideways on the lateral edge","With your full sole flat"]'::jsonb,
          1,
          'Per the video, low drop (0–4 mm) encourages forefoot/midfoot landing; higher drop (8–12 mm) encourages heel striking.',
          2),
    (q07, 'Per the video, the easiest way to pick a new shoe''s drop is to:',
          '["Always go zero-drop","Pick the highest drop available","Match the drop of your current running or athletic shoes","Drop a millimeter every six months"]'::jsonb,
          2,
          'If you don''t know what drop is right, the video says match what you''re already used to — your stride doesn''t have to change.',
          3);

  -- q08 — Gait Analysis Basics
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q08, 'Per the video, you should have a friend record you from how many angles?',
          '["One — just from behind","Two — front and side","Three — back, front, and side","Four — back, front, side, and overhead"]'::jsonb,
          2,
          'The video specifies three angles: back, front, and side — each shows something different.',
          0),
    (q08, 'During the recording, the video recommends being:',
          '["In your most cushioned trainers","In motion-control shoes","Barefoot or in neutral shoes","In racing flats"]'::jsonb,
          2,
          'Neutral or barefoot keeps cushioning and posting from masking your natural mechanics.',
          1),
    (q08, 'The back-view recording is best for spotting:',
          '["Stride length","Arm swing","Excessive inward or outward heel rolling (pronation/supination)","Shoe brand"]'::jsonb,
          2,
          'From behind, you can see how the heel strikes and whether it rolls excessively in or out.',
          2),
    (q08, 'Per the video, the front-view recording lets you check:',
          '["Whether your knees track over your feet or collapse inward","Your foot strike pattern only","Your shoe color","Your arm swing only"]'::jsonb,
          0,
          'The front view exposes knee tracking — inward collapse is a common alignment issue worth catching.',
          3);

  -- q09 — Pronation vs Supination (PT explainer)
  INSERT INTO academy_questions (quiz_id, question, options, correct_index, explanation, sort_order) VALUES
    (q09, 'The PT describes pronation as the foot:',
          '["Rolling outward off the ground","Flattening to the ground as you step over it and put weight through it","Lifting completely off the ground","Landing rigid with no movement"]'::jsonb,
          1,
          'Per the video, pronation = the foot flattening to the ground as you load it through the stride.',
          0),
    (q09, 'Per the video, pronation is the combination of:',
          '["Plantarflexion, adduction, and inversion","Dorsiflexion, abduction, and eversion","Inversion, eversion, and rotation","Flexion, extension, and rotation"]'::jsonb,
          1,
          'The video defines pronation as dorsiflexion + abduction + eversion at the foot.',
          1),
    (q09, 'Per the video, supination is the combination of:',
          '["Dorsiflexion, abduction, and eversion","Plantarflexion, adduction, and inversion","Flexion, extension, and rotation","Rotation, eversion, and abduction"]'::jsonb,
          1,
          'Supination is the opposite triad: plantarflexion + adduction + inversion.',
          2),
    (q09, 'The PT describes the supinated foot as a:',
          '["Flat foot","Pronated foot","High-arched foot","Neutral foot"]'::jsonb,
          2,
          'Supination is associated with the high-arched foot per the video.',
          3);

  RAISE NOTICE 'academy seed inserted: 3 modules, 9 videos, 9 quizzes, 36 questions';
END $$;
