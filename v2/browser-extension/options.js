/**
 * CRYPTO PRICE TRACKER - Settings Page
 */

let trackedSymbols = ['BTC', 'ETH', 'SOL'];
let alertThresholds = {};

// Load settings
async function loadSettings() {
    const result = await chrome.storage.local.get(['trackedSymbols', 'alertThresholds']);
    if (result.trackedSymbols) trackedSymbols = result.trackedSymbols;
    if (result.alertThresholds) alertThresholds = result.alertThresholds;
    
    renderSymbols();
    renderAlerts();
}

// Save settings
async function saveSettings() {
    await chrome.storage.local.set({
        trackedSymbols: trackedSymbols,
        alertThresholds: alertThresholds
    });
    
    // Notify background script
    chrome.runtime.sendMessage({
        type: 'updateSettings',
        trackedSymbols: trackedSymbols,
        alertThresholds: alertThresholds
    });
    
    const status = document.getElementById('status');
    status.textContent = '✓ Settings saved!';
    setTimeout(() => {
        status.textContent = '';
    }, 2000);
}

// Render symbol chips
function renderSymbols() {
    const container = document.getElementById('symbolList');
    if (!container) return;
    
    container.innerHTML = '';
    
    const allSymbols = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'SHIB'];
    
    for (const symbol of allSymbols) {
        const chip = document.createElement('div');
        chip.className = 'symbol-chip' + (trackedSymbols.includes(symbol) ? ' selected' : '');
        chip.textContent = symbol;
        chip.onclick = () => toggleSymbol(symbol);
        container.appendChild(chip);
    }
}

// Toggle symbol tracking
function toggleSymbol(symbol) {
    const index = trackedSymbols.indexOf(symbol);
    if (index === -1) {
        trackedSymbols.push(symbol);
    } else {
        trackedSymbols.splice(index, 1);
        // Remove alerts for this symbol
        delete alertThresholds[symbol];
    }
    renderSymbols();
    renderAlerts();
}

// Render alert inputs
function renderAlerts() {
    const container = document.getElementById('alertsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    for (const symbol of trackedSymbols) {
        const alert = alertThresholds[symbol] || {};
        
        const div = document.createElement('div');
        div.className = 'alert-item';
        div.innerHTML = `
            <div class="alert-symbol">${symbol}</div>
            <div class="alert-inputs">
                <div class="alert-input-group">
                    <label>Alert above ($)</label>
                    <input type="number" id="above_${symbol}" placeholder="e.g., 50000" value="${alert.above || ''}" step="0.01">
                </div>
                <div class="alert-input-group">
                    <label>Alert below ($)</label>
                    <input type="number" id="below_${symbol}" placeholder="e.g., 40000" value="${alert.below || ''}" step="0.01">
                </div>
            </div>
        `;
        container.appendChild(div);
    }
    
    if (trackedSymbols.length === 0) {
        container.innerHTML = '<div style="opacity:0.6; text-align:center;">Add cryptocurrencies to set alerts</div>';
    }
}

// Collect alerts from inputs
function collectAlerts() {
    const newAlerts = {};
    
    for (const symbol of trackedSymbols) {
        const aboveInput = document.getElementById(`above_${symbol}`);
        const belowInput = document.getElementById(`below_${symbol}`);
        
        const above = aboveInput?.value ? parseFloat(aboveInput.value) : null;
        const below = belowInput?.value ? parseFloat(belowInput.value) : null;
        
        if (above || below) {
            newAlerts[symbol] = {};
            if (above) newAlerts[symbol].above = above;
            if (below) newAlerts[symbol].below = below;
        }
    }
    
    alertThresholds = newAlerts;
}

// Add custom symbol
function addCustomSymbol() {
    const input = document.getElementById('newSymbol');
    const symbol = input.value.trim().toUpperCase();
    
    if (symbol && !trackedSymbols.includes(symbol)) {
        trackedSymbols.push(symbol);
        renderSymbols();
        renderAlerts();
        input.value = '';
    }
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadSettings();
    
    const saveBtn = document.getElementById('saveBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', () => {
            collectAlerts();
            saveSettings();
        });
    }
    
    const addBtn = document.getElementById('addSymbolBtn');
    if (addBtn) {
        addBtn.addEventListener('click', addCustomSymbol);
    }
    
    const newSymbolInput = document.getElementById('newSymbol');
    if (newSymbolInput) {
        newSymbolInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') addCustomSymbol();
        });
    }
});
