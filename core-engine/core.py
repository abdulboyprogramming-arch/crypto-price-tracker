#!/usr/bin/env python3
"""
CRYPTO PRICE TRACKER V2.0 - Python Core Engine
Single source of truth for all data operations
"""

import sqlite3
import json
import time
import threading
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Tuple
from contextlib import contextmanager
from pathlib import Path
import urllib.request
import urllib.error
import urllib.parse
import hashlib
import re

# ============================================
# DATA SOURCES
# ============================================

class DataSources:
    """Multi-source data acquisition with fallback"""
    
    # Primary API endpoints (free, no key required for basic usage)
    PRIMARY_API = "https://api.coingecko.com/api/v3"
    SECONDARY_API = "https://api.coincap.io/v2"
    FALLBACK_API = "https://api.binance.com/api/v3"
    
    @staticmethod
    def get_headers(source: str = "coingecko") -> dict:
        """Get headers for API request"""
        return {
            'User-Agent': 'CryptoPriceTracker/2.0',
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    
    @staticmethod
    def make_request(url: str, timeout: int = 10) -> Optional[dict]:
        """Make HTTP request with error handling"""
        try:
            req = urllib.request.Request(url, headers=DataSources.get_headers())
            with urllib.request.urlopen(req, timeout=timeout) as response:
                data = response.read().decode('utf-8')
                return json.loads(data)
        except Exception as e:
            print(f"[ERROR] Request failed: {url} - {e}")
            return None


class CryptoSymbols:
    """Supported cryptocurrency symbols and metadata"""
    
    SUPPORTED_SYMBOLS = {
        'BTC': {'name': 'Bitcoin', 'id': 'bitcoin', 'rank': 1},
        'ETH': {'name': 'Ethereum', 'id': 'ethereum', 'rank': 2},
        'BNB': {'name': 'Binance Coin', 'id': 'binancecoin', 'rank': 3},
        'SOL': {'name': 'Solana', 'id': 'solana', 'rank': 4},
        'XRP': {'name': 'Ripple', 'id': 'ripple', 'rank': 5},
        'ADA': {'name': 'Cardano', 'id': 'cardano', 'rank': 6},
        'DOGE': {'name': 'Dogecoin', 'id': 'dogecoin', 'rank': 7},
        'DOT': {'name': 'Polkadot', 'id': 'polkadot', 'rank': 8},
        'MATIC': {'name': 'Polygon', 'id': 'matic-network', 'rank': 9},
        'SHIB': {'name': 'Shiba Inu', 'id': 'shiba-inu', 'rank': 10},
        'TRX': {'name': 'TRON', 'id': 'tron', 'rank': 11},
        'AVAX': {'name': 'Avalanche', 'id': 'avalanche-2', 'rank': 12},
        'LINK': {'name': 'Chainlink', 'id': 'chainlink', 'rank': 13},
        'UNI': {'name': 'Uniswap', 'id': 'uniswap', 'rank': 14},
        'ATOM': {'name': 'Cosmos', 'id': 'cosmos', 'rank': 15},
    }
    
    @classmethod
    def get_all_symbols(cls) -> List[str]:
        """Get all supported symbols"""
        return list(cls.SUPPORTED_SYMBOLS.keys())
    
    @classmethod
    def get_coin_id(cls, symbol: str) -> Optional[str]:
        """Get CoinGecko ID for symbol"""
        symbol_upper = symbol.upper()
        if symbol_upper in cls.SUPPORTED_SYMBOLS:
            return cls.SUPPORTED_SYMBOLS[symbol_upper]['id']
        return None
    
    @classmethod
    def get_coin_name(cls, symbol: str) -> Optional[str]:
        """Get full coin name"""
        symbol_upper = symbol.upper()
        if symbol_upper in cls.SUPPORTED_SYMBOLS:
            return cls.SUPPORTED_SYMBOLS[symbol_upper]['name']
        return None


# ============================================
# DATABASE MANAGER
# ============================================

class DatabaseManager:
    """SQLite database manager for caching and persistence"""
    
    def __init__(self, db_path: str = None):
        if db_path is None:
            db_path = Path.home() / '.crypto_tracker_cache.db'
        
        self.db_path = str(db_path)
        self._local = threading.local()
        self._initialize_database()
    
    def _initialize_database(self):
        """Initialize database with schema"""
        schema_path = Path(__file__).parent / 'schema.sql'
        
        if schema_path.exists():
            with open(schema_path, 'r') as f:
                schema_sql = f.read()
        else:
            # Fallback schema if file not found
            schema_sql = self._get_fallback_schema()
        
        try:
            with self.get_connection() as conn:
                conn.executescript(schema_sql)
                print(f"[DB] Database initialized at {self.db_path}")
        except Exception as e:
            print(f"[DB] Initialization error: {e}")
    
    def _get_fallback_schema(self) -> str:
        """Return minimal schema if schema.sql not found"""
        return """
        CREATE TABLE IF NOT EXISTS price_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL,
            price REAL NOT NULL,
            change_24h REAL,
            last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS watchlist (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            symbol TEXT NOT NULL UNIQUE,
            added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        CREATE INDEX IF NOT EXISTS idx_price_cache_symbol ON price_cache(symbol);
        """
    
    @contextmanager
    def get_connection(self):
        """Get database connection with thread safety"""
        conn = sqlite3.connect(self.db_path, timeout=10)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def store_prices(self, prices: List[Dict]) -> int:
        """Store multiple prices in cache"""
        stored = 0
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                for coin in prices:
                    cursor.execute("""
                        INSERT OR REPLACE INTO price_cache 
                        (symbol, name, price, market_cap, volume_24h, change_24h, change_percentage_24h, last_updated)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        coin.get('symbol'),
                        coin.get('name'),
                        coin.get('current_price', coin.get('price')),
                        coin.get('market_cap'),
                        coin.get('total_volume', coin.get('volume_24h')),
                        coin.get('price_change_24h', coin.get('change_24h')),
                        coin.get('price_change_percentage_24h', coin.get('change_percentage_24h')),
                        datetime.now().isoformat()
                    ))
                    stored += 1
                conn.commit()
        except Exception as e:
            print(f"[DB] Store error: {e}")
        return stored
    
    def get_latest_prices(self, symbols: List[str] = None) -> List[Dict]:
        """Get latest prices from cache"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                if symbols:
                    placeholders = ','.join(['?' for _ in symbols])
                    cursor.execute(f"""
                        SELECT DISTINCT symbol, name, price, market_cap, volume_24d as volume_24h,
                               change_24h, change_percentage_24h, last_updated
                        FROM price_cache 
                        WHERE symbol IN ({placeholders})
                        ORDER BY last_updated DESC
                    """, symbols)
                else:
                    cursor.execute("""
                        SELECT p.* FROM price_cache p
                        INNER JOIN (
                            SELECT symbol, MAX(last_updated) as max_updated
                            FROM price_cache
                            GROUP BY symbol
                        ) latest ON p.symbol = latest.symbol AND p.last_updated = latest.max_updated
                        ORDER BY p.market_cap DESC
                        LIMIT 100
                    """)
                
                return [dict(row) for row in cursor.fetchall()]
        except Exception as e:
            print(f"[DB] Get error: {e}")
            return []
    
    def get_price(self, symbol: str, max_age_seconds: int = 60) -> Optional[float]:
        """Get price for a single symbol from cache"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT price, last_updated 
                    FROM price_cache 
                    WHERE symbol = ? 
                    ORDER BY last_updated DESC 
                    LIMIT 1
                """, (symbol.upper(),))
                row = cursor.fetchone()
                
                if row:
                    last_updated = datetime.fromisoformat(row['last_updated'])
                    age = (datetime.now() - last_updated).total_seconds()
                    if age <= max_age_seconds:
                        return row['price']
                return None
        except Exception:
            return None
    
    def add_to_watchlist(self, symbol: str, name: str = None) -> bool:
        """Add cryptocurrency to watchlist"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT OR IGNORE INTO watchlist (symbol, name, added_at)
                    VALUES (?, ?, ?)
                """, (symbol.upper(), name, datetime.now().isoformat()))
                conn.commit()
                return cursor.rowcount > 0
        except Exception:
            return False
    
    def remove_from_watchlist(self, symbol: str) -> bool:
        """Remove from watchlist"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM watchlist WHERE symbol = ?", (symbol.upper(),))
                conn.commit()
                return cursor.rowcount > 0
        except Exception:
            return False
    
    def get_watchlist(self) -> List[Dict]:
        """Get user's watchlist"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("SELECT symbol, name, added_at FROM watchlist ORDER BY added_at")
                return [dict(row) for row in cursor.fetchall()]
        except Exception:
            return []
    
    def create_alert(self, symbol: str, target_price: float, condition: str) -> bool:
        """Create a price alert"""
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO alerts (symbol, target_price, condition, created_at)
                    VALUES (?, ?, ?, ?)
                """, (symbol.upper(), target_price, condition, datetime.now().isoformat()))
                conn.commit()
                return cursor.rowcount > 0
        except Exception:
            return False
    
    def check_alerts(self, symbol: str, current_price: float) -> List[Dict]:
        """Check if any alerts are triggered"""
        triggered = []
        try:
            with self.get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT * FROM alerts 
                    WHERE symbol = ? AND is_triggered = 0
                """, (symbol.upper(),))
                alerts = cursor.fetchall()
                
                for alert in alerts:
                    should_trigger = False
                    if alert['condition'] == 'above' and current_price >= alert['target_price']:
                        should_trigger = True
                    elif alert['condition'] == 'below' and current_price <= alert['target_price']:
                        should_trigger = True
                    
                    if should_trigger:
                        cursor.execute("""
                            UPDATE alerts 
                            SET is_triggered = 1, triggered_at = ?
                            WHERE id = ?
                        """, (datetime.now().isoformat(), alert['id']))
                        triggered.append(dict(alert))
                conn.commit()
        except Exception as e:
            print(f"[DB] Alert check error: {e}")
        return triggered


