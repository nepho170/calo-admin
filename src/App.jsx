import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import StartupAlerts from "./components/StartupAlerts";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminLogin from "./components/AdminLogin";
import Dashboard from "./pages/Dashboard";
import Labels from "./pages/Labels";
import Allergies from "./pages/Allergies";
import Meals from "./pages/Meals";
import MacroPlans from "./pages/MacroPlans";
import MealPackages from "./pages/MealPackages";
import AdminUsers from "./pages/AdminUsers";
import DietaryFilters from "./pages/DietaryFilters";
import MasterMonthTemplates from "./pages/MasterMonthTemplates";
import MonthOverrides from "./pages/MonthOverrides";
import CustomerOrders from "./pages/CustomerOrders";
import Customers from "./pages/Customers";
import TomorrowOrders from "./pages/TomorrowOrders";
import TodayOrders from "./pages/TodayOrders";
import Settings from "./pages/Settings";

import "./App.css";

// Create Material-UI theme
const theme = createTheme({
  palette: {
    primary: {
      main: "#1976d2",
      light: "#42a5f5",
      dark: "#1565c0",
    },
    secondary: {
      main: "#dc004e",
      light: "#ff5983",
      dark: "#9a0036",
    },
    background: {
      default: "#f5f5f5",
      paper: "#ffffff",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            {/* Public login route */}
            <Route path="/login" element={<AdminLogin />} />

            {/* Protected admin routes */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <StartupAlerts />
                    <Routes>
                      <Route path="/" element={<Dashboard />} />
                      <Route path="/labels" element={<Labels />} />
                      <Route path="/allergies" element={<Allergies />} />
                      <Route
                        path="/dietary-filters"
                        element={<DietaryFilters />}
                      />
                      <Route path="/meals" element={<Meals />} />
                      <Route path="/macro-plans" element={<MacroPlans />} />
                      <Route path="/meal-packages" element={<MealPackages />} />
                      <Route
                        path="/master-month-templates"
                        element={<MasterMonthTemplates />}
                      />
                      <Route
                        path="/month-overrides"
                        element={<MonthOverrides />}
                      />
                      <Route
                        path="/customer-orders"
                        element={<CustomerOrders />}
                      />
                      <Route path="/customers" element={<Customers />} />
                      <Route
                        path="/order-preparation"
                        element={<TomorrowOrders />}
                      />
                      <Route path="/today-orders" element={<TodayOrders />} />
                      <Route path="/settings" element={<Settings />} />

                      {/* Admin management routes */}
                      <Route path="/admin-users" element={<AdminUsers />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
