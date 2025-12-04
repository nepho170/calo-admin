import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  RestaurantMenu as RestaurantMenuIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Visibility as VisibilityIcon,
} from "@mui/icons-material";
import MealEditor from "../components/MealEditor";
import ComponentsEditor from "../components/ComponentsEditor";
import MealComponentCustomizer from "../components/MealComponentCustomizer";
import MealPreview from "../components/MealPreview";

import { labelsService } from "../services/labels";
import { allergiesService } from "../services/allergies";
import { mealsService, mealValidation } from "../services/meals";

import { uploadImage } from "../services/storage";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

export default function Meals() {
  const [meals, setMeals] = useState([]);
  const [filteredMeals, setFilteredMeals] = useState([]);
  const [labels, setLabels] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [activeTab, setActiveTab] = useState(0);

  // Dialog states
  const [mealEditorOpen, setMealEditorOpen] = useState(false);
  const [mealEditorMode, setMealEditorMode] = useState("add"); // 'add' or 'edit'
  const [currentMeal, setCurrentMeal] = useState(null);
  const [viewMealDialog, setViewMealDialog] = useState(false);
  const [componentsEditorOpen, setComponentsEditorOpen] = useState(false);

  // Load data on component mount
  useEffect(() => {
    loadData();
  }, []);

  // Filter meals when search term or type filter changes
  useEffect(() => {
    filterMeals();
  }, [meals, searchTerm, typeFilter]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [mealsData, labelsData, allergiesData] = await Promise.all([
        mealsService.getAllIncludingInactive(),
        labelsService.getAll(),
        allergiesService.getActive(),
      ]);

      setMeals(mealsData);
      setLabels(labelsData);
      setAllergies(allergiesData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterMeals = () => {
    let filtered = meals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (meal) =>
          meal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          meal.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((meal) => meal.type === typeFilter);
    }

    // Filter by active status based on tab
    if (activeTab === 0) {
      filtered = filtered.filter((meal) => meal.isActive);
    } else if (activeTab === 1) {
      filtered = filtered.filter((meal) => meal.isFeatured && meal.isActive);
    }

    setFilteredMeals(filtered);
  };

  const handleOpenMealEditor = (mode, meal = null) => {
    setMealEditorMode(mode);
    setCurrentMeal(meal);
    setMealEditorOpen(true);
  };

  const handleCloseMealEditor = () => {
    setMealEditorOpen(false);
    setCurrentMeal(null);
  };

  const handleMealSubmit = async (formData) => {
    try {
      let result;
      if (mealEditorMode === "add") {
        result = await mealsService.add(formData, "admin");
      } else {
        result = await mealsService.update(currentMeal.id, formData);
      }

      if (result) {
        await loadData();
        handleCloseMealEditor();
      }
    } catch (error) {
      console.error("Error saving meal:", error);
      throw error; // Re-throw to let the editor handle it
    }
  };

  const handleDelete = async (mealId) => {
    if (window.confirm("Are you sure you want to delete this meal?")) {
      try {
        await mealsService.delete(mealId);
        await loadData();
      } catch (error) {
        console.error("Error deleting meal:", error);
        setError("Failed to delete meal. Please try again.");
      }
    }
  };

  const handleToggleFeatured = async (mealId, isFeatured) => {
    try {
      await mealsService.toggleFeatured(mealId, !isFeatured);
      await loadData();
    } catch (error) {
      console.error("Error toggling featured status:", error);
      setError("Failed to update featured status. Please try again.");
    }
  };

  const handleViewMeal = async (meal) => {
    setCurrentMeal(meal);
    setViewMealDialog(true);
  };

  const handleManageComponents = async (meal) => {
    setCurrentMeal(meal);
    setComponentsEditorOpen(true);
  };

  const handleMealUpdated = async (mealId) => {
    try {
      // Reload the specific meal and update it in the state
      const updatedMeal = await mealsService.getById(mealId);
      setCurrentMeal(updatedMeal);

      // Update the meal in the meals list
      setMeals((prevMeals) =>
        prevMeals.map((meal) =>
          meal.id === updatedMeal.id ? updatedMeal : meal
        )
      );
    } catch (error) {
      console.error("Error updating meal:", error);
      setError("Failed to update meal. Please try again.");
    }
  };

  const renderMealCard = (meal) => (
    <Card
      key={meal.id}
      sx={{
        width: 360,
        mx: "auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardMedia
        component="img"
        height="200"
        image={meal.imageUrl || "/images/no-image.png"} // Fallback image
        alt={meal.title}
        sx={{ objectFit: "cover" }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography variant="h6" component="h2" sx={{ fontWeight: "bold" }}>
            {meal.title}
          </Typography>
          <IconButton
            size="small"
            onClick={() => handleToggleFeatured(meal.id, meal.isFeatured)}
            color={meal.isFeatured ? "warning" : "default"}
          >
            {meal.isFeatured ? <StarIcon /> : <StarBorderIcon />}
          </IconButton>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {meal.description.length > 100
            ? `${meal.description.substring(0, 100)}...`
            : meal.description}
        </Typography>

        <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
          <Chip
            label={
              MEAL_TYPES.find((t) => t.value === meal.type)?.label || meal.type
            }
            size="small"
            color="primary"
          />
          {meal.allowCustomization && (
            <Chip
              label="Customizable"
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            mb: 2,
          }}
        >
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Calories
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {meal.totalNutrition?.calories || 0}
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Protein
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {meal.totalNutrition?.protein || 0}g
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Carbs
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {meal.totalNutrition?.carbs || 0}g
            </Typography>
          </Box>
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Fat
            </Typography>
            <Typography variant="body2" fontWeight="bold">
              {meal.totalNutrition?.fat || 0}g
            </Typography>
          </Box>
        </Box>

        {/* Allergies Section */}
        {meal.allergies && meal.allergies.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Allergies:
            </Typography>
            <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap" }}>
              {meal.allergies.map((allergyId) => {
                const isRemovable =
                  meal.removableAllergies &&
                  meal.removableAllergies.includes(allergyId);
                const allergyData = allergies.find((a) => a.id === allergyId);
                const allergyName = allergyData?.name || allergyId;

                return (
                  <Chip
                    key={allergyId}
                    label={isRemovable ? `${allergyName} (R)` : allergyName}
                    size="small"
                    color={isRemovable ? "warning" : "error"}
                    variant={isRemovable ? "outlined" : "filled"}
                    sx={{ fontSize: "0.7rem" }}
                  />
                );
              })}
            </Box>
            {meal.removableAllergies && meal.removableAllergies.length > 0 && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ mt: 0.5, display: "block" }}
              >
                (R) = Removable by customers
              </Typography>
            )}
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Box>
          <IconButton onClick={() => handleViewMeal(meal)} color="primary">
            <VisibilityIcon />
          </IconButton>
          <IconButton
            onClick={() => handleManageComponents(meal)}
            color="secondary"
          >
            <RestaurantMenuIcon />
          </IconButton>
        </Box>
        <Box>
          <IconButton
            onClick={() => handleOpenMealEditor("edit", meal)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(meal.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  const renderViewMealDialog = () => (
    <Dialog
      open={viewMealDialog}
      onClose={() => setViewMealDialog(false)}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          {currentMeal?.title}
          <IconButton onClick={() => setViewMealDialog(false)}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <MealPreview
          meal={currentMeal}
          allergies={allergies}
          showCustomizationPreview={true}
        />
      </DialogContent>
    </Dialog>
  );

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
            Meals Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage meals with ingredients and nutritional
            information.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenMealEditor("add")}
          size="large"
        >
          Add New Meal
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab
            label={`All Meals (${meals.filter((m) => m.isActive).length})`}
          />
          <Tab
            label={`Featured (${
              meals.filter((m) => m.isFeatured && m.isActive).length
            })`}
          />
          <Tab
            label={`Inactive (${meals.filter((m) => !m.isActive).length})`}
          />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="Search meals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <FormControl fullWidth>
              <InputLabel>Filter by Type</InputLabel>
              <Select
                value={typeFilter}
                label="Filter by Type"
                onChange={(e) => setTypeFilter(e.target.value)}
                startAdornment={
                  <FilterListIcon color="action" sx={{ mr: 1 }} />
                }
              >
                <MenuItem value="all">All Types</MenuItem>
                {MEAL_TYPES.map((type) => (
                  <MenuItem key={type.value} value={type.value}>
                    {type.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={5}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredMeals.length} of {meals.length} meals
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Meals Grid */}
      <Grid container spacing={3} justifyContent="center">
        {filteredMeals.map((meal) => (
          <Grid item xs={12} sm={6} md={6} key={meal.id}>
            {renderMealCard(meal)}
          </Grid>
        ))}
      </Grid>

      {filteredMeals.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No meals found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || typeFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : "Get started by adding your first meal."}
          </Typography>
        </Paper>
      )}

      {/* Dialogs */}
      <MealEditor
        open={mealEditorOpen}
        onClose={handleCloseMealEditor}
        mode={mealEditorMode}
        meal={currentMeal}
        labels={labels}
        allergies={allergies}
        onSubmit={handleMealSubmit}
      />

      {renderViewMealDialog()}

      <ComponentsEditor
        open={componentsEditorOpen}
        onClose={() => setComponentsEditorOpen(false)}
        meal={currentMeal}
        onMealUpdated={handleMealUpdated}
      />
    </Box>
  );
}
