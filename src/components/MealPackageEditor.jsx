import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  FormControlLabel,
  Checkbox,
  Switch,
  Button,
  Grid,
  Typography,
  Box,
  Divider,
  MenuItem,
  Select,
  InputLabel,
  InputAdornment,
  CircularProgress,
} from "@mui/material";
import {
  Coffee as CoffeeIcon,
  LocalDining as LocalDiningIcon,
  DinnerDining as DinnerIcon,
  Fastfood as FastfoodIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { macroPlansService } from "../services/macroPlans";
import { imageUploadService } from "../services/storage";
import CalorieCalculationSection from "../components/CalorieCalculationSection";

const MEAL_TYPE_ICONS = {
  breakfast: <CoffeeIcon />,
  lunch: <LocalDiningIcon />,
  dinner: <DinnerIcon />,
  snack: <FastfoodIcon />,
};

const MEAL_TYPE_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MealPackageEditor = ({ open, onClose, package: pkg, onSave }) => {
  const [formData, setFormData] = useState({
    macroPlanId: "",
    title: "",
    description: "",
    image: "",
    includedMealTypes: [],
    calorieRange: {
      min: 1200,
      max: 2000,
    },
    pricePerDay: 0,
    isPopular: false,
    order: 0,
    isActive: true,
    isAutoCalculated: false,
    features: [],
    isCustom: false,
    customMealQuantities: null,
  });

  const [macroPlans, setMacroPlans] = useState([]);
  const [selectedMacroPlan, setSelectedMacroPlan] = useState(null);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageUploading, setImageUploading] = useState(false);

  // Initialize form data when dialog opens or package changes
  useEffect(() => {
    if (open) {
      initializeFormData();
      fetchMacroPlans();
    }
  }, [open, pkg]);

  useEffect(() => {
    if (formData.macroPlanId && macroPlans.length > 0) {
      const plan = macroPlans.find((p) => p.id === formData.macroPlanId);
      setSelectedMacroPlan(plan || null);
    } else {
      setSelectedMacroPlan(null);
    }
  }, [formData.macroPlanId, macroPlans]);

  // Calculate price per day based on macro plan mealTypePricing and included meal types
  useEffect(() => {
    if (!selectedMacroPlan || !formData.includedMealTypes) return;
    const pricing = selectedMacroPlan.mealTypePricing || {};
    let total = 0;
    formData.includedMealTypes.forEach((type) => {
      total += pricing[type] || 0;
    });
    setFormData((prev) => ({ ...prev, pricePerDay: total }));
  }, [selectedMacroPlan, formData.includedMealTypes]);

  const initializeFormData = () => {
    if (pkg) {
      setFormData({
        macroPlanId: pkg.macroPlanId || "",
        title: pkg.title || "",
        description: pkg.description || "",
        image: pkg.image || "",
        includedMealTypes: pkg.includedMealTypes || [],
        calorieRange: {
          min: pkg.calorieRange?.min || 1200,
          max: pkg.calorieRange?.max || 2000,
        },
        pricePerDay: pkg.pricePerDay || 0,
        isPopular: pkg.isPopular || false,
        order: pkg.order || 0,
        isActive: pkg.isActive !== undefined ? pkg.isActive : true,
        isAutoCalculated: pkg.isAutoCalculated || false,

        features: pkg.features || [],
        isCustom: pkg.isCustom || false,
        customMealQuantities: pkg.customMealQuantities || null,
      });
      setImagePreview(pkg.image || "");
    } else {
      setFormData({
        macroPlanId: "",
        title: "",
        description: "",
        image: "",
        includedMealTypes: ["breakfast", "lunch", "dinner"],
        calorieRange: {
          min: 1200,
          max: 2000,
        },
        pricePerDay: 0,
        isPopular: false,
        order: 0,
        isActive: true,
        isAutoCalculated: false,

        features: [],
        isCustom: false,
        customMealQuantities: null,
      });
      setImagePreview("");
    }

    // Reset other states
    setErrors({});
    setSelectedImage(null);
    setImageUploading(false);
  };

  const fetchMacroPlans = async () => {
    try {
      const plans = await macroPlansService.getActive();
      setMacroPlans(plans);
    } catch (error) {
      console.error("Error fetching macro plans:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.macroPlanId) {
      newErrors.macroPlanId = "Macro plan is required";
    }

    if (formData.pricePerDay <= 0) {
      newErrors.pricePerDay = "Price per day must be greater than 0";
    }

    if (formData.calorieRange.min >= formData.calorieRange.max) {
      newErrors.calorieRange =
        "Minimum calories must be less than maximum calories";
    }

    if (
      !formData.includedMealTypes ||
      formData.includedMealTypes.length === 0
    ) {
      newErrors.includedMealTypes = "At least one meal type must be selected";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };

  const handleNestedInputChange = (parentField, childField, value) => {
    setFormData({
      ...formData,
      [parentField]: {
        ...formData[parentField],
        [childField]: value,
      },
    });
  };

  const handleMealTypeToggle = (type) => {
    const currentTypes = formData.includedMealTypes || [];
    const newTypes = currentTypes.includes(type)
      ? currentTypes.filter((t) => t !== type)
      : [...currentTypes, type];

    setFormData({
      ...formData,
      includedMealTypes: newTypes,
    });
  };

  const handleImageSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedImage(file);
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage) return null;

    setImageUploading(true);
    try {
      // For new packages, use a temporary ID, we'll update it after creation
      const tempId = pkg?.id || `temp_${Date.now()}`;
      const uploadResult = await imageUploadService.uploadMealPackageImage(
        selectedImage,
        tempId
      );

      setFormData({
        ...formData,
        image: uploadResult.url,
      });

      return uploadResult.url;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    } finally {
      setImageUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
    setImagePreview("");
    setFormData({
      ...formData,
      image: "",
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error("Error saving meal package:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset form when closing
    initializeFormData();
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {pkg ? "Edit Meal Package" : "Add New Meal Package"}
      </DialogTitle>
      <DialogContent dividers sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Basic Information Section */}
          <Grid item xs={12} sx={{ mb: 3, width: "100%" }}>
            {" "}
            {/* added spacing below title */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              📝 Basic Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Enter the basic details for this meal package.
            </Typography>
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Title"
              fullWidth
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              error={!!errors.title}
              helperText={errors.title}
              placeholder="e.g., Balanced Nutrition Plan"
              sx={{ height: "100%" }}
              InputProps={{ sx: { height: 100 } }}
            />
          </Grid>

          <FormControl
            fullWidth
            error={!!errors.macroPlanId}
            sx={{ height: 120, width: "20%" }}
          >
            <InputLabel>Macro Plan</InputLabel>
            <Select
              value={formData.macroPlanId}
              onChange={(e) => handleInputChange("macroPlanId", e.target.value)}
              label="Macro Plan"
              sx={{ height: 100 }}
              MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
            >
              {macroPlans.map((plan) => (
                <MenuItem key={plan.id} value={plan.id}>
                  {plan.title}
                </MenuItem>
              ))}
            </Select>
            {errors.macroPlanId && (
              <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                {errors.macroPlanId}
              </Typography>
            )}
          </FormControl>

          <Grid item xs={12}>
            <TextField
              label="Description"
              fullWidth
              multiline
              rows={3}
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              error={!!errors.description}
              helperText={errors.description}
              placeholder="Describe what makes this package special..."
              sx={{ height: "100%" }}
              InputProps={{ sx: { height: 100 } }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Price Per Day"
              type="number"
              fullWidth
              value={formData.pricePerDay}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">$</InputAdornment>
                ),
                readOnly: true,
              }}
              helperText="Calculated automatically based on selected meal types and macro plan."
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              label="Display Order"
              type="number"
              fullWidth
              value={formData.order}
              onChange={(e) =>
                handleInputChange("order", parseInt(e.target.value) || 0)
              }
              helperText="Lower numbers appear first"
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Package Features"
              fullWidth
              multiline
              rows={2}
              value={formData.features.join(", ")}
              onChange={(e) => {
                const featuresArray = e.target.value
                  .split(",")
                  .map((f) => f.trim())
                  .filter((f) => f.length > 0);
                handleInputChange("features", featuresArray);
              }}
              placeholder="High protein, Gluten-free, Organic ingredients"
              helperText="Enter package features separated by commas"
            />
          </Grid>
          <Box sx={{ width: "100%", my: 3 }}>
            <Divider sx={{ width: "100%" }} />
          </Box>
          {/* Meal Types Section */}
          <Grid item xs={12}>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1 }}
            >
              🍽️ Included Meal Types
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Select which meal types are included in this package. Customers
              will receive these meal types from each day's menu.
            </Typography>
            {errors.includedMealTypes && (
              <Typography variant="body2" color="error" sx={{ mb: 2 }}>
                {errors.includedMealTypes}
              </Typography>
            )}
          </Grid>

          {Object.entries(MEAL_TYPE_LABELS).map(([type, label]) => (
            <Grid item xs={12} md={6} key={type}>
              <Box
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: formData.includedMealTypes?.includes(type)
                    ? "primary.main"
                    : "grey.300",
                  borderRadius: 1,
                  bgcolor: formData.includedMealTypes?.includes(type)
                    ? "primary.50"
                    : "transparent",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "primary.main",
                    bgcolor: "primary.50",
                  },
                }}
                onClick={() => handleMealTypeToggle(type)}
              >
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={
                        formData.includedMealTypes?.includes(type) || false
                      }
                      onChange={() => handleMealTypeToggle(type)}
                    />
                  }
                  label={
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      {MEAL_TYPE_ICONS[type]}
                      <Typography variant="body1" fontWeight="medium">
                        {label}
                      </Typography>
                    </Box>
                  }
                  sx={{ margin: 0, width: "100%" }}
                />
              </Box>
            </Grid>
          ))}

          {/* Calorie Calculation Section */}
          <CalorieCalculationSection
            formData={formData}
            setFormData={setFormData}
            errors={errors}
            setErrors={setErrors}
          />

          {/* Package Image and Settings Row */}
          <Grid item xs={12}></Grid>
          <Box sx={{ width: "100%", my: 3 }}>
            <Divider sx={{ width: "100%" }} />
          </Box>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Package Image
            </Typography>

            {(imagePreview || formData.image) && (
              <Box sx={{ mb: 2 }}>
                <Box
                  component="img"
                  sx={{
                    height: 200,
                    width: "100%",
                    maxWidth: 300,
                    objectFit: "cover",
                    borderRadius: 1,
                    border: "1px solid #e0e0e0",
                  }}
                  src={imagePreview || formData.image}
                  alt="Package preview"
                />
                <Box sx={{ mt: 1 }}>
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleRemoveImage}
                  >
                    Remove Image
                  </Button>
                </Box>
              </Box>
            )}

            <input
              accept="image/*"
              style={{ display: "none" }}
              id="package-image-upload"
              type="file"
              onChange={handleImageSelect}
            />
            <label htmlFor="package-image-upload">
              <Button
                variant="outlined"
                component="span"
                startIcon={<CloudUploadIcon />}
                disabled={imageUploading}
                fullWidth
              >
                {imageUploading ? "Uploading..." : "Select Package Image"}
              </Button>
            </label>

            {selectedImage && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Selected: {selectedImage.name}
              </Typography>
            )}
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Package Settings
            </Typography>

            <Box
              sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 2 }}
            >
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isPopular}
                    onChange={(e) =>
                      handleInputChange("isPopular", e.target.checked)
                    }
                  />
                }
                label="Popular Package"
                sx={{ margin: 0 }}
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                  />
                }
                label="Active"
                sx={{ margin: 0 }}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={handleClose} variant="outlined" size="large">
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          size="large"
          sx={{ minWidth: 120 }}
        >
          {loading ? (
            <CircularProgress size={20} color="inherit" />
          ) : pkg ? (
            "Update Package"
          ) : (
            "Add Package"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default MealPackageEditor;
