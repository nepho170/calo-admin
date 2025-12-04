import React, { createContext, useContext, useState, useEffect } from "react";
import {
  runStartupChecks,
  quickExpiredOrdersCheck,
} from "../services/startup.js";
import { adminUsersService } from "../services/adminUsers.js";
// import { ensureAdminSystemInitialized } from "../utils/adminInit.js";
import { auth } from "../configs/firebase.js";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
} from "firebase/auth";

/**
 * AuthContext with Startup Checks
 * Handles user authentication and runs startup checks when users log in
 */

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [adminStatus, setAdminStatus] = useState(null);
  const [startupChecks, setStartupChecks] = useState({
    completed: false,
    results: null,
    alerts: [],
    loading: false,
    error: null,
  });

  // Listen to Firebase Auth state changes
  useEffect(() => {
    // Initialize admin system first
    // ensureAdminSystemInitialized();

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

      if (firebaseUser) {
        // Check if user is an admin
        const adminCheck = await adminUsersService.checkAdminStatus(
          firebaseUser.uid
        );

        if (adminCheck.isAdmin && adminCheck.isActive) {
          // Update last login
          await adminUsersService.updateLastLogin(firebaseUser.uid);

          // Set authenticated admin user
          const adminUser = {
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName:
              firebaseUser.displayName || adminCheck.data?.displayName,
            role: "admin",
            permissions: ["full_access"], // All admins have full access
            isAdmin: true,
            isActive: true,
          };

          setUser(adminUser);
          setAdminStatus(adminCheck);
          console.log("✅ Admin user authenticated:", adminUser);
        } else {
          // User is not an admin or is inactive
          console.warn("❌ User is not an active admin:", firebaseUser.email);
          setUser(null);
          setAdminStatus(null);
          // Optionally sign out non-admin users
          await signOut(auth);
        }
      } else {
        // User is signed out
        setUser(null);
        setAdminStatus(null);
      }

      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  // Run startup checks when admin user logs in
  useEffect(() => {
    if (user && user.isAdmin && !startupChecks.completed) {
      performStartupChecks();
    }
  }, [user]);

  /**
   * Perform comprehensive startup checks
   */
  const performStartupChecks = async () => {
    try {
      setStartupChecks((prev) => ({ ...prev, loading: true, error: null }));

      console.log("🚀 Running startup checks for user login...");

      // Run comprehensive startup checks
      const results = await runStartupChecks({
        autoDeactivateExpired: true,
        enableLogging: true,
      });

      setStartupChecks({
        completed: true,
        results,
        alerts: results.alerts || [],
        loading: false,
        error: null,
      });

      // Show startup alerts to user if there are urgent issues
      if (results.alerts?.some((alert) => alert.urgent)) {
        console.warn(
          "🚨 Urgent startup alerts detected:",
          results.alerts.filter((alert) => alert.urgent)
        );
      }
    } catch (error) {
      console.error("❌ Startup checks failed:", error);

      setStartupChecks({
        completed: false,
        results: null,
        alerts: [
          {
            type: "error",
            title: "Startup Check Failed",
            message:
              "Could not complete startup checks. Some data may be outdated.",
            urgent: false,
          },
        ],
        loading: false,
        error: error.message,
      });
    }
  };

  /**
   * Manually refresh startup checks
   */
  const refreshStartupChecks = async () => {
    if (user) {
      await performStartupChecks();
    }
  };

  /**
   * Quick check for expired orders (for navbar alerts, etc.)
   */
  const checkExpiredOrders = async () => {
    try {
      return await quickExpiredOrdersCheck();
    } catch (error) {
      console.error("Quick expired orders check failed:", error);
      return { hasExpired: false, count: 0, expired: [] };
    }
  };

  /**
   * Sign in with email and password
   */
  const signIn = async (email, password) => {
    try {
      setLoading(true);
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Check admin status
      const adminCheck = await adminUsersService.checkAdminStatus(
        firebaseUser.uid
      );

      if (!adminCheck.isAdmin || !adminCheck.isActive) {
        // Sign out non-admin users
        await signOut(auth);
        throw new Error("Access denied. Admin privileges required.");
      }

      return userCredential;
    } catch (error) {
      console.error("Sign in failed:", error);
      setLoading(false);
      throw error;
    }
  };

  /**
   * Login function (legacy support)
   */
  const login = async (email, password) => {
    try {
      const result = await signIn(email, password);
      return { success: true, user: result.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  /**
   * Sign out current user
   */
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setAdminStatus(null);
      setStartupChecks({
        completed: false,
        results: null,
        alerts: [],
        loading: false,
        error: null,
      });
      console.log("✅ User logged out");
    } catch (error) {
      console.error("Sign out failed:", error);
      throw error;
    }
  };

  /**
   * Send password reset email
   */
  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      console.log("✅ Password reset email sent to:", email);
      return { success: true };
    } catch (error) {
      console.error("Password reset failed:", error);
      throw error;
    }
  };

  /**
   * Check if user has specific permission
   * Since all admins have full access, always return true for authenticated admins
   */
  const hasPermission = (permission) => {
    return user?.isAdmin || false;
  };

  /**
   * Dismiss startup alert
   */
  const dismissAlert = (alertIndex) => {
    setStartupChecks((prev) => ({
      ...prev,
      alerts: prev.alerts.filter((_, index) => index !== alertIndex),
    }));
  };

  const value = {
    // Auth state
    user,
    loading,
    adminStatus,

    // Auth functions
    signIn,
    login,
    logout,
    resetPassword,
    hasPermission,

    // Startup checks
    startupChecks,
    refreshStartupChecks,
    checkExpiredOrders,
    dismissAlert,

    // Helper functions
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
