import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Paper,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  ToggleOn as ToggleOnIcon,
  ToggleOff as ToggleOffIcon,
} from "@mui/icons-material";
import { allergiesService } from "../services/allergies";

const Allergies = () => {
  const [allergies, setAllergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAllergy, setEditingAllergy] = useState(null);

  useEffect(() => {
    loadAllergies();
  }, []);

  const loadAllergies = async () => {
    try {
      setLoading(true);
      const data = await allergiesService.getAll();
      setAllergies(data);
    } catch (error) {
      console.error("Error loading allergies:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAllergy = async (allergyData) => {
    try {
      await allergiesService.add(allergyData);
      setShowCreateModal(false);
      loadAllergies();
    } catch (error) {
      console.error("Error creating allergy:", error);
    }
  };

  const handleUpdateAllergy = async (allergyData) => {
    try {
      await allergiesService.update(editingAllergy.id, allergyData);
      setEditingAllergy(null);
      loadAllergies();
    } catch (error) {
      console.error("Error updating allergy:", error);
    }
  };

  const handleToggleActive = async (allergyId) => {
    try {
      await allergiesService.toggleActive(allergyId);
      loadAllergies();
    } catch (error) {
      console.error("Error toggling allergy:", error);
    }
  };

  const handleDeleteAllergy = async (allergyId) => {
    if (window.confirm("Are you sure you want to delete this allergy?")) {
      try {
        await allergiesService.delete(allergyId);
        loadAllergies();
      } catch (error) {
        console.error("Error deleting allergy:", error);
      }
    }
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

  return (
  <Box sx={{ width: '60vw', px: 2, py: 2 }}>
    <Box sx={{ maxWidth: '1200px', mx: 'auto' }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h4" component="h1" fontWeight="bold">
          Allergies Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setShowCreateModal(true)}
        >
          Add Allergy
        </Button>
      </Box>

      </Box>
      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
<Grid item xs={12} md={12}>
<Card sx={{ width: '100%' }}>
            <CardContent>
              <Typography
                variant="h6"
                component="h3"
                color="text.secondary"
                gutterBottom
              >
                Total Allergies
              </Typography>
              <Typography variant="h3" component="p" color="primary">
                {allergies.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
  <Grid item xs={12} md={12}>
    <Card sx={{ width: '100%' }}>
            <CardContent>
              <Typography
                variant="h6"
                component="h3"
                color="text.secondary"
                gutterBottom
              >
                Active Allergies
              </Typography>
              <Typography variant="h3" component="p" color="success.main">
                {allergies.filter((a) => a.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Allergies Table */}
      <Paper>
        <Box sx={{ p: 2, borderBottom: 1, borderColor: "divider" }}>
          <Typography variant="h6" component="h2">
            All Allergies
          </Typography>
        </Box>

        {allergies.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 6 }}>
            <Typography variant="body1" color="text.secondary" gutterBottom>
              No allergies found.
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setShowCreateModal(true)}
              sx={{ mt: 2 }}
            >
              Add Your First Allergy
            </Button>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Icon</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allergies.map((allergy) => (
                  <TableRow key={allergy.id} hover>
                    <TableCell>
                      <Typography variant="h4">{allergy.icon}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body1" fontWeight="medium">
                        {allergy.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={allergy.isActive ? "Active" : "Inactive"}
                        color={allergy.isActive ? "success" : "error"}
                        variant="outlined"
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" gap={1} justifyContent="flex-end">
                        <IconButton
                          size="small"
                          onClick={() => setEditingAllergy(allergy)}
                          color="primary"
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleToggleActive(allergy.id)}
                          color={allergy.isActive ? "error" : "success"}
                        >
                          {allergy.isActive ? (
                            <ToggleOffIcon />
                          ) : (
                            <ToggleOnIcon />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteAllergy(allergy.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Allergy Modal */}
      {showCreateModal && (
        <AllergyModal
          onSubmit={handleCreateAllergy}
          onClose={() => setShowCreateModal(false)}
        />
      )}

      {/* Edit Allergy Modal */}
      {editingAllergy && (
        <AllergyModal
          allergy={editingAllergy}
          onSubmit={handleUpdateAllergy}
          onClose={() => setEditingAllergy(null)}
        />
      )}
    </Box>
  );
};

// Allergy Modal Component (for both create and edit)
const AllergyModal = ({ allergy = null, onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    name: allergy?.name || "",
    icon: allergy?.icon || "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={true} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{allergy ? "Edit Allergy" : "Add New Allergy"}</DialogTitle>
      <form onSubmit={handleSubmit}>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="Allergy Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                fullWidth
                required
                placeholder="e.g., Peanuts, Fish, Dairy"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Icon (Emoji)"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
                fullWidth
                required
                placeholder="e.g., 🥜, 🐟, 🥛"
                helperText="Use a single emoji to represent this allergy"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">
            Cancel
          </Button>
          <Button type="submit" variant="contained" color="primary">
            {allergy ? "Update Allergy" : "Add Allergy"}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default Allergies;
