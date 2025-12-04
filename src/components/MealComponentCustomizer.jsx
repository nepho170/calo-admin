import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Checkbox,
  FormControlLabel,
  Grid,
  Chip,
  Paper,
  Divider,
  Avatar,
} from "@mui/material";
import { Lock as LockIcon } from "@mui/icons-material";

export default function MealComponentCustomizer({
  meal,
  onComponentsChange,
  showNutrition = true,
}) {
  const [selectedComponents, setSelectedComponents] = useState([]);

  // Initialize with all components selected
  useEffect(() => {
    if (meal?.components) {
      const allComponentIds = meal.components.map(
        (comp, index) => comp.componentId || `temp_${index}`
      );
      setSelectedComponents(allComponentIds);
      onComponentsChange?.(allComponentIds);
    }
  }, [meal]);

  const handleComponentToggle = (componentId) => {
    const customizableComponents = Array.isArray(meal?.customizableComponents)
      ? meal.customizableComponents
      : [];

    // Only allow toggling if component is customizable
    if (!customizableComponents.includes(componentId)) {
      return;
    }

    const newSelected = selectedComponents.includes(componentId)
      ? selectedComponents.filter((id) => id !== componentId)
      : [...selectedComponents, componentId];

    setSelectedComponents(newSelected);
    onComponentsChange?.(newSelected);
  };

  const calculateTotalNutrition = () => {
    if (!meal?.components) return null;

    return meal.components
      .filter((comp, index) => {
        const componentId = comp.componentId || `temp_${index}`;
        return selectedComponents.includes(componentId);
      })
      .reduce(
        (total, comp) => ({
          calories: total.calories + (comp.nutrition?.calories || 0),
          protein: total.protein + (comp.nutrition?.protein || 0),
          carbs: total.carbs + (comp.nutrition?.carbs || 0),
          fat: total.fat + (comp.nutrition?.fat || 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fat: 0 }
      );
  };

  if (!meal?.allowCustomization) {
    return (
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          {meal?.title}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          This meal has a fixed composition and cannot be customized.
        </Typography>
        {meal?.components && (
          <Grid container spacing={2}>
            {meal.components.map((component, index) => (
              <Grid
                item
                xs={12}
                sm={6}
                md={4}
                key={component.componentId || index}
              >
                <Card sx={{ height: "100%" }}>
                  {component.imageUrl && (
                    <CardMedia
                      component="img"
                      height="120"
                      image={component.imageUrl}
                      alt={component.name}
                    />
                  )}
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      {component.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {component.quantity} {component.unit}
                    </Typography>
                    {showNutrition && (
                      <Box sx={{ mt: 1 }}>
                        <Typography variant="caption" display="block">
                          {component.nutrition?.calories || 0} kcal
                        </Typography>
                        <Typography variant="caption" display="block">
                          {component.nutrition?.protein || 0}g Pro •{" "}
                          {component.nutrition?.carbs || 0}g Carb •{" "}
                          {component.nutrition?.fat || 0}g Fat
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>
    );
  }

  const totalNutrition = calculateTotalNutrition();
  const customizableComponents = Array.isArray(meal?.customizableComponents)
    ? meal.customizableComponents
    : [];

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom>
        Customize Your Meal: {meal?.title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Select the components you'd like to include in your meal. Some
        components are required and cannot be removed.
      </Typography>

      <Grid container spacing={2}>
        {meal?.components?.map((component, index) => {
          const componentId = component.componentId || `temp_${index}`;
          const isCustomizable = customizableComponents.includes(componentId);
          const isSelected = selectedComponents.includes(componentId);

          return (
            <Grid item xs={12} sm={6} md={4} key={componentId}>
              <Card
                sx={{
                  height: "100%",
                  border: isSelected ? 2 : 1,
                  borderColor: isSelected ? "primary.main" : "divider",
                  opacity: isSelected ? 1 : 0.7,
                  transition: "all 0.2s",
                }}
              >
                {component.imageUrl && (
                  <CardMedia
                    component="img"
                    height="120"
                    image={component.imageUrl}
                    alt={component.name}
                  />
                )}
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                    {isCustomizable ? (
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleComponentToggle(componentId)}
                            color="primary"
                          />
                        }
                        label=""
                        sx={{ mr: 0 }}
                      />
                    ) : (
                      <Avatar sx={{ width: 24, height: 24, mr: 1 }}>
                        <LockIcon sx={{ fontSize: 16 }} />
                      </Avatar>
                    )}
                    <Typography variant="subtitle1" sx={{ flex: 1 }}>
                      {component.name}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 1 }}>
                    <Chip
                      label={isCustomizable ? "Optional" : "Required"}
                      size="small"
                      color={isCustomizable ? "warning" : "default"}
                      variant="outlined"
                    />
                  </Box>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 1 }}
                  >
                    {component.quantity} {component.unit}
                  </Typography>

                  {showNutrition && (
                    <Box>
                      <Typography
                        variant="caption"
                        display="block"
                        sx={{ fontWeight: "bold" }}
                      >
                        {component.nutrition?.calories || 0} kcal
                      </Typography>
                      <Typography
                        variant="caption"
                        display="block"
                        color="text.secondary"
                      >
                        {component.nutrition?.protein || 0}g Pro •{" "}
                        {component.nutrition?.carbs || 0}g Carb •{" "}
                        {component.nutrition?.fat || 0}g Fat
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {showNutrition && totalNutrition && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>
            Total Nutrition
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: "primary.light",
                  color: "primary.contrastText",
                }}
              >
                <Typography variant="h5">
                  {Math.round(totalNutrition.calories)}
                </Typography>
                <Typography variant="caption">Calories</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: "success.light",
                  color: "success.contrastText",
                }}
              >
                <Typography variant="h5">
                  {Math.round(totalNutrition.protein)}g
                </Typography>
                <Typography variant="caption">Protein</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: "warning.light",
                  color: "warning.contrastText",
                }}
              >
                <Typography variant="h5">
                  {Math.round(totalNutrition.carbs)}g
                </Typography>
                <Typography variant="caption">Carbs</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Paper
                sx={{
                  p: 2,
                  textAlign: "center",
                  bgcolor: "error.light",
                  color: "error.contrastText",
                }}
              >
                <Typography variant="h5">
                  {Math.round(totalNutrition.fat)}g
                </Typography>
                <Typography variant="caption">Fat</Typography>
              </Paper>
            </Grid>
          </Grid>
        </>
      )}
    </Paper>
  );
}
