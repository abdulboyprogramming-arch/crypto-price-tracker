# 🧪 Crypto Tracker Pro - Complete Testing Guide

## Quick Reference
- **Web App:** http://localhost:8080
- **API Server:** http://localhost:8000 (with /docs for Swagger)
- **Browser Extension:** chrome://extensions/
- **Chrome DevTools:** F12

---

## ✅ SECTION 1: LOCAL ENVIRONMENT SETUP

### 1.1 Prerequisites
```bash
# Verify Python installation
python --version  # Should be 3.8+

# Verify Node.js installation
node --version    # Should be 14+

# Verify npm installation
npm --version     # Should be 6+
```

### 1.2 Install Dependencies

**For API Server:**
```bash
cd api-server
pip install -r requirements.txt
```

**For Web App:**
```bash
# No installation needed - pure HTML/CSS/JS
cd web-app
```

**For Browser Extension:**
```bash
# No installation needed - pure JavaScript
cd browser-extension
```

---

## ✅ SECTION 2: WEB APP TESTING (PWA)

### 2.1 Start Local Server
```bash
cd web-app
python -m http.server 8080
```
✅ Open: http://localhost:8080

### 2.2 Browser Console Testing
```javascript
// Press F12 → Console tab

// Test 1: Check if service worker registered
navigator.serviceWorker.getRegistrations().then(regs => {
    console.log('Service Workers:', regs);
});

// Test 2: Check localStorage
console.log('Settings:', localStorage.getItem('cryptoTrackerSettings'));

// Test 3: Check if API is reachable
fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=10')
    .then(r => r.json())
    .then(data => console.log('✅ API Working:', data.length, 'coins'))
    .catch(e => console.error('❌ API Error:', e));

// Test 4: Test offline mode
// 1. Open DevTools Network tab
// 2. Check "Offline" checkbox
// 3. Refresh page - should still load cached data
// 4. Uncheck "Offline" to go back online
```

### 2.3 Feature Testing Checklist

#### Header & Navigation
- [ ] Logo loads correctly
- [ ] Title displays "Crypto Tracker Pro"
- [ ] "Refresh" button works (price updates)
- [ ] "Settings" link opens options page

#### Market Statistics Bar
- [ ] Total Market Cap displays correct value
- [ ] 24h Volume displays correct value
- [ ] BTC Dominance shows percentage
- [ ] ETH Dominance shows percentage

#### Tabs
- [ ] "Prices" tab active by default
- [ ] "Watchlist" tab switches correctly
- [ ] "Alerts" tab switches correctly
- [ ] All tabs show correct content

#### Prices Tab
- [ ] Top 10 coins display
- [ ] Coin symbol shows (BTC, ETH, etc.)
- [ ] Coin name displays
- [ ] Price shows in USD
- [ ] 24h change % displays
- [ ] Green color for positive changes
- [ ] Red color for negative changes
- [ ] Click coin → adds to watchlist

#### Watchlist Tab
- [ ] Empty state message if no items
- [ ] Added coins display with prices
- [ ] Remove button works
- [ ] Badge shows item count

#### Alerts Tab
- [ ] Coin selector populates
- [ ] "Above" and "Below" options work
- [ ] Target price input accepts numbers
- [ ] Create Alert button works
- [ ] Alerts list displays
- [ ] Alert triggers notification when price reaches target

#### Settings Page
- [ ] Theme selector works (dark/light)
- [ ] Currency selector changes display
- [ ] Refresh interval updates
- [ ] Notification toggle enables/disables notifications
- [ ] Sound alert toggle works
- [ ] Settings persist after reload
- [ ] Export data creates JSON file
- [ ] Import data restores settings

#### Dark/Light Theme
- [ ] Toggle in settings
- [ ] Background color changes
- [ ] Text color changes
- [ ] Chart colors adjust
- [ ] Persists after reload

