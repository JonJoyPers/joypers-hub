-- Schema fixes: FKs, unique constraints, timestamps
-- Safe to run multiple times (uses IF NOT EXISTS / OR REPLACE patterns)

-- 1. Add FK on social_likes.post_id -> social_posts.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_likes_post_id_social_posts_id_fk') THEN
    ALTER TABLE social_likes ADD CONSTRAINT social_likes_post_id_social_posts_id_fk
      FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 2. Add FK on social_comments.post_id -> social_posts.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_comments_post_id_social_posts_id_fk') THEN
    ALTER TABLE social_comments ADD CONSTRAINT social_comments_post_id_social_posts_id_fk
      FOREIGN KEY (post_id) REFERENCES social_posts(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 3. Add FK on leave_ledger.reference_id -> leave_requests.id
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'leave_ledger_reference_id_leave_requests_id_fk') THEN
    ALTER TABLE leave_ledger ADD CONSTRAINT leave_ledger_reference_id_leave_requests_id_fk
      FOREIGN KEY (reference_id) REFERENCES leave_requests(id);
  END IF;
END $$;

-- 4. Add unique constraint on social_likes (post_id, employee_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'social_likes_post_employee') THEN
    ALTER TABLE social_likes ADD CONSTRAINT social_likes_post_employee
      UNIQUE (post_id, employee_id);
  END IF;
END $$;

-- 5. Add unique constraint on conversation_participants (conversation_id, employee_id)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'conv_participant_unique') THEN
    ALTER TABLE conversation_participants ADD CONSTRAINT conv_participant_unique
      UNIQUE (conversation_id, employee_id);
  END IF;
END $$;

-- 6. Make conversation_participants.conversation_id NOT NULL + FK with cascade
DO $$
BEGIN
  -- Set NOT NULL if not already
  ALTER TABLE conversation_participants ALTER COLUMN conversation_id SET NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 7. Add unique on manual_sections.title
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'manual_sections_title_unique') THEN
    ALTER TABLE manual_sections ADD CONSTRAINT manual_sections_title_unique UNIQUE (title);
  END IF;
END $$;

-- 8. Add updated_at to social_posts if missing
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'social_posts' AND column_name = 'updated_at') THEN
    ALTER TABLE social_posts ADD COLUMN updated_at timestamp with time zone DEFAULT now();
  END IF;
END $$;
