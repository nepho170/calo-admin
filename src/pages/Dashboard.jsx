import { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Alert,
  AlertTitle,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  RestaurantMenu as RestaurantMenuIcon,
  LocalOffer as LocalOfferIcon,
  Fastfood as FastfoodIcon,
  Timeline as TimelineIcon,
  Inventory as PackageIcon,
  CalendarToday as CalendarIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  TrendingUp as TrendingUpIcon,
  Email as EmailIcon,
} from "@mui/icons-material";
import { validateDatabaseStructure } from "../utils/database-init";

const StatCard = ({
  title,
  value,
  icon,
  color = "primary",
  subtitle,
  progress,
}) => (
  <Card sx={{ height: "100%" }}>
    <CardContent>
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <Box
          sx={{
            backgroundColor: `${color}.light`,
            borderRadius: 1,
            p: 1,
            mr: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
        </Box>
      </Box>
      {subtitle && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {subtitle}
        </Typography>
      )}
      {progress !== undefined && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 6,
            borderRadius: 3,
            backgroundColor: "grey.200",
            "& .MuiLinearProgress-bar": {
              borderRadius: 3,
            },
          }}
        />
      )}
    </CardContent>
  </Card>
);

const TaskItem = ({ title, description, status, priority }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "success";
      case "in_progress":
        return "info";
      case "pending":
        return "warning";
      case "error":
        return "error";
      default:
        return "default";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircleIcon />;
      case "error":
        return <ErrorIcon />;
      case "pending":
        return <WarningIcon />;
      default:
        return <TrendingUpIcon />;
    }
  };

  return (
    <ListItem>
      <ListItemIcon>{getStatusIcon(status)}</ListItemIcon>
      <ListItemText primary={title} secondary={description} />
      <Chip
        label={status.replace("_", " ")}
        color={getStatusColor(status)}
        size="small"
        sx={{ textTransform: "capitalize" }}
      />
    </ListItem>
  );
};

