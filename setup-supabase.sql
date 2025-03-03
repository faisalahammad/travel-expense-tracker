-- This script creates all the necessary tables for the Travel Expense Tracker app
-- Run this in the Supabase SQL Editor

-- Create app_state table
CREATE TABLE IF NOT EXISTS app_state (
  id INTEGER PRIMARY KEY,
  active_tour_id TEXT
);

-- Create tours table
CREATE TABLE IF NOT EXISTS tours (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  base_currency_code TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create travelers table
CREATE TABLE IF NOT EXISTS travelers (
  id TEXT PRIMARY KEY,
  tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL
);

-- Create currencies table
CREATE TABLE IF NOT EXISTS currencies (
  code TEXT,
  tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  exchange_rate NUMERIC NOT NULL,
  PRIMARY KEY (code, tour_id)
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency_code TEXT NOT NULL,
  description TEXT NOT NULL,
  paid_by_id TEXT NOT NULL
);

-- Create expense_splits table
CREATE TABLE IF NOT EXISTS expense_splits (
  expense_id TEXT NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  traveler_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  percentage NUMERIC NOT NULL,
  PRIMARY KEY (expense_id, traveler_id)
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tour_id TEXT NOT NULL REFERENCES tours(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  from_traveler_id TEXT NOT NULL,
  to_traveler_id TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  currency_code TEXT NOT NULL,
  method TEXT,
  notes TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE app_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE travelers ENABLE ROW LEVEL SECURITY;
ALTER TABLE currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users" ON app_state FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON tours FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON travelers FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON currencies FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON expenses FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON expense_splits FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations for authenticated users" ON payments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Create policies to allow read operations for anonymous users
CREATE POLICY "Allow read operations for anonymous users" ON app_state FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON tours FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON travelers FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON currencies FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON expenses FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON expense_splits FOR SELECT TO anon USING (true);
CREATE POLICY "Allow read operations for anonymous users" ON payments FOR SELECT TO anon USING (true);

-- Create policies to allow insert/update/delete operations for anonymous users
CREATE POLICY "Allow insert operations for anonymous users" ON app_state FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update operations for anonymous users" ON app_state FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete operations for anonymous users" ON app_state FOR DELETE TO anon USING (true);

CREATE POLICY "Allow insert operations for anonymous users" ON tours FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update operations for anonymous users" ON tours FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete operations for anonymous users" ON tours FOR DELETE TO anon USING (true);

CREATE POLICY "Allow insert operations for anonymous users" ON travelers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update operations for anonymous users" ON travelers FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete operations for anonymous users" ON travelers FOR DELETE TO anon USING (true);

CREATE POLICY "Allow insert operations for anonymous users" ON currencies FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update operations for anonymous users" ON currencies FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete operations for anonymous users" ON currencies FOR DELETE TO anon USING (true);

CREATE POLICY "Allow insert operations for anonymous users" ON expenses FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update operations for anonymous users" ON expenses FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete operations for anonymous users" ON expenses FOR DELETE TO anon USING (true);

CREATE POLICY "Allow insert operations for anonymous users" ON expense_splits FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update operations for anonymous users" ON expense_splits FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete operations for anonymous users" ON expense_splits FOR DELETE TO anon USING (true);

CREATE POLICY "Allow insert operations for anonymous users" ON payments FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow update operations for anonymous users" ON payments FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "Allow delete operations for anonymous users" ON payments FOR DELETE TO anon USING (true);