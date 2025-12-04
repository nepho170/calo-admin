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
  Alert,
  CircularProgress,
  Paper,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  CalendarToday as CalendarIcon,
  Warning as WarningIcon,
} from "@mui/icons-material";
import { masterMonthTemplatesService } from "../services/masterMonthTemplates";
import { macroPlansService } from "../services/macroPlans";
import { mealsService } from "../services/meals";

// Utility functions for date handling
const getCurrentDayOfMonth = () => {
  return new Date().getDate();
};

const isWithinUpcoming6Days = (dayNumber) => {
  const currentDay = getCurrentDayOfMonth();
  const daysInMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate();

  // Handle month rollover
  if (currentDay + 6 > daysInMonth) {
    return dayNumber >= currentDay || dayNumber <= currentDay + 6 - daysInMonth;
  }

  return dayNumber >= currentDay && dayNumber <= currentDay + 6;
};

const MasterMonthTemplates = () => {
  const [templates, setTemplates] = useState([]);
  const [macroPlans, setMacroPlans] = useState([]);
  const [meals, setMeals] = useState([]);
  const [selectedMacroPlan, setSelectedMacroPlan] = useState("");
  const [loading, setLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showWarningDialog, setShowWarningDialog] = useState(false);
  const [pendingDayEdit, setPendingDayEdit] = useState(null);

  useEffect(() => {
    loadData();
  }, [selectedMacroPlan]);

  const loadData = async () => {
    try {
      setLoading(true);

      const [templatesData, macroPlansData, mealsData] = await Promise.all([
        selectedMacroPlan
          ? masterMonthTemplatesService.getByMacroPlan(selectedMacroPlan)
          : masterMonthTemplatesService.getAll(),
        macroPlansService.getAll(),
        mealsService.getAll(),
      ]);

      setTemplates(templatesData);
      setMacroPlans(macroPlansData);
      setMeals(mealsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData) => {
    try {
      // Create empty master days (31 days)
      const masterDays = {};
      for (let i = 1; i <= 31; i++) {
        masterDays[`day${i}`] = {
          dayLabel: `Day ${i}`,
          mealOptions: {
            breakfast: [],
            lunch: [],
            dinner: [],
            snack: [],
          },
        };
      }

      await masterMonthTemplatesService.add({
        ...templateData,
        masterDays,
        isActive: true,
        isDefault: false,
      });

      setShowCreateModal(false);
      loadData();
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  const handleSetDefault = async (templateId) => {
    try {
      const template = templates.find((t) => t.id === templateId);
      await masterMonthTemplatesService.setAsDefault(
        templateId,
        template.macroPlanId
      );
      loadData();
    } catch (error) {
      console.error("Error setting default template:", error);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm("Are you sure you want to delete this template?")) {
      try {
        await masterMonthTemplatesService.delete(templateId);
        loadData();
      } catch (error) {
        console.error("Error deleting template:", error);
      }
    }
  };

  const handleEditDay = (template, dayNumber) => {
    if (isWithinUpcoming6Days(dayNumber)) {
      setPendingDayEdit({ template, dayNumber });
      setShowWarningDialog(true);
    } else {
      setEditingTemplate(template);
      setEditingDay(dayNumber);
    }
  };

  const handleConfirmEditDay = () => {
    if (pendingDayEdit) {
      setEditingTemplate(pendingDayEdit.template);
      setEditingDay(pendingDayEdit.dayNumber);
      setPendingDayEdit(null);
    }
    setShowWarningDialog(false);
  };

  const handleCancelEditDay = () => {
    setPendingDayEdit(null);
    setShowWarningDialog(false);
  };

  const handleUpdateDay = async (dayData) => {
    try {
      await masterMonthTemplatesService.updateDay(
        editingTemplate.id,
        editingDay,
        dayData
      );
      setEditingTemplate(null);
      setEditingDay(null);
      loadData();
    } catch (error) {
      console.error("Error updating day:", error);
    }
  };

  const getDaysOfWeek = () => ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const renderDayGrid = (template) => {
    const days = [];
    for (let i = 1; i <= 31; i++) {
      const dayData = template.masterDays[`day${i}`];
      const mealCount = Object.values(dayData?.mealOptions || {}).reduce(
        (sum, meals) => sum + meals.length,
        0
      );

      days.push(
        <Grid item xs={12 / 6} key={i}>
          <Paper
            sx={{
              p: 1,
              minHeight: 80,
              cursor: "pointer",
              border: "1px solid",
              borderColor: isWithinUpcoming6Days(i)
                ? "warning.main"
                : "divider",
              backgroundColor: isWithinUpcoming6Days(i)
                ? "transparent"
                : "background.paper",
              "&:hover": {
                backgroundColor: isWithinUpcoming6Days(i)
                  ? "warning.light"
                  : "action.hover",
              },
              position: "relative",
            }}
            onClick={() => handleEditDay(template, i)}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: "medium" }}>
                Day {i}
              </Typography>
              {isWithinUpcoming6Days(i) && (
                <WarningIcon sx={{ fontSize: 16, color: "warning.dark" }} />
              )}
            </Box>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ display: "block", mt: 0.5 }}
            >
              {mealCount} meals
            </Typography>
            {dayData?.dayLabel !== `Day ${i}` && (
              <Typography
                variant="caption"
                color="primary"
                sx={{ display: "block", mt: 0.5 }}
              >
                {dayData?.dayLabel}
              </Typography>
            )}
          </Paper>
        </Grid>
      );
    }
    return days;
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1" sx={{ fontWeight: "bold" }}>
          Master Month Templates
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateModal(true)}
          sx={{ minWidth: 200 }}
        >
          Create New Template
        </Button>
      </Box>

      {/* Warning Alert */}
      <Alert severity="warning" icon={<WarningIcon />} sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
          <strong>Important:</strong> Days highlighted in orange are within the
          next 6 days. Modifying these menus may cause conflicts as users may
          have already viewed and selected from them.
        </Typography>
      </Alert>

      {/* Template Usage Note */}
      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2" sx={{ fontWeight: "medium" }}>
          <strong>Note:</strong> To use a template for meal planning, you must
          set it as the default template for its macro plan. Only the default
          template will be used when generating meal plans for customers.
        </Typography>
      </Alert>

      {/* Filters */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <FormControl fullWidth>
                <InputLabel>Filter by Macro Plan</InputLabel>
                <Select
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
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Templates List */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        {templates.map((template) => {
          const macroPlan = macroPlans.find(
            (p) => p.id === template.macroPlanId
          );

          return (
            <Card key={template.id} sx={{ p: 3 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  mb: 2,
                }}
              >
                <Box sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      mb: 1,
                    }}
                  >
                    <Typography
                      variant="h5"
                      component="h3"
                      sx={{ fontWeight: "semibold" }}
                    >
                      {template.templateName}
                    </Typography>
                    {template.isDefault && (
                      <Chip
                        label="DEFAULT"
                        color="success"
                        size="small"
                        variant="filled"
                      />
                    )}
                  </Box>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {template.description}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Macro Plan: {macroPlan?.title || "Unknown"}
                  </Typography>
                </Box>

                <Box sx={{ display: "flex", gap: 1 }}>
                  {!template.isDefault && (
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      onClick={() => handleSetDefault(template.id)}
                    >
                      Set Default
                    </Button>
                  )}
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    startIcon={<DeleteIcon />}
                    onClick={() => handleDeleteTemplate(template.id)}
                  >
                    Delete
                  </Button>
                </Box>
              </Box>

              {/* 31-Day Grid */}
              <Grid container spacing={1} sx={{ mt: 2 }}>
                {renderDayGrid(template)}
              </Grid>
            </Card>
          );
        })}

        {templates.length === 0 && (
          <Paper sx={{ p: 7, textAlign: "center" }}>
            <CalendarIcon
              sx={{ fontSize: 74, color: "text.secondary", mb: 2 }}
            />
            <Typography variant="h7" color="text.secondary" sx={{ mb: 2 }}>
              No master month templates found.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
            >
              Create Your First Template
            </Button>
          </Paper>
        )}
      </Box>

      {/* Create Template Modal */}
      {showCreateModal && (
        <CreateTemplateModal
          macroPlans={macroPlans}
          onSubmit={handleCreateTemplate}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Warning Dialog for Upcoming Days */}
      <Dialog
        open={showWarningDialog}
        onClose={handleCancelEditDay}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <WarningIcon color="warning" />
          Editing Upcoming Menu
        </DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body1" sx={{ fontWeight: "medium", mb: 1 }}>
              You are about to edit Day {pendingDayEdit?.dayNumber}, which is
              within the next 6 days.
            </Typography>
            <Typography variant="body2">
              <strong>Warning:</strong> Users may have already seen and selected
              meals from this day's menu. Changing the available meals now could
              cause conflicts with user selections and preferences.
            </Typography>
          </Alert>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to proceed with editing this day's menu?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelEditDay} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmEditDay}
            color="warning"
            variant="contained"
            startIcon={<WarningIcon />}
          >
            Continue Anyway
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Day Modal */}
      {editingTemplate && editingDay && (
        <EditDayModal
          template={editingTemplate}
          dayNumber={editingDay}
          meals={meals}
          onSubmit={handleUpdateDay}
          onClose={() => {
            setEditingTemplate(null);
            setEditingDay(null);
          }}
        />
      )}
    </Box>
  );
};

