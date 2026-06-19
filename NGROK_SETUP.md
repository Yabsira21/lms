# ngrok Setup Guide for Face Recognition Testing

This guide explains how to use ngrok to test the face recognition system on mobile devices. **HTTPS is required** for camera access on mobile browsers.

## Why ngrok?

- **Mobile Testing**: Test face recognition on real mobile devices
- **HTTPS Required**: Mobile browsers require HTTPS for camera access
- **Easy Setup**: Quick way to get HTTPS without deploying
- **Public URL**: Share your local development server with others

## Prerequisites

1. **ngrok Account**: Sign up at https://dashboard.ngrok.com/signup (free)
2. **ngrok Installed**: See installation instructions below
3. **Next.js Running**: Your dev server should be running on port 3000

## Installation

### Linux

```bash
# Add ngrok repository
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo 'deb https://ngrok-agent.s3.amazonaws.com buster main' | sudo tee /etc/apt/sources.list.d/ngrok.list

# Install ngrok
sudo apt update && sudo apt install ngrok
```

### macOS

```bash
brew install ngrok/ngrok/ngrok
```

### Manual Installation

Download from: https://ngrok.com/download

## Authentication

1. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken
2. Configure ngrok:

```bash
ngrok config add-authtoken YOUR_AUTH_TOKEN
```

## Usage Methods

### Method 1: Manual Setup (Recommended for First Time)

1. **Start your Next.js dev server**:
   ```bash
   yarn dev
   ```

2. **In another terminal, start ngrok**:
   ```bash
   ngrok http 3000
   ```

3. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok-free.app`)

4. **Update `.env` file**:
   ```env
   BETTER_AUTH_URL="https://abc123.ngrok-free.app"
   ```

5. **Restart your Next.js server** to pick up the new URL

6. **Access your app** using the ngrok URL on mobile devices

### Method 2: Using Setup Script

```bash
# Make script executable
chmod +x scripts/ngrok-setup.sh

# Run the script
yarn dev:ngrok
# or
bash scripts/ngrok-setup.sh
```

This script will:
- Check if ngrok is installed
- Help you authenticate if needed
- Check if Next.js is running
- Start ngrok tunnel

### Method 3: Automatic Environment Update

```bash
# Make script executable
chmod +x scripts/ngrok-with-env.sh

# Run the script (automatically updates .env)
yarn dev:ngrok:auto
# or
bash scripts/ngrok-with-env.sh
```

This script will:
- Start ngrok
- Automatically update `BETTER_AUTH_URL` in `.env`
- Restore original `.env` when you stop ngrok

**Note**: You'll still need to restart your Next.js server after the .env is updated.

## Step-by-Step Guide

### 1. Start Next.js Dev Server

```bash
# Terminal 1
cd /home/devb/Documents/e-learning/lms
yarn dev
```

Wait for: `✓ Ready in X.Xs`

### 2. Start ngrok

```bash
# Terminal 2
ngrok http 3000
```

You'll see output like:
```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3000
```

### 3. Update Environment Variables

Copy the HTTPS URL (e.g., `https://abc123.ngrok-free.app`) and update `.env`:

```env
BETTER_AUTH_URL="https://abc123.ngrok-free.app"
```

### 4. Restart Next.js Server

Stop the dev server (Ctrl+C) and restart:

```bash
yarn dev
```

### 5. Test on Mobile

1. Open the ngrok URL on your mobile device
2. Grant camera permissions when prompted
3. Test face registration and recognition

## ngrok Web Interface

Access the ngrok web interface at: **http://localhost:4040**

Features:
- View all requests
- Replay requests
- Inspect request/response details
- Monitor traffic

## Important Notes

### URL Changes

⚠️ **Free ngrok URLs change every time you restart ngrok**

- Each time you restart ngrok, you get a new URL
- You must update `BETTER_AUTH_URL` each time
- Consider using a static domain (paid ngrok feature) for consistency

### OAuth Callbacks

If using GitHub/Google OAuth, update callback URLs:

**GitHub**:
- Go to: https://github.com/settings/developers
- Edit your OAuth App
- Update "Authorization callback URL" to: `https://YOUR_NGROK_URL.ngrok-free.app/api/auth/callback/github`

**Google**:
- Go to: https://console.cloud.google.com/apis/credentials
- Edit your OAuth client
- Add to "Authorized redirect URIs": `https://YOUR_NGROK_URL.ngrok-free.app/api/auth/callback/google`

### CORS and Security

ngrok handles HTTPS automatically. However:

- First-time visitors may see ngrok warning page (click "Visit Site")
- Some browsers may show security warnings (expected for development)
- Mobile browsers will require HTTPS for camera (ngrok provides this)

## Troubleshooting

### ngrok Not Starting

**Issue**: `command not found: ngrok`

**Solution**: Install ngrok (see Installation section above)

### Cannot Connect

**Issue**: `ERR_NGROK_3200` or connection refused

**Solutions**:
1. Ensure Next.js is running on port 3000
2. Check firewall settings
3. Verify ngrok is authenticated: `ngrok config check`

### URL Not Working on Mobile

**Issue**: Page doesn't load or shows error

**Solutions**:
1. Check ngrok URL is correct (HTTPS, not HTTP)
2. Verify Next.js is running
3. Check ngrok web interface (http://localhost:4040) for errors
4. Try accessing from desktop browser first

### Camera Not Working

**Issue**: Camera permission denied or not accessible

**Solutions**:
1. Ensure you're using HTTPS URL (not HTTP)
2. Grant camera permissions in browser settings
3. Check browser console for errors
4. Try different browser (Chrome, Safari, Firefox)

### Environment Variable Not Updating

**Issue**: Changes to `.env` not taking effect

**Solutions**:
1. Restart Next.js server after updating `.env`
2. Check `.env` file syntax (no extra spaces, correct quotes)
3. Verify variable name: `BETTER_AUTH_URL` (not `BETTER_AUTH_URLS`)

## Advanced Usage

### Custom Domain (Paid Feature)

If you have a paid ngrok account:

```bash
ngrok http 3000 --domain=your-custom-domain.ngrok.io
```

### Multiple Tunnels

Run multiple ngrok tunnels:

```bash
# Terminal 1
ngrok http 3000

# Terminal 2 (different port)
ngrok http 3001
```

### ngrok Configuration File

Create `~/.ngrok2/ngrok.yml`:

```yaml
version: "2"
authtoken: YOUR_AUTH_TOKEN
tunnels:
  lms:
    addr: 3000
    proto: http
```

Then run:
```bash
ngrok start lms
```

## Alternative: Local HTTPS with mkcert

If you prefer local HTTPS instead of ngrok, see [DEPLOYMENT_HTTPS.md](./DEPLOYMENT_HTTPS.md) for mkcert setup.

## Next Steps

After setting up ngrok:

1. ✅ Test face registration on mobile
2. ✅ Test face recognition on mobile
3. ✅ Verify camera access works
4. ✅ Test OAuth flows (if using)
5. ✅ Share URL with team for testing

## Resources

- [ngrok Documentation](https://ngrok.com/docs)
- [ngrok Dashboard](https://dashboard.ngrok.com)
- [ngrok Status Page](http://localhost:4040) (when running)

---

**Last Updated**: December 2024
