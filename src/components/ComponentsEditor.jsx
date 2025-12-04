import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  AlertTitle,
  CircularProgress,
  Avatar,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  CloudUpload as CloudUploadIcon,
} from "@mui/icons-material";
import { uploadImage } from "../services/storage";
import { mealsService } from "../services/meals";

const UNITS = [
  { value: "g", label: "Grams" },
  { value: "kg", label: "Kilograms" },
  { value: "ml", label: "Milliliters" },
  { value: "l", label: "Liters" },
  { value: "cup", label: "Cup" },
  { value: "tbsp", label: "Tablespoon" },
  { value: "tsp", label: "Teaspoon" },
  { value: "piece", label: "Piece" },
  { value: "slice", label: "Slice" },
  { value: "serving", label: "Serving" },
];

export default function ComponentsEditor({
  open,
  onClose,
  meal,
  onMealUpdated,
}) {
  const [components, setComponents] = useState([]);
  const [componentDialogMode, setComponentDialogMode] = useState(null); // null, 'add', 'edit'
  const [currentComponent, setCurrentComponent] = useState(null);
  const [submittingComponent, setSubmittingComponent] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);
  const [error, setError] = useState("");

  const [componentFormData, setComponentFormData] = useState({
    name: "",
    quantity: 0,
    unit: "g",
    imageUrl: "",
    nutrition: {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      cholesterol: 0,
    },
  });

  const [componentFormErrors, setComponentFormErrors] = useState({});

  // Update components when meal changes
  React.useEffect(() => {
    if (meal) {
      setComponents(meal.components || []);
    }
  }, [meal]);

  const handleOpenComponentDialog = (mode = "add") => {
    setComponentDialogMode(mode);
    if (mode === "add") {
      setComponentFormData({
        name: "",
        quantity: 0,
        unit: "g",
        imageUrl: "",
        nutrition: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          cholesterol: 0,
        },
        isRequired: true,
        isOptional: false,
      });
      setCurrentComponent(null);
    }
    setComponentFormErrors({});
  };

  const handleEditComponent = (component) => {
    setCurrentComponent(component);
    setComponentFormData({
      name: component.name,
      quantity: component.quantity,
      unit: component.unit,
      imageUrl: component.imageUrl || "",
      nutrition: {
        calories: component.nutrition?.calories || 0,
        protein: component.nutrition?.protein || 0,
        carbs: component.nutrition?.carbs || 0,
        fat: component.nutrition?.fat || 0,
        fiber: component.nutrition?.fiber || 0,
        sugar: component.nutrition?.sugar || 0,
        sodium: component.nutrition?.sodium || 0,
        cholesterol: component.nutrition?.cholesterol || 0,
      },
    });
    setComponentDialogMode("edit");
    setComponentFormErrors({});
  };

  const handleCloseComponentDialog = () => {
    setComponentDialogMode(null);
    setCurrentComponent(null);
    setComponentFormData({
      name: "",
      quantity: 0,
      unit: "g",
      imageUrl: "",
      nutrition: {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        cholesterol: 0,
      },
    });
    setComponentFormErrors({});
  };

  const handleComponentFormChange = (field, value) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setComponentFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value,
        },
      }));
    } else {
      setComponentFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error when user starts typing
    if (componentFormErrors[field]) {
      setComponentFormErrors((prev) => ({
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
      const imageUrl = await uploadImage(file, "components");
      handleComponentFormChange("imageUrl", imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      setComponentFormErrors({
        general: "Failed to upload image. Please try again.",
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleSubmitComponent = async () => {
    try {
      setSubmittingComponent(true);
      setComponentFormErrors({});

      if (!componentFormData.name?.trim()) {
        setComponentFormErrors({ general: "Component name is required" });
        return;
      }

      if (componentFormData.quantity <= 0) {
        setComponentFormErrors({ general: "Quantity must be greater than 0" });
        return;
      }

      // Update meal with new/updated component
      const updatedComponents = [...components];

      if (componentDialogMode === "add") {
        // Add new component
        const newComponent = {
          ...componentFormData,
          componentId: Date.now().toString(), // Generate temporary ID
        };
        updatedComponents.push(newComponent);
      } else {
        // Update existing component
        const index = updatedComponents.findIndex(
          (c) => c.componentId === currentComponent.componentId
        );
        if (index !== -1) {
          updatedComponents[index] = {
            ...componentFormData,
            componentId: currentComponent.componentId,
          };
        }
      }

      // Calculate total nutrition from all components
      const totalNutrition = updatedComponents.reduce(
        (total, component) => ({
          calories: total.calories + (component.nutrition?.calories || 0),
          protein: total.protein + (component.nutrition?.protein || 0),
          carbs: total.carbs + (component.nutrition?.carbs || 0),
          fat: total.fat + (component.nutrition?.fat || 0),
          fiber: total.fiber + (component.nutrition?.fiber || 0),
          sugar: total.sugar + (component.nutrition?.sugar || 0),
          sodium: total.sodium + (component.nutrition?.sodium || 0),
          cholesterol:
            total.cholesterol + (component.nutrition?.cholesterol || 0),
        }),
        {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          sugar: 0,
          sodium: 0,
          cholesterol: 0,
        }
      );

      // Update the meal with new components and nutrition
      const updatedMeal = {
        ...meal,
        components: updatedComponents,
        totalNutrition,
      };

      await mealsService.update(meal.id, updatedMeal);
      setComponents(updatedComponents);
      await onMealUpdated(meal.id);
      handleCloseComponentDialog();
    } catch (error) {
      console.error("Error saving component:", error);
      setComponentFormErrors({
        general: "Failed to save component. Please try again.",
      });
    } finally {
      setSubmittingComponent(false);
    }
  };

  const handleDeleteComponent = async (componentId) => {
    if (!meal) return;

    if (window.confirm("Are you sure you want to delete this component?")) {
      try {
        const updatedComponents = components.filter(
          (c) => c.componentId !== componentId
        );

        // Recalculate total nutrition
        const totalNutrition = updatedComponents.reduce(
          (total, component) => ({
            calories: total.calories + (component.nutrition?.calories || 0),
            protein: total.protein + (component.nutrition?.protein || 0),
            carbs: total.carbs + (component.nutrition?.carbs || 0),
            fat: total.fat + (component.nutrition?.fat || 0),
            fiber: total.fiber + (component.nutrition?.fiber || 0),
            sugar: total.sugar + (component.nutrition?.sugar || 0),
            sodium: total.sodium + (component.nutrition?.sodium || 0),
            cholesterol:
              total.cholesterol + (component.nutrition?.cholesterol || 0),
          }),
          {
            calories: 0,
            protein: 0,
            carbs: 0,
            fat: 0,
            fiber: 0,
            sugar: 0,
            sodium: 0,
            cholesterol: 0,
          }
        );

        const updatedMeal = {
          ...meal,
          components: updatedComponents,
          totalNutrition,
        };

        await mealsService.update(meal.id, updatedMeal);
        setComponents(updatedComponents);
        await onMealUpdated(meal.id);
      } catch (error) {
        console.error("Error deleting component:", error);
        setError("Failed to delete component. Please try again.");
      }
    }
  };

  const renderComponentsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Image</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Quantity</TableCell>
            <TableCell>Unit</TableCell>
            <TableCell>Calories</TableCell>
            <TableCell>Protein</TableCell>
            <TableCell>Carbs</TableCell>
            <TableCell>Fat</TableCell>
            <TableCell>Customizable</TableCell>
            <TableCell>Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {components.map((component) => {
            // Component customization is determined by meal.customizableComponents array
            // instead of deprecated component.isOptional/isRequired flags
            const customizableComponents = Array.isArray(
              meal?.customizableComponents
            )
              ? meal.customizableComponents
              : [];
            const isCustomizable = customizableComponents.includes(
              component.componentId
            );
            return (
              <TableRow key={component.componentId}>
                <TableCell>
                  <Avatar
                    src={component.imageUrl || "/api/placeholder/40/40"}
                    alt={component.name}
                    sx={{ width: 40, height: 40 }}
                  />
                </TableCell>
                <TableCell>{component.name}</TableCell>
                <TableCell>{component.quantity}</TableCell>
                <TableCell>{component.unit}</TableCell>
                <TableCell>{component.nutrition?.calories || 0}</TableCell>
                <TableCell>{component.nutrition?.protein || 0}g</TableCell>
                <TableCell>{component.nutrition?.carbs || 0}g</TableCell>
                <TableCell>{component.nutrition?.fat || 0}g</TableCell>
                <TableCell>
                  {meal?.allowCustomization ? (
                    isCustomizable ? (
                      <Chip label="Optional" color="warning" size="small" />
                    ) : (
                      <Chip label="Required" color="default" size="small" />
                    )
                  ) : (
                    <Chip label="Fixed" color="default" size="small" />
                  )}
                </TableCell>
                <TableCell>
                  <IconButton
                    size="small"
                    onClick={() => handleEditComponent(component)}
                    color="primary"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteComponent(component.componentId)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
        <DialogTitle>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            Meal Components: {meal?.title}
            <IconButton onClick={onClose}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              <AlertTitle>Error</AlertTitle>
              {error}
            </Alert>
          )}

          <Box sx={{ mb: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 2,
              }}
            >
              <Typography variant="h6">
                Components ({components.length})
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenComponentDialog("add")}
              >
                Add Component
              </Button>
            </Box>

            {components.length === 0 ? (
              <Alert severity="info">
                No components added yet. Add components to build your meal.
              </Alert>
            ) : (
              renderComponentsTable()
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Component Form Dialog */}
      <Dialog
        open={componentDialogMode !== null}
        onClose={handleCloseComponentDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {componentDialogMode === "add" ? "Add Component" : "Edit Component"}
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {componentFormErrors.general && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {componentFormErrors.general}
              </Alert>
            )}

            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Component Name"
                  value={componentFormData.name}
                  onChange={(e) =>
                    handleComponentFormChange("name", e.target.value)
                  }
                  error={!!componentFormErrors.name}
                  helperText={componentFormErrors.name}
                  required
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <TextField
                  fullWidth
                  label="Quantity"
                  type="number"
                  value={componentFormData.quantity}
                  onChange={(e) =>
                    handleComponentFormChange(
                      "quantity",
                      Number(e.target.value)
                    )
                  }
                  InputProps={{ inputProps: { min: 0 } }}
                  required
                />
              </Grid>

              <Grid item xs={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>Unit</InputLabel>
                  <Select
                    value={componentFormData.unit}
                    label="Unit"
                    onChange={(e) =>
                      handleComponentFormChange("unit", e.target.value)
                    }
                  >
                    {UNITS.map((unit) => (
                      <MenuItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
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
                    fullWidth
                  >
                    Upload Component Image
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={handleImageUpload}
                    />
                  </Button>
                  {componentFormData.imageUrl && (
                    <Avatar
                      src={componentFormData.imageUrl}
                      alt="Component"
                      sx={{ width: 40, height: 40 }}
                    />
                  )}
                </Box>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Nutrition Information
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Calories"
                      type="number"
                      value={componentFormData.nutrition.calories}
                      onChange={(e) =>
                        handleComponentFormChange(
                          "nutrition.calories",
                          Number(e.target.value)
                        )
                      }
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Protein (g)"
                      type="number"
                      value={componentFormData.nutrition.protein}
                      onChange={(e) =>
                        handleComponentFormChange(
                          "nutrition.protein",
                          Number(e.target.value)
                        )
                      }
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Carbs (g)"
                      type="number"
                      value={componentFormData.nutrition.carbs}
                      onChange={(e) =>
                        handleComponentFormChange(
                          "nutrition.carbs",
                          Number(e.target.value)
                        )
                      }
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Fat (g)"
                      type="number"
                      value={componentFormData.nutrition.fat}
                      onChange={(e) =>
                        handleComponentFormChange(
                          "nutrition.fat",
                          Number(e.target.value)
                        )
                      }
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Fiber (g)"
                      type="number"
                      value={componentFormData.nutrition.fiber}
                      onChange={(e) =>
                        handleComponentFormChange(
                          "nutrition.fiber",
                          Number(e.target.value)
                        )
                      }
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Sugar (g)"
                      type="number"
                      value={componentFormData.nutrition.sugar}
                      onChange={(e) =>
                        handleComponentFormChange(
                          "nutrition.sugar",
                          Number(e.target.value)
                        )
                      }
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Sodium (mg)"
                      type="number"
                      value={componentFormData.nutrition.sodium}
                      onChange={(e) =>
                        handleComponentFormChange(
                          "nutrition.sodium",
                          Number(e.target.value)
                        )
                      }
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={6} md={3}>
                    <TextField
                      fullWidth
                      label="Cholesterol (mg)"
                      type="number"
                      value={componentFormData.nutrition.cholesterol}
                      onChange={(e) =>
                        handleComponentFormChange(
                          "nutrition.cholesterol",
                          Number(e.target.value)
                        )
                      }
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                </Grid>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={handleCloseComponentDialog}>Cancel</Button>
          <Button
            onClick={handleSubmitComponent}
            variant="contained"
            disabled={submittingComponent}
            startIcon={
              submittingComponent ? <CircularProgress size={20} /> : null
            }
          >
            {componentDialogMode === "add"
              ? "Add Component"
              : "Update Component"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
