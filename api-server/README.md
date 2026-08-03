# Crypto Tracker Pro - API Server

FastAPI-based REST API for cryptocurrency data. Provides endpoints for prices, history, trends, and market statistics.

## Endpoints

### Health Check
```
GET /api/v1/health
```
Returns server status and uptime.

### Get Prices
```
GET /api/v1/prices?vs_currency=usd&per_page=10&page=1
```
Returns paginated cryptocurrency prices.

### Get Single Price
```
GET /api/v1/price/{symbol}
```
Returns price for a specific cryptocurrency (e.g., `/api/v1/price/bitcoin`).

### Batch Prices
```
GET /api/v1/prices/batch?symbols=BTC,ETH,SOL&vs_currency=usd
```
Returns prices for multiple cryptocurrencies.

### Market Statistics
```
GET /api/v1/markets
```
Returns global market statistics (total market cap, volume, BTC dominance).

### Trending Coins
```
GET /api/v1/trends
```
Returns top gainers and losers.

### Historical Data
```
GET /api/v1/history/{symbol}?days=7&vs_currency=usd
```
Returns historical price data for a cryptocurrency.

## Rate Limiting

- 100 requests per minute per IP
- Returns HTTP 429 when limit is exceeded

## Running Locally

```bash
cd api-server
pip install -r requirements.txt
python main.py
```

Server runs on `http://localhost:8000`. Interactive docs at `http://localhost:8000/docs`.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| API_PORT | 8000 | Server port |
| API_HOST | 0.0.0.0 | Server host |
| CACHE_TTL | 30 | Cache time-to-live (seconds) |
| RATE_LIMIT | 100 | Requests per minute |
| LOG_LEVEL | INFO | Logging level |
