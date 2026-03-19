CREATE TABLE academy_modules (
  id serial PRIMARY KEY,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE academy_videos (
  id serial PRIMARY KEY,
  module_id integer REFERENCES academy_modules(id),
  title text NOT NULL,
  url text NOT NULL,
  duration text,
  source text,
  sort_order integer DEFAULT 0
);

CREATE TABLE academy_quizzes (
  id serial PRIMARY KEY,
  title text NOT NULL,
  category text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE academy_questions (
  id serial PRIMARY KEY,
  quiz_id integer REFERENCES academy_quizzes(id),
  question text NOT NULL,
  options jsonb NOT NULL,
  correct_index integer NOT NULL,
  sort_order integer DEFAULT 0
);

CREATE TABLE academy_scores (
  id serial PRIMARY KEY,
  employee_id uuid REFERENCES employees(id),
  quiz_id integer REFERENCES academy_quizzes(id),
  score integer NOT NULL,
  max_score integer NOT NULL,
  completed_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE academy_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view modules"
  ON academy_modules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage modules"
  ON academy_modules FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Everyone can view videos"
  ON academy_videos FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage videos"
  ON academy_videos FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Everyone can view quizzes"
  ON academy_quizzes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage quizzes"
  ON academy_quizzes FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Everyone can view questions"
  ON academy_questions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Managers can manage questions"
  ON academy_questions FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());

CREATE POLICY "Employees can view own scores"
  ON academy_scores FOR SELECT
  TO authenticated
  USING (employee_id = auth.uid() OR is_admin_or_manager());

CREATE POLICY "Employees can insert own scores"
  ON academy_scores FOR INSERT
  TO authenticated
  WITH CHECK (employee_id = auth.uid());

CREATE POLICY "Managers can manage all scores"
  ON academy_scores FOR ALL
  TO authenticated
  USING (is_admin_or_manager())
  WITH CHECK (is_admin_or_manager());
