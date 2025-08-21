# Binance API Key Setup Guide

## Overview

The ETH Kalman Predictor supports optional Binance API keys for higher rate limits:

- **Without API Key**: 1,200 requests/minute (public endpoints)
- **With API Key**: 6,000 requests/minute (authenticated endpoints)

## Setup Instructions

### 1. Create Binance API Key

1. Go to [Binance.com](https://binance.com) → **API Management**
2. Click **Create API**
3. **Important Security Settings**:
   - ✅ **Enable**: "Read Info" only
   - ❌ **Disable**: All trading permissions
   - ❌ **Disable**: Withdraw permissions
   - 📍 **Add IP Restriction**: Your server's IP address

### 2. Configure Environment Variables

Create a `.env` file in the `back-end` directory:

```bash
# Copy .env.example to .env
cp .env.example .env
```

Edit `.env` with your credentials:

```bash
# Binance API Configuration
BINANCE_API_KEY=your_actual_api_key_here
BINANCE_SECRET_KEY=your_actual_secret_key_here
```

### 3. Verify Setup

Run the test to verify API key is working:

```bash
source venv/bin/activate
python binance_eth_data.py
```

You should see:
```
✓ API connection successful - 🔑 Authenticated
  Rate limits: 6000/min
```

## Security Best Practices

### ✅ DO:
- Use **Read-Only** API keys
- Set **IP restrictions** to your server
- Store keys in `.env` (git-ignored)
- Rotate keys periodically
- Monitor API usage

### ❌ DON'T:
- Share API keys publicly
- Enable trading permissions
- Commit keys to git repositories
- Use the same keys across multiple applications
- Store keys in code files

## Rate Limits Comparison

| Feature | Public API | Authenticated API |
|---------|------------|-------------------|
| Requests/minute | 1,200 | 6,000 |
| Historical data | ✅ | ✅ |
| Real-time WebSocket | ✅ | ✅ |
| Trading | ❌ | ✅ (if enabled) |
| Account data | ❌ | ✅ |

## Troubleshooting

### API Key Not Loading
```bash
# Check if .env file exists
ls -la .env

# Check environment variables
source venv/bin/activate
python -c "from dotenv import load_dotenv; import os; load_dotenv(); print('API Key:', bool(os.getenv('BINANCE_API_KEY')))"
```

### Rate Limit Errors
- **HTTP 429**: Too many requests
- **Solution**: Reduce request frequency or add delays
- **With API key**: Should rarely happen (6000/min limit)

### Invalid API Key
- **HTTP 401**: Invalid credentials
- **Solution**: Check API key is correct and not expired
- **Verify**: API key has "Read Info" permission enabled

## System Behavior

- **Startup**: Automatically detects and loads API credentials
- **Fallback**: Works without API keys (public endpoints)
- **Logging**: Shows which mode is active at startup
- **Headers**: Automatically adds API key headers when available

## Example Log Output

**Without API Key:**
```
INFO: ℹ No API key - using public endpoints (lower rate limits)
INFO: ✓ API connection successful - 🌐 Public
```

**With API Key:**
```
INFO: ✓ Binance API key loaded - higher rate limits available  
INFO: ✓ API connection successful - 🔑 Authenticated
```