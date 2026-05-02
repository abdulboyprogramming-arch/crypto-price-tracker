# 🚀 Crypto Price Tracker

<div align="center">

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Python](https://img.shields.io/badge/python-3.8+-green)
![Node](https://img.shields.io/badge/node-14+-green)
![License](https://img.shields.io/badge/license-MIT-yellow)
![PWA](https://img.shields.io/badge/PWA-ready-purple)

**A professional multi-platform cryptocurrency intelligence system**

[Live Demo](https://abdulboyprogramming-arch.github.io/crypto-price-tracker/web-app/) •
[Report Bug](https://github.com/abdulboyprogramming-arch/crypto-price-tracker/issues) •
[Request Feature](https://github.com/abdulboyprogramming-arch/crypto-price-tracker/issues)

</div>

---

## 📊 Overview

Crypto Price Tracker is a **professional-grade, multi-platform cryptocurrency intelligence system** that provides real-time prices, market data, watchlists, and price alerts across multiple interfaces.

### ✨ Features

| Category | Features |
|----------|----------|
| **Web App** | PWA, offline support, dark/light theme, watchlist, price alerts, interactive charts |
| **Browser Extension** | Chrome/Firefox support, popup prices, watchlist, desktop notifications |
| **Python CLI** | Terminal-based tracking, live monitoring, rich output |
| **Node.js CLI** | Cross-platform CLI, colored output, easy installation |
| **REST API** | FastAPI server, Swagger docs, CORS enabled |
| **Core Engine** | Shared Python logic, SQLite caching |

---

## 📁 Project Structure

```
crypto-price-tracker/
│
├── web-app/                 # PWA web application
│   ├── index.html           # Main entry
│   ├── style.css            # Styling (dark/light)
│   ├── script.js            # Application logic
│   ├── manifest.json        # PWA manifest
│   ├── sw.js                # Service worker
│   └── offline.html         # Offline fallback
│
├── browser-extension/       # Chrome/Firefox extension
│   ├── manifest.json        # Extension V3 manifest
│   ├── background.js        # Service worker
│   ├── popup.html/js        # Popup interface
│   └── options.html/js      # Settings page
│
├── cli-tools/               # Command-line interfaces
│   ├── python-cli/          # Python package
│   └── node-cli/            # Node.js package
│
├── api-server/              # REST API (FastAPI)
│   ├── main.py              # API endpoints
│   └── requirements.txt     # Python dependencies
│
├── core-engine/             # Shared Python core
│   ├── core.py              # Core logic
│   └── schema.sql           # Database schema
│
├── docker/                  # Container configurations
│   ├── docker-compose.yml
│   ├── Dockerfile.web
│   ├── Dockerfile.api
│   └── Dockerfile.extension
│
├── scripts/                 # Utility scripts
│   ├── generate-icons.py    # Icon generator
│   ├── backup.sh            # Backup utility
│   └── deploy.sh            # Deployment helper
│
└── .github/workflows/       # CI/CD pipelines
    ├── ci.yml               # Continuous integration
    ├── deploy.yml           # Auto-deploy to Pages
    ├── release.yml          # Release management
    └── test.yml             # Component testing
```

---

## 🚀 Quick Start

### 🌐 Web App (PWA)
```bash
cd web-app
python -m http.server 8080
# Open http://localhost:8080
```

### 🧩 Browser Extension
1. Open Chrome → `chrome://extensions/`
2. Enable "Developer mode"
3. Load unpacked → Select `browser-extension/`

### 🐍 Python CLI
```bash
cd cli-tools/python-cli
pip install -e .
crypto-tracker top
crypto-tracker price BTC
crypto-tracker watch BTC
```

### 📦 Node.js CLI
```bash
cd cli-tools/node-cli
npm install
npm link
crypto-tracker top
crypto-tracker price BTC
```

### 🔌 API Server
```bash
cd api-server
pip install -r requirements.txt
python main.py
# API: http://localhost:8000
# Docs: http://localhost:8000/docs
```

### 🐳 Docker
```bash
# Web app only
docker build -f docker/Dockerfile.web -t crypto-tracker-web .
docker run -p 8080:80 crypto-tracker-web

# Full stack
cd docker && docker-compose up
```

---

## 🔧 Configuration

### Web App Settings (localStorage)
- Theme (dark/light)
- Currency (USD/EUR/GBP/JPY)
- Refresh interval (15-120 seconds)
- Notification preferences

### Browser Extension (chrome.storage)
- Watchlist symbols
- Price alerts
- Theme preference

### CLI (Python) - `~/.crypto-config.json`
```json
{
    "default_symbols": ["BTC", "ETH", "SOL"],
    "currency": "usd",
    "refresh_interval": 30
}
```

### API Server - Environment Variables
```bash
API_PORT=8000
API_HOST=0.0.0.0
CACHE_TTL=30
RATE_LIMIT=100
```

---

## 🧪 Testing

```bash
# All tests (GitHub Actions will run automatically)
git push origin main

# Manual web app test
cd web-app && python -m http.server 8080

# Manual CLI test
cd cli-tools/python-cli && python -m pytest
cd cli-tools/node-cli && npm test
```

---

## 📦 Deployment

### GitHub Pages (Auto-deploy)
Push to `main` branch → Auto-deploys to:
`https://abdulboyprogramming-arch.github.io/crypto-price-tracker/web-app/`

### Browser Extension Stores
- Chrome Web Store: Package `browser-extension/`
- Firefox Add-ons: Submit for review

### PyPI (Python CLI)
```bash
cd cli-tools/python-cli
python -m build
python -m twine upload dist/*
```

### NPM (Node.js CLI)
```bash
cd cli-tools/node-cli
npm publish
```

---

## 🔄 Versioning & Releases

### Create a Release (Two Methods)

**Method 1: Terminal**
```bash
git tag -a v1.0.0 -m "Initial stable release"
git push origin v1.0.0
```

**Method 2: GitHub UI**
1. Go to Actions → Create Release
2. Click "Run workflow"
3. Enter tag name (e.g., `v1.0.0`)
4. Click "Run workflow"

### Pre-release Versions
```bash
git tag -a v2.0.0-beta -m "Beta preview"
git push origin v2.0.0-beta
```

---

## 🛠️ Technologies

| Component | Stack |
|-----------|-------|
| Web App | HTML5, CSS3, JavaScript ES6+, Chart.js |
| Browser Extension | Manifest V3, Chrome APIs |
| Python CLI | Python 3.8+, Click, Rich |
| Node.js CLI | Node.js, Commander, Chalk |
| API Server | FastAPI, Uvicorn, HTTPX |
| Database | SQLite |
| Container | Docker, Docker Compose |
| CI/CD | GitHub Actions |

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open Pull Request

### Commit Convention
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation
- `style:` Code style
- `refactor:` Code refactor
- `test:` Testing
- `chore:` Maintenance
- `ci:` CI/CD changes

---

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Abdulrahman Adeeyo (Abdulboy)**
- GitHub: [@abdulboyprogramming-arch](https://github.com/abdulboyprogramming-arch)
- LinkedIn: [abdulrahman-adeeyo](https://linkedin.com/in/abdulrahman-adeeyo)
- Email: adeeyoabdulrahman@gmail.com

---

## 🙏 Acknowledgments

- CoinGecko API for cryptocurrency data
- Open-source community
- FUTA Programmers Club

---

<div align="center">
  <sub>Built with ❤️ from Nigeria</sub>
</div>