# ============================================
# PRICE ENGINE
# ============================================

class PriceEngine:
    """Core price calculation and analytics engine"""
    
    def __init__(self, database_manager: DatabaseManager = None):
        self.db = database_manager or DatabaseManager()
        self.cache = {}  # In-memory cache
        self.cache_timestamps = {}
        self.cache_duration = 30  # seconds
    
    def _is_cache_valid(self, key: str) -> bool:
        """Check if cached data is still valid"""
        if key not in self.cache_timestamps:
            return False
        age = time.time() - self.cache_timestamps[key]
        return age < self.cache_duration
    
    def _set_cache(self, key: str, value: Any):
        """Store data in memory cache"""
        self.cache[key] = value
        self.cache_timestamps[key] = time.time()
    
    def _get_cache(self, key: str) -> Optional[Any]:
        """Get data from memory cache"""
        if self._is_cache_valid(key):
            return self.cache.get(key)
        return None
    
    def fetch_market_data(self, vs_currency: str = 'usd', force_refresh: bool = False) -> List[Dict]:
        """Fetch market data from API with caching"""
        cache_key = f'market_data_{vs_currency}'
        
        if not force_refresh:
            cached = self._get_cache(cache_key)
            if cached:
                return cached
        
        # Try primary API (CoinGecko)
        url = f"{DataSources.PRIMARY_API}/coins/markets?vs_currency={vs_currency}&order=market_cap_desc&per_page=100&page=1&sparkline=false"
        data = DataSources.make_request(url)
        
        if data:
            formatted_data = []
            for coin in data:
                formatted_data.append({
                    'id': coin.get('id'),
                    'symbol': coin.get('symbol', '').upper(),
                    'name': coin.get('name'),
                    'current_price': coin.get('current_price'),
                    'market_cap': coin.get('market_cap'),
                    'market_cap_rank': coin.get('market_cap_rank'),
                    'total_volume': coin.get('total_volume'),
                    'price_change_percentage_24h': coin.get('price_change_percentage_24h'),
                    'price_change_24h': coin.get('price_change_24h'),
                    'image': coin.get('image'),
                    'last_updated': coin.get('last_updated')
                })
            
            # Store in database
            self.db.store_prices(formatted_data)
            self._set_cache(cache_key, formatted_data)
            return formatted_data
        
        # Fallback to database cache
        db_data = self.db.get_latest_prices()
        if db_data:
            return db_data
        
        # Return empty list if all fails
        return []
    
    def fetch_single_price(self, symbol: str, vs_currency: str = 'usd') -> Optional[Dict]:
        """Fetch price for a single cryptocurrency"""
        cache_key = f'price_{symbol}_{vs_currency}'
        
        if self._is_cache_valid(cache_key):
            return self._get_cache(cache_key)
        
        coin_id = CryptoSymbols.get_coin_id(symbol)
        if not coin_id:
            return None
        
        url = f"{DataSources.PRIMARY_API}/simple/price?ids={coin_id}&vs_currencies={vs_currency}&include_24hr_change=true"
        data = DataSources.make_request(url)
        
        if data and coin_id in data:
            result = {
                'symbol': symbol.upper(),
                'price': data[coin_id].get(vs_currency),
                'change_24h': data[coin_id].get(f'{vs_currency}_24h_change'),
                'timestamp': datetime.now().isoformat()
            }
            self._set_cache(cache_key, result)
            return result
        
        # Fallback to database
        price = self.db.get_price(symbol)
        if price:
            return {'symbol': symbol.upper(), 'price': price}
        
        return None
    
    def get_trending(self, limit: int = 10) -> Dict:
        """Get trending coins (top gainers and losers)"""
        market_data = self.fetch_market_data()
        
        if not market_data:
            return {'gainers': [], 'losers': []}
        
        # Filter coins with valid change data
        valid_coins = [c for c in market_data if c.get('price_change_percentage_24h') is not None]
        
        # Sort by change percentage
        sorted_coins = sorted(valid_coins, key=lambda x: x.get('price_change_percentage_24h', 0), reverse=True)
        
        gainers = []
        losers = []
        
        for coin in sorted_coins[:limit]:
            gainers.append({
                'symbol': coin['symbol'],
                'name': coin['name'],
                'price': coin['current_price'],
                'change': coin['price_change_percentage_24h']
            })
        
        for coin in sorted_coins[-limit:]:
            losers.insert(0, {
                'symbol': coin['symbol'],
                'name': coin['name'],
                'price': coin['current_price'],
                'change': coin['price_change_percentage_24h']
            })
        
        return {'gainers': gainers, 'losers': losers}
    
    def get_market_metrics(self) -> Dict:
        """Get global market metrics"""
        cache_key = 'market_metrics'
        
        if self._is_cache_valid(cache_key):
            return self._get_cache(cache_key)
        
        url = f"{DataSources.PRIMARY_API}/global"
        data = DataSources.make_request(url)
        
        if data and 'data' in data:
            metrics = {
                'total_market_cap': data['data'].get('total_market_cap', {}).get('usd', 0),
                'total_volume_24h': data['data'].get('total_volume', {}).get('usd', 0),
                'btc_dominance': data['data'].get('market_cap_percentage', {}).get('btc', 0),
                'eth_dominance': data['data'].get('market_cap_percentage', {}).get('eth', 0),
                'active_cryptocurrencies': data['data'].get('active_cryptocurrencies', 0),
                'last_updated': datetime.now().isoformat()
            }
            self._set_cache(cache_key, metrics)
            return metrics
        
        return {}


