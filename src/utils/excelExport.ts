import * as XLSX from "xlsx";
import { Tour } from "../types";
import { getTravelerName } from "./index";
import { calculateSettlements } from "./settlementCalculator";

export const exportTourToExcel = (tour: Tour): void => {
  const { name, travelers, expenses, currencies, payments } = tour;

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create travelers sheet
  const travelersData = travelers.map((traveler) => ({
    "Traveler ID": traveler.id.substring(0, 8), // Use shorter ID
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
    "Expense ID": expense.id.substring(0, 8), // Use shorter ID
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
        "Expense ID": expense.id.substring(0, 8), // Use shorter ID
        Description: expense.description,
        "Paid By": getTravelerName(expense.paidById, travelers),
        Traveler: getTravelerName(split.travelerId, travelers),
        Amount: split.amount,
        Currency: expense.currencyCode,
      });
    });
  });

  const splitsSheet = XLSX.utils.json_to_sheet(splitsData);
  XLSX.utils.book_append_sheet(wb, splitsSheet, "Expense Splits");

  // Create payments sheet if there are any payments
  if (payments && payments.length > 0) {
    const paymentsData = payments.map((payment) => ({
      "Payment ID": payment.id.substring(0, 8), // Use shorter ID
      Date: payment.date,
      From: getTravelerName(payment.fromTravelerId, travelers),
      To: getTravelerName(payment.toTravelerId, travelers),
      Amount: payment.amount,
      Currency: payment.currencyCode,
      Method: payment.method,
      Notes: payment.notes || "",
    }));

    const paymentsSheet = XLSX.utils.json_to_sheet(paymentsData);
    XLSX.utils.book_append_sheet(wb, paymentsSheet, "Payments");
  }

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
