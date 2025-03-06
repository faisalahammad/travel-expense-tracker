import { Add as AddIcon, Check as CheckIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, CheckCircle as SelectIcon, Share as ShareIcon } from "@mui/icons-material";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, Paper, Snackbar, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { useAppContext } from "../context/AppContext";
import { generateShareableLink } from "../utils";

const Tours: React.FC = () => {
  const { state, createTour, updateTour, deleteTour, setActiveTour } = useAppContext();
  const { tours } = state;
  const navigate = useNavigate();

  const [newTourName, setNewTourName] = useState("");
  const [newTourCurrency, setNewTourCurrency] = useState("USD");
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [editTourName, setEditTourName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTourName.trim() && newTourCurrency.trim()) {
      await handleCreateTour(newTourName.trim(), newTourCurrency.trim());
      setNewTourName("");
      setNewTourCurrency("USD");
    }
  };

  const handleCreateTour = async (tourName: string, baseCurrencyCode: string) => {
    try {
      // Create the tour - createTour returns a Tour object or null
      const newTour = await createTour(tourName, baseCurrencyCode);

      if (!newTour) {
        console.error("Failed to create tour");
        return;
      }

      // Automatically add a default traveler
      const travelerId = uuidv4();
      const travelerName = "You";

      // Update the tour with the new traveler
      updateTour(newTour.id, {
        travelers: [
          ...newTour.travelers,
          {
            id: travelerId,
            name: travelerName,
          },
        ],
      });
    } catch (error) {
      console.error("Error creating tour:", error);
    }
  };

  const handleEditTour = (tourId: string) => {
    const tour = tours.find((t) => t.id === tourId);
    if (tour) {
      setEditingTourId(tourId);
      setEditTourName(tour.name);
    }
  };

  const handleSaveEdit = (tourId: string) => {
    if (editTourName.trim()) {
      updateTour(tourId, { name: editTourName.trim() });
      setEditingTourId(null);
      setEditTourName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingTourId(null);
    setEditTourName("");
  };

  const handleOpenDeleteDialog = (tourId: string) => {
    setTourToDelete(tourId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTourToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (tourToDelete) {
      deleteTour(tourToDelete);
      setDeleteDialogOpen(false);
      setTourToDelete(null);
    }
  };

  const handleSelectTour = (tourId: string) => {
    setActiveTour(tourId);
    navigate("/");
  };

  const handleCopyShareableLink = (tourId: string) => {
    const tour = tours.find((t) => t.id === tourId);
    if (!tour) return;

    const link = generateShareableLink(tour);
    navigator.clipboard.writeText(link);
    setSnackbarOpen(true);
  };

  const handleCloseSnackbar = () => {
    setSnackbarOpen(false);
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Tours
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Create New Tour
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <Box component="form" onSubmit={handleFormSubmit}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField fullWidth label="Tour Name" value={newTourName} onChange={(e) => setNewTourName(e.target.value)} required variant="outlined" />
            </Grid>
            <Grid item xs={12} md={5}>
              <TextField fullWidth label="Base Currency" value={newTourCurrency} onChange={(e) => setNewTourCurrency(e.target.value)} required variant="outlined" placeholder="3-letter code (e.g., USD)" inputProps={{ maxLength: 3, style: { textTransform: "uppercase" } }} />
            </Grid>
            <Grid item xs={12} md={2}>
              <Button type="submit" variant="contained" color="primary" fullWidth startIcon={<AddIcon />} sx={{ height: "56px" }}>
                CREATE TOUR
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Your Tours
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {tours.length === 0 ? (
          <Alert severity="info">You don't have any tours yet. Create one above to get started.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Base Currency</TableCell>
                  <TableCell>Travelers</TableCell>
                  <TableCell>Expenses</TableCell>
                  <TableCell>Created</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {tours.map((tour) => (
                  <TableRow key={tour.id}>
                    <TableCell>
                      {editingTourId === tour.id ? (
                        <TextField size="small" value={editTourName} onChange={(e) => setEditTourName(e.target.value)} autoFocus variant="outlined" />
                      ) : (
                        <Typography
                          sx={{
                            cursor: "pointer",
                            "&:hover": {
                              textDecoration: "underline",
                              color: "primary.main",
                            },
                          }}
                          onClick={() => handleEditTour(tour.id)}
                        >
                          {tour.name}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{tour.baseCurrencyCode}</TableCell>
                    <TableCell>{tour.travelers.length}</TableCell>
                    <TableCell>{tour.expenses.length}</TableCell>
                    <TableCell>{new Date(tour.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {editingTourId === tour.id ? (
                        <Box>
                          <IconButton color="success" onClick={() => handleSaveEdit(tour.id)} size="small">
                            <CheckIcon />
                          </IconButton>
                          <IconButton color="default" onClick={handleCancelEdit} size="small">
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box>
                          <IconButton color="primary" onClick={() => handleSelectTour(tour.id)} size="small" title="Select Tour">
                            <SelectIcon />
                          </IconButton>
                          <IconButton color="warning" onClick={() => handleEditTour(tour.id)} size="small" title="Edit Tour">
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(tour.id)} size="small" title="Delete Tour">
                            <DeleteIcon />
                          </IconButton>
                          <IconButton color="secondary" onClick={() => handleCopyShareableLink(tour.id)} size="small" title="Share Tour">
                            <ShareIcon />
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
        <DialogTitle>Delete Tour</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to delete this tour? This action cannot be undone.</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for copy link notification */}
      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={handleCloseSnackbar} message="Shareable link copied to clipboard!" />
    </>
  );
};

export default Tours;