# ============================================
# CORE ENGINE SINGLETON
# ============================================

_core_engine_instance = None

class CoreEngine:
    """Main core engine singleton"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.price_engine = PriceEngine(self.db)
    
    @classmethod
    def get_instance(cls):
        global _core_engine_instance
        if _core_engine_instance is None:
            _core_engine_instance = cls()
        return _core_engine_instance
    
    def refresh_all_data(self) -> Dict:
        """Refresh all cached data"""
        market_data = self.price_engine.fetch_market_data(force_refresh=True)
        metrics = self.price_engine.get_market_metrics()
        trending = self.price_engine.get_trending()
        
        return {
            'market_data': market_data[:50],
            'metrics': metrics,
            'trending': trending,
            'timestamp': datetime.now().isoformat()
        }
    
    def get_watchlist_with_prices(self) -> List[Dict]:
        """Get watchlist with current prices"""
        watchlist = self.db.get_watchlist()
        result = []
        
        for item in watchlist:
            price_data = self.price_engine.fetch_single_price(item['symbol'])
            result.append({
                'symbol': item['symbol'],
                'name': item.get('name'),
                'price': price_data.get('price') if price_data else None,
                'change': price_data.get('change_24h') if price_data else None,
                'added_at': item['added_at']
            })
        
        return result


# Export public API
__all__ = [
    'CoreEngine',
    'DatabaseManager',
    'PriceEngine',
    'DataSources',
    'CryptoSymbols'
]
