#!/usr/bin/env python3
"""
CRYPTO PRICE TRACKER - Python Package
Real-time cryptocurrency prices without external APIs
"""

from .scraper import CryptoScraper, SimulatedPriceEngine
from .price_engine import PriceEngine, PricePredictor, ArbitrageDetector
from .cache_manager import CacheManager
from .cli import main as cli_main
from .api_server import run_api_server

__version__ = '1.0.0'
__author__ = 'Abdulrahman Adeeyo (Abdulboy)'
__all__ = [
    'CryptoScraper',
    'SimulatedPriceEngine',
    'PriceEngine',
    'PricePredictor',
    'ArbitrageDetector',
    'CacheManager',
    'cli_main',
    'run_api_server',
]
