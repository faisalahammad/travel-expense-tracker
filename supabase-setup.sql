-- Create the exec_sql function to execute SQL statements
CREATE OR REPLACE FUNCTION exec_sql(sql_query TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE sql_query;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon, authenticated;

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  base_currency_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL
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

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  tour_id UUID NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  currency_code TEXT NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  paid_by_id UUID NOT NULL REFERENCES travelers(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES expense_categories(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Create expense splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  traveler_id UUID NOT NULL REFERENCES travelers(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
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
  created_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Insert default expense categories
INSERT INTO expense_categories (id, name, icon, color)
VALUES
  ('food', 'Food & Drinks', 'restaurant', '#FF5722'),
  ('accommodation', 'Accommodation', 'hotel', '#2196F3'),
  ('transportation', 'Transportation', 'directions_car', '#4CAF50'),
  ('activities', 'Activities', 'local_activity', '#9C27B0'),
  ('shopping', 'Shopping', 'shopping_bag', '#E91E63'),
  ('other', 'Other', 'more_horiz', '#607D8B')
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies to allow public access (since we removed authentication)
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