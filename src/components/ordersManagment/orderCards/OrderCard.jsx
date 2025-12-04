// 1. OrderCard.jsx - Main order card component
import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardActions,
  Box,
  Typography,
  Chip,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  FormControlLabel,
  Checkbox,
  Collapse,
  IconButton,
} from "@mui/material";
import {
  Person as PersonIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import {
  ExpandMore as ExpandMoreIcon,
  Restaurant as RestaurantIcon,
  Warning as WarningIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  CheckBoxOutlineBlank as CheckBoxOutlineBlankIcon,
  CheckBox as CheckBoxIcon,
  CheckCircle as CheckCircleIcon,
  Assignment as AssignmentIcon,
} from "@mui/icons-material";

import OrderStatusSection from "./OrderStatusSection";
import OrderDetailsCollapse from "./OrderDetailsCollapse";
import MealCustomizationDisplay from "../../MealCustomizationDisplay";
import BulkSelectionCheckbox from "./BulkSelectionCheckbox";
import PreparationCheckbox from "./PreparationCheckbox";
import { getCustomerDisplayInfo } from "../../../utils/allergyHelper";
import {
  SkipRequestIndicator,
  SkipRequestDialog,
} from "../../SkipRequestManager";
import {
  hasPendingSkipRequest,
  getSkipRequestStatus,
} from "../../../utils/skipRequestUtils";

const OrderCard = ({
  order,
  date,
  allergyNames,
  allergies,
  componentNames,
  // Preparation features (for today orders)
  showPreparationCheckbox = false,
  isPrepared = false,
  onTogglePreparedStatus,
  // Bulk selection features
  bulkSelectionMode = false,
  isSelectedForBulk = false,
  onToggleOrderSelection,
  // Status management
  onStatusUpdate,
  onStatusUpdated,
  onChefSelection,
  adminUserId = "admin_user",
  // Expandable details
  isExpanded = false,
  onToggleExpanded,
}) => {
  const status = order.preparationStatus;
  const hasAllergies = order.allergies && order.allergies.length > 0;
  const customerInfo = getCustomerDisplayInfo(order);

  // Check if order has customizations
  const hasCustomizations =
    order.dailySelection &&
    order.dailySelection.meals &&
    Object.values(order.dailySelection.meals).some((meals) =>
      meals.some((meal) => meal.isCustomized)
    );

  // Get allergy names from IDs
  const allergyDisplayNames = hasAllergies
    ? order.allergies.map((id) => allergyNames.get(id) || id)
    : [];

  const getStatusColor = (status) => {
    switch (status.status) {
      case "user_selected":
        return "success";
      case "chef_selection_needed":
        return "warning";
      case "user_skipped":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status.status) {
      case "user_selected":
        return <CheckCircleIcon />;
      case "chef_selection_needed":
        return <AssignmentIcon />;
      case "user_skipped":
        return <WarningIcon />;
      default:
        return <RestaurantIcon />;
    }
  };

  // Skip request handling
  const [skipRequestDialog, setSkipRequestDialog] = useState(false);
  const skipRequestStatus = getSkipRequestStatus(order, date);
  const hasPendingRequest = hasPendingSkipRequest(order, date);

  const handleSkipRequestReview = () => {
    setSkipRequestDialog(true);
  };

  const handleSkipRequestActionCompleted = (action) => {
    setSkipRequestDialog(false);
    // Refresh the order data
    if (onStatusUpdated) {
      onStatusUpdated();
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        border: hasCustomizations ? 2 : 0,
        borderColor: hasCustomizations ? "warning.main" : "transparent",
        bgcolor: isPrepared
          ? "grey.100"
          : hasCustomizations
          ? "transparent"
          : "background.paper",
        opacity: isPrepared ? 0.7 : 1,
        transition: "all 0.3s ease",
      }}
    >
      <CardContent>
        {/* Bulk Selection Checkbox */}
        {bulkSelectionMode && (
          <BulkSelectionCheckbox
            orderId={order.id}
            isSelected={isSelectedForBulk}
            onToggleSelection={onToggleOrderSelection}
          />
        )}

        {/* Preparation Checkbox */}
        {showPreparationCheckbox && (
          <PreparationCheckbox
            orderId={order.id}
            isPrepared={isPrepared}
            onTogglePreparedStatus={onTogglePreparedStatus}
          />
        )}

        {/* Order Header */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="flex-start"
          mb={2}
        >
          <Box>
            <Box display="flex" alignItems="center" gap={1}>
              <Typography variant="h6" gutterBottom>
                Order #{order.id.slice(-8)}
              </Typography>
              {hasCustomizations && (
                <Chip
                  label="🍽️ CUSTOMIZED"
                  size="small"
                  color="warning"
                  sx={{ fontWeight: "bold" }}
                />
              )}
            </Box>

            <Box display="flex" alignItems="center" gap={1} mb={1}>
              <PersonIcon fontSize="small" />
              <Typography variant="body2">
                {customerInfo.hasRealName ? (
                  <>
                    {customerInfo.displayName}{" "}
                    <Typography
                      component="span"
                      variant="caption"
                      color="text.secondary"
                      sx={{ fontSize: "0.75rem" }}
                    >
                      ({customerInfo.customerId})
                    </Typography>
                  </>
                ) : (
                  `Customer: ${customerInfo.customerId}`
                )}
              </Typography>
            </Box>

            <Box display="flex" alignItems="center" gap={1}>
              <LocationIcon fontSize="small" />
              <Typography variant="body2">
                {order.address?.emirate && `${order.address.emirate}, `}
                {order.address?.area}
                {order.address?.building &&
                  ` - Building ${order.address.building}`}
              </Typography>
              <IconButton
                size="small"
                onClick={() => onToggleExpanded(order.id)}
                sx={{ ml: 1 }}
              >
                {isExpanded ? (
                  <KeyboardArrowUpIcon />
                ) : (
                  <KeyboardArrowDownIcon />
                )}
              </IconButton>
            </Box>
          </Box>

          <Chip
            icon={getStatusIcon(status)}
            label={status.message}
            color={getStatusColor(status)}
            variant="outlined"
          />
        </Box>

        {/* Skip Request Indicator */}
        {skipRequestStatus.hasSkipRequest && (
          <SkipRequestIndicator
            orderId={order.id}
            date={date}
            skipRequest={skipRequestStatus}
            onReviewClick={handleSkipRequestReview}
          />
        )}

        {/* Collapsible Order Details */}
        <OrderDetailsCollapse order={order} isExpanded={isExpanded} />

        {/* Allergies Alert */}
        {hasAllergies && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            <Typography variant="body2" fontWeight="bold">
              Allergies: {allergyDisplayNames.join(", ")}
            </Typography>
          </Alert>
        )}

        {/* Package Requirements */}
        <Box mb={2}>
          <Typography variant="subtitle2" gutterBottom>
            Package Requirements:
          </Typography>
          <Box display="flex" gap={1} flexWrap="wrap">
            {Object.entries(order.packageRequirements.mealQuantities)
              .filter(([_, quantity]) => quantity > 0)
              .map(([mealType, quantity]) => (
                <Chip
                  key={mealType}
                  label={`${quantity} ${mealType}${quantity > 1 ? "s" : ""}`}
                  size="small"
                  variant="outlined"
                />
              ))}
          </Box>
        </Box>

        {/* Day Lock Info */}
        {status.reason === "day_was_locked" && status.note && (
          <Alert severity="info" sx={{ mb: 2 }}>
            <Typography variant="body2">{status.note}</Typography>
          </Alert>
        )}

        {/* User Selected Meals */}
        {status.status === "user_selected" && order.dailySelection?.meals && (
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle2">User Selected Meals</Typography>
            </AccordionSummary>
            <AccordionDetails>
              {Object.entries(order.dailySelection.meals).map(
                ([mealType, meals]) => (
                  <Box key={mealType} mb={1}>
                    <Typography
                      variant="body2"
                      fontWeight="bold"
                      sx={{ textTransform: "capitalize" }}
                    >
                      {mealType}:
                    </Typography>
                    {meals.map((meal, index) => (
                      <Typography key={index} variant="body2" sx={{ ml: 2 }}>
                        • {meal.selectedMealTitle}
                      </Typography>
                    ))}
                  </Box>
                )
              )}
            </AccordionDetails>
          </Accordion>
        )}

        {/* Meal Customizations */}
        {status.status === "user_selected" && order.dailySelection && (
          <MealCustomizationDisplay
            dailySelection={order.dailySelection}
            allergies={allergies}
            componentNames={componentNames}
          />
        )}

        {/* Order Status Management */}
        <OrderStatusSection
          order={order}
          date={date}
          onStatusUpdate={onStatusUpdate}
          onStatusUpdated={onStatusUpdated}
          adminUserId={adminUserId}
        />
      </CardContent>

      {/* Action Buttons */}
      {status.status === "user_skipped" && (
        <CardActions>
          <Alert severity="error" sx={{ width: "100%", mb: 1 }}>
            <Typography variant="body2" fontWeight="bold">
              🚨Customer or Admin has skipped this day! If the skip request came
              from the customer, please confirm and update order status to
              "Delivery Skipped". If the skip was made by admin, no order status
              update is needed.
            </Typography>
          </Alert>
          <Box display="flex" gap={1} width="100%">
            <Button
              variant="contained"
              color="error"
              startIcon={<WarningIcon />}
              onClick={() => onStatusUpdate(order, date)}
              fullWidth
            >
              Mark as Delivery Skipped
            </Button>
          </Box>
        </CardActions>
      )}

      {status.status === "chef_selection_needed" && (
        <CardActions>
          <Button
            variant="contained"
            color="primary"
            startIcon={<RestaurantIcon />}
            onClick={() => onChefSelection(order)}
          >
            Select Meals
          </Button>
        </CardActions>
      )}

      {/* Skip Request Dialog */}
      {skipRequestDialog && (
        <SkipRequestDialog
          open={skipRequestDialog}
          onClose={() => setSkipRequestDialog(false)}
          orderId={order.id}
          date={date}
          userMealSelectionId={order.userMealSelectionId}
          onActionCompleted={handleSkipRequestActionCompleted}
        />
      )}
    </Card>
  );
};

export default OrderCard;
