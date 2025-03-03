import { AccountBalance as BalanceIcon, CurrencyExchange as CurrencyIcon, FileDownload as ExportIcon, Person as PersonIcon, Receipt as ReceiptIcon, SwapHoriz as TransactionIcon } from "@mui/icons-material";
import { Alert, Box, Button, Chip, Divider, Grid, List, ListItem, ListItemText, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import React from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { calculateSettlements, formatCurrency, getTravelerName } from "../utils";
import { exportTourToExcel } from "../utils/excelExport";

const Settlements: React.FC = () => {
  const { state } = useApp();
  const { tours, activeTourId } = state;
  const navigate = useNavigate();

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
                </TableRow>
              </TableHead>
              <TableBody>
                {settlements.map((settlement, index) => (
                  <TableRow key={index}>
                    <TableCell>{getTravelerName(settlement.fromTravelerId, activeTour.travelers)}</TableCell>
                    <TableCell>{getTravelerName(settlement.toTravelerId, activeTour.travelers)}</TableCell>
                    <TableCell>{formatCurrency(settlement.amount, settlement.currencyCode)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </>
  );
};

export default Settlements;
