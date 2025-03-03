import { Add as AddIcon, DateRange as DateIcon, Delete as DeleteIcon, Description as DescriptionIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, AttachMoney as MoneyIcon, Person as PersonIcon } from "@mui/icons-material";
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
  Slider,
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
          <form onSubmit={handleAddExpense}>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  id="expenseDate"
                  label="Date"
                  type="date"
                  value={newExpenseDate}
                  onChange={(e) => setNewExpenseDate(e.target.value)}
                  required
                  InputLabelProps={{ shrink: true }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DateIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  id="expenseDescription"
                  label="Description"
                  placeholder="e.g., Dinner at Restaurant"
                  value={newExpenseDescription}
                  onChange={(e) => setNewExpenseDescription(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <DescriptionIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  id="expenseAmount"
                  label="Amount"
                  type="number"
                  placeholder="e.g., 50.00"
                  value={newExpenseAmount}
                  onChange={(e) => setNewExpenseAmount(e.target.value)}
                  inputProps={{ min: "0.01", step: "0.01" }}
                  required
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <MoneyIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth required>
                  <InputLabel id="currency-label">Currency</InputLabel>
                  <Select labelId="currency-label" id="expenseCurrency" value={newExpenseCurrency} onChange={(e) => setNewExpenseCurrency(e.target.value)} label="Currency">
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

            <Box sx={{ mt: 4, mb: 3 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="subtitle1" fontWeight="bold">
                  Split
                </Typography>
                <Button size="small" onClick={handleSplitEqually} color="primary" variant={splitEqually ? "contained" : "outlined"}>
                  Split Equally
                </Button>
              </Box>

              <Paper sx={{ p: 3, bgcolor: "background.default" }}>
                {newExpenseSplits.map((split) => {
                  const traveler = activeTour.travelers.find((t) => t.id === split.travelerId);

                  if (!traveler) return null;

                  return (
                    <Box key={traveler.id} sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                      <Typography sx={{ width: "30%", flexShrink: 0 }}>{traveler.name}</Typography>
                      <Box sx={{ width: "70%", display: "flex", alignItems: "center" }}>
                        <Slider value={split.percentage} onChange={(_, value) => handleSplitPercentageChange(traveler.id, value as number)} min={0} max={100} step={0.01} sx={{ mr: 2, flexGrow: 1 }} />
                        <TextField
                          value={split.percentage}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              handleSplitPercentageChange(traveler.id, value);
                            }
                          }}
                          type="number"
                          size="small"
                          inputProps={{ min: 0, max: 100, step: 0.01 }}
                          sx={{ width: 80 }}
                          InputProps={{
                            endAdornment: <InputAdornment position="end">%</InputAdornment>,
                          }}
                        />
                      </Box>
                    </Box>
                  );
                })}
              </Paper>
            </Box>

            <Button type="submit" variant="contained" color="primary" startIcon={<AddIcon />} size="large">
              Add Expense
            </Button>
          </form>
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
