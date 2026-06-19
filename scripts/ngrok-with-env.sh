#!/bin/bash

# ngrok Setup with Automatic Environment Variable Update
# This script starts ngrok and automatically updates BETTER_AUTH_URL in .env

set -e

NGROK_PORT=${1:-3000}
ENV_FILE=".env"
TEMP_ENV_FILE=".env.ngrok.tmp"

echo "🚀 ngrok Setup with Auto Environment Configuration"
echo ""

# Check if ngrok is installed
if ! command -v ngrok &> /dev/null; then
    echo "❌ ngrok is not installed. Please install it first."
    echo "   See: https://ngrok.com/download"
    exit 1
fi

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ .env file not found"
    exit 1
fi

# Function to update BETTER_AUTH_URL in .env
update_env_url() {
    local ngrok_url=$1
    echo "📝 Updating BETTER_AUTH_URL to: $ngrok_url"
    
    # Create backup
    cp "$ENV_FILE" "${ENV_FILE}.backup"
    
    # Update BETTER_AUTH_URL
    if grep -q "^BETTER_AUTH_URL=" "$ENV_FILE"; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=\"$ngrok_url\"|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|^BETTER_AUTH_URL=.*|BETTER_AUTH_URL=\"$ngrok_url\"|" "$ENV_FILE"
        fi
    else
        # Add new
        echo "BETTER_AUTH_URL=\"$ngrok_url\"" >> "$ENV_FILE"
    fi
    
    echo "✅ Updated .env file (backup saved to .env.backup)"
}

# Function to restore original .env
restore_env() {
    if [ -f "${ENV_FILE}.backup" ]; then
        echo ""
        echo "🔄 Restoring original .env file..."
        mv "${ENV_FILE}.backup" "$ENV_FILE"
        echo "✅ Restored"
    fi
}

# Trap to restore .env on exit
trap restore_env EXIT INT TERM

# Check if Next.js is running
if ! lsof -Pi :$NGROK_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo "⚠️  No service detected on port $NGROK_PORT"
    echo ""
    echo "💡 Please start your Next.js dev server first:"
    echo "   yarn dev"
    echo ""
    exit 1
fi

echo "✅ Service detected on port $NGROK_PORT"
echo ""
echo "🌐 Starting ngrok..."
echo ""

# Start ngrok in background and capture URL
ngrok http $NGROK_PORT > /tmp/ngrok.log 2>&1 &
NGROK_PID=$!

# Wait for ngrok to start and get URL
echo "⏳ Waiting for ngrok to start..."
sleep 3

# Try to get ngrok URL from API
NGROK_URL=""
for i in {1..10}; do
    sleep 1
    NGROK_URL=$(curl -s http://localhost:4040/api/tunnels 2>/dev/null | grep -o '"public_url":"https://[^"]*' | head -1 | cut -d'"' -f4)
    if [ -n "$NGROK_URL" ]; then
        break
    fi
done

if [ -z "$NGROK_URL" ]; then
    echo "❌ Could not get ngrok URL. Check ngrok status at http://localhost:4040"
    kill $NGROK_PID 2>/dev/null || true
    exit 1
fi

echo "✅ ngrok started!"
echo ""
echo "🌐 Your ngrok URL: $NGROK_URL"
echo ""

# Update .env file
update_env_url "$NGROK_URL"

echo ""
echo "📋 Next steps:"
echo "   1. Restart your Next.js dev server to pick up the new BETTER_AUTH_URL"
echo "   2. Use $NGROK_URL to access your app from mobile devices"
echo "   3. Camera access will work on mobile browsers (HTTPS required)"
echo ""
echo "📊 ngrok web interface: http://localhost:4040"
echo ""
echo "Press Ctrl+C to stop ngrok and restore .env"
echo ""

# Wait for ngrok process
wait $NGROK_PID
