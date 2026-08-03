# API Documentation

## Base URL

```
https://api.coingecko.com/api/v3
```

## Endpoints

### Health Check

```http
GET /api/v1/health
```

Returns server status and uptime.

**Response:**
```json
{
  "status": "healthy",
  "version": "v1",
  "timestamp": "2026-08-03T22:48:19",
  "uptime_seconds": 1234.56
}
```

### Get Prices

```http
GET /api/v1/prices?vs_currency=usd&per_page=10&page=1
```

Returns paginated cryptocurrency prices.

**Parameters:**
- `vs_currency` (string): Target currency (usd, eur, gbp, jpy) - default: usd
- `per_page` (int): Results per page (1-250) - default: 100
- `page` (int): Page number - default: 1
- `include_metrics` (bool): Include volume and market cap - default: true

**Response:**
```json
{
  "count": 10,
  "timestamp": "2026-08-03T22:48:19",
  "data": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "price_usd": 50000.00,
      "change_24h": 2.5,
      "volume_24h": 1000000000,
      "market_cap": 500000000000,
      "last_updated": "2026-08-03T22:48:19"
    }
  ]
}
```

### Get Single Price

```http
GET /api/v1/price/{symbol}
```

Returns price for a specific cryptocurrency.

**Parameters:**
- `symbol` (string): Cryptocurrency symbol (BTC, ETH, SOL, etc.)
- `vs_currency` (string): Target currency - default: usd

**Response:**
```json
{
  "symbol": "BTC",
  "name": "Bitcoin",
  "price_usd": 50000.00,
  "change_24h": 2.5,
  "volume_24h": 1000000000,
  "market_cap": 500000000000,
  "last_updated": "2026-08-03T22:48:19"
}
```

### Batch Prices

```http
GET /api/v1/prices/batch?symbols=BTC,ETH,SOL&vs_currency=usd
```

Returns prices for multiple cryptocurrencies.

**Parameters:**
- `symbols` (string): Comma-separated list of symbols
- `vs_currency` (string): Target currency - default: usd

**Response:**
```json
{
  "count": 3,
  "timestamp": "2026-08-03T22:48:19",
  "data": [
    {
      "symbol": "BTC",
      "name": "Bitcoin",
      "price_usd": 50000.00,
      "change_24h": 2.5
    }
  ]
}
```

### Market Statistics

```http
GET /api/v1/markets
```

Returns global market statistics.

**Response:**
```json
{
  "total_market_cap_usd": 5000000000000,
  "total_volume_24h_usd": 100000000000,
  "btc_dominance": 45.5,
  "eth_dominance": 18.2,
  "active_cryptocurrencies": 5000,
  "last_updated": "2026-08-03T22:48:19"
}
```

### Trending Coins

```http
GET /api/v1/trends
```

Returns top gainers and losers.

**Response:**
```json
{
  "gainers": [
    {
      "symbol": "XYZ",
      "name": "Some Coin",
      "price_usd": 1.23,
      "change_24h": 15.5
    }
  ],
  "losers": [
    {
      "symbol": "ABC",
      "name": "Another Coin",
      "price_usd": 2.34,
      "change_24h": -10.2
    }
  ],
  "timestamp": "2026-08-03T22:48:19"
}
```

### Historical Data

```http
GET /api/v1/history/{symbol}?days=7&vs_currency=usd
```

Returns historical price data for a cryptocurrency.

**Parameters:**
- `symbol` (string): Cryptocurrency symbol
- `days` (int): Number of days (1-365) - default: 7
- `vs_currency` (string): Target currency - default: usd

**Response:**
```json
{
  "symbol": "BTC",
  "days": 7,
  "data_points": 168,
  "prices": [
    {
      "timestamp": 1690000000000,
      "date": "2026-08-03T22:48:19",
      "price": 50000.00
    }
  ],
  "last_updated": "2026-08-03T22:48:19"
}
```

## Error Responses

All errors follow this format:

```json
{
  "detail": "Error message"
}
```

**Status Codes:**
- `400 Bad Request` - Invalid parameters or unsupported symbol
- `404 Not Found` - Symbol not found
- `429 Too Many Requests` - Rate limit exceeded
- `503 Service Unavailable` - API unable to fetch data

## Rate Limiting

- 100 requests per minute per IP
- Returns HTTP 429 when limit is exceeded

## Interactive Documentation

Visit `/docs` for interactive Swagger UI when server is running.
