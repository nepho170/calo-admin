import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
  CalendarToday as CalendarIcon,
} from "@mui/icons-material";
import { monthOverridesService } from "../services/monthOverrides";
import { macroPlansService } from "../services/macroPlans";
import { mealsService } from "../services/meals";

const MonthOverrides = () => {
  const [overrides, setOverrides] = useState([]);
  const [macroPlans, setMacroPlans] = useState([]);
  const [meals, setMeals] = useState([]);
  const [selectedMacroPlan, setSelectedMacroPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingOverride, setEditingOverride] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedMacroPlan]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [overridesData, macroPlansData, mealsData] = await Promise.all([
        selectedMacroPlan
          ? monthOverridesService.getByMacroPlan(selectedMacroPlan)
          : monthOverridesService.getAll(),
        macroPlansService.getAll(),
        mealsService.getAll(),
      ]);

      setOverrides(overridesData);
      setMacroPlans(macroPlansData);
      setMeals(mealsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOverride = async (overrideData) => {
    try {
      await monthOverridesService.add({
        ...overrideData,
        isActive: true,
      });

      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error("Error creating override:", error);
    }
  };

  const handleUpdateOverride = async (overrideData) => {
    try {
      await monthOverridesService.update(editingOverride.id, overrideData);
      setEditingOverride(null);
      loadData();
    } catch (error) {
      console.error("Error updating override:", error);
    }
  };

  const handleToggleActive = async (overrideId) => {
    try {
      await monthOverridesService.toggleActive(overrideId);
      loadData();
    } catch (error) {
      console.error("Error toggling override:", error);
    }
  };

  const handleDeleteOverride = async (overrideId) => {
    if (window.confirm("Are you sure you want to delete this override?")) {
      try {
        await monthOverridesService.delete(overrideId);
        loadData();
      } catch (error) {
        console.error("Error deleting override:", error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isUpcoming = (dateString) => {
    const today = new Date().toISOString().split("T")[0];
    return dateString >= today;
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Month Overrides
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateModal(true)}
        >
          Create Override
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="macro-plan-filter-label">
            Filter by Macro Plan
          </InputLabel>
          <Select
            labelId="macro-plan-filter-label"
            value={selectedMacroPlan}
            onChange={(e) => setSelectedMacroPlan(e.target.value)}
            label="Filter by Macro Plan"
          >
            <MenuItem value="">All Macro Plans</MenuItem>
            {macroPlans.map((plan) => (
              <MenuItem key={plan.id} value={plan.id}>
                {plan.title}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                component="h3"
                color="text.secondary"
                gutterBottom
              >
                Total Overrides
              </Typography>
              <Typography variant="h3" component="p" color="primary">
                {overrides.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                component="h3"
                color="text.secondary"
                gutterBottom
              >
                Active Overrides
              </Typography>
              <Typography variant="h3" component="p" color="success.main">
                {overrides.filter((o) => o.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                component="h3"
                color="text.secondary"
                gutterBottom
              >
                Upcoming
              </Typography>
              <Typography variant="h3" component="p" color="warning.main">
                {
                  overrides.filter((o) => o.isActive && isUpcoming(o.date))
                    .length
                }
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overrides List */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" component="h2">
            All Overrides
          </Typography>
        </Box>

        {overrides.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No month overrides found.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
              sx={{ mt: 2 }}
            >
              Create Your First Override
            </Button>
          </Box>
        ) : (
          <Box>
            {overrides.map((override, index) => {
              const macroPlan = macroPlans.find(
                (p) => p.id === override.macroPlanId
              );
              const mealCount = Object.values(
                override.customMealOptions || {}
              ).reduce((sum, meals) => sum + meals.length, 0);

              return (
                <Box
                  key={override.id}
                  sx={{
                    p: 2,
                    borderBottom: index < overrides.length - 1 ? 1 : 0,
                    borderColor: "divider",
                    "&:hover": {
                      backgroundColor: "action.hover",
                    },
                  }}
                >
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="flex-start"
                  >
                    <Box sx={{ flex: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <CalendarIcon fontSize="small" color="primary" />
                        <Typography variant="h6" component="h3">
                          {formatDate(override.date)}
                        </Typography>
                        {isUpcoming(override.date) && (
                          <Chip
                            label="Upcoming"
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        )}
                        <Chip
                          label={override.isActive ? "Active" : "Inactive"}
                          size="small"
                          color={override.isActive ? "success" : "error"}
                          variant="outlined"
                        />
                      </Box>

                      <Typography
                        variant="body1"
                        color="text.secondary"
                        gutterBottom
                      >
                        {override.reason}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Macro Plan: {macroPlan?.title || "Unknown"} •{" "}
                        {mealCount} custom meals
                      </Typography>

                      {/* Meal Options Preview */}
                      <Grid container spacing={1} sx={{ mt: 1 }}>
                        {Object.entries(override.customMealOptions || {}).map(
                          ([mealType, mealIds]) => (
                            <Grid item xs={6} sm={3} key={mealType}>
                              <Typography variant="body2">
                                <strong style={{ textTransform: "capitalize" }}>
                                  {mealType}:
                                </strong>{" "}
                                {mealIds.length} options
                              </Typography>
                            </Grid>
                          )
                        )}
                      </Grid>
                    </Box>

                    <Box display="flex" gap={1} ml={2}>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => setEditingOverride(override)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={
                          override.isActive ? (
                            <ToggleOffIcon />
                          ) : (
                            <ToggleOnIcon />
                          )
                        }
                        color={override.isActive ? "error" : "success"}
                        onClick={() => handleToggleActive(override.id)}
                      >
                        {override.isActive ? "Deactivate" : "Activate"}
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDeleteOverride(override.id)}
                      >
                        Delete
                      </Button>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Paper>

      {/* Create Override Modal */}
      {showCreateModal && (
        <OverrideModal
          macroPlans={macroPlans}
          meals={meals}
          onSubmit={handleCreateOverride}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Override Modal */}
      {editingOverride && (
        <OverrideModal
          macroPlans={macroPlans}
          meals={meals}
          override={editingOverride}
          onSubmit={handleUpdateOverride}
          onClose={() => setEditingOverride(null)}
        />
      )}
    </Box>
  );
};

// Override Modal Component (for both create and edit)
const OverrideModal = ({
  macroPlans,
  meals,
  override = null,
  onSubmit,
  onClose,
}) => {
  const [formData, setFormData] = useState({
    macroPlanId: override?.macroPlanId || "",
    date: override?.date || "",
    reason: override?.reason || "",
    customMealOptions: override?.customMealOptions || {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    },
  });

  const handleMealChange = (mealType, mealIds) => {
    setFormData({
      ...formData,
      customMealOptions: {
        ...formData.customMealOptions,
        [mealType]: mealIds,
      },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const mealTypes = ["breakfast", "lunch", "dinner", "snack"];

  return (
    <Dialog open={true} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {override ? "Edit Override" : "Create Month Override"}
      </DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                type="date"
                label="Date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                fullWidth
                required
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel id="macro-plan-label">Macro Plan</InputLabel>
                <Select
                  labelId="macro-plan-label"
                  value={formData.macroPlanId}
                  onChange={(e) =>
                    setFormData({ ...formData, macroPlanId: e.target.value })
                  }
                  label="Macro Plan"
                >
                  {macroPlans.map((plan) => (
                    <MenuItem key={plan.id} value={plan.id}>
                      {plan.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Reason for Override"
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                fullWidth
                required
                placeholder="e.g., Christmas Special Menu, Holiday Variation"
              />
            </Grid>

            {mealTypes.map((mealType) => (
              <Grid item xs={12} sm={6} key={mealType}>
                <FormControl fullWidth>
                  <InputLabel
                    id={`${mealType}-label`}
                    sx={{ textTransform: "capitalize" }}
                  >
                    {mealType} Options
                  </InputLabel>
                  <Select
                    labelId={`${mealType}-label`}
                    multiple
                    value={formData.customMealOptions[mealType]}
                    onChange={(e) => {
                      const value =
                        typeof e.target.value === "string"
                          ? e.target.value.split(",")
                          : e.target.value;
                      handleMealChange(mealType, value);
                    }}
                    label={`${mealType} Options`}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                        {selected.map((value) => {
                          const meal = meals.find((m) => m.id === value);
                          return (
                            <Chip
                              key={value}
                              label={meal?.title || value}
                              size="small"
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {meals
                      .filter((meal) => meal.type === mealType)
                      .map((meal) => (
                        <MenuItem key={meal.id} value={meal.id}>
                          {meal.title}
                        </MenuItem>
                      ))}
                  </Select>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    Select multiple meals for this meal type
                  </Typography>
                </FormControl>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {override ? "Update Override" : "Create Override"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default MonthOverrides;
