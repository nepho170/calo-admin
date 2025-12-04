#!/bin/bash

# Webhook Testing Script for Calo Admin
# This script helps test the webhook endpoint locally and in production

echo "🔧 Calo Admin Webhook Testing Utility"
echo "====================================="

PROJECT_ID="calo-like-app"
FUNCTION_NAME="webhook"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function URLs
LOCAL_URL="http://localhost:5001/${PROJECT_ID}/us-central1/${FUNCTION_NAME}"
PROD_URL="https://us-central1-${PROJECT_ID}.cloudfunctions.net/${FUNCTION_NAME}"

print_separator() {
    echo "-------------------------------------"
}

test_webhook_endpoint() {
    local url=$1
    local env_name=$2
    
    echo -e "${BLUE}Testing ${env_name} webhook endpoint...${NC}"
    echo "URL: $url"
    print_separator
    
    # Test GET request (health check)
    echo -e "${YELLOW}1. Testing GET request (health check):${NC}"
    curl -X GET "$url" \
        -H "Content-Type: application/json" \
        -w "\nStatus: %{http_code}\n" \
        -s
    
    print_separator
    
    # Test POST request with sample webhook data
    echo -e "${YELLOW}2. Testing POST request (sample webhook):${NC}"
    curl -X POST "$url" \
        -H "Content-Type: application/json" \
        -H "X-Event-Type: test.webhook" \
        -d '{
            "type": "test.webhook",
            "data": {
                "message": "This is a test webhook event",
                "timestamp": "'$(date -u +%Y-%m-%dT%H:%M:%SZ)'",
                "orderId": "test-order-123",
                "amount": 29.99
            },
            "source": "webhook-test-script"
        }' \
        -w "\nStatus: %{http_code}\n" \
        -s
    
    print_separator
    
    # Test webhook challenge (common for webhook setup)
    echo -e "${YELLOW}3. Testing webhook challenge:${NC}"
    curl -X GET "$url?challenge=test-challenge-123" \
        -H "Content-Type: application/json" \
        -w "\nStatus: %{http_code}\n" \
        -s
    
    print_separator
}

# Main menu
while true; do
    echo ""
    echo -e "${GREEN}Choose an option:${NC}"
    echo "1. Test Local Webhook (Firebase Emulator)"
    echo "2. Test Production Webhook"
    echo "3. Show Webhook URLs"
    echo "4. Deploy Functions"
    echo "5. View Function Logs"
    echo "6. Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
    
    case $choice in
        1)
            echo -e "${BLUE}Testing Local Webhook...${NC}"
            test_webhook_endpoint "$LOCAL_URL" "Local"
            ;;
        2)
            echo -e "${BLUE}Testing Production Webhook...${NC}"
            test_webhook_endpoint "$PROD_URL" "Production"
            ;;
        3)
            echo -e "${GREEN}Webhook URLs:${NC}"
            echo "Local:      $LOCAL_URL"
            echo "Production: $PROD_URL"
            echo ""
            echo -e "${YELLOW}Use these URLs when configuring webhook services${NC}"
            ;;
        4)
            echo -e "${BLUE}Deploying Firebase Functions...${NC}"
            firebase deploy --only functions
            ;;
        5)
            echo -e "${BLUE}Viewing Function Logs...${NC}"
            firebase functions:log --only $FUNCTION_NAME
            ;;
        6)
            echo -e "${GREEN}Goodbye!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}Invalid option. Please choose 1-6.${NC}"
            ;;
    esac
done
