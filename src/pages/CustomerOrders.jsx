import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Divider,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Restaurant as RestaurantIcon,
  Person as PersonIcon,
  DateRange as DateIcon,
  AttachMoney as MoneyIcon,
  LocalDining as MealIcon,
  Cancel as CancelIcon,
} from "@mui/icons-material";
import {
  collection,
  getDocs,
  query,
  orderBy,
  where,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../configs/firebase";

const CustomerOrdersView = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [error, setError] = useState("");
  const [cancelLoading, setCancelLoading] = useState(false);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [orderToCancel, setOrderToCancel] = useState(null);

  // Load customer orders from Firestore
  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError("");

      let ordersQuery = query(
        collection(db, "orders"),
        orderBy("createdAt", "desc"),
        limit(100)
      );

      if (statusFilter === "active") {
        ordersQuery = query(
          collection(db, "orders"),
          where("isActive", "==", true),
          orderBy("createdAt", "desc"),
          limit(100)
        );
      } else if (statusFilter === "cancelled") {
        ordersQuery = query(
          collection(db, "orders"),
          where("isActive", "==", false),
          orderBy("createdAt", "desc"),
          limit(100)
        );
      }

      const querySnapshot = await getDocs(ordersQuery);
      const ordersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt:
          doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt),
      }));

      setOrders(ordersData);
    } catch (err) {
      console.error("Error fetching customer orders:", err);
      setError(
        "Failed to load customer orders. Make sure the orders collection exists."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setDetailsOpen(true);
  };

  const handleCancelOrderClick = (orderId) => {
    setOrderToCancel(orderId);
    setConfirmCancelOpen(true);
  };

  const handleConfirmCancel = () => {
    if (orderToCancel) {
      handleCancelOrder(orderToCancel);
    }
    setConfirmCancelOpen(false);
    setOrderToCancel(null);
  };

  const handleCancelOrder = async (orderId) => {
    try {
      setCancelLoading(true);

      // Update the order
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        isActive: false,
        cancelledAt: new Date(),
        cancelledBy: "admin",
        reasonOfInactivation: "cancelled",
      });

      // Find and update the corresponding userMealSelection
      const userMealSelectionsQuery = query(
        collection(db, "userMealSelections"),
        where("orderId", "==", orderId)
      );
      const userMealSelectionsSnapshot = await getDocs(userMealSelectionsQuery);

      // Update userMealSelections if they exist
      if (!userMealSelectionsSnapshot.empty) {
        const updatePromises = userMealSelectionsSnapshot.docs.map((doc) => {
          const userMealSelectionRef = doc.ref;
          return updateDoc(userMealSelectionRef, {
            isActive: false,
            cancelledAt: new Date(),
            cancelledBy: "admin",
          });
        });
        await Promise.all(updatePromises);
        console.log(
          `Updated ${updatePromises.length} userMealSelection(s) for order ${orderId}`
        );
      }

      // Update local state
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                isActive: false,
                cancelledAt: new Date(),
                cancelledBy: "admin",
                reasonOfInactivation: "cancelled",
              }
            : order
        )
      );

      // Close dialog if the cancelled order is currently being viewed
      if (selectedOrder?.id === orderId) {
        setDetailsOpen(false);
      }

      // Close confirmation dialog
      setConfirmCancelOpen(false);
      setOrderToCancel(null);
    } catch (err) {
      console.error("Error cancelling order:", err);
      setError("Failed to cancel order. Please try again.");
    } finally {
      setCancelLoading(false);
    }
  };

  const getStatusColor = (isActive, reasonOfInactivation = "") => {
    if (isActive) return "success";

    switch (reasonOfInactivation) {
      case "cancelled":
        return "error";
      case "expired":
        return "warning";
      default:
        return "default";
    }
  };

  const getStatusLabel = (isActive, reasonOfInactivation = "") => {
    if (isActive) return "Active";

    // Return specific reason if available
    switch (reasonOfInactivation) {
      case "cancelled":
        return "Cancelled";
      case "expired":
        return "Expired";
      default:
        return "Inactive";
    }
  };

  const formatDate = (date) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const calculateTotalMeals = (includedMealTypes) => {
    if (!includedMealTypes || !Array.isArray(includedMealTypes)) return 0;
    return includedMealTypes.length;
  };

  const formatDeliveryDays = (selectedDays) => {
    if (!selectedDays || !Array.isArray(selectedDays)) return "N/A";
    return selectedDays.join(", ");
  };

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
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ fontWeight: "bold" }}
          >
            Customer Orders
          </Typography>
          <Typography variant="body1" color="text.secondary">
            View and manage customer package customizations
          </Typography>
        </Box>

        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="cancelled">Cancelled</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <PersonIcon color="primary" />
                <Box>
                  <Typography variant="h6">{orders.length}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <RestaurantIcon color="success" />
                <Box>
                  <Typography variant="h6">
                    {orders.filter((o) => o.isActive === true).length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Orders
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <MealIcon color="warning" />
                <Box>
                  <Typography variant="h6">
                    {orders.reduce(
                      (sum, o) =>
                        sum +
                        calculateTotalMeals(
                          o.selectedPackage?.includedMealTypes
                        ),
                      0
                    )}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Meal Types
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <MoneyIcon color="info" />
                <Box>
                  <Typography variant="h6">
                    AED
                    {orders
                      .filter((o) => o.isActive)
                      .reduce(
                        (sum, o) => sum + (o.selectedPackage?.pricePerDay || 0),
                        0
                      )
                      .toFixed(0)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Active Revenue/Day
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>

      {/* Orders Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Recent Orders
          </Typography>

          {orders.length === 0 ? (
            <Alert severity="info">
              No customer orders found. Orders will appear here when customers
              place orders through the app.
            </Alert>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Customer</TableCell>

                    <TableCell>Order ID</TableCell>
                    <TableCell>Package</TableCell>
                    <TableCell>Delivery Days</TableCell>
                    <TableCell>Delivery Time</TableCell>
                    <TableCell>Price/Day</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Start Date</TableCell>
                    <TableCell>Created At</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {order.address?.firstName} {order.address?.lastName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {order.customerId}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <RestaurantIcon color="primary" />
                          <Typography variant="body2">
                            {order.id || "Unknown Order"}
                          </Typography>
                        </Box>
                      </TableCell>

                      <TableCell>
                        <Box>
                          <Typography variant="body2" fontWeight="bold">
                            {order.selectedPackage?.title || "Unknown Package"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {order.selectedMacroPlan?.title || "No macro plan"}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDeliveryDays(order.selectedDays)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={order.deliveryTime || "Not specified"}
                          size="small"
                          variant="outlined"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          AED {order.selectedPackage?.pricePerDay || 0}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={getStatusLabel(
                            order.isActive,
                            order.reasonOfInactivation
                          )}
                          color={getStatusColor(
                            order.isActive,
                            order.reasonOfInactivation
                          )}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(order.startDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(order.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewDetails(order)}
                          >
                            View
                          </Button>
                          {order.isActive && (
                            <Button
                              size="small"
                              color="error"
                              startIcon={<CancelIcon />}
                              onClick={() => handleCancelOrderClick(order.id)}
                              disabled={cancelLoading}
                            >
                              Cancel
                            </Button>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Order Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Order Details</DialogTitle>
        <DialogContent dividers>
          {selectedOrder && (
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Customer Information
                </Typography>
                <Typography variant="body2">
                  <strong>Name:</strong> {selectedOrder.address.firstName}{" "}
                  {selectedOrder.address.lastName}
                </Typography>
                <Typography variant="body2">
                  <strong>Customer ID:</strong> {selectedOrder.customerId}
                </Typography>
                <Typography variant="body2">
                  <strong>Order Date:</strong>{" "}
                  {formatDate(selectedOrder.createdAt)}
                </Typography>
                <Typography variant="body2">
                  <strong>Start Date:</strong>{" "}
                  {formatDate(selectedOrder.startDate)}
                </Typography>
                <Typography variant="body2">
                  <strong>Subscription:</strong>{" "}
                  {selectedOrder.selectedSubscriptionPlan || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong>{" "}
                  <Chip
                    label={getStatusLabel(
                      selectedOrder.isActive,
                      selectedOrder.reasonOfInactivation
                    )}
                    color={getStatusColor(
                      selectedOrder.isActive,
                      selectedOrder.reasonOfInactivation
                    )}
                    size="small"
                  />
                </Typography>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Delivery Information
                </Typography>
                <Typography variant="body2">
                  <strong>Address:</strong> {selectedOrder.address?.building},{" "}
                  {selectedOrder.address?.flat}
                </Typography>
                <Typography variant="body2">
                  <strong>Area:</strong> {selectedOrder.address?.area}
                </Typography>
                <Typography variant="body2">
                  <strong>Street:</strong>{" "}
                  {selectedOrder.address?.street || "N/A"}
                </Typography>
                <Typography variant="body2">
                  <strong>Delivery Time:</strong> {selectedOrder.deliveryTime}
                </Typography>
                <Typography variant="body2">
                  <strong>Delivery Days:</strong>{" "}
                  {formatDeliveryDays(selectedOrder.selectedDays)}
                </Typography>
                {selectedOrder.instructions?.customNote && (
                  <Typography variant="body2">
                    <strong>Instructions:</strong>{" "}
                    {selectedOrder.instructions.customNote}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Package Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2">
                      <strong>Package:</strong>{" "}
                      {selectedOrder.selectedPackage?.title || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Macro Plan:</strong>{" "}
                      {selectedOrder.selectedMacroPlan?.title || "N/A"}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Price per Day:</strong> AED
                      {selectedOrder.selectedPackage?.pricePerDay || 0}
                    </Typography>
                    <Typography variant="body2">
                      <strong>Total Order Value:</strong> AED
                      {selectedOrder.total || 0}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    {selectedOrder.selectedPackage?.calorieRange && (
                      <Typography variant="body2">
                        <strong>Calorie Range:</strong>{" "}
                        {selectedOrder.selectedPackage.calorieRange.min} -{" "}
                        {selectedOrder.selectedPackage.calorieRange.max}{" "}
                        calories
                      </Typography>
                    )}
                    <Typography variant="body2">
                      <strong>Included Meals:</strong>{" "}
                      {selectedOrder.selectedPackage?.includedMealTypes?.join(
                        ", "
                      ) || "N/A"}
                    </Typography>
                    {selectedOrder.allergies &&
                      selectedOrder.allergies.length > 0 && (
                        <Typography variant="body2">
                          <strong>Allergies:</strong>{" "}
                          {selectedOrder.allergies.join(", ")}
                        </Typography>
                      )}
                  </Grid>
                </Grid>
              </Grid>

              {selectedOrder.instructions && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    Delivery Instructions
                  </Typography>
                  <Typography variant="body2">
                    <strong>Call customer:</strong>{" "}
                    {selectedOrder.instructions.call ? "Yes" : "No"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Ring bell:</strong>{" "}
                    {selectedOrder.instructions.ringBell ? "Yes" : "No"}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Leave at door:</strong>{" "}
                    {selectedOrder.instructions.leaveAtDoor ? "Yes" : "No"}
                  </Typography>
                  {selectedOrder.instructions.customNote && (
                    <Typography variant="body2">
                      <strong>Custom note:</strong>{" "}
                      {selectedOrder.instructions.customNote}
                    </Typography>
                  )}
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          {selectedOrder?.isActive && (
            <Button
              onClick={() => handleCancelOrderClick(selectedOrder.id)}
              color="error"
              disabled={cancelLoading}
              startIcon={<CancelIcon />}
            >
              {cancelLoading ? "Cancelling..." : "Cancel Order"}
            </Button>
          )}
          <Button onClick={() => setDetailsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Confirm Order Cancellation</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel this order? This action cannot be
            undone. The order and associated meal selections will be marked as
            inactive.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setConfirmCancelOpen(false)}
            disabled={cancelLoading}
          >
            Keep Order
          </Button>
          <Button
            onClick={handleConfirmCancel}
            color="error"
            variant="contained"
            disabled={cancelLoading}
            startIcon={<CancelIcon />}
          >
            {cancelLoading ? "Cancelling..." : "Yes, Cancel Order"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CustomerOrdersView;
