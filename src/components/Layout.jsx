import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Restaurant as RestaurantIcon,
  LocalOffer as LocalOfferIcon,
  Fastfood as FastfoodIcon,
  Timeline as TimelineIcon,
  Inventory as PackageIcon,
  CalendarToday as CalendarIcon,
  Storage as StorageIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountCircleIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  FilterList as FilterListIcon,
  ViewModule as TemplateIcon,
  DateRange as DateRangeIcon,
  Warning as WarningIcon,
  People as PeopleIcon,
  Today as TodayIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";

const drawerWidth = 280;

const navigationItems = [
  {
    text: "Dashboard",
    icon: <DashboardIcon />,
    path: "/",
  },
  // {
  //   text: "Database Setup",
  //   icon: <StorageIcon />,
  //   path: "/database-init",
  // },
  { divider: true },
  {
    text: "Foundation",
    isHeader: true,
  },
  {
    text: "Labels",
    icon: <LocalOfferIcon />,
    path: "/labels",
  },
  {
    text: "Allergies",
    icon: <WarningIcon />,
    path: "/allergies",
  },
  // {
  //   text: "Dietary Filters",
  //   icon: <FilterListIcon />,
  //   path: "/dietary-filters",
  // },
  // { divider: true },
  {
    text: "Meal Management",
    isHeader: true,
  },
  {
    text: "Meals",
    icon: <FastfoodIcon />,
    path: "/meals",
  },
  {
    text: "Macro Plans",
    icon: <TimelineIcon />,
    path: "/macro-plans",
  },
  {
    text: "Meal Packages",
    icon: <PackageIcon />,
    path: "/meal-packages",
  },
  { divider: true },
  {
    text: "Menu Planning",
    isHeader: true,
  },
  {
    text: "Master Month Templates",
    icon: <TemplateIcon />,
    path: "/master-month-templates",
  },
  // {
  //   text: "Month Overrides",
  //   icon: <DateRangeIcon />,
  //   path: "/month-overrides",
  // },
  // { divider: true },
  {
    text: "Customer Management",
    isHeader: true,
  },
  {
    text: "Customers",
    icon: <PeopleIcon />,
    path: "/customers",
  },
  {
    text: "Orders",
    icon: <CheckCircleIcon />,
    path: "/customer-orders",
  },
  {
    text: "Today's Orders",
    icon: <TodayIcon />,
    path: "/today-orders",
  },
  {
    text: "Tomorrow's Orders",
    icon: <RestaurantIcon />,
    path: "/order-preparation",
  },
  { divider: true },
  {
    text: "Configuration",
    isHeader: true,
  },
  {
    text: "App Settings",
    icon: <SettingsIcon />,
    path: "/settings",
  },
  {
    text: "Admin Users",
    icon: <AccountCircleIcon />,
    path: "/admin-users",
    requiresPermission: "manage_admins",
  },
];

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { startupChecks, user, hasPermission, logout } = useAuth();

  // Calculate notification count from startup checks
  const getNotificationCount = () => {
    if (!startupChecks.alerts) return 0;
    return startupChecks.alerts.filter(
      (alert) => alert.urgent || alert.type === "error"
    ).length;
  };

  const getNotificationColor = () => {
    if (!startupChecks.alerts || startupChecks.alerts.length === 0)
      return "default";
    const hasUrgent = startupChecks.alerts.some((alert) => alert.urgent);
    const hasError = startupChecks.alerts.some(
      (alert) => alert.type === "error"
    );
    if (hasUrgent || hasError) return "error";
    return "warning";
  };

  const getNotificationIcon = () => {
    if (!startupChecks.completed) return <NotificationsIcon />;
    if (startupChecks.alerts && startupChecks.alerts.length > 0) {
      const hasError = startupChecks.alerts.some(
        (alert) => alert.type === "error" || alert.urgent
      );
      return hasError ? <ErrorIcon /> : <WarningIcon />;
    }
    return <CheckCircleIcon />;
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/"); // Navigate to home/login page after logout
    } catch (error) {
      console.error("Failed to logout:", error);
    } finally {
      setAnchorEl(null);
    }
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const drawer = (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Box sx={{ p: 2 }}>
        <Typography
          variant="h6"
          noWrap
          component="div"
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <RestaurantIcon />
          riz Recipe Admin
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Meal Planning Dashboard
        </Typography>
      </Box>
      <Divider />
      <List sx={{ flexGrow: 1, px: 1 }}>
        {navigationItems
          .filter((item) => {
            // Hide items that require specific permissions
            if (
              item.requiresPermission &&
              !hasPermission(item.requiresPermission)
            ) {
              return false;
            }
            return true;
          })
          .map((item, index) => {
            if (item.divider) {
              return <Divider key={index} sx={{ my: 1 }} />;
            }

            if (item.isHeader) {
              return (
                <ListItem key={index} sx={{ py: 1 }}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontSize: "0.75rem", fontWeight: 600 }}
                  >
                    {item.text}
                  </Typography>
                </ListItem>
              );
            }

            const isActive = location.pathname === item.path;

            return (
              <ListItem key={index} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    borderRadius: 1,
                    backgroundColor: isActive ? "primary.main" : "transparent",
                    color: isActive ? "primary.contrastText" : "text.primary",
                    "&:hover": {
                      backgroundColor: isActive
                        ? "primary.dark"
                        : "action.hover",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: isActive
                        ? "primary.contrastText"
                        : "text.secondary",
                      minWidth: 40,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText primary={item.text} />
                </ListItemButton>
              </ListItem>
            );
          })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {navigationItems.find((item) => item.path === location.pathname)
              ?.text || "Dashboard"}
          </Typography>

          {/* Startup Check Status */}
          {user && (
            <Tooltip
              title={
                !startupChecks.completed
                  ? "Running startup checks..."
                  : startupChecks.alerts && startupChecks.alerts.length > 0
                  ? `${startupChecks.alerts.length} startup alert(s)`
                  : "All systems operational"
              }
            >
              <IconButton color="inherit" sx={{ mr: 1 }}>
                <Badge
                  badgeContent={getNotificationCount()}
                  color={getNotificationColor()}
                  invisible={getNotificationCount() === 0}
                >
                  {getNotificationIcon()}
                </Badge>
              </IconButton>
            </Tooltip>
          )}

          <IconButton
            color="inherit"
            onClick={handleProfileMenuOpen}
            sx={{ p: 0 }}
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountCircleIcon />
            </Avatar>
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Profile menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        sx={{ mt: 1.5 }}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <AccountCircleIcon fontSize="small" />
          </ListItemIcon>
          Profile
        </MenuItem>
        <MenuItem onClick={handleProfileMenuClose}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
