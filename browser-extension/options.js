/**
 * CRYPTO PRICE TRACKER - Options Page Script
 */

// ============================================
// DOM ELEMENTS
// ============================================

const elements = {
    watchlistContainer: document.getElementById('watchlistContainer'),
    alertsContainer: document.getElementById('alertsContainer'),
    newSymbol: document.getElementById('newSymbol'),
    addSymbolBtn: document.getElementById('addSymbolBtn'),
    alertSymbol: document.getElementById('alertSymbol'),
    alertCondition: document.getElementById('alertCondition'),
    alertPrice: document.getElementById('alertPrice'),
    createAlertBtn: document.getElementById('createAlertBtn'),
    themeSelect: document.getElementById('themeSelect'),
    refreshInterval: document.getElementById('refreshInterval'),
    currencySelect: document.getElementById('currencySelect'),
    notificationToggle: document.getElementById('notificationToggle'),
    soundToggle: document.getElementById('soundToggle'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    statusMessage: document.getElementById('statusMessage')
};

// ============================================
// STATE
// ============================================

let watchlist = [];
let alerts = [];
let allCoins = [];

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showStatus(message, isError = false) {
    if (!elements.statusMessage) return;
    elements.statusMessage.textContent = message;
    elements.statusMessage.className = `status-message ${isError ? 'error' : 'success'}`;
    setTimeout(() => {
        elements.statusMessage.className = 'status-message';
    }, 3000);
}

async function sendMessage(type, data = {}) {
    return new Promise((resolve) => {
        chrome.runtime.sendMessage({ type, ...data }, (response) => {
            resolve(response || { success: false });
        });
    });
}

// ============================================
// LOAD DATA
// ============================================

async function loadWatchlist() {
    const response = await sendMessage('getWatchlist');
    if (response.success) {
        watchlist = response.watchlist;
        renderWatchlist();
    }
}

async function loadAlerts() {
    const response = await sendMessage('getAlerts');
    if (response.success) {
        alerts = response.alerts;
        renderAlerts();
    }
}

async function loadAllCoins() {
    const response = await sendMessage('getAllCoins');
    if (response.success) {
        allCoins = response.coins;
        populateCoinSelect();
    }
}

async function loadSettings() {
    const result = await chrome.storage.local.get(['settings']);
    const settings = result.settings || {};
    
    if (elements.themeSelect) elements.themeSelect.value = settings.theme || 'dark';
    if (elements.refreshInterval) elements.refreshInterval.value = settings.refreshInterval || '30';
    if (elements.currencySelect) elements.currencySelect.value = settings.currency || 'usd';
    if (elements.notificationToggle) elements.notificationToggle.checked = settings.notifications || false;
    if (elements.soundToggle) elements.soundToggle.checked = settings.soundAlerts || false;
}

// ============================================
// RENDER FUNCTIONS
// ============================================

function renderWatchlist() {
    if (!elements.watchlistContainer) return;
    
    if (watchlist.length === 0) {
        elements.watchlistContainer.innerHTML = '<div style="opacity:0.6;">No coins in watchlist. Add some above!</div>';
        return;
    }
    
    elements.watchlistContainer.innerHTML = watchlist.map(symbol => `
        <div class="watchlist-chip">
            ${symbol}
            <button class="remove-chip" data-symbol="${symbol}">✕</button>
        </div>
    `).join('');
    
    // Add remove event listeners
    document.querySelectorAll('.remove-chip').forEach(btn => {
        btn.addEventListener('click', async () => {
            const symbol = btn.dataset.symbol;
            await sendMessage('removeFromWatchlist', { symbol });
            await loadWatchlist();
        });
    });
}

function renderAlerts() {
    if (!elements.alertsContainer) return;
    
    if (alerts.length === 0) {
        elements.alertsContainer.innerHTML = '<div style="opacity:0.6; text-align:center; padding:20px;">No alerts set. Create one below!</div>';
        return;
    }
    
    elements.alertsContainer.innerHTML = alerts.map(alert => `
        <div class="alert-card">
            <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <strong>${alert.symbol}</strong> ${alert.condition} $${alert.targetPrice.toLocaleString()}
                    ${alert.triggered ? '<span style="color:#10b981;"> (Triggered)</span>' : ''}
                </div>
                <button class="delete-alert" data-id="${alert.id}" style="background:#ef4444; padding:5px 10px;">Delete</button>
            </div>
            <div style="font-size:0.7rem; opacity:0.6;">Created: ${new Date(alert.createdAt).toLocaleDateString()}</div>
        </div>
    `).join('');
    
    // Add delete event listeners
    document.querySelectorAll('.delete-alert').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = parseInt(btn.dataset.id);
            await sendMessage('deleteAlert', { id });
            await loadAlerts();
        });
    });
}

