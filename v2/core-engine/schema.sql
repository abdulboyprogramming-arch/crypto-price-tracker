-- ============================================
-- CRYPTO PRICE TRACKER V2.0 - DATABASE SCHEMA
-- SQLite database for caching, watchlist, alerts
-- ============================================

-- ============================================
-- PRICE CACHE TABLE
-- Stores historical price data
-- ============================================
CREATE TABLE IF NOT EXISTS price_cache (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    name TEXT,
    price REAL NOT NULL,
    market_cap REAL,
    volume_24h REAL,
    change_24h REAL,
    change_percentage_24h REAL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    source TEXT DEFAULT 'api',
    UNIQUE(symbol, strftime('%Y-%m-%d %H:%M:00', last_updated))
);

-- Create index for fast queries
CREATE INDEX IF NOT EXISTS idx_price_cache_symbol ON price_cache(symbol);
CREATE INDEX IF NOT EXISTS idx_price_cache_timestamp ON price_cache(last_updated);

-- ============================================
-- HOURLY PRICES TABLE
-- Aggregated hourly data for charts
-- ============================================
CREATE TABLE IF NOT EXISTS hourly_prices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    hour TIMESTAMP NOT NULL,
    open REAL,
    high REAL,
    low REAL,
    close REAL,
    volume REAL,
    UNIQUE(symbol, hour)
);

CREATE INDEX IF NOT EXISTS idx_hourly_symbol_hour ON hourly_prices(symbol, hour);

-- ============================================
-- WATCHLIST TABLE
-- User's saved cryptocurrencies
-- ============================================
CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL UNIQUE,
    name TEXT,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT,
    alert_enabled INTEGER DEFAULT 0,
    alert_above REAL,
    alert_below REAL
);

-- ============================================
-- ALERTS TABLE
-- Price alerts configuration
-- ============================================
CREATE TABLE IF NOT EXISTS alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    target_price REAL NOT NULL,
    condition TEXT CHECK(condition IN ('above', 'below')),
    is_triggered INTEGER DEFAULT 0,
    triggered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notification_sent INTEGER DEFAULT 0,
    FOREIGN KEY (symbol) REFERENCES watchlist(symbol)
);

CREATE INDEX IF NOT EXISTS idx_alerts_symbol ON alerts(symbol);
CREATE INDEX IF NOT EXISTS idx_alerts_triggered ON alerts(is_triggered);

-- ============================================
-- MARKET_METRICS TABLE
-- Global market statistics
-- ============================================
CREATE TABLE IF NOT EXISTS market_metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    total_market_cap REAL,
    total_volume_24h REAL,
    btc_dominance REAL,
    eth_dominance REAL,
    active_cryptocurrencies INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- TRENDING_COINS TABLE
-- Top gainers/losers cache
-- ============================================
CREATE TABLE IF NOT EXISTS trending_coins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    symbol TEXT NOT NULL,
    price REAL,
    change_24h REAL,
    trend_type TEXT CHECK(trend_type IN ('gainers', 'losers')),
    rank INTEGER,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(symbol, trend_type, recorded_at)
);

-- ============================================
-- SYSTEM_CONFIG TABLE
-- Application configuration
-- ============================================
CREATE TABLE IF NOT EXISTS system_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default configuration
INSERT OR IGNORE INTO system_config (key, value) VALUES 
    ('cache_duration_seconds', '30'),
    ('default_currency', 'usd'),
    ('auto_refresh_interval', '30'),
    ('api_rate_limit', '100'),
    ('theme', 'dark');

-- ============================================
-- QUERY PERFORMANCE OPTIMIZATION
-- ============================================

-- Get latest price for symbol
CREATE VIEW IF NOT EXISTS latest_prices AS
SELECT 
    symbol,
    price,
    change_percentage_24h,
    market_cap,
    volume_24h,
    last_updated
FROM price_cache p1
WHERE last_updated = (
    SELECT MAX(last_updated) 
    FROM price_cache p2 
    WHERE p2.symbol = p1.symbol
);

-- Get top 10 gainers from last hour
CREATE VIEW IF NOT EXISTS top_gainers AS
SELECT 
    symbol,
    price,
    change_percentage_24h
FROM latest_prices
WHERE change_percentage_24h IS NOT NULL
ORDER BY change_percentage_24h DESC
LIMIT 10;

-- Get top 10 losers
CREATE VIEW IF NOT EXISTS top_losers AS
SELECT 
    symbol,
    price,
    change_percentage_24h
FROM latest_prices
WHERE change_percentage_24h IS NOT NULL
ORDER BY change_percentage_24h ASC
LIMIT 10;

-- ============================================
-- CLEANUP TRIGGERS
-- Automatically clean old data
-- ============================================

-- Clean price_cache older than 7 days
CREATE TRIGGER IF NOT EXISTS cleanup_old_prices
AFTER INSERT ON price_cache
BEGIN
    DELETE FROM price_cache 
    WHERE last_updated < datetime('now', '-7 days');
END;

-- Clean hourly_prices older than 30 days
CREATE TRIGGER IF NOT EXISTS cleanup_old_hourly
AFTER INSERT ON hourly_prices
BEGIN
    DELETE FROM hourly_prices 
    WHERE hour < datetime('now', '-30 days');
END;
