"""
PRICE ENGINE - Core price calculation and validation
No external APIs - Pure algorithmic price processing
Features:
1. Multi-source price aggregation
2. Anomaly detection (spike filtering)
3. Volume-weighted average price (VWAP) simulation
4. Price prediction using moving averages
5. Arbitrage detection between exchanges
"""

import time
import math
import statistics
from typing import Dict, List, Optional, Tuple
from collections import deque
from datetime import datetime
import random

class PriceValidator:
    """Validates and sanitizes price data"""
    
    def __init__(self):
        # Realistic price ranges for different coins
        self.price_ranges = {
            'BTC': (10000, 100000),
            'ETH': (500, 10000),
            'BNB': (100, 1000),
            'SOL': (10, 500),
            'XRP': (0.1, 5),
            'ADA': (0.05, 3),
            'DOGE': (0.01, 1),
            'DOT': (1, 50),
            'MATIC': (0.1, 5),
            'SHIB': (0.000001, 0.0001),
            'default': (0.000001, 1000000)
        }
    
    def is_valid_price(self, price: float, symbol: str = 'default') -> bool:
        """Check if price is within realistic bounds"""
        if price is None:
            return False
        if price <= 0:
            return False
        if math.isnan(price) or math.isinf(price):
            return False
        
        # Check against price ranges
        min_price, max_price = self.price_ranges.get(symbol.upper(), self.price_ranges['default'])
        return min_price <= price <= max_price
    
    def sanitize_price(self, price: float, symbol: str = 'default') -> Optional[float]:
        """Clean and round price appropriately"""
        if not self.is_valid_price(price, symbol):
            return None
        
        # Round based on price magnitude
        if price < 0.001:
            return round(price, 8)
        elif price < 0.1:
            return round(price, 6)
        elif price < 1:
            return round(price, 4)
        elif price < 100:
            return round(price, 2)
        else:
            return round(price, 2)
    
    def detect_anomaly(self, current_price: float, historical_prices: List[float]) -> bool:
        """Detect price anomalies using Z-score"""
        if len(historical_prices) < 3:
            return False
        
        mean = statistics.mean(historical_prices)
        stdev = statistics.stdev(historical_prices) if len(historical_prices) > 1 else 1
        
        if stdev == 0:
            return False
        
        z_score = abs(current_price - mean) / stdev
        return z_score > 3  # More than 3 standard deviations


class PriceAggregator:
    """
    Aggregates prices from multiple sources
    Calculates median, weighted average, and confidence scores
    """
    
    def __init__(self, max_sources: int = 5):
        self.max_sources = max_sources
        self.price_history = {}
        self.validator = PriceValidator()
    
    def aggregate(self, prices: Dict[str, Optional[float]], symbol: str) -> Dict:
        """
        Aggregate multiple price sources into a single reliable price
        
        Args:
            prices: Dict of source -> price
            symbol: Cryptocurrency symbol
        
        Returns:
            Dict with aggregated price, confidence, and source count
        """
        # Filter out None values and invalid prices
        valid_prices = []
        for source, price in prices.items():
            if price and self.validator.is_valid_price(price, symbol):
                valid_prices.append(price)
        
        if not valid_prices:
            return {
                'price': None,
                'confidence': 0,
                'sources_used': 0,
                'method': 'none'
            }
        
        # Sort and remove outliers
        valid_prices.sort()
        
        # Use median for robustness
        median_price = statistics.median(valid_prices)
        
        # Calculate weighted average (more weight to prices close to median)
        weights = []
        for price in valid_prices:
            distance = abs(price - median_price) / median_price if median_price > 0 else 1
            weight = 1 / (1 + distance * 10)  # Exponential decay
            weights.append(weight)
        
        total_weight = sum(weights)
        if total_weight > 0:
            weighted_avg = sum(p * w for p, w in zip(valid_prices, weights)) / total_weight
        else:
            weighted_avg = median_price
        
        # Calculate confidence (0-100)
        price_range = max(valid_prices) - min(valid_prices)
        relative_range = price_range / median_price if median_price > 0 else 1
        confidence = max(0, min(100, 100 * (1 - relative_range)))
        
        return {
            'price': self.validator.sanitize_price(weighted_avg, symbol),
            'median': median_price,
            'min': min(valid_prices),
            'max': max(valid_prices),
            'confidence': round(confidence, 1),
            'sources_used': len(valid_prices),
            'total_sources': len(prices),
            'method': 'weighted_median'
        }


