import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Switch,
  Slider,
  Chip,
  Alert,
  AlertTitle,
  Paper,
  Divider,
  IconButton,
  Tooltip,
  CircularProgress,
  Snackbar,
  MenuItem,
  Select,
  InputLabel,
  InputAdornment,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Timeline as TimelineIcon,
  LocalOffer as LocalOfferIcon,
  PhotoCamera as PhotoCameraIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Visibility as VisibilityIcon,
  VisibilityOff as VisibilityOffIcon,
  RestaurantMenu as RestaurantMenuIcon,
  TrendingUp as TrendingUpIcon,
  FitnessCenter as FitnessCenterIcon,
  Speed as SpeedIcon,
} from "@mui/icons-material";
import { macroPlansService } from "../services/macroPlans";
import { uploadImage } from "../services/storage";
import { mealPackagesService } from "../services/mealPackages";

const TARGET_GOALS = [
  { value: "build_muscle", label: "Build Muscle" },
  { value: "lose_weight", label: "Lose Weight" },
  { value: "gain_weight", label: "Gain Weight" },
  { value: "maintain_weight", label: "Maintain Weight" },
];

const TARGET_AUDIENCE = [
  { value: "athletes", label: "Athletes" },
  { value: "beginners", label: "Beginners" },
  { value: "professionals", label: "Professionals" },
  { value: "seniors", label: "Seniors" },
];

const DIFFICULTY_LEVELS = [
  { value: "easy", label: "Easy", color: "success" },
  { value: "medium", label: "Medium", color: "warning" },
  { value: "hard", label: "Hard", color: "error" },
];

