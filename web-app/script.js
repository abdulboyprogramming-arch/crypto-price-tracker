/**
 * CRYPTO PRICE TRACKER V2.0 - Main Application Logic
 * Features: Real-time data, watchlist, alerts, charts, dark/light theme, PWA
 */

// ============================================
// APPLICATION STATE
// ============================================

const AppState = {
    // Data
    allCoins: [],
    filteredCoins: [],
    watchlist: [],
    alerts: [],
    marketMetrics: {},
    trending: { gainers: [], losers: [] },
    
    // UI State
    currentPage: 1,
    currentSort: { field: 'market_cap_rank', direction: 'asc' },
    currentTrendTab: 'gainers',
    currentTheme: 'dark',
    currentCurrency: 'usd',
    refreshInterval: 30,
    autoRefreshEnabled: true,
    
    // Chart instances
    priceChart: null,
    analyticsChart: null,
    
    // Refresh timer
    refreshTimer: null,
    
    // Currency symbols
    currencySymbols: {
        usd: '$',
        eur: '€',
        gbp: '£',
        jpy: '¥'
    }
};

// ============================================
// DOM ELEMENTS
// ============================================

const DOM = {
    // Loading
    loadingOverlay: document.getElementById('loadingOverlay'),
    
    // Navigation
    sidebar: document.getElementById('sidebar'),
    sidebarToggle: document.getElementById('sidebarToggle'),
    navItems: document.querySelectorAll('.nav-item'),
    pages: document.querySelectorAll('.page'),
    pageTitle: document.getElementById('pageTitle'),
    
    // Header
    lastUpdated: document.getElementById('lastUpdated'),
    refreshBtn: document.getElementById('refreshBtn'),
    themeToggle: document.getElementById('themeToggle'),
    globalSearch: document.getElementById('globalSearch'),
    searchResults: document.getElementById('searchResults'),
    
    // Dashboard
    totalMarketCap: document.getElementById('totalMarketCap'),
    totalVolume: document.getElementById('totalVolume'),
    btcDominance: document.getElementById('btcDominance'),
    activeCoins: document.getElementById('activeCoins'),
    trendingGrid: document.getElementById('trendingGrid'),
    trendTabs: document.querySelectorAll('[data-trend]'),
    cryptoTableBody: document.getElementById('cryptoTableBody'),
    prevPageBtn: document.getElementById('prevPage'),
    nextPageBtn: document.getElementById('nextPage'),
    pageInfo: document.getElementById('pageInfo'),
    sortBtns: document.querySelectorAll('.sort-btn'),
    
    // Chart
    chartTimeBtns: document.querySelectorAll('.chart-time-btn'),
    
    // Watchlist
    watchlistContainer: document.getElementById('watchlistContainer'),
    watchlistBadge: document.getElementById('watchlistBadge'),
    
    // Alerts
    alertSymbol: document.getElementById('alertSymbol'),
    alertCondition: document.getElementById('alertCondition'),
    alertPrice: document.getElementById('alertPrice'),
    createAlertBtn: document.getElementById('createAlertBtn'),
    alertsList: document.getElementById('alertsList'),
    
    // Analytics
    analyticsCoin: document.getElementById('analyticsCoin'),
    metricsList: document.getElementById('metricsList'),
    
    // Settings
    themeOptions: document.querySelectorAll('[data-theme]'),
    refreshIntervalSelect: document.getElementById('refreshInterval'),
    currencySelect: document.getElementById('currencySelect'),
    notificationToggle: document.getElementById('notificationToggle'),
    soundAlertsToggle: document.getElementById('soundAlertsToggle'),
    clearCacheBtn: document.getElementById('clearCacheBtn'),
    exportDataBtn: document.getElementById('exportDataBtn')
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'fa-info-circle';
    if (type === 'success') icon = 'fa-check-circle';
    if (type === 'error') icon = 'fa-exclamation-circle';
    if (type === 'warning') icon = 'fa-exclamation-triangle';
    
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas ${icon}"></i>
            <span>${message}</span>
        </div>
    `;
    
    toastContainer.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

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
    const color = isPositive ? 'positive' : 'negative';
    return `<span class="change-cell ${color}">${arrow} ${Math.abs(change).toFixed(2)}%</span>`;
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// ============================================
// API SERVICE
// ============================================

const API = {
    baseUrl: 'https://api.coingecko.com/api/v3',
    
    async request(endpoint) {
        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            return null;
        }
    },
    
    async getMarketData(currency = 'usd', perPage = 100) {
        const data = await this.request(`/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false`);
        if (data && Array.isArray(data)) {
            AppState.allCoins = data;
            AppState.filteredCoins = [...data];
            return data;
        }
        return [];
    },
    
    async getGlobalData() {
        const data = await this.request('/global');
        if (data && data.data) {
            AppState.marketMetrics = {
                totalMarketCap: data.data.total_market_cap?.usd || 0,
                totalVolume: data.data.total_volume?.usd || 0,
                btcDominance: data.data.market_cap_percentage?.btc || 0,
                activeCoins: data.data.active_cryptocurrencies || 0
            };
            return AppState.marketMetrics;
        }
        return null;
    },
    
    async getCoinHistory(id, days = 7) {
        return await this.request(`/coins/${id}/market_chart?vs_currency=usd&days=${days}`);
    }
};

// ============================================
// STORAGE SERVICE (LocalStorage)
// ============================================

const Storage = {
    saveWatchlist() {
        localStorage.setItem('crypto_watchlist', JSON.stringify(AppState.watchlist));
        this.updateWatchlistBadge();
    },
    
    loadWatchlist() {
        const saved = localStorage.getItem('crypto_watchlist');
        if (saved) {
            AppState.watchlist = JSON.parse(saved);
        }
        this.updateWatchlistBadge();
        return AppState.watchlist;
    },
    
    saveAlerts() {
        localStorage.setItem('crypto_alerts', JSON.stringify(AppState.alerts));
    },
    
    loadAlerts() {
        const saved = localStorage.getItem('crypto_alerts');
        if (saved) {
            AppState.alerts = JSON.parse(saved);
        }
        return AppState.alerts;
    },
    
    saveSettings() {
        localStorage.setItem('crypto_settings', JSON.stringify({
            theme: AppState.currentTheme,
            currency: AppState.currentCurrency,
            refreshInterval: AppState.refreshInterval
        }));
    },
    
    loadSettings() {
        const saved = localStorage.getItem('crypto_settings');
        if (saved) {
            const settings = JSON.parse(saved);
            AppState.currentTheme = settings.theme || 'dark';
            AppState.currentCurrency = settings.currency || 'usd';
            AppState.refreshInterval = settings.refreshInterval || 30;
            this.applyTheme();
        }
    },
    
    updateWatchlistBadge() {
        if (DOM.watchlistBadge) {
            const count = AppState.watchlist.length;
            DOM.watchlistBadge.textContent = count;
            DOM.watchlistBadge.style.display = count > 0 ? 'inline-block' : 'none';
        }
    },
    
    isInWatchlist(symbol) {
        return AppState.watchlist.some(item => item.symbol === symbol);
    },
    
    addToWatchlist(coin) {
        if (!this.isInWatchlist(coin.symbol)) {
            AppState.watchlist.push({
                symbol: coin.symbol,
                name: coin.name,
                addedAt: new Date().toISOString()
            });
            this.saveWatchlist();
            showToast(`${coin.symbol} added to watchlist`, 'success');
            return true;
        }
        return false;
    },
    
    removeFromWatchlist(symbol) {
        AppState.watchlist = AppState.watchlist.filter(item => item.symbol !== symbol);
        this.saveWatchlist();
        showToast(`${symbol} removed from watchlist`, 'info');
        return true;
    },
    
    toggleWatchlist(coin) {
        if (this.isInWatchlist(coin.symbol)) {
            this.removeFromWatchlist(coin.symbol);
            return false;
        } else {
            this.addToWatchlist(coin);
            return true;
        }
    },
    
    applyTheme() {
        const isDark = AppState.currentTheme === 'dark';
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
        document.body.style.backgroundColor = isDark ? '#0a0a0f' : '#f5f7fb';
        
        // Update theme toggle icon
        if (DOM.themeToggle) {
            const icon = DOM.themeToggle.querySelector('i');
            if (icon) {
                icon.className = isDark ? 'fas fa-moon' : 'fas fa-sun';
            }
        }
    }
};

// ============================================
// ALERT SERVICE
// ============================================

const AlertService = {
    createAlert(symbol, condition, targetPrice) {
        const alert = {
            id: Date.now(),
            symbol: symbol.toUpperCase(),
            condition: condition,
            targetPrice: parseFloat(targetPrice),
            createdAt: new Date().toISOString(),
            triggered: false
        };
        AppState.alerts.push(alert);
        Storage.saveAlerts();
        this.renderAlerts();
        showToast(`Alert created for ${symbol} ${condition} $${targetPrice}`, 'success');
        
        // Request notification permission if needed
        if (DOM.notificationToggle && DOM.notificationToggle.checked) {
            Notification.requestPermission();
        }
    },
    
    deleteAlert(id) {
        AppState.alerts = AppState.alerts.filter(alert => alert.id !== id);
        Storage.saveAlerts();
        this.renderAlerts();
        showToast('Alert deleted', 'info');
    },
    
    checkAlerts(coin) {
        const triggeredAlerts = AppState.alerts.filter(alert => 
            !alert.triggered && 
            alert.symbol === coin.symbol &&
            ((alert.condition === 'above' && coin.current_price >= alert.targetPrice) ||
             (alert.condition === 'below' && coin.current_price <= alert.targetPrice))
        );
        
        triggeredAlerts.forEach(alert => {
            alert.triggered = true;
            this.sendNotification(alert, coin);
        });
        
        if (triggeredAlerts.length > 0) {
            Storage.saveAlerts();
            this.renderAlerts();
        }
    },
    
    sendNotification(alert, coin) {
        // Show toast
        showToast(`${alert.symbol} ${alert.condition} $${alert.targetPrice}! Current: $${coin.current_price}`, 'warning');
        
        // Play sound
        if (DOM.soundAlertsToggle && DOM.soundAlertsToggle.checked) {
            const audio = document.getElementById('alertSound');
            if (audio) audio.play().catch(e => console.log('Audio play failed:', e));
        }
        
        // Desktop notification
        if (DOM.notificationToggle && DOM.notificationToggle.checked && Notification.permission === 'granted') {
            new Notification(`Price Alert: ${alert.symbol}`, {
                body: `${alert.symbol} is now ${alert.condition} $${alert.targetPrice}. Current: $${coin.current_price}`,
                icon: '/assets/icons/icon-192x192.png'
            });
        }
    },
    
    renderAlerts() {
        if (!DOM.alertsList) return;
        
        if (AppState.alerts.length === 0) {
            DOM.alertsList.innerHTML = '<div class="empty-watchlist">No alerts set. Create one above!</div>';
            return;
        }
        
        DOM.alertsList.innerHTML = AppState.alerts.map(alert => `
            <div class="alert-item">
                <div>
                    <strong>${alert.symbol}</strong>
                    <span class="text-muted"> ${alert.condition} $${alert.targetPrice.toLocaleString()}</span>
                    <div class="text-muted" style="font-size: 0.7rem;">Created: ${new Date(alert.createdAt).toLocaleDateString()}</div>
                </div>
                <button class="delete-alert-btn" data-id="${alert.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Add delete event listeners
        document.querySelectorAll('.delete-alert-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(btn.dataset.id);
                this.deleteAlert(id);
            });
        });
    },
    
    populateSymbolSelect() {
        if (!DOM.alertSymbol) return;
        const symbols = [...new Set(AppState.allCoins.map(coin => coin.symbol.toUpperCase()))].slice(0, 50);
        DOM.alertSymbol.innerHTML = '<option value="">Select Coin</option>' + 
            symbols.map(sym => `<option value="${sym}">${sym}</option>`).join('');
    }
};