class PricePredictor:
    """
    INVENTIVE: Price prediction using multiple algorithms
    No ML libraries - pure algorithmic predictions
    """
    
    def __init__(self, history_length: int = 100):
        self.history_length = history_length
        self.price_history = {}  # symbol -> deque of (timestamp, price)
    
    def add_price(self, symbol: str, price: float, timestamp: float = None):
        """Add price to historical data"""
        if timestamp is None:
            timestamp = time.time()
        
        if symbol not in self.price_history:
            self.price_history[symbol] = deque(maxlen=self.history_length)
        
        self.price_history[symbol].append((timestamp, price))
    
    def get_history(self, symbol: str) -> List[float]:
        """Get historical prices for a symbol"""
        if symbol not in self.price_history:
            return []
        return [price for _, price in self.price_history[symbol]]
    
    def simple_moving_average(self, symbol: str, period: int = 14) -> Optional[float]:
        """Calculate Simple Moving Average"""
        history = self.get_history(symbol)
        if len(history) < period:
            return None
        
        recent = history[-period:]
        return statistics.mean(recent)
    
    def exponential_moving_average(self, symbol: str, period: int = 14) -> Optional[float]:
        """Calculate Exponential Moving Average"""
        history = self.get_history(symbol)
        if len(history) < period:
            return None
        
        multiplier = 2 / (period + 1)
        ema = history[-period]
        
        for price in history[-(period-1):]:
            ema = (price - ema) * multiplier + ema
        
        return ema
    
    def predict_next_price(self, symbol: str, method: str = 'ema') -> Optional[float]:
        """
        Predict next price using various algorithms
        
        Methods:
        - 'ema': Exponential Moving Average
        - 'linear': Linear regression
        - 'momentum': Momentum-based prediction
        """
        history = self.get_history(symbol)
        if len(history) < 5:
            return None
        
        if method == 'ema':
            return self.exponential_moving_average(symbol, 5)
        
        elif method == 'linear':
            # Simple linear regression
            n = len(history)
            indices = list(range(n))
            
            # Calculate slope
            mean_x = statistics.mean(indices)
            mean_y = statistics.mean(history)
            
            numerator = sum((i - mean_x) * (history[i] - mean_y) for i in range(n))
            denominator = sum((i - mean_x) ** 2 for i in range(n))
            
            if denominator == 0:
                slope = 0
            else:
                slope = numerator / denominator
            
            intercept = mean_y - slope * mean_x
            
            # Predict next index
            next_index = n
            predicted = intercept + slope * next_index
            return max(predicted, 0)
        
        elif method == 'momentum':
            # Simple momentum: predict based on recent trend
            recent = history[-5:]
            if len(recent) < 2:
                return None
            
            avg_change = sum(recent[i] - recent[i-1] for i in range(1, len(recent))) / (len(recent) - 1)
            predicted = history[-1] + avg_change
            return max(predicted, 0)
        
        return None
    
    def calculate_volatility(self, symbol: str, period: int = 20) -> Optional[float]:
        """Calculate price volatility (standard deviation of returns)"""
        history = self.get_history(symbol)
        if len(history) < period:
            return None
        
        returns = []
        for i in range(1, len(history)):
            if history[i-1] > 0:
                ret = (history[i] - history[i-1]) / history[i-1]
                returns.append(ret)
        
        if len(returns) < 2:
            return None
        
        return statistics.stdev(returns) * 100  # As percentage
    
    def get_support_resistance(self, symbol: str, lookback: int = 50) -> Tuple[Optional[float], Optional[float]]:
        """
        Find support and resistance levels
        Returns: (support, resistance)
        """
        history = self.get_history(symbol)
        if len(history) < lookback:
            return (None, None)
        
        recent = history[-lookback:]
        
        # Find local minima and maxima
        support_candidates = []
        resistance_candidates = []
        
        for i in range(2, len(recent) - 2):
            # Local minimum (support)
            if recent[i] < recent[i-1] and recent[i] < recent[i-2] and \
               recent[i] < recent[i+1] and recent[i] < recent[i+2]:
                support_candidates.append(recent[i])
            
            # Local maximum (resistance)
            if recent[i] > recent[i-1] and recent[i] > recent[i-2] and \
               recent[i] > recent[i+1] and recent[i] > recent[i+2]:
                resistance_candidates.append(recent[i])
        
        # Use median of candidates
        support = statistics.median(support_candidates) if support_candidates else None
        resistance = statistics.median(resistance_candidates) if resistance_candidates else None
        
        return (support, resistance)


