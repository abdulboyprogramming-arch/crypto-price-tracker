#!/usr/bin/env python3
"""
Crypto Tracker Pro - REST API Server
FastAPI-based REST API for cryptocurrency data
Provides endpoints for prices, history, trends, and watchlist management
"""

from fastapi import FastAPI, HTTPException, Query, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import httpx
import asyncio
from contextlib import asynccontextmanager

# ============================================
# CONFIGURATION
# ============================================

API_VERSION = "v1"
API_TITLE = "Crypto Tracker Pro API"
API_DESCRIPTION = """
## Cryptocurrency Data API

Provides real-time and historical cryptocurrency data including:
- Current prices
- Market capitalization
- Trading volume
- Price changes
- Historical data
- Market trends

### Features
- **Real-time prices** from multiple sources
- **Historical data** for charts and analysis
- **Market trends** (gainers/losers)
- **Watchlist management** (coming soon)

### Rate Limits
- 100 requests per minute for free tier
- Contact for higher limits

### Authentication
API key required for production use. Contact for access.
"""

COINGECKO_API = "https://api.coingecko.com/api/v3"
REQUEST_TIMEOUT = 10

# ============================================
# DATA MODELS
# ============================================

class PriceResponse(BaseModel):
    """Single price response model"""
    symbol: str
    name: str
    price_usd: float
    change_24h: Optional[float] = None
    volume_24h: Optional[float] = None
    market_cap: Optional[float] = None
    last_updated: str

class PricesResponse(BaseModel):
    """Multiple prices response model"""
    count: int
    timestamp: str
    data: List[PriceResponse]

class MarketStatsResponse(BaseModel):
    """Global market statistics"""
    total_market_cap_usd: float
    total_volume_24h_usd: float
    btc_dominance: float
    eth_dominance: float
    active_cryptocurrencies: int
    last_updated: str

class TrendResponse(BaseModel):
    """Trending coins response"""
    gainers: List[Dict[str, Any]]
    losers: List[Dict[str, Any]]
    timestamp: str

class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: str
    uptime_seconds: float

# ============================================
# APPLICATION SETUP
# ============================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    print(f"🚀 Starting {API_TITLE} v{API_VERSION}")
    print(f"📡 Using CoinGecko API: {COINGECKO_API}")
    yield
    print("👋 Shutting down API server")

app = FastAPI(
    title=API_TITLE,
    description=API_DESCRIPTION,
    version=API_VERSION,
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================
# HELPER FUNCTIONS
# ============================================

start_time = datetime.now()

async def fetch_from_coingecko(endpoint: str, params: Dict = None) -> Optional[Dict]:
    """Fetch data from CoinGecko API"""
    async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
        try:
            url = f"{COINGECKO_API}{endpoint}"
            response = await client.get(url, params=params)
            response.raise_for_status()
            return response.json()
        except httpx.HTTPStatusError as e:
            print(f"HTTP error: {e}")
            return None
        except Exception as e:
            print(f"API error: {e}")
            return None

def format_coin_data(coin: Dict, include_metrics: bool = True) -> Dict:
    """Format coin data for API response"""
    result = {
        "symbol": coin.get("symbol", "").upper(),
        "name": coin.get("name", ""),
        "price_usd": coin.get("current_price", 0)
    }
    
    if include_metrics:
        result.update({
            "change_24h": coin.get("price_change_percentage_24h"),
            "volume_24h": coin.get("total_volume"),
            "market_cap": coin.get("market_cap"),
            "last_updated": coin.get("last_updated", datetime.now().isoformat())
        })
    
    return result

# ============================================
# API ENDPOINTS
# ============================================

@app.get("/", tags=["Root"])
async def root():
    """API root endpoint"""
    return {
        "message": f"Welcome to {API_TITLE}",
        "version": API_VERSION,
        "documentation": "/docs",
        "endpoints": {
            "prices": "/api/v1/prices",
            "price": "/api/v1/price/{symbol}",
            "markets": "/api/v1/markets",
            "trends": "/api/v1/trends",
            "health": "/api/v1/health"
        }
    }

@app.get("/api/v1/health", response_model=HealthResponse, tags=["System"])
async def health_check():
    """Health check endpoint"""
    uptime = (datetime.now() - start_time).total_seconds()
    return HealthResponse(
        status="healthy",
        version=API_VERSION,
        timestamp=datetime.now().isoformat(),
        uptime_seconds=uptime
    )

@app.get("/api/v1/prices", response_model=PricesResponse, tags=["Prices"])
async def get_prices(
    vs_currency: str = Query("usd", description="Currency (usd, eur, gbp, jpy)"),
    per_page: int = Query(100, ge=1, le=250, description="Results per page"),
    page: int = Query(1, ge=1, description="Page number"),
    include_metrics: bool = Query(True, description="Include volume and market cap")
):
    """
    Get current prices for all cryptocurrencies
    
    - **vs_currency**: Target currency (usd, eur, gbp, jpy)
    - **per_page**: Number of results per page (max 250)
    - **page**: Page number for pagination
    - **include_metrics**: Include additional metrics
    """
    data = await fetch_from_coingecko(
        "/coins/markets",
        {
            "vs_currency": vs_currency,
            "order": "market_cap_desc",
            "per_page": per_page,
            "page": page,
            "sparkline": "false"
        }
    )
    
    if not data:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Unable to fetch price data"
        )
    
    formatted_data = [format_coin_data(coin, include_metrics) for coin in data]
    
    return PricesResponse(
        count=len(formatted_data),
        timestamp=datetime.now().isoformat(),
        data=formatted_data
    )

