#!/bin/bash

# Email System Verification Script
# This script checks if the email notification system is properly configured

echo "🔍 Email Notification System Verification"
echo "========================================"
echo ""

# Check Firebase CLI
echo "1. Checking Firebase CLI..."
if command -v firebase &> /dev/null; then
    echo "   ✅ Firebase CLI installed"
    firebase --version
else
    echo "   ❌ Firebase CLI not found"
    echo "      Install with: npm install -g firebase-tools"
    exit 1
fi

echo ""

# Check login status
echo "2. Checking Firebase authentication..."
if firebase projects:list &> /dev/null; then
    echo "   ✅ Logged in to Firebase"
    current_project=$(firebase use | grep "active project" | awk '{print $NF}' | tr -d '()')
    echo "   📋 Current project: $current_project"
else
    echo "   ❌ Not logged in to Firebase"
    echo "      Login with: firebase login"
    exit 1
fi

echo ""

# Check function deployment
echo "3. Checking deployed functions..."
deployed_functions=$(firebase functions:list 2>/dev/null | grep -E "(sendOrderStatusEmail|onOrderStatusUpdate)" | wc -l)

if [ "$deployed_functions" -eq 2 ]; then
    echo "   ✅ Both functions deployed successfully"
    firebase functions:list | grep -E "(sendOrderStatusEmail|onOrderStatusUpdate)"
elif [ "$deployed_functions" -eq 1 ]; then
    echo "   ⚠️  Only 1 function deployed (expected 2)"
    firebase functions:list | grep -E "(sendOrderStatusEmail|onOrderStatusUpdate)"
else
    echo "   ❌ No email functions found"
    echo "      Deploy with: firebase deploy --only functions"
fi

echo ""

# Check secrets
echo "4. Checking email configuration secrets..."
email_user_secret=$(firebase functions:secrets:access EMAIL_USER --quiet 2>/dev/null | wc -c)
email_pass_secret=$(firebase functions:secrets:access EMAIL_PASSWORD --quiet 2>/dev/null | wc -c)

if [ "$email_user_secret" -gt 1 ]; then
    echo "   ✅ EMAIL_USER secret configured"
else
    echo "   ❌ EMAIL_USER secret not found"
    echo "      Set with: firebase functions:secrets:set EMAIL_USER"
fi

if [ "$email_pass_secret" -gt 1 ]; then
    echo "   ✅ EMAIL_PASSWORD secret configured"
else
    echo "   ❌ EMAIL_PASSWORD secret not found"
    echo "      Set with: firebase functions:secrets:set EMAIL_PASSWORD"
fi

echo ""

# Check recent function logs
echo "5. Checking recent function activity..."
recent_logs=$(firebase functions:log --limit 5 --quiet 2>/dev/null | wc -l)

if [ "$recent_logs" -gt 0 ]; then
    echo "   ✅ Function logs available"
    echo "   📋 Recent logs:"
    firebase functions:log --limit 3 --quiet 2>/dev/null | head -n 3
else
    echo "   ℹ️  No recent function activity"
fi

echo ""

# Summary
echo "📊 VERIFICATION SUMMARY"
echo "======================"

if [ "$deployed_functions" -eq 2 ] && [ "$email_user_secret" -gt 1 ] && [ "$email_pass_secret" -gt 1 ]; then
    echo "✅ Email notification system is ready!"
    echo ""
    echo "🧪 Next steps:"
    echo "1. Test from Admin Dashboard:"
    echo "   - Open riz Recipe Admin > Admin Tools"
    echo "   - Click 'Test Email Notifications'"
    echo "   - Send test email to verify"
    echo ""
    echo "2. Test order status updates:"
    echo "   - Update an order status in the admin interface"
    echo "   - Check customer email for notification"
    echo ""
    echo "3. Monitor function logs:"
    echo "   firebase functions:log --only sendOrderStatusEmail"
    echo ""
else
    echo "⚠️  Setup incomplete. Please fix the issues above."
    echo ""
    echo "🔧 Quick fixes:"
    echo "- Deploy functions: firebase deploy --only functions"
    echo "- Set email secrets: ./scripts/setup-email-config.sh"
    echo "- Check logs: firebase functions:log"
    echo ""
fi

echo "📚 Documentation:"
echo "- Setup Guide: EMAIL_SETUP_README.md"
echo "- Full Docs: docs/EMAIL_NOTIFICATION_IMPLEMENTATION.md"
