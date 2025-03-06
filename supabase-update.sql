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