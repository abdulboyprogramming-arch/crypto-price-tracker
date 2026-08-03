# CLI Usage Guide

## Python CLI

### Installation

```bash
cd cli-tools/python-cli
pip install -e .
```

### Usage

```bash
# Show top 10 coins
crypto-tracker top

# Show top 20 coins in EUR
crypto-tracker top -l 20 -c eur

# Get price for specific coin
crypto-tracker price BTC
crypto-tracker price ETH SOL

# Live monitor a coin
crypto-tracker watch BTC
```

### Commands

- `top` - Show top cryptocurrencies by market cap
- `price` - Get price for specific cryptocurrencies
- `watch` - Live monitor a cryptocurrency

### Options

- `-l, --limit` - Number of coins to show (default: 10)
- `-c, --currency` - Currency (usd, eur, gbp, jpy)

## Node.js CLI

### Installation

```bash
cd cli-tools/node-cli
npm install
npm link  # Make globally available
```

### Usage

```bash
# Show top 10 coins
crypto-tracker top

# Get price for specific coin
crypto-tracker price BTC
crypto-tracker price ETH SOL

# Live monitor a coin
crypto-tracker watch BTC
```

### Commands

- `top` - Show top cryptocurrencies by market cap
- `price` - Get price for specific cryptocurrencies
- `watch` - Live monitor a cryptocurrency

### Options

- `-l, --limit` - Number of coins to show (default: 10)
