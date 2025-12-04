import React from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { Star as StarIcon } from "@mui/icons-material";
import MealComponentCustomizer from "./MealComponentCustomizer";

const MEAL_TYPES = [
  { value: "breakfast", label: "Breakfast" },
  { value: "lunch", label: "Lunch" },
  { value: "dinner", label: "Dinner" },
  { value: "snack", label: "Snack" },
];

const MealPreview = ({
  meal,
  allergies = [],
  showCustomizationPreview = true,
}) => {
  if (!meal) return null;

  return (
    <Box sx={{ pt: 2 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box
            sx={{
              width: "100%",
              height: 300,
              borderRadius: 2,
              overflow: "hidden",
              backgroundColor: "#f0f0f0", // fallback bg
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={meal.imageUrl || "/api/placeholder/400/300"}
              alt={meal.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" gutterBottom>
            Description
          </Typography>
          <Typography variant="body1" paragraph>
            {meal.description}
          </Typography>

          <Box sx={{ display: "flex", gap: 1, mb: 2, flexWrap: "wrap" }}>
            <Chip
              label={
                MEAL_TYPES.find((t) => t.value === meal.type)?.label ||
                meal.type
              }
              color="primary"
            />
            {meal.isFeatured && (
              <Chip label="Featured" color="warning" icon={<StarIcon />} />
            )}
            {meal.allowCustomization && (
              <Chip
                label="Customizable Components"
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>

          {meal.allowCustomization && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Customization:</strong> Customers can choose to remove
                optional components from this meal.
              </Typography>
            </Box>
          )}
        </Grid>

        {/* Labels, Allergies */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            {/* Labels */}
            {meal.labels && meal.labels.length > 0 && (
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Labels
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {meal.labels.map((labelId, index) => (
                    <Chip
                      key={labelId || index}
                      label={labelId}
                      color="primary"
                      variant="outlined"
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            )}

            {/* Allergies */}
            {meal.allergies && meal.allergies.length > 0 && (
              <Grid item xs={12} md={4}>
                <Typography variant="h6" gutterBottom>
                  Allergies
                </Typography>
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                  {meal.allergies.map((allergyId, index) => {
                    const isRemovable =
                      meal.removableAllergies &&
                      meal.removableAllergies.includes(allergyId);

                    // Find the allergy data to get the name
                    const allergyData = allergies.find(
                      (a) => a.id === allergyId
                    );
                    const allergyName = allergyData?.name || allergyId;

                    return (
                      <Chip
                        key={allergyId || index}
                        label={`${allergyName}${
                          isRemovable ? " (Removable)" : ""
                        }`}
                        color={isRemovable ? "warning" : "error"}
                        variant={isRemovable ? "outlined" : "filled"}
                        size="small"
                      />
                    );
                  })}
                </Box>
                {meal.removableAllergies &&
                  meal.removableAllergies.length > 0 && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ mt: 1, display: "block" }}
                    ></Typography>
                  )}
              </Grid>
            )}
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Nutrition Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6" color="primary">
                  {meal.totalNutrition?.calories || 0}
                </Typography>
                <Typography variant="body2">Calories</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6" color="primary">
                  {meal.totalNutrition?.protein || 0}g
                </Typography>
                <Typography variant="body2">Protein</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6" color="primary">
                  {meal.totalNutrition?.carbs || 0}g
                </Typography>
                <Typography variant="body2">Carbs</Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} md={3}>
              <Paper sx={{ p: 2, textAlign: "center" }}>
                <Typography variant="h6" color="primary">
                  {meal.totalNutrition?.fat || 0}g
                </Typography>
                <Typography variant="body2">Fat</Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        <Grid item xs={12}>
          <Typography variant="h6" gutterBottom>
            Raw Ingredients
          </Typography>
          {meal.rawIngredients ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="body1">{meal.rawIngredients}</Typography>
            </Paper>
          ) : (
            <Alert severity="info">
              No raw ingredients listed for this meal yet.
            </Alert>
          )}
        </Grid>

        <Grid item xs={12} sx={{ width: "100%" }}>
          <Typography variant="h6" gutterBottom>
            Meal Components ({meal.components?.length || 0})
          </Typography>
          {meal.components?.length > 0 ? (
            <TableContainer component={Paper} sx={{ width: "100%" }}>
              <Table sx={{ width: "100%" }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Quantity</TableCell>
                    <TableCell>Unit</TableCell>
                    <TableCell>Calories</TableCell>
                    <TableCell>Protein</TableCell>
                    <TableCell>Carbs</TableCell>
                    <TableCell>Fat</TableCell>
                    <TableCell>Customizable</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {meal.components.map((component, index) => {
                    const componentId =
                      component.componentId || `temp_${index}`;
                    const customizableComponents = Array.isArray(
                      meal?.customizableComponents
                    )
                      ? meal.customizableComponents
                      : [];
                    const isCustomizable =
                      meal.allowCustomization &&
                      customizableComponents.includes(componentId);

                    return (
                      <TableRow key={componentId}>
                        <TableCell>{component.name}</TableCell>
                        <TableCell>{component.quantity}</TableCell>
                        <TableCell>{component.unit}</TableCell>
                        <TableCell>
                          {component.nutrition?.calories || 0}
                        </TableCell>
                        <TableCell>
                          {component.nutrition?.protein || 0}g
                        </TableCell>
                        <TableCell>
                          {component.nutrition?.carbs || 0}g
                        </TableCell>
                        <TableCell>{component.nutrition?.fat || 0}g</TableCell>
                        <TableCell>
                          {meal.allowCustomization ? (
                            isCustomizable ? (
                              <Chip
                                label="Optional"
                                color="warning"
                                size="small"
                              />
                            ) : (
                              <Chip
                                label="Required"
                                color="default"
                                size="small"
                              />
                            )
                          ) : (
                            <Chip label="Fixed" color="default" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No components added to this meal yet.</Alert>
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default MealPreview;
