/**
 * CRYPTO PRICE TRACKER - Browser Extension Background Service Worker
 * Handles price fetching, notifications, and data persistence
 */

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 60000; // 60 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds

let priceCache = new Map();
let watchlist = [];
let alerts = [];
let marketMetrics = {};

// ============================================
// INITIALIZATION
// ============================================

async function initialize() {
  console.log('[Extension] Initializing Crypto Tracker Pro v1.0');
  
  // Load stored data
  await loadStorageData();
  
  // Set up periodic refresh
  chrome.alarms.create('refreshPrices', { periodInMinutes: 0.5 });
  
  // Fetch initial prices
  await refreshAllPrices();
  
  // Update badge
  await updateBadge();
}

async function loadStorageData() {
  const result = await chrome.storage.local.get(['watchlist', 'alerts', 'settings']);
  watchlist = result.watchlist || ['BTC', 'ETH', 'SOL'];
  alerts = result.alerts || [];
  
  if (result.settings) {
    // Apply settings
  }
}

// ============================================
// PRICE FETCHING
// ============================================

async function fetchMarketData() {
  try {
    const url = `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
    const response = await fetch(url);
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Update cache
    const timestamp = Date.now();
    data.forEach(coin => {
      priceCache.set(coin.symbol.toUpperCase(), {
        price: coin.current_price,
        change24h: coin.price_change_percentage_24h,
        name: coin.name,
        image: coin.image,
        marketCap: coin.market_cap,
        volume: coin.total_volume,
        timestamp: timestamp
      });
    });
    
    // Store in persistent storage
    await chrome.storage.local.set({
      priceCache: Array.from(priceCache.entries()),
      lastUpdated: timestamp
    });
    
    return data;
  } catch (error) {
    console.error('[Extension] Fetch failed:', error);
    return null;
  }
}

async function fetchGlobalMetrics() {
  try {
    const response = await fetch(`${API_BASE}/global`);
    const data = await response.json();
    
    if (data && data.data) {
      marketMetrics = {
        totalMarketCap: data.data.total_market_cap?.usd || 0,
        totalVolume: data.data.total_volume?.usd || 0,
        btcDominance: data.data.market_cap_percentage?.btc || 0,
        activeCoins: data.data.active_cryptocurrencies || 0
      };
      
      await chrome.storage.local.set({ marketMetrics: marketMetrics });
    }
  } catch (error) {
    console.error('[Extension] Global metrics fetch failed:', error);
  }
}

async function refreshAllPrices() {
  console.log('[Extension] Refreshing prices...');
  
  const [marketData, metrics] = await Promise.all([
    fetchMarketData(),
    fetchGlobalMetrics()
  ]);
  
  if (marketData) {
    await checkAlerts(marketData);
  }
  
  await updateBadge();
}

// ============================================
// ALERT SYSTEM
// ============================================

async function checkAlerts(marketData) {
  if (!alerts.length) return;
  
  const triggeredAlerts = [];
  
  for (const alert of alerts) {
    if (alert.triggered) continue;
    
    const coin = marketData.find(c => c.symbol.toUpperCase() === alert.symbol);
    if (!coin) continue;
    
    const currentPrice = coin.current_price;
    let shouldTrigger = false;
    
    if (alert.condition === 'above' && currentPrice >= alert.targetPrice) {
      shouldTrigger = true;
    } else if (alert.condition === 'below' && currentPrice <= alert.targetPrice) {
      shouldTrigger = true;
    }
    
    if (shouldTrigger) {
      alert.triggered = true;
      alert.triggeredAt = Date.now();
      triggeredAlerts.push({ alert, price: currentPrice, coin: coin });
    }
  }
  
  if (triggeredAlerts.length) {
    await chrome.storage.local.set({ alerts: alerts });
    
    for (const { alert, price, coin } of triggeredAlerts) {
      await sendNotification(alert, price, coin);
    }
  }
}

async function sendNotification(alert, currentPrice, coin) {
  const notificationId = `alert-${alert.symbol}-${Date.now()}`;
  
  chrome.notifications.create(notificationId, {
    type: 'basic',
    iconUrl: coin.image || 'icons/icon128.png',
    title: `💰 ${alert.symbol} Price Alert!`,
    message: `${alert.symbol} is now ${alert.condition} $${alert.targetPrice.toLocaleString()}. Current: $${currentPrice.toLocaleString()}`,
    priority: 2,
    buttons: [
      { title: 'View Details' },
      { title: 'Dismiss' }
    ]
  });
}

// ============================================
// BADGE UPDATE
// ============================================

async function updateBadge() {
  // Calculate total watchlist value
  let totalValue = 0;
  for (const symbol of watchlist) {
    const coinData = priceCache.get(symbol);
    if (coinData && coinData.price) {
      totalValue += coinData.price;
    }
  }
  
  if (totalValue > 0) {
    let badgeText;
    if (totalValue >= 1000) badgeText = `${Math.floor(totalValue / 1000)}k`;
    else if (totalValue >= 100) badgeText = `${Math.floor(totalValue)}`;
    else badgeText = totalValue.toFixed(0);
    
    chrome.action.setBadgeText({ text: badgeText });
    chrome.action.setBadgeBackgroundColor({ color: '#10b981' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// ============================================
// WATCHLIST MANAGEMENT
// ============================================

async function addToWatchlist(symbol) {
  if (!watchlist.includes(symbol)) {
    watchlist.push(symbol);
    await chrome.storage.local.set({ watchlist: watchlist });
    await updateBadge();
    return true;
  }
  return false;
}

async function removeFromWatchlist(symbol) {
  watchlist = watchlist.filter(s => s !== symbol);
  await chrome.storage.local.set({ watchlist: watchlist });
  await updateBadge();
  return true;
}

// ============================================
// ALARM HANDLER
// ============================================

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'refreshPrices') {
    refreshAllPrices();
  }
});

// ============================================
// MESSAGE HANDLING
// ============================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  const handler = {
    'getPrices': async () => {
      const prices = {};
      for (const symbol of watchlist) {
        const data = priceCache.get(symbol);
        if (data) {
          prices[symbol] = {
            price: data.price,
            change: data.change24h,
            name: data.name
          };
        }
      }
      return { success: true, prices: prices, metrics: marketMetrics };
    },
    
    'getAllCoins': async () => {
      const allCoins = Array.from(priceCache.entries()).map(([symbol, data]) => ({
        symbol: symbol,
        price: data.price,
        change: data.change24h,
        name: data.name
      }));
      return { success: true, coins: allCoins };
    },
    
    'refresh': async () => {
      await refreshAllPrices();
      return { success: true };
    },
    
    'addToWatchlist': async (data) => {
      const result = await addToWatchlist(data.symbol);
      return { success: result };
    },
    
    'removeFromWatchlist': async (data) => {
      const result = await removeFromWatchlist(data.symbol);
      return { success: result };
    },
    
    'createAlert': async (data) => {
      const newAlert = {
        id: Date.now(),
        symbol: data.symbol,
        condition: data.condition,
        targetPrice: data.targetPrice,
        createdAt: Date.now(),
        triggered: false
      };
      alerts.push(newAlert);
      await chrome.storage.local.set({ alerts: alerts });
      return { success: true, alert: newAlert };
    },
    
    'deleteAlert': async (data) => {
      alerts = alerts.filter(a => a.id !== data.id);
      await chrome.storage.local.set({ alerts: alerts });
      return { success: true };
    },
    
    'getAlerts': async () => {
      return { success: true, alerts: alerts };
    },
    
    'getWatchlist': async () => {
      return { success: true, watchlist: watchlist };
    }
  };
  
  const asyncHandler = handler[request.type];
  if (asyncHandler) {
    asyncHandler(request).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  sendResponse({ success: false, error: 'Unknown request type' });
  return false;
});

// ============================================
// COMMAND HANDLER
// ============================================

chrome.commands.onCommand.addListener((command) => {
  if (command === 'refresh-prices') {
    refreshAllPrices();
  }
});

// ============================================
// NOTIFICATION CLICK HANDLER
// ============================================

chrome.notifications.onButtonClick.addListener((notificationId, buttonIndex) => {
  if (buttonIndex === 0) {
    chrome.tabs.create({ url: 'popup.html' });
  }
  chrome.notifications.clear(notificationId);
});

// ============================================
// INSTALL/UPDATE HANDLER
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Extension] Installed/Updated:', details.reason);
  
  if (details.reason === 'install') {
    // First install - set default watchlist
    chrome.storage.local.set({
      watchlist: ['BTC', 'ETH', 'SOL'],
      alerts: [],
      settings: { theme: 'dark', refreshInterval: 30 }
    });
  }
  
  initialize();
});

// Start the extension
initialize();
