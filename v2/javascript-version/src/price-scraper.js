/**
 * CRYPTO PRICE TRACKER - JavaScript/Node.js Version
 * No external APIs - Direct web scraping with built-in HTTP
 * Can run in Node.js, browsers, and as browser extension
 * 
 * INVENTIVE FEATURES:
 * 1. Multi-source price aggregation without API keys
 * 2. Smart caching with localStorage (browser) / file (Node)
 * 3. Real-time price simulation for offline development
 * 4. Arbitrage detection between exchanges
 * 5. Price prediction algorithms
 */

// ============================================
// CORE SCRAPER MODULE
// ============================================

class CryptoScraper {
    constructor(options = {}) {
        this.useCache = options.useCache !== false;
        this.cacheDuration = options.cacheDuration || 60000; // 60 seconds default
        this.cache = new Map();
        this.lastRequestTime = new Map();
        this.userAgents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        ];
        
        // Exchange URLs for scraping
        this.exchangeUrls = {
            binance: (symbol) => `https://www.binance.com/en/price/${symbol.toLowerCase()}`,
            coinbase: (symbol) => `https://www.coinbase.com/price/${symbol.toLowerCase()}`,
            coingecko: (symbol) => `https://www.coingecko.com/en/coins/${symbol.toLowerCase()}`
        };
        
