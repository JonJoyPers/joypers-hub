-- Row Level Security Policies for Joypers-Hub
-- Run after migrations to enable RLS on all tables

-- Enable RLS
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE punches ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE bulletin_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_acknowledgments ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_comments ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is admin or manager
CREATE OR REPLACE FUNCTION is_admin_or_manager()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM employees
    WHERE id = auth.uid()
    AND role IN ('admin', 'manager')
    AND is_active = true
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- ── Locations ──
CREATE POLICY "Everyone can read locations" ON locations
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage locations" ON locations
  FOR ALL USING (is_admin_or_manager());

-- ── Employees ──
CREATE POLICY "Employees visible by role" ON employees
  FOR SELECT USING (is_active = true OR is_admin_or_manager());
CREATE POLICY "Users can update own profile" ON employees
  FOR UPDATE USING (id = auth.uid());
CREATE POLICY "Admins can manage employees" ON employees
  FOR ALL USING (is_admin_or_manager());

-- ── Shifts ──
CREATE POLICY "Everyone can read shifts" ON shifts
  FOR SELECT USING (true);
CREATE POLICY "Managers can manage shifts" ON shifts
  FOR ALL USING (is_admin_or_manager());

-- ── Punches ──
CREATE POLICY "Users can read own punches" ON punches
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Managers can read all punches" ON punches
  FOR SELECT USING (is_admin_or_manager());
CREATE POLICY "Users can create own punches" ON punches
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- ── Leave Types ──
CREATE POLICY "Everyone can read leave types" ON leave_types
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage leave types" ON leave_types
  FOR ALL USING (is_admin_or_manager());

-- ── Leave Requests ──
CREATE POLICY "Users can read own leave requests" ON leave_requests
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Managers can read all leave requests" ON leave_requests
  FOR SELECT USING (is_admin_or_manager());
CREATE POLICY "Users can create own leave requests" ON leave_requests
  FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Users can cancel own pending requests" ON leave_requests
  FOR UPDATE USING (employee_id = auth.uid() AND status = 'pending');

-- ── Leave Ledger ──
CREATE POLICY "Users can read own ledger" ON leave_ledger
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Managers can read all ledger entries" ON leave_ledger
  FOR SELECT USING (is_admin_or_manager());

-- ── Bulletin Posts ──
CREATE POLICY "Everyone can read bulletin posts" ON bulletin_posts
  FOR SELECT USING (true);
CREATE POLICY "Managers can manage bulletin posts" ON bulletin_posts
  FOR ALL USING (is_admin_or_manager());

-- ── Conversations ──
CREATE POLICY "Participants can read conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = conversations.id
      AND employee_id = auth.uid()
    )
  );
CREATE POLICY "Authenticated users can create conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ── Conversation Participants ──
CREATE POLICY "Participants can read their participations" ON conversation_participants
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Read all participants for own conversations" ON conversation_participants
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants cp
      WHERE cp.conversation_id = conversation_participants.conversation_id
      AND cp.employee_id = auth.uid()
    )
  );
CREATE POLICY "Authenticated users can add participants" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update own unread count" ON conversation_participants
  FOR UPDATE USING (employee_id = auth.uid());

-- ── Messages ──
CREATE POLICY "Participants can read messages" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND employee_id = auth.uid()
    )
  );
CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND employee_id = auth.uid()
    )
  );
CREATE POLICY "Mark messages as read" ON messages
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM conversation_participants
      WHERE conversation_id = messages.conversation_id
      AND employee_id = auth.uid()
    )
  );

-- ── Manual Sections ──
CREATE POLICY "Everyone can read manual sections" ON manual_sections
  FOR SELECT USING (true);
CREATE POLICY "Admins can manage manual sections" ON manual_sections
  FOR ALL USING (is_admin_or_manager());

-- ── Manual Acknowledgments ──
CREATE POLICY "Users can read own acknowledgments" ON manual_acknowledgments
  FOR SELECT USING (employee_id = auth.uid());
CREATE POLICY "Managers can read all acknowledgments" ON manual_acknowledgments
  FOR SELECT USING (is_admin_or_manager());
CREATE POLICY "Users can create own acknowledgments" ON manual_acknowledgments
  FOR INSERT WITH CHECK (employee_id = auth.uid());

-- ── Bulletin Posts (additional) ──
CREATE POLICY "Authenticated users can create bulletin posts" ON bulletin_posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authors can update own bulletin posts" ON bulletin_posts
  FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Authors can delete own bulletin posts" ON bulletin_posts
  FOR DELETE USING (author_id = auth.uid());

-- ── Social Posts ──
CREATE POLICY "Everyone can read social posts" ON social_posts
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON social_posts
  FOR INSERT WITH CHECK (author_id = auth.uid());
CREATE POLICY "Users can update own social posts" ON social_posts
  FOR UPDATE USING (author_id = auth.uid());
CREATE POLICY "Users can delete own social posts" ON social_posts
  FOR DELETE USING (author_id = auth.uid());
CREATE POLICY "Managers can manage social posts" ON social_posts
  FOR ALL USING (is_admin_or_manager());

-- ── Social Likes ──
CREATE POLICY "Everyone can read likes" ON social_likes
  FOR SELECT USING (true);
CREATE POLICY "Users can manage own likes" ON social_likes
  FOR INSERT WITH CHECK (employee_id = auth.uid());
CREATE POLICY "Users can delete own likes" ON social_likes
  FOR DELETE USING (employee_id = auth.uid());

-- ── Social Comments ──
CREATE POLICY "Everyone can read comments" ON social_comments
  FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create comments" ON social_comments
  FOR INSERT WITH CHECK (author_id = auth.uid());

-- ── Helper RPC for unread count increment ──
CREATE OR REPLACE FUNCTION increment_unread(
  p_conversation_id integer,
  p_employee_id uuid
)
RETURNS void AS $$
  UPDATE conversation_participants
  SET unread_count = unread_count + 1
  WHERE conversation_id = p_conversation_id
  AND employee_id = p_employee_id;
$$ LANGUAGE sql SECURITY DEFINER;
