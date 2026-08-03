# Crypto Price Tracker - Architecture

## Overview

Crypto Price Tracker is a multi-platform cryptocurrency intelligence system providing real-time prices, market data, watchlists, and price alerts across multiple interfaces.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
│  ┌──────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │  Web App  │  │Browser Ext.  │  │   CLI Tools         │  │
│  │  (PWA)    │  │(Manifest V3) │  │  (Python + Node)    │  │
│  └─────┬─────┘  └──────┬───────┘  └──────────┬──────────┘  │
│        │               │                      │              │
└────────┼───────────────┼──────────────────────┼──────────────┘
         │               │                      │
         v               v                      v
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway Layer                        │
│         FastAPI REST API (port 8000)                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │  Rate Limiting | CORS | Request Validation          │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           v
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  CoinGecko   │  │  SQLite Cache │  │  In-Memory Cache │  │
│  │  API         │  │  (price_cache)│  │  (LRU, 30s TTL)  │  │
│  └─────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## Components

### 1. Web App (PWA)
- **Location**: Root directory (index.html, script.js, style.css)
- **Technology**: HTML5, CSS3, JavaScript ES6+, Chart.js
- **Features**: Offline support via Service Worker, dark/light theme, watchlist, alerts, responsive design
- **Data Source**: CoinGecko public API (direct)

### 2. Browser Extension (Manifest V3)
- **Location**: browser-extension/
- **Technology**: JavaScript, Chrome Extensions API
- **Features**: Popup UI, options page, desktop notifications, rate limiting, persistent storage
- **Data Source**: CoinGecko API via background service worker

### 3. API Server
- **Location**: api-server/
- **Technology**: Python, FastAPI, httpx
- **Features**: REST endpoints, rate limiting, CORS, request/response validation
- **Data Source**: CoinGecko API via httpx with connection pooling
- **Endpoints**:
  - GET /api/v1/prices - List prices with pagination
  - GET /api/v1/price/{symbol} - Single coin price
  - GET /api/v1/prices/batch - Batch price lookup
  - GET /api/v1/markets - Global market statistics
  - GET /api/v1/trends - Top gainers/losers
  - GET /api/v1/history/{symbol} - Historical price data
  - GET /api/v1/health - Health check

### 4. Core Engine
- **Location**: core-engine/
- **Technology**: Python, SQLite
- **Features**: Data caching, watchlist management, alert system, multi-source fallback
- **Components**:
  - core.py - Main engine (PriceEngine, DatabaseManager, DataSources, CryptoSymbols)
  - schema.sql - SQLite database schema
  - cache.py - Caching layer (planned)

### 5. CLI Tools
- **Python CLI**: cli-tools/python-cli/ - Click-based CLI with Rich formatting
- **Node.js CLI**: cli-tools/node-cli/ - Commander-based CLI with Chalk output

## Data Flow

1. Client requests data -> API Server or direct CoinGecko API
2. API Server fetches from CoinGecko -> caches in SQLite -> returns to client
3. Core Engine fetches from CoinGecko -> caches in SQLite + in-memory -> returns to caller
4. Browser Extension caches in chrome.storage.local -> serves from cache on subsequent requests
5. Web App caches in localStorage -> serves from cache when offline

## Security

- CORS configured (restrict in production)
- Rate limiting on API endpoints (100 req/min per IP)
- Input validation on all endpoints
- No API keys required (public CoinGecko API)
- All data stored locally in browsers/extensions
- Content Security Policy enforced

## Deployment

- **Web App**: GitHub Pages (static hosting)
- **API Server**: Docker (uvicorn) or Heroku
- **Browser Extension**: Chrome Web Store (Manifest V3)
- **CLI Tools**: PyPI (pip) and npm (npm install -g)
