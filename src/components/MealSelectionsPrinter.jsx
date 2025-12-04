import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Grid,
  Card,
  CardContent,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import {
  Print as PrintIcon,
  Download as DownloadIcon,
  Restaurant as RestaurantIcon,
  Warning as WarningIcon,
  Shield as ShieldIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  Person as PersonIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { jsPDF } from "jspdf";

/**
 * Component for organizing and printing meal selections by categories
 * Separates meals into: Standard, Customized, Allergy-specific, and Complex (both)
 */
const MealSelectionsPrinter = ({
  orders,
  date,
  componentNames,
  allergyNames,
}) => {
  const [open, setOpen] = useState(false);
  const [selectedSections, setSelectedSections] = useState({
    standard: true,
    customized: true,
    allergies: true,
    complex: true,
  });

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

      // Extract all meals for this order
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
            });
          });
        }
      );

      // Categorize the order (keeping meals grouped by order)
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

  // Generate PDF for printing
  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;
    const lineHeight = 6;
    const sectionSpacing = 15;

    // PDF Header
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`MEAL PREPARATIONS - ${date}`, pageWidth / 2, yPosition, {
      align: "center",
    });
    yPosition += 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Generated: ${new Date().toLocaleString()}`,
      pageWidth / 2,
      yPosition,
      { align: "center" }
    );
    yPosition += sectionSpacing;

    // Helper function to add a new page if needed
    const checkPageBreak = (neededSpace) => {
      if (yPosition + neededSpace > pageHeight - 20) {
        doc.addPage();
        yPosition = 20;
      }
    };

    // Helper function to draw section divider
    const drawSectionDivider = (title, color = "black") => {
      checkPageBreak(30);

      // Dashed line for cutting
      doc.setLineDash([2, 2]);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      doc.setLineDash([]);
      yPosition += 5;

      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(title, pageWidth / 2, yPosition, { align: "center" });
      yPosition += 10;

      // Another dashed line
      doc.setLineDash([2, 2]);
      doc.line(10, yPosition, pageWidth - 10, yPosition);
      doc.setLineDash([]);
      yPosition += sectionSpacing;
    };

    // Generate each section
    const generateSection = (sectionName, orderItems, title, instructions) => {
      if (!selectedSections[sectionName] || orderItems.length === 0) return;

      drawSectionDivider(title);

      // Section instructions
      doc.setFontSize(10);
      doc.setFont("helvetica", "italic");
      doc.text(instructions, 15, yPosition);
      yPosition += lineHeight + 10;

      // Process each order (grouped by customer)
      orderItems.forEach(({ order, meals }) => {
        checkPageBreak(80);

        // Order card background
        const cardStartY = yPosition;

        // Order header section with background
        doc.setFillColor(245, 245, 245);
        doc.rect(15, yPosition, pageWidth - 30, 15, "F");

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`ORDER #${order.id.slice(-8)}`, 20, yPosition + 10);

        // Customization badge if applicable
        const hasCustomizations = meals.some((meal) => meal.isCustomized);
        if (hasCustomizations) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "bold");
          doc.text("🍽️ CUSTOMIZED", pageWidth - 60, yPosition + 10);
        }

        yPosition += 18;

        // Customer Information Section
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.text("CUSTOMER:", 20, yPosition);

        doc.setFont("helvetica", "normal");
        const customerName =
          order.customerName ||
          `Customer ${order.userId?.slice(-8) || order.id.slice(-8)}`;
        const customerId = order.userId?.slice(-8) || order.id.slice(-8);
        doc.text(`${customerName} (ID: ${customerId})`, 70, yPosition);
        yPosition += lineHeight;

        // Address Information
        doc.setFont("helvetica", "bold");
        doc.text("ADDRESS:", 20, yPosition);

        doc.setFont("helvetica", "normal");
        let addressText =
          order.address?.street ||
          order.address?.area ||
          "Address not specified";
        if (order.address?.building) {
          addressText += `, Building: ${order.address.building}`;
        }
        if (order.address?.flat) {
          addressText += `, Flat: ${order.address.flat}`;
        }

        // Handle long addresses by wrapping text
        const maxAddressWidth = pageWidth - 80;
        const addressLines = doc.splitTextToSize(addressText, maxAddressWidth);
        addressLines.forEach((line, index) => {
          doc.text(line, 70, yPosition + index * lineHeight);
        });
        yPosition += lineHeight * Math.max(1, addressLines.length);

        // Package Requirements
        if (order.packageRequirements?.mealQuantities) {
          doc.setFont("helvetica", "bold");
          doc.text("PACKAGE:", 20, yPosition);

          doc.setFont("helvetica", "normal");
          const requirements = Object.entries(
            order.packageRequirements.mealQuantities
          )
            .filter(([_, quantity]) => quantity > 0)
            .map(
              ([mealType, quantity]) =>
                `${quantity} ${mealType}${quantity > 1 ? "s" : ""}`
            )
            .join(", ");
          doc.text(requirements, 70, yPosition);
          yPosition += lineHeight;
        }

        // Customer Allergies (if any)
        if (order.allergies && order.allergies.length > 0) {
          doc.setFont("helvetica", "bold");
          doc.setTextColor(255, 0, 0); // Red color for allergies
          doc.text("⚠️ ALLERGIES:", 20, yPosition);

          doc.setFont("helvetica", "normal");
          const allergyDisplayNames = order.allergies
            .map((id) => allergyNames?.get(id) || id)
            .join(", ");

          const allergyText = `${allergyDisplayNames} - CHECK ALL INGREDIENTS!`;
          const allergyLines = doc.splitTextToSize(allergyText, pageWidth - 80);
          allergyLines.forEach((line, index) => {
            doc.text(line, 80, yPosition + index * lineHeight);
          });

          doc.setTextColor(0, 0, 0); // Reset to black
          yPosition += lineHeight * Math.max(1, allergyLines.length) + 2;
        }

        yPosition += 5; // Space before meals

        // Meals Section
        doc.setFontSize(12);
        doc.setFont("helvetica", "bold");
        doc.text("MEALS TO PREPARE:", 20, yPosition);
        yPosition += lineHeight + 3;

        // Group meals by type within this order
        const mealsByType = meals.reduce((acc, meal) => {
          if (!acc[meal.mealType]) acc[meal.mealType] = [];
          acc[meal.mealType].push(meal);
          return acc;
        }, {});

        Object.entries(mealsByType).forEach(([mealType, typeMeals]) => {
          checkPageBreak(20);

          // Meal type header with background
          doc.setFillColor(250, 250, 250);
          doc.rect(25, yPosition - 2, pageWidth - 50, 12, "F");

          doc.setFontSize(11);
          doc.setFont("helvetica", "bold");
          doc.text(
            `${mealType.charAt(0).toUpperCase() + mealType.slice(1)}:`,
            30,
            yPosition + 6
          );
          yPosition += 15;

          typeMeals.forEach((meal, index) => {
            checkPageBreak(35);

            // Meal item box
            doc.rect(30, yPosition - 2, pageWidth - 60, 25);

            // Meal title
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(
              `${meal.selectedMealTitle || "Unknown Meal"}`,
              35,
              yPosition + 5
            );

            // Customization details (if applicable)
            if (meal.isCustomized && meal.customizedComponents) {
              const excluded = meal.customizedComponents.filter(
                (c) => !c.isIncluded
              );
              const included = meal.customizedComponents.filter(
                (c) => c.isIncluded
              );

              let customY = yPosition + 10;
              doc.setFontSize(8);
              doc.setFont("helvetica", "normal");

              if (excluded.length > 0) {
                doc.setTextColor(255, 0, 0); // Red for exclusions
                const excludeText = `🚫 EXCLUDE: ${excluded
                  .map(
                    (c) =>
                      c.componentName ||
                      componentNames[meal.selectedMealId]?.[c.componentId] ||
                      c.componentId
                  )
                  .join(", ")}`;
                const excludeLines = doc.splitTextToSize(
                  excludeText,
                  pageWidth - 80
                );
                excludeLines.forEach((line, idx) => {
                  doc.text(line, 35, customY + idx * 4);
                });
                customY += 4 * excludeLines.length;
              }

              if (included.length > 0) {
                doc.setTextColor(0, 150, 0); // Green for inclusions
                const includeText = `✅ INCLUDE: ${included
                  .map(
                    (c) =>
                      c.componentName ||
                      componentNames[meal.selectedMealId]?.[c.componentId] ||
                      c.componentId
                  )
                  .join(", ")}`;
                const includeLines = doc.splitTextToSize(
                  includeText,
                  pageWidth - 80
                );
                includeLines.forEach((line, idx) => {
                  doc.text(line, 35, customY + idx * 4);
                });
              }

              doc.setTextColor(0, 0, 0); // Reset to black
            }

            yPosition += 28;
          });

          yPosition += 5; // Space between meal types
        });

        // Order separator line
        doc.setLineDash([1, 1]);
        doc.line(15, yPosition + 5, pageWidth - 15, yPosition + 5);
        doc.setLineDash([]);
        yPosition += 15; // Space between orders
      });

      yPosition += sectionSpacing;
    };

    // Generate all sections
    generateSection(
      "standard",
      categories.standard,
      "🍽️ STANDARD MEALS",
      "No customizations or allergies - prepare as standard recipes"
    );

    generateSection(
      "customized",
      categories.customized,
      "⚙️ CUSTOMIZED MEALS",
      "Follow customization instructions - exclude/include components as specified"
    );

    generateSection(
      "allergies",
      categories.allergies,
      "⚠️ ALLERGY-CONSCIOUS MEALS",
      "Check all ingredients for allergens - no customizations but allergy considerations"
    );

    generateSection(
      "complex",
      categories.complex,
      "🔄 COMPLEX MEALS",
      "Both customizations AND allergy considerations - extra care required"
    );

    // Save PDF
    doc.save(`meal-preparations-${date}.pdf`);
  };

  const getSectionStats = () => {
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
      total: orders.reduce((total, order) => {
        if (!order.dailySelection || !order.dailySelection.meals) return total;
        return (
          total +
          Object.values(order.dailySelection.meals).reduce(
            (sum, meals) => sum + meals.length,
            0
          )
        );
      }, 0),
    };
  };

  const stats = getSectionStats();

  return (
    <>
      <Button
        variant="contained"
        color="primary"
        startIcon={<PrintIcon />}
        onClick={() => setOpen(true)}
        sx={{ mb: 2 }}
      >
        Print Meal Preparations
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <Typography variant="h6">Meal Preparations for {date}</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent>
          {/* Statistics Overview */}
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

          {/* Section Preview */}
          <Typography variant="h6" gutterBottom>
            Sections to Print:
          </Typography>

          {Object.entries({
            standard: {
              title: "🍽️ Standard Meals",
              color: "success",
              orderItems: categories.standard,
            },
            customized: {
              title: "⚙️ Customized Meals",
              color: "warning",
              orderItems: categories.customized,
            },
            allergies: {
              title: "⚠️ Allergy-Conscious Meals",
              color: "error",
              orderItems: categories.allergies,
            },
            complex: {
              title: "🔄 Complex Meals",
              color: "secondary",
              orderItems: categories.complex,
            },
          }).map(([key, section]) => {
            const totalMeals = section.orderItems.reduce(
              (sum, item) => sum + item.meals.length,
              0
            );
            const allMeals = section.orderItems.flatMap((item) => item.meals);

            return (
              <Accordion key={key} disabled={totalMeals === 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" gap={1} width="100%">
                    <Typography variant="subtitle1">{section.title}</Typography>
                    <Chip
                      label={`${totalMeals} meals, ${section.orderItems.length} orders`}
                      size="small"
                      color={section.color}
                    />
                    {totalMeals === 0 && (
                      <Chip label="No meals" size="small" variant="outlined" />
                    )}
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <List dense>
                    {section.orderItems
                      .slice(0, 2)
                      .map((orderItem, orderIndex) => (
                        <Box key={orderIndex}>
                          <ListItem>
                            <ListItemIcon>
                              <PersonIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText
                              primary={`Order #${orderItem.order.id.slice(
                                -8
                              )} - ${
                                orderItem.order.customerName || "Customer"
                              }`}
                              secondary={`${orderItem.meals.length} meal(s)`}
                            />
                          </ListItem>
                          {orderItem.meals
                            .slice(0, 2)
                            .map((meal, mealIndex) => (
                              <ListItem key={mealIndex} sx={{ pl: 4 }}>
                                <ListItemIcon>
                                  <RestaurantIcon fontSize="small" />
                                </ListItemIcon>
                                <ListItemText
                                  primary={`${
                                    meal.mealType.charAt(0).toUpperCase() +
                                    meal.mealType.slice(1)
                                  }: ${meal.selectedMealTitle}`}
                                />
                              </ListItem>
                            ))}
                          {orderItem.meals.length > 2 && (
                            <ListItem sx={{ pl: 4 }}>
                              <ListItemText
                                primary={`... and ${
                                  orderItem.meals.length - 2
                                } more meals`}
                                sx={{
                                  fontStyle: "italic",
                                  color: "text.secondary",
                                }}
                              />
                            </ListItem>
                          )}
                        </Box>
                      ))}
                    {section.orderItems.length > 2 && (
                      <ListItem>
                        <ListItemText
                          primary={`... and ${
                            section.orderItems.length - 2
                          } more orders`}
                          sx={{ fontStyle: "italic", color: "text.secondary" }}
                        />
                      </ListItem>
                    )}
                  </List>
                </AccordionDetails>
              </Accordion>
            );
          })}

          <Alert severity="info" sx={{ mt: 2 }}>
            <Typography variant="body2">
              📄 The PDF will be organized in sections with dotted cut lines.
              Each section can be cut and given to different chefs for efficient
              preparation.
            </Typography>
          </Alert>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={() => {
              generatePDF();
              setOpen(false);
            }}
            disabled={stats.total === 0}
          >
            Download PDF ({stats.total} meals)
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default MealSelectionsPrinter;
