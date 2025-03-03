import { Add as AddIcon, AccountBalance as BalanceIcon, CurrencyExchange as CurrencyIcon, Delete as DeleteIcon, FileDownload as ExportIcon, Person as PersonIcon, Receipt as ReceiptIcon, SwapHoriz as TransactionIcon } from "@mui/icons-material";
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
  IconButton,
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
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { calculateSettlements, formatCurrency, getTravelerName } from "../utils";
import { exportTourToExcel } from "../utils/excelExport";

const Settlements: React.FC = () => {
  const { state, addPayment, removePayment } = useApp();
  const { tours, activeTourId } = state;
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

  const handleOpenPaymentDialog = (fromId?: string, toId?: string, amount?: number) => {
    if (fromId) setFromTravelerId(fromId);
    if (toId) setToTravelerId(toId);
    if (amount) setPaymentAmount(amount.toString());
    if (activeTour.baseCurrencyCode) setPaymentCurrency(activeTour.baseCurrencyCode);

    setPaymentDialogOpen(true);
  };

  const handleClosePaymentDialog = () => {
    setPaymentDialogOpen(false);
  };

  const handleAddPayment = () => {
    if (fromTravelerId && toTravelerId && paymentAmount && paymentCurrency && paymentDate && paymentMethod) {
      addPayment(activeTourId, {
        fromTravelerId,
        toTravelerId,
        amount: parseFloat(paymentAmount),
        currencyCode: paymentCurrency,
        date: paymentDate,
        method: paymentMethod,
        notes: paymentNotes || undefined,
      });

      // Reset form
      setFromTravelerId("");
      setToTravelerId("");
      setPaymentAmount("");
      setPaymentCurrency("");
      setPaymentDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("Cash");
      setPaymentNotes("");

      // Close dialog
      setPaymentDialogOpen(false);
    }
  };

  const handleDeletePayment = (paymentId: string) => {
    if (confirm("Are you sure you want to delete this payment record?")) {
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
                <Typography variant="body1" fontWeight="medium">
                  {activeTour.travelers.length}
                </Typography>
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
                <Typography variant="body1" fontWeight="medium">
                  {activeTour.currencies.length}
                </Typography>
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
                <Typography variant="body1" fontWeight="medium">
                  {activeTour.expenses.length}
                </Typography>
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
                <Typography variant="body1" fontWeight="medium">
                  {settlements.length}
                </Typography>
              </ListItem>
            </List>
            <Box sx={{ mt: 3 }}>
              <Button variant="contained" color="primary" startIcon={<ExportIcon />} onClick={handleExportToExcel}>
                Export to Excel
              </Button>
            </Box>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper elevation={2} sx={{ p: 3, height: "100%" }}>
            <Typography variant="h5" component="h3" gutterBottom>
              Expense Totals by Traveler
            </Typography>
            <Divider sx={{ mb: 3 }} />
            {activeTour.travelers.length === 0 ? (
              <Alert severity="info">No travelers added yet.</Alert>
            ) : (
              <List disablePadding>
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
                        return sum + split.amount / currency.exchangeRate;
                      }
                    }

                    return sum + split.amount;
                  }, 0);

                  const balance = totalPaid - totalOwed;

                  return (
                    <ListItem
                      key={traveler.id}
                      sx={{
                        py: 1.5,
                        px: 2,
                        mb: 1,
                        borderRadius: 1,
                        bgcolor: balance > 0 ? "success.light" : balance < 0 ? "error.light" : "transparent",
                      }}
                    >
                      <ListItemText primary={traveler.name} primaryTypographyProps={{ fontWeight: "medium" }} />
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body1" fontWeight="medium" color={balance > 0 ? "success.main" : balance < 0 ? "error.main" : "text.primary"}>
                          {formatCurrency(balance, activeTour.baseCurrencyCode)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Paid: {formatCurrency(totalPaid, activeTour.baseCurrencyCode)}, Owed: {formatCurrency(totalOwed, activeTour.baseCurrencyCode)}
                        </Typography>
                      </Box>
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" component="h3" gutterBottom sx={{ mb: 0 }}>
            Payment Records
          </Typography>
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => handleOpenPaymentDialog()}>
            Add Payment
          </Button>
        </Box>
        <Divider sx={{ mb: 3 }} />

        {activeTour.payments && activeTour.payments.length > 0 ? (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Method</TableCell>
                  <TableCell>Notes</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeTour.payments
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>{formatDate(payment.date)}</TableCell>
                      <TableCell>{getTravelerName(payment.fromTravelerId, activeTour.travelers)}</TableCell>
                      <TableCell>{getTravelerName(payment.toTravelerId, activeTour.travelers)}</TableCell>
                      <TableCell>{formatCurrency(payment.amount, payment.currencyCode)}</TableCell>
                      <TableCell>{payment.method}</TableCell>
                      <TableCell>{payment.notes || "-"}</TableCell>
                      <TableCell>
                        <IconButton size="small" color="error" onClick={() => handleDeletePayment(payment.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">No payment records added yet.</Alert>
        )}
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Settlement Plan
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {activeTour.expenses.length === 0 ? (
          <Alert severity="info">No expenses added yet. Add expenses to generate a settlement plan.</Alert>
        ) : settlements.length === 0 ? (
          <Alert severity="success">No settlements needed. All expenses are already balanced.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>From</TableCell>
                  <TableCell>To</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {settlements.map((settlement, index) => (
                  <TableRow key={index}>
                    <TableCell>{getTravelerName(settlement.fromTravelerId, activeTour.travelers)}</TableCell>
                    <TableCell>{getTravelerName(settlement.toTravelerId, activeTour.travelers)}</TableCell>
                    <TableCell>{formatCurrency(settlement.amount, settlement.currencyCode)}</TableCell>
                    <TableCell>
                      <Button size="small" variant="outlined" onClick={() => handleOpenPaymentDialog(settlement.fromTravelerId, settlement.toTravelerId, settlement.amount)}>
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
              <FormControl fullWidth required>
                <InputLabel id="from-traveler-label">From</InputLabel>
                <Select labelId="from-traveler-label" value={fromTravelerId} onChange={(e) => setFromTravelerId(e.target.value)} label="From">
                  {activeTour.travelers.map((traveler) => (
                    <MenuItem key={traveler.id} value={traveler.id}>
                      {traveler.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="to-traveler-label">To</InputLabel>
                <Select labelId="to-traveler-label" value={toTravelerId} onChange={(e) => setToTravelerId(e.target.value)} label="To">
                  {activeTour.travelers.map((traveler) => (
                    <MenuItem key={traveler.id} value={traveler.id}>
                      {traveler.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Amount" type="number" value={paymentAmount} onChange={(e) => setPaymentAmount(e.target.value)} required inputProps={{ min: "0.01", step: "0.01" }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select labelId="currency-label" value={paymentCurrency} onChange={(e) => setPaymentCurrency(e.target.value)} label="Currency">
                  <MenuItem value={activeTour.baseCurrencyCode}>{activeTour.baseCurrencyCode}</MenuItem>
                  {activeTour.currencies.map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="method-label">Payment Method</InputLabel>
                <Select labelId="method-label" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} label="Payment Method">
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="Bank Transfer">Bank Transfer</MenuItem>
                  <MenuItem value="Wise">Wise</MenuItem>
                  <MenuItem value="Old Debt">Old Debt</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Notes" multiline rows={2} value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} placeholder="Optional notes about this payment" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePaymentDialog}>Cancel</Button>
          <Button onClick={handleAddPayment} variant="contained" color="primary">
            Save Payment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Settlements;
