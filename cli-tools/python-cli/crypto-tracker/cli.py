#!/usr/bin/env python3
"""Crypto Tracker Pro - Python CLI"""

import click
import requests
from rich.console import Console
from rich.table import Table

console = Console()

API_BASE = "https://api.coingecko.com/api/v3"

CURRENCY_SYMBOLS = {
    "usd": "$",
    "eur": "\u20ac",
    "gbp": "\u00a3",
    "jpy": "\u00a5",
}


def format_price(price, currency="usd"):
    if price is None:
        return "N/A"
    symbol = CURRENCY_SYMBOLS.get(currency, "$")
    if price >= 1e12:
        return f"{symbol}{(price / 1e12):.2f}T"
    if price >= 1e9:
        return f"{symbol}{(price / 1e9):.2f}B"
    if price >= 1e6:
        return f"{symbol}{(price / 1e6):.2f}M"
    if price >= 1e3:
        return f"{symbol}{(price / 1e3):.2f}K"
    return f"{symbol}{price:.2f}"


def format_change(change):
    if change is None:
        return "N/A"
    arrow = "\u25b2" if change >= 0 else "\u25bc"
    color = "green" if change >= 0 else "red"
    return f"[{color}]{arrow} {abs(change):.2f}%[/{color}]"


def fetch_market_data(vs_currency="usd", per_page=50):
    try:
        response = requests.get(
            f"{API_BASE}/coins/markets",
            params={
                "vs_currency": vs_currency,
                "order": "market_cap_desc",
                "per_page": per_page,
                "page": 1,
                "sparkline": False,
            },
            timeout=10,
        )
        response.raise_for_status()
        return response.json()
    except requests.RequestException as e:
        console.print(f"[red]Error fetching data: {e}[/red]")
        return []


@click.group()
def main():
    """Crypto Tracker Pro - Command-line cryptocurrency price tracker"""
    pass


@main.command()
@click.option("-l", "--limit", default=10, help="Number of coins to show")
@click.option("-c", "--currency", default="usd", help="Currency (usd, eur, gbp, jpy)")
def top(limit, currency):
    """Show top cryptocurrencies by market cap"""
    data = fetch_market_data(vs_currency=currency, per_page=limit)
    if not data:
        console.print("[yellow]No data available[/yellow]")
        return

    table = Table(title=f"Top {limit} Cryptocurrencies")
    table.add_column("#", style="dim", width=4)
    table.add_column("Coin", min_width=20)
    table.add_column("Price", min_width=12)
    table.add_column("24h Change", min_width=12)
    table.add_column("Market Cap", min_width=15)

    for i, coin in enumerate(data[:limit], 1):
        table.add_row(
            str(i),
            f"{coin['name']} ({coin['symbol'].upper()})",
            format_price(coin.get("current_price"), currency),
            format_change(coin.get("price_change_percentage_24h")),
            format_price(coin.get("market_cap"), currency),
        )

    console.print(table)


@main.command()
@click.argument("symbols", nargs=-1, required=True)
@click.option("-c", "--currency", default="usd", help="Currency (usd, eur, gbp, jpy)")
def price(symbols, currency):
    """Get price for specific cryptocurrencies"""
    data = fetch_market_data(vs_currency=currency, per_page=100)
    if not data:
        console.print("[yellow]No data available[/yellow]")
        return

    for symbol in symbols:
        coin = next((c for c in data if c["symbol"].lower() == symbol.lower()), None)
        if coin:
            console.print(
                f"[bold]{coin['symbol'].upper()}[/bold]: "
                f"[green]{format_price(coin.get('current_price'), currency)}[/green] "
                f"{format_change(coin.get('price_change_percentage_24h'))}"
            )
        else:
            console.print(f"[red]{symbol.upper()}: Not found[/red]")


@main.command()
@click.argument("symbol")
@click.option("-c", "--currency", default="usd", help="Currency (usd, eur, gbp, jpy)")
def watch(symbol, currency):
    """Live monitor a cryptocurrency"""
    import time

    console.print(
        f"[cyan]Monitoring {symbol.upper()}...[/cyan] (Press Ctrl+C to stop)"
    )

    try:
        while True:
            data = fetch_market_data(vs_currency=currency, per_page=100)
            coin = next((c for c in data if c["symbol"].lower() == symbol.lower()), None)
            if coin:
                console.print(
                    f"{coin['symbol'].upper()}: "
                    f"[green]{format_price(coin.get('current_price'), currency)}[/green] "
                    f"{format_change(coin.get('price_change_percentage_24h'))}",
                    end="\r",
                )
            time.sleep(10)
    except KeyboardInterrupt:
        console.print()
        console.print("[yellow]Monitoring stopped[/yellow]")


if __name__ == "__main__":
    main()
