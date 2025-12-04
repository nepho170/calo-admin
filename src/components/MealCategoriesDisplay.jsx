import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Grid,
  Card,
  CardContent,
} from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  LocalDining as LocalDiningIcon,
} from "@mui/icons-material";

/**
 * Component to organize and display meal selections by categories
 * Separates into: Standard, Customized, Allergy-specific, and Complex meals
 */
const MealCategoriesDisplay = ({ orders, allergyNames, componentNames }) => {
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  // Organize orders into categories
  const organizeOrders = () => {
    const categories = {
      standard: [], // No customizations, no allergies
      customized: [], // Has customizations, no allergies
      allergies: [], // Has allergies, no customizations
      complex: [], // Has both customizations and allergies
    };

    orders.forEach((order) => {
      if (!order.dailySelection || !order.dailySelection.meals) return;

      const hasCustomizations = Object.values(order.dailySelection.meals).some(
        (meals) => meals.some((meal) => meal.isCustomized)
      );
      const hasAllergies = order.allergies && order.allergies.length > 0;

      // Extract all meals for this order with full context
      const orderMeals = [];
      Object.entries(order.dailySelection.meals).forEach(
        ([mealType, meals]) => {
          meals.forEach((meal, index) => {
            orderMeals.push({
              ...meal,
              mealType,
              orderIndex: index,
              orderId: order.id,
              customerId: order.userId,
              customerName:
                order.customerName ||
                `Customer ${order.userId?.slice(-8) || order.id.slice(-8)}`,
              customerAllergies: order.allergies || [],
              customerAllergyNames: hasAllergies
                ? order.allergies.map((id) => allergyNames.get(id) || id)
                : [],
            });
          });
        }
      );

      // Categorize the order
      if (hasCustomizations && hasAllergies) {
        categories.complex.push({ order, meals: orderMeals });
      } else if (hasCustomizations) {
        categories.customized.push({ order, meals: orderMeals });
      } else if (hasAllergies) {
        categories.allergies.push({ order, meals: orderMeals });
      } else {
        categories.standard.push({ order, meals: orderMeals });
      }
    });

    return categories;
  };

  const categories = organizeOrders();

  const getCategoryStats = () => {
    return {
      standard: categories.standard.reduce(
        (sum, item) => sum + item.meals.length,
        0
      ),
      customized: categories.customized.reduce(
        (sum, item) => sum + item.meals.length,
        0
      ),
      allergies: categories.allergies.reduce(
        (sum, item) => sum + item.meals.length,
        0
      ),
      complex: categories.complex.reduce(
        (sum, item) => sum + item.meals.length,
        0
      ),
    };
  };

  const stats = getCategoryStats();
  const totalMeals =
    stats.standard + stats.customized + stats.allergies + stats.complex;

  // Helper function to render individual meal cards
  const renderMealCard = (meal, colorScheme) => {
    return (
      <Card
        sx={{ height: "100%", border: 1, borderColor: `${colorScheme}.light` }}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="subtitle2"
            fontWeight="bold"
            color={`${colorScheme}.main`}
            gutterBottom
          >
            {meal.selectedMealTitle || "Unknown Meal"}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 1 }}
          >
            Customer: {meal.customerName}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
            sx={{ mb: 2 }}
          >
            Order: #{meal.orderId.slice(-8)}
          </Typography>

          {/* Customization details */}
          {meal.isCustomized && meal.customizedComponents && (
            <Box sx={{ mb: 1 }}>
              <Typography
                variant="caption"
                color="warning.main"
                fontWeight="bold"
                display="block"
              >
                CUSTOMIZATIONS:
              </Typography>
              <Box sx={{ pl: 1 }}>
                {meal.customizedComponents.filter((c) => !c.isIncluded).length >
                  0 && (
                  <Typography
                    variant="caption"
                    display="block"
                    color="error.main"
                  >
                    🚫 Exclude:{" "}
                    {meal.customizedComponents
                      .filter((c) => !c.isIncluded)
                      .map(
                        (c) =>
                          c.componentName ||
                          componentNames[meal.selectedMealId]?.[
                            c.componentId
                          ] ||
                          c.componentId
                      )
                      .join(", ")}
                  </Typography>
                )}
                {meal.customizedComponents.filter((c) => c.isIncluded).length >
                  0 && (
                  <Typography
                    variant="caption"
                    display="block"
                    color="success.main"
                  >
                    ✅ Include:{" "}
                    {meal.customizedComponents
                      .filter((c) => c.isIncluded)
                      .map(
                        (c) =>
                          c.componentName ||
                          componentNames[meal.selectedMealId]?.[
                            c.componentId
                          ] ||
                          c.componentId
                      )
                      .join(", ")}
                  </Typography>
                )}
              </Box>
            </Box>
          )}

          {/* Allergy information */}
          {meal.customerAllergies.length > 0 && (
            <Alert severity="warning" sx={{ mt: 1, p: 1 }}>
              <Typography variant="caption" fontWeight="bold">
                ⚠️ ALLERGIES: {meal.customerAllergyNames.join(", ")}
              </Typography>
            </Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  // Helper function to render tab content
  const renderTabContent = (categoryData, title, description, colorScheme) => {
    if (categoryData.length === 0) {
      return (
        <Alert severity="success" sx={{ textAlign: "center" }}>
          <Typography variant="h6">
            🎉 No {title.toLowerCase()} for today!
          </Typography>
          <Typography variant="body2">
            This category is empty - no special preparation needed.
          </Typography>
        </Alert>
      );
    }

    const allMeals = categoryData.flatMap((item) => item.meals);

    return (
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: `${colorScheme}.main` }}
        >
          {title} ({allMeals.length} meals)
        </Typography>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ mb: 3, fontStyle: "italic" }}
        >
          {description}
        </Typography>

        {/* Group meals by customer order, not by meal type */}
        {categoryData.map((orderItem, orderIndex) => {
          const { order, meals } = orderItem;

          return (
            <Box key={order.id} sx={{ mb: 3 }}>
              <Typography
                variant="subtitle1"
                fontWeight="bold"
                sx={{
                  mb: 2,
                  color: `${colorScheme}.main`,
                  borderBottom: 1,
                  borderColor: `${colorScheme}.light`,
                  pb: 1,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <PersonIcon fontSize="small" />
                Order #{order.id.slice(-8)} -{" "}
                {order.customerName ||
                  `Customer ${order.userId?.slice(-8) || order.id.slice(-8)}`}
                <Chip
                  label={`${meals.length} meals`}
                  size="small"
                  color={colorScheme}
                />
              </Typography>

              <Grid container spacing={2}>
                {meals.map((meal, index) => (
                  <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    key={`${meal.orderId}-${meal.mealType}-${meal.orderIndex}`}
                  >
                    {renderMealCard(meal, colorScheme)}
                  </Grid>
                ))}
              </Grid>
            </Box>
          );
        })}
      </Box>
    );
  };

  if (totalMeals === 0) {
    return (
      <Alert severity="info" sx={{ mb: 2 }}>
        <Typography variant="body2">
          No meal selections found for today.
        </Typography>
      </Alert>
    );
  }

  return (
    <Box sx={{ mb: 3 }}>
      <Typography
        variant="h5"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <LocalDiningIcon />
        Meal Preparation Categories
      </Typography>

      {/* Statistics Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6" color="success.main">
                {stats.standard}
              </Typography>
              <Typography variant="caption">Standard</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6" color="warning.main">
                {stats.customized}
              </Typography>
              <Typography variant="caption">Customized</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6" color="error.main">
                {stats.allergies}
              </Typography>
              <Typography variant="caption">Allergies</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={6} sm={3}>
          <Card>
            <CardContent sx={{ textAlign: "center", py: 1 }}>
              <Typography variant="h6" color="secondary.main">
                {stats.complex}
              </Typography>
              <Typography variant="caption">Complex</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Category Tabs */}
      {/* <Paper sx={{ mb: 3 }}>
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: "divider" }}
        >
          <Tab
            label={
              <Badge badgeContent={stats.standard} color="success" showZero>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircleIcon />
                  Standard
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.customized} color="warning" showZero>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <RestaurantIcon />
                  Customized
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.allergies} color="error" showZero>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <ShieldIcon />
                  Allergies
                </Box>
              </Badge>
            }
          />
          <Tab
            label={
              <Badge badgeContent={stats.complex} color="secondary" showZero>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <WarningIcon />
                  Complex
                </Box>
              </Badge>
            }
          />
        </Tabs> */}

      {/* Tab Content */}
      {/* <Box sx={{ p: 3 }}>
          {selectedTab === 0 &&
            renderTabContent(
              categories.standard,
              "Standard Meals",
              "No customizations or allergies - prepare according to standard recipes",
              "success"
            )}
          {selectedTab === 1 &&
            renderTabContent(
              categories.customized,
              "Customized Meals",
              "Follow customization instructions - exclude/include components as specified",
              "warning"
            )}
          {selectedTab === 2 &&
            renderTabContent(
              categories.allergies,
              "Allergy-Conscious Meals",
              "Check all ingredients for customer allergies - no customizations required",
              "error"
            )}
          {selectedTab === 3 &&
            renderTabContent(
              categories.complex,
              "Complex Meals",
              "Both customizations AND allergy considerations - requires extra care and attention",
              "secondary"
            )}
        </Box> */}
      {/* </Paper> */}
    </Box>
  );
};

export default MealCategoriesDisplay;
