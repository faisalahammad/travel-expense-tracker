-- Add base_amount and base_currency_code columns to expenses table
ALTER TABLE expenses
ADD COLUMN base_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
ADD COLUMN base_currency_code TEXT NOT NULL DEFAULT '';

-- Add base_amount column to expense_splits table
ALTER TABLE expense_splits
ADD COLUMN base_amount NUMERIC(10, 2) NOT NULL DEFAULT 0;

-- Update existing expenses to set base_amount equal to amount and base_currency_code equal to tour's base_currency_code
UPDATE expenses e
SET
  base_amount = e.amount,
  base_currency_code = (SELECT base_currency_code FROM tours WHERE id = e.tour_id)
WHERE e.currency_code = (SELECT base_currency_code FROM tours WHERE id = e.tour_id);

-- Update existing expenses where currency is different from base currency
UPDATE expenses e
SET
  base_amount = e.amount * (SELECT exchange_rate FROM currencies c WHERE c.tour_id = e.tour_id AND c.code = e.currency_code),
  base_currency_code = (SELECT base_currency_code FROM tours WHERE id = e.tour_id)
WHERE e.currency_code != (SELECT base_currency_code FROM tours WHERE id = e.tour_id);

-- Update existing expense splits to set base_amount equal to amount for expenses in base currency
UPDATE expense_splits es
SET base_amount = es.amount
FROM expenses e
WHERE es.expense_id = e.id AND e.currency_code = (SELECT base_currency_code FROM tours WHERE id = e.tour_id);

-- Update existing expense splits for expenses in different currencies
UPDATE expense_splits es
SET base_amount = es.amount * (SELECT exchange_rate FROM currencies c WHERE c.tour_id = e.tour_id AND c.code = e.currency_code)
FROM expenses e
WHERE es.expense_id = e.id AND e.currency_code != (SELECT base_currency_code FROM tours WHERE id = e.tour_id);

-- Remove the default values from the new columns
ALTER TABLE expenses
ALTER COLUMN base_amount DROP DEFAULT,
ALTER COLUMN base_currency_code DROP DEFAULT;

ALTER TABLE expense_splits
ALTER COLUMN base_amount DROP DEFAULT;

-- Create planning_tasks table
CREATE TABLE IF NOT EXISTS planning_tasks (
  id UUID PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  url TEXT,
  location TEXT,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  is_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create planning_task_travelers table for many-to-many relationship
CREATE TABLE IF NOT EXISTS planning_task_travelers (
  task_id UUID NOT NULL REFERENCES planning_tasks(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES travelers(id) ON DELETE CASCADE,
  PRIMARY KEY (task_id, traveler_id)
);

-- Create RLS policies for planning_tasks
ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON planning_tasks FOR ALL USING (true);

-- Create RLS policies for planning_task_travelers
ALTER TABLE planning_task_travelers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access" ON planning_task_travelers FOR ALL USING (true);

-- Update planning_tasks table to add new fields
ALTER TABLE planning_tasks
ADD COLUMN IF NOT EXISTS cost NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS currency_code TEXT,
ADD COLUMN IF NOT EXISTS travelers JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS assigned_to JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS completed BOOLEAN DEFAULT false;

-- Rename is_completed to completed for consistency if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_tasks' AND column_name = 'is_completed') THEN
    ALTER TABLE planning_tasks RENAME COLUMN is_completed TO completed;
  END IF;
END $$;