// ============================================
// WATCHLIST SERVICE
// ============================================

const WatchlistService = {
    async renderWatchlist() {
        if (!DOM.watchlistContainer) return;
        
        if (AppState.watchlist.length === 0) {
            DOM.watchlistContainer.innerHTML = '<div class="empty-watchlist"><i class="fas fa-star"></i><p>Your watchlist is empty. Add coins from the dashboard!</p></div>';
            return;
        }
        
        // Get current prices for watchlist items
        const watchlistWithPrices = [];
        for (const item of AppState.watchlist) {
            const coin = AppState.allCoins.find(c => c.symbol === item.symbol);
            if (coin) {
                watchlistWithPrices.push({
                    ...item,
                    price: coin.current_price,
                    change: coin.price_change_percentage_24h
                });
            }
        }
        
        DOM.watchlistContainer.innerHTML = watchlistWithPrices.map(item => `
            <div class="watchlist-item">
                <div class="watchlist-item-info">
                    <i class="fas fa-star" style="color: #f59e0b;"></i>
                    <div>
                        <div class="watchlist-item-symbol">${item.symbol}</div>
                        <div class="text-muted">${item.name || ''}</div>
                    </div>
                </div>
                <div class="watchlist-item-price">${formatNumber(item.price)}</div>
                <div class="${item.change >= 0 ? 'positive' : 'negative'}">${item.change >= 0 ? '▲' : '▼'} ${Math.abs(item.change).toFixed(2)}%</div>
                <button class="watchlist-btn active" data-symbol="${item.symbol}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
        
        // Add remove event listeners
        document.querySelectorAll('.watchlist-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const symbol = btn.dataset.symbol;
                Storage.removeFromWatchlist(symbol);
                this.renderWatchlist();
                renderDashboard(); // Refresh dashboard to update watchlist buttons
            });
        });
    }
};

// ============================================
// DASHBOARD RENDERING
// ============================================

async function renderDashboard() {
    if (!DOM.cryptoTableBody) return;
    
    const startIndex = (AppState.currentPage - 1) * 20;
    const endIndex = startIndex + 20;
    const coinsToShow = AppState.filteredCoins.slice(startIndex, endIndex);
    
    if (coinsToShow.length === 0) {
        DOM.cryptoTableBody.innerHTML = '<tr><td colspan="7" class="loading-cell">No cryptocurrencies found</td></tr>';
        return;
    }
    
    DOM.cryptoTableBody.innerHTML = coinsToShow.map((coin, index) => {
        const rank = startIndex + index + 1;
        const isInWatchlist = Storage.isInWatchlist(coin.symbol);
        
        return `
            <tr data-symbol="${coin.symbol}">
                <td>${rank}</td>
                <td>
                    <div class="coin-cell">
                        <img src="${coin.image}" alt="${coin.name}" onerror="this.src='https://placehold.co/32x32'">
                        <div>
                            <div class="coin-name">${coin.name}</div>
                            <div class="coin-symbol">${coin.symbol.toUpperCase()}</div>
                        </div>
                    </div>
                </td>
                <td class="price-cell">${formatNumber(coin.current_price)}</td>
                <td>${formatChange(coin.price_change_percentage_24h)}</td>
                <td>${formatNumber(coin.total_volume, 0)}</td>
                <td>${formatNumber(coin.market_cap, 0)}</td>
                <td>
                    <button class="watchlist-btn ${isInWatchlist ? 'active' : ''}" data-symbol="${coin.symbol}">
                        <i class="fas ${isInWatchlist ? 'fa-star' : 'fa-star-o'}"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
    
    // Add watchlist button event listeners
    document.querySelectorAll('.watchlist-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const symbol = btn.dataset.symbol;
            const coin = AppState.allCoins.find(c => c.symbol === symbol);
            if (coin) {
                const isNowInWatchlist = Storage.toggleWatchlist(coin);
                btn.classList.toggle('active', isNowInWatchlist);
                const icon = btn.querySelector('i');
                if (icon) {
                    icon.className = isNowInWatchlist ? 'fas fa-star' : 'fas fa-star-o';
                }
                // Update watchlist page if visible
                if (document.querySelector('[data-page="watchlist"]').classList.contains('active')) {
                    await WatchlistService.renderWatchlist();
                }
            }
        });
    });
    
    updatePagination();
}