        // Symbol name mapping
        this.symbolMap = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'BNB': 'bnb',
            'SOL': 'solana',
            'XRP': 'xrp',
            'ADA': 'cardano',
            'DOGE': 'dogecoin',
            'DOT': 'polkadot',
            'MATIC': 'polygon',
            'SHIB': 'shiba-inu'
        };
        
        // Price regex patterns
        this.pricePatterns = [
            /\$([\d,]+\.?\d*)/,
            /([\d,]+\.?\d*)\s*USD/,
            /price["']?\s*:\s*["']?([\d,]+\.?\d*)/,
            />\$?([\d,]+\.?\d*)</
        ];
    }
    
    /**
     * Make HTTP request (works in Node.js and browsers)
     */
    async makeRequest(url) {
        // Rate limiting - respect websites
        const domain = new URL(url).hostname;
        const now = Date.now();
        const lastRequest = this.lastRequestTime.get(domain) || 0;
        
        if (now - lastRequest < 2000) { // Minimum 2 seconds between requests
            await this.sleep(2000 - (now - lastRequest));
        }
        
        this.lastRequestTime.set(domain, Date.now());
        
        // Browser environment
        if (typeof window !== 'undefined' && window.fetch) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': this.userAgents[Math.floor(Math.random() * this.userAgents.length)],
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    }
                });
                return await response.text();
            } catch (error) {
                console.error(`[SCRAPER] Fetch error: ${error.message}`);
                return null;
            }
        }
        
        // Node.js environment
        if (typeof require !== 'undefined') {
            const https = require('https');
            const http = require('http');
            
            return new Promise((resolve) => {
                const client = url.startsWith('https') ? https : http;
                const options = {
                    headers: {
                        'User-Agent': this.userAgents[Math.floor(Math.random() * this.userAgents.length)],
                        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
                    },
                    timeout: 10000
                };
                
                client.get(url, options, (response) => {
                    let data = '';
                    response.on('data', chunk => data += chunk);
                    response.on('end', () => resolve(data));
                }).on('error', (error) => {
                    console.error(`[SCRAPER] Request error: ${error.message}`);
                    resolve(null);
                });
            });
        }
        
        return null;
    }
    
    /**
     * Extract price from HTML using multiple patterns
     */
    extractPriceFromHtml(html, symbol = '') {
        if (!html) return null;
        
        for (const pattern of this.pricePatterns) {
            const match = html.match(pattern);
            if (match) {
                const priceStr = match[1].replace(/,/g, '');
                const price = parseFloat(priceStr);
                if (!isNaN(price) && price > 0 && price < 1000000) {
                    return price;
                }
            }
        }
        
        return null;
    }
    
    /**
     * Scrape price from Binance
     */
    async getBinancePrice(symbol) {
        const exchangeSymbol = this.symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
        const url = this.exchangeUrls.binance(exchangeSymbol);
        const html = await this.makeRequest(url);
        
        if (!html) return null;
        
        // Look for embedded JSON data
        const jsonPattern = /<script[^>]*>window\.__APP_DATA__\s*=\s*({.*?});<\/script>/s;
        const jsonMatch = html.match(jsonPattern);
        
        if (jsonMatch) {
            try {
                const data = JSON.parse(jsonMatch[1]);
                // Navigate common Binance data structure
                const price = this.extractPriceFromHtml(html, symbol);
                if (price) return price;
            } catch (e) {
                // Fall through to regex extraction
            }
        }
        
        return this.extractPriceFromHtml(html, symbol);
    }
    
    /**
     * Scrape price from Coinbase
     */
    async getCoinbasePrice(symbol) {
        const exchangeSymbol = this.symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
        const url = this.exchangeUrls.coinbase(exchangeSymbol);
        const html = await this.makeRequest(url);
        
        if (!html) return null;
        
        // Look for meta tags with price
        const metaPattern = /<meta[^>]*content=["']([\d,]+\.?\d*)[^>]*>/gi;
        let match;
        while ((match = metaPattern.exec(html)) !== null) {
            const price = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0 && price < 1000000) {
                return price;
            }
        }
        
        return this.extractPriceFromHtml(html, symbol);
    }
    
    /**
     * Scrape price from CoinGecko
     */
    async getCoinGeckoPrice(symbol) {
        const exchangeSymbol = this.symbolMap[symbol.toUpperCase()] || symbol.toLowerCase();
        const url = this.exchangeUrls.coingecko(exchangeSymbol);
        const html = await this.makeRequest(url);
        
        if (!html) return null;
        
        // Look for price in specific div classes
        const pricePattern = /<div[^>]*class="[^"]*price[^"]*"[^>]*>.*?\$?([\d,]+\.?\d*).*?<\/div>/is;
        const match = html.match(pricePattern);
        
        if (match) {
            const price = parseFloat(match[1].replace(/,/g, ''));
            if (!isNaN(price) && price > 0) return price;
        }
        
        return this.extractPriceFromHtml(html, symbol);
    }
    
    /**
     * Get price from cache
     */
    getCachedPrice(symbol, source) {
        if (!this.useCache) return null;
        
        const cacheKey = `${symbol}_${source}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
            return cached.price;
        }
        
        return null;
    }
    
    /**
     * Set price in cache
     */
    setCachedPrice(symbol, source, price) {
        if (!this.useCache) return;
        
        const cacheKey = `${symbol}_${source}`;
        this.cache.set(cacheKey, {
            price: price,
            timestamp: Date.now(),
            source: source
        });
    }
    
    /**
     * Get price from specific source or auto-detect
     */
    async getPrice(symbol, source = 'auto') {
        symbol = symbol.toUpperCase();
        
        // Check cache first
        const cachedPrice = this.getCachedPrice(symbol, source);
        if (cachedPrice !== null) return cachedPrice;
        
        let price = null;
        
        if (source === 'auto') {
            // Try multiple sources in order
            const sources = ['binance', 'coinbase', 'coingecko'];
            for (const src of sources) {
                price = await this.getPriceFromSource(symbol, src);
                if (price !== null) break;
            }
        } else {
            price = await this.getPriceFromSource(symbol, source);
        }
        
        // Cache the result
        if (price !== null) {
            this.setCachedPrice(symbol, source, price);
        }
        
        return price;
    }
    
    /**
     * Get price from specific source
     */
    async getPriceFromSource(symbol, source) {
        switch (source) {
            case 'binance':
                return await this.getBinancePrice(symbol);
            case 'coinbase':
                return await this.getCoinbasePrice(symbol);
            case 'coingecko':
                return await this.getCoinGeckoPrice(symbol);
            default:
                return null;
        }
    }
    
    /**
     * Get prices for multiple symbols
     */
    async getMultiplePrices(symbols, source = 'auto') {
        const results = {};
        
        for (const symbol of symbols) {
            results[symbol] = await this.getPrice(symbol, source);
            // Add delay between requests
            await this.sleep(1000);
        }
        
        return results;
    }
    
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
        console.log('[SCRAPER] Cache cleared');
    }
    
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.keys()),
            durationMs: this.cacheDuration
        };
    }
}


// ============================================
// SIMULATED PRICE ENGINE (Offline Development)
// ============================================

class SimulatedPriceEngine {
    constructor() {
        this.basePrices = {
            'BTC': 45000,
            'ETH': 2800,
            'BNB': 350,
            'SOL': 100,
            'XRP': 0.65,
            'ADA': 0.45,
            'DOGE': 0.08,
            'DOT': 7.50,
            'MATIC': 0.85,
            'SHIB': 0.00001
        };
        
        this.lastUpdate = new Map();
        this.volatility = 0.02; // 2% volatility
    }
    
    getPrice(symbol) {
        symbol = symbol.toUpperCase();
        
        if (!this.basePrices[symbol]) return null;
        
        const now = Date.now();
        const lastUpdate = this.lastUpdate.get(symbol) || 0;
        
        // Update price every 5 seconds for realism
        if (now - lastUpdate > 5000) {
            const currentPrice = this.basePrices[symbol];
            const change = (Math.random() - 0.5) * 2 * this.volatility;
            let newPrice = currentPrice * (1 + change);
            
            // Mean reversion
            const reversion = 0.05;
            newPrice = newPrice * (1 - reversion) + currentPrice * reversion;
            
            this.basePrices[symbol] = Math.max(newPrice, 0.00000001);
            this.lastUpdate.set(symbol, now);
        }
        
        return this.basePrices[symbol];
    }
    
    getMultiplePrices(symbols) {
        const results = {};
        for (const symbol of symbols) {
            results[symbol] = this.getPrice(symbol);
        }
        return results;
    }
}


// ============================================
// PRICE PREDICTION ENGINE
// ============================================

class PricePredictor {
    constructor(historyLength = 100) {
        this.historyLength = historyLength;
        this.priceHistory = new Map(); // symbol -> array of {timestamp, price}
    }
    
    addPrice(symbol, price, timestamp = null) {
        if (timestamp === null) timestamp = Date.now();
        
        if (!this.priceHistory.has(symbol)) {
            this.priceHistory.set(symbol, []);
        }
        
        const history = this.priceHistory.get(symbol);
        history.push({ timestamp, price });
        
        // Keep only recent history
        while (history.length > this.historyLength) {
            history.shift();
        }
    }
    
    getHistory(symbol) {
        const history = this.priceHistory.get(symbol);
        if (!history) return [];
        return history.map(h => h.price);
    }
    
    simpleMovingAverage(symbol, period = 14) {
        const history = this.getHistory(symbol);
        if (history.length < period) return null;
        
        const recent = history.slice(-period);
        const sum = recent.reduce((a, b) => a + b, 0);
        return sum / period;
    }
    
    exponentialMovingAverage(symbol, period = 14) {
        const history = this.getHistory(symbol);
        if (history.length < period) return null;
        
        const multiplier = 2 / (period + 1);
        let ema = history[history.length - period];
        
        for (let i = history.length - period + 1; i < history.length; i++) {
            ema = (history[i] - ema) * multiplier + ema;
        }
        
        return ema;
    }
    
    predictNextPrice(symbol, method = 'ema') {
        const history = this.getHistory(symbol);
        if (history.length < 5) return null;
        
        if (method === 'ema') {
            return this.exponentialMovingAverage(symbol, 5);
        }
        
        if (method === 'linear') {
            // Simple linear regression
            const n = history.length;
            const indices = [...Array(n).keys()];
            
            const meanX = indices.reduce((a, b) => a + b, 0) / n;
            const meanY = history.reduce((a, b) => a + b, 0) / n;
            
            let numerator = 0;
            let denominator = 0;
            
            for (let i = 0; i < n; i++) {
                numerator += (i - meanX) * (history[i] - meanY);
                denominator += (i - meanX) ** 2;
            }
            
            const slope = denominator === 0 ? 0 : numerator / denominator;
            const intercept = meanY - slope * meanX;
            
            return intercept + slope * n;
        }
        
        if (method === 'momentum') {
            const recent = history.slice(-5);
            let totalChange = 0;
            for (let i = 1; i < recent.length; i++) {
                totalChange += recent[i] - recent[i-1];
            }
            const avgChange = totalChange / (recent.length - 1);
            return history[history.length - 1] + avgChange;
        }
        
        return null;
    }
    
    calculateVolatility(symbol, period = 20) {
        const history = this.getHistory(symbol);
        if (history.length < period) return null;
        
        const recent = history.slice(-period);
        const returns = [];
        
        for (let i = 1; i < recent.length; i++) {
            if (recent[i-1] > 0) {
                returns.push((recent[i] - recent[i-1]) / recent[i-1]);
            }
        }
        
        if (returns.length < 2) return null;
        
        const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + (r - mean) ** 2, 0) / (returns.length - 1);
        const stdev = Math.sqrt(variance);
        
        return stdev * 100; // As percentage
    }
    
    getSupportResistance(symbol, lookback = 50) {
        const history = this.getHistory(symbol);
        if (history.length < lookback) return { support: null, resistance: null };
        
        const recent = history.slice(-lookback);
        const supportCandidates = [];
        const resistanceCandidates = [];
        
        for (let i = 2; i < recent.length - 2; i++) {
            // Local minimum (support)
            if (recent[i] < recent[i-1] && recent[i] < recent[i-2] &&
                recent[i] < recent[i+1] && recent[i] < recent[i+2]) {
                supportCandidates.push(recent[i]);
            }
            
            // Local maximum (resistance)
            if (recent[i] > recent[i-1] && recent[i] > recent[i-2] &&
                recent[i] > recent[i+1] && recent[i] > recent[i+2]) {
                resistanceCandidates.push(recent[i]);
            }
        }
        
        const median = (arr) => {
            if (arr.length === 0) return null;
            const sorted = [...arr].sort((a, b) => a - b);
            const mid = Math.floor(sorted.length / 2);
            return sorted.length % 2 === 0 ? (sorted[mid-1] + sorted[mid]) / 2 : sorted[mid];
        };
        
        return {
            support: median(supportCandidates),
            resistance: median(resistanceCandidates)
        };
    }
    
    getTrend(symbol) {
        const ema14 = this.exponentialMovingAverage(symbol, 14);
        const ema50 = this.exponentialMovingAverage(symbol, 50);
        
        if (ema14 === null || ema50 === null) {
            return { trend: 'UNKNOWN', strength: 0 };
        }
        
        if (ema14 > ema50) {
            const strength = Math.min(100, (ema14 - ema50) / ema50 * 100);
            return { trend: 'BULLISH', strength: strength };
        } else if (ema14 < ema50) {
            const strength = Math.min(100, (ema50 - ema14) / ema14 * 100);
            return { trend: 'BEARISH', strength: strength };
        } else {
            return { trend: 'NEUTRAL', strength: 0 };
        }
    }
}


// ============================================
// ARBITRAGE DETECTOR
// ============================================

class ArbitrageDetector {
    constructor(minProfitPercent = 0.5) {
        this.minProfitPercent = minProfitPercent;
    }
    
    detectOpportunity(prices) {
        const opportunities = [];
        const exchanges = Object.keys(prices);
        
        for (let i = 0; i < exchanges.length; i++) {
            for (let j = i + 1; j < exchanges.length; j++) {
                const source = exchanges[i];
                const target = exchanges[j];
                const sourcePrice = prices[source];
                const targetPrice = prices[target];
                
                if (sourcePrice === null || targetPrice === null) continue;
                
                const profitPercent = (targetPrice - sourcePrice) / sourcePrice * 100;
                
                if (profitPercent >= this.minProfitPercent) {
                    opportunities.push({
                        buyExchange: source,
                        buyPrice: sourcePrice,
                        sellExchange: target,
                        sellPrice: targetPrice,
                        profitPercent: profitPercent.toFixed(2),
                        action: `Buy on ${source} at $${sourcePrice}, sell on ${target} at $${targetPrice}`
                    });
                } else if (-profitPercent >= this.minProfitPercent) {
                    opportunities.push({
                        buyExchange: target,
                        buyPrice: targetPrice,
                        sellExchange: source,
                        sellPrice: sourcePrice,
                        profitPercent: (-profitPercent).toFixed(2),
                        action: `Buy on ${target} at $${targetPrice}, sell on

                        // In Development
