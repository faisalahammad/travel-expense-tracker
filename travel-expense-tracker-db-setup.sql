-- Travel Expense Tracker - Complete Database Setup
-- This file contains all the necessary SQL commands to set up the database for the Travel Expense Tracker application.
-- Run this file in your Supabase SQL Editor to create all required tables, functions, and initial data.

-- =============================================
-- UTILITY FUNCTIONS
-- =============================================

-- Create the exec_sql function to execute SQL statements
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon, authenticated;

-- Create the set_updated_at function for automatic timestamp updates
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- AUTHENTICATION TABLES
-- =============================================

-- Create security_questions table
CREATE TABLE IF NOT EXISTS security_questions (
  id SERIAL PRIMARY KEY,
  question TEXT NOT NULL
);

-- Insert default security questions
INSERT INTO security_questions (question)
VALUES
  ('What was the name of your first pet?'),
  ('In which city were you born?'),
  ('What was your childhood nickname?'),
  ('What is the name of your favorite childhood teacher?'),
  ('What is your mother''s maiden name?')
ON CONFLICT DO NOTHING;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  pin_hash TEXT NOT NULL,
  security_question_id INTEGER REFERENCES security_questions(id),
  security_answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Add trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at ON users;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Create auth_attempts table to track failed login attempts
CREATE TABLE IF NOT EXISTS auth_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  attempt_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  successful BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create index on email and attempt_time for faster lookups
CREATE INDEX IF NOT EXISTS idx_auth_attempts_email_time ON auth_attempts(email, attempt_time);

-- =============================================
-- CORE TABLES
-- =============================================

-- Create tours table with authentication fields
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  base_currency_code TEXT NOT NULL,
  email TEXT,
  security_question_id INTEGER REFERENCES security_questions(id),
  security_answer TEXT,
  pin_hash TEXT,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create index on email for faster lookups (non-unique to allow multiple tours per email)
CREATE INDEX IF NOT EXISTS idx_tours_email ON tours(email);

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_tours_user_id ON tours(user_id);

-- Create travelers table
CREATE TABLE IF NOT EXISTS travelers (
  id UUID PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  exchange_rate NUMERIC(10, 5) NOT NULL,
  PRIMARY KEY (tour_id, code)
);

-- Create expense categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL
);

