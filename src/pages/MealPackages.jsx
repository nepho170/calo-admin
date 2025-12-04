import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  CardActions,
  Chip,
  Alert,
  Paper,
  IconButton,
  CircularProgress,
  Snackbar,
  Switch,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Star as StarIcon,
  Coffee as CoffeeIcon,
  DinnerDining as DinnerIcon,
  LocalDining as LocalDiningIcon,
  Fastfood as FastfoodIcon,
  Inventory as InventoryIcon,
} from "@mui/icons-material";
import { mealPackagesService } from "../services/mealPackages";
import { macroPlansService } from "../services/macroPlans";
import MealPackageEditor from "../components/MealPackageEditor";

const MEAL_TYPE_ICONS = {
  breakfast: <CoffeeIcon />,
  lunch: <LocalDiningIcon />,
  dinner: <DinnerIcon />,
  snack: <FastfoodIcon />,
};

const MEAL_TYPE_LABELS = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
  snack: "Snack",
};

const MealPackageCard = ({
  package: pkg,
  onEdit,
  onDelete,
  onToggleActive,
  macroPlan,
}) => {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {pkg.image && (
        <Box
          component="img"
          sx={{
            height: 200,
            width: "100%",
            objectFit: "cover",
          }}
          src={pkg.image}
          alt={pkg.title}
        />
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
          <Typography variant="h6" component="h2" sx={{ flexGrow: 1 }}>
            {pkg.title}
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            {pkg.isPopular && (
              <Chip
                icon={<StarIcon />}
                label="Popular"
                color="primary"
                size="small"
              />
            )}
            <Switch
              checked={pkg.isActive}
              onChange={() => onToggleActive(pkg.id, !pkg.isActive)}
              size="small"
            />
          </Box>
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {pkg.description}
        </Typography>

        <Paper sx={{ p: 2, mb: 2, backgroundColor: "grey.50" }}>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Included Meal Types
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {(pkg.includedMealTypes || []).map((type) => (
              <Chip
                key={type}
                icon={MEAL_TYPE_ICONS[type]}
                label={MEAL_TYPE_LABELS[type]}
                size="small"
                variant="outlined"
              />
            ))}
          </Box>
        </Paper>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Price per day
          </Typography>
          <Typography variant="h6" color="primary">
            ${pkg.pricePerDay}
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Calories Range
          </Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Typography variant="body2">
              {pkg.calorieRange?.min} - {pkg.calorieRange?.max} cal
            </Typography>
            {pkg.isAutoCalculated && (
              <Chip
                label="Auto"
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>
        </Box>

        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            Macro Plan
          </Typography>
          <Chip
            label={macroPlan?.title || "Unknown Plan"}
            size="small"
            color="secondary"
            variant="outlined"
          />
        </Box>

        {pkg.features && pkg.features.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Features
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
              {pkg.features.map((feature, index) => (
                <Chip
                  key={index}
                  label={feature}
                  size="small"
                  color="info"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}
      </CardContent>

      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Order: {pkg.order}
        </Typography>
        <Box>
          <IconButton onClick={() => onEdit(pkg)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => onDelete(pkg.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );
};

export default function MealPackages() {
  const [packages, setPackages] = useState([]);
  const [macroPlans, setMacroPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const [packagesData, plansData] = await Promise.all([
        mealPackagesService.getAll(),
        macroPlansService.getAll(),
      ]);
      setPackages(packagesData.sort((a, b) => a.order - b.order));
      setMacroPlans(plansData);
    } catch (error) {
      console.error("Error fetching meal packages:", error);
      setSnackbar({
        open: true,
        message: "Error loading meal packages",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddPackage = () => {
    setSelectedPackage(null);
    setDialogOpen(true);
  };

  const handleEditPackage = (pkg) => {
    setSelectedPackage(pkg);
    setDialogOpen(true);
  };

  const handleDeletePackage = async (packageId) => {
    if (!window.confirm("Are you sure you want to delete this meal package?")) {
      return;
    }

    try {
      await mealPackagesService.delete(packageId);
      setSnackbar({
        open: true,
        message: "Meal package deleted successfully",
        severity: "success",
      });
      fetchPackages();
    } catch (error) {
      console.error("Error deleting meal package:", error);
      setSnackbar({
        open: true,
        message: "Error deleting meal package",
        severity: "error",
      });
    }
  };

  const handleToggleActive = async (packageId, isActive) => {
    try {
      await mealPackagesService.update(packageId, { isActive });
      setSnackbar({
        open: true,
        message: `Meal package ${
          isActive ? "activated" : "deactivated"
        } successfully`,
        severity: "success",
      });
      fetchPackages();
    } catch (error) {
      console.error("Error updating meal package:", error);
      setSnackbar({
        open: true,
        message: "Error updating meal package",
        severity: "error",
      });
    }
  };

  const handleSavePackage = async (packageData) => {
    try {
      if (selectedPackage) {
        await mealPackagesService.update(selectedPackage.id, packageData);
        setSnackbar({
          open: true,
          message: "Meal package updated successfully",
          severity: "success",
        });
      } else {
        await mealPackagesService.add(packageData);
        setSnackbar({
          open: true,
          message: "Meal package added successfully",
          severity: "success",
        });
      }
      fetchPackages();
    } catch (error) {
      console.error("Error saving meal package:", error);
      setSnackbar({
        open: true,
        message: "Error saving meal package",
        severity: "error",
      });
      throw error;
    }
  };

  const getMacroPlan = (packageItem) => {
    return macroPlans.find((plan) => plan.id === packageItem.macroPlanId);
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
    <Box sx={{ flexGrow: 1 }}>
      {/* Header Section */}
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
            Meal Packages Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Create and manage meal packages for different customer needs.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleAddPackage}
        >
          Add Meal Package
        </Button>
      </Box>

      {/* Content Section */}
      {packages.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <InventoryIcon
            sx={{ fontSize: 64, color: "text.secondary", mb: 2 }}
          />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No meal packages found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start by adding your first meal package to offer complete meal
            solutions.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleAddPackage}
          >
            Add Your First Meal Package
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {packages.map((pkg) => (
            <Grid item xs={12} md={6} lg={4} key={pkg.id}>
              <MealPackageCard
                package={pkg}
                onEdit={handleEditPackage}
                onDelete={handleDeletePackage}
                onToggleActive={handleToggleActive}
                macroPlan={getMacroPlan(pkg)}
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Meal Package Editor Dialog */}
      <MealPackageEditor
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        package={selectedPackage}
        onSave={handleSavePackage}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
