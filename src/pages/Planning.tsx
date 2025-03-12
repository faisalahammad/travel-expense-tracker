import {
  Add as AddIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckCircleIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  ExpandMore as ExpandMoreIcon,
  Flag as FlagIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  RadioButtonUnchecked as UncheckedIcon,
} from "@mui/icons-material";
import { Autocomplete, Box, Button, Card, CardContent, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, Grid, IconButton, InputAdornment, InputLabel, MenuItem, Paper, Select, SvgIconProps, TextField, Typography } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers";
import React, { ReactElement, useMemo, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { useActiveTour } from "../hooks/useActiveTour";
import { PlanningTask, TaskPriority } from "../types/index";

interface TaskFormData {
  title: string;
  cost: number;
  currencyCode: string;
  location: string;
  date: string;
  priority: TaskPriority;
  travelers: string[];
  assignedTo: string[];
}

const initialFormData: TaskFormData = {
  title: "",
  cost: 0,
  currencyCode: "",
  location: "",
  date: new Date().toISOString().split("T")[0],
  priority: TaskPriority.MEDIUM,
  travelers: [],
  assignedTo: [],
};

const Planning: React.FC = () => {
  const { state, addPlanningTask, updatePlanningTask, deletePlanningTask } = useAppContext();
  const { activeTour } = useActiveTour();
  const [searchText, setSearchText] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedPriority, setSelectedPriority] = useState<TaskPriority | "">("");
  const [selectedTravelers, setSelectedTravelers] = useState<string[]>([]);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [formData, setFormData] = useState<TaskFormData>(initialFormData);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    console.log("Planning component - state:", state);
    console.log("Planning component - activeTour:", activeTour);
    console.log("Planning component - planningTasks:", state.planningTasks);

    if (!activeTour || !state.planningTasks) {
      console.log("Planning component - No active tour or planning tasks");
      return [];
    }

    const tourTasks = state.planningTasks.filter((task) => task.tourId === activeTour.id);
    console.log("Planning component - Tasks for this tour:", tourTasks);

    return tourTasks
      .filter((task) => {
        const matchesSearch = searchText ? task.title.toLowerCase().includes(searchText.toLowerCase()) || (task.location?.toLowerCase().includes(searchText.toLowerCase()) ?? false) : true;

        const taskDate = task.date;
        const selectedDateStr = selectedDate?.toISOString().split("T")[0];
        const matchesDate = selectedDate ? taskDate === selectedDateStr : true;

        const matchesPriority = selectedPriority ? task.priority === selectedPriority : true;
        const matchesTravelers = selectedTravelers.length > 0 ? selectedTravelers.some((travelerId: string) => task.travelers.includes(travelerId) || task.assignedTo.includes(travelerId)) : true;

        return matchesSearch && matchesDate && matchesPriority && matchesTravelers;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [state.planningTasks, activeTour?.id, searchText, selectedDate, selectedPriority, selectedTravelers]);

  const tasksByDate = useMemo(() => {
    if (!filteredTasks) {
      return {};
    }

    const grouped: Record<string, PlanningTask[]> = {};
    filteredTasks.forEach((task: PlanningTask) => {
      if (!grouped[task.date]) {
        grouped[task.date] = [];
      }
      grouped[task.date].push(task);
    });
    return grouped;
  }, [filteredTasks]);

  if (!activeTour) {
    return (
      <Box>
        <Typography>Please select a tour first.</Typography>
      </Box>
    );
  }

  const handleOpenTaskDialog = (task?: PlanningTask) => {
    if (task) {
      setFormData({
        title: task.title,
        cost: task.cost || 0,
        currencyCode: task.currencyCode || activeTour?.baseCurrencyCode || "",
        location: task.location ?? "",
        date: task.date,
        priority: task.priority,
        travelers: task.travelers,
        assignedTo: task.assignedTo,
      });
      setEditingTaskId(task.id);
    } else {
      setFormData({
        ...initialFormData,
        currencyCode: activeTour?.baseCurrencyCode || "",
      });
      setEditingTaskId(null);
    }
    setTaskDialogOpen(true);
  };

  const handleCloseTaskDialog = () => {
    setTaskDialogOpen(false);
    setFormData(initialFormData);
    setEditingTaskId(null);
  };

  const handleSaveTask = () => {
    const task: PlanningTask = {
      id: editingTaskId || crypto.randomUUID(),
      tourId: activeTour.id,
      title: formData.title,
      cost: formData.cost,
      currencyCode: formData.currencyCode,
      location: formData.location || undefined,
      date: formData.date,
      priority: formData.priority,
      travelers: formData.travelers,
      assignedTo: formData.assignedTo,
      completed: false,
    };

    if (editingTaskId) {
      updatePlanningTask(editingTaskId, task);
    } else {
      addPlanningTask(task);
    }

    setTaskDialogOpen(false);
    setFormData(initialFormData);
    setEditingTaskId(null);
  };

  const handleDeleteTask = (taskId: string) => {
    deletePlanningTask(taskId);
  };

  const handleEditTask = (task: PlanningTask) => {
    handleOpenTaskDialog(task);
  };

  const handleToggleTaskCompletion = (task: PlanningTask) => {
    updatePlanningTask(task.id, { ...task, completed: !task.completed });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getPriorityColor = (priority: TaskPriority) => {
    switch (priority) {
      case TaskPriority.HIGH:
        return "error";
      case TaskPriority.MEDIUM:
        return "warning";
      case TaskPriority.LOW:
        return "success";
    }
  };

  const renderTravelerChips = (travelerIds: string[], icon: ReactElement<SvgIconProps>, color?: "primary") => {
    return travelerIds.map((travelerId: string) => {
      const traveler = activeTour.travelers.find((t) => t.id === travelerId);
      if (!traveler) return null;

      return <Chip key={travelerId} size="small" icon={icon} label={traveler.name} variant="outlined" color={color} />;
    });
  };

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Typography variant="h4" component="h1">
          Planning
        </Typography>
        <Button startIcon={<AddIcon />} variant="contained" onClick={() => handleOpenTaskDialog()}>
          Add Task
        </Button>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Search tasks"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={2}>
            <DatePicker label="Filter by date" value={selectedDate} onChange={(date) => setSelectedDate(date)} slotProps={{ textField: { fullWidth: true } }} />
          </Grid>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select value={selectedPriority} onChange={(e) => setSelectedPriority(e.target.value as TaskPriority | "")}>
                <MenuItem value="">All</MenuItem>
                <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={4}>
            <Autocomplete
              multiple
              options={activeTour.travelers}
              getOptionLabel={(option) => option.name}
              value={activeTour.travelers.filter((t) => selectedTravelers.includes(t.id))}
              onChange={(_, newValue) => setSelectedTravelers(newValue.map((t) => t.id))}
              renderInput={(params) => <TextField {...params} label="Filter by travelers" />}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const tagProps = getTagProps({ index });
                  const { key, ...otherProps } = tagProps;
                  return <Chip key={key} variant="outlined" label={option.name} {...otherProps} />;
                })
              }
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Tasks List */}
      {Object.entries(tasksByDate).map(([date, tasks]) => (
        <Box key={date} sx={{ mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            {formatDate(date)}
          </Typography>
          <Grid container spacing={2}>
            {tasks.map((task) => (
              <Grid item xs={12} key={task.id}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: "100%" }}>
                        <IconButton size="small" onClick={() => handleToggleTaskCompletion(task)}>
                          {task.completed ? <CheckCircleIcon color="success" /> : <UncheckedIcon />}
                        </IconButton>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              textDecoration: task.completed ? "line-through" : "none",
                              color: task.completed ? "text.secondary" : "text.primary",
                            }}
                          >
                            {task.title}
                          </Typography>

                          <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mt: 1 }}>
                            {task.cost !== undefined && task.cost > 0 && <Chip size="small" icon={<AttachMoneyIcon />} label={`${task.cost} ${task.currencyCode || activeTour.baseCurrencyCode}`} variant="outlined" />}

                            {task.location && <Chip size="small" icon={<LocationIcon />} label={task.location} variant="outlined" />}

                            <Chip size="small" icon={<FlagIcon />} label={task.priority.toLowerCase()} color={getPriorityColor(task.priority)} />

                            {task.assignedTo.length > 0 && <Box sx={{ display: "flex", gap: 0.5 }}>{renderTravelerChips(task.assignedTo, <PersonIcon />, "primary")}</Box>}
                          </Box>
                        </Box>
                      </Box>
                      <Box>
                        <IconButton onClick={() => handleEditTask(task)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteTask(task.id)}>
                          <DeleteIcon />
                        </IconButton>
                        <IconButton onClick={() => setExpandedTaskId(expandedTaskId === task.id ? null : task.id)}>
                          <ExpandMoreIcon
                            sx={{
                              transform: expandedTaskId === task.id ? "rotate(180deg)" : "rotate(0)",
                              transition: "transform 0.2s",
                            }}
                          />
                        </IconButton>
                      </Box>
                    </Box>

                    <Collapse in={expandedTaskId === task.id}>
                      <Box sx={{ mt: 2, pl: 4 }}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Paper variant="outlined" sx={{ p: 2 }}>
                              <Typography variant="subtitle2" color="text.secondary">
                                Date
                              </Typography>
                              <Typography>{formatDate(task.date)}</Typography>
                            </Paper>
                          </Grid>

                          {task.travelers.length > 0 && (
                            <Grid item xs={12} md={6}>
                              <Paper variant="outlined" sx={{ p: 2 }}>
                                <Typography variant="subtitle2" color="text.secondary">
                                  Travelers
                                </Typography>
                                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 1 }}>{renderTravelerChips(task.travelers, <PersonIcon />)}</Box>
                              </Paper>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    </Collapse>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      ))}

      {/* Task Dialog */}
      <Dialog open={taskDialogOpen} onClose={handleCloseTaskDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingTaskId ? "Edit Task" : "Add Task"}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Cost"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: Number(e.target.value) })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select value={formData.currencyCode} onChange={(e) => setFormData({ ...formData, currencyCode: e.target.value })} label="Currency">
                  {activeTour.currencies.map((currency) => (
                    <MenuItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Location"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <DatePicker label="Date" value={formData.date ? new Date(formData.date) : null} onChange={(date) => setFormData({ ...formData, date: date ? date.toISOString().split("T")[0] : new Date().toISOString().split("T")[0] })} slotProps={{ textField: { fullWidth: true } }} />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select value={formData.priority} onChange={(e) => setFormData({ ...formData, priority: e.target.value as TaskPriority })}>
                  <MenuItem value={TaskPriority.HIGH}>High</MenuItem>
                  <MenuItem value={TaskPriority.MEDIUM}>Medium</MenuItem>
                  <MenuItem value={TaskPriority.LOW}>Low</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <Autocomplete
                multiple
                options={activeTour.travelers}
                getOptionLabel={(option) => option.name}
                value={activeTour.travelers.filter((t) => formData.travelers.includes(t.id))}
                onChange={(_, newValue) => setFormData({ ...formData, travelers: newValue.map((t) => t.id) })}
                renderInput={(params) => <TextField {...params} label="Travelers" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const tagProps = getTagProps({ index });
                    const { key, ...otherProps } = tagProps;
                    return <Chip key={key} variant="outlined" label={option.name} {...otherProps} />;
                  })
                }
              />
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                options={activeTour.travelers}
                getOptionLabel={(option) => option.name}
                value={activeTour.travelers.filter((t) => formData.assignedTo.includes(t.id))}
                onChange={(_, newValue) => setFormData({ ...formData, assignedTo: newValue.map((t) => t.id) })}
                renderInput={(params) => <TextField {...params} label="Assigned to" />}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => {
                    const tagProps = getTagProps({ index });
                    const { key, ...otherProps } = tagProps;
                    return <Chip key={key} variant="outlined" label={option.name} color="primary" {...otherProps} />;
                  })
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseTaskDialog}>Cancel</Button>
          <Button onClick={handleSaveTask} variant="contained" disabled={!formData.title || !formData.date}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Planning;
