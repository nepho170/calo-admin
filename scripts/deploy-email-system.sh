#!/bin/bash

# Email Notification System Deployment Script
# This script helps deploy and configure the email notification system

echo "🚀 Deploying riz Recipe Admin Email Notification System"
echo "=================================================="

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in to Firebase
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

echo "✅ Firebase CLI found and logged in"

# Install function dependencies
echo "📦 Installing Firebase Functions dependencies..."
cd functions
npm install
cd ..

# Check for email configuration
echo "📧 Checking email configuration..."

EMAIL_USER=$(firebase functions:config:get email.user 2>/dev/null | grep -v "Error" | tr -d '"')
EMAIL_PASSWORD=$(firebase functions:config:get email.password 2>/dev/null | grep -v "Error" | tr -d '"')

if [ -z "$EMAIL_USER" ] || [ -z "$EMAIL_PASSWORD" ]; then
    echo "⚠️  Email configuration not found."
    echo "Please set up your email credentials:"
    echo ""
    read -p "Enter your email address: " user_email
    read -s -p "Enter your email app password: " user_password
    echo ""
    
    echo "🔧 Setting email configuration..."
    firebase functions:config:set email.user="$user_email"
    firebase functions:config:set email.password="$user_password"
    
    echo "✅ Email configuration set"
else
    echo "✅ Email configuration found: $EMAIL_USER"
fi

# Deploy functions
echo "🚀 Deploying Firebase Functions..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo "✅ Functions deployed successfully!"
else
    echo "❌ Function deployment failed. Check the error messages above."
    exit 1
fi

# Deploy Firestore rules and indexes if needed
echo "📋 Deploying Firestore rules and indexes..."
firebase deploy --only firestore

echo ""
echo "🎉 Email Notification System Deployment Complete!"
echo "=================================================="
echo ""
echo "📧 Email Configuration:"
echo "   User: $EMAIL_USER"
echo "   Status: Configured"
echo ""
echo "🔧 Functions Deployed:"
echo "   - sendOrderStatusEmail (callable)"
echo "   - onOrderStatusUpdate (trigger)"
echo ""
echo "🧪 Testing:"
echo "   1. Update an order status in the admin interface"
echo "   2. Check the customer's email"
echo "   3. Monitor Firebase Functions logs: firebase functions:log"
echo ""
echo "📚 Documentation:"
echo "   See docs/EMAIL_NOTIFICATION_IMPLEMENTATION.md for details"
echo ""
echo "✅ All done! The email notification system is ready to use."