#### Offline Mode
- [ ] Works without internet
- [ ] Shows cached prices
- [ ] Refresh button disabled (or shows offline indicator)
- [ ] Service worker installed (DevTools → Application → Service Workers)

### 2.4 Performance Testing

```javascript
// Test page load time
window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const loadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log('Page Load Time:', loadTime, 'ms');
    console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.navigationStart, 'ms');
});

// Test API response time
console.time('API Call');
fetch('https://api.coingecko.com/api/v3/global')
    .then(r => r.json())
    .then(d => console.timeEnd('API Call'));
```

### 2.5 Mobile Testing
```
Chrome DevTools → Device Toggle (Ctrl+Shift+M)

Test on:
- iPhone SE (375px)
- iPhone 12 Pro (390px)
- Pixel 5 (393px)
- iPad (768px)
- iPad Pro (1024px)

Verify:
- [ ] Layout responsive
- [ ] Touch buttons work
- [ ] Text readable
- [ ] Charts fit screen
```

---

## ✅ SECTION 3: API SERVER TESTING

### 3.1 Start API Server
```bash
cd api-server
python main.py
```
✅ Server runs on: http://localhost:8000

### 3.2 Test Endpoints with cURL

**Test 1: Health Check**
```bash
curl http://localhost:8000/health
# Expected: {"status":"healthy","version":"v1",...}
```

**Test 2: Get Prices**
```bash
curl http://localhost:8000/prices?vs_currency=usd&per_page=10
# Expected: List of top 10 coins with prices
```

**Test 3: Get Specific Coin**
```bash
curl http://localhost:8000/prices/bitcoin
# Expected: Bitcoin price details
```

**Test 4: Market Stats**
```bash
curl http://localhost:8000/market-stats
# Expected: {"total_market_cap_usd":..., "btc_dominance":...}
```

**Test 5: Trending**
```bash
curl http://localhost:8000/trending
# Expected: {"gainers":[...], "losers":[...]}
```

### 3.3 Interactive API Testing (Swagger UI)

Open: http://localhost:8000/docs

**Test each endpoint:**
- [ ] Click endpoint
- [ ] Click "Try it out"
- [ ] Modify parameters if needed
- [ ] Click "Execute"
- [ ] Check response code (200 = success)
- [ ] Verify response data

### 3.4 Rate Limiting Test
```bash
# Send 11 requests in 60 seconds to /prices endpoint
for i in {1..11}; do
  echo "Request $i:"
  curl http://localhost:8000/prices
  sleep 5
done
# Expected: 10 success (200), 1 rate-limited (429)
```

### 3.5 Error Handling Test
```bash
# Test with invalid coin
curl http://localhost:8000/prices/invalid-coin-xyz
# Expected: 404 Not Found

# Test offline API (disconnect internet)
curl http://localhost:8000/prices
# Expected: Service unavailable error (503)
```

---

## ✅ SECTION 4: BROWSER EXTENSION TESTING

### 4.1 Load Extension in Chrome

**Step 1: Enable Developer Mode**
```
chrome://extensions/
Toggle "Developer mode" (top right)
```

**Step 2: Load Unpacked**
```
Click "Load unpacked"
Navigate to: crypto-price-tracker/browser-extension/
Click "Select Folder"
```

✅ Extension loads - you should see "Crypto Tracker Pro" in extensions list

### 4.2 Extension UI Testing

**Icon in Toolbar**
- [ ] Icon appears in Chrome toolbar
- [ ] Clicking shows popup with prices
- [ ] Badge shows portfolio value (optional)

**Popup Window**
- [ ] Displays top 10 cryptocurrencies
- [ ] Shows current prices
- [ ] Shows 24h change percentage
- [ ] Market cap and volume display
- [ ] Tabs switch (Prices/Watchlist/Alerts)

**Watchlist Tab**
- [ ] Click price to add to watchlist
- [ ] Shows added coins
- [ ] Remove button works
- [ ] Empty message displays when empty

