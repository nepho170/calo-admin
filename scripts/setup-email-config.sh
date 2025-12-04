#!/bin/bash

# Email Configuration Setup Script
# This script helps you set up email credentials for the notification system

echo "🔧 Setting up Email Notifications for riz Recipe Admin"
echo "================================================"

echo ""
echo "This script will help you configure email credentials for sending"
echo "order status notifications to customers."
echo ""

# Check if Firebase CLI is available
if ! command -v firebase &> /dev/null; then
    echo "❌ Firebase CLI not found. Please install it first:"
    echo "npm install -g firebase-tools"
    exit 1
fi

# Check if logged in
if ! firebase projects:list &> /dev/null; then
    echo "❌ Not logged in to Firebase. Please run:"
    echo "firebase login"
    exit 1
fi

echo "✅ Firebase CLI ready"
echo ""

echo "📧 Email Provider Setup Instructions:"
echo "===================================="
echo ""
echo "For Gmail (Recommended):"
echo "1. Go to Google Account Settings > Security"
echo "2. Enable 2-Factor Authentication"
echo "3. Go to Security > App Passwords"
echo "4. Generate an app password for 'Mail'"
echo "5. Use that app password (not your regular password)"
echo ""
echo "For other providers:"
echo "- Outlook: Use your regular email and password"
echo "- Yahoo: May need app-specific password"
echo "- Custom SMTP: Contact your email provider"
echo ""

read -p "Press Enter when you're ready to configure your email settings..."

echo ""
echo "📝 Setting up email credentials..."
echo ""

# Get email address
while true; do
    read -p "Enter your email address: " email_user
    if [[ $email_user =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
        break
    else
        echo "❌ Please enter a valid email address"
    fi
done

# Get password (hidden input)
echo ""
echo "Enter your email password (or app password for Gmail):"
echo "Note: Input will be hidden for security"
read -s email_password

echo ""
echo ""
echo "🔐 Setting email credentials as Firebase secrets..."

# Set the secrets
echo "$email_user" | firebase functions:secrets:set EMAIL_USER --data-file=-
echo "$email_password" | firebase functions:secrets:set EMAIL_PASSWORD --data-file=-

if [ $? -eq 0 ]; then
    echo "✅ Email credentials configured successfully!"
else
    echo "❌ Failed to set email credentials"
    exit 1
fi

echo ""
echo "🚀 Deploying functions with new configuration..."
firebase deploy --only functions

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Email notification system is ready!"
    echo "===================================="
    echo ""
    echo "✅ Functions deployed successfully"
    echo "✅ Email credentials configured"
    echo "📧 Email: $email_user"
    echo ""
    echo "🧪 Testing:"
    echo "1. Open the riz Recipe Admin Dashboard"
    echo "2. Click 'Test Email Notifications' in Admin Tools"
    echo "3. Send a test email to verify everything works"
    echo ""
    echo "📋 Next steps:"
    echo "- Update an order status to test automatic notifications"
    echo "- Monitor function logs: firebase functions:log"
    echo "- Customize email templates in src/configs/emailTemplates.js"
    echo ""
else
    echo "❌ Function deployment failed. Please check the error messages above."
    exit 1
fi
