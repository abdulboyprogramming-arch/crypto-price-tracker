#!/usr/bin/env python3
"""
CRYPTO PRICE TRACKER - REST API Server
Reusable API for developers to integrate crypto prices
No external dependencies - Built with http.server
"""

import json
import time
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
from datetime import datetime
from typing import Dict, Any

from scraper import CryptoScraper, SimulatedPriceEngine
from price_engine import PriceEngine, ArbitrageDetector
from cache_manager import CacheManager


class CryptoAPIHandler(BaseHTTPRequestHandler):
    """REST API handler for crypto price tracker"""
    
    def __init__(self, *args, **kwargs):
        self.scraper = CryptoScraper()
        self.simulator = SimulatedPriceEngine()
        self.price_engine = PriceEngine()
        self.cache = CacheManager()
        super().__init__(*args, **kwargs)
    
    def log_message(self, format, *args):
        """Custom logging with timestamp"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        print(f"[{timestamp}] {format % args}")
    
    def _set_headers(self, status_code=200):
        """Set response headers"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def _send_json(self, data: Dict[str, Any], status_code: int = 200):
        """Send JSON response"""
        self._set_headers(status_code)
        self.wfile.write(json.dumps(data, indent=2).encode())
    
    def _send_error(self, message: str, status_code: int = 400):
        """Send error response"""
        self._send_json({
            'success': False,
            'error': message,
            'timestamp': datetime.now().isoformat()
        }, status_code)
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self._set_headers(200)
    
    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        query_params = parse_qs(parsed_path.query)
        
        # Route to appropriate handler
        if path == '/api/health':
            self._handle_health()
        elif path == '/api/price':
            self._handle_get_price(query_params)
        elif path == '/api/prices':
            self._handle_get_prices(query_params)
        elif path == '/api/predict':
            self._handle_predict(query_params)
        elif path == '/api/arbitrage':
            self._handle_arbitrage(query_params)
        elif path == '/api/supported':
            self._handle_supported()
        elif path == '/api/stats':
            self._handle_stats()
        else:
            self._send_error(f"Endpoint not found: {path}", 404)
    
    def do_POST(self):
        """Handle POST requests"""
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length)
        
        try:
            data = json.loads(post_data.decode('utf-8')) if post_data else {}
        except json.JSONDecodeError:
            self._send_error("Invalid JSON payload", 400)
            return
        
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/api/prices':
            self._handle_post_prices(data)
        else:
            self._send_error(f"Endpoint not found: {path}", 404)
    
    # ============================================
    # API HANDLERS
    # ============================================
    
    def _handle_health(self):
        """GET /api/health - Health check endpoint"""
        self._send_json({
            'success': True,
            'status': 'healthy',
            'version': '1.0.0',
            'timestamp': datetime.now().isoformat(),
            'cache_stats': self.cache.get_stats() if self.cache else None
        })
    
    def _handle_get_price(self, params: Dict):
        """GET /api/price?symbol=BTC&source=auto&simulate=false"""
        symbol = params.get('symbol', [None])[0]
        source = params.get('source', ['auto'])[0]
        simulate = params.get('simulate', ['false'])[0].lower() == 'true'
        
        if not symbol:
            self._send_error("Missing required parameter: symbol", 400)
            return
        
        symbol = symbol.upper()
        
        # Get price
        price = None
        if simulate:
            price = self.simulator.get_price(symbol)
        else:
            price = self.scraper.get_price(symbol, source=source)
        
        if price:
            # Add to price engine for history
            prediction = self.price_engine.get_price_with_prediction(symbol, price)
            
            self._send_json({
                'success': True,
                'data': {
                    'symbol': symbol,
                    'price': price,
                    'price_usd': price,
                    'source': source if not simulate else 'simulated',
                    'timestamp': datetime.now().isoformat(),
                    'confidence': prediction.get('confidence', 80),
                    'predictions': prediction.get('predictions', {}),
                    'indicators': prediction.get('indicators', {})
                }
            })
        else:
            self._send_error(f"Failed to fetch price for {symbol}", 404)
    
    def _handle_get_prices(self, params: Dict):
        """GET /api/prices?symbols=BTC,ETH,SOL&simulate=false"""
        symbols_param = params.get('symbols', [None])[0]
        simulate = params.get('simulate', ['false'])[0].lower() == 'true'
        
        if not symbols_param:
            self._send_error("Missing required parameter: symbols", 400)
            return
        
        symbols = [s.strip().upper() for s in symbols_param.split(',')]
        
        results = {}
        for symbol in symbols:
            if simulate:
                price = self.simulator.get_price(symbol)
            else:
                price = self.scraper.get_price(symbol)
            
            if price:
                self.price_engine.predictor.add_price(symbol, price)
                results[symbol] = {
                    'price': price,
                    'source': 'simulated' if simulate else 'web_scrape'
                }
            else:
                results[symbol] = None
        
        self._send_json({
            'success': True,
            'data': results,
            'timestamp': datetime.now().isoformat()
        })
    
    def _handle_post_prices(self, data: Dict):
        """POST /api/prices - Get prices for symbols in request body"""
        symbols = data.get('symbols', [])
        simulate = data.get('simulate', False)
        
        if not symbols:
            self._send_error("Missing required field: symbols", 400)
            return
        
        results = {}
        for symbol in symbols:
            symbol = symbol.upper()
            if simulate:
                price = self.simulator.get_price(symbol)
            else:
                price = self.scraper.get_price(symbol)
            
            if price:
                self.price_engine.predictor.add_price(symbol, price)
                results[symbol] = price
            else:
                results[symbol] = None
        
        self._send_json({
            'success': True,
            'data': results,
            'count': len([v for v in results.values() if v is not None]),
            'timestamp': datetime.now().isoformat()
        })
    
    def _handle_predict(self, params: Dict):
        """GET /api/predict?symbol=BTC&period=14"""
        symbol = params.get('symbol', [None])[0]
        period = int(params.get('period', [14])[0])
        
        if not symbol:
            self._send_error("Missing required parameter: symbol", 400)
            return
        
        symbol = symbol.upper()
        
        # Get current price
        current_price = self.scraper.get_price(symbol)
        
        if not current_price:
            self._send_error(f"Failed to fetch current price for {symbol}", 404)
            return
        
        # Add to history
        self.price_engine.predictor.add_price(symbol, current_price)
        
        # Get predictions
        ema_14 = self.price_engine.predictor.exponential_moving_average(symbol, 14)
        ema_50 = self.price_engine.predictor.exponential_moving_average(symbol, 50)
        next_price = self.price_engine.predictor.predict_next_price(symbol, 'linear')
        volatility = self.price_engine.predictor.calculate_volatility(symbol)
        support, resistance = self.price_engine.predictor.get_support_resistance(symbol)
        
        self._send_json({
            'success': True,
            'data': {
                'symbol': symbol,
                'current_price': current_price,
                'predictions': {
                    'ema_14': ema_14,
                    'ema_50': ema_50,
                    'predicted_next': next_price,
                    'predicted_change_percent': round(((next_price - current_price) / current_price * 100), 2) if next_price else None
                },
                'technical_indicators': {
                    'volatility_percent': volatility,
                    'support_level': support,
                    'resistance_level': resistance
                },
                'timestamp': datetime.now().isoformat()
            }
        })
    
    def _handle_arbitrage(self, params: Dict):
        """GET /api/arbitrage?symbol=BTC&min_profit=0.5"""
        symbol = params.get('symbol', [None])[0]
        min_profit = float(params.get('min_profit', [0.5])[0])
        
        if not symbol:
            self._send_error("Missing required parameter: symbol", 400)
            return
        
        symbol = symbol.upper()
        
        # Get prices from multiple sources
        sources = {}
        for source in ['binance', 'coinbase', 'coingecko']:
            price = self.scraper.get_price(symbol, source=source)
            if price:
                sources[source] = price
        
        if len(sources) < 2:
            self._send_error(f"Insufficient price data for {symbol} from multiple sources", 404)
            return
        
        detector = ArbitrageDetector(min_profit_percent=min_profit)
        opportunities = detector.detect_opportunity(sources)
        
        self._send_json({
            'success': True,
            'data': {
                'symbol': symbol,
                'sources_available': list(sources.keys()),
                'prices': sources,
                'opportunities': opportunities,
                'best_opportunity': opportunities[0] if opportunities else None
            }
        })
    
    def _handle_supported(self):
        """GET /api/supported - List supported cryptocurrencies"""
        supported_coins = ['BTC', 'ETH', 'BNB', 'SOL', 'XRP', 'ADA', 'DOGE', 'DOT', 'MATIC', 'SHIB']
        
        self._send_json({
            'success': True,
            'data': {
                'supported_symbols': supported_coins,
                'count': len(supported_coins),
                'note': 'Additional symbols may work but are not guaranteed'
            }
        })
    
    def _handle_stats(self):
        """GET /api/stats - Get system statistics"""
        cache_stats = self.cache.get_stats() if self.cache else {}
        
        self._send_json({
            'success': True,
            'data': {
                'cache': cache_stats,
                'mode': 'live_scraping',
                'rate_limits': 'Respectful delays between requests'
            }
        })


