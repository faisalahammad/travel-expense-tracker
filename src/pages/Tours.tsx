import { Check as CheckIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, CheckCircle as SelectIcon } from "@mui/icons-material";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import React, { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import CreateTourForm from "../components/CreateTourForm";
import { useAppContext } from "../context/AppContext";
import { useAuth } from "../context/AuthContext";

const Tours: React.FC = () => {
  const { authState } = useAuth();
  const { state, updateTour, deleteTour, setActiveTour } = useAppContext();
  const { tours } = state;
  const navigate = useNavigate();

  // Define state variables before the conditional return
  const [editingTourId, setEditingTourId] = useState<string | null>(null);
  const [editTourName, setEditTourName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [tourToDelete, setTourToDelete] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // If not authenticated, redirect to auth page
  if (!authState.isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Filter tours to only show the ones created by the current user
  const userTours = useMemo(() => {
    return tours.filter((tour) => {
      // Check if the tour belongs to the current user by email or userId
      if (tour.email === authState.email) {
        return true;
      }

      // Also check if the tour has a userId that matches the user's ID from the database
      // This handles the case where tours were created with a user_id but no email
      if (tour.userId && authState.userId && tour.userId === authState.userId) {
        return true;
      }

      return false;
    });
  }, [tours, authState.email, authState.userId]);

  const handleEditTour = (tourId: string) => {
    const tour = userTours.find((t) => t.id === tourId);
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

  const handleCreateTourSuccess = () => {
    setShowCreateForm(false);
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Tours
      </Typography>

      {!showCreateForm ? (
        <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
            <Typography variant="h5" component="h2">
              Your Tours
            </Typography>
            <Button variant="contained" color="primary" onClick={() => setShowCreateForm(true)}>
              Create New Tour
            </Button>
          </Box>
          <Divider sx={{ mb: 3 }} />

          {userTours.length === 0 ? (
            <Alert severity="info">You don't have any tours yet. Create one to get started.</Alert>
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
                  {userTours.map((tour) => (
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
      ) : (
        <CreateTourForm onSuccess={handleCreateTourSuccess} onCancel={() => setShowCreateForm(false)} />
      )}

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
    </>
  );
};

export default Tours;
