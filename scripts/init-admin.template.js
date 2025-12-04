#!/usr/bin/env node

/**
 * Initialize First Admin User - TEMPLATE
 * 
 * INSTRUCTIONS:
 * 1. Copy this file to init-admin.js (which is gitignored)
 * 2. Update ADMIN_EMAIL and ADMIN_PASSWORD with your credentials
 * 3. Run: npm run init-admin
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

// Firebase config (reads from environment variables)
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// ⚠️ UPDATE THESE CREDENTIALS ⚠️
const ADMIN_EMAIL = "your-email@example.com";
const ADMIN_PASSWORD = "your-secure-password-here";

async function initializeFirstAdmin() {
    try {
        console.log("🔧 Checking for existing admin users...");

        // Check if any admin users exist
        const adminsSnapshot = await getDocs(collection(db, "admin_users"));

        if (!adminsSnapshot.empty) {
            console.log("ℹ️ Admin users already exist. Initialization not needed.");
            return;
        }

        console.log("🚀 Creating first admin user...");

        // Create Firebase Auth user
        const userCredential = await createUserWithEmailAndPassword(auth, ADMIN_EMAIL, ADMIN_PASSWORD);
        const user = userCredential.user;

        // Create admin record in Firestore
        const adminData = {
            email: ADMIN_EMAIL,
            displayName: "Super Admin",
            role: "admin",
            permissions: ["full_access"],
            active: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            lastLogin: null
        };

        await setDoc(doc(db, "admin_users", user.uid), adminData);

        console.log("✅ First admin user created successfully!");
        console.log(`📧 Email: ${ADMIN_EMAIL}`);
        console.log(`🔒 Password: ${ADMIN_PASSWORD}`);
        console.log(`🆔 UID: ${user.uid}`);

    } catch (error) {
        console.error("❌ Error initializing admin:", error);

        if (error.code === 'auth/email-already-in-use') {
            console.log("ℹ️ User with this email already exists. You may need to check if they're already an admin.");
        }
    }
}

// Run the initialization
initializeFirstAdmin()
    .then(() => {
        console.log("🏁 Admin initialization complete");
        process.exit(0);
    })
    .catch((error) => {
        console.error("💥 Fatal error:", error);
        process.exit(1);
    });
