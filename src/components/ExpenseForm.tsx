import CloseIcon from "@mui/icons-material/Close";
import { Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormHelperText, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Expense, ExpenseSplit, Traveler } from "../types";
import { convertCurrency } from "../utils";

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  initialExpense?: Expense;
  onSave: (expense: Omit<Expense, "id" | "createdAt">) => void;
}

const ExpenseForm: React.FC<ExpenseFormProps> = ({ open, onClose, initialExpense, onSave }) => {
  const { state } = useAppContext();
  const { tours, activeTourId, expenseCategories } = state;
  const activeTour = tours.find((tour) => tour.id === activeTourId);

  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [currencyCode, setCurrencyCode] = useState("");
  const [date, setDate] = useState<Date | null>(new Date());
  const [paidById, setPaidById] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [splitType, setSplitType] = useState<"equal" | "custom">("equal");
  const [splits, setSplits] = useState<ExpenseSplit[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [baseAmount, setBaseAmount] = useState<number | null>(null);

  useEffect(() => {
    if (initialExpense) {
      setDescription(initialExpense.description);
      setAmount(initialExpense.amount.toString());
      setCurrencyCode(initialExpense.currencyCode);
      setDate(new Date(initialExpense.date));
      setPaidById(initialExpense.paidById);
      setCategoryId(initialExpense.categoryId);
      setSplits(initialExpense.splits);

      // Determine split type
      const isEqual = initialExpense.splits.every((split) => split.amount === initialExpense.splits[0].amount);
      setSplitType(isEqual ? "equal" : "custom");
    } else if (activeTour) {
      // Set defaults for new expense
      setCurrencyCode(activeTour.baseCurrencyCode);
      setPaidById(activeTour.travelers[0]?.id || "");
      setCategoryId(expenseCategories[0]?.id || "");

      // Initialize equal splits
      if (activeTour.travelers.length > 0) {
        const equalSplits = activeTour.travelers.map((traveler) => ({
          travelerId: traveler.id,
          amount: 0, // Will be calculated when saving
        }));
        setSplits(equalSplits);
      }
    }
  }, [initialExpense, activeTour, expenseCategories]);

  // Update base amount when currency or amount changes
  useEffect(() => {
    if (activeTour && currencyCode && amount && currencyCode !== activeTour.baseCurrencyCode) {
      const parsedAmount = parseFloat(amount) || 0;
      const convertedAmount = convertCurrency(parsedAmount, currencyCode, activeTour.baseCurrencyCode, activeTour.currencies);
      setBaseAmount(convertedAmount);
    } else {
      setBaseAmount(null);
    }
  }, [currencyCode, amount, activeTour]);

  const handleSplitAmountChange = (travelerId: string, value: string) => {
    const newAmount = parseFloat(value) || 0;
    setSplits((prevSplits) => prevSplits.map((split) => (split.travelerId === travelerId ? { ...split, amount: newAmount } : split)));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!amount || parseFloat(amount) <= 0) {
      newErrors.amount = "Valid amount is required";
    }

    if (!currencyCode) {
      newErrors.currencyCode = "Currency is required";
    }

    if (!date) {
      newErrors.date = "Date is required";
    }

    if (!paidById) {
      newErrors.paidById = "Payer is required";
    }

    if (!categoryId) {
      newErrors.categoryId = "Category is required";
    }

    if (splitType === "custom") {
      const totalSplitAmount = splits.reduce((sum, split) => sum + split.amount, 0);
      const expenseAmount = parseFloat(amount) || 0;

      if (Math.abs(totalSplitAmount - expenseAmount) > 0.01) {
        newErrors.splits = `Split amounts must sum to the total expense amount (${expenseAmount})`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validateForm() || !activeTour) return;

    const parsedAmount = parseFloat(amount);

    // Calculate the base amount using the exchange rate
    let baseAmount = parsedAmount;

    // If the currency is different from the base currency, convert it
    if (currencyCode !== activeTour.baseCurrencyCode) {
      const currency = activeTour.currencies.find((c) => c.code === currencyCode);
      if (currency) {
        // If 1 USD = 124.64 BDT, then 1200 USD should be 1200 * 124.64 = 149,568 BDT
        baseAmount = parsedAmount * currency.exchangeRate;
        console.log(`Converting ${parsedAmount} ${currencyCode} to ${baseAmount} ${activeTour.baseCurrencyCode} using rate ${currency.exchangeRate}`);
      }
    }

    // Round to 2 decimal places
    baseAmount = Math.round(baseAmount * 100) / 100;

    let finalSplits = [...splits];
    if (splitType === "equal" && activeTour.travelers.length > 0) {
      const equalAmount = parsedAmount / activeTour.travelers.length;
      const equalBaseAmount = baseAmount / activeTour.travelers.length;

      // Round to 2 decimal places
      const roundedEqualAmount = Math.round(equalAmount * 100) / 100;
      const roundedEqualBaseAmount = Math.round(equalBaseAmount * 100) / 100;

      finalSplits = activeTour.travelers.map((traveler) => ({
        travelerId: traveler.id,
        amount: roundedEqualAmount,
        baseAmount: roundedEqualBaseAmount,
        percentage: 100 / activeTour.travelers.length,
      }));
    } else {
      // For custom splits, calculate the base amount for each split
      finalSplits = splits.map((split) => {
        let splitBaseAmount = split.amount;

        // If the currency is different from the base currency, convert it
        if (currencyCode !== activeTour.baseCurrencyCode) {
          const currency = activeTour.currencies.find((c) => c.code === currencyCode);
          if (currency) {
            splitBaseAmount = split.amount * currency.exchangeRate;
          }
        }

        // Round to 2 decimal places
        splitBaseAmount = Math.round(splitBaseAmount * 100) / 100;

        return {
          ...split,
          baseAmount: splitBaseAmount,
          percentage: (split.amount / parsedAmount) * 100,
        };
      });
    }

    // Create the expense data with both original and base currency information
    const expenseData: Omit<Expense, "id" | "createdAt"> = {
      description,
      amount: parsedAmount,
      currencyCode,
      baseAmount: baseAmount,
      baseCurrencyCode: activeTour.baseCurrencyCode,
      date: date?.toISOString() || new Date().toISOString(),
      paidById,
      categoryId,
      splits: finalSplits,
    };

    onSave(expenseData);

    // Reset the form if it's a new expense (not editing)
    if (!initialExpense) {
      handleReset();
    }

    onClose();
  };

  const handleReset = () => {
    setDescription("");
    setAmount("");
    setCurrencyCode(activeTour?.baseCurrencyCode || "");
    setDate(new Date());
    setPaidById(activeTour?.travelers[0]?.id || "");
    setCategoryId(expenseCategories[0]?.id || "");
    setSplitType("equal");
    setSplits(
      activeTour?.travelers.map((traveler) => ({
        travelerId: traveler.id,
        amount: 0,
      })) || []
    );
    setErrors({});
    setBaseAmount(null);
  };

  const findTravelerById = (id: string): Traveler | undefined => {
    return activeTour?.travelers.find((traveler) => traveler.id === id);
  };

  const findCategoryById = (id: string) => {
    return expenseCategories.find((category) => category.id === id);
  };

  if (!activeTour) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {initialExpense ? "Edit Expense" : "Add New Expense"}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: "absolute",
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} error={!!errors.description} helperText={errors.description} />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.currencyCode}>
              <InputLabel>Currency</InputLabel>
              <Select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} label="Currency">
                {activeTour.currencies.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name} {currency.code === activeTour.baseCurrencyCode && "(Base)"}
                  </MenuItem>
                ))}
              </Select>
              {errors.currencyCode && <FormHelperText>{errors.currencyCode}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              InputProps={{
                startAdornment: currencyCode ? <InputAdornment position="start">{currencyCode}</InputAdornment> : null,
              }}
              error={!!errors.amount}
              helperText={errors.amount}
            />
            {baseAmount !== null && (
              <Typography variant="caption" color="text.secondary">
                Equivalent: {activeTour.baseCurrencyCode} {baseAmount.toFixed(2)}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate) => setDate(newDate)}
              slotProps={{
                textField: {
                  fullWidth: true,
                  error: !!errors.date,
                  helperText: errors.date,
                },
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.paidById}>
              <InputLabel>Paid By</InputLabel>
              <Select value={paidById} onChange={(e) => setPaidById(e.target.value)} label="Paid By">
                {activeTour.travelers.map((traveler) => (
                  <MenuItem key={traveler.id} value={traveler.id}>
                    {traveler.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.paidById && <FormHelperText>{errors.paidById}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth error={!!errors.categoryId}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} label="Category">
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
              {errors.categoryId && <FormHelperText>{errors.categoryId}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Split
            </Typography>
            <Box sx={{ display: "flex", mb: 2 }}>
              <Button variant={splitType === "equal" ? "contained" : "outlined"} onClick={() => setSplitType("equal")} sx={{ mr: 1 }} size="small">
                Equal
              </Button>
              <Button variant={splitType === "custom" ? "contained" : "outlined"} onClick={() => setSplitType("custom")} size="small">
                Custom
              </Button>
            </Box>

            {errors.splits && (
              <Typography color="error" variant="caption" sx={{ mb: 2, display: "block" }}>
                {errors.splits}
              </Typography>
            )}

            {splitType === "equal" ? (
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  This expense will be split equally among all travelers.
                </Typography>
                <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {activeTour.travelers.map((traveler) => (
                    <Chip key={traveler.id} label={traveler.name} />
                  ))}
                </Box>
              </Box>
            ) : (
              <Box>
                {splits.map((split, index) => {
                  const traveler = findTravelerById(split.travelerId);
                  if (!traveler) return null;

                  return (
                    <Box key={split.travelerId} sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                      <Typography variant="body2" sx={{ width: "120px" }}>
                        {traveler.name}
                      </Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={split.amount || ""}
                        onChange={(e) => handleSplitAmountChange(split.travelerId, e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">{currencyCode}</InputAdornment>,
                        }}
                        sx={{ width: "150px" }}
                      />
                      {amount && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 2 }}>
                          {((split.amount / parseFloat(amount || "0")) * 100).toFixed(1)}%
                        </Typography>
                      )}
                    </Box>
                  );
                })}
              </Box>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseForm;