function populateCoinSelect() {
    if (!elements.alertSymbol) return;
    
    const symbols = allCoins.map(coin => coin.symbol).slice(0, 50);
    elements.alertSymbol.innerHTML = '<option value="">Select Coin</option>' + 
        symbols.map(sym => `<option value="${sym}">${sym}</option>`).join('');
}

// ============================================
// ACTIONS
// ============================================

async function addToWatchlist() {
    const symbol = elements.newSymbol?.value.trim().toUpperCase();
    if (!symbol) {
        showStatus('Please enter a symbol', true);
        return;
    }
    
    const response = await sendMessage('addToWatchlist', { symbol });
    if (response.success) {
        showStatus(`${symbol} added to watchlist`);
        elements.newSymbol.value = '';
        await loadWatchlist();
    } else {
        showStatus(`Failed to add ${symbol}`, true);
    }
}

async function createAlert() {
    const symbol = elements.alertSymbol?.value;
    const condition = elements.alertCondition?.value;
    const targetPrice = parseFloat(elements.alertPrice?.value);
    
    if (!symbol) {
        showStatus('Please select a coin', true);
        return;
    }
    if (!targetPrice || targetPrice <= 0) {
        showStatus('Please enter a valid target price', true);
        return;
    }
    
    const response = await sendMessage('createAlert', { symbol, condition, targetPrice });
    if (response.success) {
        showStatus(`Alert created for ${symbol} ${condition} $${targetPrice}`);
        elements.alertSymbol.value = '';
        elements.alertPrice.value = '';
        await loadAlerts();
    } else {
        showStatus('Failed to create alert', true);
    }
}

async function saveSettings() {
    const settings = {
        theme: elements.themeSelect?.value || 'dark',
        refreshInterval: parseInt(elements.refreshInterval?.value) || 30,
        currency: elements.currencySelect?.value || 'usd',
        notifications: elements.notificationToggle?.checked || false,
        soundAlerts: elements.soundToggle?.checked || false
    };
    
    await chrome.storage.local.set({ settings });
    showStatus('Settings saved');
}

async function exportData() {
    const result = await chrome.storage.local.get(['watchlist', 'alerts', 'settings']);
    const data = {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        watchlist: result.watchlist || [],
        alerts: result.alerts || [],
        settings: result.settings || {}
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crypto-tracker-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showStatus('Data exported successfully');
}

async function clearAllData() {
    if (confirm('WARNING: This will delete all your watchlist, alerts, and settings. This cannot be undone. Continue?')) {
        await chrome.storage.local.clear();
        await loadWatchlist();
        await loadAlerts();
        await loadSettings();
        showStatus('All data cleared');
    }
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners() {
    if (elements.addSymbolBtn) {
        elements.addSymbolBtn.addEventListener('click', addToWatchlist);
    }
    
    if (elements.createAlertBtn) {
        elements.createAlertBtn.addEventListener('click', createAlert);
    }
    
    if (elements.newSymbol) {
        elements.newSymbol.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addToWatchlist();
        });
    }
    
    if (elements.exportDataBtn) {
        elements.exportDataBtn.addEventListener('click', exportData);
    }
    
    if (elements.clearDataBtn) {
        elements.clearDataBtn.addEventListener('click', clearAllData);
    }
    
    // Save settings on change
    const settingElements = [elements.themeSelect, elements.refreshInterval, elements.currencySelect, elements.notificationToggle, elements.soundToggle];
    settingElements.forEach(el => {
        if (el) {
            el.addEventListener('change', saveSettings);
        }
    });
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    setupEventListeners();
    await Promise.all([
        loadWatchlist(),
        loadAlerts(),
        loadAllCoins(),
        loadSettings()
    ]);
}

init();
