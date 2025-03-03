import { Check as CheckIcon, Close as CloseIcon, Delete as DeleteIcon, Edit as EditIcon, PersonAdd as PersonAddIcon } from "@mui/icons-material";
import { Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Divider, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@mui/material";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../context/AppContext";

const Travelers: React.FC = () => {
  const { state, addTraveler, updateTraveler, removeTraveler } = useAppContext();
  const { tours, activeTourId } = state;
  const navigate = useNavigate();

  const [newTravelerName, setNewTravelerName] = useState("");
  const [editingTravelerId, setEditingTravelerId] = useState<string | null>(null);
  const [editTravelerName, setEditTravelerName] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [travelerToDelete, setTravelerToDelete] = useState<string | null>(null);

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

  const handleAddTraveler = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTravelerName.trim()) {
      addTraveler(activeTourId, newTravelerName.trim());
      setNewTravelerName("");
    }
  };

  const handleEditTraveler = (travelerId: string) => {
    const traveler = activeTour.travelers.find((t) => t.id === travelerId);
    if (traveler) {
      setEditingTravelerId(travelerId);
      setEditTravelerName(traveler.name);
    }
  };

  const handleSaveEdit = (travelerId: string) => {
    if (editTravelerName.trim()) {
      updateTraveler(activeTourId, travelerId, editTravelerName.trim());
      setEditingTravelerId(null);
      setEditTravelerName("");
    }
  };

  const handleCancelEdit = () => {
    setEditingTravelerId(null);
    setEditTravelerName("");
  };

  const handleOpenDeleteDialog = (travelerId: string) => {
    setTravelerToDelete(travelerId);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setTravelerToDelete(null);
  };

  const handleConfirmDelete = () => {
    if (travelerToDelete) {
      removeTraveler(activeTourId, travelerToDelete);
      setDeleteDialogOpen(false);
      setTravelerToDelete(null);
    }
  };

  return (
    <>
      <Typography variant="h4" component="h1" gutterBottom>
        Manage Travelers
      </Typography>
      <Typography variant="h6" component="h2" gutterBottom color="text.secondary">
        Tour: {activeTour.name}
      </Typography>

      <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Add New Traveler
        </Typography>
        <Divider sx={{ mb: 3 }} />
        <form onSubmit={handleAddTraveler}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={9}>
              <TextField fullWidth placeholder="Enter traveler name" variant="outlined" value={newTravelerName} onChange={(e) => setNewTravelerName(e.target.value)} required label="Traveler Name" />
            </Grid>
            <Grid item xs={12} sm={3}>
              <Button type="submit" variant="contained" color="primary" fullWidth startIcon={<PersonAddIcon />}>
                Add Traveler
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      <Paper elevation={2} sx={{ p: 3 }}>
        <Typography variant="h5" component="h3" gutterBottom>
          Travelers
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {activeTour.travelers.length === 0 ? (
          <Alert severity="info">No travelers added yet. Add your first traveler above.</Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeTour.travelers.map((traveler) => (
                  <TableRow key={traveler.id}>
                    <TableCell>{editingTravelerId === traveler.id ? <TextField size="small" value={editTravelerName} onChange={(e) => setEditTravelerName(e.target.value)} autoFocus variant="outlined" fullWidth /> : traveler.name}</TableCell>
                    <TableCell>
                      {editingTravelerId === traveler.id ? (
                        <Box>
                          <IconButton color="success" onClick={() => handleSaveEdit(traveler.id)} size="small" title="Save">
                            <CheckIcon />
                          </IconButton>
                          <IconButton color="default" onClick={handleCancelEdit} size="small" title="Cancel">
                            <CloseIcon />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box>
                          <IconButton color="warning" onClick={() => handleEditTraveler(traveler.id)} size="small" title="Edit Traveler">
                            <EditIcon />
                          </IconButton>
                          <IconButton color="error" onClick={() => handleOpenDeleteDialog(traveler.id)} size="small" title="Remove Traveler">
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
        <DialogTitle>Remove Traveler</DialogTitle>
        <DialogContent>
          <DialogContentText>Are you sure you want to remove this traveler? This will also remove all expenses paid by or split with this traveler.</DialogContentText>
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
    </>
  );
};

export default Travelers;
