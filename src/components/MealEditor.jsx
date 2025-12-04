import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Avatar,
} from "@mui/material";
import { CloudUpload as CloudUploadIcon } from "@mui/icons-material";
import { uploadImage } from "../services/storage";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export default function MealEditor({
  open,
  onClose,
  mode, // 'add' or 'edit'
  meal,
  labels,
  allergies,
  onSubmit,
}) {
  const [formData, setFormData] = useState(() => {
    if (mode === "edit" && meal) {
      return {
        ...meal,
        removableAllergies: meal.removableAllergies || [], // Backward compatibility
      };
    }
    return {
      title: "",
      description: "",
      type: "breakfast",
      difficulty: "easy",
      imageUrl: "",
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
      },
      rawIngredients: "", // Text field for transparency and allergies
      components: [], // Array of meal components with nutrition and images
      labels: [],
      allergies: [],
      removableAllergies: [], // Subset of allergies that can be removed

      isFeatured: false,
      isActive: true,
      // Component customization fields
      allowCustomization: false,
      customizableComponents: [], // Array of component IDs that can be removed/modified
    };
  });

  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  // Reset form when dialog opens/closes or mode changes
  React.useEffect(() => {
    if (open) {
      if (mode === "edit" && meal) {
        setFormData({
          ...meal,
          removableAllergies: meal.removableAllergies || [], // Backward compatibility
        });
      } else {
        setFormData({
          title: "",
          description: "",
          type: "breakfast",
          difficulty: "easy",
          imageUrl: "",
          totalNutrition: {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
          },
          rawIngredients: "",
          components: [],
          labels: [],
          allergies: [],
          removableAllergies: [],
          isFeatured: false,
          isActive: true,
          allowCustomization: false,
          customizableComponents: [],
        });
      }
      setFormErrors({});
    }
  }, [open, mode, meal]);

  const handleInputChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => {
        const newData = {
          ...prev,
          [field]: value,
        };

        // If allergies are being updated, also update removableAllergies
        if (field === "allergies") {
          // Keep only removable allergies that are still in the allergies list
          newData.removableAllergies = (prev.removableAllergies || []).filter(
            (removableId) => value.includes(removableId)
          );
        }

        return newData;
      });
    }

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    try {
      setImageUploading(true);
      const imageUrl = await uploadImage(file, "meals");
      handleInputChange("imageUrl", imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setFormErrors({ general: "Failed to upload image. Please try again." });
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setFormErrors({});

      // Basic validation
      if (!formData.title?.trim()) {
        setFormErrors({ general: "Title is required" });
        return;
      }

      if (!formData.description?.trim()) {
        setFormErrors({ general: "Description is required" });
        return;
      }

      await onSubmit(formData);
      onClose();
    } catch (error) {
      console.error("Error saving meal:", error);
      setFormErrors({ general: "Failed to save meal. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      title: "",
      description: "",
      type: "breakfast",
      difficulty: "easy",
      imageUrl: "",
      totalNutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
      },
      rawIngredients: "",
      components: [],
      labels: [],
      allergies: [],
      removableAllergies: [],
      isFeatured: false,
      isActive: true,
      allowCustomization: false,
      customizableComponents: [],
    });
    setFormErrors({});
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: "80vh",
          maxHeight: "90vh",
        },
      }}
    >
      <DialogTitle
        sx={{
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "grey.50",
          fontSize: "1.25rem",
          fontWeight: 600,
        }}
      >
        {mode === "add" ? "Add New Meal" : "Edit Meal"}
      </DialogTitle>

      <DialogContent sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {formErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.general}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Basic Information Section */}
            <Grid item xs={12}>
              <Box sx={{ height: 16 }} />
              <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                Basic Information
              </Typography>
              <Box sx={{ height: 16 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    error={!!formErrors.title}
                    helperText={formErrors.title}
                    required
                    InputProps={{ sx: { height: 100 } }}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={formData.type}
                      label="Type"
                      onChange={(e) =>
                        handleInputChange("type", e.target.value)
                      }
                      sx={{ height: 100 }}
                      MenuProps={{ PaperProps: { sx: { maxHeight: 200 } } }}
                    >
                      {MEAL_TYPES.map((type) => (
                        <MenuItem key={type.value} value={type.value}>
                          {type.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description"
                    multiline
                    value={formData.description}
                    onChange={(e) =>
                      handleInputChange("description", e.target.value)
                    }
                    error={!!formErrors.description}
                    helperText={formErrors.description}
                    required
                    rows={3}
                    InputProps={{ sx: { minHeight: 100 } }} // Ensures height alignment
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      height: 100,
                      gap: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={
                        imageUploading ? (
                          <CircularProgress size={20} />
                        ) : (
                          <CloudUploadIcon />
                        )
                      }
                      disabled={imageUploading}
                      sx={{ height: "100%", whiteSpace: "nowrap" }}
                    >
                      Upload Image
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </Button>

                    {formData.imageUrl && (
                      <Avatar
                        src={formData.imageUrl}
                        alt="Meal"
                        variant="rounded" // optional: use "square" or "rounded"
                        sx={{ width: 100, height: 100 }}
                      />
                    )}
                  </Box>
                </Grid>
                <Grid item xs={12}>
                  <Box sx={{ height: 16 }} />
                </Grid>
              </Grid>
            </Grid>

            {/* Labels Section */}
            <Grid item xs={12}>
              <Box sx={{ height: 16 }} />
              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3 }}>
                Labels & Allergies
              </Typography>
              <Box sx={{ height: 16 }} />
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Labels</InputLabel>
                    <Select
                      multiple
                      value={formData.labels || []}
                      label="Labels"
                      onChange={(e) =>
                        handleInputChange("labels", e.target.value)
                      }
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => {
                            const label = labels.find((l) => l.id === value);
                            return (
                              <Chip
                                key={value}
                                label={label?.name || value}
                                size="small"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {labels.map((label) => (
                        <MenuItem key={label.id} value={label.id}>
                          {label.icon} {label.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Allergies</InputLabel>
                    <Select
                      multiple
                      value={formData.allergies || []}
                      label="Allergies"
                      onChange={(e) =>
                        handleInputChange("allergies", e.target.value)
                      }
                      renderValue={(selected) => (
                        <Box
                          sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                        >
                          {selected.map((value) => {
                            const allergy = allergies.find(
                              (a) => a.id === value
                            );
                            return (
                              <Chip
                                key={value}
                                label={allergy?.name || value}
                                size="small"
                                color="error"
                                variant="outlined"
                              />
                            );
                          })}
                        </Box>
                      )}
                    >
                      {allergies.map((allergy) => (
                        <MenuItem key={allergy.id} value={allergy.id}>
                          {allergy.icon} {allergy.name}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                {/* Removable Allergies Section */}
                {formData.allergies && formData.allergies.length > 0 && (
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Removable Allergies</InputLabel>
                      <Select
                        multiple
                        value={formData.removableAllergies || []}
                        label="Removable Allergies"
                        onChange={(e) =>
                          handleInputChange(
                            "removableAllergies",
                            e.target.value
                          )
                        }
                        renderValue={(selected) => (
                          <Box
                            sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}
                          >
                            {selected.map((value) => {
                              const allergy = allergies.find(
                                (a) => a.id === value
                              );
                              return (
                                <Chip
                                  key={value}
                                  label={allergy?.name || value}
                                  size="small"
                                  color="warning"
                                  variant="outlined"
                                />
                              );
                            })}
                          </Box>
                        )}
                      >
                        {/* Only show allergies that are already selected for this meal */}
                        {allergies
                          .filter((allergy) =>
                            formData.allergies.includes(allergy.id)
                          )
                          .map((allergy) => (
                            <MenuItem key={allergy.id} value={allergy.id}>
                              {allergy.icon} {allergy.name}
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                    <Typography
                      variant="caption"
                      sx={{ mt: 1, display: "block", color: "text.secondary" }}
                    >
                      Select which allergies can be removed by customers with
                      those allergies
                    </Typography>
                  </Grid>
                )}
                <Grid item xs={12}>
                  <Box sx={{ height: 16 }} />
                </Grid>
              </Grid>
            </Grid>

            {/* Ntion Section */}

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3 }}>
                Nutrition Information
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Calories"
                    type="number"
                    value={formData.totalNutrition.calories}
                    onChange={(e) =>
                      handleInputChange(
                        "totalNutrition.calories",
                        Number(e.target.value)
                      )
                    }
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 56,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Protein (g)"
                    type="number"
                    value={formData.totalNutrition.protein}
                    onChange={(e) =>
                      handleInputChange(
                        "totalNutrition.protein",
                        Number(e.target.value)
                      )
                    }
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 56,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Carbs (g)"
                    type="number"
                    value={formData.totalNutrition.carbs}
                    onChange={(e) =>
                      handleInputChange(
                        "totalNutrition.carbs",
                        Number(e.target.value)
                      )
                    }
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 56,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Fat (g)"
                    type="number"
                    value={formData.totalNutrition.fat}
                    onChange={(e) =>
                      handleInputChange(
                        "totalNutrition.fat",
                        Number(e.target.value)
                      )
                    }
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 56,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Fiber (g)"
                    type="number"
                    value={formData.totalNutrition.fiber}
                    onChange={(e) =>
                      handleInputChange(
                        "totalNutrition.fiber",
                        Number(e.target.value)
                      )
                    }
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 56,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Sugar (g)"
                    type="number"
                    value={formData.totalNutrition.sugar}
                    onChange={(e) =>
                      handleInputChange(
                        "totalNutrition.sugar",
                        Number(e.target.value)
                      )
                    }
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 56,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Sodium (mg)"
                    type="number"
                    value={formData.totalNutrition.sodium}
                    onChange={(e) =>
                      handleInputChange(
                        "totalNutrition.sodium",
                        Number(e.target.value)
                      )
                    }
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 56,
                      },
                    }}
                  />
                </Grid>
                <Grid item xs={6} md={3}>
                  <TextField
                    fullWidth
                    label="Cholesterol (mg)"
                    type="number"
                    value={formData.totalNutrition.cholesterol}
                    onChange={(e) =>
                      handleInputChange(
                        "totalNutrition.cholesterol",
                        Number(e.target.value)
                      )
                    }
                    InputProps={{ inputProps: { min: 0 } }}
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 56,
                      },
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>

            {/* Raw Ingredients Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mb: 2, mt: 3 }}>
                Ingredients
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Raw Ingredients"
                multiline
                rows={4}
                value={formData.rawIngredients}
                onChange={(e) =>
                  handleInputChange("rawIngredients", e.target.value)
                }
                helperText="List all raw ingredients for transparency and allergy information (e.g., Basmati Rice, vermicelli, Onion, Garlic, Butter, Salt, Carrot, Onion, Water, Celery, Chicken, Bay Leaf, Olive Oil, Cumin, Turmeric, Black Lemon, Whipping Cream, Okra, Yogurt, Cornflour, Coriander Powder, Lemon, Paprika, Chicken Breast, Lemon)"
                placeholder="Enter all raw ingredients separated by commas..."
              />
            </Grid>

            {/* Settings Section */}
            <Grid item xs={12}>
              <Box sx={{ mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Settings
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 4,
                    mt: 1, // small spacing between title and checkboxes
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isFeatured}
                        onChange={(e) =>
                          handleInputChange("isFeatured", e.target.checked)
                        }
                      />
                    }
                    label="Featured Meal"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.isActive}
                        onChange={(e) =>
                          handleInputChange("isActive", e.target.checked)
                        }
                      />
                    }
                    label="Active"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={formData.allowCustomization}
                        onChange={(e) =>
                          handleInputChange(
                            "allowCustomization",
                            e.target.checked
                          )
                        }
                      />
                    }
                    label="Allow Component Customization"
                  />
                </Box>
              </Box>
            </Grid>

            {/* Customizable Components Section */}
            {formData.allowCustomization && (
              <>
                <Grid item xs={12}>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="h6" gutterBottom>
                      Customizable Components
                    </Typography>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      Select which components customers can choose to remove.
                      Essential components should remain unchecked.
                    </Typography>

                    {formData.components && formData.components.length > 0 ? (
                      <Box
                        sx={{
                          border: 1,
                          borderColor: "grey.300",
                          borderRadius: 1,
                          p: 2,
                          bgcolor: "grey.50",
                        }}
                      >
                        <Grid container spacing={2}>
                          {formData.components.map((component, index) => (
                            <Grid
                              item
                              xs={12}
                              sm={6}
                              md={4}
                              key={component.componentId || index}
                            >
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={
                                      Array.isArray(
                                        formData.customizableComponents
                                      ) &&
                                      formData.customizableComponents.includes(
                                        component.componentId || `temp_${index}`
                                      )
                                    }
                                    onChange={(e) => {
                                      const componentId =
                                        component.componentId ||
                                        `temp_${index}`;
                                      const currentCustomizable = Array.isArray(
                                        formData.customizableComponents
                                      )
                                        ? formData.customizableComponents
                                        : [];

                                      if (e.target.checked) {
                                        handleInputChange(
                                          "customizableComponents",
                                          [...currentCustomizable, componentId]
                                        );
                                      } else {
                                        handleInputChange(
                                          "customizableComponents",
                                          currentCustomizable.filter(
                                            (id) => id !== componentId
                                          )
                                        );
                                      }
                                    }}
                                  />
                                }
                                label={component.name}
                                sx={{ width: "100%" }}
                              />
                            </Grid>
                          ))}
                        </Grid>
                      </Box>
                    ) : (
                      <Alert severity="info">
                        Add components to this meal first to enable
                        customization options.
                      </Alert>
                    )}
                  </Box>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 2 }}>
        <Button onClick={handleClose} variant="outlined" sx={{ minWidth: 120 }}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
          sx={{ minWidth: 120 }}
        >
          {mode === "add" ? "Add Meal" : "Update Meal"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
