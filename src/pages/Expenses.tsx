import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { ExpenseSplit } from "../types";
import { formatCurrency, getTravelerName } from "../utils";

const Expenses: React.FC = () => {
  const { state, addExpense, updateExpense, removeExpense } = useApp();
  const { tours, activeTourId } = state;
  const navigate = useNavigate();

  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);

  // Form state for new expense
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseCurrency, setNewExpenseCurrency] = useState("");
  const [newExpenseDescription, setNewExpenseDescription] = useState("");
  const [newExpensePaidBy, setNewExpensePaidBy] = useState("");
  const [newExpenseSplits, setNewExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);

  // Redirect if no active tour
  if (!activeTourId) {
    navigate("/");
    return null;
  }

  const activeTour = tours.find((tour) => tour.id === activeTourId);

  if (!activeTour) {
    navigate("/");
    return null;
  }

  // Initialize form state when needed
  if (activeTour.travelers.length > 0 && newExpensePaidBy === "") {
    setNewExpensePaidBy(activeTour.travelers[0].id);
  }

  if (activeTour.currencies.length > 0 && newExpenseCurrency === "") {
    setNewExpenseCurrency(activeTour.baseCurrencyCode);
  }

  // Initialize splits when travelers change
  if (activeTour.travelers.length > 0 && newExpenseSplits.length === 0) {
    const equalPercentage = 100 / activeTour.travelers.length;
    const initialSplits = activeTour.travelers.map((traveler) => ({
      travelerId: traveler.id,
      amount: 0, // Will be calculated when expense is added
      percentage: equalPercentage,
    }));
    setNewExpenseSplits(initialSplits);
  }

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(newExpenseAmount);

    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    if (!newExpensePaidBy) {
      alert("Please select who paid for this expense.");
      return;
    }

    // Calculate split amounts based on percentages
    const updatedSplits = newExpenseSplits.map((split) => ({
      ...split,
      amount: (split.percentage / 100) * amount,
    }));

    // Verify that splits add up to 100%
    const totalPercentage = updatedSplits.reduce((sum, split) => sum + split.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      alert("Split percentages must add up to 100%.");
      return;
    }

    addExpense(activeTourId, newExpenseDate, amount, newExpenseCurrency, newExpenseDescription, newExpensePaidBy, updatedSplits);

    // Reset form
    setNewExpenseDescription("");
    setNewExpenseAmount("");
    // Keep the date, currency, and paidBy as they are for convenience

    // Reset splits to equal
    if (activeTour.travelers.length > 0) {
      const equalPercentage = 100 / activeTour.travelers.length;
      const initialSplits = activeTour.travelers.map((traveler) => ({
        travelerId: traveler.id,
        amount: 0,
        percentage: equalPercentage,
      }));
      setNewExpenseSplits(initialSplits);
      setSplitEqually(true);
    }
  };

  const handleSplitPercentageChange = (travelerId: string, percentage: number) => {
    const updatedSplits = newExpenseSplits.map((split) => (split.travelerId === travelerId ? { ...split, percentage } : split));
    setNewExpenseSplits(updatedSplits);

    // Check if splits are equal
    const equalPercentage = 100 / activeTour.travelers.length;
    const isEqual = updatedSplits.every((split) => Math.abs(split.percentage - equalPercentage) < 0.01);
    setSplitEqually(isEqual);
  };

  const handleSplitEqually = () => {
    const equalPercentage = 100 / activeTour.travelers.length;
    const equalSplits = activeTour.travelers.map((traveler) => ({
      travelerId: traveler.id,
      amount: 0, // Will be calculated when expense is added
      percentage: equalPercentage,
    }));
    setNewExpenseSplits(equalSplits);
    setSplitEqually(true);
  };

  const handleRemoveExpense = (expenseId: string) => {
    if (window.confirm("Are you sure you want to remove this expense?")) {
      removeExpense(activeTourId, expenseId);
    }
  };

  const toggleExpenseDetails = (expenseId: string) => {
    setExpandedExpenseId(expandedExpenseId === expenseId ? null : expenseId);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Manage Expenses</h1>
      <h2 className="text-xl mb-4">Tour: {activeTour.name}</h2>

      {activeTour.travelers.length === 0 ? (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-6">
          <p>You need to add travelers before you can add expenses.</p>
          <button onClick={() => navigate("/travelers")} className="mt-2 text-blue-600 hover:underline">
            Add Travelers
          </button>
        </div>
      ) : (
        <div className="card mb-6">
          <h3 className="text-lg font-bold mb-4">Add New Expense</h3>
          <form onSubmit={handleAddExpense}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="expenseDate" className="block text-gray-700 mb-2">
                  Date
                </label>
                <input type="date" id="expenseDate" className="input" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="expenseDescription" className="block text-gray-700 mb-2">
                  Description
                </label>
                <input type="text" id="expenseDescription" className="input" placeholder="e.g., Dinner at Restaurant" value={newExpenseDescription} onChange={(e) => setNewExpenseDescription(e.target.value)} required />
              </div>
              <div>
                <label htmlFor="expenseAmount" className="block text-gray-700 mb-2">
                  Amount
                </label>
                <input type="number" id="expenseAmount" className="input" placeholder="e.g., 50.00" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} min="0.01" step="0.01" required />
              </div>
              <div>
                <label htmlFor="expenseCurrency" className="block text-gray-700 mb-2">
                  Currency
                </label>
                <select id="expenseCurrency" className="select" value={newExpenseCurrency} onChange={(e) => setNewExpenseCurrency(e.target.value)} required>
                  {activeTour.currencies.map((currency) => (
                    <option key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="expensePaidBy" className="block text-gray-700 mb-2">
                  Paid By
                </label>
                <select id="expensePaidBy" className="select" value={newExpensePaidBy} onChange={(e) => setNewExpensePaidBy(e.target.value)} required>
                  {activeTour.travelers.map((traveler) => (
                    <option key={traveler.id} value={traveler.id}>
                      {traveler.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <label className="block text-gray-700 font-bold">Split</label>
                <button type="button" onClick={handleSplitEqually} className="text-blue-600 hover:underline text-sm">
                  Split Equally
                </button>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                {newExpenseSplits.map((split, index) => {
                  const traveler = activeTour.travelers.find((t) => t.id === split.travelerId);

                  if (!traveler) return null;

                  return (
                    <div key={traveler.id} className="flex items-center mb-2 last:mb-0">
                      <div className="w-1/3">{traveler.name}</div>
                      <div className="w-2/3 flex items-center">
                        <input type="range" min="0" max="100" value={split.percentage} onChange={(e) => handleSplitPercentageChange(traveler.id, parseFloat(e.target.value))} className="w-2/3 mr-2" />
                        <input type="number" value={split.percentage} onChange={(e) => handleSplitPercentageChange(traveler.id, parseFloat(e.target.value))} className="w-1/3 input" min="0" max="100" step="0.01" />
                        <span className="ml-2">%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Add Expense
            </button>
          </form>
        </div>
      )}

      <div className="card">
        <h3 className="text-lg font-bold mb-4">Expenses</h3>

        {activeTour.expenses.length === 0 ? (
          <p className="text-gray-500">No expenses added yet.</p>
        ) : (
          <div className="space-y-4">
            {activeTour.expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense) => {
                const paidBy = activeTour.travelers.find((t) => t.id === expense.paidById);
                const currency = activeTour.currencies.find((c) => c.code === expense.currencyCode);

                return (
                  <div key={expense.id} className="border rounded-lg overflow-hidden">
                    <div className="flex justify-between items-center p-4 cursor-pointer hover:bg-gray-50" onClick={() => toggleExpenseDetails(expense.id)}>
                      <div className="flex-1">
                        <div className="font-medium">{expense.description}</div>
                        <div className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</div>
                      </div>
                      <div className="flex-1 text-right">
                        <div className="font-medium">{formatCurrency(expense.amount, expense.currencyCode)}</div>
                        <div className="text-sm text-gray-500">Paid by {paidBy?.name || "Unknown"}</div>
                      </div>
                      <div className="ml-4">
                        <svg className={`w-5 h-5 transition-transform ${expandedExpenseId === expense.id ? "transform rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                        </svg>
                      </div>
                    </div>

                    {expandedExpenseId === expense.id && (
                      <div className="p-4 bg-gray-50 border-t">
                        <div className="mb-4">
                          <h4 className="font-medium mb-2">Split Details</h4>
                          <div className="space-y-1">
                            {expense.splits.map((split) => (
                              <div key={split.travelerId} className="flex justify-between text-sm">
                                <span>{getTravelerName(split.travelerId, activeTour.travelers)}</span>
                                <span className="flex items-center">
                                  {formatCurrency((split.percentage / 100) * expense.amount, expense.currencyCode)} <span className="text-gray-500 ml-2">({split.percentage.toFixed(1)}%)</span>
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-end">
                          <button onClick={() => handleRemoveExpense(expense.id)} className="text-red-600 hover:text-red-800">
                            Delete Expense
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Expenses;