**Alerts Tab**
- [ ] Select coin from dropdown
- [ ] Choose "Above" or "Below"
- [ ] Enter target price
- [ ] Click "Create Alert"
- [ ] Alert appears in list

**Settings (Options Page)**
```
Right-click extension icon → Options
OR
chrome://extensions/ → Crypto Tracker Pro → Details → Extension options
```

Settings to test:
- [ ] Theme selector (dark/light)
- [ ] Currency selector (USD/EUR/GBP)
- [ ] Refresh interval selector
- [ ] Notification toggle
- [ ] Sound toggle
- [ ] All settings persist after reload

### 4.3 Background Service Worker Testing

**Open DevTools for Extension:**
```
chrome://extensions/
Find "Crypto Tracker Pro"
Click "Details"
Click "Inspect views" → "service_worker"
```

**Console Tests:**
```javascript
// Check if background script is running
console.log('Background service worker active');

// Test message passing
chrome.runtime.sendMessage({type: 'getPrices'}, (response) => {
    console.log('Prices:', response);
});

// Check storage
chrome.storage.local.get(['watchlist', 'alerts'], (result) => {
    console.log('Stored data:', result);
});
```

### 4.4 Notifications Testing

**Setup Notification Permission:**
```
1. Open Popup
2. Go to Options → Notifications
3. Enable "Desktop Notifications"
4. Refresh prices manually
5. Should see notification (if price alert triggered)
```

**Manual Notification Test:**
```javascript
// In popup console
chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Test Notification',
    message: 'This is a test alert',
    priority: 2
});
```

### 4.5 Manifest V3 Validation

**Chrome Console Check:**
```
chrome://extensions/ 
Find "Crypto Tracker Pro"
Look for any red error messages
Click "Errors" if any show
```

**Expected: No errors**

### 4.6 Extension Performance

```javascript
// In extension DevTools console
console.time('Price Fetch');
chrome.runtime.sendMessage({type: 'refresh'}, () => {
    console.timeEnd('Price Fetch');
});

// Check memory usage
chrome.runtime.sendMessage({type: 'getMetrics'}, (response) => {
    console.log('Memory usage:', response);
});
```

---

## ✅ SECTION 5: CI/CD PIPELINE TESTING

### 5.1 GitHub Actions Testing

**Push test commit:**
```bash
git add .
git commit -m "test: verify CI pipeline"
git push origin main
```

**Check workflow status:**
```
1. Go to GitHub repo
2. Click "Actions" tab
3. Check if workflow runs
4. All checks should PASS ✅
```

### 5.2 Expected Workflow Checks

- [ ] **Code Quality:** Linting passes
- [ ] **Security:** No vulnerabilities detected
- [ ] **Tests:** All tests pass
- [ ] **Build:** Web app builds successfully
- [ ] **Manifest:** Valid Manifest V3
- [ ] **Deploy:** GitHub Pages updates (if applicable)

### 5.3 Check Deployment

```bash
# After GitHub Actions completes:
# Web app should deploy to:
https://abdulboyprogramming-arch.github.io/crypto-price-tracker/web-app/
```

---

## ✅ SECTION 6: INTEGRATION TESTING

### 6.1 Web App ↔ API Communication

**Start both services:**
```bash
# Terminal 1: Web App
cd web-app && python -m http.server 8080

# Terminal 2: API
cd api-server && python main.py
```

**Test in Browser Console:**
```javascript
// Fetch from API
fetch('http://localhost:8000/prices?per_page=5')
    .then(r => r.json())
    .then(data => {
        console.log('✅ API Connected:', data.data.length, 'coins');
    })
    .catch(e => console.error('❌ Connection failed:', e));
```

### 6.2 Browser Extension ↔ Web App

- [ ] Add coin in web app watchlist
- [ ] Coin appears in extension watchlist
- [ ] Remove from extension
- [ ] Reflected in web app
- [ ] Alerts sync between platforms

### 6.3 Browser Extension ↔ API

