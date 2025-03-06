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
import { convertCurrency, formatCurrency, getTravelerName } from "../utils";
import { exportTourToExcel } from "../utils/excelExport";
import { calculateSettlements } from "../utils/settlementCalculator";

const Settlements: React.FC = () => {
  const { state, addPayment, removePayment } = useAppContext();
  const { tours, activeTourId, expenseCategories } = state;
  const navigate = useNavigate();

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

  const activeTour = tours.find((tour) => tour.id === activeTourId);

  if (!activeTour) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        No active tour selected. Please select or create a tour first.
      </Alert>
    );
  }

  const settlements = calculateSettlements(activeTour);

  // Calculate expense totals by category
  const calculateExpensesByCategory = () => {
    const categoryTotals: Record<string, number> = {};

    // Initialize all categories with 0
    expenseCategories.forEach((category) => {
      categoryTotals[category.id] = 0;
    });

    // Sum up expenses by category
    activeTour.expenses.forEach((expense) => {
      const amount = expense.currencyCode !== activeTour.baseCurrencyCode ? convertCurrency(expense.amount, expense.currencyCode, activeTour.baseCurrencyCode, activeTour.currencies) : expense.amount;

      if (categoryTotals[expense.categoryId] !== undefined) {
        categoryTotals[expense.categoryId] += amount;
      } else {
        categoryTotals[expense.categoryId] = amount;
      }
    });

    // Convert to array format for the chart
    return Object.entries(categoryTotals)
      .map(([categoryId, amount]) => {
        const category = expenseCategories.find((c) => c.id === categoryId);
        return {
          name: category ? category.name : "Unknown",
          value: Math.round(amount * 100) / 100,
          color: category ? category.color : "#ccc",
        };
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value);
  };

  const expensesByCategory = calculateExpensesByCategory();

  // Calculate expense totals for each traveler
  const calculateTravelerExpenseTotals = (travelerId: string) => {
    // Total paid by this traveler
    const totalPaid = activeTour.expenses
      .filter((expense: any) => expense.paidById === travelerId)
      .reduce((sum: number, expense: any) => {
        // Get the base amount (amount in base currency)
        let expenseAmount = 0;

        // Use the pre-calculated baseAmount if available
        if (expense.baseAmount !== undefined) {
          expenseAmount = expense.baseAmount;
        } else {
          // Otherwise calculate using the exchange rate
          if (expense.currencyCode !== activeTour.baseCurrencyCode) {
            const currency = activeTour.currencies.find((c: any) => c.code === expense.currencyCode);
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

        return sum + expenseAmount;
      }, 0);

    // Total owed by this traveler
    const totalOwed = activeTour.expenses.reduce((sum: number, expense: any) => {
      const split = expense.splits.find((s: any) => s.travelerId === travelerId);
      if (!split) return sum;

      // Get the base amount for the split
      let splitAmount = 0;

      // Use the pre-calculated baseAmount if available
      if (split.baseAmount !== undefined) {
        splitAmount = split.baseAmount;
      } else {
        // If expense has baseAmount, calculate proportionally
        if (expense.baseAmount !== undefined) {
          splitAmount = split.amount * (expense.baseAmount / expense.amount);
        } else {
          // Otherwise calculate using the exchange rate
          if (expense.currencyCode !== activeTour.baseCurrencyCode) {
            const currency = activeTour.currencies.find((c: any) => c.code === expense.currencyCode);
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

      return sum + splitAmount;
    }, 0);

    // Calculate payments made by this traveler
    const paymentsMade = activeTour.payments
      ? activeTour.payments
          .filter((payment: any) => payment.fromTravelerId === travelerId)
          .reduce((sum: number, payment: any) => {
            // Convert to base currency if needed
            let paymentAmount = payment.amount;
            if (payment.currencyCode !== activeTour.baseCurrencyCode) {
              const currency = activeTour.currencies.find((c: any) => c.code === payment.currencyCode);
              if (currency) {
                // If 1 USD = 124.64 BDT, then 1200 USD should be 1200 * 124.64 = 149,568 BDT
                paymentAmount = payment.amount * currency.exchangeRate;
              }
            }
            return sum + paymentAmount;
          }, 0)
      : 0;

    // Calculate payments received by this traveler
    const paymentsReceived = activeTour.payments
      ? activeTour.payments
          .filter((payment: any) => payment.toTravelerId === travelerId)
          .reduce((sum: number, payment: any) => {
            // Convert to base currency if needed
            let paymentAmount = payment.amount;
            if (payment.currencyCode !== activeTour.baseCurrencyCode) {
              const currency = activeTour.currencies.find((c: any) => c.code === payment.currencyCode);
              if (currency) {
                // If 1 USD = 124.64 BDT, then 1200 USD should be 1200 * 124.64 = 149,568 BDT
                paymentAmount = payment.amount * currency.exchangeRate;
              }
            }
            return sum + paymentAmount;
          }, 0)
      : 0;

    // Calculate net expense balance (what they paid minus what they owed)
    const netExpenseBalance = totalPaid - totalOwed;

    // Calculate net payment balance (what they received minus what they paid)
    const netPaymentBalance = paymentsReceived - paymentsMade;

    // Calculate final balance (net expense balance plus net payment balance)
    const finalBalance = netExpenseBalance + netPaymentBalance;

    return {
      totalPaid: Math.round(totalPaid * 100) / 100,
      totalOwed: Math.round(totalOwed * 100) / 100,
      paymentsMade: Math.round(paymentsMade * 100) / 100,
      paymentsReceived: Math.round(paymentsReceived * 100) / 100,
      netExpenseBalance: Math.round(netExpenseBalance * 100) / 100,
      netPaymentBalance: Math.round(netPaymentBalance * 100) / 100,
      finalBalance: Math.round(finalBalance * 100) / 100,
    };
  };

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
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Settlements
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom color="text.secondary">
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
                    <Pie data={expensesByCategory} cx="50%" cy="50%" labelLine={false} outerRadius={80} fill="#8884d8" dataKey="value" nameKey="name" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}>
                      {expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Legend />
                    <RechartsTooltip formatter={(value: number) => [`${formatCurrency(value, activeTour.baseCurrencyCode)}`, "Amount"]} />
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
          <Typography variant="h5" component="h3">
            Expense Totals by Traveler
          </Typography>
        </Box>
        <Divider sx={{ mb: 3 }} />

        <Grid container spacing={2}>
          {activeTour.travelers.map((traveler) => {
            const totals = calculateTravelerExpenseTotals(traveler.id);
            const isPositive = totals.finalBalance > 0;
            const isNeutral = Math.abs(totals.finalBalance) < 0.01;

            return (
              <Grid item xs={12} md={4} key={traveler.id}>
                <Paper
                  elevation={1}
                  sx={{
                    p: 2,
                    bgcolor: isNeutral ? "success.light" : isPositive ? "success.light" : "error.light",
                    color: isNeutral ? "success.contrastText" : isPositive ? "success.contrastText" : "error.contrastText",
                  }}
                >
                  <Typography variant="h6" component="h4" gutterBottom>
                    {traveler.name}
                  </Typography>
                  <Typography variant="h5" component="div" align="right" sx={{ mb: 1 }}>
                    {isPositive ? "" : "-"}
                    {formatCurrency(Math.abs(totals.finalBalance), activeTour.baseCurrencyCode)}
                  </Typography>
                  <Typography variant="body2" align="right">
                    Expenses: {formatCurrency(totals.totalOwed, activeTour.baseCurrencyCode)}, Payments: {formatCurrency(totals.paymentsMade, activeTour.baseCurrencyCode)}
                  </Typography>
                </Paper>
              </Grid>
            );
          })}
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
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlements.map((settlement, index) => (
                  <TableRow key={index}>
                    <TableCell>{getTravelerName(settlement.fromTravelerId, activeTour.travelers)}</TableCell>
                    <TableCell>{getTravelerName(settlement.toTravelerId, activeTour.travelers)}</TableCell>
                    <TableCell>{formatCurrency(settlement.amount, settlement.currencyCode)}</TableCell>
                    <TableCell align="right">
                      <Button variant="outlined" size="small" onClick={() => handleOpenPaymentDialog(settlement.fromTravelerId, settlement.toTravelerId, settlement.amount)}>
                        Record Payment
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
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
                  {activeTour.travelers.map((traveler) => (
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
                  {activeTour.travelers.map((traveler) => (
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
                  {activeTour.currencies.map((currency) => (
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
    </>
  );
};

export default Settlements;
