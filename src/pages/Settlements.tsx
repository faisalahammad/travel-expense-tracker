import { AccountBalance as BalanceIcon, CurrencyExchange as CurrencyIcon, FileDownload as ExportIcon, Person as PersonIcon, Receipt as ReceiptIcon, SwapHoriz as TransactionIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  InputAdornment,
  InputLabel,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cell, Legend, Pie, PieChart, Tooltip as RechartsTooltip, ResponsiveContainer } from "recharts";
import { useAppContext } from "../context/AppContext";
import { useActiveTour } from "../hooks/useActiveTour";
import { Currency, Expense, ExpenseSplit, Tour, Traveler } from "../types";
import { formatCurrency } from "../utils";
import { exportTourToExcel } from "../utils/excelExport";
import { calculateSettlements } from "../utils/settlementCalculator";

interface TravelerTotal {
  traveler: Traveler;
  totalPaid: number;
  totalOwed: number;
  paymentsMade: number;
  paymentsReceived: number;
  netExpenseBalance: number;
  netPaymentBalance: number;
  finalBalance: number;
}

interface CategoryTotal {
  categoryId: string;
  total: number;
  color: string;
}

const Settlements: React.FC = () => {
  const { state, addPayment, removePayment } = useAppContext();
  const { tours, activeTourId, expenseCategories } = state;
  const navigate = useNavigate();
  const { activeTour } = useActiveTour();

  // Payment dialog state
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [fromTravelerId, setFromTravelerId] = useState("");
  const [toTravelerId, setToTravelerId] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentCurrency, setPaymentCurrency] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Redirect if no active tour
  useEffect(() => {
    if (!activeTourId) {
      navigate("/");
    }
  }, [activeTourId, navigate]);

  if (!activeTour) {
    return (
      <Box>
        <Typography>Please select a tour first.</Typography>
      </Box>
    );
  }

  const settlements = calculateSettlements(activeTour);

  // Calculate expense totals by category
  const calculateExpensesByCategory = () => {
    const categoryTotals = activeTour.expenses.reduce((acc: Record<string, number>, expense: Expense) => {
      const category = expense.categoryId || "uncategorized";
      if (!acc[category]) {
        acc[category] = 0;
      }
      const baseAmount = expense.amount * (expense.currencyCode === activeTour.baseCurrencyCode ? 1 : activeTour.currencies.find((c: Currency) => c.code === expense.currencyCode)?.exchangeRate || 1);
      acc[category] += baseAmount;
      return acc;
    }, {});

    return Object.entries(categoryTotals).map(([categoryId, total]): CategoryTotal => {
      const category = expenseCategories.find((c) => c.id === categoryId);
      return {
        categoryId,
        total: Math.round(total * 100) / 100,
        color: category?.color || "#ccc",
      };
    });
  };

  const expensesByCategory = calculateExpensesByCategory();

  // Calculate traveler expense totals
  const calculateTravelerExpenseTotals = (tour: Tour): TravelerTotal[] => {
    const totals = tour.travelers.map((traveler: Traveler) => {
      // Total amount paid by this traveler
      const totalPaid = tour.expenses
        .filter((expense: Expense) => expense.paidById === traveler.id)
        .reduce((sum: number, expense: Expense) => {
          const baseAmount = expense.amount * (expense.currencyCode === tour.baseCurrencyCode ? 1 : tour.currencies.find((c: Currency) => c.code === expense.currencyCode)?.exchangeRate || 1);
          return sum + baseAmount;
        }, 0);

      // Total amount owed by this traveler (from expense splits)
      const totalOwed = tour.expenses.reduce((sum: number, expense: Expense) => {
        const split = expense.splits.find((s: ExpenseSplit) => s.travelerId === traveler.id);
        if (!split) return sum;

        const splitBaseAmount = split.amount * (expense.currencyCode === tour.baseCurrencyCode ? 1 : tour.currencies.find((c: Currency) => c.code === expense.currencyCode)?.exchangeRate || 1);

        return sum + splitBaseAmount;
      }, 0);

      // Payments made by this traveler
      const paymentsMade = tour.payments
        ? tour.payments
            .filter((payment) => payment.fromTravelerId === traveler.id)
            .reduce((sum, payment) => {
              const paymentBaseAmount = payment.currencyCode === tour.baseCurrencyCode ? payment.amount : payment.amount * (tour.currencies.find((c: Currency) => c.code === payment.currencyCode)?.exchangeRate || 1);
              return sum + paymentBaseAmount;
            }, 0)
        : 0;

      // Payments received by this traveler
      const paymentsReceived = tour.payments
        ? tour.payments
            .filter((payment) => payment.toTravelerId === traveler.id)
            .reduce((sum, payment) => {
              const paymentBaseAmount = payment.currencyCode === tour.baseCurrencyCode ? payment.amount : payment.amount * (tour.currencies.find((c: Currency) => c.code === payment.currencyCode)?.exchangeRate || 1);
              return sum + paymentBaseAmount;
            }, 0)
        : 0;

      // Calculate net expense balance (paid - owed)
      const netExpenseBalance = totalPaid - totalOwed;

      // Calculate net payment balance (received - made)
      const netPaymentBalance = paymentsReceived - paymentsMade;

      // Final balance
      const finalBalance = netExpenseBalance + netPaymentBalance;

      return {
        traveler,
        totalPaid: Math.round(totalPaid * 100) / 100,
        totalOwed: Math.round(totalOwed * 100) / 100,
        paymentsMade: Math.round(paymentsMade * 100) / 100,
        paymentsReceived: Math.round(paymentsReceived * 100) / 100,
        netExpenseBalance: Math.round(netExpenseBalance * 100) / 100,
        netPaymentBalance: Math.round(netPaymentBalance * 100) / 100,
        finalBalance: Math.round(finalBalance * 100) / 100,
      };
    });

    return totals;
  };

  const travelerTotals = calculateTravelerExpenseTotals(activeTour);

  const handleExportToExcel = () => {
    exportTourToExcel(activeTour);
  };

  const handleOpenPaymentDialog = (fromId?: string, toId?: string, amount?: number) => {
    if (fromId) setFromTravelerId(fromId);
    if (toId) setToTravelerId(toId);
    if (amount) setPaymentAmount(amount.toString());
    setPaymentCurrency(activeTour.baseCurrencyCode);

    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
    // Reset form
    setFromTravelerId("");
    setToTravelerId("");
    setPaymentAmount("");
    setPaymentCurrency("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentMethod("Cash");
    setPaymentNotes("");
  };

  const handleAddPayment = () => {
    if (fromTravelerId && toTravelerId && paymentAmount && paymentCurrency && paymentDate && activeTourId) {
      addPayment(activeTourId, {
        fromTravelerId,
        toTravelerId,
        amount: parseFloat(paymentAmount),
        currencyCode: paymentCurrency,
        date: paymentDate,
        description: paymentNotes || "Payment",
      });

      // Close dialog
      handleClosePaymentDialog();
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    if (confirm("Are you sure you want to delete this payment record?") && activeTourId) {
      removePayment(activeTourId, paymentId);
    }
  };

  // Format date as DD/MM/YYYY
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Settlements
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        Tour: {activeTour.name}
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        All amounts shown are in base currency ({activeTour.baseCurrencyCode}). Expenses in other currencies have been converted using the defined exchange rates.
      </Alert>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h5" component="h3" gutterBottom>
              Tour Summary
            </Typography>
            <Divider sx={{ mb: 3 }} />
            <List disablePadding>
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <BalanceIcon sx={{ mr: 1, color: "primary.main" }} fontSize="small" />
                      <Typography variant="body1" color="text.secondary">
                        Base Currency
                      </Typography>
                    </Box>
                  }
                />
                <Chip label={activeTour.baseCurrencyCode} color="primary" />
              </ListItem>
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <PersonIcon sx={{ mr: 1, color: "primary.main" }} fontSize="small" />
                      <Typography variant="body1" color="text.secondary">
                        Travelers
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="body1">{activeTour.travelers.length}</Typography>
              </ListItem>
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CurrencyIcon sx={{ mr: 1, color: "primary.main" }} fontSize="small" />
                      <Typography variant="body1" color="text.secondary">
                        Currencies
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="body1">{activeTour.currencies.length}</Typography>
              </ListItem>
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <ReceiptIcon sx={{ mr: 1, color: "primary.main" }} fontSize="small" />
                      <Typography variant="body1" color="text.secondary">
                        Expenses
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="body1">{activeTour.expenses.length}</Typography>
              </ListItem>
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <TransactionIcon sx={{ mr: 1, color: "primary.main" }} fontSize="small" />
                      <Typography variant="body1" color="text.secondary">
                        Total Transactions
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="body1">{activeTour.expenses.length + (activeTour.payments ? activeTour.payments.length : 0)}</Typography>
              </ListItem>
              <ListItem sx={{ py: 1 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <BalanceIcon sx={{ mr: 1, color: "primary.main" }} fontSize="small" />
                      <Typography variant="body1" color="text.secondary">
                        Total Spent
                      </Typography>
                    </Box>
                  }
                />
                <Typography variant="body1" fontWeight="bold">
                  {formatCurrency(
                    expensesByCategory.reduce((sum, category) => sum + category.total, 0),
                    activeTour.baseCurrencyCode
                  )}
                </Typography>
              </ListItem>
            </List>

            <Box sx={{ mt: 3 }}>
              <Button variant="contained" startIcon={<ExportIcon />} onClick={handleExportToExcel} fullWidth>
                Export to Excel
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h5" component="h3" gutterBottom>
              Expense Distribution by Category
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {expensesByCategory.length > 0 ? (
              <Box sx={{ height: 300, width: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={expensesByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="total" nameKey="categoryId" label={false}>
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip
                      formatter={(value: number, name: string, props: any) => {
                        // Calculate the percentage manually to avoid NaN
                        const total = expensesByCategory.reduce((sum, item) => sum + item.total, 0);
                        const percent = total > 0 ? ((value / total) * 100).toFixed(0) : "0";
                        return [`${formatCurrency(value, activeTour.baseCurrencyCode)} (${percent}%)`, name];
                      }}
                      contentStyle={{ backgroundColor: "rgba(255, 255, 255, 0.9)", borderRadius: "4px", padding: "10px", boxShadow: "0 2px 5px rgba(0,0,0,0.15)" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            ) : (
              <Typography variant="body1" color="text.secondary" sx={{ textAlign: "center", py: 5 }}>
                No expenses added yet.
              </Typography>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Expense Totals by Traveler
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={3}>
          {travelerTotals.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.traveler.id}>
              <Paper
                elevation={3}
                sx={{
                  p: 3,
                  bgcolor: "background.paper",
                  borderLeft: 6,
                  borderColor: item.finalBalance > 0 ? "success.main" : item.finalBalance < 0 ? "error.main" : "grey.300",
                }}
              >
                <Typography variant="h6" gutterBottom>
                  {item.traveler.name}
                </Typography>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Paid
                  </Typography>
                  <Typography variant="h6" color="text.primary">
                    {formatCurrency(item.totalPaid, activeTour.baseCurrencyCode)}
                  </Typography>
                </Box>

                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Total Owed
                  </Typography>
                  <Typography variant="h6" color="text.primary">
                    {formatCurrency(item.totalOwed, activeTour.baseCurrencyCode)}
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Final Balance
                  </Typography>
                  <Typography variant="h5" color={item.finalBalance > 0 ? "success.main" : item.finalBalance < 0 ? "error.main" : "text.primary"} sx={{ fontWeight: 600 }}>
                    {formatCurrency(Math.abs(item.finalBalance), activeTour.baseCurrencyCode)}
                    {item.finalBalance !== 0 && (
                      <Typography component="span" variant="body2" color={item.finalBalance > 0 ? "success.main" : "error.main"} sx={{ ml: 1 }}>
                        ({item.finalBalance > 0 ? "to receive" : "to pay"})
                      </Typography>
                    )}
                  </Typography>
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Settlement Plan
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {settlements.length === 0 ? (
          <Alert severity="info">No settlements needed. All expenses are balanced.</Alert>
        ) : (
          <>
            <Alert severity="info" sx={{ mb: 3 }}>
              This settlement plan is calculated based on the current expense and payment data in the database. It shows the exact amounts each person needs to pay to settle all debts.
            </Alert>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>From</TableCell>
                    <TableCell>To</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Details</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {settlements.map((settlement, index) => {
                    const fromTraveler = activeTour.travelers.find((t) => t.id === settlement.fromTravelerId);
                    const toTraveler = activeTour.travelers.find((t) => t.id === settlement.toTravelerId);

                    // Find the traveler totals for additional info
                    const fromTravelerTotal = travelerTotals.find((t) => t.traveler.id === settlement.fromTravelerId);
                    const toTravelerTotal = travelerTotals.find((t) => t.traveler.id === settlement.toTravelerId);

                    return (
                      <TableRow key={index}>
                        <TableCell>
                          <Typography variant="body1">{fromTraveler?.name || "Unknown"}</Typography>
                          {fromTravelerTotal && (
                            <Typography variant="caption" color="text.secondary">
                              Balance: {formatCurrency(fromTravelerTotal.finalBalance, activeTour.baseCurrencyCode)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1">{toTraveler?.name || "Unknown"}</Typography>
                          {toTravelerTotal && (
                            <Typography variant="caption" color="text.secondary">
                              Balance: {formatCurrency(toTravelerTotal.finalBalance, activeTour.baseCurrencyCode)}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Typography variant="body1" fontWeight="bold">
                            {formatCurrency(settlement.amount, settlement.currencyCode)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="caption">This payment will settle {fromTraveler?.name}'s debt.</Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Button variant="outlined" size="small" onClick={() => handleOpenPaymentDialog(settlement.fromTravelerId, settlement.toTravelerId, settlement.amount)}>
                            Record Payment
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Paper>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onClose={handleClosePaymentDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Record Payment</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>From</InputLabel>
                <Select value={fromTravelerId} onChange={(e) => setFromTravelerId(e.target.value)} label="From">
                  {activeTour.travelers.map((traveler: Traveler) => (
                    <MenuItem key={traveler.id} value={traveler.id}>
                      {traveler.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>To</InputLabel>
                <Select value={toTravelerId} onChange={(e) => setToTravelerId(e.target.value)} label="To">
                  {activeTour.travelers.map((traveler: Traveler) => (
                    <MenuItem key={traveler.id} value={traveler.id} disabled={traveler.id === fromTravelerId}>
                      {traveler.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                InputProps={{
                  startAdornment: <InputAdornment position="start">{paymentCurrency}</InputAdornment>,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select value={paymentCurrency} onChange={(e) => setPaymentCurrency(e.target.value)} label="Currency">
                  {activeTour.currencies.map((currency: Currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes (Optional)" multiline rows={2} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button onClick={handleAddPayment} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Settlements;