-- Create expenses table with base amount fields
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency_code TEXT NOT NULL,
  base_amount NUMERIC(10, 2) NOT NULL,
  base_currency_code TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_by_id UUID NOT NULL REFERENCES travelers(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create expense splits table with base amount field
CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES travelers(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  base_amount NUMERIC(10, 2) NOT NULL,
  PRIMARY KEY (expense_id, traveler_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  from_traveler_id UUID NOT NULL REFERENCES travelers(id) ON DELETE CASCADE,
  to_traveler_id UUID NOT NULL REFERENCES travelers(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  currency_code TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- =============================================
-- PLANNING TASKS
-- =============================================

-- Create planning_tasks table
CREATE TABLE IF NOT EXISTS planning_tasks (
  id UUID PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) NOT NULL DEFAULT 'medium',
  location TEXT,
  cost NUMERIC(10, 2),
  currency_code TEXT,
  travelers UUID[] DEFAULT '{}',
  assigned_to UUID[] DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on tour_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_planning_tasks_tour_id ON planning_tasks(tour_id);

-- Create trigger to automatically update updated_at timestamp
DROP TRIGGER IF EXISTS set_updated_at ON planning_tasks;
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON planning_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- =============================================
-- DEFAULT DATA
-- =============================================

-- Insert default expense categories
INSERT INTO expense_categories (id, name, icon, color)
VALUES
  ('food', 'Food & Drinks', 'restaurant', '#FF5722'),
  ('accommodation', 'Accommodation', 'hotel', '#2196F3'),
  ('transportation', 'Transportation', 'directions_car', '#4CAF50'),
  ('activities', 'Activities', 'local_activity', '#9C27B0'),
  ('shopping', 'Shopping', 'shopping_bag', '#E91E63'),
  ('repayment', 'Repayment', 'repayment', '#2ecc71'),
  ('other', 'Other', 'more_horiz', '#607D8B')
ON CONFLICT (id) DO NOTHING;

-- =============================================
-- SECURITY POLICIES
-- =============================================

-- Create RLS policies to allow public access
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'tours' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON tours FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON users FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'travelers' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON travelers FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'currencies' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON currencies FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expense_categories' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON expense_categories FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expenses' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON expenses FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'expense_splits' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON expense_splits FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'payments' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON payments FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'planning_tasks' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON planning_tasks FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE security_questions ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'security_questions' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON security_questions FOR ALL USING (true);
  END IF;
END $$;

ALTER TABLE auth_attempts ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'auth_attempts' AND policyname = 'Public access'
  ) THEN
    CREATE POLICY "Public access" ON auth_attempts FOR ALL USING (true);
  END IF;
END $$;

-- =============================================
-- UTILITY FUNCTIONS AND TRIGGERS
-- =============================================

-- Function to update tour auth info from the users table
CREATE OR REPLACE FUNCTION get_tour_auth_info()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    -- Get authentication info from the users table
    SELECT u.email, u.pin_hash, u.security_question_id, u.security_answer
    INTO NEW.email, NEW.pin_hash, NEW.security_question_id, NEW.security_answer
    FROM users u
    WHERE u.id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update tour auth info
DROP TRIGGER IF EXISTS update_tour_auth_info ON tours;
CREATE TRIGGER update_tour_auth_info
    BEFORE INSERT OR UPDATE OF user_id ON tours
    FOR EACH ROW
    EXECUTE FUNCTION get_tour_auth_info();

-- =============================================
-- MIGRATION HELPERS
-- =============================================

-- Migrate existing data
-- This will create user records for each unique email in the tours table
-- and then link the tours to those users
DO $$
DECLARE
  tour_record RECORD;
  new_user_id UUID;
BEGIN
  -- Process each unique email in the tours table
  FOR tour_record IN
    SELECT DISTINCT email, pin_hash, security_question_id, security_answer
    FROM tours
    WHERE email IS NOT NULL AND pin_hash IS NOT NULL AND pin_hash != 'dummy'
  LOOP
    -- Check if user already exists
    SELECT id INTO new_user_id FROM users WHERE email = tour_record.email;

    -- If user doesn't exist, create a new user
    IF new_user_id IS NULL THEN
      INSERT INTO users (email, pin_hash, security_question_id, security_answer)
      VALUES (tour_record.email, tour_record.pin_hash, tour_record.security_question_id, tour_record.security_answer)
      RETURNING id INTO new_user_id;
    END IF;

    -- Update all tours with this email to reference the user
    UPDATE tours SET user_id = new_user_id WHERE email = tour_record.email;
  END LOOP;
END $$;

-- These commands help with migrating from older versions of the database schema
-- They will only run if the relevant columns exist

-- Handle potential schema changes in planning_tasks table
DO $$
BEGIN
  -- Drop old columns if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_tasks' AND column_name = 'description') THEN
    ALTER TABLE planning_tasks DROP COLUMN description;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_tasks' AND column_name = 'url') THEN
    ALTER TABLE planning_tasks DROP COLUMN url;
  END IF;

  -- Rename is_completed to completed for consistency if it exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_tasks' AND column_name = 'is_completed') THEN
    ALTER TABLE planning_tasks RENAME COLUMN is_completed TO completed;
  END IF;

  -- Convert JSONB columns to UUID arrays if they exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_tasks' AND column_name = 'travelers' AND data_type = 'jsonb') THEN
    ALTER TABLE planning_tasks
    ALTER COLUMN travelers TYPE UUID[] USING (CASE WHEN travelers IS NULL THEN '{}' ELSE travelers::text::UUID[] END);
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_tasks' AND column_name = 'assigned_to' AND data_type = 'jsonb') THEN
    ALTER TABLE planning_tasks
    ALTER COLUMN assigned_to TYPE UUID[] USING (CASE WHEN assigned_to IS NULL THEN '{}' ELSE assigned_to::text::UUID[] END);
  END IF;

  -- Add authentication fields to tours table if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'tours' AND column_name = 'email') THEN
    ALTER TABLE tours ADD COLUMN email TEXT;
    ALTER TABLE tours ADD COLUMN security_question_id INTEGER REFERENCES security_questions(id);
    ALTER TABLE tours ADD COLUMN security_answer TEXT;
    ALTER TABLE tours ADD COLUMN pin_hash TEXT;
  END IF;
END $$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Travel Expense Tracker database setup completed successfully!';
  RAISE NOTICE 'The following tables were created or updated:';
  RAISE NOTICE '- users';
  RAISE NOTICE '- security_questions';
  RAISE NOTICE '- auth_attempts';
  RAISE NOTICE '- tours (with authentication fields)';
  RAISE NOTICE '- travelers';
  RAISE NOTICE '- currencies';
  RAISE NOTICE '- expense_categories';
  RAISE NOTICE '- expenses';
  RAISE NOTICE '- expense_splits';
  RAISE NOTICE '- payments';
  RAISE NOTICE '- planning_tasks';
END $$;