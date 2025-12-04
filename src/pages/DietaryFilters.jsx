import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Snackbar,
  Tooltip,
  Fab,
  Chip,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FilterList as FilterIcon,
} from "@mui/icons-material";

import {
  getAllDietaryFilters,
  createDietaryFilter,
  updateDietaryFilter,
  deleteDietaryFilter,
} from "../services/dietaryFilters.js";

const DietaryFilters = () => {
  const [filters, setFilters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingFilter, setEditingFilter] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  const [formData, setFormData] = useState({
    name: "",
    filterKey: "",
    icon: "",
    description: "",
    order: 0,
  });

  useEffect(() => {
    loadFilters();
  }, []);

  const loadFilters = async () => {
    setLoading(true);
    try {
      const data = await getAllDietaryFilters();
      setFilters(data);
    } catch (error) {
      showSnackbar("Error loading dietary filters", "error");
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, severity = "success") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      filterKey: "",
      icon: "",
      description: "",
      order: filters.length,
    });
    setEditingFilter(null);
  };

  const handleOpenDialog = (filter = null) => {
    if (filter) {
      setEditingFilter(filter);
      setFormData({
        name: filter.name,
        filterKey: filter.filterKey,
        icon: filter.icon,
        description: filter.description,
        order: filter.order,
      });
    } else {
      resetForm();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    resetForm();
  };

  const handleSaveFilter = async () => {
    try {
      if (editingFilter) {
        await updateDietaryFilter(editingFilter.id, formData);
        showSnackbar("Dietary filter updated successfully");
      } else {
        await createDietaryFilter(formData);
        showSnackbar("Dietary filter created successfully");
      }

      handleCloseDialog();
      loadFilters();
    } catch (error) {
      showSnackbar("Error saving dietary filter", "error");
    }
  };

  const handleDeleteFilter = async (filterId) => {
    if (
      window.confirm("Are you sure you want to delete this dietary filter?")
    ) {
      try {
        await deleteDietaryFilter(filterId);
        showSnackbar("Dietary filter deleted successfully");
        loadFilters();
      } catch (error) {
        showSnackbar("Error deleting dietary filter", "error");
      }
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 3,
        }}
      >
        <Typography variant="h4" component="h1">
          🏷️ Dietary Filters
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Add Filter
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Dietary filters allow customers to exclude certain meal categories (like
        fish, meat, dairy) from their meal plans. The filter key must match the
        dietaryCategories in meal data.
      </Alert>

      <Grid container spacing={3}>
        {filters.map((filter) => (
          <Grid item xs={12} md={6} lg={4} key={filter.id}>
            <Card
              sx={{ height: "100%", display: "flex", flexDirection: "column" }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                  <Typography variant="h2" sx={{ mr: 2, fontSize: "2rem" }}>
                    {filter.icon}
                  </Typography>
                  <Typography variant="h6" component="h2">
                    {filter.name}
                  </Typography>
                </Box>

                <Chip
                  label={`Filter Key: ${filter.filterKey}`}
                  size="small"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />

                <Typography variant="body2" color="text.secondary">
                  {filter.description}
                </Typography>
              </CardContent>

              <CardActions>
                <Tooltip title="Edit Filter">
                  <IconButton
                    size="small"
                    onClick={() => handleOpenDialog(filter)}
                  >
                    <EditIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Delete Filter">
                  <IconButton
                    size="small"
                    onClick={() => handleDeleteFilter(filter.id)}
                    color="error"
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {filters.length === 0 && !loading && (
        <Box sx={{ textAlign: "center", py: 6 }}>
          <FilterIcon sx={{ fontSize: 64, color: "text.secondary", mb: 2 }} />
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No dietary filters found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create dietary filters to help customers exclude specific meal
            categories.
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Create First Filter
          </Button>
        </Box>
      )}

      <Fab
        color="primary"
        aria-label="add filter"
        sx={{ position: "fixed", bottom: 16, right: 16 }}
        onClick={() => handleOpenDialog()}
      >
        <AddIcon />
      </Fab>

      {/* Create/Edit Filter Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          {editingFilter ? "Edit Dietary Filter" : "Create New Dietary Filter"}
        </DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Filter Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            margin="normal"
            required
            placeholder="e.g., No Fish"
          />

          <TextField
            fullWidth
            label="Filter Key"
            value={formData.filterKey}
            onChange={(e) =>
              setFormData({ ...formData, filterKey: e.target.value })
            }
            margin="normal"
            required
            placeholder="e.g., fish"
            helperText="Must match values in meal dietaryCategories array"
          />

          <TextField
            fullWidth
            label="Icon (Emoji)"
            value={formData.icon}
            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
            margin="normal"
            placeholder="e.g., 🐟"
            helperText="Use an emoji to represent this filter"
          />

          <TextField
            fullWidth
            label="Description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            margin="normal"
            multiline
            rows={3}
            placeholder="e.g., Excludes all fish and seafood meals"
          />

          <TextField
            fullWidth
            type="number"
            label="Display Order"
            value={formData.order}
            onChange={(e) =>
              setFormData({ ...formData, order: parseInt(e.target.value) || 0 })
            }
            margin="normal"
            helperText="Lower numbers appear first"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button
            onClick={handleSaveFilter}
            variant="contained"
            disabled={!formData.name.trim() || !formData.filterKey.trim()}
          >
            {editingFilter ? "Update" : "Create"} Filter
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default DietaryFilters;
