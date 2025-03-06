import { Delete as DeleteIcon, Edit as EditIcon, ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon, FilterList as FilterIcon, Search as SearchIcon } from "@mui/icons-material";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
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
import ExpenseForm from "../components/ExpenseForm";
import { useAppContext } from "../context/AppContext";
import { Expense } from "../types";
import { convertCurrency, formatCurrency } from "../utils";

const Expenses: React.FC = () => {
  const { state, addExpense, updateExpense, removeExpense } = useAppContext();
  const { tours, activeTourId, expenseCategories } = state;
  const navigate = useNavigate();

  const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [expenseToDelete, setExpenseToDelete] = useState<string | null>(null);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [currentExpense, setCurrentExpense] = useState<Expense | undefined>(undefined);

  // Search and filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPaidBy, setFilterPaidBy] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [showFilters, setShowFilters] = useState(false);

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

  const handleToggleExpand = (expenseId: string) => {
    setExpandedExpenseId(expandedExpenseId === expenseId ? null : expenseId);
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
    if (expenseToDelete && activeTourId) {
      removeExpense(activeTourId, expenseToDelete);
      setDeleteDialogOpen(false);
      setExpenseToDelete(null);
    }
  };

  const handleOpenExpenseForm = (expense?: Expense) => {
    setCurrentExpense(expense);
    setExpenseFormOpen(true);
  };

  const handleCloseExpenseForm = () => {
    setExpenseFormOpen(false);
    setCurrentExpense(undefined);
  };

  const handleSaveExpense = (expenseData: Omit<Expense, "id" | "createdAt">) => {
    if (!activeTourId) return;

    if (currentExpense) {
      // Update existing expense
      updateExpense(activeTourId, currentExpense.id, expenseData);
    } else {
      // Add new expense
      addExpense(activeTourId, expenseData);
    }
  };

  // Helper function to get traveler name by ID
  const getTravelerName = (travelerId: string): string => {
    const traveler = activeTour.travelers.find((t) => t.id === travelerId);
    return traveler ? traveler.name : "Unknown";
  };

  // Filter expenses based on search and filter criteria
  const filteredExpenses = activeTour.expenses
    .filter((expense) => {
      // Search term filter
      const matchesSearch = searchTerm ? expense.description.toLowerCase().includes(searchTerm.toLowerCase()) : true;

      // Paid by filter
      const matchesPaidBy = filterPaidBy ? expense.paidById === filterPaidBy : true;

      // Category filter
      const matchesCategory = filterCategory ? expense.categoryId === filterCategory : true;

      // Date range filter
      const expenseDate = new Date(expense.date);
      const matchesDateFrom = filterDateFrom ? expenseDate >= new Date(filterDateFrom) : true;
      const matchesDateTo = filterDateTo ? expenseDate <= new Date(filterDateTo) : true;

      return matchesSearch && matchesPaidBy && matchesCategory && matchesDateFrom && matchesDateTo;
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Group expenses by date
  const groupedExpenses: Record<string, Expense[]> = {};
  filteredExpenses.forEach((expense) => {
    const dateKey = new Date(expense.date).toLocaleDateString();
    if (!groupedExpenses[dateKey]) {
      groupedExpenses[dateKey] = [];
    }
    groupedExpenses[dateKey].push(expense);
  });

  // Sort dates in descending order
  const sortedDates = Object.keys(groupedExpenses).sort((a, b) => {
    return new Date(b).getTime() - new Date(a).getTime();
  });

  const getCategoryById = (categoryId: string) => {
    return expenseCategories.find((category) => category.id === categoryId);
  };

  // Helper function to display the equivalent amount in base currency
  const displayEquivalentAmount = (expense: Expense) => {
    if (expense.currencyCode === activeTour.baseCurrencyCode) {
      return null;
    }

    // Use the pre-calculated baseAmount if available, otherwise calculate it
    let baseAmount = 0;
    if (expense.baseAmount !== undefined) {
      baseAmount = expense.baseAmount;
    } else {
      // Calculate the base amount using the exchange rate
      const currency = activeTour.currencies.find((c) => c.code === expense.currencyCode);
      if (currency) {
        baseAmount = expense.amount * currency.exchangeRate;
      } else {
        baseAmount = expense.amount; // Fallback if currency not found
      }
    }

    return (
      <Typography variant="caption" color="text.secondary" display="block">
        {formatCurrency(baseAmount, activeTour.baseCurrencyCode)}
      </Typography>
    );
  };

  // Helper function to get the base amount for a split
  const getSplitBaseAmount = (split: any, expense: any) => {
    // Use the pre-calculated baseAmount if available
    if (split.baseAmount !== undefined) {
      return split.baseAmount;
    }

    // If expense has baseAmount, calculate proportionally
    if (expense.baseAmount !== undefined) {
      return split.amount * (expense.baseAmount / expense.amount);
    }

    // Otherwise calculate using the exchange rate
    if (expense.currencyCode !== activeTour.baseCurrencyCode) {
      const currency = activeTour.currencies.find((c) => c.code === expense.currencyCode);
      if (currency) {
        return split.amount * currency.exchangeRate;
      }
    }

    // Fallback
    return split.amount;
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Expenses
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" gutterBottom>
          Manage expenses for {activeTour.name}
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            label="Search expenses"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <Box sx={{ display: "flex", gap: 2 }}>
            <Button variant="outlined" startIcon={<FilterIcon />} onClick={() => setShowFilters(!showFilters)}>
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button variant="contained" color="primary" onClick={() => handleOpenExpenseForm()}>
              Add Expense
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Collapse in={showFilters}>
        <Paper sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Paid By</InputLabel>
                <Select value={filterPaidBy} onChange={(e) => setFilterPaidBy(e.target.value)} label="Paid By">
                  <MenuItem value="">All</MenuItem>
                  {activeTour.travelers.map((traveler) => (
                    <MenuItem key={traveler.id} value={traveler.id}>
                      {traveler.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Category</InputLabel>
                <Select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} label="Category">
                  <MenuItem value="">All Categories</MenuItem>
                  {expenseCategories.map((category) => (
                    <MenuItem key={category.id} value={category.id}>
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <Avatar
                          sx={{
                            width: 24,
                            height: 24,
                            bgcolor: category.color,
                            mr: 1,
                            fontSize: "0.8rem",
                          }}
                        >
                          {category.name.charAt(0)}
                        </Avatar>
                        {category.name}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="From Date" type="date" value={filterDateFrom} onChange={(e) => setFilterDateFrom(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={4}>
              <TextField fullWidth label="To Date" type="date" value={filterDateTo} onChange={(e) => setFilterDateTo(e.target.value)} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} md={8}>
              <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setFilterPaidBy("");
                    setFilterCategory("");
                    setFilterDateFrom("");
                    setFilterDateTo("");
                    setSearchTerm("");
                  }}
                >
                  Clear Filters
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Collapse>

      {filteredExpenses.length === 0 ? (
        <Alert severity="info" sx={{ mt: 2 }}>
          No expenses found. Add your first expense to get started.
        </Alert>
      ) : (
        <Box>
          {sortedDates.map((dateKey) => (
            <Box key={dateKey} sx={{ mb: 4 }}>
              <Paper sx={{ p: 2, mb: 1, bgcolor: "primary.light" }}>
                <Typography variant="h6" color="white">
                  {new Date(dateKey).toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </Typography>
              </Paper>

              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Description</TableCell>
                      <TableCell>Category</TableCell>
                      <TableCell>Paid By</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell align="right">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {groupedExpenses[dateKey].map((expense) => {
                      const category = getCategoryById(expense.categoryId);
                      return (
                        <React.Fragment key={expense.id}>
                          <TableRow hover>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{category && <Chip avatar={<Avatar sx={{ bgcolor: category.color }}>{category.name.charAt(0)}</Avatar>} label={category.name} size="small" />}</TableCell>
                            <TableCell>{getTravelerName(expense.paidById)}</TableCell>
                            <TableCell align="right">
                              {formatCurrency(expense.amount, expense.currencyCode)}
                              {displayEquivalentAmount(expense)}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton size="small" onClick={() => handleToggleExpand(expense.id)}>
                                {expandedExpenseId === expense.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                              </IconButton>
                              <IconButton size="small" onClick={() => handleOpenExpenseForm(expense)}>
                                <EditIcon />
                              </IconButton>
                              <IconButton size="small" onClick={() => handleDeleteDialogOpen(expense.id)}>
                                <DeleteIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                              <Collapse in={expandedExpenseId === expense.id} timeout="auto" unmountOnExit>
                                <Box sx={{ margin: 2 }}>
                                  <Typography variant="h6" gutterBottom component="div">
                                    Split Details
                                  </Typography>
                                  <Table size="small">
                                    <TableHead>
                                      <TableRow>
                                        <TableCell>Traveler</TableCell>
                                        <TableCell align="right">Amount</TableCell>
                                        <TableCell align="right">Percentage</TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      {expense.splits.map((split) => {
                                        const baseCurrencyAmount = expense.currencyCode !== activeTour.baseCurrencyCode ? convertCurrency(split.amount, expense.currencyCode, activeTour.baseCurrencyCode, activeTour.currencies) : split.amount;

                                        return (
                                          <TableRow key={split.travelerId}>
                                            <TableCell>{getTravelerName(split.travelerId)}</TableCell>
                                            <TableCell align="right">
                                              {formatCurrency(split.amount, expense.currencyCode)}
                                              {expense.currencyCode !== activeTour.baseCurrencyCode && (
                                                <Typography variant="caption" color="text.secondary" display="block">
                                                  or {formatCurrency(getSplitBaseAmount(split, expense), activeTour.baseCurrencyCode)}
                                                </Typography>
                                              )}
                                            </TableCell>
                                            <TableCell align="right">{((split.amount / expense.amount) * 100).toFixed(1)}%</TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </Box>
                              </Collapse>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          ))}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleDeleteDialogClose}>
        <DialogTitle>Delete Expense</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this expense? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteExpense} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Expense Form Dialog */}
      <ExpenseForm open={expenseFormOpen} onClose={handleCloseExpenseForm} initialExpense={currentExpense} onSave={handleSaveExpense} />
    </Box>
  );
};

export default Expenses;
