#!/usr/bin/env python3
"""Crypto Tracker Pro - Caching Layer"""

import time
import threading
from typing import Any, Optional, Dict
from collections import OrderedDict


class LRUCache:
    """Thread-safe LRU cache with TTL support"""

    def __init__(self, maxsize: int = 128, ttl: int = 30):
        self.maxsize = maxsize
        self.ttl = ttl
        self._cache: OrderedDict = OrderedDict()
        self._timestamps: Dict[str, float] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        with self._lock:
            if key not in self._cache:
                return None
            if self._is_expired(key):
                del self._cache[key]
                del self._timestamps[key]
                return None
            self._cache.move_to_end(key)
            return self._cache[key]

    def set(self, key: str, value: Any) -> None:
        """Set value in cache with current timestamp"""
        with self._lock:
            if key in self._cache:
                self._cache.move_to_end(key)
            self._cache[key] = value
            self._timestamps[key] = time.time()
            if len(self._cache) > self.maxsize:
                oldest = next(iter(self._cache))
                del self._cache[oldest]
                del self._timestamps[oldest]

    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                del self._timestamps[key]
                return True
            return False

    def clear(self) -> None:
        """Clear all cache entries"""
        with self._lock:
            self._cache.clear()
            self._timestamps.clear()

    def _is_expired(self, key: str) -> bool:
        """Check if cache entry has expired"""
        if key not in self._timestamps:
            return True
        return (time.time() - self._timestamps[key]) > self.ttl

    def size(self) -> int:
        """Return current cache size"""
        with self._lock:
            return len(self._cache)

    def keys(self) -> list:
        """Return all cache keys"""
        with self._lock:
            return list(self._cache.keys())


class MemoryCache:
    """Simple in-memory cache with TTL"""

    def __init__(self, ttl: int = 30):
        self.ttl = ttl
        self._cache: Dict[str, Any] = {}
        self._timestamps: Dict[str, float] = {}
        self._lock = threading.Lock()

    def get(self, key: str) -> Optional[Any]:
        with self._lock:
            if key not in self._cache:
                return None
            if self._is_expired(key):
                del self._cache[key]
                del self._timestamps[key]
                return None
            return self._cache[key]

    def set(self, key: str, value: Any) -> None:
        with self._lock:
            self._cache[key] = value
            self._timestamps[key] = time.time()

    def delete(self, key: str) -> bool:
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                del self._timestamps[key]
                return True
            return False

    def clear(self) -> None:
        with self._lock:
            self._cache.clear()
            self._timestamps.clear()

    def _is_expired(self, key: str) -> bool:
        if key not in self._timestamps:
            return True
        return (time.time() - self._timestamps[key]) > self.ttl
