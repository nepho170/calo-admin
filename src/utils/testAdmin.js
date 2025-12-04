// /**
//  * Test Admin Initialization Script
//  * Run this to manually test admin system initialization
//  */

// import { initializeAdminSystem } from "../utils/adminInit.js";

// const testAdminInit = async () => {
//     console.log("🧪 Testing admin system initialization...");

//     try {
//         const result = await initializeAdminSystem();

//         if (result.success) {
//             console.log("✅ Admin initialization successful!");
//             console.log("📧 Email: nepho17@hotmail.com");
//             console.log("🔒 Password: 192837465");
//         } else {
//             console.log("ℹ️ Admin initialization result:", result.message);
//         }

//         return result;
//     } catch (error) {
//         console.error("❌ Admin initialization failed:", error);
//         return { success: false, error: error.message };
//     }
// };

// // Export for use in browser console
// window.testAdminInit = testAdminInit;

// console.log("🔧 Admin test utilities loaded. Run testAdminInit() in console to test.");

// export default testAdminInit;
