-- Create the set_updated_at function if it doesn't exist
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create enum type for task priority
CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high');

-- Create planning tasks table
CREATE TABLE IF NOT EXISTS planning_tasks (
    id UUID PRIMARY KEY,
    tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    location TEXT,
    date DATE NOT NULL,
    priority task_priority NOT NULL DEFAULT 'medium',
    travelers UUID[] NOT NULL DEFAULT '{}',
    assigned_to UUID[],
    completed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on tour_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_planning_tasks_tour_id ON planning_tasks(tour_id);

-- Enable Row Level Security
ALTER TABLE planning_tasks ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON planning_tasks
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users only" ON planning_tasks
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON planning_tasks
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON planning_tasks
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger to automatically update updated_at timestamp
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON planning_tasks
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();
