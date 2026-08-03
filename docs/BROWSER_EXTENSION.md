# Browser Extension Guide

## Installation

1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `browser-extension/` folder
5. Extension appears in toolbar!

## Features

- View top cryptocurrencies
- Click to add to watchlist
- Create price alerts
- Desktop notifications
- Settings management
- One-click access

## Testing

See [TESTING_GUIDE.md](../TESTING_GUIDE.md) for complete testing instructions.

## Permissions

- `storage` - Persist watchlist, alerts, and settings
- `alarms` - Periodic price refresh
- `notifications` - Desktop price alerts
- `activeTab` - Access current tab info
- `scripting` - Inject scripts when needed

## Files

- `manifest.json` - Manifest V3 configuration
- `background.js` - Service worker for background tasks
- `popup.html` / `popup.js` / `popup.css` - Popup UI
- `options.html` / `options.js` / `options.css` - Settings page
