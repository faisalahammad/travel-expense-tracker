import { Tour } from "../types";

// Define the Settlement interface locally if it's not exported from types
interface Settlement {
  fromTravelerId: string;
  toTravelerId: string;
  amount: number;
  currencyCode: string;
}

/**
 * Calculate the net balance for each traveler based on expenses and payments
 * A positive balance means the traveler is owed money
 * A negative balance means the traveler owes money
 */
export const calculateBalances = (tour: Tour): Record<string, number> => {
  const { expenses, travelers, baseCurrencyCode, currencies, payments = [] } = tour;
  const balances: Record<string, number> = {};

  // Initialize balances
  travelers.forEach((traveler) => {
    balances[traveler.id] = 0;
  });

  // Process expenses
  expenses.forEach((expense) => {
    // Get the base amount (amount in base currency)
    let expenseAmount = 0;

    // Use the pre-calculated baseAmount if available
    if ((expense as any).baseAmount !== undefined) {
      expenseAmount = (expense as any).baseAmount;
    } else {
      // Otherwise calculate using the exchange rate
      if (expense.currencyCode !== baseCurrencyCode) {
        const currency = currencies.find((c) => c.code === expense.currencyCode);
        if (currency) {
          // If 1 USD = 124.64 BDT, then 1200 USD should be 1200 * 124.64 = 149,568 BDT
          expenseAmount = expense.amount * currency.exchangeRate;
        } else {
          expenseAmount = expense.amount;
        }
      } else {
        expenseAmount = expense.amount;
      }
    }

    // The person who paid gets credit for the full amount
    balances[expense.paidById] += expenseAmount;

    // Each person who benefited from the expense gets debited their share
    expense.splits.forEach((split) => {
      // Get the base amount for the split
      let splitAmount = 0;

      // Use the pre-calculated baseAmount if available
      if ((split as any).baseAmount !== undefined) {
        splitAmount = (split as any).baseAmount;
      } else {
        // If expense has baseAmount, calculate proportionally
        if ((expense as any).baseAmount !== undefined) {
          splitAmount = split.amount * ((expense as any).baseAmount / expense.amount);
        } else {
          // Otherwise calculate using the exchange rate
          if (expense.currencyCode !== baseCurrencyCode) {
            const currency = currencies.find((c) => c.code === expense.currencyCode);
            if (currency) {
              splitAmount = split.amount * currency.exchangeRate;
            } else {
              splitAmount = split.amount;
            }
          } else {
            splitAmount = split.amount;
          }
        }
      }

      balances[split.travelerId] -= splitAmount;
    });
  });

  // Process payments
  if (payments && payments.length > 0) {
    payments.forEach((payment) => {
      // Convert payment to base currency if needed
      let paymentAmount = payment.amount;
      if (payment.currencyCode !== baseCurrencyCode) {
        const currency = currencies.find((c) => c.code === payment.currencyCode);
        if (currency) {
          // If 1 USD = 124.64 BDT, then 1200 USD should be 1200 * 124.64 = 149,568 BDT
          paymentAmount = payment.amount * currency.exchangeRate;
        }
      }

      // The person who made the payment (from) gets debited
      balances[payment.fromTravelerId] -= paymentAmount;

      // The person who received the payment (to) gets credited
      balances[payment.toTravelerId] += paymentAmount;
    });
  }

  // Round all balances to 2 decimal places
  Object.keys(balances).forEach((key) => {
    balances[key] = Math.round(balances[key] * 100) / 100;
  });

  return balances;
};

/**
 * Calculate the settlement plan based on the calculated balances
 * Returns a list of payments that need to be made to settle all debts
 */
export const calculateSettlements = (tour: Tour): Settlement[] => {
  const balances = calculateBalances(tour);

  // Create a list of creditors (positive balance) and debtors (negative balance)
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([travelerId, balance]) => {
    // Use a small threshold to handle floating point errors
    if (balance > 0.01) {
      creditors.push({ id: travelerId, amount: balance });
    } else if (balance < -0.01) {
      debtors.push({ id: travelerId, amount: -balance });
    }
  });

  // Sort by amount (descending)
  creditors.sort((a, b) => b.amount - a.amount);
  debtors.sort((a, b) => b.amount - a.amount);

  // Calculate settlements
  const settlements: Settlement[] = [];

  while (debtors.length > 0 && creditors.length > 0) {
    const debtor = debtors[0];
    const creditor = creditors[0];

    const amount = Math.min(debtor.amount, creditor.amount);

    if (amount > 0.01) {
      // Only create settlements for non-trivial amounts
      settlements.push({
        fromTravelerId: debtor.id,
        toTravelerId: creditor.id,
        amount: Math.round(amount * 100) / 100, // Round to 2 decimal places
        currencyCode: tour.baseCurrencyCode,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    // Use a small threshold to handle floating point errors
    if (debtor.amount < 0.01) {
      debtors.shift();
    }

    if (creditor.amount < 0.01) {
      creditors.shift();
    }
  }

  return settlements;
};
