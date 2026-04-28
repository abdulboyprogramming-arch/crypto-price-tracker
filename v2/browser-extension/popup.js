/**
 * CRYPTO PRICE TRACKER - Browser Extension Popup Script
 * Handles UI interactions, data display, and user actions
 */

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    // Stats
    totalMarketCap: document.getElementById('totalMarketCap'),
    totalVolume: document.getElementById('totalVolume'),
    lastUpdated: document.getElementById('lastUpdated'),
    
    // Tabs
    tabs: document.querySelectorAll('.tab'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Buttons
    refreshBtn: document.getElementById('refreshPricesBtn'),
    settingsLink: document.getElementById('settingsLink'),
    
    // Containers
    pricesList: document.getElementById('pricesList'),
    watchlistList: document.getElementById('watchlistList'),
    alertsList: document.getElementById('alertsList')
};

// ============================================
// STATE
// ============================================

let currentPrices = {};
let currentWatchlist = [];
let currentAlerts = [];
let marketMetrics = {};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNumber(num, decimals = 2) {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1e12) return `$${(num / 1e12).toFixed(decimals)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(decimals)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(decimals)}K`;
    if (num < 0.01) return `$${num.toFixed(8)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    return `$${num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
}

function formatChange(change) {
    if (change === undefined || change === null) return '--';
    const isPositive = change >= 0;
    const arrow = isPositive ? '▲' : '▼';
    const colorClass = isPositive ? 'positive' : 'negative';
    return `<span class="coin-change ${colorClass}">${arrow} ${Math.abs(change).toFixed(2)}%</span>`;
}

function updateLastUpdated() {
    const now = new Date();
    if (elements.lastUpdated) {
        elements.lastUpdated.textContent = `Updated: ${now.toLocaleTimeString()}`;
    }
}

// ============================================
// API COMMUNICATION
// ============================================

async function sendMessage(type, data = {}) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type, ...data }, (response) => {
            resolve(response || { success: false });
        });
    });
}

async function loadData() {
    // Get prices
    const priceResponse = await sendMessage('getPrices');
    if (priceResponse.success) {
        currentPrices = priceResponse.prices;
        marketMetrics = priceResponse.metrics || {};
        updateStats();
        renderPrices();
    }
    
    // Get watchlist
    const watchlistResponse = await sendMessage('getWatchlist');
    if (watchlistResponse.success) {
        currentWatchlist = watchlistResponse.watchlist;
        renderWatchlist();
    }
    
    // Get alerts
    const alertsResponse = await sendMessage('getAlerts');
    if (alertsResponse.success) {
        currentAlerts = alertsResponse.alerts;
        renderAlerts();
    }
    
    updateLastUpdated();
}

async function refreshData() {
    if (elements.refreshBtn) {
        const icon = elements.refreshBtn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
    }
    
    const response = await sendMessage('refresh');
    
    if (elements.refreshBtn) {
        const icon = elements.refreshBtn.querySelector('i');
        if (icon) icon.classList.remove('fa-spin');
    }
    
    if (response.success) {
        await loadData();
    }
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function updateStats() {
    if (elements.totalMarketCap && marketMetrics.totalMarketCap) {
        elements.totalMarketCap.textContent = formatNumber(marketMetrics.totalMarketCap, 0);
    }
    if (elements.totalVolume && marketMetrics.totalVolume) {
        elements.totalVolume.textContent = formatNumber(marketMetrics.totalVolume, 0);
    }
}

function renderPrices() {
    if (!elements.pricesList) return;
    
    // Show top 10 coins by market cap
    const topCoins = Object.entries(currentPrices)
        .sort((a, b) => (b[1].marketCap || 0) - (a[1].marketCap || 0))
        .slice(0, 10);
    
    if (topCoins.length === 0) {
        elements.pricesList.innerHTML = '<div class="empty-state">Loading prices...</div>';
        return;
    }
    
    elements.pricesList.innerHTML = topCoins.map(([symbol, data]) => `
        <div class="coin-item">
            <div class="coin-info">
                <strong class="coin-symbol">${symbol}</strong>
                <span class="coin-name" style="font-size:0.7rem; opacity:0.7;">${data.name || ''}</span>
            </div>
            <div>
                <div class="coin-price">${formatNumber(data.price)}</div>
                ${formatChange(data.change24h)}
            </div>
        </div>
    `).join('');
}

function renderWatchlist() {
    if (!elements.watchlistList) return;
    
    if (currentWatchlist.length === 0) {
        elements.watchlistList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-star"></i>
                <p>Your watchlist is empty</p>
                <p style="font-size:0.7rem;">Add coins from the Prices tab</p>
            </div>
        `;
        return;
    }
    
    const watchlistWithPrices = currentWatchlist.map(symbol => ({
        symbol: symbol,
        data: currentPrices[symbol] || null
    }));
    
    elements.watchlistList.innerHTML = watchlistWithPrices.map(({ symbol, data }) => `
        <div class="coin-item">
            <div class="coin-info">
                <strong class="coin-symbol">${symbol}</strong>
            </div>
            <div>
                <div class="coin-price">${data ? formatNumber(data.price) : 'N/A'}</div>
                ${data ? formatChange(data.change24h) : '<span class="coin-change">--</span>'}
            </div>
            <button class="watchlist-btn" data-symbol="${symbol}">
                <i class="fas fa-trash"></i>
            </button>
        </div>
    `).join('');
    
    // Add remove event listeners
    document.querySelectorAll('.watchlist-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const symbol = btn.dataset.symbol;
            await sendMessage('removeFromWatchlist', { symbol });
            await loadData();
        });
    });
}

function renderAlerts() {
    if (!elements.alertsList) return;
    
    if (currentAlerts.length === 0) {
        elements.alertsList.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-bell"></i>
                <p>No alerts set</p>
                <p style="font-size:0.7rem;">Open Settings to create alerts</p>
            </div>
        `;
        return;
    }
    
    elements.alertsList.innerHTML = currentAlerts.map(alert => `
        <div class="alert-item">
            <div>
                <strong>${alert.symbol}</strong>
                <span class="${alert.triggered ? 'positive' : ''}"> ${alert.condition} $${alert.targetPrice.toLocaleString()}</span>
                ${alert.triggered ? '<span class="positive"> ✓ Triggered</span>' : ''}
            </div>
            <button class="delete-alert" data-id="${alert.id}">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `).join('');
    
    // Add delete event listeners
    document.querySelectorAll('.delete-alert').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            const id = parseInt(btn.dataset.id);
            await sendMessage('deleteAlert', { id });
            await loadData();
        });
    });
}

// ============================================
// TAB SWITCHING
// ============================================

function setupTabs() {
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const tabId = tab.dataset.tab;
            
            // Update tab active states
            elements.tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            // Update content visibility
            elements.tabContents.forEach(content => content.classList.remove('active'));
            const activeContent = document.getElementById(`${tabId}Tab`);
            if (activeContent) activeContent.classList.add('active');
        });
    });
}

// ============================================
// SETTINGS
// ============================================

function openSettings() {
    chrome.runtime.openOptionsPage();
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    if (elements.refreshBtn) {
        elements.refreshBtn.addEventListener('click', refreshData);
    }
    
    if (elements.settingsLink) {
        elements.settingsLink.addEventListener('click', (e) => {
            e.preventDefault();
            openSettings();
        });
    }
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    setupTabs();
    setupEventListeners();
    await loadData();
    
    // Auto-refresh every 30 seconds
    setInterval(() => {
        loadData();
    }, 30000);
}

// Start the popup
init();
