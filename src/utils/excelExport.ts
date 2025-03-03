import * as XLSX from "xlsx";
import { Settlement, Tour } from "../types";
import { getTravelerName } from "./index";

export const exportTourToExcel = (tour: Tour): void => {
  const { name, travelers, expenses, currencies, baseCurrencyCode } = tour;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create travelers sheet
  const travelersData = travelers.map((traveler) => ({
    "Traveler ID": traveler.id,
    Name: traveler.name,
  }));

  const travelersSheet = XLSX.utils.json_to_sheet(travelersData);
  XLSX.utils.book_append_sheet(wb, travelersSheet, "Travelers");

  // Create currencies sheet
  const currenciesData = currencies.map((currency) => ({
    "Currency Code": currency.code,
    "Currency Name": currency.name,
    "Exchange Rate": currency.exchangeRate,
  }));

  const currenciesSheet = XLSX.utils.json_to_sheet(currenciesData);
  XLSX.utils.book_append_sheet(wb, currenciesSheet, "Currencies");

  // Create expenses sheet
  const expensesData = expenses.map((expense) => ({
    "Expense ID": expense.id,
    Date: expense.date,
    Description: expense.description,
    Amount: expense.amount,
    Currency: expense.currencyCode,
    "Paid By": getTravelerName(expense.paidById, travelers),
  }));

  const expensesSheet = XLSX.utils.json_to_sheet(expensesData);
  XLSX.utils.book_append_sheet(wb, expensesSheet, "Expenses");

  // Create expense splits sheet
  const splitsData: any[] = [];
  expenses.forEach((expense) => {
    expense.splits.forEach((split) => {
      splitsData.push({
        "Expense ID": expense.id,
        Description: expense.description,
        Traveler: getTravelerName(split.travelerId, travelers),
        Amount: (split.percentage / 100) * expense.amount,
        Percentage: split.percentage,
        Currency: expense.currencyCode,
      });
    });
  });

  const splitsSheet = XLSX.utils.json_to_sheet(splitsData);
  XLSX.utils.book_append_sheet(wb, splitsSheet, "Expense Splits");

  // Create settlements sheet
  const settlements = calculateSettlements(tour);
  const settlementsData = settlements.map((settlement) => ({
    From: getTravelerName(settlement.fromTravelerId, travelers),
    To: getTravelerName(settlement.toTravelerId, travelers),
    Amount: settlement.amount,
    Currency: settlement.currencyCode,
  }));

  const settlementsSheet = XLSX.utils.json_to_sheet(settlementsData);
  XLSX.utils.book_append_sheet(wb, settlementsSheet, "Settlements");

  // Export workbook
  XLSX.writeFile(wb, `${name} - Travel Expenses.xlsx`);
};

// Helper function to calculate settlements for Excel export
const calculateSettlements = (tour: Tour): Settlement[] => {
  const { expenses, travelers, baseCurrencyCode, currencies } = tour;

  // Initialize balances for each traveler
  const balances: Record<string, number> = {};
  travelers.forEach((traveler) => {
    balances[traveler.id] = 0;
  });

  // Calculate net balance for each traveler
  expenses.forEach((expense) => {
    const { paidById, amount, currencyCode, splits } = expense;

    // Convert expense amount to base currency if needed
    let amountInBaseCurrency = amount;
    if (currencyCode !== baseCurrencyCode) {
      const currency = currencies.find((c) => c.code === currencyCode);
      if (currency) {
        amountInBaseCurrency = amount / currency.exchangeRate;
      }
    }

    // Add the full amount to the payer's balance
    balances[paidById] += amountInBaseCurrency;

    // Subtract each split from the respective traveler's balance
    splits.forEach((split) => {
      const splitAmountInBaseCurrency = (split.percentage / 100) * amountInBaseCurrency;
      balances[split.travelerId] -= splitAmountInBaseCurrency;
    });
  });

  // Create a list of creditors (positive balance) and debtors (negative balance)
  const creditors: { id: string; amount: number }[] = [];
  const debtors: { id: string; amount: number }[] = [];

  Object.entries(balances).forEach(([travelerId, balance]) => {
    if (balance > 0) {
      creditors.push({ id: travelerId, amount: balance });
    } else if (balance < 0) {
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

    if (amount > 0) {
      settlements.push({
        fromTravelerId: debtor.id,
        toTravelerId: creditor.id,
        amount,
        currencyCode: baseCurrencyCode,
      });
    }

    debtor.amount -= amount;
    creditor.amount -= amount;

    if (debtor.amount < 0.01) {
      debtors.shift();
    }

    if (creditor.amount < 0.01) {
      creditors.shift();
    }
  }

  return settlements;
};
