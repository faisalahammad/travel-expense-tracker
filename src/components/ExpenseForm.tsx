import CloseIcon from "@mui/icons-material/Close";
import { Avatar, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle, Divider, FormControl, FormHelperText, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Select, TextField, Typography } from "@mui/material";
import Icon from "@mui/material/Icon";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { Expense, ExpenseSplit, Traveler } from "../types";

interface ExpenseFormProps {
  open: boolean;
  onClose: () => void;
  initialExpense?: Expense;
  onSave: (expense: Omit<Expense, "id" | "createdById" | "createdAt">) => void;
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

    let finalSplits = [...splits];
    if (splitType === "equal" && activeTour.travelers.length > 0) {
      const equalAmount = parsedAmount / activeTour.travelers.length;
      finalSplits = activeTour.travelers.map((traveler) => ({
        travelerId: traveler.id,
        amount: equalAmount,
      }));
    }

    const expenseData: Omit<Expense, "id" | "createdById" | "createdAt"> = {
      description,
      amount: parsedAmount,
      currencyCode,
      date: date?.toISOString() || new Date().toISOString(),
      paidById,
      categoryId,
      splits: finalSplits,
    };

    onSave(expenseData);
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
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth error={!!errors.currencyCode}>
              <InputLabel>Currency</InputLabel>
              <Select value={currencyCode} onChange={(e) => setCurrencyCode(e.target.value)} label="Currency">
                {activeTour.currencies.map((currency) => (
                  <MenuItem key={currency.code} value={currency.code}>
                    {currency.code} - {currency.name}
                  </MenuItem>
                ))}
              </Select>
              {errors.currencyCode && <FormHelperText>{errors.currencyCode}</FormHelperText>}
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Date"
              value={date}
              onChange={(newDate: Date | null) => setDate(newDate)}
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
                        <Icon fontSize="small">{category.icon}</Icon>
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
            <Divider sx={{ my: 2 }}>
              <Chip label="Split Details" />
            </Divider>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Split Type</InputLabel>
              <Select value={splitType} onChange={(e) => setSplitType(e.target.value as "equal" | "custom")} label="Split Type">
                <MenuItem value="equal">Equal Split</MenuItem>
                <MenuItem value="custom">Custom Split</MenuItem>
              </Select>
            </FormControl>

            {splitType === "equal" ? (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                This expense will be split equally among all travelers ({activeTour.travelers.length} travelers).
              </Typography>
            ) : (
              <>
                {errors.splits && (
                  <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                    {errors.splits}
                  </Typography>
                )}
                <Grid container spacing={2}>
                  {splits.map((split) => {
                    const traveler = findTravelerById(split.travelerId);
                    if (!traveler) return null;

                    return (
                      <Grid item xs={12} sm={6} key={split.travelerId}>
                        <TextField
                          fullWidth
                          label={`${traveler.name}'s Share`}
                          type="number"
                          value={split.amount || ""}
                          onChange={(e) => handleSplitAmountChange(split.travelerId, e.target.value)}
                          InputProps={{
                            startAdornment: currencyCode ? <InputAdornment position="start">{currencyCode}</InputAdornment> : null,
                          }}
                        />
                      </Grid>
                    );
                  })}
                </Grid>
              </>
            )}
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions>
        <Button onClick={handleReset} color="inherit">
          Reset
        </Button>
        <Button onClick={onClose} color="inherit">
          Cancel
        </Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ExpenseForm;
