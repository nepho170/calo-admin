import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Avatar,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Tabs,
  Tab,
  CircularProgress,
  Alert,
  AlertTitle,
} from "@mui/material";
import {
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  FitnessCenter as FitnessCenterIcon,
  MonitorWeight as WeightIcon,
  Height as HeightIcon,
  Cake as AgeIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Refresh as RefreshIcon,
} from "@mui/icons-material";
import {
  customersService,
  calculateBMI,
  getBMICategory,
  formatActivityLevel,
  formatMainGoal,
} from "../services/customers";

// Tab panel component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`customers-tabpanel-${index}`}
      aria-labelledby={`customers-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [statistics, setStatistics] = useState(null);

  // Filters
  const [genderFilter, setGenderFilter] = useState("all");
  const [goalFilter, setGoalFilter] = useState("all");
  const [activityFilter, setActivityFilter] = useState("all");
  const [profileFilter, setProfileFilter] = useState("all");

  useEffect(() => {
    loadCustomers();
    loadStatistics();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [
    customers,
    searchTerm,
    genderFilter,
    goalFilter,
    activityFilter,
    profileFilter,
  ]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const customerData = await customersService.getAll();
      setCustomers(customerData);
      setError(null);
    } catch (err) {
      console.error("Error loading customers:", err);
      setError("Failed to load customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await customersService.getStatistics();
      setStatistics(stats);
    } catch (err) {
      console.error("Error loading statistics:", err);
    }
  };

  const filterCustomers = () => {
    let filtered = customers;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.phone?.includes(searchTerm)
      );
    }

    // Gender filter
    if (genderFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.gender === genderFilter
      );
    }

    // Main goal filter
    if (goalFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.mainGoal === goalFilter
      );
    }

    // Activity level filter
    if (activityFilter !== "all") {
      filtered = filtered.filter(
        (customer) => customer.activityLevel === activityFilter
      );
    }

    // Profile completion filter
    if (profileFilter !== "all") {
      const isCompleted = profileFilter === "completed";
      filtered = filtered.filter(
        (customer) => customer.profileCompleted === isCompleted
      );
    }

    setFilteredCustomers(filtered);
  };

  const handleViewDetails = (customer) => {
    setSelectedCustomer(customer);
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setSelectedCustomer(null);
    setDetailsOpen(false);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    return new Date(timestamp.seconds * 1000).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getGenderIcon = (gender) => {
    return gender === "male" ? "👨" : "👩";
  };

  const getProfileCompletionColor = (completed) => {
    return completed ? "success" : "warning";
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: 400,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        <AlertTitle>Error</AlertTitle>
        {error}
        <Button
          onClick={loadCustomers}
          startIcon={<RefreshIcon />}
          sx={{ mt: 1 }}
        >
          Retry
        </Button>
      </Alert>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{ display: "flex", alignItems: "center", gap: 1 }}
      >
        <PersonIcon fontSize="large" />
        Customers Management
      </Typography>

      <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="All Customers" />
          <Tab label="Statistics" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        {/* Filters */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Search customers"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Gender</InputLabel>
                <Select
                  value={genderFilter}
                  label="Gender"
                  onChange={(e) => setGenderFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="male">Male</MenuItem>
                  <MenuItem value="female">Female</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Main Goal</InputLabel>
                <Select
                  value={goalFilter}
                  label="Main Goal"
                  onChange={(e) => setGoalFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="gain_weight">Gain Weight</MenuItem>
                  <MenuItem value="lose_weight">Lose Weight</MenuItem>
                  <MenuItem value="maintain_weight">Maintain Weight</MenuItem>
                  <MenuItem value="build_muscle">Build Muscle</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Activity Level</InputLabel>
                <Select
                  value={activityFilter}
                  label="Activity Level"
                  onChange={(e) => setActivityFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="sedentary">Sedentary</MenuItem>
                  <MenuItem value="lightly_active">Lightly Active</MenuItem>
                  <MenuItem value="moderately_active">
                    Moderately Active
                  </MenuItem>
                  <MenuItem value="very_active">Very Active</MenuItem>
                  <MenuItem value="extremely_active">Extremely Active</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6} md={2}>
              <FormControl fullWidth>
                <InputLabel>Profile Status</InputLabel>
                <Select
                  value={profileFilter}
                  label="Profile Status"
                  onChange={(e) => setProfileFilter(e.target.value)}
                >
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                  <MenuItem value="incomplete">Incomplete</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={1}>
              <Button
                variant="outlined"
                onClick={loadCustomers}
                startIcon={<RefreshIcon />}
                fullWidth
              >
                Refresh
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Results Summary */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredCustomers.length} of {customers.length} customers
          </Typography>
        </Box>

        {/* Customers Table */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Contact</TableCell>
                <TableCell>Profile</TableCell>
                <TableCell>Goals & Activity</TableCell>
                <TableCell>Body Metrics</TableCell>
                <TableCell>BMI</TableCell>
                <TableCell>Joined</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCustomers.map((customer) => {
                const bmi = calculateBMI(customer.weight, customer.height);
                const bmiCategory = getBMICategory(bmi);

                return (
                  <TableRow key={customer.id} hover>
                    <TableCell>
                      <Box
                        sx={{ display: "flex", alignItems: "center", gap: 1 }}
                      >
                        <Avatar sx={{ bgcolor: "primary.main" }}>
                          {getGenderIcon(customer.gender)}
                        </Avatar>
                        <Box>
                          <Typography variant="subtitle2" noWrap>
                            {customer.name || "N/A"}
                          </Typography>
                          <Typography variant="subtitle2" noWrap>
                            {customer.id || "N/A"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Age: {customer.age || "N/A"}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <EmailIcon fontSize="small" />
                          {customer.email || "N/A"}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                          }}
                        >
                          <PhoneIcon fontSize="small" />
                          {customer.phone || "N/A"}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={
                          customer.profileCompleted ? "Complete" : "Incomplete"
                        }
                        color={getProfileCompletionColor(
                          customer.profileCompleted
                        )}
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          Goal: {formatMainGoal(customer.mainGoal)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatActivityLevel(customer.activityLevel)}
                        </Typography>
                      </Box>
                    </TableCell>

                    <TableCell>
                      <Box>
                        <Typography variant="body2">
                          {customer.weight || "N/A"} kg,{" "}
                          {customer.height || "N/A"} cm
                        </Typography>
                        {customer.targetWeight && (
                          <Typography variant="caption" color="text.secondary">
                            Target: {customer.targetWeight} kg
                          </Typography>
                        )}
                      </Box>
                    </TableCell>

                    <TableCell>
                      {bmi > 0 && (
                        <Chip
                          label={`${bmi} (${bmiCategory.label})`}
                          color={bmiCategory.color}
                          size="small"
                        />
                      )}
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(customer.createdAt)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Box sx={{ display: "flex", gap: 0.5 }}>
                        <Tooltip title="View Details">
                          <IconButton
                            size="small"
                            onClick={() => handleViewDetails(customer)}
                          >
                            <VisibilityIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {statistics && (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Total Customers
                  </Typography>
                  <Typography variant="h4">{statistics.total}</Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="textSecondary" gutterBottom>
                    Profile Completed
                  </Typography>
                  <Typography variant="h4">
                    {statistics.profileCompleted}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {(
                      (statistics.profileCompleted / statistics.total) *
                      100
                    ).toFixed(1)}
                    %
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Gender Distribution
                  </Typography>
                  <Box sx={{ display: "flex", gap: 2 }}>
                    <Chip label={`Male: ${statistics.byGender.male}`} />
                    <Chip label={`Female: ${statistics.byGender.female}`} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Main Goals
                  </Typography>
                  <Box
                    sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Chip
                      label={`Gain Weight: ${statistics.byMainGoal.gain_weight}`}
                      size="small"
                    />
                    <Chip
                      label={`Lose Weight: ${statistics.byMainGoal.lose_weight}`}
                      size="small"
                    />
                    <Chip
                      label={`Maintain Weight: ${statistics.byMainGoal.maintain_weight}`}
                      size="small"
                    />
                    <Chip
                      label={`Build Muscle: ${statistics.byMainGoal.build_muscle}`}
                      size="small"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        )}
      </TabPanel>

      {/* Customer Details Dialog */}
      <Dialog
        open={detailsOpen}
        onClose={handleCloseDetails}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Customer Details</DialogTitle>
        <DialogContent>
          {selectedCustomer && (
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Personal Information
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Typography>
                        <strong>Name:</strong> {selectedCustomer.name}
                      </Typography>
                      <Typography>
                        <strong>Email:</strong> {selectedCustomer.email}
                      </Typography>
                      <Typography>
                        <strong>Phone:</strong> {selectedCustomer.phone}
                      </Typography>
                      <Typography>
                        <strong>Age:</strong> {selectedCustomer.age}
                      </Typography>
                      <Typography>
                        <strong>Gender:</strong> {selectedCustomer.gender}
                      </Typography>
                      <Typography>
                        <strong>Joined:</strong>{" "}
                        {formatDate(selectedCustomer.createdAt)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Health & Fitness
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Typography>
                        <strong>Height:</strong> {selectedCustomer.height} cm
                      </Typography>
                      <Typography>
                        <strong>Weight:</strong> {selectedCustomer.weight} kg
                      </Typography>
                      <Typography>
                        <strong>Target Weight:</strong>{" "}
                        {selectedCustomer.targetWeight} kg
                      </Typography>
                      <Typography>
                        <strong>BMI:</strong>{" "}
                        {calculateBMI(
                          selectedCustomer.weight,
                          selectedCustomer.height
                        )}
                      </Typography>
                      <Typography>
                        <strong>Main Goal:</strong>{" "}
                        {formatMainGoal(selectedCustomer.mainGoal)}
                      </Typography>
                      <Typography>
                        <strong>Activity Level:</strong>{" "}
                        {formatActivityLevel(selectedCustomer.activityLevel)}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              <Grid item xs={12}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Dietary Information
                    </Typography>
                    <Box
                      sx={{ display: "flex", flexDirection: "column", gap: 1 }}
                    >
                      <Typography>
                        <strong>Allergies:</strong>{" "}
                        {selectedCustomer.allergies &&
                        selectedCustomer.allergies.length > 0
                          ? selectedCustomer.allergies.join(", ")
                          : "None specified"}
                      </Typography>
                      <Typography>
                        <strong>Dietary Restrictions:</strong>{" "}
                        {selectedCustomer.dietaryRestrictions &&
                        selectedCustomer.dietaryRestrictions.length > 0
                          ? selectedCustomer.dietaryRestrictions.join(", ")
                          : "None specified"}
                      </Typography>
                      <Typography>
                        <strong>Profile Status:</strong>
                        <Chip
                          label={
                            selectedCustomer.profileCompleted
                              ? "Complete"
                              : "Incomplete"
                          }
                          color={getProfileCompletionColor(
                            selectedCustomer.profileCompleted
                          )}
                          size="small"
                          sx={{ ml: 1 }}
                        />
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Customers;
