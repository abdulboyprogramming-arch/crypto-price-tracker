"""
WEB SCRAPER - No external APIs
Directly scrapes crypto prices from exchange websites
Built from scratch with BeautifulSoup (optional) or regex
"""

import re
import json
import urllib.request
import urllib.error
from html.parser import HTMLParser
from typing import Dict, Optional, List
from datetime import datetime
import time
import random

class ExchangeHTMLParser(HTMLParser):
    """Custom HTML parser for extracting price data from exchange pages"""
    
    def __init__(self):
        super().__init__()
        self.price_data = {}
        self.current_tag = ""
        self.current_attrs = {}
        self.found_price = False
        self.price_pattern = re.compile(r'\$?[\d,]+\.?\d*')
        
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        self.current_attrs = dict(attrs)
        
    def handle_data(self, data):
        if self.current_tag in ['span', 'div', 'p', 'h1', 'h2', 'h3']:
            # Look for price patterns
            matches = self.price_pattern.findall(data)
            if matches and ('price' in str(self.current_attrs).lower() or 
                           'ticker' in str(self.current_attrs).lower() or
                           'value' in str(self.current_attrs).lower()):
                self.price_data['detected_price'] = matches[0]


class CryptoScraper:
    """
    INVENTIVE SCRAPER - Collects crypto prices without APIs
    Uses multiple sources and fallback mechanisms
    """
    
    # Exchange URLs for scraping (no API keys needed)
    EXCHANGE_URLS = {
        'binance': 'https://www.binance.com/en/price/{}',
        'coinbase': 'https://www.coinbase.com/price/{}',
        'coinmarketcap': 'https://coinmarketcap.com/currencies/{}/',
        'coingecko': 'https://www.coingecko.com/en/coins/{}'
    }
    
    # Known price patterns for regex extraction
    PRICE_PATTERNS = [
        r'\$([\d,]+\.?\d*)',           # $45,123.45
        r'([\d,]+\.?\d*)\s*USD',        # 45,123.45 USD
        r'price["\']?\s*:\s*["\']?([\d,]+\.?\d*)',  # JSON price fields
        r'>\$?([\d,]+\.?\d*)</'         # HTML price tags
    ]
    
    def __init__(self, use_cache=True, cache_duration_seconds=60):
        self.use_cache = use_cache
        self.cache_duration = cache_duration_seconds
        self._cache = {}
        self._last_request_time = {}
        self.user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
        ]
    
    def _get_random_user_agent(self) -> str:
        """Rotate user agents to avoid blocking"""
        return random.choice(self.user_agents)
    
    def _make_request(self, url: str, timeout: int = 10) -> Optional[str]:
        """Make HTTP request with proper headers"""
        # Rate limiting - be respectful to websites
        domain = url.split('/')[2]
        current_time = time.time()
        
        if domain in self._last_request_time:
            time_since_last = current_time - self._last_request_time[domain]
            if time_since_last < 2:  # Minimum 2 seconds between requests
                time.sleep(2 - time_since_last)
        
        self._last_request_time[domain] = current_time
        
        try:
            headers = {
                'User-Agent': self._get_random_user_agent(),
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }
            
            req = urllib.request.Request(url, headers=headers)
            
            with urllib.request.urlopen(req, timeout=timeout) as response:
                # Handle gzip encoding
                content = response.read()
                encoding = response.headers.get_content_charset() or 'utf-8'
                
                # Try to decompress if gzipped
                if response.headers.get('Content-Encoding') == 'gzip':
                    import gzip
                    content = gzip.decompress(content)
                
                return content.decode(encoding, errors='ignore')
                
        except urllib.error.URLError as e:
            print(f"[SCRAPER] Error fetching {url}: {e}")
            return None
        except Exception as e:
            print(f"[SCRAPER] Unexpected error: {e}")
            return None
    
    def _extract_price_from_html(self, html: str, currency_symbol: str = '$') -> Optional[float]:
        """Extract price from HTML using multiple patterns"""
        if not html:
            return None
        
        for pattern in self.PRICE_PATTERNS:
            # Adjust pattern for currency symbol
            if currency_symbol == '$' and pattern.startswith(r'\$'):
                matches = re.findall(pattern, html)
            else:
                # Replace $ with currency symbol if needed
                adjusted_pattern = pattern.replace(r'\$', re.escape(currency_symbol))
                matches = re.findall(adjusted_pattern, html)
            
            if matches:
                # Clean and convert to float
                price_str = matches[0].replace(',', '')
                try:
                    return float(price_str)
                except ValueError:
                    continue
        
        return None
    
    def _get_binance_price(self, symbol: str) -> Optional[float]:
        """Scrape price from Binance (most reliable)"""
        symbol_lower = symbol.lower()
        url = self.EXCHANGE_URLS['binance'].format(symbol_lower)
        
        html = self._make_request(url)
        if not html:
            return None
        
        # Look for Binance's price data in script tags
        # They often embed JSON data
        json_pattern = r'<script[^>]*>window\.__APP_DATA__\s*=\s*({.*?});</script>'
        json_match = re.search(json_pattern, html, re.DOTALL)
        
        if json_match:
            try:
                data = json.loads(json_match.group(1))
                # Navigate through Binance's data structure
                # This path may need updating as Binance changes
                if 'price' in str(data).lower():
                    price = self._extract_price_from_html(html, '$')
                    if price:
                        return price
            except json.JSONDecodeError:
                pass
        
        # Fallback to regex extraction
        return self._extract_price_from_html(html, '$')
    
    def _get_coinbase_price(self, symbol: str) -> Optional[float]:
        """Scrape price from Coinbase"""
        symbol_lower = symbol.lower()
        url = self.EXCHANGE_URLS['coinbase'].format(symbol_lower)
        
        html = self._make_request(url)
        if not html:
            return None
        
        # Coinbase often has price in meta tags
        meta_pattern = r'<meta[^>]*content=["\']([\d,]+\.?\d*)[^>]*>'
        matches = re.findall(meta_pattern, html)
        
        for match in matches:
            try:
                price = float(match.replace(',', ''))
                if 0.01 < price < 1000000:  # Sanity check
                    return price
            except ValueError:
                continue
        
        return self._extract_price_from_html(html, '$')
    
    def _get_coingecko_price(self, symbol: str) -> Optional[float]:
        """Scrape price from CoinGecko"""
        symbol_lower = symbol.lower()
        url = self.EXCHANGE_URLS['coingecko'].format(symbol_lower)
        
        html = self._make_request(url)
        if not html:
            return None
        
        # CoinGecko has price in specific div classes
        price_pattern = r'<div[^>]*class="[^"]*price[^"]*"[^>]*>.*?\$?([\d,]+\.?\d*).*?</div>'
        match = re.search(price_pattern, html, re.DOTALL | re.IGNORECASE)
        
        if match:
            try:
                return float(match.group(1).replace(',', ''))
            except ValueError:
                pass
        
        return self._extract_price_from_html(html, '$')
    
    def get_price(self, symbol: str, source: str = 'auto') -> Optional[float]:
        """
        Get price for a cryptocurrency symbol
        
        Args:
            symbol: BTC, ETH, etc.
            source: 'binance', 'coinbase', 'coingecko', 'auto'
        
        Returns:
            Price in USD or None if not found
        """
        # Check cache
        cache_key = f"{symbol}_{source}"
        if self.use_cache and cache_key in self._cache:
            cached_time, cached_price = self._cache[cache_key]
            if time.time() - cached_time < self.cache_duration:
                return cached_price
        
        # Map symbol to exchange format
        symbol_map = {
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
        }
        
        exchange_symbol = symbol_map.get(symbol.upper(), symbol.lower())
        price = None
        
        if source == 'auto':
            # Try multiple sources in order
            for src in ['binance', 'coinbase', 'coingecko']:
                price = self._get_price_from_source(src, exchange_symbol)
                if price:
                    break
        else:
            price = self._get_price_from_source(source, exchange_symbol)
        
        # Cache result
        if price and self.use_cache:
            self._cache[cache_key] = (time.time(), price)
        
        return price
    
    def _get_price_from_source(self, source: str, symbol: str) -> Optional[float]:
        """Get price from specific source"""
        if source == 'binance':
            return self._get_binance_price(symbol)
        elif source == 'coinbase':
            return self._get_coinbase_price(symbol)
        elif source == 'coingecko':
            return self._get_coingecko_price(symbol)
        return None
    
    def get_multiple_prices(self, symbols: List[str], source: str = 'auto') -> Dict[str, Optional[float]]:
        """Get prices for multiple cryptocurrencies"""
        results = {}
        for symbol in symbols:
            results[symbol] = self.get_price(symbol, source)
            # Add delay between requests to be respectful
            time.sleep(1)
        return results


# Alternative: Simulated price generator for offline development
class SimulatedPriceEngine:
    """Generates realistic simulated crypto prices for offline development"""
    
    def __init__(self):
        self.base_prices = {
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
        }
        self.last_update = {}
        self.volatility = 0.02  # 2% volatility
    
    def get_price(self, symbol: str) -> float:
        """Get simulated price with realistic movements"""
        symbol = symbol.upper()
        if symbol not in self.base_prices:
            return None
        
        current_time = time.time()
        
        # Update price if it's been more than 5 seconds
        if symbol not in self.last_update or current_time - self.last_update[symbol] > 5:
            # Random walk with mean reversion
            current_price = self.base_prices[symbol]
            change = random.uniform(-self.volatility, self.volatility)
            new_price = current_price * (1 + change)
            
            # Mean reversion (pull back toward base)
            reversion = 0.05
            new_price = new_price * (1 - reversion) + current_price * reversion
            
            self.base_prices[symbol] = max(new_price, 0.00000001)
            self.last_update[symbol] = current_time
        
        return self.base_prices[symbol]
