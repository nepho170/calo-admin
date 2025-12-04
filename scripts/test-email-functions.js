/**
 * Quick test script for Firebase Functions
 * Run this to verify the email notification system is working
 */

// Test data
const testData = {
    orderId: 'TEST-' + Date.now(),
    customerEmail: 'your-test-email@example.com', // Replace with your email
    customerName: 'Test Customer',
    status: 'pending',
    date: new Date().toISOString().split('T')[0],
    notes: 'This is a test notification from the setup verification'
};

// Function to test the email system
async function testEmailFunction() {
    try {
        console.log('🧪 Testing Firebase Functions email system...');
        console.log('📋 Test data:', testData);

        // This would normally be imported from your Firebase config
        // For testing, we'll show the expected call format

        console.log('');
        console.log('📧 To test the email function:');
        console.log('1. Open the riz Recipe Admin Dashboard');
        console.log('2. Go to Admin Tools > Test Email Notifications');
        console.log('3. Enter your email address');
        console.log('4. Select a status and click Send Test Email');
        console.log('');
        console.log('💡 Or test from browser console:');
        console.log(`
// Import Firebase Functions
import { getFunctions, httpsCallable } from 'firebase/functions';

// Test function call
const functions = getFunctions();
const sendEmail = httpsCallable(functions, 'sendOrderStatusEmail');

const testData = ${JSON.stringify(testData, null, 2)};

sendEmail(testData)
  .then(result => console.log('✅ Email sent:', result.data))
  .catch(error => console.error('❌ Error:', error));
        `);

        console.log('');
        console.log('🔍 Check function logs:');
        console.log('firebase functions:log --only sendOrderStatusEmail');

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { testEmailFunction, testData };
} else {
    // Browser environment
    window.testEmailFunction = testEmailFunction;
    window.testData = testData;
}

// Run test if called directly
if (typeof require !== 'undefined' && require.main === module) {
    testEmailFunction();
}
