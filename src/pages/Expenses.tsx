import { Add as AddIcon, Delete as DeleteIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, Person as PersonIcon } from "@mui/icons-material";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
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
import { useApp } from "../context/AppContext";
import { ExpenseSplit } from "../types";
import { formatCurrency, getTravelerName } from "../utils";

const Expenses: React.FC = () => {
  const { state, addExpense, updateExpense, removeExpense } = useApp();
  const { tours, activeTourId } = state;
  const navigate = useNavigate();

  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Form state for new expense
  const [newExpenseDate, setNewExpenseDate] = useState(new Date().toISOString().split("T")[0]);
  const [newExpenseAmount, setNewExpenseAmount] = useState("");
  const [newExpenseCurrency, setNewExpenseCurrency] = useState("");
  const [newExpenseDescription, setNewExpenseDescription] = useState("");
  const [newExpensePaidBy, setNewExpensePaidBy] = useState("");
  const [newExpenseSplits, setNewExpenseSplits] = useState<ExpenseSplit[]>([]);
  const [splitEqually, setSplitEqually] = useState(true);
  const [totalAmount, setTotalAmount] = useState(0);

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

  // Initialize splits when expense amount changes
  useEffect(() => {
    if (activeTour.travelers.length > 0 && parseFloat(newExpenseAmount) > 0) {
      const expenseAmount = parseFloat(newExpenseAmount);
      const equalAmount = expenseAmount / activeTour.travelers.length;

      if (splitEqually) {
        const equalSplits = activeTour.travelers.map((traveler) => ({
          travelerId: traveler.id,
          amount: parseFloat(equalAmount.toFixed(2)),
          percentage: 0,
        }));
        setNewExpenseSplits(equalSplits);
      }
    }
  }, [newExpenseAmount, activeTour.travelers, splitEqually]);

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (newExpenseDate && newExpenseAmount && newExpenseCurrency && newExpenseDescription && newExpensePaidBy && newExpenseSplits.length > 0) {
      const amount = parseFloat(newExpenseAmount);

      // Calculate the total split amount to ensure it matches the expense amount
      const totalSplitAmount = newExpenseSplits.reduce((sum, split) => sum + split.amount, 0);

      // Only proceed if the total split amount equals the expense amount
      if (Math.abs(totalSplitAmount - amount) < 0.01) {
        // Create the expense with amount-based splits
        addExpense(activeTourId, {
          date: newExpenseDate,
          amount,
          currencyCode: newExpenseCurrency,
          description: newExpenseDescription,
          paidById: newExpensePaidBy,
          splits: newExpenseSplits,
        });

        // Reset form
        setNewExpenseDate(new Date().toISOString().split("T")[0]);
        setNewExpenseAmount("");
        setNewExpenseCurrency("");
        setNewExpenseDescription("");
        setNewExpensePaidBy("");
        setNewExpenseSplits([]);
        setSplitEqually(true);
        setTotalAmount(0);
      } else {
        // Show error or adjust splits automatically
        alert(`The total split amount (${totalSplitAmount.toFixed(2)}) must equal the expense amount (${amount.toFixed(2)})`);
      }
    }
  };

  const handleSplitAmountChange = (travelerId: string, amount: number) => {
    const updatedSplits = newExpenseSplits.map((split) => (split.travelerId === travelerId ? { ...split, amount, percentage: 0 } : split));
    setNewExpenseSplits(updatedSplits);

    // Check if the total matches the expense amount
    const totalSplitAmount = updatedSplits.reduce((sum, split) => sum + split.amount, 0);
    const expenseAmount = parseFloat(newExpenseAmount) || 0;

    // Check if splits are equal
    const equalAmount = expenseAmount / activeTour.travelers.length;
    const isEqual = updatedSplits.every((split) => Math.abs(split.amount - equalAmount) < 0.01);
    setSplitEqually(isEqual);
  };

  const handleSplitEqually = () => {
    const expenseAmount = parseFloat(newExpenseAmount) || 0;
    const equalAmount = expenseAmount / activeTour.travelers.length;

    const equalSplits = activeTour.travelers.map((traveler) => ({
      travelerId: traveler.id,
      amount: parseFloat(equalAmount.toFixed(2)),
      percentage: 0, // We're not using percentage anymore
    }));

    setNewExpenseSplits(equalSplits);
    setSplitEqually(true);
  };

  const handleExpenseAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAmount = e.target.value;
    setNewExpenseAmount(newAmount);

    const expenseAmount = parseFloat(newAmount) || 0;
    setTotalAmount(expenseAmount);
  };

  const handleOpenDeleteDialog = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (expenseToDelete) {
      removeExpense(activeTourId, expenseToDelete);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const toggleExpenseDetails = (expenseId: string) => {
    setExpandedExpenseId(expandedExpenseId === expenseId ? null : expenseId);
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Expenses
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom color="text.secondary">
        Tour: {activeTour.name}
      </Typography>

      {activeTour.travelers.length === 0 ? (
        <Alert
          severity="warning"
          sx={{ mb: 4 }}
          action={
            <Button color="inherit" size="small" onClick={() => navigate("/travelers")}>
              Add Travelers
            </Button>
          }
        >
          You need to add travelers before you can add expenses.
        </Alert>
      ) : (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" component="h3" gutterBottom>
            Add New Expense
          </Typography>
          <Divider sx={{ mb: 3 }} />
          <Box component="form" onSubmit={handleAddExpense}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth label="Date" type="date" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} required InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField fullWidth label="Amount" type="number" placeholder="e.g., 50.00" value={newExpenseAmount} onChange={handleExpenseAmountChange} inputProps={{ min: "0.01", step: "0.01" }} required />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth required>
                  <InputLabel id="currency-select-label">Currency</InputLabel>
                  <Select labelId="currency-select-label" value={newExpenseCurrency} onChange={(e) => setNewExpenseCurrency(e.target.value)} label="Currency">
                    <MenuItem value={activeTour.baseCurrencyCode}>{activeTour.baseCurrencyCode}</MenuItem>
                    {activeTour.currencies.map((currency) => (
                      <MenuItem key={currency.code} value={currency.code}>
                        {currency.code} - {currency.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth required>
                  <InputLabel id="paidby-label">Paid By</InputLabel>
                  <Select
                    labelId="paidby-label"
                    id="expensePaidBy"
                    value={newExpensePaidBy}
                    onChange={(e) => setNewExpensePaidBy(e.target.value)}
                    label="Paid By"
                    startAdornment={
                      <InputAdornment position="start">
                        <PersonIcon color="action" />
                      </InputAdornment>
                    }
                  >
                    {activeTour.travelers.map((traveler) => (
                      <MenuItem key={traveler.id} value={traveler.id}>
                        {traveler.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="h6">Split</Typography>
                <Button variant="contained" color="secondary" onClick={handleSplitEqually} disabled={!newExpenseAmount || parseFloat(newExpenseAmount) <= 0}>
                  SPLIT EQUALLY
                </Button>
              </Box>

              <Paper elevation={1} sx={{ p: 3, bgcolor: "background.paper" }}>
                {activeTour.travelers.length === 0 ? (
                  <Alert severity="warning">No travelers added yet. Please add travelers first.</Alert>
                ) : !newExpenseAmount || parseFloat(newExpenseAmount) <= 0 ? (
                  <Alert severity="info">Enter an expense amount above to split it among travelers.</Alert>
                ) : (
                  <>
                    {activeTour.travelers.map((traveler) => {
                      const split = newExpenseSplits.find((s) => s.travelerId === traveler.id) || {
                        travelerId: traveler.id,
                        amount: 0,
                        percentage: 0,
                      };

                      return (
                        <Grid container spacing={2} key={traveler.id} sx={{ mb: 2 }} alignItems="center">
                          <Grid item xs={12} sm={4} md={3}>
                            <Typography variant="body1">{traveler.name}</Typography>
                          </Grid>
                          <Grid item xs={12} sm={6} md={7}>
                            <TextField
                              fullWidth
                              type="number"
                              label={`Amount in ${newExpenseCurrency || activeTour.baseCurrencyCode}`}
                              value={split.amount}
                              onChange={(e) => handleSplitAmountChange(traveler.id, parseFloat(e.target.value) || 0)}
                              InputProps={{
                                startAdornment: <InputAdornment position="start">{newExpenseCurrency || activeTour.baseCurrencyCode}</InputAdornment>,
                              }}
                              variant="outlined"
                              size="small"
                            />
                          </Grid>
                          <Grid item xs={12} sm={2} md={2}>
                            <Typography variant="body2" color="text.secondary" align="right">
                              {((split.amount / (parseFloat(newExpenseAmount) || 1)) * 100).toFixed(1)}%
                            </Typography>
                          </Grid>
                        </Grid>
                      );
                    })}

                    <Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", borderTop: "1px solid", borderColor: "divider", pt: 2 }}>
                      <Typography variant="subtitle1">Total Split:</Typography>
                      <Typography variant="subtitle1" color={Math.abs(newExpenseSplits.reduce((sum, split) => sum + split.amount, 0) - parseFloat(newExpenseAmount || "0")) < 0.01 ? "success.main" : "error.main"}>
                        {newExpenseCurrency || activeTour.baseCurrencyCode} {newExpenseSplits.reduce((sum, split) => sum + split.amount, 0).toFixed(2)}
                        {Math.abs(newExpenseSplits.reduce((sum, split) => sum + split.amount, 0) - parseFloat(newExpenseAmount || "0")) >= 0.01 && (
                          <Typography component="span" variant="caption" color="error.main" sx={{ ml: 1 }}>
                            (Doesn't match expense amount: {newExpenseCurrency || activeTour.baseCurrencyCode} {parseFloat(newExpenseAmount || "0").toFixed(2)})
                          </Typography>
                        )}
                      </Typography>
                    </Box>
                  </>
                )}
              </Paper>
            </Box>

            <Grid item xs={12}>
              <Button type="submit" variant="contained" color="primary" startIcon={<AddIcon />} sx={{ mt: 2 }}>
                ADD EXPENSE
              </Button>
            </Grid>
          </Box>
        </Paper>
      )}

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Expenses
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {activeTour.expenses.length === 0 ? (
          <Alert severity="info">No expenses added yet.</Alert>
        ) : (
          <Stack spacing={2}>
            {activeTour.expenses
              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
              .map((expense) => {
                const paidBy = activeTour.travelers.find((t) => t.id === expense.paidById);
                const currency = activeTour.currencies.find((c) => c.code === expense.currencyCode);

                return (
                  <Card key={expense.id} variant="outlined">
                    <CardContent sx={{ pb: 1 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer" }} onClick={() => toggleExpenseDetails(expense.id)}>
                        <Box>
                          <Typography variant="h6">{expense.description}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {new Date(expense.date).toLocaleDateString()}
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <Typography variant="h6" color="primary">
                            {formatCurrency(expense.amount, expense.currencyCode)}
                          </Typography>
                          {expandedExpenseId === expense.id ? <ExpandLessIcon sx={{ ml: 1 }} /> : <ExpandMoreIcon sx={{ ml: 1 }} />}
                        </Box>
                      </Box>
                      <Collapse in={expandedExpenseId === expense.id}>
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="body2">
                            <strong>Paid by:</strong> {paidBy?.name || "Unknown"}
                          </Typography>
                          <Typography variant="body2">
                            <strong>Currency:</strong> {currency?.name || expense.currencyCode}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="subtitle2" gutterBottom>
                            Split Details:
                          </Typography>
                          <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Traveler</TableCell>
                                  <TableCell align="right">Amount</TableCell>
                                  <TableCell align="right">Percentage</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {expense.splits.map((split) => (
                                  <TableRow key={split.travelerId}>
                                    <TableCell>{getTravelerName(split.travelerId, activeTour.travelers)}</TableCell>
                                    <TableCell align="right">{formatCurrency(split.amount, expense.currencyCode)}</TableCell>
                                    <TableCell align="right">{split.percentage.toFixed(2)}%</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Collapse>
                    </CardContent>
                    <CardActions sx={{ justifyContent: "flex-end", pt: 0 }}>
                      <IconButton size="small" color="error" onClick={() => handleOpenDeleteDialog(expense.id)} title="Delete Expense">
                        <DeleteIcon />
                      </IconButton>
                    </CardActions>
                  </Card>
                );
              })}
          </Stack>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to remove this expense? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Expenses;
