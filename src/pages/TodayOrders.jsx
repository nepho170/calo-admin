// TodayOrders.jsx - Refactored using reusable components
import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
} from "@mui/material";
import { Today as TodayIcon } from "@mui/icons-material";

// Service imports
import { getTodayOrdersForPreparation } from "../services/customerOrders";
import { updateMealSelectionsForDate } from "../services/userMealSelections";
import { mealsService } from "../services/meals";
import { getAvailableMealsForPackage } from "../utils/mealSelectionHelper";
import { migrateCurrentOperationalStatuses } from "../utils/orderStatusMigration";
import {
  updateOrderDailyStatus,
  ORDER_STATUSES,
  SKIP_REASONS,
} from "../services/orderStatus";
import { allergiesService } from "../services/allergies";
import { getAllergyNames } from "../utils/allergyHelper";
import {
  getTodayLocalDate,
  getDisplayDate,
  getTodayDayName,
} from "../utils/dateUtils";

// Component imports
import {
  StatusUpdateDialog,
  StatusStatistics,
} from "../components/OrderStatusManager";
import MealCustomizationDisplay from "../components/MealCustomizationDisplay";
import MealCategoriesDisplay from "../components/MealCategoriesDisplay";
import MealSelectionsPrinter from "../components/MealSelectionsPrinter";
import BulkActionsToolbar from "../components/ordersManagment/BulkActionsToolbar/BulkActionsToolbar";
import BulkStatusUpdateDialog from "../components/ordersManagment/BulkActionsToolbar/BulkStatusUpdateDialog";
import OrdersList from "../components/ordersManagment/BulkActionsToolbar/OrdersList";
import OrderStatsGrid from "../components/ordersManagment/BulkActionsToolbar/OrderStatsGrid";
import PreparationProgressIndicator from "../components/ordersManagment/BulkActionsToolbar/PreparationProgressIndicator";