function updatePagination() {
    const totalPages = Math.ceil(AppState.filteredCoins.length / 20);
    if (DOM.pageInfo) DOM.pageInfo.textContent = `Page ${AppState.currentPage} of ${totalPages}`;
    if (DOM.prevPageBtn) DOM.prevPageBtn.disabled = AppState.currentPage === 1;
    if (DOM.nextPageBtn) DOM.nextPageBtn.disabled = AppState.currentPage === totalPages;
}

function renderTrending() {
    if (!DOM.trendingGrid) return;
    
    const trendingData = AppState.currentTrendTab === 'gainers' ? AppState.trending.gainers : AppState.trending.losers;
    
    if (trendingData.length === 0) {
        DOM.trendingGrid.innerHTML = '<div class="empty-watchlist">Loading market movers...</div>';
        return;
    }
    
    DOM.trendingGrid.innerHTML = trendingData.slice(0, 8).map(coin => `
        <div class="trending-card">
            <div class="symbol">${coin.symbol.toUpperCase()}</div>
            <div class="price">${formatNumber(coin.price)}</div>
            <div class="change ${coin.change >= 0 ? 'positive' : 'negative'}">
                ${coin.change >= 0 ? '▲' : '▼'} ${Math.abs(coin.change).toFixed(2)}%
            </div>
        </div>
    `).join('');
}