def run_api_server(host='localhost', port=8080):
    """Run the API server"""
    server = HTTPServer((host, port), CryptoAPIHandler)
    
    print("=" * 60)
    print("CRYPTO PRICE TRACKER - API SERVER")
    print("=" * 60)
    print(f"Server running at: http://{host}:{port}")
    print("\nAvailable Endpoints:")
    print("  GET  /api/health                - Health check")
    print("  GET  /api/price?symbol=BTC     - Get single price")
    print("  GET  /api/prices?symbols=BTC,ETH - Get multiple prices")
    print("  POST /api/prices                - Get prices (JSON body)")
    print("  GET  /api/predict?symbol=BTC   - Get price predictions")
    print("  GET  /api/arbitrage?symbol=BTC - Find arbitrage opportunities")
    print("  GET  /api/supported             - List supported coins")
    print("  GET  /api/stats                 - System statistics")
    print("\nExamples:")
    print("  curl http://localhost:8080/api/price?symbol=BTC")
    print("  curl http://localhost:8080/api/prices?symbols=BTC,ETH,SOL")
    print("\nPress Ctrl+C to stop the server")
    print("=" * 60)
    
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down server...")
        server.shutdown()


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--host', default='localhost', help='Host to bind to')
    parser.add_argument('--port', type=int, default=8080, help='Port to bind to')
    args = parser.parse_args()
    
    run_api_server(args.host, args.port)