// Create Template Modal Component
const CreateTemplateModal = ({ macroPlans, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    templateName: "",
    description: "",
    macroPlanId: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Create Master Month Template</DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Template Name"
            value={formData.templateName}
            onChange={(e) =>
              setFormData({ ...formData, templateName: e.target.value })
            }
            margin="normal"
            required
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
          />

          <FormControl fullWidth margin="normal" required>
            <InputLabel>Macro Plan</InputLabel>
            <Select
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
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Create Template
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Edit Day Modal Component
const EditDayModal = ({ template, dayNumber, meals, onSubmit, onClose }) => {
  const dayData = template.masterDays[`day${dayNumber}`] || {
    dayLabel: `Day ${dayNumber}`,
    mealOptions: { breakfast: [], lunch: [], dinner: [], snack: [] },
  };

  const [formData, setFormData] = useState(dayData);

  const handleMealChange = (mealType, mealIds) => {
    setFormData({
      ...formData,
      mealOptions: {
        ...formData.mealOptions,
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          Edit Day {dayNumber}
          {isWithinUpcoming6Days(dayNumber) && (
            <Chip
              label="Upcoming"
              color="warning"
              size="small"
              icon={<WarningIcon />}
            />
          )}
        </Box>
      </DialogTitle>
      <DialogContent>
        {isWithinUpcoming6Days(dayNumber) && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2">
              <strong>Caution:</strong> This day is within the next 6 days.
              Users may have already seen and selected from this menu. Changes
              may cause conflicts with existing user preferences.
            </Typography>
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
          <TextField
            fullWidth
            label="Day Label"
            value={formData.dayLabel}
            onChange={(e) =>
              setFormData({ ...formData, dayLabel: e.target.value })
            }
            margin="normal"
          />

          <Grid container spacing={2} sx={{ mt: 2 }}>
            {mealTypes.map((mealType) => (
              <Grid item xs={12} md={6} key={mealType}>
                <FormControl fullWidth>
                  <InputLabel sx={{ textTransform: "capitalize" }}>
                    {mealType} Options
                  </InputLabel>
                  <Select
                    multiple
                    value={formData.mealOptions[mealType]}
                    onChange={(e) => handleMealChange(mealType, e.target.value)}
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
                    {meals.map((meal) => (
                      <MenuItem key={meal.id} value={meal.id}>
                        {meal.title}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.5 }}
                >
                  Hold Ctrl/Cmd to select multiple meals
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          Update Day
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MasterMonthTemplates;
