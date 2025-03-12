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
-- CORE TABLES
-- =============================================

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  base_currency_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

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
CREATE POLICY "Public access" ON tours FOR ALL USING (true);

ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON travelers FOR ALL USING (true);

ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON currencies FOR ALL USING (true);

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON expense_categories FOR ALL USING (true);

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON expenses FOR ALL USING (true);

ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON expense_splits FOR ALL USING (true);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON payments FOR ALL USING (true);

ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON planning_tasks FOR ALL USING (true);

-- =============================================
-- MIGRATION HELPERS
-- =============================================

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
END $$;

-- =============================================
-- COMPLETION MESSAGE
-- =============================================

DO $$
BEGIN
  RAISE NOTICE 'Travel Expense Tracker database setup completed successfully!';
  RAISE NOTICE 'The following tables were created or updated:';
  RAISE NOTICE '- tours';
  RAISE NOTICE '- travelers';
  RAISE NOTICE '- currencies';
  RAISE NOTICE '- expense_categories';
  RAISE NOTICE '- expenses';
  RAISE NOTICE '- expense_splits';
  RAISE NOTICE '- payments';
  RAISE NOTICE '- planning_tasks';
END $$;