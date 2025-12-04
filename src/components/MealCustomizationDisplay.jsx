import React from "react";
import {
  Box,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
} from "@mui/material";
import {
  ExpandMore as ExpandMoreIcon,
  RemoveCircleOutline as RemoveIcon,
  Warning as WarningIcon,
  Restaurant as RestaurantIcon,
  CheckCircle as CheckCircleIcon,
} from "@mui/icons-material";

/**
 * Component to display customer meal customizations in the todays and tommorows orders
 * Shows which components were removed/excluded and which allergies were excluded
 */
const MealCustomizationDisplay = ({
  dailySelection,
  allergies = [],
  componentNames = {},
}) => {
  if (!dailySelection || !dailySelection.meals) {
    return null;
  }

  // Check if any meal has customizations (using isCustomized flag or legacy structures)
  const hasCustomizations = Object.values(dailySelection.meals).some(
    (meals) =>
      meals &&
      meals.some(
        (meal) =>
          meal.isCustomized || // New structure
          (meal.removedComponents && meal.removedComponents.length > 0) || // Legacy structure
          (meal.removedAllergies && meal.removedAllergies.length > 0) // Both legacy and new structure
      )
  );

  if (!hasCustomizations) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          ✅ No customizations - all meals served as standard
        </Typography>
      </Alert>
    );
  }

  // Helper function to get allergy name by ID
  const getAllergyName = (allergyId) => {
    const allergy = allergies.find((a) => a.id === allergyId);
    return allergy ? `${allergy.icon} ${allergy.name}` : allergyId;
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Alert severity="warning" sx={{ mb: 2 }}>
        <Typography variant="body2" fontWeight="bold">
          ⚠️ CUSTOMIZATIONS REQUESTED - Please review before preparation
        </Typography>
      </Alert>

      {Object.entries(dailySelection.meals).map(([mealType, meals]) => {
        const mealsWithCustomizations = meals.filter(
          (meal) =>
            meal.isCustomized || // New structure
            (meal.removedComponents && meal.removedComponents.length > 0) || // Legacy structure
            (meal.removedAllergies && meal.removedAllergies.length > 0) // Both legacy and new structure
        );

        if (mealsWithCustomizations.length === 0) {
          return null;
        }

        return (
          <Accordion key={mealType} sx={{ mb: 1 }}>
            <AccordionSummary
              expandIcon={<ExpandMoreIcon />}
              sx={{ backgroundColor: "#fff3cd" }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <WarningIcon color="warning" fontSize="small" />
                <Typography variant="subtitle2" fontWeight="bold">
                  {mealType.toUpperCase()} - Customizations Required
                </Typography>
                <Chip
                  label={`${mealsWithCustomizations.length} meal(s)`}
                  size="small"
                  color="warning"
                />
              </Box>
            </AccordionSummary>

            <AccordionDetails>
              {mealsWithCustomizations.map((meal, index) => (
                <Paper
                  key={index}
                  sx={{ p: 2, mb: 2, backgroundColor: "#fafafa" }}
                >
                  <Typography
                    variant="h6"
                    gutterBottom
                    sx={{ display: "flex", alignItems: "center", gap: 1 }}
                  >
                    <RestaurantIcon fontSize="small" />
                    {meal.selectedMealTitle || "Unknown Meal"}
                    {meal.isCustomized && (
                      <Chip
                        label="CUSTOMIZED"
                        size="small"
                        color="warning"
                        sx={{ ml: 1 }}
                      />
                    )}
                  </Typography>

                  {/* New Structure: Customized Components */}
                  {meal.isCustomized &&
                    meal.customizedComponents &&
                    meal.customizedComponents.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        {(() => {
                          const excludedComponents =
                            meal.customizedComponents.filter(
                              (comp) => !comp.isIncluded
                            );
                          const includedComponents =
                            meal.customizedComponents.filter(
                              (comp) => comp.isIncluded
                            );

                          return (
                            <>
                              {excludedComponents.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography
                                    variant="subtitle2"
                                    color="error"
                                    gutterBottom
                                  >
                                    🚫 EXCLUDE THESE COMPONENTS:
                                  </Typography>
                                  <List dense>
                                    {excludedComponents.map(
                                      (component, idx) => (
                                        <ListItem key={idx} sx={{ pl: 0 }}>
                                          <ListItemIcon sx={{ minWidth: 32 }}>
                                            <RemoveIcon
                                              color="error"
                                              fontSize="small"
                                            />
                                          </ListItemIcon>
                                          <ListItemText
                                            primary={
                                              component.componentName ||
                                              componentNames[
                                                meal.selectedMealId
                                              ]?.[component.componentId] ||
                                              component.componentId
                                            }
                                            primaryTypographyProps={{
                                              fontWeight: "bold",
                                              color: "error.main",
                                            }}
                                          />
                                        </ListItem>
                                      )
                                    )}
                                  </List>
                                </Box>
                              )}

                              {includedComponents.length > 0 && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography
                                    variant="subtitle2"
                                    color="success.main"
                                    gutterBottom
                                  >
                                    ✅ INCLUDE THESE COMPONENTS:
                                  </Typography>
                                  <List dense>
                                    {includedComponents.map(
                                      (component, idx) => (
                                        <ListItem key={idx} sx={{ pl: 0 }}>
                                          <ListItemIcon sx={{ minWidth: 32 }}>
                                            <CheckCircleIcon
                                              color="success"
                                              fontSize="small"
                                            />
                                          </ListItemIcon>
                                          <ListItemText
                                            primary={
                                              component.componentName ||
                                              componentNames[
                                                meal.selectedMealId
                                              ]?.[component.componentId] ||
                                              component.componentId
                                            }
                                            primaryTypographyProps={{
                                              fontWeight: "bold",
                                              color: "success.main",
                                            }}
                                          />
                                        </ListItem>
                                      )
                                    )}
                                  </List>
                                </Box>
                              )}
                            </>
                          );
                        })()}
                      </Box>
                    )}

                  {/* Legacy Structure: Removed Components */}
                  {meal.removedComponents &&
                    meal.removedComponents.length > 0 && (
                      <Box sx={{ mb: 2 }}>
                        <Typography
                          variant="subtitle2"
                          color="error"
                          gutterBottom
                        >
                          🚫 REMOVE THESE COMPONENTS:
                        </Typography>
                        <List dense>
                          {meal.removedComponents.map((componentId, idx) => (
                            <ListItem key={idx} sx={{ pl: 0 }}>
                              <ListItemIcon sx={{ minWidth: 32 }}>
                                <RemoveIcon color="error" fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={
                                  componentNames[meal.selectedMealId]?.[
                                    componentId
                                  ] || componentId
                                }
                                primaryTypographyProps={{
                                  fontWeight: "bold",
                                  color: "error.main",
                                }}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}

                  {/* New Structure: Removed Allergies (detailed objects) */}
                  {meal.removedAllergies &&
                    meal.removedAllergies.length > 0 && (
                      <Box sx={{ mb: 1 }}>
                        <Typography
                          variant="subtitle2"
                          color="success.main"
                          gutterBottom
                        >
                          ✅ ALLERGIES SAFELY REMOVED:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                          {meal.removedAllergies.map((removedAllergy, idx) => {
                            // Handle new structure (object with allergyId, name, icon)
                            if (
                              typeof removedAllergy === "object" &&
                              removedAllergy.allergyId
                            ) {
                              return (
                                <Chip
                                  key={idx}
                                  label={`${removedAllergy.icon || ""}${
                                    removedAllergy.name ||
                                    removedAllergy.allergyId
                                  }`}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  icon={<CheckCircleIcon />}
                                />
                              );
                            }
                            // Handle legacy structure (just allergy ID)
                            else {
                              return (
                                <Chip
                                  key={idx}
                                  label={getAllergyName(removedAllergy)}
                                  size="small"
                                  color="success"
                                  variant="outlined"
                                  icon={<CheckCircleIcon />}
                                />
                              );
                            }
                          })}
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mt: 1, display: "block" }}
                        >
                          Customer removed these allergies to make this meal
                          safe for consumption
                        </Typography>
                      </Box>
                    )}

                  {/* Preparation Instructions */}
                  <Alert severity="info" sx={{ mt: 2 }}>
                    <Typography variant="caption">
                      <strong>Kitchen Instructions:</strong>
                      {meal.isCustomized &&
                        meal.customizedComponents &&
                        meal.customizedComponents.length > 0 && (
                          <>
                            {" "}
                            Follow the component inclusion/exclusion
                            instructions above.
                          </>
                        )}
                      {meal.removedComponents &&
                        meal.removedComponents.length > 0 && (
                          <>
                            {" "}
                            Exclude the components listed above from this meal.
                          </>
                        )}
                      {meal.removedAllergies &&
                        meal.removedAllergies.length > 0 && (
                          <>
                            {" "}
                            This customization makes the meal safe for the
                            customer's allergies.
                          </>
                        )}
                    </Typography>
                  </Alert>
                </Paper>
              ))}
            </AccordionDetails>
          </Accordion>
        );
      })}
    </Box>
  );
};

export default MealCustomizationDisplay;