export default function Dashboard() {
  const [databaseStats, setDatabaseStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailTestOpen, setEmailTestOpen] = useState(false);

  useEffect(() => {
    const fetchDatabaseStats = async () => {
      try {
        setLoading(true);
        const stats = await validateDatabaseStructure();
        setDatabaseStats(stats);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDatabaseStats();
  }, []);

  const quickActions = [
    {
      title: "Add New Meal",
      description: "Create a new meal with ingredients",
      path: "/meals",
      color: "primary",
      icon: <FastfoodIcon />,
    },
    {
      title: "Master Month Template",
      description: "Create repeating master month templates",
      path: "/master-month-templates",
      color: "secondary",
      icon: <RestaurantMenuIcon />,
    },
  ];

  const recentTasks = [
    {
      title: "Database Structure Validation",
      description: "Checking all collections and documents",
      status: databaseStats?.isValid ? "completed" : "error",
      priority: "high",
    },
    {
      title: "Meal Library Setup",
      description: "Building comprehensive meal database with ingredients",
      status: databaseStats?.meals > 0 ? "completed" : "pending",
      priority: "high",
    },
    {
      title: "Master Template Creation",
      description: "Creating master month templates for meal planning",
      status: databaseStats?.masterTemplates > 0 ? "completed" : "pending",
      priority: "medium",
    },
    {
      title: "Menu Planning System",
      description: "Setting up simplified month-based planning",
      status: databaseStats?.masterTemplates > 0 ? "completed" : "pending",
      priority: "medium",
    },
  ];

  if (loading) {
    return (
      <Box sx={{ width: "100%", mt: 2 }}>
        <LinearProgress />
        <Typography variant="body2" sx={{ mt: 2, textAlign: "center" }}>
          Loading dashboard data...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <Typography
        variant="h4"
        component="h1"
        gutterBottom
        sx={{ fontWeight: "bold" }}
      >
        Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Welcome to riz Recipe Admin Dashboard. Manage your meal planning system
        efficiently.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Error</AlertTitle>
          {error}
        </Alert>
      )}

      {!databaseStats?.isValid && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <AlertTitle>Database Setup Required</AlertTitle>
          Your database appears to be empty. Please initialize it with sample
          data to get started.
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Labels"
            value={databaseStats?.labels || 0}
            icon={<LocalOfferIcon />}
            color="primary"
            subtitle="Dietary and health labels"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Meals"
            value={databaseStats?.meals || 0}
            icon={<FastfoodIcon />}
            color="secondary"
            subtitle="Created meal recipes"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Macro Plans"
            value={databaseStats?.plans || 0}
            icon={<TimelineIcon />}
            color="success"
            subtitle="Active nutrition plans"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Meal Packages"
            value={databaseStats?.packages || 0}
            icon={<PackageIcon />}
            color="info"
            subtitle="Available meal packages"
          />
        </Grid>
      </Grid>

      {/* Menu Planning Section */}
      {/* Title & Subtitle in a separate row */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
          📅 Menu Planning System
        </Typography>
        <Typography variant="body2" color="text.secondary">
          New template-based menu planning system for efficient meal scheduling
        </Typography>
      </Box>

      {/* Stat Cards */}
      {/* <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Master Templates"
            value={databaseStats?.masterTemplates || 0}
            icon={<RestaurantMenuIcon />}
            color="warning"
            subtitle="Master month templates"
          />
        </Grid> */}
      {/* <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Month Overrides"
            value={databaseStats?.monthOverrides || 0}
            icon={<CalendarIcon />}
            color="success"
            subtitle="Special date customizations"
          />
        </Grid> */}
      {/* <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Dietary Filters"
            value={databaseStats?.dietaryFilters || 0}
            icon={<LocalOfferIcon />}
            color="info"
            subtitle="Customer filter options"
          />
        </Grid> */}
      {/* <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ textAlign: "center" }}>
              <Typography variant="h6" gutterBottom>
                New Structure
              </Typography>
              <Chip label="Template-Based" color="primary" sx={{ mb: 1 }} />
              <Typography variant="body2" color="text.secondary">
                Efficient menu planning with reusable templates
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}

      <Grid container spacing={3}>
        {/* Quick Actions */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                Quick Actions
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Common tasks to get you started
              </Typography>
              <Grid container spacing={2}>
                {quickActions.map((action, index) => (
                  <Grid item xs={12} sm={6} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        cursor: "pointer",
                        transition: "all 0.2s",
                        "&:hover": {
                          transform: "translateY(-2px)",
                          boxShadow: 3,
                        },
                      }}
                      onClick={() => (window.location.href = action.path)}
                    >
                      <Box
                        sx={{ display: "flex", alignItems: "center", mb: 1 }}
                      >
                        <Box
                          sx={{
                            backgroundColor: `${action.color}.light`,
                            borderRadius: 1,
                            p: 1,
                            mr: 2,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {action.icon}
                        </Box>
                        <Typography variant="h6" component="div">
                          {action.title}
                        </Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {action.description}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Tasks */}
        {/* <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                component="h2"
                gutterBottom
                sx={{ fontWeight: "bold" }}
              >
                System Status
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Current setup progress
              </Typography>
              <List disablePadding>
                {recentTasks.map((task, index) => (
                  <div key={index}>
                    <TaskItem {...task} />
                    {index < recentTasks.length - 1 && <Divider />}
                  </div>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid> */}
      </Grid>

      {/* Admin Tools Section */}
      {/* <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography
                variant="h6"
                gutterBottom
                sx={{
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                🔧 Admin Tools
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Testing and configuration tools for system administration
              </Typography>

              <Box display="flex" gap={2} flexWrap="wrap">
                <Button
                  variant="outlined"
                  startIcon={<EmailIcon />}
                  onClick={() => setEmailTestOpen(true)}
                  color="primary"
                >
                  Test Email Notifications
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid> */}
    </Box>
  );
}
