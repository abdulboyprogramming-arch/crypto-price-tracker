/**
 * CRYPTO PRICE TRACKER - Browser Extension Background Service Worker
 * Runs in background, fetches prices periodically, sends notifications
 */

import { CryptoPriceTracker } from '../javascript-version/src/price-scraper.js';

// Initialize tracker
const tracker = new CryptoPriceTracker({ useSimulated: false });

// Default tracked symbols
let trackedSymbols = ['BTC', 'ETH', 'SOL'];
let alertThresholds = {};

// Load saved settings
async function loadSettings() {
    const result = await chrome.storage.local.get(['trackedSymbols', 'alertThresholds']);
    if (result.trackedSymbols) trackedSymbols = result.trackedSymbols;
    if (result.alertThresholds) alertThresholds = result.alertThresholds;
}

// Save settings
async function saveSettings() {
    await chrome.storage.local.set({
        trackedSymbols: trackedSymbols,
        alertThresholds: alertThresholds
    });
}

// Fetch price for a symbol
async function fetchPrice(symbol) {
    try {
        const price = await tracker.getPrice(symbol);
        if (price) {
            // Store in cache
            await chrome.storage.local.set({ [`price_${symbol}`]: price });
            
            // Check alerts
            await checkAlerts(symbol, price);
            
            return price;
        }
    } catch (error) {
        console.error(`Error fetching ${symbol}:`, error);
    }
    return null;
}

// Check price alerts
async function checkAlerts(symbol, currentPrice) {
    const threshold = alertThresholds[symbol];
    if (!threshold) return;
    
    const lastAlertKey = `last_alert_${symbol}`;
    const lastAlert = await chrome.storage.local.get(lastAlertKey);
    const now = Date.now();
    
    // Don't alert more than once per hour
    if (lastAlert[lastAlertKey] && (now - lastAlert[lastAlertKey]) < 3600000) {
        return;
    }
    
    let shouldAlert = false;
    let alertMessage = '';
    
    if (threshold.above && currentPrice >= threshold.above) {
        shouldAlert = true;
        alertMessage = `${symbol} has reached $${currentPrice.toLocaleString()} (above $${threshold.above.toLocaleString()})`;
    } else if (threshold.below && currentPrice <= threshold.below) {
        shouldAlert = true;
        alertMessage = `${symbol} has dropped to $${currentPrice.toLocaleString()} (below $${threshold.below.toLocaleString()})`;
    }
    
    if (shouldAlert) {
        // Send notification
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icons/icon128.png',
            title: `💰 ${symbol} Price Alert`,
            message: alertMessage,
            priority: 2
        });
        
        // Store last alert time
        await chrome.storage.local.set({ [lastAlertKey]: now });
    }
}

// Update badge with total portfolio value
async function updateBadge() {
    let totalValue = 0;
    
    for (const symbol of trackedSymbols) {
        const result = await chrome.storage.local.get([`price_${symbol}`]);
        const price = result[`price_${symbol}`];
        if (price) totalValue += price;
    }
    
    if (totalValue > 0) {
        let badgeText;
        if (totalValue >= 1000) badgeText = `${Math.floor(totalValue / 1000)}k`;
        else if (totalValue >= 100) badgeText = `${Math.floor(totalValue)}`;
        else badgeText = `${totalValue.toFixed(0)}`;
        
        chrome.action.setBadgeText({ text: badgeText });
        chrome.action.setBadgeBackgroundColor({ color: '#4CAF50' });
    } else {
        chrome.action.setBadgeText({ text: '' });
    }
}

// Scheduled price fetch
async function scheduledFetch() {
    console.log('[Background] Fetching prices...');
    
    for (const symbol of trackedSymbols) {
        await fetchPrice(symbol);
    }
    
    await updateBadge();
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.type === 'getPrices') {
        (async () => {
            const prices = {};
            for (const symbol of trackedSymbols) {
                const result = await chrome.storage.local.get([`price_${symbol}`]);
                prices[symbol] = result[`price_${symbol}`] || null;
            }
            sendResponse({ success: true, prices: prices });
        })();
        return true; // Keep channel open for async response
    }
    
    if (request.type === 'refresh') {
        (async () => {
            for (const symbol of trackedSymbols) {
                await fetchPrice(symbol);
            }
            await updateBadge();
            sendResponse({ success: true });
        })();
        return true;
    }
    
    if (request.type === 'updateSettings') {
        trackedSymbols = request.trackedSymbols || trackedSymbols;
        alertThresholds = request.alertThresholds || alertThresholds;
        saveSettings();
        sendResponse({ success: true });
    }
});

// Initialize on install
chrome.runtime.onInstalled.addListener(async () => {
    await loadSettings();
    
    // Set up periodic fetching (every 5 minutes)
    chrome.alarms.create('fetchPrices', { periodInMinutes: 5 });
    
    // Initial fetch
    await scheduledFetch();
});

// Handle alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'fetchPrices') {
        scheduledFetch();
    }
});

console.log('[Background] Crypto Price Tracker loaded');
