import { Check as CheckIcon, Close as CloseIcon, CurrencyExchange as CurrencyIcon, Delete as DeleteIcon, Edit as EditIcon } from "@mui/icons-material";
import { Alert, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { useApp } from "../context/AppContext";

const Currencies: React.FC = () => {
  const { state, addCurrency, updateCurrency, removeCurrency } = useApp();
  const { tours, activeTourId } = state;
  const navigate = useNavigate();

  const [newCurrencyCode, setNewCurrencyCode] = useState("");
  const [newCurrencyName, setNewCurrencyName] = useState("");
  const [newExchangeRate, setNewExchangeRate] = useState("1");
  const [editingCurrencyCode, setEditingCurrencyCode] = useState<string | null>(null);
  const [editCurrencyName, setEditCurrencyName] = useState("");
  const [editExchangeRate, setEditExchangeRate] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currencyToDelete, setCurrencyToDelete] = useState<string | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

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

  const handleAddCurrency = (e: React.FormEvent) => {
    e.preventDefault();

    const code = newCurrencyCode.trim().toUpperCase();
    const name = newCurrencyName.trim();
    const exchangeRate = parseFloat(newExchangeRate);

    if (code && name && !isNaN(exchangeRate) && exchangeRate > 0) {
      // Check if currency already exists
      const currencyExists = activeTour.currencies.some((c) => c.code === code);

      if (currencyExists) {
        setAlertMessage(`Currency with code ${code} already exists.`);
        setSnackbarOpen(true);
        return;
      }

      addCurrency(activeTourId, code, name, exchangeRate);
      setNewCurrencyCode("");
      setNewCurrencyName("");
      setNewExchangeRate("1");
    }
  };

  const handleEditCurrency = (currencyCode: string) => {
    const currency = activeTour.currencies.find((c) => c.code === currencyCode);
    if (currency) {
      setEditingCurrencyCode(currencyCode);
      setEditCurrencyName(currency.name);
      setEditExchangeRate(currency.exchangeRate.toString());
    }
  };

  const handleSaveEdit = (currencyCode: string) => {
    const name = editCurrencyName.trim();
    const exchangeRate = parseFloat(editExchangeRate);

    if (name && !isNaN(exchangeRate) && exchangeRate > 0) {
      updateCurrency(activeTourId, currencyCode, {
        name,
        exchangeRate,
      });

      setEditingCurrencyCode(null);
      setEditCurrencyName("");
      setEditExchangeRate("");
    }
  };

  const handleCancelEdit = () => {
    setEditingCurrencyCode(null);
    setEditCurrencyName("");
    setEditExchangeRate("");
  };

  const handleOpenDeleteDialog = (currencyCode: string) => {
    // Don't allow removing base currency
    if (currencyCode === activeTour.baseCurrencyCode) {
      setAlertMessage("Cannot remove base currency.");
      setSnackbarOpen(true);
      return;
    }

    setCurrencyToDelete(currencyCode);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCurrencyToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (currencyToDelete) {
      removeCurrency(activeTourId, currencyToDelete);
      setDeleteDialogOpen(false);
      setCurrencyToDelete(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <Layout>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Currencies
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom color="text.secondary">
        Tour: {activeTour.name}
      </Typography>
      <Box sx={{ mb: 4 }}>
        <Typography variant="body1">
          Base Currency: <Chip label={activeTour.baseCurrencyCode} color="primary" /> (Exchange Rate: 1.0)
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Add New Currency
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <form onSubmit={handleAddCurrency}>
          <Grid container spacing={3} alignItems="flex-end">
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth id="currencyCode" label="Currency Code" placeholder="e.g., EUR" variant="outlined" value={newCurrencyCode} onChange={(e) => setNewCurrencyCode(e.target.value)} inputProps={{ maxLength: 3 }} required helperText="3-letter code (e.g., USD, EUR, JPY)" />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField fullWidth id="currencyName" label="Currency Name" placeholder="e.g., Euro" variant="outlined" value={newCurrencyName} onChange={(e) => setNewCurrencyName(e.target.value)} required />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                id="exchangeRate"
                label="Exchange Rate"
                placeholder="e.g., 1.1"
                variant="outlined"
                type="number"
                value={newExchangeRate}
                onChange={(e) => setNewExchangeRate(e.target.value)}
                inputProps={{ min: "0.0001", step: "0.0001" }}
                required
                helperText={`Relative to ${activeTour.baseCurrencyCode}`}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Button type="submit" variant="contained" color="primary" fullWidth startIcon={<CurrencyIcon />}>
                Add Currency
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Currencies
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {activeTour.currencies.length <= 1 ? (
          <Alert severity="info">No additional currencies added yet. Add your first currency above.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Code</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Exchange Rate</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeTour.currencies.map((currency) => (
                  <TableRow key={currency.code}>
                    <TableCell>
                      <Chip label={currency.code} color={currency.code === activeTour.baseCurrencyCode ? "primary" : "default"} size="small" />
                    </TableCell>
                    <TableCell>{editingCurrencyCode === currency.code ? <TextField size="small" value={editCurrencyName} onChange={(e) => setEditCurrencyName(e.target.value)} autoFocus variant="outlined" fullWidth /> : currency.name}</TableCell>
                    <TableCell>{editingCurrencyCode === currency.code ? <TextField size="small" type="number" value={editExchangeRate} onChange={(e) => setEditExchangeRate(e.target.value)} inputProps={{ min: "0.0001", step: "0.0001" }} variant="outlined" /> : currency.exchangeRate}</TableCell>
                    <TableCell>
                      {currency.code === activeTour.baseCurrencyCode ? (
                        <Typography variant="body2" color="text.secondary">
                          Base Currency
                        </Typography>
                      ) : editingCurrencyCode === currency.code ? (
                        <Box>
                          <IconButton color="success" onClick={() => handleSaveEdit(currency.code)} size="small" title="Save">
                            <CheckIcon />
                          </IconButton>
                          <IconButton color="default" onClick={handleCancelEdit} size="small" title="Cancel">
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box>
                          <IconButton color="warning" onClick={() => handleEditCurrency(currency.code)} size="small" title="Edit Currency">
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(currency.code)} size="small" title="Remove Currency">
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Remove Currency</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to remove this currency? This will also remove all expenses in this currency.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error" variant="contained">
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      {/* Alert Snackbar */}
      <Snackbar open={snackbarOpen} autoHideDuration={4000} onClose={handleCloseSnackbar} message={alertMessage} />
    </Layout>
  );
};

export default Currencies;
