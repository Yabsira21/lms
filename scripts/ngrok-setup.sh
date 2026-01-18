#!/bin/bash

# ngrok Setup Script for LMS Face Recognition Testing
# This script helps set up ngrok for HTTPS testing, especially for mobile camera access

set -e

NGROK_PORT=${1:-3000}
NGROK_AUTH_TOKEN=${NGROK_AUTH_TOKEN:-""}

echo "🚀 Setting up ngrok for LMS Face Recognition Testing"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed"
    echo ""
    echo "📥 Install ngrok:"
    echo "   Linux:"
    echo "     curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null"
    echo "     echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list"
    echo "     sudo apt update && sudo apt install ngrok"
    echo ""
    echo "   macOS:"
    echo "     brew install ngrok/ngrok/ngrok"
    echo ""
    echo "   Or download from: https://ngrok.com/download"
    exit 1
fi

echo "✅ ngrok is installed"
echo ""

# Check if ngrok is authenticated
if [ -z "$NGROK_AUTH_TOKEN" ]; then
    echo "⚠️  NGROK_AUTH_TOKEN not set"
    echo ""
    echo "📝 To get your ngrok auth token:"
    echo "   1. Sign up at https://dashboard.ngrok.com/signup"
    echo "   2. Go to: https://dashboard.ngrok.com/get-started/your-authtoken"
    echo "   3. Copy your authtoken"
    echo "   4. Run: ngrok config add-authtoken YOUR_TOKEN"
    echo ""
    read -p "Do you want to configure ngrok auth token now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        read -p "Enter your ngrok authtoken: " token
        ngrok config add-authtoken "$token"
        echo "✅ ngrok authenticated"
    fi
else
    ngrok config add-authtoken "$NGROK_AUTH_TOKEN"
    echo "✅ ngrok authenticated with provided token"
fi

echo ""
echo "📋 Configuration:"
echo "   Port: $NGROK_PORT"
echo "   URL: Will be displayed when ngrok starts"
echo ""

# Check if Next.js is running
if ! lsof -Pi :$NGROK_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  No service detected on port $NGROK_PORT"
    echo ""
    echo "💡 Start your Next.js dev server first:"
    echo "   yarn dev"
    echo ""
    read -p "Do you want to start the dev server now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Starting Next.js dev server in background..."
        cd "$(dirname "$0")/.."
        yarn dev &
        DEV_PID=$!
        echo "   Dev server PID: $DEV_PID"
        sleep 5
    else
        echo "❌ Please start the dev server first, then run this script again"
        exit 1
    fi
fi

echo ""
echo "🌐 Starting ngrok tunnel..."
echo ""
echo "📝 Important:"
echo "   1. Copy the HTTPS URL (e.g., https://xxxx.ngrok-free.app)"
echo "   2. Update BETTER_AUTH_URL in .env file to match"
echo "   3. Restart your Next.js server after updating .env"
echo ""
echo "Press Ctrl+C to stop ngrok"
echo ""

# Start ngrok
ngrok http $NGROK_PORT