class ArbitrageDetector:
    """
    Detects arbitrage opportunities between exchanges
    """
    
    def __init__(self, min_profit_percent: float = 0.5):
        self.min_profit_percent = min_profit_percent
    
    def detect_opportunity(self, prices: Dict[str, float]) -> List[Dict]:
        """
        Find arbitrage opportunities across exchanges
        
        Returns list of opportunities with buy/sell recommendations
        """
        if len(prices) < 2:
            return []
        
        opportunities = []
        symbols = list(prices.keys())
        
        for i in range(len(symbols)):
            for j in range(i + 1, len(symbols)):
                source = symbols[i]
                target = symbols[j]
                
                source_price = prices[source]
                target_price = prices[target]
                
                if source_price is None or target_price is None:
                    continue
                
                profit_percent = (target_price - source_price) / source_price * 100
                
                if profit_percent >= self.min_profit_percent:
                    opportunities.append({
                        'buy_exchange': source,
                        'buy_price': source_price,
                        'sell_exchange': target,
                        'sell_price': target_price,
                        'profit_percent': round(profit_percent, 2),
                        'action': f"Buy on {source} at ${source_price}, sell on {target} at ${target_price}"
                    })
                elif -profit_percent >= self.min_profit_percent:
                    opportunities.append({
                        'buy_exchange': target,
                        'buy_price': target_price,
                        'sell_exchange': source,
                        'sell_price': source_price,
                        'profit_percent': round(-profit_percent, 2),
                        'action': f"Buy on {target} at ${target_price}, sell on {source} at ${source_price}"
                    })
        
        # Sort by profit percentage
        opportunities.sort(key=lambda x: x['profit_percent'], reverse=True)
        return opportunities


# ============================================
# MAIN PRICE ENGINE
# ============================================

class PriceEngine:
    """
    Main price engine that combines all components
    """
    
    def __init__(self):
        self.aggregator = PriceAggregator()
        self.predictor = PricePredictor()
        self.arbitrage = ArbitrageDetector()
        self.validator = PriceValidator()
        self._price_cache = {}
    
    def process_prices(self, raw_prices: Dict[str, Optional[float]], symbol: str) -> Dict:
        """
        Process raw prices from multiple sources
        
        Returns processed price with confidence and metadata
        """
        aggregated = self.aggregator.aggregate(raw_prices, symbol)
        
        # Add to prediction history
        if aggregated['price']:
            self.predictor.add_price(symbol, aggregated['price'])
        
        return aggregated
    
    def get_price_with_prediction(self, symbol: str, current_price: float) -> Dict:
        """
        Get current price with prediction and technical indicators
        """
        # Add to history
        self.predictor.add_price(symbol, current_price)
        
        # Calculate predictions
        ema_14 = self.predictor.exponential_moving_average(symbol, 14)
        ema_50 = self.predictor.exponential_moving_average(symbol, 50)
        next_price = self.predictor.predict_next_price(symbol, 'linear')
        volatility = self.predictor.calculate_volatility(symbol)
        support, resistance = self.predictor.get_support_resistance(symbol)
        
        # Determine trend
        if ema_14 and ema_50:
            if ema_14 > ema_50:
                trend = "BULLISH"
                trend_strength = min(100, (ema_14 - ema_50) / ema_50 * 100)
            elif ema_14 < ema_50:
                trend = "BEARISH"
                trend_strength = min(100, (ema_50 - ema_14) / ema_14 * 100)
            else:
                trend = "NEUTRAL"
                trend_strength = 0
        else:
            trend = "UNKNOWN"
            trend_strength = 0
        
        return {
            'symbol': symbol,
            'current_price': current_price,
            'predictions': {
                'ema_14': round(ema_14, 4) if ema_14 else None,
                'ema_50': round(ema_50, 4) if ema_50 else None,
                'next_price': round(next_price, 4) if next_price else None,
                'predicted_change': round(((next_price - current_price) / current_price * 100), 2) if next_price else None
            },
            'indicators': {
                'volatility_percent': round(volatility, 2) if volatility else None,
                'support': round(support, 4) if support else None,
                'resistance': round(resistance, 4) if resistance else None,
                'trend': trend,
                'trend_strength': round(trend_strength, 2)
            }
  }
