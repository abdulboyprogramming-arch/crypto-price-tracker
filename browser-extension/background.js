/**
 * CRYPTO PRICE TRACKER - Browser Extension Background Service Worker
 * Handles price fetching, notifications, and data persistence with proper error handling
 */

// ============================================
// CONSTANTS & CONFIGURATION
// ============================================

const API_BASE = 'https://api.coingecko.com/api/v3';
const CACHE_DURATION = 60000; // 60 seconds
const REFRESH_INTERVAL = 30000; // 30 seconds
const REQUEST_TIMEOUT = 5000; // 5 second timeout
const RATE_LIMIT = 10; // requests per minute

let priceCache = new Map();
let watchlist = [];
let alerts = [];
let marketMetrics = {};
let requestCount = 0;
let lastRequestTime = 0;

// ============================================
// INITIALIZATION
// ============================================

async function initialize() {
  console.log('[Extension] Initializing Crypto Tracker Pro v1.0.0');
  
  try {
    // Load stored data
    await loadStorageData();
    
    // Set up periodic refresh
    chrome.alarms.create('refreshPrices', { periodInMinutes: 0.5 });
    
    // Fetch initial prices
    await refreshAllPrices();
    
    // Update badge
    await updateBadge();
  } catch (error) {
    console.error('[Extension] Initialization error:', error);
  }
}

async function loadStorageData() {
  try {
    const result = await chrome.storage.local.get(['watchlist', 'alerts', 'settings', 'priceCache', 'lastUpdated']);
    watchlist = result.watchlist || ['BTC', 'ETH', 'SOL'];
    alerts = result.alerts || [];
    
    // Restore price cache from storage
    if (result.priceCache && Array.isArray(result.priceCache)) {
      priceCache = new Map(result.priceCache);
    }
    
    if (result.settings) {
      // Apply settings if needed
    }
  } catch (error) {
    console.error('[Extension] Storage load error:', error);
  }
}

// ============================================
// RATE LIMITING
// ============================================

function canMakeRequest() {
  const now = Date.now();
  if (now - lastRequestTime > 60000) {
    requestCount = 0;
    lastRequestTime = now;
  }
  return requestCount < RATE_LIMIT;
}

function recordRequest() {
  requestCount++;
}

// ============================================
// FETCH WITH TIMEOUT
// ============================================

async function fetchWithTimeout(url, timeout = REQUEST_TIMEOUT) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

// ============================================
// PRICE FETCHING
// ============================================

async function fetchMarketData() {
  try {
    if (!canMakeRequest()) {
      console.warn('[Extension] Rate limit reached');
      return null;
    }
    
    recordRequest();
    
    const url = `${API_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&page=1&sparkline=false`;
    const response = await fetchWithTimeout(url);
    
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
    try {
      await chrome.storage.local.set({
        priceCache: Array.from(priceCache.entries()),
        lastUpdated: timestamp
      });
    } catch (storageError) {
      console.error('[Extension] Storage error:', storageError);
    }
    
    return data;
  } catch (error) {
    console.error('[Extension] Fetch failed:', error);
    return null;
  }
}

async function fetchGlobalMetrics() {
  try {
    if (!canMakeRequest()) return;
    recordRequest();
    
    const response = await fetchWithTimeout(`${API_BASE}/global`);
    const data = await response.json();
    
    if (data && data.data) {
      marketMetrics = {
        totalMarketCap: data.data.total_market_cap?.usd || 0,
        totalVolume: data.data.total_volume?.usd || 0,
        btcDominance: data.data.market_cap_percentage?.btc || 0,
        activeCoins: data.data.active_cryptocurrencies || 0
      };
      
      try {
        await chrome.storage.local.set({ marketMetrics: marketMetrics });
      } catch (storageError) {
        console.error('[Extension] Storage error:', storageError);
      }
    }
  } catch (error) {
    console.error('[Extension] Global metrics fetch failed:', error);
  }
}

async function refreshAllPrices() {
  console.log('[Extension] Refreshing prices...');
  
  try {
    const [marketData, metrics] = await Promise.all([
      fetchMarketData(),
      fetchGlobalMetrics()
    ]);
    
    if (marketData) {
      await checkAlerts(marketData);
    }
    
    await updateBadge();
  } catch (error) {
    console.error('[Extension] Refresh failed:', error);
  }
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
    try {
      await chrome.storage.local.set({ alerts: alerts });
    } catch (error) {
      console.error('[Extension] Alert storage error:', error);
    }
    
    for (const { alert, price, coin } of triggeredAlerts) {
      await sendNotification(alert, price, coin);
    }
  }
}

async function sendNotification(alert, currentPrice, coin) {
  try {
    const notificationId = `alert-${alert.symbol}-${Date.now()}`;
    
    chrome.notifications.create(notificationId, {
      type: 'basic',
      iconUrl: coin.image || 'icons/icon128.png',
      title: `💰 ${alert.symbol} Price Alert!`,
      message: `${alert.symbol} is now ${alert.condition} $${currentPrice.toLocaleString()}. Target: $${alert.targetPrice.toLocaleString()}`,
      priority: 2,
      buttons: [
        { title: 'View Details' },
        { title: 'Dismiss' }
      ]
    });
  } catch (error) {
    console.error('[Extension] Notification error:', error);
  }
}

// ============================================
// BADGE UPDATE
// ============================================

async function updateBadge() {
  try {
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
  } catch (error) {
    console.error('[Extension] Badge update error:', error);
  }
}

// ============================================
// WATCHLIST MANAGEMENT
// ============================================

