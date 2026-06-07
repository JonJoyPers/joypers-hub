-- Two extensions to the academy schema for the Learn-tab content sync:
--   1. academy_questions.explanation — short note shown after the
--      employee picks an answer. The hardcoded VIDEO_QUIZZES in
--      src/data/academyContent.js already carry these.
--   2. academy_videos.quiz_id — optional link from a Learn-tab video to
--      its comprehension quiz, so the mobile player's "Quiz me on this"
--      button can find the right quiz once content lives in Supabase.

ALTER TABLE academy_questions
  ADD COLUMN IF NOT EXISTS explanation text;

ALTER TABLE academy_videos
  ADD COLUMN IF NOT EXISTS quiz_id integer
    REFERENCES academy_quizzes(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS academy_videos_quiz_id_idx
  ON academy_videos(quiz_id);
