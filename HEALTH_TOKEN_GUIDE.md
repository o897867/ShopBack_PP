# 🔐 Health Token Access Guide
# 健康模块Token访问指南

## 🎯 Your Personal Health Token

Based on your physical metrics:
- **Height**: 176 cm
- **Weight**: 89 kg
- **Age**: 26 years

### Your Generated Token: `76BBA1D4`
### Recovery Code: `F785-E7AE-9A94`

---

## 📱 How to Access Health Module

### First Time Setup:

1. **Navigate to Health Token**
   - Visit http://3.106.207.46
   - Click menu (☰) in top-left
   - Under "Health & Fitness" section
   - Click "Health Token 🔑"

2. **Generate Your Token** (if first time)
   - Click "Generate New Token" tab
   - Enter your metrics:
     - Height: 176 cm
     - Weight: 89 kg
     - Age: 26
   - Click "Generate Token"
   - **SAVE YOUR TOKEN: `76BBA1D4`**

3. **Access Health Dashboard**
   - Switch to "Enter Token" tab
   - Enter token: `76BBA1D4`
   - Enter your metrics again to verify
   - Click "Validate Token"
   - You'll be redirected to Health Dashboard

### Returning User:

1. Click "Health Token" in menu
2. Enter your saved token: `76BBA1D4`
3. Verify with your metrics
4. Access granted!

---

## 🔑 Token Security

### How It Works:
- **8-digit token** generated from your unique physical metrics
- **Cryptographically secure** using HMAC-SHA256
- **Private to you** - only valid with correct height/weight/age combination
- **Stored locally** in your browser for convenience

### Token Structure:
```
76BBA1D4
│├─┘├─┘├─┘
││  │  └── Checksum (D4)
││  └───── Age encoding (A1)
│└──────── Weight hash (BB)
└───────── Height digits (76)
```

---

## 🎮 Available Features After Login

Once validated, you can access:

1. **Health Trading Dashboard**
   - Track weight like stock prices
   - Calorie budget management
   - Progress visualization

2. **K-Line Matcher Game**
   - Match your weight curve to market patterns
   - Get similarity scores
   - Share achievements

3. **Training Recommendations**
   - AI-powered suggestions
   - Based on your goals
   - Market-style analysis

---

## 🆘 Troubleshooting

### Forgot Your Token?
Use recovery code: `F785-E7AE-9A94`
Or regenerate with your exact metrics

### Token Not Working?
Ensure you enter EXACT values:
- Height: 176 (not 175 or 177)
- Weight: 89 (not 88.5 or 90)
- Age: 26

### Need Different Token?
If your metrics change:
1. Generate new token with updated values
2. Old token becomes invalid
3. Save new token securely

---

## 📊 API Access

For developers, use these endpoints:

```bash
# Generate token
curl -X POST http://localhost:8001/api/health/token/generate \
  -H "Content-Type: application/json" \
  -d '{"height": 176, "weight": 89, "age": 26}'

# Validate token
curl -X POST http://localhost:8001/api/health/token/validate \
  -H "Content-Type: application/json" \
  -d '{"token": "76BBA1D4", "height": 176, "weight": 89, "age": 26}'
```

---

## 🎯 Quick Access Links

- **Main Site**: http://3.106.207.46
- **Health Token**: http://3.106.207.46/#health-token
- **Health Dashboard**: http://3.106.207.46/#health (requires token)
- **K-Line Matcher**: http://3.106.207.46/#health-match (requires token)

---

## 💡 Tips

1. **Save your token** in a password manager
2. **Recovery code** is for emergency access
3. **Update token** if your weight changes significantly
4. Token is **case-insensitive** (76bba1d4 = 76BBA1D4)
5. **Privacy first** - all data stored locally

---

*Your health data is your asset. Trade it wisely! 📈*