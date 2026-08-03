#!/usr/bin/env python3
"""Crypto Tracker Pro - Output Formatter"""

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress, SpinnerColumn, TextColumn

console = Console()

CURRENCY_SYMBOLS = {
    "usd": "$",
    "eur": "€",
    "gbp": "£",
    "jpy": "¥",
}


def format_price(price, currency="usd", decimals=2):
    if price is None:
        return "N/A"
    symbol = CURRENCY_SYMBOLS.get(currency, "$")
    if price >= 1e12:
        return f"{symbol}{(price / 1e12):.{decimals}f}T"
    if price >= 1e9:
        return f"{symbol}{(price / 1e9):.{decimals}f}B"
    if price >= 1e6:
        return f"{symbol}{(price / 1e6):.{decimals}f}M"
    if price >= 1e3:
        return f"{symbol}{(price / 1e3):.{decimals}f}K"
    return f"{symbol}{price:.{decimals}f}"


def format_change(change, decimals=2):
    if change is None:
        return "N/A"
    arrow = "up" if change >= 0 else "down"
    return f"{arrow} {abs(change):.{decimals}f}%"


def print_table(coins, currency="usd", limit=None):
    """Print coins in a formatted table"""
    table = Table(show_header=True, header_style="bold magenta")
    table.add_column("#", style="dim", width=4)
    table.add_column("Coin", min_width=20)
    table.add_column("Price", min_width=14)
    table.add_column("24h Change", min_width=12)
    table.add_column("Market Cap", min_width=16)

    data = coins[:limit] if limit else coins
    for i, coin in enumerate(data, 1):
        table.add_row(
            str(i),
            coin.get("name", ""),
            format_price(coin.get("current_price"), currency),
            format_change(coin.get("price_change_percentage_24h")),
            format_price(coin.get("market_cap"), currency),
        )

    console.print(table)


def print_alert(symbol, condition, target_price, current_price=None):
    """Print a price alert status"""
    status = "TRIGGERED" if current_price is not None else "PENDING"
    color = "green" if status == "TRIGGERED" else "yellow"
    console.print(
        f"[{color}]{status}[/{color}] "
        f"{symbol} {condition} ${target_price:,.2f}"
        + (f" (Current: ${current_price:,.2f})" if current_price else "")
    )


def print_metrics(metrics):
    """Print global market metrics"""
    console.print(Panel("Market Metrics", style="bold cyan"))
    console.print(f"Total Market Cap: {format_price(metrics.get('total_market_cap', 0))}")
    console.print(f"24h Volume: {format_price(metrics.get('total_volume_24h', 0))}")
    console.print(f"BTC Dominance: {metrics.get('btc_dominance', 0):.2f}%")
    console.print(f"ETH Dominance: {metrics.get('eth_dominance', 0):.2f}%")
    console.print(f"Active Coins: {metrics.get('active_cryptocurrencies', 0)}")
