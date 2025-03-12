-- Check if planning_tasks table exists, if not create it
CREATE TABLE IF NOT EXISTS planning_tasks (
  id UUID PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date DATE NOT NULL,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  location TEXT,
  cost NUMERIC(10, 2),
  currency_code TEXT,
  travelers UUID[] DEFAULT '{}',
  assigned_to UUID[] DEFAULT '{}',
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check if the old columns exist and drop them if they do
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_tasks' AND column_name = 'description') THEN
    ALTER TABLE planning_tasks DROP COLUMN description;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'planning_tasks' AND column_name = 'url') THEN
    ALTER TABLE planning_tasks DROP COLUMN url;
  END IF;

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

-- Create RLS policies for planning_tasks if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'planning_tasks' AND policyname = 'Public access') THEN
    ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Public access" ON planning_tasks FOR ALL USING (true);
  END IF;
END $$;