**Update API URL in extension (if needed):**
```javascript
// In browser-extension/background.js
const API_BASE = 'http://localhost:8000'; // For local testing
// OR
const API_BASE = 'https://api.coingecko.com/api/v3'; // For production
```

**Test extension loads data from API:**
- [ ] Open extension
- [ ] Should fetch fresh prices
- [ ] No errors in DevTools console

---

## ✅ SECTION 7: SECURITY TESTING

### 7.1 Content Security Policy (CSP)

**Check in DevTools:**
```
F12 → Sources → (any JS file)
Should NOT see CSP violations in Console
```

### 7.2 Cross-Origin Resource Sharing (CORS)

**Test API CORS:**
```javascript
// Should work from any origin
fetch('http://localhost:8000/prices')
    .then(r => r.json())
    .then(d => console.log('✅ CORS OK'))
    .catch(e => console.error('❌ CORS Error:', e));
```

### 7.3 Input Validation

**Test extension:**
```javascript
// Try entering invalid price
// In Options page, Alert form
// Enter negative number: -100
// Should reject or show warning
```

### 7.4 Storage Security

**Test data encryption (if applicable):**
```javascript
// Check what's stored
chrome.storage.local.get(null, (items) => {
    console.log('Stored data:', items);
    // Should not contain sensitive info unencrypted
});
```

---

## ✅ SECTION 8: CROSS-BROWSER TESTING

### 8.1 Chrome (Primary)
- [ ] Extension works
- [ ] Web app responsive
- [ ] API requests work

### 8.2 Edge (Chromium-based)
```
1. Open: edge://extensions/
2. Enable Developer mode
3. Load unpacked → select browser-extension folder
4. Test features
```

### 8.3 Firefox (If Extension Updated)
```
1. Would need to update manifest for Firefox
2. Test features
```

---

## ✅ SECTION 9: FINAL CHECKLIST

### Before Pushing to Production:

**Web App:**
- [ ] All features work offline
- [ ] Service worker installed
- [ ] Responsive on mobile
- [ ] Dark/light theme toggles
- [ ] All buttons functional
- [ ] Prices update correctly
- [ ] Alerts work as expected
- [ ] Page loads < 3 seconds

**API Server:**
- [ ] All endpoints respond correctly
- [ ] Error handling works
- [ ] Rate limiting active
- [ ] CORS enabled
- [ ] Swagger docs accessible
- [ ] Health check passes
- [ ] Handles offline gracefully

**Browser Extension:**
- [ ] No manifest errors
- [ ] Popup loads quickly
- [ ] All tabs functional
- [ ] Settings persist
- [ ] Notifications work
- [ ] Alerts trigger
- [ ] No console errors

**CI/CD:**
- [ ] All GitHub Actions pass
- [ ] No deployment errors
- [ ] GitHub Pages updated
- [ ] All checks green

---

## 🐛 TROUBLESHOOTING

### Issue: "Failed to fetch from API"
**Solution:**
```bash
# Check if API is running
curl http://localhost:8000/health

# If not, start it:
cd api-server && python main.py
```

### Issue: "Service Worker won't install"
**Solution:**
```
1. F12 → Application → Service Workers
2. Unregister existing
3. Hard refresh (Ctrl+Shift+R)
4. Should reinstall
```

### Issue: "Extension not loading"
**Solution:**
```
1. Check manifest.json syntax
2. chrome://extensions/ → Errors
3. Reload extension button
```

### Issue: "CORS errors"
**Solution:**
```
Make sure API has CORS headers:
response.headers["Access-Control-Allow-Origin"] = "*"
```

### Issue: "Prices not updating"
**Solution:**
```
1. Check Network tab - any failed requests?
2. Check API is returning data
3. Check refresh interval setting
```

---

## 📞 SUPPORT

If tests fail:
1. Check GitHub Issues
2. Review error messages in console
3. Verify API is online (https://api.coingecko.com)
4. Clear cache: F12 → Application → Clear site data
5. File a bug report with console output

---

**All tests passing? Ready to push! 🚀**