@app.get("/api/v1/price/{symbol}", tags=["Prices"])
async def get_price(
    symbol: str,
    vs_currency: str = Query("usd", description="Currency (usd, eur, gbp, jpy)")
):
    """
    Get current price for a specific cryptocurrency
    
    - **symbol**: Cryptocurrency symbol (BTC, ETH, SOL, etc.)
    - **vs_currency**: Target currency
    """
    data = await fetch_from_coingecko(
        "/coins/markets",
        {
            "vs_currency": vs_currency,
            "ids": symbol.lower(),
            "per_page": 1
        }
    )
    
    if not data or len(data) == 0:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Symbol '{symbol}' not found"
        )
    
    return format_coin_data(data[0])

@app.get("/api/v1/prices/batch", tags=["Prices"])
async def get_batch_prices(
    symbols: str = Query(..., description="Comma-separated symbols (BTC,ETH,SOL)"),
    vs_currency: str = Query("usd", description="Currency")
):
    """
    Get prices for multiple cryptocurrencies
    
    - **symbols**: Comma-separated list of symbols
    - **vs_currency**: Target currency
    """
    symbol_list = [s.strip().upper() for s in symbols.split(",")]
    ids = ",".join(s.lower() for s in symbol_list)
    
    data = await fetch_from_coingecko(
        "/coins/markets",
        {
            "vs_currency": vs_currency,
            "ids": ids,
            "per_page": len(symbol_list)
        }
    )
    
    if not data:
        raise HTTPException(status_code=503, detail="Unable to fetch price data")
    
    results = []
    for coin in data:
        results.append(format_coin_data(coin))
    
    # Add missing symbols
    found_symbols = [c.get("symbol", "").upper() for c in data]
    for symbol in symbol_list:
        if symbol not in found_symbols:
            results.append({
                "symbol": symbol,
                "name": None,
                "price_usd": None,
                "error": "Symbol not found"
            })
    
    return {
        "count": len(results),
        "timestamp": datetime.now().isoformat(),
        "data": results
    }

@app.get("/api/v1/markets", response_model=MarketStatsResponse, tags=["Markets"])
async def get_market_stats():
    """Get global cryptocurrency market statistics"""
    data = await fetch_from_coingecko("/global")
    
    if not data or "data" not in data:
        raise HTTPException(status_code=503, detail="Unable to fetch market data")
    
    market_data = data["data"]
    
    return MarketStatsResponse(
        total_market_cap_usd=market_data.get("total_market_cap", {}).get("usd", 0),
        total_volume_24h_usd=market_data.get("total_volume", {}).get("usd", 0),
        btc_dominance=market_data.get("market_cap_percentage", {}).get("btc", 0),
        eth_dominance=market_data.get("market_cap_percentage", {}).get("eth", 0),
        active_cryptocurrencies=market_data.get("active_cryptocurrencies", 0),
        last_updated=datetime.now().isoformat()
    )

@app.get("/api/v1/trends", response_model=TrendResponse, tags=["Markets"])
async def get_trends():
    """Get top gainers and losers"""
    data = await fetch_from_coingecko(
        "/coins/markets",
        {"vs_currency": "usd", "order": "market_cap_desc", "per_page": 100}
    )
    
    if not data:
        raise HTTPException(status_code=503, detail="Unable to fetch trend data")
    
    # Filter coins with valid change data
    valid_coins = [c for c in data if c.get("price_change_percentage_24h") is not None]
    
    # Sort by change percentage
    sorted_coins = sorted(valid_coins, key=lambda x: x.get("price_change_percentage_24h", 0), reverse=True)
    
    gainers = []
    losers = []
    
    for coin in sorted_coins[:10]:
        gainers.append({
            "symbol": coin.get("symbol", "").upper(),
            "name": coin.get("name", ""),
            "price_usd": coin.get("current_price", 0),
            "change_24h": coin.get("price_change_percentage_24h", 0)
        })
    
    for coin in sorted_coins[-10:]:
        losers.insert(0, {
            "symbol": coin.get("symbol", "").upper(),
            "name": coin.get("name", ""),
            "price_usd": coin.get("current_price", 0),
            "change_24h": coin.get("price_change_percentage_24h", 0)
        })
    
    return TrendResponse(
        gainers=gainers,
        losers=losers,
        timestamp=datetime.now().isoformat()
    )

@app.get("/api/v1/history/{symbol}", tags=["History"])
async def get_history(
    symbol: str,
    days: int = Query(7, ge=1, le=365, description="Number of days"),
    vs_currency: str = Query("usd", description="Currency")
):
    """
    Get historical price data for a cryptocurrency
    
    - **symbol**: Cryptocurrency symbol
    - **days**: Number of days (1-365)
    - **vs_currency**: Target currency
    """
    coin_id = symbol.lower()
    
    data = await fetch_from_coingecko(
        f"/coins/{coin_id}/market_chart",
        {"vs_currency": vs_currency, "days": days}
    )
    
    if not data:
        raise HTTPException(status_code=404, detail=f"Symbol '{symbol}' not found")
    
    prices = []
    for price_point in data.get("prices", []):
        prices.append({
            "timestamp": price_point[0],
            "date": datetime.fromtimestamp(price_point[0] / 1000).isoformat(),
            "price": price_point[1]
        })
    
    return {
        "symbol": symbol.upper(),
        "days": days,
        "data_points": len(prices),
        "prices": prices,
        "last_updated": datetime.now().isoformat()
    }

# ============================================
# MAIN ENTRY POINT
# ============================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
