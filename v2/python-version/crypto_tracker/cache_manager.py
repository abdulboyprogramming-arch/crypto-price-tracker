"""
PERSISTENT CACHE MANAGER - SQLite-based caching
No external dependencies - Built with sqlite3
Features:
1. Persistent price cache across sessions
2. Automatic cache expiration
3. Cache statistics and cleanup
4. Thread-safe operations
"""

import sqlite3
import json
import time
from datetime import datetime
from typing import Dict, List, Optional, Any
from contextlib import contextmanager
from threading import Lock
from pathlib import Path

class CacheManager:
    """
    SQLite-based persistent cache for price data
    """
    
    def __init__(self, cache_path: str = None):
        if cache_path is None:
            cache_path = Path.home() / '.crypto_tracker_cache.db'
        
        self.cache_path = str(cache_path)
        self._lock = Lock()
        self._initialize_database()
    
    def _initialize_database(self):
        """Create cache database and tables if not exists"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Price cache table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS price_cache (
                    symbol TEXT PRIMARY KEY,
                    price REAL,
                    source TEXT,
                    timestamp REAL,
                    metadata TEXT
                )
            """)
            
            # Cache statistics table
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS cache_stats (
                    key TEXT PRIMARY KEY,
                    hit_count INTEGER DEFAULT 0,
                    miss_count INTEGER DEFAULT 0,
                    last_cleanup REAL
                )
            """)
            
            # Rate limit tracking
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS rate_limits (
                    domain TEXT PRIMARY KEY,
                    last_request REAL,
                    request_count INTEGER DEFAULT 0,
                    block_until REAL
                )
            """)
            
            # Initialize stats if not exists
            cursor.execute("""
                INSERT OR IGNORE INTO cache_stats (key, hit_count, miss_count)
                VALUES ('global', 0, 0)
            """)
            
            conn.commit()
    
    @contextmanager
    def _get_connection(self):
        """Get database connection with thread safety"""
        conn = sqlite3.connect(self.cache_path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    def get(self, symbol: str, source: str = None, max_age_seconds: int = 60) -> Optional[Dict]:
        """
        Get cached price for a symbol
        
        Args:
            symbol: Cryptocurrency symbol
            source: Specific source or None for any
            max_age_seconds: Maximum cache age in seconds
        
        Returns:
            Cached data or None if expired/not found
        """
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                if source:
                    cursor.execute("""
                        SELECT price, source, timestamp, metadata
                        FROM price_cache
                        WHERE symbol = ? AND source = ?
                    """, (symbol.upper(), source))
                else:
                    cursor.execute("""
                        SELECT price, source, timestamp, metadata
                        FROM price_cache
                        WHERE symbol = ?
                        ORDER BY timestamp DESC
                        LIMIT 1
                    """, (symbol.upper(),))
                
                row = cursor.fetchone()
                
                if row:
                    current_time = time.time()
                    if current_time - row['timestamp'] <= max_age_seconds:
                        # Update hit count
                        cursor.execute("""
                            UPDATE cache_stats 
                            SET hit_count = hit_count + 1 
                            WHERE key = 'global'
                        """)
                        conn.commit()
                        
                        return {
                            'price': row['price'],
                            'source': row['source'],
                            'timestamp': row['timestamp'],
                            'metadata': json.loads(row['metadata']) if row['metadata'] else {}
                        }
                
                # Update miss count
                cursor.execute("""
                    UPDATE cache_stats 
                    SET miss_count = miss_count + 1 
                    WHERE key = 'global'
                """)
                conn.commit()
                
                return None
    
    def set(self, symbol: str, price: float, source: str, metadata: Dict = None):
        """Store price in cache"""
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                
                cursor.execute("""
                    INSERT OR REPLACE INTO price_cache 
                    (symbol, price, source, timestamp, metadata)
                    VALUES (?, ?, ?, ?, ?)
                """, (
                    symbol.upper(),
                    price,
                    source,
                    time.time(),
                    json.dumps(metadata or {})
                ))
                
                conn.commit()
    
    def get_batch(self, symbols: List[str], max_age_seconds: int = 60) -> Dict[str, Optional[float]]:
        """Get cached prices for multiple symbols"""
        results = {}
        for symbol in symbols:
            cached = self.get(symbol, max_age_seconds=max_age_seconds)
            results[symbol] = cached['price'] if cached else None
        return results
    
    def clear_expired(self, max_age_seconds: int = 3600):
        """Clear expired cache entries"""
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                expiry_time = time.time() - max_age_seconds
                
                cursor.execute("""
                    DELETE FROM price_cache
                    WHERE timestamp < ?
                """, (expiry_time,))
                
                deleted = cursor.rowcount
                conn.commit()
                
                # Update last cleanup time
                cursor.execute("""
                    INSERT OR REPLACE INTO cache_stats (key, last_cleanup)
                    VALUES ('global', ?)
                """, (time.time(),))
                conn.commit()
                
                return deleted
    
    def get_stats(self) -> Dict:
        """Get cache statistics"""
        with self._get_connection() as conn:
            cursor = conn.cursor()
            
            # Get hit/miss counts
            cursor.execute("SELECT hit_count, miss_count, last_cleanup FROM cache_stats WHERE key = 'global'")
            stats_row = cursor.fetchone()
            
            # Get total cache size
            cursor.execute("SELECT COUNT(*) as count FROM price_cache")
            size_row = cursor.fetchone()
            
            # Get oldest and newest cache entries
            cursor.execute("SELECT MIN(timestamp) as oldest, MAX(timestamp) as newest FROM price_cache")
            time_row = cursor.fetchone()
            
            current_time = time.time()
            
            return {
                'hit_count': stats_row['hit_count'] if stats_row else 0,
                'miss_count': stats_row['miss_count'] if stats_row else 0,
                'hit_ratio': round(stats_row['hit_count'] / (stats_row['hit_count'] + stats_row['miss_count']) * 100, 2) if stats_row and (stats_row['hit_count'] + stats_row['miss_count']) > 0 else 0,
                'cache_size': size_row['count'] if size_row else 0,
                'oldest_entry': datetime.fromtimestamp(time_row['oldest']).isoformat() if time_row and time_row['oldest'] else None,
                'newest_entry': datetime.fromtimestamp(time_row['newest']).isoformat() if time_row and time_row['newest'] else None,
                'last_cleanup': datetime.fromtimestamp(stats_row['last_cleanup']).isoformat() if stats_row and stats_row['last_cleanup'] else None
            }
    
    def check_rate_limit(self, domain: str, max_requests: int = 10, window_seconds: int = 60) -> bool:
        """
        Check if domain is rate limited
        
        Returns:
            True if request is allowed, False if rate limited
        """
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                current_time = time.time()
                
                cursor.execute("SELECT last_request, request_count, block_until FROM rate_limits WHERE domain = ?", (domain,))
                row = cursor.fetchone()
                
                if row and row['block_until'] and current_time < row['block_until']:
                    return False  # Still blocked
                
                if row:
                    # Check if window has expired
                    if current_time - row['last_request'] > window_seconds:
                        # Reset counter
                        request_count = 1
                    else:
                        request_count = row['request_count'] + 1
                    
                    if request_count > max_requests:
                        # Block for 5 minutes
                        block_until = current_time + 300
                        cursor.execute("""
                            UPDATE rate_limits 
                            SET block_until = ?, request_count = ?
                            WHERE domain = ?
                        """, (block_until, request_count, domain))
                        conn.commit()
                        return False
                    
                    cursor.execute("""
                        UPDATE rate_limits 
                        SET last_request = ?, request_count = ?
                        WHERE domain = ?
                    """, (current_time, request_count, domain))
                else:
                    cursor.execute("""
                        INSERT INTO rate_limits (domain, last_request, request_count)
                        VALUES (?, ?, ?)
                    """, (domain, current_time, 1))
                
                conn.commit()
                return True
    
    def clear_all(self):
        """Clear entire cache"""
        with self._lock:
            with self._get_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("DELETE FROM price_cache")
                cursor.execute("DELETE FROM rate_limits")
                cursor.execute("UPDATE cache_stats SET hit_count = 0, miss_count = 0 WHERE key = 'global'")
                conn.commit()
