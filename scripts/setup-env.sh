#!/bin/bash

# Script to create .env file from template

ENV_FILE=".env"
EXAMPLE_FILE=".env.example"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env file already exists. Backing up to .env.backup"
    cp "$ENV_FILE" ".env.backup"
fi

cat > "$ENV_FILE" << 'EOF'
# ============================================
# Database Configuration
# ============================================
# PostgreSQL connection string
# Format: postgresql://user:password@host:port/database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/lms"

# ============================================
# Better Auth Configuration
# ============================================
# Base URL of your application
BETTER_AUTH_URL="http://localhost:3000"

# Secret key for Better Auth (generate a random string)
# Generate with: openssl rand -base64 32
BETTER_AUTH_SECRET=""

# ============================================
# GitHub OAuth (Optional - for social login)
# ============================================
# Get from: https://github.com/settings/developers
AUTH_GITHUB_CLIENT_ID=""
AUTH_GITHUB_SECRET=""

# ============================================
# Google OAuth (Optional - for social login)
# ============================================
# Get from: https://console.cloud.google.com/apis/credentials
AUTH_GOOGLE_CLIENT_ID=""
AUTH_GOOGLE_CLIENT_SECRET=""

# ============================================
# Resend Email Service
# ============================================
# Get API key from: https://resend.com/api-keys
RESEND_API_KEY=""

# ============================================
# Arcjet Security
# ============================================
# Get API key from: https://app.arcjet.com
ARCJET_KEY=""

# ============================================
# AWS S3 Configuration (for file storage)
# ============================================
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_ENDPOINT_URL_S3="https://s3.amazonaws.com"
AWS_ENDPOINT_URL_IAM="https://iam.amazonaws.com"
AWS_REGION="us-east-1"

# ============================================
# Client-Side Variables (NEXT_PUBLIC_*)
# ============================================
NEXT_PUBLIC_S3_BUCKET_NAME_IMAGES=""
EOF

# Generate a random secret if BETTER_AUTH_SECRET is empty
if command -v openssl &> /dev/null; then
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        sed -i '' "s/BETTER_AUTH_SECRET=\"\"/BETTER_AUTH_SECRET=\"$SECRET\"/" "$ENV_FILE"
    else
        # Linux
        sed -i "s/BETTER_AUTH_SECRET=\"\"/BETTER_AUTH_SECRET=\"$SECRET\"/" "$ENV_FILE"
    fi
    echo "✅ Generated BETTER_AUTH_SECRET"
fi

echo "✅ Created .env file"
echo "📝 Please edit .env and fill in all required values"
echo "📖 See ENV_SETUP.md for detailed instructions"
