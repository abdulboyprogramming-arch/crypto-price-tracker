# 🚀 Crypto Price Tracker

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![Node](https://img.shields.io/badge/node-14+-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
![PWA](https://img.shields.io/badge/PWA-ready-purple)
![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-red)
![Status](https://img.shields.io/badge/status-production%20ready-brightgreen)

**A professional multi-platform cryptocurrency intelligence system**

[Live Demo](https://abdulboyprogramming-arch.github.io/crypto-price-tracker/web-app/) •
[Testing Guide](./TESTING_GUIDE.md) •
[Report Bug](https://github.com/abdulboyprogramming-arch/crypto-price-tracker/issues) •
[Request Feature](https://github.com/abdulboyprogramming-arch/crypto-price-tracker/issues)

</div>

---

## 📊 Overview

Crypto Price Tracker is a **professional-grade, multi-platform cryptocurrency intelligence system** that provides real-time prices, market data, watchlists, and price alerts across multiple interfaces. Built with no external API keys required, supporting offline-first PWA, Chrome extension with Manifest V3, Python/Node.js CLIs, and a FastAPI REST server.

### ✨ Key Features

| Category | Features |
|----------|----------|
| **Web App (PWA)** | 📱 Offline support, Dark/light theme, Watchlist management, Real-time price alerts, Interactive charts, Mobile-responsive |
| **Browser Extension** | 🧩 Chrome Manifest V3, Desktop notifications, Popup prices, Price alerts, Settings management, One-click access |
| **Python CLI** | 🐍 Terminal-based tracking, Real-time monitoring, Rich formatted output, Configuration files, Data export |
| **Node.js CLI** | 📦 Cross-platform support, Colored output, Easy NPM installation, Global command, Quick setup |
| **REST API** | 🔌 FastAPI powered, Interactive Swagger docs, Rate limiting, CORS enabled, Caching support |
| **Core Engine** | ⚙️ Shared Python logic, SQLite database, Real-time data sync, Error recovery, Performance optimized |

---

## 🎯 What's New (Latest Updates)

### ✅ Batch 4 Improvements (Browser Extension)
- **Manifest V3 Compliance:** Full V3 manifest with proper permissions, CSP, and web accessible resources
- **Enhanced UI:** Improved popup and options pages with accessibility features
- **Better Architecture:** Rate limiting, request timeout handling, storage validation
- **Security Hardening:** Input validation, sanitized notifications, secure message passing
- **Full Documentation:** Complete testing guide and integration instructions

### ✅ Batch 3 Improvements (Backend)
- **Database Schema:** Optimized SQLite with proper indexes
- **API Validation:** Request/response validation, error handling
- **Rate Limiting:** Per-IP rate limiting to prevent abuse
- **Caching:** Multi-level caching strategy (memory + SQLite)

### ✅ Batch 2 Improvements (Web App)
- **PWA Features:** Service worker, offline mode, installable
- **Performance:** Lazy loading, image optimization, code splitting
- **Accessibility:** ARIA labels, semantic HTML, keyboard navigation

### ✅ Batch 1 Improvements (CI/CD)
- **GitHub Actions:** Automated testing, linting, building
- **Deployment:** Auto-deploy to GitHub Pages
- **Quality Gates:** Security scanning, code coverage

---

## 📁 Project Structure

```
crypto-price-tracker/
│
├── web-app/                          # 🌐 PWA Web Application
│   ├── index.html                    # Main entry point
│   ├── style.css                     # Responsive styling (dark/light theme)
│   ├── script.js                     # Application logic
│   ├── manifest.json                 # PWA manifest
│   ├── sw.js                         # Service worker for offline
│   ├── offline.html                  # Offline fallback page
│   └── icons/                        # App icons (16, 48, 128, 192, 512px)
│
├── browser-extension/                # 🧩 Chrome Extension (Manifest V3)
│   ├── manifest.json                 # Manifest V3 configuration ⭐
│   ├── background.js                 # Service worker with rate limiting
│   ├── popup.html                    # Popup interface ⭐
│   ├── popup.js                      # Popup logic with accessibility
│   ├── options.html                  # Settings page ⭐
│   ├── options.js                    # Settings management
│   ├── popup.css                     # Popup styling
│   ├── options.css                   # Options styling
│   └── icons/                        # Extension icons
│
├── api-server/                       # 🔌 FastAPI REST Server
│   ├── main.py                       # API endpoints & routes
│   ├── requirements.txt              # Python dependencies
│   ├── README.md                     # API documentation
│   └── tests/                        # API test suite
│
├── core-engine/                      # ⚙️ Shared Python Core
│   ├── core.py                       # Core business logic
│   ├── crypto_api.py                 # Cryptocurrency API wrapper
│   ├── database.py                   # Database operations
│   ├── schema.sql                    # SQLite database schema
│   └── cache.py                      # Caching layer
│
├── cli-tools/                        # 📟 Command Line Interfaces
│   ├── python-cli/                   # 🐍 Python CLI
│   │   ├── setup.py                  # Python package setup
│   │   ├── crypto_tracker/           # Package directory
│   │   │   ├── __init__.py
│   │   │   ├── cli.py                # CLI commands
│   │   │   └── formatter.py          # Output formatting
│   │   └── README.md                 # Python CLI docs
│   │
│   └── node-cli/                     # 📦 Node.js CLI
│       ├── package.json              # NPM package config
│       ├── bin/                      # Executable
│       ├── lib/                      # Library code
│       └── README.md                 # Node CLI docs
│
├── docker/                           # 🐳 Docker Configuration
│   ├── docker-compose.yml            # Full stack compose
│   ├── Dockerfile.web                # Web app container
│   ├── Dockerfile.api                # API server container
│   ├── Dockerfile.extension          # Extension builder
│   └── nginx.conf                    # Nginx configuration
│
├── scripts/                          # 🛠️ Utility Scripts
│   ├── generate-icons.py             # Icon generator
│   ├── backup.sh                     # Backup utility
│   ├── deploy.sh                     # Deployment helper
│   └── setup.sh                      # Initial setup
│
├── .github/workflows/                # 🔄 CI/CD Pipelines
│   ├── ci.yml                        # Continuous integration
│   ├── test.yml                      # Component testing
│   ├── deploy.yml                    # GitHub Pages deployment
│   └── release.yml                   # Release management
│
├── docs/                             # 📚 Documentation
│   ├── ARCHITECTURE.md               # System design
│   ├── API.md                        # API reference
│   ├── BROWSER_EXTENSION.md          # Extension guide
│   └── CLI.md                        # CLI usage
│
├── TESTING_GUIDE.md                  # 🧪 Complete Testing Guide ⭐
├── CHANGELOG.md                      # Version history
├── CONTRIBUTING.md                   # Contribution guidelines
├── LICENSE                           # MIT License
└── README.md                         # This file
```

---

## 🚀 Quick Start

### 🌐 Web App (PWA)

**Local Development:**
```bash
cd web-app
python -m http.server 8080
# Open http://localhost:8080
```

**Features to test:**
- ✅ Real-time price tracking
- ✅ Create watchlist
- ✅ Set price alerts
- ✅ Toggle dark/light theme
- ✅ Works offline

### 🧩 Browser Extension

**Installation:**
1. Open `chrome://extensions/`
2. Enable "Developer mode" (top right)
3. Click "Load unpacked"
4. Select `browser-extension/` folder
5. Extension appears in toolbar! 🎉

**Features to test:**
- ✅ View top cryptocurrencies
- ✅ Click to add to watchlist
- ✅ Create price alerts
- ✅ Desktop notifications
- ✅ Settings management

**For Complete Testing:**
See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for step-by-step instructions

### 🐍 Python CLI

**Installation:**
```bash
cd cli-tools/python-cli
pip install -e .
```

**Usage:**
```bash
crypto-tracker top              # Show top 10 coins
crypto-tracker price BTC        # Get Bitcoin price
crypto-tracker watch            # Manage watchlist
crypto-tracker alert BTC 50000  # Set price alert
```

### 📦 Node.js CLI

**Installation:**
```bash
cd cli-tools/node-cli
npm install
npm link  # Make globally available
```

**Usage:**
```bash
crypto-tracker top              # Show top 10 coins
crypto-tracker price BTC        # Get Bitcoin price
crypto-tracker watch BTC        # Add to watchlist
```

### 🔌 API Server

**Start Server:**
```bash
cd api-server
pip install -r requirements.txt
python main.py
```

**Access:**
- API: `http://localhost:8000`
- Docs: `http://localhost:8000/docs` (Interactive Swagger UI)
- Health: `http://localhost:8000/health`

**Example API Calls:**
```bash
# Get top 10 cryptocurrencies
curl http://localhost:8000/prices?per_page=10

# Get specific coin
curl http://localhost:8000/prices/bitcoin

# Get market statistics
curl http://localhost:8000/market-stats

# Get trending coins
curl http://localhost:8000/trending
```

### 🐳 Docker

**Web App Only:**
```bash
docker build -f docker/Dockerfile.web -t crypto-tracker-web .
docker run -p 8080:80 crypto-tracker-web
```

**Full Stack:**
```bash
cd docker
docker-compose up
# Web: http://localhost:8080
# API: http://localhost:8000
```

---

## 🔧 Configuration

### Web App (localStorage)
```javascript
// Auto-saved in browser storage
{
    theme: 'dark',           // 'dark' or 'light'
    currency: 'usd',         // 'usd', 'eur', 'gbp', 'jpy'
    refreshInterval: 30,     // seconds (15-120)
    notifications: true,     // enable/disable
    watchlist: ['BTC', 'ETH'],
    alerts: [...]
}
```

### Browser Extension (chrome.storage)
```javascript
// Sync across Chrome profiles
{
    watchlist: ['BTC', 'ETH', 'SOL'],
    alerts: [{symbol: 'BTC', condition: 'above', price: 50000}],
    settings: {theme: 'dark', refreshInterval: 30}
}
```

### Python CLI (~/.crypto-config.json)
```json
{
    "default_symbols": ["BTC", "ETH", "SOL"],
    "currency": "usd",
    "refresh_interval": 30,
    "output_format": "table"
}
```

### API Server (Environment Variables)
```bash
# .env file
API_PORT=8000
API_HOST=0.0.0.0
API_WORKERS=4
CACHE_TTL=30
RATE_LIMIT=100
LOG_LEVEL=INFO
```

---

## 🧪 Testing

### Quick Test (5 minutes)
```bash
# Terminal 1: Start web app
cd web-app && python -m http.server 8080

# Terminal 2: Start API
cd api-server && python main.py

# Browser: Test everything
# 1. Open http://localhost:8080
# 2. Add coins to watchlist
# 3. Create price alerts
# 4. Test dark/light theme
```

### Complete Testing
See [TESTING_GUIDE.md](./TESTING_GUIDE.md) for:
- ✅ Web app testing (PWA, offline, mobile)
- ✅ API server testing (endpoints, rate limiting)
- ✅ Browser extension testing (popup, notifications, settings)
- ✅ CI/CD pipeline verification
- ✅ Integration testing
- ✅ Security testing
- ✅ Cross-browser compatibility
- ✅ Performance benchmarks

### Run Tests
```bash
# GitHub Actions (automatic on push)
git push origin main
# Check: https://github.com/abdulboyprogramming-arch/crypto-price-tracker/actions

# Manual testing
cd web-app && python -m http.server 8080  # Test PWA
cd api-server && python main.py            # Test API
# Load extension in Chrome and test UI
```

---

## 📦 Deployment

### 🌐 GitHub Pages (Web App)

Auto-deploys when you push to `main`:
```
https://abdulboyprogramming-arch.github.io/crypto-price-tracker/web-app/
```

**Status:** ✅ Live and production-ready

### 🧩 Browser Extension Stores

**Chrome Web Store:**
```
1. Package browser-extension/ folder
2. Upload to Chrome Web Store
3. Submit for review
4. Published within 24-48 hours
```

**Firefox Add-ons:**
```
1. Convert manifest for Firefox (mostly compatible)
2. Submit to Mozilla Add-ons
3. Review process: 1-7 days
```

### 🔌 API Server Deployment

**Heroku:**
```bash
heroku create crypto-tracker-api
git push heroku main
```

**AWS/DigitalOcean:**
```bash
# Using Docker
docker build -f docker/Dockerfile.api -t api .
docker run -p 8000:8000 api
```

### 📦 PyPI (Python CLI)

```bash
cd cli-tools/python-cli
python -m build
python -m twine upload dist/*
```

Install globally:
```bash
pip install crypto-tracker
crypto-tracker top
```

### 📦 NPM (Node.js CLI)

```bash
cd cli-tools/node-cli
npm publish
```

Install globally:
```bash
npm install -g crypto-tracker
crypto-tracker top
```

---

## 🔄 Versioning & Releases

### Create a Release

**Method 1: Terminal**
```bash
git tag -a v1.0.1 -m "Fix: API rate limiting"
git push origin v1.0.1
```

**Method 2: GitHub UI**
```
1. Go to Actions → Create Release (if workflow exists)
2. Click "Run workflow"
3. Enter version: v1.0.1
4. Click "Run workflow"
```

### Version Scheme
- **Major:** Breaking changes (v2.0.0)
- **Minor:** New features (v1.1.0)
- **Patch:** Bug fixes (v1.0.1)

### Changelog Format
```
## v1.0.1 - 2026-06-01

### ✨ Features
- Added currency selector to web app

### 🐛 Fixes
- Fixed API rate limiting edge case
- Fixed dark theme toggle persistence

### 📚 Docs
- Updated testing guide with new screenshots
```

---

## 🛠️ Technologies & Stack

| Component | Stack |
|-----------|-------|
| **Web App** | HTML5, CSS3, JavaScript ES6+, Chart.js, Service Worker |
| **Browser Extension** | Manifest V3, Chrome APIs, localStorage |
| **Python CLI** | Python 3.8+, Click, Rich, Requests |
| **Node.js CLI** | Node.js 14+, Commander, Chalk, Axios |
| **API Server** | FastAPI, Uvicorn, SQLAlchemy, HTTPX |
| **Database** | SQLite3 with proper indexing |
| **Container** | Docker, Docker Compose, Nginx |
| **CI/CD** | GitHub Actions, Semantic Release |

---

## 🔐 Security & Privacy

### ✅ No API Keys Required
- Uses public APIs (CoinGecko, Binance)
- No authentication needed
- Fully open source

### ✅ Privacy First
- All data stored locally (browser storage)
- No server-side user tracking
- Optional desktop notifications only

### ✅ Security Features
- Content Security Policy (CSP) enabled
- Input validation on all forms
- Rate limiting on API endpoints
- CORS properly configured
- No sensitive data in logs

---

## 📊 Comparison Table

| Feature | Web App | Extension | Python CLI | Node CLI | API |
|---------|---------|-----------|-----------|----------|-----|
| Real-time prices | ✅ | ✅ | ✅ | ✅ | ✅ |
| Watchlist | ✅ | ✅ | ✅ | ✅ | ✅ |
| Price alerts | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dark theme | ✅ | ✅ | ✅ | ✅ | N/A |
| Offline support | ✅ | ✅ | ❌ | ❌ | ❌ |
| Desktop notifications | ❌ | ✅ | ❌ | ❌ | ❌ |
| Installable | ✅ | ✅ | ✅ | ✅ | N/A |
| API access | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 🤝 Contributing

### Setup Development Environment
```bash
# Clone repository
git clone https://github.com/abdulboyprogramming-arch/crypto-price-tracker.git
cd crypto-price-tracker

# Create feature branch
git checkout -b feature/amazing-feature

# Make changes and test
# See TESTING_GUIDE.md for comprehensive testing

# Commit changes
git commit -m "feat: add amazing feature"

# Push to branch
git push origin feature/amazing-feature

# Create Pull Request on GitHub
```

### Commit Convention
```
feat:     New feature
fix:      Bug fix
docs:     Documentation
style:    Code style (no logic change)
refactor: Code refactor
test:     Test cases
chore:    Maintenance
ci:       CI/CD changes
perf:     Performance improvement
security: Security fix
```

### Pull Request Requirements
- [ ] Code tested locally
- [ ] All tests pass (GitHub Actions)
- [ ] Documentation updated
- [ ] No breaking changes (or documented)
- [ ] Follows commit conventions

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

You are free to:
- ✅ Use commercially
- ✅ Modify the code
- ✅ Distribute
- ✅ Use privately

You must:
- ✅ Include license notice
- ✅ State changes made

---

## 👨‍💻 Author

**Abdulrahman Adeeyo (Abdulboy)**

- 🐙 GitHub: [@abdulboyprogramming-arch](https://github.com/abdulboyprogramming-arch)
- 💼 LinkedIn: [abdulrahman-adeeyo](https://linkedin.com/in/abdulrahman-adeeyo)
- 📧 Email: adeeyoabdulrahman@gmail.com
- 🌐 Website: [abdulboy.dev](https://abdulboy.dev)

---

## 🙏 Acknowledgments

- **CoinGecko API** - Cryptocurrency data provider
- **Chrome Extensions** - For Manifest V3 platform
- **Open Source Community** - For amazing tools and libraries
- **FUTA Programmers Club** - For support and inspiration
- **Contributors** - Everyone who reported bugs and requested features

---

## 📚 Documentation Links

- [Testing Guide](./TESTING_GUIDE.md) - Complete testing instructions
- [API Documentation](./api-server/README.md) - API endpoints reference
- [Browser Extension Guide](./docs/BROWSER_EXTENSION.md) - Extension setup & features
- [Architecture](./docs/ARCHITECTURE.md) - System design overview
- [Contributing Guide](./CONTRIBUTING.md) - How to contribute

---

## 💬 Community & Support

- **Issues:** [Report bugs or request features](https://github.com/abdulboyprogramming-arch/crypto-price-tracker/issues)
- **Discussions:** [Share ideas and ask questions](https://github.com/abdulboyprogramming-arch/crypto-price-tracker/discussions)
- **GitHub Stargazers:** ⭐ Give us a star if you like this project!

---

## 📈 Project Status

| Component | Status | Version | Last Updated |
|-----------|--------|---------|--------------|
| Web App (PWA) | ✅ Production Ready | 1.0.0 | 2026-06-01 |
| Browser Extension | ✅ Production Ready | 1.0.0 | 2026-06-01 |
| API Server | ✅ Production Ready | 1.0.0 | 2026-06-01 |
| Python CLI | ✅ Production Ready | 1.0.0 | 2026-06-01 |
| Node.js CLI | ✅ Production Ready | 1.0.0 | 2026-06-01 |
| CI/CD Pipeline | ✅ Active | GitHub Actions | 2026-06-01 |
| Documentation | ✅ Complete | Comprehensive | 2026-06-01 |

---

## 🚀 Roadmap

### Q3 2026
- [ ] Mobile app (React Native)
- [ ] Portfolio tracking
- [ ] Advanced analytics
- [ ] Custom alerts (email, SMS)

### Q4 2026
- [ ] Multi-language support
- [ ] User accounts & sync
- [ ] Trading integration
- [ ] Premium features

### 2027
- [ ] AI price predictions
- [ ] Social features
- [ ] Mobile app v2
- [ ] Enterprise API

---

<div align="center">

### 🎉 Ready to use? Start with the [Quick Start](#-quick-start) section above!

**[View Testing Guide](./TESTING_GUIDE.md)** • **[Report Issues](https://github.com/abdulboyprogramming-arch/crypto-price-tracker/issues)** • **[Star the Repo](https://github.com/abdulboyprogramming-arch/crypto-price-tracker)**

---

Built with ❤️ from Nigeria 🇳🇬

*Last Updated: June 1, 2026 | Version: 1.0.0*

</div>