const TodayOrders = () => {
  // Main data state
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allergyNames, setAllergyNames] = useState(new Map());
  const [allergies, setAllergies] = useState([]);
  const [componentNames, setComponentNames] = useState({});

  // Meal selection dialog state
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [availableMealsByType, setAvailableMealsByType] = useState({});
  const [selectedMeals, setSelectedMeals] = useState({});
  const [savingMeals, setSavingMeals] = useState(false);
  const [loadingMeals, setLoadingMeals] = useState(false);

  // Status management state
  const [statusUpdateDialog, setStatusUpdateDialog] = useState({
    open: false,
    order: null,
    date: null,
  });

  // Bulk status update state
  const [bulkStatusDialog, setBulkStatusDialog] = useState({
    open: false,
    selectedStatus: "",
    reason: "",
    note: "",
  });

  // UI state
  const [expandedOrders, setExpandedOrders] = useState({});
  const [preparedOrders, setPreparedOrders] = useState({});
  const [selectedOrdersForBulk, setSelectedOrdersForBulk] = useState({});
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false);

  useEffect(() => {
    fetchTodayOrders();

    // Load prepared orders from localStorage
    const savedPreparedOrders = localStorage.getItem("todayPreparedOrders");
    if (savedPreparedOrders) {
      try {
        const parsed = JSON.parse(savedPreparedOrders);
        const today = getTodayLocalDate();
        if (parsed.date === today) {
          setPreparedOrders(parsed.orders || {});
        }
      } catch (error) {
        console.warn("Error loading prepared orders from localStorage:", error);
      }
    }
  }, []);

  // Save prepared orders to localStorage when they change
  useEffect(() => {
    const today = getTodayLocalDate();
    const dataToSave = {
      date: today,
      orders: preparedOrders,
    };
    localStorage.setItem("todayPreparedOrders", JSON.stringify(dataToSave));
  }, [preparedOrders]);

  const fetchTodayOrders = async () => {
    try {
      setLoading(true);

      // Store current preparation status before refreshing
      const currentPreparedOrders = { ...preparedOrders };
      console.log(
        "💾 Preserving current preparation status:",
        currentPreparedOrders
      );

      // Fetch orders and allergies in parallel
      const [todayOrders, allergiesData] = await Promise.all([
        getTodayOrdersForPreparation(),
        allergiesService.getAll(),
      ]);

      setAllergies(allergiesData);

      // Ensure daily statuses exist for operational dates
      if (todayOrders.length > 0) {
        try {
          console.log("🔄 Ensuring daily statuses exist for today's orders...");
          await migrateCurrentOperationalStatuses(todayOrders);
        } catch (migrationError) {
          console.warn("⚠️ Status migration had issues:", migrationError);
        }
      }

      // Fetch allergy names for all orders
      const allergyNameMap = new Map();
      for (const order of todayOrders) {
        if (order.allergies && order.allergies.length > 0) {
          const names = await getAllergyNames(order.allergies);
          order.allergies.forEach((id, index) => {
            allergyNameMap.set(id, names[index] || id);
          });
        }
      }
      setAllergyNames(allergyNameMap);

      // Fetch component names for customized meals
      await fetchComponentNamesForOrders(todayOrders);

      setOrders(todayOrders);

      // Restore preparation status after orders are updated
      // Only keep preparation status for orders that still exist
      const validOrderIds = new Set(todayOrders.map((order) => order.id));
      const preservedPreparedOrders = {};

      Object.keys(currentPreparedOrders).forEach((orderId) => {
        if (validOrderIds.has(orderId) && currentPreparedOrders[orderId]) {
          preservedPreparedOrders[orderId] = true;
        }
      });

      if (Object.keys(preservedPreparedOrders).length > 0) {
        console.log(
          "🔄 Restoring preparation status:",
          preservedPreparedOrders
        );
        setPreparedOrders(preservedPreparedOrders);
      }
    } catch (err) {
      setError("Failed to fetch today's orders: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchComponentNamesForOrders = async (orders) => {
    try {
      const componentNamesMap = {};
      const mealIdsToFetch = new Set();

      orders.forEach((order) => {
        if (order.dailySelection && order.dailySelection.meals) {
          Object.values(order.dailySelection.meals).forEach((meals) => {
            meals.forEach((meal) => {
              if (meal.isCustomized && meal.selectedMealId) {
                mealIdsToFetch.add(meal.selectedMealId);
              }
            });
          });
        }
      });

      if (mealIdsToFetch.size > 0) {
        console.log(
          `🔍 Fetching component names for ${mealIdsToFetch.size} customized meals...`
        );
        const { componentMaps } = await mealsService.getMultipleWithComponents(
          Array.from(mealIdsToFetch)
        );
        Object.assign(componentNamesMap, componentMaps);
      }

      setComponentNames(componentNamesMap);
    } catch (error) {
      console.warn("Error fetching component names:", error);
    }
  };

  // Chef selection functions
  const handleChefSelection = async (order) => {
    console.log("🧑‍🍳 Starting chef selection for today order:", order.id);
    setSelectedOrder(order);
    setLoadingMeals(true);

    try {
      // For today's orders, use today's date
      const todayDate = new Date().toISOString().split("T")[0];

      if (!order.macroPlanId) {
        console.warn("⚠️ Order is missing macroPlanId, using default fallback");
        order.macroPlanId =
          order.selectedPackage?.macroPlanId || "high_protein_plan";
      }
      if (!order.packageRequirements?.includedMealTypes) {
        throw new Error(
          "Order is missing packageRequirements.includedMealTypes"
        );
      }

      const availableMeals = await getAvailableMealsForPackage(
        todayDate,
        order.packageRequirements.includedMealTypes
      );

      setAvailableMealsByType(availableMeals);

      const mealTypes = order.packageRequirements.includedMealTypes;
      const quantities = order.packageRequirements.mealQuantities;

      const initialSelections = {};
      mealTypes.forEach((mealType) => {
        const quantity = quantities[mealType] || 0;
        if (quantity > 0) {
          initialSelections[mealType] = new Array(quantity).fill("");
        }
      });

      setSelectedMeals(initialSelections);
    } catch (error) {
      console.error("❌ Error fetching available meals:", error);
      setAvailableMealsByType({});
      setSelectedMeals({});
    } finally {
      setLoadingMeals(false);
      setOpenDialog(true);
    }
  };

  const handleMealSelection = (mealType, index, mealId) => {
    setSelectedMeals((prev) => ({
      ...prev,
      [mealType]: prev[mealType].map((meal, i) =>
        i === index ? mealId : meal
      ),
    }));
  };

  const handleSaveChefSelection = async () => {
    try {
      setSavingMeals(true);

      const mealsToSave = {};
      Object.entries(selectedMeals).forEach(([mealType, mealIds]) => {
        mealsToSave[mealType] = mealIds
          .filter((mealId) => mealId !== "")
          .map((mealId) => {
            const mealsForType = availableMealsByType[mealType] || [];
            const meal = mealsForType.find((m) => m.id === mealId);
            return {
              selectedMealId: mealId,
              selectedMealTitle: meal?.title || "",
              selectedMealImage: meal?.image || "",
              mealType: mealType,
              isCustomized: false,
              selectedAt: new Date(),
            };
          });
      });

      // Update the database with today's date
      await updateMealSelectionsForDate(
        selectedOrder.userMealSelectionId,
        selectedOrder.todayDate,
        mealsToSave
      );

      await fetchTodayOrders();
      setOpenDialog(false);
      setSelectedOrder(null);
      setSelectedMeals({});
      setAvailableMealsByType({});

      console.log("✅ Chef selection for today saved successfully");
    } catch (err) {
      setError("Failed to save meal selection: " + err.message);
    } finally {
      setSavingMeals(false);
    }
  };

  // Status management functions
  const handleStatusUpdate = (order, date) => {
    setStatusUpdateDialog({ open: true, order: order, date: date });
  };

  const handleStatusUpdateClose = () => {
    setStatusUpdateDialog({ open: false, order: null, date: null });
  };

  const handleStatusUpdated = async () => {
    await fetchTodayOrders();
  };

  // Bulk status update functions
  const handleBulkStatusUpdate = () => {
    if (!bulkSelectionMode) {
      setBulkSelectionMode(true);
      return;
    }

    const selectedCount = getSelectedOrdersCount();
    if (selectedCount === 0) {
      setError("Please select at least one order for bulk status update");
      return;
    }

    setBulkStatusDialog({
      open: true,
      selectedStatus: "",
      reason: "",
      note: "",
    });
  };

  const handleBulkStatusSave = async () => {
    try {
      const { selectedStatus, reason, note } = bulkStatusDialog;

      if (!selectedStatus) {
        setError("Please select a status");
        return;
      }

      const selectedOrders = getSelectedOrders();
      if (selectedOrders.length === 0) {
        setError("Please select at least one order");
        return;
      }

      const today = getTodayDateISO();
      const adminUserId = "admin_user";

      setLoading(true);

      const updatePromises = selectedOrders.map((order) =>
        updateOrderDailyStatus(
          order.id,
          today,
          selectedStatus,
          adminUserId,
          note,
          true,
          reason
        )
      );

      await Promise.all(updatePromises);
      await fetchTodayOrders();

      setBulkStatusDialog({
        open: false,
        selectedStatus: "",
        reason: "",
        note: "",
      });
      setSelectedOrdersForBulk({});
      setBulkSelectionMode(false);

      console.log(
        `✅ Bulk status update completed: ${selectedOrders.length} orders updated to ${selectedStatus}`
      );
    } catch (error) {
      console.error("❌ Error in bulk status update:", error);
      setError("Failed to update order statuses: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  // Bulk selection helper functions
  const handleToggleBulkSelectionMode = () => {
    setBulkSelectionMode(!bulkSelectionMode);
    if (bulkSelectionMode) {
      setSelectedOrdersForBulk({});
    }
  };

  const handleToggleOrderSelection = (orderId) => {
    setSelectedOrdersForBulk((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleSelectAllOrders = () => {
    const allSelected = {};
    orders.forEach((order) => {
      allSelected[order.id] = true;
    });
    setSelectedOrdersForBulk(allSelected);
  };

  const handleDeselectAllOrders = () => {
    setSelectedOrdersForBulk({});
  };

  const getSelectedOrdersCount = () => {
    return Object.values(selectedOrdersForBulk).filter(Boolean).length;
  };

  const getSelectedOrders = () => {
    return orders.filter((order) => selectedOrdersForBulk[order.id]);
  };

  // Preparation functions
  const handleTogglePreparedStatus = (orderId) => {
    setPreparedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const handleMarkAllPrepared = () => {
    const allOrderIds = {};
    orders.forEach((order) => {
      allOrderIds[order.id] = true;
    });
    setPreparedOrders(allOrderIds);
  };

  const handleClearAllPrepared = () => {
    setPreparedOrders({});
  };

  // Holiday skip handler
  const handleHolidaySkip = () => {
    handleSelectAllOrders();
    setBulkStatusDialog({
      open: true,
      selectedStatus: ORDER_STATUSES.DELIVERY_SKIPPED,
      reason: SKIP_REASONS.HOLIDAY,
      note: "Service closed for holiday",
    });
  };

  // Handle expanding/collapsing order details
  const handleToggleOrderDetails = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  // Date helpers
  const getTodayDate = () => {
    return getDisplayDate();
  };

  const getTodayDateISO = () => {
    return getTodayLocalDate();
  };

  // Render meal selection dialog
  const renderMealSelectionDialog = () => {
    if (!selectedOrder) return null;

    return (
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6">
              Select Meals for Order #{selectedOrder.id.slice(-8)} (TODAY)
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Date: {new Date().toISOString().split("T")[0]} | Macro Plan:{" "}
              {selectedOrder.macroPlanId}
            </Typography>
            {selectedOrder.allergies && selectedOrder.allergies.length > 0 && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  Customer allergies:{" "}
                  {selectedOrder.allergies
                    .map((id) => allergyNames.get(id) || id)
                    .join(", ")}
                </Typography>
              </Alert>
            )}
            {loadingMeals && (
              <Box display="flex" alignItems="center" gap={1} sx={{ mt: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Loading today's menu...</Typography>
              </Box>
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {loadingMeals ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            Object.entries(selectedMeals).map(([mealType, mealIds]) => {
              const mealsForType = availableMealsByType[mealType] || [];

              return (
                <Box key={mealType} mb={3}>
                  <Typography
                    variant="h6"
                    sx={{ textTransform: "capitalize", mb: 2 }}
                  >
                    {mealType} ({mealIds.length} required)
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mb: 2 }}
                  >
                    {mealsForType.length} meals available for today
                  </Typography>
                  {mealIds.map((selectedMealId, index) => (
                    <FormControl fullWidth sx={{ mb: 2 }} key={index}>
                      <InputLabel>{`${mealType} ${index + 1}`}</InputLabel>
                      <Select
                        value={selectedMealId}
                        onChange={(e) =>
                          handleMealSelection(mealType, index, e.target.value)
                        }
                        input={
                          <OutlinedInput label={`${mealType} ${index + 1}`} />
                        }
                      >
                        <MenuItem value="">
                          <em>Select a meal</em>
                        </MenuItem>
                        {mealsForType.map((meal) => (
                          <MenuItem key={meal.id} value={meal.id}>
                            {meal.title}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  ))}
                </Box>
              );
            })
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSaveChefSelection}
            variant="contained"
            disabled={savingMeals || loadingMeals}
          >
            {savingMeals ? <CircularProgress size={20} /> : "Save Selection"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  };

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="400px"
      >
        <CircularProgress />
      </Box>
    );
  }

  const userSkipped = orders.filter(
    (order) => order.preparationStatus.status === "user_skipped"
  ).length;

  const preparedCount = Object.values(preparedOrders).filter(Boolean).length;

  return (
    <Box>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" gutterBottom>
          Today's Orders Dashboard
        </Typography>
        <Box display="flex" alignItems="center" gap={1}>
          <TodayIcon />
          <Typography variant="h6">{getTodayDate()}</Typography>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Preparation Progress Indicator */}
      <PreparationProgressIndicator
        preparedCount={preparedCount}
        totalOrders={orders.length}
      />

      {/* Statistics Grid */}
      <OrderStatsGrid orders={orders} userSkipped={userSkipped} />

      {orders.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: "center" }}>
          <Typography variant="h6" color="text.secondary">
            No orders scheduled for today's delivery
          </Typography>
        </Paper>
      ) : (
        <>
          {/* Print Meal Preparations Button */}
          <Box
            sx={{
              mb: 3,
              display: "flex",
              gap: 2,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <MealSelectionsPrinter
              orders={orders}
              date={getTodayDateISO()}
              componentNames={componentNames}
              allergyNames={allergyNames}
            />
          </Box>

          {/* Bulk Actions Toolbar */}
          <BulkActionsToolbar
            showPreparationActions={true}
            preparedCount={preparedCount}
            totalOrders={orders.length}
            onMarkAllPrepared={handleMarkAllPrepared}
            onClearAllPrepared={handleClearAllPrepared}
            bulkSelectionMode={bulkSelectionMode}
            selectedOrdersCount={getSelectedOrdersCount()}
            onToggleBulkSelection={handleToggleBulkSelectionMode}
            onSelectAllOrders={handleSelectAllOrders}
            onDeselectAllOrders={handleDeselectAllOrders}
            onBulkStatusUpdate={handleBulkStatusUpdate}
            onHolidaySkip={handleHolidaySkip}
          />

          {/* Meal Categories Display */}
          <MealCategoriesDisplay
            orders={orders}
            allergyNames={allergyNames}
            componentNames={componentNames}
          />

          {/* Status Statistics */}
          <StatusStatistics
            orders={orders}
            date={getTodayDateISO()}
            title="Today's Order Status Overview"
          />

          {/* Orders List */}
          <OrdersList
            orders={orders}
            date={getTodayDateISO()}
            allergyNames={allergyNames}
            allergies={allergies}
            componentNames={componentNames}
            // Preparation features
            showPreparationCheckbox={true}
            preparedOrders={preparedOrders}
            onTogglePreparedStatus={handleTogglePreparedStatus}
            // Bulk selection features
            bulkSelectionMode={bulkSelectionMode}
            selectedOrdersForBulk={selectedOrdersForBulk}
            onToggleOrderSelection={handleToggleOrderSelection}
            // Status management
            onStatusUpdate={handleStatusUpdate}
            onStatusUpdated={handleStatusUpdated}
            onChefSelection={handleChefSelection}
            adminUserId="admin_user"
            // Expandable details
            expandedOrders={expandedOrders}
            onToggleOrderDetails={handleToggleOrderDetails}
          />
        </>
      )}

      {/* Meal Selection Dialog */}
      {renderMealSelectionDialog()}

      {/* Status Update Dialog */}
      <StatusUpdateDialog
        open={statusUpdateDialog.open}
        onClose={handleStatusUpdateClose}
        order={statusUpdateDialog.order}
        date={statusUpdateDialog.date}
        onStatusUpdated={handleStatusUpdated}
        adminUserId="admin_user"
      />

      {/* Bulk Status Update Dialog */}
      <BulkStatusUpdateDialog
        open={bulkStatusDialog.open}
        onClose={() =>
          setBulkStatusDialog({
            open: false,
            selectedStatus: "",
            reason: "",
            note: "",
          })
        }
        selectedOrders={getSelectedOrders()}
        date={getTodayDateISO()}
        loading={loading}
        selectedStatus={bulkStatusDialog.selectedStatus}
        reason={bulkStatusDialog.reason}
        note={bulkStatusDialog.note}
        onStatusChange={(status) =>
          setBulkStatusDialog((prev) => ({ ...prev, selectedStatus: status }))
        }
        onReasonChange={(reason) =>
          setBulkStatusDialog((prev) => ({ ...prev, reason }))
        }
        onNoteChange={(note) =>
          setBulkStatusDialog((prev) => ({ ...prev, note }))
        }
        onSave={handleBulkStatusSave}
      />
    </Box>
  );
};

export default TodayOrders;
