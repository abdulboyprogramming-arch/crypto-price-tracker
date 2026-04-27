#!/usr/bin/env python3
"""
CRYPTO PRICE TRACKER - CLI Interface
Beautiful command-line interface with colors, tables, and real-time updates
No external dependencies - Pure Python with ANSI colors
"""

import sys
import time
import json
import argparse
from datetime import datetime
from typing import List, Dict, Optional

# Import local modules
from scraper import CryptoScraper, SimulatedPriceEngine
from price_engine import PriceEngine, ArbitrageDetector
from cache_manager import CacheManager

# ANSI Color Codes for beautiful output
class Colors:
    HEADER = '\033[95m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'
    DIM = '\033[2m'
    
    # Price change colors
    UP = GREEN
    DOWN = RED
    NEUTRAL = YELLOW


class CryptoCLI:
    """
    Beautiful CLI for Crypto Price Tracker
    """
    
    def __init__(self, use_simulated: bool = False, use_cache: bool = True):
        self.scraper = CryptoScraper(use_cache=use_cache)
        self.simulator = SimulatedPriceEngine() if use_simulated else None
        self.price_engine = PriceEngine()
        self.cache = CacheManager() if use_cache else None
        self.use_simulated = use_simulated
        
    def clear_screen(self):
        """Clear terminal screen"""
        import os
        os.system('cls' if os.name == 'nt' else 'clear')
    
    def print_banner(self):
        """Print beautiful ASCII banner"""
        banner = f"""
{Colors.CYAN}{Colors.BOLD}
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║    ██████╗██████╗ ██╗   ██╗██████╗ ████████╗ ██████╗                     ║
║   ██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝██╔═══██╗                    ║
║   ██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║   ██║   ██║                    ║
║   ██║     ██╔═══╝   ╚██╔╝  ██╔═══╝    ██║   ██║   ██║                    ║
║   ╚██████╗██║        ██║   ██║        ██║   ╚██████╔╝                    ║
║    ╚═════╝╚═╝        ╚═╝   ╚═╝        ╚═╝    ╚═════╝                     ║
║                                                                          ║
║   ██████╗ ██████╗ ██╗ ██████╗███████╗    ████████╗██████╗  █████╗ ██████╗ ██╗
║   ██╔══██╗██╔══██╗██║██╔════╝██╔════╝    ╚══██╔══╝██╔══██╗██╔══██╗██╔══██╗██║
║   ██████╔╝██████╔╝██║██║     █████╗         ██║   ██████╔╝███████║██████╔╝██║
║   ██╔═══╝ ██╔══██╗██║██║     ██╔══╝         ██║   ██╔══██╗██╔══██║██╔══██╗██║
║   ██║     ██║  ██║██║╚██████╗███████╗       ██║   ██║  ██║██║  ██║██║  ██║███████╗
║   ╚═╝     ╚═╝  ╚═╝╚═╝ ╚═════╝╚══════╝       ╚═╝   ╚═╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝
║                                                                          ║
║                    INVENTIVE CRYPTO PRICE TRACKER                         ║
║                    No APIs - Direct Web Scraping                          ║
╚══════════════════════════════════════════════════════════════════════════╝
{Colors.END}
"""
        print(banner)
    
    def print_menu(self):
        """Print main menu"""
        menu = f"""
{Colors.BOLD}{Colors.CYAN}┌─────────────────────────────────────────────────────────────────────┐{Colors.END}
{Colors.BOLD}{Colors.CYAN}│                         MAIN MENU                                      │{Colors.END}
{Colors.BOLD}{Colors.CYAN}├─────────────────────────────────────────────────────────────────────┤{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}1.{Colors.END} Track Single Cryptocurrency                          {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}2.{Colors.END} Track Multiple Cryptocurrencies                     {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}3.{Colors.END} Live Price Monitor (Real-time updates)              {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}4.{Colors.END} View Price Predictions                              {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}5.{Colors.END} Detect Arbitrage Opportunities                     {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}6.{Colors.END} View Cache Statistics                              {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}7.{Colors.END} Clear Cache                                        {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}8.{Colors.END} Toggle Simulated Mode                              {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.GREEN}9.{Colors.END} Show System Info                                   {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}│{Colors.END}  {Colors.RED}0.{Colors.END} Exit                                                 {Colors.CYAN}│{Colors.END}
{Colors.BOLD}{Colors.CYAN}└─────────────────────────────────────────────────────────────────────┘{Colors.END}
"""
        print(menu)
    
    def print_price_table(self, prices: Dict[str, Dict], title: str = "Current Prices"):
        """Print beautiful price table"""
        if not prices:
            print(f"\n{Colors.RED}No price data available{Colors.END}")
            return
        
        # Determine column widths
        symbol_width = max(len(s) for s in prices.keys()) + 2
        price_width = 20
        change_width = 15
        confidence_width = 12
        
        # Print header
        print(f"\n{Colors.BOLD}{Colors.CYAN}┌{'─' * (symbol_width + price_width + change_width + confidence_width + 6)}┐{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} {Colors.BOLD}{title.center(symbol_width + price_width + change_width + confidence_width + 4)}{Colors.END} {Colors.BOLD}{Colors.CYAN}│{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}├{'─' * symbol_width}┼{'─' * price_width}┼{'─' * change_width}┼{'─' * confidence_width}┤{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} {'Symbol'.ljust(symbol_width-1)}{Colors.CYAN}│{Colors.END} {'Price (USD)'.center(price_width-1)}{Colors.CYAN}│{Colors.END} {'24h Change'.center(change_width-1)}{Colors.CYAN}│{Colors.END} {'Confidence'.center(confidence_width-1)}{Colors.CYAN}│{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}├{'─' * symbol_width}┼{'─' * price_width}┼{'─' * change_width}┼{'─' * confidence_width}┤{Colors.END}")
        
        # Print each row
        for symbol, data in prices.items():
            price = data.get('price')
            if price is None:
                price_str = f"{Colors.RED}N/A{Colors.END}"
            else:
                # Format price with appropriate decimals
                if price < 0.001:
                    price_str = f"${price:.8f}"
                elif price < 0.1:
                    price_str = f"${price:.6f}"
                elif price < 1:
                    price_str = f"${price:.4f}"
                elif price < 100:
                    price_str = f"${price:.2f}"
                else:
                    price_str = f"${price:,.2f}"
                price_str = f"{Colors.GREEN}{price_str}{Colors.END}"
            
            # Mock change (would be calculated from history)
            change = data.get('change_24h', 0)
            if change > 0:
                change_str = f"{Colors.UP}▲ {change:+.2f}%{Colors.END}"
            elif change < 0:
                change_str = f"{Colors.DOWN}▼ {change:+.2f}%{Colors.END}"
            else:
                change_str = f"{Colors.NEUTRAL}━ 0.00%{Colors.END}"
            
            confidence = data.get('confidence', 0)
            if confidence >= 80:
                confidence_str = f"{Colors.GREEN}{confidence}%{Colors.END}"
            elif confidence >= 50:
                confidence_str = f"{Colors.YELLOW}{confidence}%{Colors.END}"
            else:
                confidence_str = f"{Colors.RED}{confidence}%{Colors.END}"
            
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} {symbol.ljust(symbol_width-1)}{Colors.CYAN}│{Colors.END} {price_str.center(price_width-1)}{Colors.CYAN}│{Colors.END} {change_str.center(change_width-1)}{Colors.CYAN}│{Colors.END} {confidence_str.center(confidence_width-1)}{Colors.CYAN}│{Colors.END}")
        
        # Print footer
        print(f"{Colors.BOLD}{Colors.CYAN}└{'─' * symbol_width}┴{'─' * price_width}┴{'─' * change_width}┴{'─' * confidence_width}┘{Colors.END}")
    
    def print_prediction_panel(self, symbol: str, prediction_data: Dict):
        """Print beautiful prediction panel"""
        print(f"\n{Colors.BOLD}{Colors.CYAN}┌{'─' * 60}┐{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} {Colors.BOLD}🔮 PRICE PREDICTIONS for {symbol}{' ' * (37 - len(symbol))}{Colors.BOLD}{Colors.CYAN}│{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}├{'─' * 60}┤{Colors.END}")
        
        current = prediction_data.get('current_price', 0)
        print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} Current Price: ${current:,.4f}{' ' * (42 - len(f'${current:,.4f}'))}{Colors.CYAN}│{Colors.END}")
        
        predictions = prediction_data.get('predictions', {})
        if predictions.get('ema_14'):
            ema = predictions['ema_14']
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} EMA (14 periods): ${ema:,.4f}{' ' * (39 - len(f'${ema:,.4f}'))}{Colors.CYAN}│{Colors.END}")
        
        if predictions.get('ema_50'):
            ema50 = predictions['ema_50']
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} EMA (50 periods): ${ema50:,.4f}{' ' * (39 - len(f'${ema50:,.4f}'))}{Colors.CYAN}│{Colors.END}")
        
        if predictions.get('next_price'):
            next_price = predictions['next_price']
            change = predictions.get('predicted_change', 0)
            change_arrow = "▲" if change > 0 else "▼" if change < 0 else "━"
            change_color = Colors.UP if change > 0 else Colors.DOWN if change < 0 else Colors.NEUTRAL
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} Predicted Next: ${next_price:,.4f} ({change_color}{change_arrow} {abs(change):+.2f}%{Colors.END}){' ' * (23 - len(f'${next_price:,.4f}'))}{Colors.CYAN}│{Colors.END}")
        
        print(f"{Colors.BOLD}{Colors.CYAN}├{'─' * 60}┤{Colors.END}")
        
        indicators = prediction_data.get('indicators', {})
        if indicators.get('volatility_percent'):
            vol = indicators['volatility_percent']
            vol_color = Colors.GREEN if vol < 30 else Colors.YELLOW if vol < 60 else Colors.RED
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} Volatility: {vol_color}{vol}%{Colors.END}{' ' * (46 - len(f'{vol}%'))}{Colors.CYAN}│{Colors.END}")
        
        if indicators.get('support'):
            support = indicators['support']
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} Support Level: ${support:,.4f}{' ' * (42 - len(f'${support:,.4f}'))}{Colors.CYAN}│{Colors.END}")
        
        if indicators.get('resistance'):
            resistance = indicators['resistance']
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} Resistance Level: ${resistance:,.4f}{' ' * (39 - len(f'${resistance:,.4f}'))}{Colors.CYAN}│{Colors.END}")
        
        if indicators.get('trend'):
            trend = indicators['trend']
            trend_color = Colors.GREEN if trend == "BULLISH" else Colors.RED if trend == "BEARISH" else Colors.NEUTRAL
            strength = indicators.get('trend_strength', 0)
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} Trend: {trend_color}{trend}{Colors.END} (Strength: {strength:.1f}%){' ' * (24 - len(trend))}{Colors.CYAN}│{Colors.END}")
        
        print(f"{Colors.BOLD}{Colors.CYAN}└{'─' * 60}┘{Colors.END}")
    
    def track_single(self):
        """Track single cryptocurrency"""
        self.clear_screen()
        self.print_banner()
        
        print(f"\n{Colors.BOLD}Enter cryptocurrency symbol (e.g., BTC, ETH, SOL):{Colors.END}")
        symbol = input("> ").strip().upper()
        
        if not symbol:
            print(f"{Colors.RED}Invalid symbol{Colors.END}")
            time.sleep(1)
            return
        
        print(f"\n{Colors.YELLOW}Fetching price for {symbol}...{Colors.END}")
        
        # Get price
        price = self.scraper.get_price(symbol)
        
        if self.use_simulated and not price:
            price = self.simulator.get_price(symbol)
            source = "simulated"
        else:
            source = "web_scrape"
        
        if price:
            # Get prediction data
            prediction_data = self.price_engine.get_price_with_prediction(symbol, price)
            
            self.clear_screen()
            self.print_banner()
            
            # Print price in large format
            print(f"\n{Colors.BOLD}{Colors.GREEN}╔{'═' * 50}╗{Colors.END}")
            print(f"{Colors.BOLD}{Colors.GREEN}║{Colors.END}  {Colors.BOLD}{symbol} PRICE{Colors.END}{' ' * (45 - len(symbol))}{Colors.BOLD}{Colors.GREEN}║{Colors.END}")
            print(f"{Colors.BOLD}{Colors.GREEN}╠{'═' * 50}╣{Colors.END}")
            
            # Format price display
            if price < 0.001:
                price_display = f"${price:.10f}"
            elif price < 0.1:
                price_display = f"${price:.6f}"
            elif price < 1:
                price_display = f"${price:.4f}"
            else:
                price_display = f"${price:,.4f}"
            
            print(f"{Colors.BOLD}{Colors.GREEN}║{Colors.END}  {Colors.BOLD}{Colors.CYAN}{price_display}{Colors.END}{' ' * (48 - len(price_display))}{Colors.BOLD}{Colors.GREEN}║{Colors.END}")
            print(f"{Colors.BOLD}{Colors.GREEN}╚{'═' * 50}╝{Colors.END}")
            
            # Print predictions
            self.print_prediction_panel(symbol, prediction_data)
            
            print(f"\n{Colors.DIM}Source: {source} | Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}{Colors.END}")
        else:
            print(f"\n{Colors.RED}Failed to fetch price for {symbol}{Colors.END}")
            print(f"{Colors.YELLOW}Try: BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT, MATIC, SHIB{Colors.END}")
        
        input(f"\n{Colors.DIM}Press Enter to continue...{Colors.END}")
    
    def track_multiple(self):
        """Track multiple cryptocurrencies"""
        self.clear_screen()
        self.print_banner()
        
        print(f"\n{Colors.BOLD}Enter cryptocurrency symbols separated by commas:{Colors.END}")
        print(f"{Colors.DIM}Example: BTC, ETH, SOL, XRP{Colors.END}")
        symbols_input = input("> ").strip()
        
        symbols = [s.strip().upper() for s in symbols_input.split(',') if s.strip()]
        
        if not symbols:
            print(f"{Colors.RED}No symbols entered{Colors.END}")
            time.sleep(1)
            return
        
        print(f"\n{Colors.YELLOW}Fetching prices for {len(symbols)} cryptocurrencies...{Colors.END}")
        
        prices = {}
        for symbol in symbols:
            price = self.scraper.get_price(symbol)
            
            if self.use_simulated and not price:
                price = self.simulator.get_price(symbol)
            
            if price:
                # Add to price engine for prediction
                pred = self.price_engine.get_price_with_prediction(symbol, price)
                prices[symbol] = {
                    'price': price,
                    'confidence': pred.get('confidence', 0),
                    'change_24h': 0  # Would be calculated from history
                }
            else:
                prices[symbol] = {'price': None, 'confidence': 0, 'change_24h': 0}
        
        self.clear_screen()
        self.print_banner()
        self.print_price_table(prices, f"Price Snapshot ({datetime.now().strftime('%H:%M:%S')})")
        
        print(f"\n{Colors.DIM}Source: {'Simulated' if self.use_simulated else 'Web Scrape'} | Cache: {'Enabled' if self.scraper.use_cache else 'Disabled'}{Colors.END}")
        
        input(f"\n{Colors.DIM}Press Enter to continue...{Colors.END}")
    
    def live_monitor(self):
        """Real-time price monitor with auto-refresh"""
        self.clear_screen()
        self.print_banner()
        
        print(f"\n{Colors.BOLD}Enter cryptocurrency symbols to monitor (comma-separated):{Colors.END}")
        print(f"{Colors.DIM}Example: BTC, ETH, SOL{Colors.END}")
        symbols_input = input("> ").strip()
        
        symbols = [s.strip().upper() for s in symbols_input.split(',') if s.strip()]
        
        if not symbols:
            print(f"{Colors.RED}No symbols entered{Colors.END}")
            time.sleep(1)
            return
        
        print(f"\n{Colors.BOLD}{Colors.GREEN}Starting live monitor for {', '.join(symbols)}{Colors.END}")
        print(f"{Colors.DIM}Press Ctrl+C to stop{Colors.END}")
        time.sleep(2)
        
        try:
            while True:
                # Clear screen and show banner
                self.clear_screen()
                self.print_banner()
                
                # Fetch prices
                prices = {}
                for symbol in symbols:
                    price = self.scraper.get_price(symbol)
                    if self.use_simulated and not price:
                        price = self.simulator.get_price(symbol)
                    
                    prices[symbol] = {
                        'price': price,
                        'confidence': 80 if price else 0,
                        'change_24h': 0
                    }
                
                self.print_price_table(prices, f"LIVE MONITOR - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
                
                # Show legend
                print(f"\n{Colors.DIM}Auto-refresh every 10 seconds... Press Ctrl+C to stop{Colors.END}")
                
                time.sleep(10)
                
        except KeyboardInterrupt:
            print(f"\n{Colors.YELLOW}Monitor stopped{Colors.END}")
            time.sleep(1)
    
    def show_predictions(self):
        """Show price predictions for a cryptocurrency"""
        self.clear_screen()
        self.print_banner()
        
        print(f"\n{Colors.BOLD}Enter cryptocurrency symbol for predictions:{Colors.END}")
        symbol = input("> ").strip().upper()
        
        if not symbol:
            print(f"{Colors.RED}Invalid symbol{Colors.END}")
            time.sleep(1)
            return
        
        # Get historical data from price engine
        history = self.price_engine.predictor.get_history(symbol)
        
        if not history:
            # Need to fetch current price first
            price = self.scraper.get_price(symbol)
            if self.use_simulated and not price:
                price = self.simulator.get_price(symbol)
            
            if price:
                self.price_engine.predictor.add_price(symbol, price)
                history = [price]
        
        if history:
            prediction_data = self.price_engine.get_price_with_prediction(symbol, history[-1])
            
            self.clear_screen()
            self.print_banner()
            self.print_prediction_panel(symbol, prediction_data)
            
            # Show historical prices
            print(f"\n{Colors.BOLD}{Colors.CYAN}┌{'─' * 50}┐{Colors.END}")
            print(f"{Colors.BOLD}{Colors.CYAN}│{Colors.END} {Colors.BOLD}📊 Recent Price History{Colors.END}{' ' * 28}{Colors.BOLD}{Colors.CYAN}│{Colors.END}")
            print(f"{Colors.BOLD}{Colors.CYAN}├{'─' * 50}┤{Colors.END}")
            
            recent_history = history[-10:]
            for i, price in enumerate(recent_history):
                bar_length = min(40, int(price / max(recent_history) * 40) if max(recent_history) > 0 else 0)
         # IN DEVELOPMENT 
