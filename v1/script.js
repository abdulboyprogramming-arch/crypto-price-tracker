// Configuration
const COINS_PER_PAGE = 20;
let currentPage = 1;
let allCoins = [];
let filteredCoins = [];
let autoRefreshInterval;
const COINGECKO_API = 'https://api.coingecko.com/api/v3';

// DOM Elements
const cryptoData = document.getElementById('cryptoData');
const searchInput = document.getElementById('searchInput');
const refreshBtn = document.getElementById('refreshBtn');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const pageInfo = document.getElementById('pageInfo');
const lastUpdated = document.getElementById('lastUpdated');
const totalMarketCap = document.getElementById('totalMarketCap');
const totalVolume = document.getElementById('totalVolume');
const btcDominance = document.getElementById('btcDominance');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    fetchMarketData();
    fetchGlobalData();
    setupEventListeners();
    startAutoRefresh();
});

// Fetch cryptocurrency data
async function fetchMarketData() {
    try {
        showLoading();
        
        const response = await fetch(
            `${COINGECKO_API}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1&sparkline=true`
        );
        
        if (!response.ok) throw new Error('API request failed');
        
        allCoins = await response.json();
        filteredCoins = [...allCoins];
        renderTable();
        updateLastUpdated();
    } catch (error) {
        console.error('Error fetching data:', error);
        cryptoData.innerHTML = `
            <tr>
                <td colspan="7" class="error">
                    <i class="fas fa-exclamation-triangle"></i> 
                    Failed to load data. Please check your connection.
                </td>
            </tr>
        `;
    }
}

// Fetch global market data
async function fetchGlobalData() {
    try {
        const response = await fetch(`${COINGECKO_API}/global`);
        const data = await response.json();
        
        const marketCap = data.data.total_market_cap.usd;
        const volume = data.data.total_volume.usd;
        const btcDominancePercent = data.data.market_cap_percentage.btc;
        
        totalMarketCap.textContent = `$${formatNumber(marketCap)}`;
        totalVolume.textContent = `$${formatNumber(volume)}`;
        btcDominance.textContent = `${btcDominancePercent.toFixed(2)}%`;
    } catch (error) {
        console.error('Error fetching global data:', error);
    }
}

// Render table with current page data
function renderTable() {
    const startIndex = (currentPage - 1) * COINS_PER_PAGE;
    const endIndex = startIndex + COINS_PER_PAGE;
    const coinsToShow = filteredCoins.slice(startIndex, endIndex);
    
    if (coinsToShow.length === 0) {
        cryptoData.innerHTML = `
            <tr>
                <td colspan="7" class="no-results">
                    <i class="fas fa-search"></i> No cryptocurrencies found
                </td>
            </tr>
        `;
        return;
    }
    
    cryptoData.innerHTML = coinsToShow.map((coin, index) => {
        const rank = startIndex + index + 1;
        const changeClass = coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        const changeIcon = coin.price_change_percentage_24h >= 0 ? '↗' : '↘';
        
        // Create simple sparkline from sparkline data
        let sparklineSVG = '';
        if (coin.sparkline_in_7d && coin.sparkline_in_7d.price) {
            const prices = coin.sparkline_in_7d.price;
            const max = Math.max(...prices);
            const min = Math.min(...prices);
            const range = max - min;
            
            sparklineSVG = `<svg width="120" height="40" class="sparkline">
                <polyline points="${prices.map((p, i) => 
                    `${i * (120 / (prices.length - 1))},${40 - ((p - min) / range) * 30}`
                ).join(' ')}" 
                fill="none" stroke="${coin.price_change_percentage_24h >= 0 ? '#2ecc71' : '#e74c3c'}" 
                stroke-width="2"/>
            </svg>`;
        }
        
        return `
            <tr>
                <td class="rank">${rank}</td>
                <td class="coin">
                    <img src="${coin.image}" alt="${coin.name}">
                    <div class="coin-info">
                        <span class="coin-name">${coin.name}</span>
                        <span class="coin-symbol">${coin.symbol.toUpperCase()}</span>
                    </div>
                </td>
                <td class="price">$${coin.current_price.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: coin.current_price < 1 ? 8 : 2
                })}</td>
                <td class="${changeClass}">
                    ${changeIcon} ${Math.abs(coin.price_change_percentage_24h).toFixed(2)}%
                </td>
                <td>$${formatNumber(coin.total_volume)}</td>
                <td>$${formatNumber(coin.market_cap)}</td>
                <td class="sparkline">${sparklineSVG}</td>
            </tr>
        `;
    }).join('');
    
    updatePagination();
}

// Format large numbers
function formatNumber(num) {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toFixed(2)}`;
}

// Update pagination controls
function updatePagination() {
    const totalPages = Math.ceil(filteredCoins.length / COINS_PER_PAGE);
    
    pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
    prevBtn.disabled = currentPage === 1;
    nextBtn.disabled = currentPage === totalPages || totalPages === 0;
}

// Update last updated timestamp
function updateLastUpdated() {
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit', 
        second: '2-digit' 
    });
    lastUpdated.textContent = `Last updated: ${timeString}`;
}

// Show loading state
function showLoading() {
    cryptoData.innerHTML = `
        <tr>
            <td colspan="7" class="loading">
                <i class="fas fa-spinner fa-spin"></i> Loading live cryptocurrency data...
            </td>
        </tr>
    `;
}

// Setup event listeners
function setupEventListeners() {
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        
        if (searchTerm.trim() === '') {
            filteredCoins = [...allCoins];
        } else {
            filteredCoins = allCoins.filter(coin => 
                coin.name.toLowerCase().includes(searchTerm) || 
                coin.symbol.toLowerCase().includes(searchTerm)
            );
        }
        
        currentPage = 1;
        renderTable();
    });
    
    // Refresh button
    refreshBtn.addEventListener('click', () => {
        fetchMarketData();
        fetchGlobalData();
        refreshBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Refreshing...';
        setTimeout(() => {
            refreshBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Refresh';
        }, 1000);
    });
    
    // Pagination buttons
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    
    nextBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(filteredCoins.length / COINS_PER_PAGE);
        if (currentPage < totalPages) {
            currentPage++;
            renderTable();
        }
    });
}

// Auto-refresh every 30 seconds
function startAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    autoRefreshInterval = setInterval(() => {
        fetchMarketData();
        fetchGlobalData();
    }, 30000); // 30 seconds
}

// Stop auto-refresh when page is not visible
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        clearInterval(autoRefreshInterval);
    } else {
        startAutoRefresh();
    }
});