async function addToWatchlist(symbol) {
  if (!watchlist.includes(symbol)) {
    watchlist.push(symbol);
    try {
      await chrome.storage.local.set({ watchlist: watchlist });
    } catch (error) {
      console.error('[Extension] Watchlist save error:', error);
      return false;
    }
    await updateBadge();
    return true;
  }
  return false;
}

async function removeFromWatchlist(symbol) {
  watchlist = watchlist.filter(s => s !== symbol);
  try {
    await chrome.storage.local.set({ watchlist: watchlist });
  } catch (error) {
    console.error('[Extension] Watchlist save error:', error);
    return false;
  }
  await updateBadge();
  return true;
}

// ============================================
// MESSAGE TYPES VALIDATION
// ============================================

const VALID_MESSAGE_TYPES = [
  'getPrices',
  'getAllCoins',
  'refresh',
  'addToWatchlist',
  'removeFromWatchlist',
  'createAlert',
  'deleteAlert',
  'getAlerts',
  'getWatchlist'
];

function isValidMessageType(type) {
  return VALID_MESSAGE_TYPES.includes(type);
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
  // Validate message type
  if (!isValidMessageType(request.type)) {
    sendResponse({ success: false, error: 'Invalid message type' });
    return false;
  }
  
  const handler = {
    'getPrices': async () => {
      try {
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
      } catch (error) {
        console.error('[Extension] getPrices error:', error);
        return { success: false, error: error.message };
      }
    },
    
    'getAllCoins': async () => {
      try {
        const allCoins = Array.from(priceCache.entries()).map(([symbol, data]) => ({
          symbol: symbol,
          price: data.price,
          change: data.change24h,
          name: data.name
        }));
        return { success: true, coins: allCoins };
      } catch (error) {
        console.error('[Extension] getAllCoins error:', error);
        return { success: false, error: error.message };
      }
    },
    
    'refresh': async () => {
      try {
        await refreshAllPrices();
        return { success: true };
      } catch (error) {
        console.error('[Extension] refresh error:', error);
        return { success: false, error: error.message };
      }
    },
    
    'addToWatchlist': async (data) => {
      try {
        if (!data.symbol || typeof data.symbol !== 'string') {
          return { success: false, error: 'Invalid symbol' };
        }
        const result = await addToWatchlist(data.symbol.toUpperCase());
        return { success: result };
      } catch (error) {
        console.error('[Extension] addToWatchlist error:', error);
        return { success: false, error: error.message };
      }
    },
    
    'removeFromWatchlist': async (data) => {
      try {
        if (!data.symbol || typeof data.symbol !== 'string') {
          return { success: false, error: 'Invalid symbol' };
        }
        const result = await removeFromWatchlist(data.symbol.toUpperCase());
        return { success: result };
      } catch (error) {
        console.error('[Extension] removeFromWatchlist error:', error);
        return { success: false, error: error.message };
      }
    },
    
    'createAlert': async (data) => {
      try {
        if (!data.symbol || !data.condition || !data.targetPrice) {
          return { success: false, error: 'Missing required fields' };
        }
        if (typeof data.targetPrice !== 'number' || data.targetPrice <= 0) {
          return { success: false, error: 'Invalid target price' };
        }
        
        const newAlert = {
          id: Date.now(),
          symbol: data.symbol.toUpperCase(),
          condition: data.condition,
          targetPrice: data.targetPrice,
          createdAt: Date.now(),
          triggered: false
        };
        alerts.push(newAlert);
        await chrome.storage.local.set({ alerts: alerts });
        return { success: true, alert: newAlert };
      } catch (error) {
        console.error('[Extension] createAlert error:', error);
        return { success: false, error: error.message };
      }
    },
    
    'deleteAlert': async (data) => {
      try {
        if (typeof data.id !== 'number') {
          return { success: false, error: 'Invalid alert ID' };
        }
        alerts = alerts.filter(a => a.id !== data.id);
        await chrome.storage.local.set({ alerts: alerts });
        return { success: true };
      } catch (error) {
        console.error('[Extension] deleteAlert error:', error);
        return { success: false, error: error.message };
      }
    },
    
    'getAlerts': async () => {
      try {
        return { success: true, alerts: alerts };
      } catch (error) {
        console.error('[Extension] getAlerts error:', error);
        return { success: false, error: error.message };
      }
    },
    
    'getWatchlist': async () => {
      try {
        return { success: true, watchlist: watchlist };
      } catch (error) {
        console.error('[Extension] getWatchlist error:', error);
        return { success: false, error: error.message };
      }
    }
  };
  
  const asyncHandler = handler[request.type];
  if (asyncHandler) {
    asyncHandler(request).then(sendResponse);
    return true; // Keep channel open for async response
  }
  
  sendResponse({ success: false, error: 'Handler not found' });
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
  try {
    if (buttonIndex === 0) {
      chrome.tabs.create({ url: 'popup.html' });
    }
    chrome.notifications.clear(notificationId);
  } catch (error) {
    console.error('[Extension] Notification click error:', error);
  }
});

// ============================================
// INSTALL/UPDATE HANDLER
// ============================================

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[Extension] Installed/Updated:', details.reason);
  
  if (details.reason === 'install') {
    // First install - set default settings
    chrome.storage.local.set({
      watchlist: ['BTC', 'ETH', 'SOL'],
      alerts: [],
      settings: { theme: 'dark', refreshInterval: 30, notifications: true }
    });
  }
  
  initialize();
});

// ============================================
// START EXTENSION
// ============================================

initialize();
