import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { calculateSettlements, formatCurrency, getTravelerName } from "../utils";
import { exportTourToExcel } from "../utils/excelExport";

const Settlements: React.FC = () => {
  const { state } = useApp();
  const { tours, activeTourId } = state;
  const navigate = useNavigate();

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

  const settlements = calculateSettlements(activeTour);

  const handleExportToExcel = () => {
    exportTourToExcel(activeTour);
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Settlements</h1>
      <h2 className="text-xl mb-4">Tour: {activeTour.name}</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h3 className="text-lg font-bold mb-4">Tour Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600">Base Currency:</span>
              <span className="font-medium">{activeTour.baseCurrencyCode}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Travelers:</span>
              <span className="font-medium">{activeTour.travelers.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Currencies:</span>
              <span className="font-medium">{activeTour.currencies.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Expenses:</span>
              <span className="font-medium">{activeTour.expenses.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Transactions:</span>
              <span className="font-medium">{settlements.length}</span>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleExportToExcel} className="btn btn-primary">
              Export to Excel
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-bold mb-4">Expense Totals by Traveler</h3>
          {activeTour.travelers.length === 0 ? (
            <p className="text-gray-500">No travelers added yet.</p>
          ) : (
            <div className="space-y-2">
              {activeTour.travelers.map((traveler) => {
                // Calculate total paid by this traveler
                const totalPaid = activeTour.expenses
                  .filter((expense) => expense.paidById === traveler.id)
                  .reduce((sum, expense) => {
                    // Convert to base currency if needed
                    if (expense.currencyCode !== activeTour.baseCurrencyCode) {
                      const currency = activeTour.currencies.find((c) => c.code === expense.currencyCode);
                      if (currency) {
                        return sum + expense.amount / currency.exchangeRate;
                      }
                    }
                    return sum + expense.amount;
                  }, 0);

                // Calculate total owed by this traveler
                const totalOwed = activeTour.expenses.reduce((sum, expense) => {
                  const split = expense.splits.find((s) => s.travelerId === traveler.id);

                  if (!split) return sum;

                  // Convert to base currency if needed
                  if (expense.currencyCode !== activeTour.baseCurrencyCode) {
                    const currency = activeTour.currencies.find((c) => c.code === expense.currencyCode);
                    if (currency) {
                      return sum + ((split.percentage / 100) * expense.amount) / currency.exchangeRate;
                    }
                  }

                  return sum + (split.percentage / 100) * expense.amount;
                }, 0);

                const balance = totalPaid - totalOwed;

                return (
                  <div
                    key={traveler.id}
                    className="flex justify-between items-center p-2 rounded-md"
                    style={{
                      backgroundColor: balance > 0 ? "rgba(52, 211, 153, 0.1)" : balance < 0 ? "rgba(239, 68, 68, 0.1)" : "transparent",
                    }}
                  >
                    <span className="font-medium">{traveler.name}</span>
                    <div className="text-right">
                      <div className={balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : ""}>{formatCurrency(balance, activeTour.baseCurrencyCode)}</div>
                      <div className="text-xs text-gray-500">
                        Paid: {formatCurrency(totalPaid, activeTour.baseCurrencyCode)}, Owed: {formatCurrency(totalOwed, activeTour.baseCurrencyCode)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <h3 className="text-lg font-bold mb-4">Settlement Plan</h3>

        {activeTour.expenses.length === 0 ? (
          <p className="text-gray-500">No expenses added yet. Add expenses to generate a settlement plan.</p>
        ) : settlements.length === 0 ? (
          <p className="text-gray-500">No settlements needed. All expenses are already balanced.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-2 px-4 text-left">From</th>
                  <th className="py-2 px-4 text-left">To</th>
                  <th className="py-2 px-4 text-left">Amount</th>
                </tr>
              </thead>
              <tbody>
                {settlements.map((settlement, index) => (
                  <tr key={index} className="border-t border-gray-200">
                    <td className="py-2 px-4">{getTravelerName(settlement.fromTravelerId, activeTour.travelers)}</td>
                    <td className="py-2 px-4">{getTravelerName(settlement.toTravelerId, activeTour.travelers)}</td>
                    <td className="py-2 px-4">{formatCurrency(settlement.amount, settlement.currencyCode)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settlements;