function renderMarketStats() {
    if (DOM.totalMarketCap) {
        DOM.totalMarketCap.textContent = formatNumber(AppState.marketMetrics.totalMarketCap, 0);
    }
    if (DOM.totalVolume) {
        DOM.totalVolume.textContent = formatNumber(AppState.marketMetrics.totalVolume, 0);
    }
    if (DOM.btcDominance) {
        DOM.btcDominance.textContent = `${AppState.marketMetrics.btcDominance?.toFixed(2) || 0}%`;
    }
    if (DOM.activeCoins) {
        DOM.activeCoins.textContent = AppState.marketMetrics.activeCoins?.toLocaleString() || '0';
    }
}

// ============================================
// CHART FUNCTIONS
// ============================================

async function initPriceChart() {
    const ctx = document.getElementById('priceChart')?.getContext('2d');
    if (!ctx) return;
    
    // Destroy existing chart if any
    if (AppState.priceChart) {
        AppState.priceChart.destroy();
    }
    
    // Fetch historical data for BTC (as market proxy)
    const history = await API.getCoinHistory('bitcoin', 30);
    
    if (history && history.prices) {
        const labels = history.prices.map(price => {
            const date = new Date(price[0]);
            return date.toLocaleDateString();
        });
        const prices = history.prices.map(price => price[1]);
        
        AppState.priceChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Bitcoin Price (USD)',
                    data: prices,
                    borderColor: '#00d4ff',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `$${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') },
                        grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color') }
                    },
                    y: {
                        ticks: { 
                            color: getComputedStyle(document.body).getPropertyValue('--text-muted'),
                            callback: (value) => `$${value.toLocaleString()}`
                        },
                        grid: { color: getComputedStyle(document.body).getPropertyValue('--border-color') }
                    }
                }
            }
        });
    }
}

async function initAnalyticsChart(coinId = 'bitcoin') {
    const ctx = document.getElementById('analyticsChart')?.getContext('2d');
    if (!ctx) return;
    
    if (AppState.analyticsChart) {
        AppState.analyticsChart.destroy();
    }
    
    const history = await API.getCoinHistory(coinId, 30);
    
    if (history && history.prices) {
        const labels = history.prices.map(price => {
            const date = new Date(price[0]);
            return date.toLocaleDateString();
        });
        const prices = history.prices.map(price => price[1]);
        
        AppState.analyticsChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Price (USD)',
                    data: prices,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { labels: { color: getComputedStyle(document.body).getPropertyValue('--text-primary') } }
                },
                scales: {
                    x: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } },
                    y: { ticks: { color: getComputedStyle(document.body).getPropertyValue('--text-muted') } }
                }
            }
        });
    }
}

function calculateMetrics(history) {
    if (!history || !history.prices || history.prices.length === 0) return null;
    
    const prices = history.prices.map(p => p[1]);
    const currentPrice = prices[prices.length - 1];
    const highestPrice = Math.max(...prices);
    const lowestPrice = Math.min(...prices);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Simple volatility calculation
    let sumSquaredDiff = 0;
    for (let i = 1; i < prices.length; i++) {
        const change = (prices[i] - prices[i-1]) / prices[i-1];
        sumSquaredDiff += Math.pow(change, 2);
    }
    const volatility = Math.sqrt(sumSquaredDiff / (prices.length - 1)) * 100;
    
    return { currentPrice, highestPrice, lowestPrice, avgPrice, volatility };
}

async function updateAnalytics() {
    const coinId = DOM.analyticsCoin?.value || 'bitcoin';
    const history = await API.getCoinHistory(coinId, 30);
    const metrics = calculateMetrics(history);
    
    if (metrics && DOM.metricsList) {
        DOM.metricsList.innerHTML = `
            <div class="metric-item">
                <span>Current Price</span>
                <strong>${formatNumber(metrics.currentPrice)}</strong>
            </div>
            <div class="metric-item">
                <span>30d High</span>
                <strong class="positive">${formatNumber(metrics.highestPrice)}</strong>
            </div>
            <div class="metric-item">
                <span>30d Low</span>
                <strong class="negative">${formatNumber(metrics.lowestPrice)}</strong>
            </div>
            <div class="metric-item">
                <span>30d Average</span>
                <strong>${formatNumber(metrics.avgPrice)}</strong>
            </div>
            <div class="metric-item">
                <span>Volatility (30d)</span>
                <strong>${metrics.volatility.toFixed(2)}%</strong>
            </div>
        `;
    }
    
    await initAnalyticsChart(coinId);
}

// ============================================
// SEARCH FUNCTIONALITY
// ============================================

function setupSearch() {
    if (!DOM.globalSearch) return;
    
    DOM.globalSearch.addEventListener('input', debounce((e) => {
        const searchTerm = e.target.value.toLowerCase().trim();
        
        if (searchTerm === '') {
            AppState.filteredCoins = [...AppState.allCoins];
            DOM.searchResults.classList.remove('show');
        } else {
            AppState.filteredCoins = AppState.allCoins.filter(coin => 
                coin.name.toLowerCase().includes(searchTerm) || 
                coin.symbol.toLowerCase().includes(searchTerm)
            );
            
            // Show search results dropdown
            const results = AppState.filteredCoins.slice(0, 5);
            if (results.length > 0) {
                DOM.searchResults.innerHTML = results.map(coin => `
                    <div class="search-result-item" data-symbol="${coin.symbol}">
                        <strong>${coin.name}</strong> (${coin.symbol.toUpperCase()})
                        <span class="text-muted">${formatNumber(coin.current_price)}</span>
                    </div>
                `).join('');
                DOM.searchResults.classList.add('show');
                
                // Add click handlers
                document.querySelectorAll('.search-result-item').forEach(item => {
                    item.addEventListener('click', () => {
                        DOM.globalSearch.value = '';
                        DOM.searchResults.classList.remove('show');
                        // Scroll to and highlight the coin
                        const symbol = item.dataset.symbol;
                        const row = document.querySelector(`tr[data-symbol="${symbol}"]`);
                        if (row) {
                            row.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            row.style.backgroundColor = 'rgba(0, 212, 255, 0.2)';
                            setTimeout(() => {
                                row.style.backgroundColor = '';
                            }, 2000);
                        }
                    });
                });
            } else {
                DOM.searchResults.classList.remove('show');
            }
        }
        
        AppState.currentPage = 1;
        renderDashboard();
    }, 300));
    
    // Hide search results on click outside
    document.addEventListener('click', (e) => {
        if (!DOM.globalSearch?.contains(e.target) && !DOM.searchResults?.contains(e.target)) {
            DOM.searchResults?.classList.remove('show');
        }
    });
}

// ============================================
// SORTING FUNCTIONALITY
// ============================================

function setupSorting() {
    DOM.sortBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const sortField = btn.dataset.sort;
            const isCurrentField = AppState.currentSort.field === sortField;
            
            if (isCurrentField) {
                AppState.currentSort.direction = AppState.currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                AppState.currentSort.field = sortField;
                AppState.currentSort.direction = 'asc';
            }
            
            // Update button icon
            DOM.sortBtns.forEach(b => {
                const icon = b.querySelector('i');
                if (icon) icon.className = 'fas fa-arrow-down';
            });
            const icon = btn.querySelector('i');
            if (icon) icon.className = AppState.currentSort.direction === 'asc' ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
            
            sortCoins();
            renderDashboard();
        });
    });
}

function sortCoins() {
    const { field, direction } = AppState.currentSort;
    const multiplier = direction === 'asc' ? 1 : -1;
    
    AppState.filteredCoins.sort((a, b) => {
        let aVal, bVal;
        
        switch(field) {
            case 'rank':
                aVal = a.market_cap_rank || 999;
                bVal = b.market_cap_rank || 999;
                break;
            case 'name':
                aVal = a.name;
                bVal = b.name;
                return multiplier * aVal.localeCompare(bVal);
            case 'price':
                aVal = a.current_price || 0;
                bVal = b.current_price || 0;
                break;
            case 'change':
                aVal = a.price_change_percentage_24h || 0;
                bVal = b.price_change_percentage_24h || 0;
                break;
            default:
                aVal = a.market_cap_rank || 999;
                bVal = b.market_cap_rank || 999;
        }
        
        return multiplier * (aVal - bVal);
    });
}

// ============================================
// TRENDING TABS
// ============================================

function setupTrendingTabs() {
    DOM.trendTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const trend = tab.dataset.trend;
            AppState.currentTrendTab = trend;
            
            DOM.trendTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            renderTrending();
        });
    });
}

// ============================================
// CHART TIME RANGE
// ============================================

function setupChartTimeRange() {
    DOM.chartTimeBtns.forEach(btn => {
        btn.addEventListener('click', async () => {
            const days = parseInt(btn.dataset.range);
            
            DOM.chartTimeBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Fetch new chart data
            const history = await API.getCoinHistory('bitcoin', days);
            if (history && history.prices && AppState.priceChart) {
                const labels = history.prices.map(price => {
                    const date = new Date(price[0]);
                    return date.toLocaleDateString();
                });
                const prices = history.prices.map(price => price[1]);
                
                AppState.priceChart.data.labels = labels;
                AppState.priceChart.data.datasets[0].data = prices;
                AppState.priceChart.update();
            }
        });
    });
}

// ============================================
// PAGINATION
// ============================================

function setupPagination() {
    if (DOM.prevPageBtn) {
        DOM.prevPageBtn.addEventListener('click', () => {
            if (AppState.currentPage > 1) {
                AppState.currentPage--;
                renderDashboard();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
    
    if (DOM.nextPageBtn) {
        DOM.nextPageBtn.addEventListener('click', () => {
            const totalPages = Math.ceil(AppState.filteredCoins.length / 20);
            if (AppState.currentPage < totalPages) {
                AppState.currentPage++;
                renderDashboard();
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        });
    }
}

// ============================================
// REFRESH FUNCTIONALITY
// ============================================

async function refreshData() {
    if (DOM.refreshBtn) {
        const icon = DOM.refreshBtn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
    }
    
    try {
        await API.getMarketData(AppState.currentCurrency);
        await API.getGlobalData();
        
        // Calculate trending (top gainers/losers)
        const sortedByChange = [...AppState.allCoins].filter(c => c.price_change_percentage_24h !== null);
        sortedByChange.sort((a, b) => b.price_change_percentage_24h - a.price_change_percentage_24h);
        
        AppState.trending = {
            gainers: sortedByChange.slice(0, 10).map(c => ({
                symbol: c.symbol,
                price: c.current_price,
                change: c.price_change_percentage_24h
            })),
            losers: sortedByChange.slice(-10).reverse().map(c => ({
                symbol: c.symbol,
                price: c.current_price,
                change: c.price_change_percentage_24h
            }))
        };
        
        // Check alerts for all coins
        AppState.allCoins.forEach(coin => AlertService.checkAlerts(coin));
        
        renderMarketStats();
        renderTrending();
        renderDashboard();
        await WatchlistService.renderWatchlist();
        AlertService.populateSymbolSelect();
        
        // Update last updated time
        if (DOM.lastUpdated) {
            const now = new Date();
            DOM.lastUpdated.querySelector('span').textContent = `Last updated: ${now.toLocaleTimeString()}`;
        }
        
        showToast('Data refreshed successfully', 'success');
    } catch (error) {
        console.error('Refresh failed:', error);
        showToast('Failed to refresh data', 'error');
    } finally {
        if (DOM.refreshBtn) {
            const icon = DOM.refreshBtn.querySelector('i');
            if (icon) icon.classList.remove('fa-spin');
        }
    }
}

function startAutoRefresh() {
    if (AppState.refreshTimer) clearInterval(AppState.refreshTimer);
    
    AppState.refreshTimer = setInterval(() => {
        if (AppState.autoRefreshEnabled && document.visibilityState === 'visible') {
            refreshData();
        }
    }, AppState.refreshInterval * 1000);
}

// ============================================
// SETTINGS INITIALIZATION
// ============================================

function initSettings() {
    // Theme options
    DOM.themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            AppState.currentTheme = theme === 'auto' ? 
                (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : 
                theme;
            
            DOM.themeOptions.forEach(opt => opt.classList.remove('active'));
            option.classList.add('active');
            
            Storage.applyTheme();
            Storage.saveSettings();
            
            // Refresh charts to match new theme colors
            if (AppState.priceChart) {
                const newColor = getComputedStyle(document.body).getPropertyValue('--text-primary');
                AppState.priceChart.options.plugins.legend.labels.color = newColor;
                AppState.priceChart.options.scales.x.ticks.color = getComputedStyle(document.body).getPropertyValue('--text-muted');
                AppState.priceChart.options.scales.y.ticks.color = getComputedStyle(document.body).getPropertyValue('--text-muted');
                AppState.priceChart.update();
            }
        });
    });
    
    // Refresh interval
    if (DOM.refreshIntervalSelect) {
        DOM.refreshIntervalSelect.value = AppState.refreshInterval;
        DOM.refreshIntervalSelect.addEventListener('change', (e) => {
            AppState.refreshInterval = parseInt(e.target.value);
            Storage.saveSettings();
            startAutoRefresh();
            showToast(`Auto-refresh set to ${AppState.refreshInterval} seconds`, 'success');
        });
    }
    
    // Currency
    if (DOM.currencySelect) {
        DOM.currencySelect.value = AppState.currentCurrency;
        DOM.currencySelect.addEventListener('change', async (e) => {
            AppState.currentCurrency = e.target.value;
            Storage.saveSettings();
            await refreshData();
            showToast(`Currency changed to ${AppState.currentCurrency.toUpperCase()}`, 'success');
        });
    }
    
    // Clear cache
    if (DOM.clearCacheBtn) {
        DOM.clearCacheBtn.addEventListener('click', () => {
            localStorage.clear();
            showToast('Cache cleared successfully', 'success');
            setTimeout(() => location.reload(), 1000);
        });
    }
    
    // Export data
    if (DOM.exportDataBtn) {
        DOM.exportDataBtn.addEventListener('click', () => {
            const data = {
                watchlist: AppState.watchlist,
                alerts: AppState.alerts,
                settings: {
                    theme: AppState.currentTheme,
                    currency: AppState.currentCurrency,
                    refreshInterval: AppState.refreshInterval
                },
                exportedAt: new Date().toISOString()
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `crypto-tracker-backup-${Date.now()}.json`;
            a.click();
            URL.revokeObjectURL(url);
            showToast('Data exported successfully', 'success');
        });
    }
    
    // Notifications
    if (DOM.notificationToggle) {
        const savedPref = localStorage.getItem('notifications_enabled');
        DOM.notificationToggle.checked = savedPref === 'true';
        DOM.notificationToggle.addEventListener('change', (e) => {
            localStorage.setItem('notifications_enabled', e.target.checked);
            if (e.target.checked && Notification.permission === 'default') {
                Notification.requestPermission();
            }
        });
    }
    
    // Sound alerts
    if (DOM.soundAlertsToggle) {
        DOM.soundAlertsToggle.checked = localStorage.getItem('sound_alerts_enabled') === 'true';
        DOM.soundAlertsToggle.addEventListener('change', (e) => {
            localStorage.setItem('sound_alerts_enabled', e.target.checked);
        });
    }
}

// ============================================
// NAVIGATION
// ============================================

function setupNavigation() {
    DOM.navItems.forEach(item => {
        item.addEventListener('click', async (e) => {
            e.preventDefault();
            const pageId = item.dataset.page;
            
            // Update active states
            DOM.navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            DOM.pages.forEach(page => page.classList.remove('active'));
            const targetPage = document.getElementById(`${pageId}Page`);
            if (targetPage) targetPage.classList.add('active');
            
            // Update page title
            const pageName = item.querySelector('span')?.textContent || pageId;
            if (DOM.pageTitle) DOM.pageTitle.textContent = pageName;
            
            // Load page-specific data
            if (pageId === 'watchlist') {
                await WatchlistService.renderWatchlist();
            } else if (pageId === 'alerts') {
                AlertService.renderAlerts();
                AlertService.populateSymbolSelect();
            } else if (pageId === 'analytics') {
                await updateAnalytics();
            }
            
            // Close sidebar on mobile
            if (window.innerWidth < 768) {
                DOM.sidebar.classList.remove('open');
            }
        });
    });
    
    // Sidebar toggle for mobile
    if (DOM.sidebarToggle) {
        DOM.sidebarToggle.addEventListener('click', () => {
            DOM.sidebar.classList.toggle('open');
        });
    }
    
    // Theme toggle button
    if (DOM.themeToggle) {
        DOM.themeToggle.addEventListener('click', () => {
            const newTheme = AppState.currentTheme === 'dark' ? 'light' : 'dark';
            AppState.currentTheme = newTheme;
            Storage.applyTheme();
            Storage.saveSettings();
            
            // Update active theme option
            DOM.themeOptions.forEach(opt => {
                opt.classList.toggle('active', opt.dataset.theme === newTheme);
            });
        });
    }
    
    // Refresh button
    if (DOM.refreshBtn) {
        DOM.refreshBtn.addEventListener('click', refreshData);
    }
}

// ============================================
// CREATE ALERT
// ============================================

function setupCreateAlert() {
    if (!DOM.createAlertBtn) return;
    
    DOM.createAlertBtn.addEventListener('click', () => {
        const symbol = DOM.alertSymbol?.value;
        const condition = DOM.alertCondition?.value;
        const targetPrice = DOM.alertPrice?.value;
        
        if (!symbol) {
            showToast('Please select a coin', 'error');
            return;
        }
        if (!targetPrice || parseFloat(targetPrice) <= 0) {
            showToast('Please enter a valid target price', 'error');
            return;
        }
        
        AlertService.createAlert(symbol, condition, parseFloat(targetPrice));
        
        // Reset form
        DOM.alertSymbol.value = '';
        DOM.alertPrice.value = '';
    });
}

// ============================================
// ANALYTICS COIN SELECTOR
// ============================================

function setupAnalyticsCoin() {
    if (!DOM.analyticsCoin) return;
    
    DOM.analyticsCoin.addEventListener('change', () => {
        updateAnalytics();
    });
}

// ============================================
// INITIALIZATION
// ============================================

async function init() {
    // Load saved data
    Storage.loadSettings();
    Storage.loadWatchlist();
    Storage.loadAlerts();
    
    // Apply theme
    Storage.applyTheme();
    
    // Setup event listeners
    setupNavigation();
    setupSearch();
    setupSorting();
    setupTrendingTabs();
    setupPagination();
    setupChartTimeRange();
    initSettings();
    setupCreateAlert();
    setupAnalyticsCoin();
    
    // Initial data load
    await refreshData();
    
    // Initialize charts
    await initPriceChart();
    
    // Start auto-refresh
    startAutoRefresh();
    
    // Hide loading overlay
    if (DOM.loadingOverlay) {
        setTimeout(() => {
            DOM.loadingOverlay.classList.add('hide');
            setTimeout(() => {
                DOM.loadingOverlay.style.display = 'none';
            }, 500);
        }, 1000);
    }
    
    // PWA service worker registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(reg => {
            console.log('Service Worker registered:', reg);
        }).catch(err => {
            console.log('Service Worker registration failed:', err);
        });
    }
    
    showToast('Crypto Tracker Pro is ready!', 'success');
}

// Start the application when DOM is ready
document.addEventListener('DOMContentLoaded', init);
