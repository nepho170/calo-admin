import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Chip,
  TablePagination,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
} from "@mui/icons-material";
import { labelsService, labelValidation } from "../services/labels";

export default function Labels() {
  const [labels, setLabels] = useState([]);
  const [filteredLabels, setFilteredLabels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Dialog states
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState("add");
  const [currentLabel, setCurrentLabel] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    order: 0,
    isActive: true,
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadLabels();
  }, []);

  useEffect(() => {
    filterLabels();
  }, [labels, searchTerm, activeTab]);

  const loadLabels = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await labelsService.getAll();
      // Sort by order and then by name
      const sortedData = data.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
      });
      setLabels(sortedData);
    } catch (err) {
      console.error("Error loading labels:", err);
      setError("Failed to load labels. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const filterLabels = () => {
    let filtered = labels;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((label) =>
        label.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by active status based on tab
    if (activeTab === 0) {
      filtered = filtered.filter((label) => label.isActive);
    } else if (activeTab === 1) {
      filtered = filtered.filter((label) => !label.isActive);
    }

    setFilteredLabels(filtered);
  };

  const handleOpenDialog = (mode, label = null) => {
    setDialogMode(mode);
    setCurrentLabel(label);
    if (mode === "add") {
      setFormData({
        name: "",
        order: labels.length,
        isActive: true,
      });
    } else if (mode === "edit" && label) {
      setFormData({
        name: label.name,
        order: label.order,
        isActive: label.isActive,
      });
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentLabel(null);
    setFormData({
      name: "",
      order: 0,
      isActive: true,
    });
    setFormErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({
        ...prev,
        [field]: null,
      }));
    }
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      setFormErrors({});

      // Use validation
      const validation = labelValidation.validateLabel(formData);
      if (!validation.isValid) {
        const errors = {};
        validation.errors.forEach((error) => {
          errors.general = error;
        });
        setFormErrors(errors);
        return;
      }

      let result;
      if (dialogMode === "add") {
        result = await labelsService.add(formData, "admin");
      } else {
        result = await labelsService.update(currentLabel.id, formData);
      }

      if (result) {
        await loadLabels();
        handleCloseDialog();
      }
    } catch (error) {
      console.error("Error saving label:", error);
      setFormErrors({ general: "Failed to save label. Please try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (labelId) => {
    if (window.confirm("Are you sure you want to delete this label?")) {
      try {
        await labelsService.delete(labelId);
        await loadLabels();
      } catch (error) {
        console.error("Error deleting label:", error);
        setError("Failed to delete label. Please try again.");
      }
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const renderLabelCard = (label) => (
    <Card
      key={label.id}
      sx={{ height: "100%", display: "flex", flexDirection: "column" }}
    >
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="h6"
          component="h3"
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          {label.name}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Order: {label.order}
        </Typography>
      </CardContent>
      <CardActions sx={{ justifyContent: "space-between", px: 2, pb: 2 }}>
        <Box>
          <Chip
            label={label.isActive ? "Active" : "Inactive"}
            color={label.isActive ? "success" : "default"}
            size="small"
          />
        </Box>
        <Box>
          <IconButton
            onClick={() => handleOpenDialog("edit", label)}
            color="primary"
          >
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(label.id)} color="error">
            <DeleteIcon />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  const renderDialog = () => (
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="sm"
      fullWidth
    >
      <DialogTitle>
        {dialogMode === "add" ? "Add New Label" : "Edit Label"}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          {formErrors.general && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {formErrors.general}
            </Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Label Name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
              />
            </Grid>
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="Display Order"
                type="number"
                value={formData.order}
                onChange={(e) =>
                  handleInputChange("order", Number(e.target.value))
                }
                InputProps={{ inputProps: { min: 0 } }}
                helperText="Lower numbers appear first"
              />
            </Grid>
            <Grid item xs={6}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={formData.isActive}
                    onChange={(e) =>
                      handleInputChange("isActive", e.target.checked)
                    }
                  />
                }
                label="Active"
                sx={{ mt: 2 }}
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={20} /> : null}
        >
          {dialogMode === "add" ? "Add Label" : "Update Label"}
        </Button>
      </DialogActions>
    </Dialog>
  );

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

  const paginatedLabels = filteredLabels.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  return (
    <Box sx={{ flexGrow: 1 }}>
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
            Labels Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage labels for your meals.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog("add")}
          size="large"
        >
          Add New Label
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
        >
          <Tab
            label={`Active Labels (${labels.filter((l) => l.isActive).length})`}
          />
          <Tab
            label={`Inactive Labels (${
              labels.filter((l) => !l.isActive).length
            })`}
          />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search labels..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredLabels.length} of {labels.length} labels
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Labels Grid */}
      <Grid container spacing={3}>
        {paginatedLabels.map((label) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={label.id}>
            {renderLabelCard(label)}
          </Grid>
        ))}
      </Grid>

      {/* Pagination */}
      <Paper sx={{ mt: 3 }}>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredLabels.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>

      {filteredLabels.length === 0 && (
        <Paper sx={{ p: 4, textAlign: "center", mt: 3 }}>
          <Typography variant="h6" color="text.secondary">
            No labels found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm
              ? "Try adjusting your search criteria."
              : "Get started by adding your first label."}
          </Typography>
        </Paper>
      )}

      {renderDialog()}
    </Box>
  );
}
