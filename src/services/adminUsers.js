import {
    collection,
    doc,
    getDoc,
    setDoc,
    updateDoc,
    getDocs,
    query,
    where,
    serverTimestamp
} from "firebase/firestore";
import {
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from "firebase/auth";
import { db, auth } from "../configs/firebase.js";

/**
 * Admin Users Service - Simplified
 * All admins have full control, no permission system needed
 */

const COLLECTION_NAME = "admin_users";

export const adminUsersService = {
    /**
     * Check if user is an admin and is active
     */
    async checkAdminStatus(uid) {
        try {
            const adminDoc = await getDoc(doc(db, COLLECTION_NAME, uid));

            if (adminDoc.exists()) {
                const data = adminDoc.data();
                return {
                    isAdmin: true,
                    isActive: data.active !== false, // Default to active if not specified
                    role: "admin",
                    permissions: ["full_access"], // All admins have full access
                    data
                };
            }

            return {
                isAdmin: false,
                isActive: false,
                role: null,
                permissions: [],
                data: null
            };
        } catch (error) {
            console.error("Error checking admin status:", error);
            return {
                isAdmin: false,
                isActive: false,
                role: null,
                permissions: [],
                data: null
            };
        }
    },

    /**
     * Create a new admin user
     */
    async createAdmin(uid, email, displayName = null) {
        try {
            const adminData = {
                email,
                displayName: displayName || email.split('@')[0],
                role: "admin",
                permissions: ["full_access"],
                active: true,
                createdAt: serverTimestamp(),
                lastLogin: null
            };

            await setDoc(doc(db, COLLECTION_NAME, uid), adminData);

            console.log("✅ Admin user created:", email);
            return { success: true, data: adminData };
        } catch (error) {
            console.error("Error creating admin user:", error);
            throw error;
        }
    },

    /**
     * Update last login timestamp
     */
    async updateLastLogin(uid) {
        try {
            await updateDoc(doc(db, COLLECTION_NAME, uid), {
                lastLogin: serverTimestamp()
            });
        } catch (error) {
            console.error("Error updating last login:", error);
        }
    },

    /**
     * Get all admin users
     */
    async getAllAdmins() {
        try {
            const adminsSnapshot = await getDocs(collection(db, COLLECTION_NAME));
            const admins = [];

            adminsSnapshot.forEach((doc) => {
                admins.push({
                    uid: doc.id,
                    ...doc.data()
                });
            });

            return admins;
        } catch (error) {
            console.error("Error getting admin users:", error);
            throw error;
        }
    },

    /**
     * Toggle admin active status
     */
    async toggleActive(uid, active) {
        try {
            await updateDoc(doc(db, COLLECTION_NAME, uid), {
                active,
                updatedAt: serverTimestamp()
            });

            console.log(`✅ Admin ${uid} ${active ? 'activated' : 'deactivated'}`);
            return { success: true };
        } catch (error) {
            console.error("Error toggling admin status:", error);
            throw error;
        }
    },

    /**
     * Initialize the first admin user
     */
    // async initializeFirstAdmin(email, password) {
    //     try {
    //         // Check if any admin users exist
    //         const adminsSnapshot = await getDocs(collection(db, COLLECTION_NAME));

    //         if (!adminsSnapshot.empty) {
    //             console.log("Admin users already exist, skipping initialization");
    //             return { success: false, message: "Admin users already exist" };
    //         }

    //         console.log("Creating first admin user...");

    //         // Create Firebase Auth user
    //         const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    //         const user = userCredential.user;

    //         // Create admin record in Firestore
    //         await this.createAdmin(user.uid, email, "Super Admin");

    //         console.log("✅ First admin user created successfully");
    //         return {
    //             success: true,
    //             message: "First admin user created successfully",
    //             uid: user.uid
    //         };

    //     } catch (error) {
    //         console.error("Error initializing first admin:", error);

    //         // Handle specific Firebase Auth errors
    //         if (error.code === 'auth/email-already-in-use') {
    //             // If email exists, check if they're an admin
    //             const q = query(collection(db, COLLECTION_NAME), where("email", "==", email));
    //             const existingAdmin = await getDocs(q);

    //             if (!existingAdmin.empty) {
    //                 return {
    //                     success: false,
    //                     message: "Admin user already exists with this email"
    //                 };
    //             }
    //         }

    //         throw error;
    //     }
    // },

    /**
     * Send password reset email
     */
    async sendPasswordReset(email) {
        try {
            await sendPasswordResetEmail(auth, email);
            console.log("✅ Password reset email sent to:", email);
            return { success: true };
        } catch (error) {
            console.error("Error sending password reset:", error);
            throw error;
        }
    }
};

export default adminUsersService;
