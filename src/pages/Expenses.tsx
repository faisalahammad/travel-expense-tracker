import { Delete as DeleteIcon, Edit as EditIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, FilterList as FilterIcon, Search as SearchIcon } from "@mui/icons-material";
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
import { Expense, ExpenseSplit } from "../types";
import { formatCurrency, getTravelerName } from "../utils";

const Expenses: React.FC = () => {
  const { state, addExpense, updateExpense, removeExpense } = useApp();
  const { tours, activeTourId } = state;
  const navigate = useNavigate();

  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);

  // Edit expense state
  const [editMode, setEditMode] = useState(false);
  const [editExpenseId, setEditExpenseId] = useState<string | null>(null);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPaidBy, setFilterPaidBy] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // Form state for new/edit expense
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
          amount: parseFloat((expenseAmount / activeTour.travelers.length).toFixed(2)),
          percentage: 0,
        }));

        // Adjust the last split to account for rounding errors
        const totalSplitAmount = equalSplits.reduce((sum, split) => sum + split.amount, 0);
        if (totalSplitAmount !== expenseAmount && equalSplits.length > 0) {
          const diff = expenseAmount - totalSplitAmount;
          equalSplits[equalSplits.length - 1].amount = parseFloat((equalSplits[equalSplits.length - 1].amount + diff).toFixed(2));
        }

        setNewExpenseSplits(equalSplits);
      }
    }
  }, [newExpenseAmount, activeTour.travelers, splitEqually]);

  const resetForm = () => {
    setNewExpenseDate(new Date().toISOString().split("T")[0]);
    setNewExpenseAmount("");
    setNewExpenseCurrency("");
    setNewExpenseDescription("");
    setNewExpensePaidBy("");
    setNewExpenseSplits([]);
    setSplitEqually(true);
    setTotalAmount(0);
    setEditMode(false);
    setEditExpenseId(null);
  };

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (newExpenseDate && newExpenseAmount && newExpenseCurrency && newExpenseDescription && newExpensePaidBy && newExpenseSplits.length > 0) {
      const amount = parseFloat(newExpenseAmount);

      // Calculate the total split amount to ensure it matches the expense amount
      const totalSplitAmount = newExpenseSplits.reduce((sum, split) => sum + split.amount, 0);

      // Only proceed if the total split amount equals the expense amount
      if (Math.abs(totalSplitAmount - amount) < 0.01) {
        if (editMode && editExpenseId) {
          // Update existing expense
          updateExpense(activeTourId, editExpenseId, {
            date: newExpenseDate,
            amount,
            currencyCode: newExpenseCurrency,
            description: newExpenseDescription,
            paidById: newExpensePaidBy,
            splits: newExpenseSplits,
          });
        } else {
          // Create new expense
          addExpense(activeTourId, {
            date: newExpenseDate,
            amount,
            currencyCode: newExpenseCurrency,
            description: newExpenseDescription,
            paidById: newExpensePaidBy,
            splits: newExpenseSplits,
          });
        }

        // Reset form
        resetForm();
      } else {
        // Show error or adjust splits automatically
        alert(`The total split amount (${totalSplitAmount.toFixed(2)}) must equal the expense amount (${amount.toFixed(2)})`);
      }
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditMode(true);
    setEditExpenseId(expense.id);
    setNewExpenseDate(expense.date);
    setNewExpenseAmount(expense.amount.toString());
    setNewExpenseCurrency(expense.currencyCode);
    setNewExpenseDescription(expense.description);
    setNewExpensePaidBy(expense.paidById);
    setNewExpenseSplits(expense.splits);
    setSplitEqually(false); // Don't automatically split equally when editing
    setTotalAmount(expense.amount);

    // Scroll to the form
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    resetForm();
  };

  const handleSplitAmountChange = (travelerId: string, amount: number) => {
    // Get the current split for this traveler
    const currentSplit = newExpenseSplits.find((split) => split.travelerId === travelerId);

    // If the amount is 0, we're effectively unchecking this traveler
    const isUnchecking = amount === 0 && currentSplit && currentSplit.amount > 0;

    // Update the split for this traveler
    const updatedSplits = newExpenseSplits.map((split) => (split.travelerId === travelerId ? { ...split, amount, percentage: 0 } : split));

    // If we're unchecking a traveler, redistribute their amount to other travelers with non-zero amounts
    if (isUnchecking) {
      const expenseAmount = parseFloat(newExpenseAmount) || 0;
      const activeSplits = updatedSplits.filter((split) => split.travelerId !== travelerId && split.amount > 0);

      if (activeSplits.length > 0) {
        // Calculate how much to redistribute
        const amountToRedistribute = currentSplit ? currentSplit.amount : 0;
        const amountPerActiveSplit = amountToRedistribute / activeSplits.length;

        // Redistribute the amount
        updatedSplits.forEach((split) => {
          if (split.travelerId !== travelerId && split.amount > 0) {
            split.amount = parseFloat((split.amount + amountPerActiveSplit).toFixed(2));
          }
        });

        // Adjust the last active split to account for rounding errors
        const totalSplitAmount = updatedSplits.reduce((sum, split) => sum + split.amount, 0);
        if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
          const lastActiveSplit = updatedSplits.filter((split) => split.amount > 0).pop();
          if (lastActiveSplit) {
            lastActiveSplit.amount = parseFloat((lastActiveSplit.amount + (expenseAmount - totalSplitAmount)).toFixed(2));
          }
        }
      }
    }

    setNewExpenseSplits(updatedSplits);
    setTotalAmount(updatedSplits.reduce((sum, split) => sum + split.amount, 0));
  };

  const handleSetEqualSplits = () => {
    const expenseAmount = parseFloat(newExpenseAmount) || 0;
    const activeTravelers = activeTour.travelers;

    if (activeTravelers.length > 0 && expenseAmount > 0) {
      const equalAmount = parseFloat((expenseAmount / activeTravelers.length).toFixed(2));
      const equalSplits = activeTravelers.map((traveler) => ({
        travelerId: traveler.id,
        amount: equalAmount,
        percentage: 0,
      }));

      // Adjust the last split to account for rounding errors
      const totalSplitAmount = equalSplits.reduce((sum, split) => sum + split.amount, 0);
      if (Math.abs(totalSplitAmount - expenseAmount) > 0.01 && equalSplits.length > 0) {
        equalSplits[equalSplits.length - 1].amount = parseFloat((equalSplits[equalSplits.length - 1].amount + (expenseAmount - totalSplitAmount)).toFixed(2));
      }

      setNewExpenseSplits(equalSplits);
      setTotalAmount(expenseAmount);
      setSplitEqually(true);
    }
  };

  const handleDeleteDialogOpen = (expenseId: string) => {
    setExpenseToDelete(expenseId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
    setExpenseToDelete(null);
  };

  const handleDeleteExpense = () => {
    if (expenseToDelete) {
      removeExpense(activeTourId, expenseToDelete);
      handleDeleteDialogClose();
    }
  };

  const toggleExpenseDetails = (expenseId: string) => {
    setExpandedExpenseId(expandedExpenseId === expenseId ? null : expenseId);
  };

  // Filter expenses based on search term and filters
  const filteredExpenses = activeTour.expenses.filter((expense) => {
    // Search term filter
    const matchesSearch = expense.description.toLowerCase().includes(searchTerm.toLowerCase());

    // Paid by filter
    const matchesPaidBy = filterPaidBy ? expense.paidById === filterPaidBy : true;

    // Date range filter
    const expenseDate = new Date(expense.date);
    const matchesDateFrom = filterDateFrom ? expenseDate >= new Date(filterDateFrom) : true;
    const matchesDateTo = filterDateTo ? expenseDate <= new Date(filterDateTo) : true;

    return matchesSearch && matchesPaidBy && matchesDateFrom && matchesDateTo;
  });

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
        {editMode ? "Edit Expense" : "Add Expense"}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <form onSubmit={handleAddExpense}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Date" type="date" value={newExpenseDate} onChange={(e) => setNewExpenseDate(e.target.value)} required InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth label="Amount" type="number" value={newExpenseAmount} onChange={(e) => setNewExpenseAmount(e.target.value)} required inputProps={{ min: "0.01", step: "0.01" }} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth required>
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select labelId="currency-label" value={newExpenseCurrency} onChange={(e) => setNewExpenseCurrency(e.target.value)} label="Currency">
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
                <InputLabel id="paid-by-label">Paid By</InputLabel>
                <Select labelId="paid-by-label" value={newExpensePaidBy} onChange={(e) => setNewExpensePaidBy(e.target.value)} label="Paid By">
                  {activeTour.travelers.map((traveler) => (
                    <MenuItem key={traveler.id} value={traveler.id}>
                      {traveler.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField fullWidth label="Description" value={newExpenseDescription} onChange={(e) => setNewExpenseDescription(e.target.value)} required placeholder="What was this expense for?" />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Split Details
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Total Split Amount: {formatCurrency(totalAmount, newExpenseCurrency || activeTour.baseCurrencyCode)}
                </Typography>
                <Button variant="outlined" size="small" onClick={handleSetEqualSplits}>
                  Split Equally
                </Button>
              </Box>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Traveler</TableCell>
                      <TableCell align="right">Amount</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {activeTour.travelers.map((traveler) => {
                      const split = newExpenseSplits.find((s) => s.travelerId === traveler.id);
                      const amount = split ? split.amount : 0;

                      return (
                        <TableRow key={traveler.id}>
                          <TableCell>{traveler.name}</TableCell>
                          <TableCell align="right">
                            <TextField type="number" size="small" value={amount} onChange={(e) => handleSplitAmountChange(traveler.id, parseFloat(e.target.value) || 0)} inputProps={{ min: "0", step: "0.01", style: { textAlign: "right" } }} sx={{ width: "120px" }} />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
            <Grid item xs={12} sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
              {editMode && (
                <Button variant="outlined" color="secondary" onClick={handleCancelEdit}>
                  Cancel
                </Button>
              )}
              <Button type="submit" variant="contained" color="primary">
                {editMode ? "Update Expense" : "Add Expense"}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Expenses
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <TextField
            placeholder="Search expenses..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            }}
          />
          <Button variant="outlined" color="primary" startIcon={<FilterIcon />} onClick={() => setShowFilters(!showFilters)} size="small">
            Filters
          </Button>
        </Box>
      </Box>

      <Collapse in={showFilters}>
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel id="filter-paid-by-label">Paid By</InputLabel>
                <Select labelId="filter-paid-by-label" value={filterPaidBy} onChange={(e) => setFilterPaidBy(e.target.value)} label="Paid By">
                  <MenuItem value="">All</MenuItem>
                  {activeTour.travelers.map((traveler) => (
                    <MenuItem key={traveler.id} value={traveler.id}>
                      {traveler.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="From Date" type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="To Date" type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {filteredExpenses.length === 0 ? (
        <Alert severity="info">No expenses found. Add your first expense using the form above.</Alert>
      ) : (
        <Stack spacing={2}>
          {filteredExpenses
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((expense) => (
              <Card key={expense.id} variant="outlined">
                <CardContent sx={{ pb: 1 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <Box>
                      <Typography variant="h6" component="div">
                        {expense.description}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatDate(expense.date)} • Paid by: {getTravelerName(expense.paidById, activeTour.travelers)}
                      </Typography>
                    </Box>
                    <Typography variant="h6" component="div">
                      {formatCurrency(expense.amount, expense.currencyCode)}
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: "space-between", px: 2 }}>
                  <Button size="small" startIcon={expandedExpenseId === expense.id ? <ExpandLessIcon /> : <ExpandMoreIcon />} onClick={() => toggleExpenseDetails(expense.id)}>
                    {expandedExpenseId === expense.id ? "Hide Details" : "Show Details"}
                  </Button>
                  <Box>
                    <IconButton size="small" color="primary" onClick={() => handleEditExpense(expense)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDeleteDialogOpen(expense.id)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardActions>
                <Collapse in={expandedExpenseId === expense.id}>
                  <Divider />
                  <CardContent>
                    <Typography variant="subtitle2" gutterBottom>
                      Split Details:
                    </Typography>
                    <TableContainer component={Paper} variant="outlined">
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Traveler</TableCell>
                            <TableCell align="right">Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {expense.splits
                            .filter((split) => split.amount > 0) // Only show travelers with non-zero amounts
                            .map((split) => (
                              <TableRow key={split.travelerId}>
                                <TableCell>{getTravelerName(split.travelerId, activeTour.travelers)}</TableCell>
                                <TableCell align="right">{formatCurrency(split.amount, expense.currencyCode)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Collapse>
              </Card>
            ))}
        </Stack>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this expense? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleDeleteExpense} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Expenses;