const MacroPlanCard = ({
  plan,
  lowestPrice,
  onEdit,
  onDelete,
  onToggleActive,
}) => {
  const proteinPercentage = plan.macroPercentages?.protein || 0;
  const carbsPercentage = plan.macroPercentages?.carbs || 0;
  const fatPercentage = plan.macroPercentages?.fat || 0;

  return (
    <Card
      sx={{
        height: 550, // 👈 fixed height
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      {plan.image && (
        <CardMedia
          component="img"
          height="200"
          image={plan.image}
          alt={plan.title}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
            {plan.title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {plan.isRecommended && (
              <Chip
                icon={<StarIcon />}
                label="Recommended"
                color="primary"
                size="small"
              />
            )}
            <Switch
              checked={plan.isActive}
              onChange={() => onToggleActive(plan.id, !plan.isActive)}
              size="small"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {plan.description}
        </Typography>

        <Paper sx={{ p: 2, mb: 2, backgroundColor: "grey.50" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Macro Distribution
          </Typography>
          <Box sx={{ display: "flex", gap: 2, mb: 1 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="primary">
                Protein: {proteinPercentage}%
              </Typography>
              <Box
                sx={{
                  height: 6,
                  backgroundColor: "primary.main",
                  borderRadius: 1,
                  width: `${proteinPercentage}%`,
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="secondary">
                Carbs: {carbsPercentage}%
              </Typography>
              <Box
                sx={{
                  height: 6,
                  backgroundColor: "secondary.main",
                  borderRadius: 1,
                  width: `${carbsPercentage}%`,
                }}
              />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="caption" color="warning.main">
                Fat: {fatPercentage}%
              </Typography>
              <Box
                sx={{
                  height: 6,
                  backgroundColor: "warning.main",
                  borderRadius: 1,
                  width: `${fatPercentage}%`,
                }}
              />
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Starting from
          </Typography>
          <Typography variant="h6" color="primary">
            ${lowestPrice}/day
          </Typography>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Target Goals
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
            {plan.targetGoals?.map((goal) => (
              <Chip
                key={goal}
                label={
                  TARGET_GOALS.find((g) => g.value === goal)?.label || goal
                }
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Order: {plan.order}
        </Typography>
        <Box>
          <IconButton onClick={() => onEdit(plan)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDelete(plan.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
};

const MacroPlanDialog = ({ open, onClose, plan, onSave, lowestPrice }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    macroPercentages: {
      protein: 40,
      carbs: 35,
      fat: 25,
    },
    image: "",
    isRecommended: false,
    targetGoals: [],
    targetAudience: [],
    isActive: true,
    order: 0,
    mealTypePricing: {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    },
    mealTypeCalories: {
      breakfast: { min: 0, max: 0 },
      lunch: { min: 0, max: 0 },
      dinner: { min: 0, max: 0 },
      snack: { min: 0, max: 0 },
    },
  });
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (plan) {
      setFormData({
        title: plan.title || "",
        description: plan.description || "",
        macroPercentages: {
          protein: plan.macroPercentages?.protein || 40,
          carbs: plan.macroPercentages?.carbs || 35,
          fat: plan.macroPercentages?.fat || 25,
        },
        image: plan.image || "",
        isRecommended: plan.isRecommended || false,
        targetGoals: plan.targetGoals || [],
        targetAudience: plan.targetAudience || [],
        isActive: plan.isActive !== undefined ? plan.isActive : true,
        order: plan.order || 0,
        mealTypePricing: plan.mealTypePricing || {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          snack: 0,
        },
        mealTypeCalories: plan.mealTypeCalories || {
          breakfast: { min: 0, max: 0 },
          lunch: { min: 0, max: 0 },
          dinner: { min: 0, max: 0 },
          snack: { min: 0, max: 0 },
        },
      });
    } else {
      setFormData({
        title: "",
        description: "",
        macroPercentages: {
          protein: 40,
          carbs: 35,
          fat: 25,
        },
        image: "",
        isRecommended: false,
        targetGoals: [],
        targetAudience: [],
        isActive: true,
        order: 0,
        mealTypePricing: {
          breakfast: 0,
          lunch: 0,
          dinner: 0,
          snack: 0,
        },
        mealTypeCalories: {
          breakfast: { min: 0, max: 0 },
          lunch: { min: 0, max: 0 },
          dinner: { min: 0, max: 0 },
          snack: { min: 0, max: 0 },
        },
      });
    }
    setImageFile(null);
    setErrors({});
  }, [plan, open]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    const totalMacros =
      formData.macroPercentages.protein +
      formData.macroPercentages.carbs +
      formData.macroPercentages.fat;

    if (Math.abs(totalMacros - 100) > 0.1) {
      newErrors.macroPercentages = "Macro percentages must total 100%";
    }

    if (formData.targetGoals.length === 0) {
      newErrors.targetGoals = "At least one target goal is required";
    }

    if (formData.targetAudience.length === 0) {
      newErrors.targetAudience = "At least one target audience is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setImageFile(file);
    setUploading(true);

    try {
      const imageUrl = await uploadImage(file, "macro-plans");
      setFormData({ ...formData, image: imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleMacroChange = (macro, value) => {
    const newMacros = { ...formData.macroPercentages, [macro]: value };
    const total = Object.values(newMacros).reduce((sum, val) => sum + val, 0);

    if (total <= 100) {
      setFormData({
        ...formData,
        macroPercentages: newMacros,
      });
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving macro plan:", error);
    }
  };

  const totalMacros =
    formData.macroPercentages.protein +
    formData.macroPercentages.carbs +
    formData.macroPercentages.fat;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {plan ? "Edit Macro Plan" : "Add New Macro Plan"}
      </DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              error={!!errors.title}
              helperText={errors.title}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Order"
              type="number"
              fullWidth
              value={formData.order}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  order: parseInt(e.target.value) || 0,
                })
              }
              margin="normal"
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              error={!!errors.description}
              helperText={errors.description}
              margin="normal"
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, mt: 2 }}>
              <Button
                variant="outlined"
                component="label"
                startIcon={
                  uploading ? (
                    <CircularProgress size={20} />
                  ) : (
                    <PhotoCameraIcon />
                  )
                }
                disabled={uploading}
              >
                Upload Image
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </Button>
              {formData.image && (
                <Box
                  component="img"
                  src={formData.image}
                  alt="Preview"
                  sx={{
                    width: 50,
                    height: 50,
                    objectFit: "cover",
                    borderRadius: 1,
                  }}
                />
              )}
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Macro Distribution
            </Typography>
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="body2"
                color={totalMacros === 100 ? "success.main" : "error.main"}
              >
                Total: {totalMacros}%{" "}
                {totalMacros !== 100 && "(Must equal 100%)"}
              </Typography>
              {errors.macroPercentages && (
                <Typography variant="body2" color="error">
                  {errors.macroPercentages}
                </Typography>
              )}
            </Box>
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography gutterBottom>
              Protein: {formData.macroPercentages.protein}%
            </Typography>
            <Slider
              value={formData.macroPercentages.protein}
              onChange={(e, value) => handleMacroChange("protein", value)}
              min={10}
              max={60}
              step={1}
              marks={[
                { value: 10, label: "10%" },
                { value: 30, label: "30%" },
                { value: 50, label: "50%" },
              ]}
              color="primary"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography gutterBottom>
              Carbs: {formData.macroPercentages.carbs}%
            </Typography>
            <Slider
              value={formData.macroPercentages.carbs}
              onChange={(e, value) => handleMacroChange("carbs", value)}
              min={5}
              max={65}
              step={1}
              marks={[
                { value: 5, label: "5%" },
                { value: 35, label: "35%" },
                { value: 65, label: "65%" },
              ]}
              color="secondary"
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Typography gutterBottom>
              Fat: {formData.macroPercentages.fat}%
            </Typography>
            <Slider
              value={formData.macroPercentages.fat}
              onChange={(e, value) => handleMacroChange("fat", value)}
              min={10}
              max={50}
              step={1}
              marks={[
                { value: 10, label: "10%" },
                { value: 25, label: "25%" },
                { value: 50, label: "50%" },
              ]}
              color="warning"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Target Goals
            </Typography>
            <FormControl component="fieldset" error={!!errors.targetGoals}>
              <FormGroup row>
                {TARGET_GOALS.map((goal) => (
                  <FormControlLabel
                    key={goal.value}
                    control={
                      <Checkbox
                        checked={formData.targetGoals.includes(goal.value)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({
                              ...formData,
                              targetGoals: [
                                ...formData.targetGoals,
                                goal.value,
                              ],
                            });
                          } else {
                            setFormData({
                              ...formData,
                              targetGoals: formData.targetGoals.filter(
                                (g) => g !== goal.value
                              ),
                            });
                          }
                        }}
                      />
                    }
                    label={goal.label}
                  />
                ))}
              </FormGroup>
              {errors.targetGoals && (
                <Typography variant="body2" color="error">
                  {errors.targetGoals}
                </Typography>
              )}
            </FormControl>
          </Grid>

          <Grid item xs={12}></Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isRecommended}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        isRecommended: e.target.checked,
                      })
                    }
                  />
                }
                label="Recommended Plan"
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      setFormData({ ...formData, isActive: e.target.checked })
                    }
                  />
                }
                label="Active"
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
              Starting Cost Per Day: <strong>${lowestPrice}</strong>
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Meal Type Pricing ($)
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(formData.mealTypePricing).map((type) => (
                <Grid item xs={6} md={3} key={type}>
                  <TextField
                    label={type.charAt(0).toUpperCase() + type.slice(1)}
                    type="number"
                    fullWidth
                    value={formData.mealTypePricing[type]}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        mealTypePricing: {
                          ...formData.mealTypePricing,
                          [type]: parseFloat(e.target.value) || 0,
                        },
                      })
                    }
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">$</InputAdornment>
                      ),
                    }}
                  />
                </Grid>
              ))}
            </Grid>
          </Grid>
          <Grid item xs={12} md={6}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="h6" gutterBottom>
              Meal Type Calories (Range)
            </Typography>
            <Grid container spacing={2}>
              {Object.keys(formData.mealTypeCalories).map((type) => (
                <Grid item xs={12} md={6} key={type}>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <TextField
                      label="Min"
                      type="number"
                      fullWidth
                      value={formData.mealTypeCalories[type].min}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mealTypeCalories: {
                            ...formData.mealTypeCalories,
                            [type]: {
                              ...formData.mealTypeCalories[type],
                              min: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">kcal</InputAdornment>
                        ),
                      }}
                      sx={{ mr: 1 }}
                    />
                    <TextField
                      label="Max"
                      type="number"
                      fullWidth
                      value={formData.mealTypeCalories[type].max}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          mealTypeCalories: {
                            ...formData.mealTypeCalories,
                            [type]: {
                              ...formData.mealTypeCalories[type],
                              max: parseFloat(e.target.value) || 0,
                            },
                          },
                        })
                      }
                      InputProps={{
                        endAdornment: (
                          <InputAdornment position="end">kcal</InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {plan ? "Update" : "Add"} Macro Plan
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Utility to update startingCostPerDay in macro plan collection
const updateMacroPlanStartingCost = async (macroPlanId) => {
  const packages = await mealPackagesService.getByMacroPlan(macroPlanId);
  const packagePrices = packages.map((pkg) => pkg.pricePerDay || 0);
  const lowestPrice = packagePrices.length > 0 ? Math.min(...packagePrices) : 0;
  await macroPlansService.update(macroPlanId, {
    startingCostPerDay: lowestPrice,
  });
};

export default function MacroPlans() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [lowestPrices, setLowestPrices] = useState({});

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const data = await macroPlansService.getActive();
      setPlans(data.sort((a, b) => a.order - b.order));
    } catch (error) {
      console.error("Error fetching macro plans:", error);
      setSnackbar({
        open: true,
        message: "Error loading macro plans",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    const fetchLowestPrices = async () => {
      const prices = {};
      for (const plan of plans) {
        const packages = await mealPackagesService.getByMacroPlan(plan.id);
        const packagePrices = packages.map((pkg) => pkg.pricePerDay || 0);
        const lowestPrice =
          packagePrices.length > 0 ? Math.min(...packagePrices) : 0;
        prices[plan.id] = lowestPrice;
        // Update macro plan collection field
        await macroPlansService.update(plan.id, {
          startingCostPerDay: lowestPrice,
        });
      }
      setLowestPrices(prices);
    };
    if (plans.length > 0) {
      fetchLowestPrices();
    }
  }, [plans]);

  const handleAddPlan = () => {
    setSelectedPlan(null);
    setDialogOpen(true);
  };

  const handleEditPlan = (plan) => {
    setSelectedPlan(plan);
    setDialogOpen(true);
  };

  const handleDeletePlan = async (planId) => {
    if (!window.confirm("Are you sure you want to delete this macro plan?")) {
      return;
    }

    try {
      await macroPlansService.delete(planId);
      setSnackbar({
        open: true,
        message: "Macro plan deleted successfully",
        severity: "success",
      });
      fetchPlans();
    } catch (error) {
      console.error("Error deleting macro plan:", error);
      setSnackbar({
        open: true,
        message: "Error deleting macro plan",
        severity: "error",
      });
    }
  };

  const handleToggleActive = async (planId, isActive) => {
    try {
      await macroPlansService.update(planId, { isActive });
      setSnackbar({
        open: true,
        message: `Macro plan ${
          isActive ? "activated" : "deactivated"
        } successfully`,
        severity: "success",
      });
      fetchPlans();
    } catch (error) {
      console.error("Error updating macro plan:", error);
      setSnackbar({
        open: true,
        message: "Error updating macro plan",
        severity: "error",
      });
    }
  };

  const handleSavePlan = async (planData) => {
    try {
      if (selectedPlan) {
        await macroPlansService.update(selectedPlan.id, planData);

        // Check if meal type pricing was updated
        const hasPricingUpdate =
          planData.mealTypePricing &&
          Object.values(planData.mealTypePricing).some((price) => price > 0);

        setSnackbar({
          open: true,
          message: hasPricingUpdate
            ? "Macro plan updated successfully. Meal package pricing has been synchronized."
            : "Macro plan updated successfully",
          severity: "success",
        });
      } else {
        await macroPlansService.add(planData);
        setSnackbar({
          open: true,
          message: "Macro plan added successfully",
          severity: "success",
        });
      }
      fetchPlans();
    } catch (error) {
      console.error("Error saving macro plan:", error);
      setSnackbar({
        open: true,
        message: "Error saving macro plan",
        severity: "error",
      });
      throw error;
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box sx={{ textAlign: "left" }}>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Macro Plans Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage macro nutrition plans (High Protein, Balanced,
            Keto, etc.).
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPlan}
        >
          Add Macro Plan
        </Button>
      </Box>

      {plans.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <TimelineIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No macro plans found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your first macro plan to organize your nutrition
            offerings.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPlan}
          >
            Add Your First Macro Plan
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3} justifyContent="center">
          {plans.map((plan) => (
            <Grid item key={plan.id}>
              <Box sx={{ width: 350 }}>
                <MacroPlanCard
                  plan={plan}
                  lowestPrice={lowestPrices[plan.id] || 0}
                  onEdit={handleEditPlan}
                  onDelete={handleDeletePlan}
                  onToggleActive={handleToggleActive}
                />
              </Box>
            </Grid>
          ))}
        </Grid>
      )}

      <MacroPlanDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        plan={selectedPlan}
        onSave={handleSavePlan}
        lowestPrice={selectedPlan ? lowestPrices[selectedPlan.id] || 0 : 0}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
