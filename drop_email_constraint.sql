-- Drop the unique constraint on email in the tours table
DROP INDEX IF EXISTS idx_tours_email;

-- Create a non-unique index for better query performance
CREATE INDEX IF NOT EXISTS idx_tours_email ON tours(email);