#!/usr/bin/env node

/**
 * CRYPTO PRICE TRACKER - Node.js CLI
 * Command-line interface for terminal users
 * 
 * Usage:
 *   node cli.js [symbol]               # Get price for a single coin
 *   node cli.js BTC,ETH,SOL            # Get prices for multiple coins
 *   node cli.js --live BTC             # Live monitor mode
 *   node cli.js --predict BTC          # Show predictions
 *   node cli.js --arbitrage BTC        # Find arbitrage opportunities
 *   node cli.js --interactive          # Interactive mode
 */

const { CryptoPriceTracker } = require('./src/price-scraper.js');
const readline = require('readline');

// ANSI color codes for beautiful terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m'
};

class CryptoCLI {
    constructor() {
        this.tracker = new CryptoPriceTracker({ useSimulated: false });
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    
    printBanner() {
        console.log(`
${colors.cyan}${colors.bright}
╔══════════════════════════════════════════════════════════════════════════╗
║                                                                          ║
║    ██████╗██████╗ ██╗   ██╗██████╗ ████████╗ ██████╗                     ║
║   ██╔════╝██╔══██╗╚██╗ ██╔╝██╔══██╗╚══██╔══╝██╔═══██╗                    ║
║   ██║     ██████╔╝ ╚████╔╝ ██████╔╝   ██║   ██║   ██║                    ║
║   ██║     ██╔═══╝   ╚██╔╝  ██╔═══╝    ██║   ██║   ██║                    ║
║   ╚██████╗██║        ██║   ██║        ██║   ╚██████╔╝                    ║
║    ╚═════╝╚═╝        ╚═╝   ╚═╝        ╚═╝    ╚═════╝                     ║
║                                                                          ║
║               CRYPTO PRICE TRACKER - Node.js CLI                         ║
║                    No APIs - Direct Web Scraping                         ║
╚══════════════════════════════════════════════════════════════════════════╝
${colors.reset}`);
    }
    
    printPrice(symbol, price) {
        let priceStr;
        if (price < 0.001) priceStr = `$${price.toFixed(10)}`;
        else if (price < 0.1) priceStr = `$${price.toFixed(6)}`;
        else if (price < 1) priceStr = `$${price.toFixed(4)}`;
        else if (price < 100) priceStr = `$${price.toFixed(2)}`;
        else priceStr = `$${price.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        
        console.log(`  ${colors.green}${colors.bright}${symbol}${colors.reset}: ${colors.cyan}${priceStr}${colors.reset}`);
    }
    
    printTable(prices) {
        console.log(`\n${colors.cyan}┌────────────┬────────────────────┬──────────┐${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} ${colors.bright}Symbol${colors.reset}      │ ${colors.bright}Price (USD)${colors.reset}        │ ${colors.bright}Status${colors.reset}   │${colors.cyan}${colors.reset}`);
        console.log(`${colors.cyan}├────────────┼────────────────────┼──────────┤${colors.reset}`);
        
        for (const [symbol, price] of Object.entries(prices)) {
            const priceStr = price ? 
                (price < 0.001 ? price.toFixed(10) : 
                 price < 0.1 ? price.toFixed(6) :
                 price < 1 ? price.toFixed(4) :
                 price < 100 ? price.toFixed(2) :
                 price.toLocaleString(undefined, {minimumFractionDigits: 2})) : 'N/A';
            
            const status = price ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
            console.log(`${colors.cyan}│${colors.reset} ${symbol.padEnd(10)} │ $${priceStr.padEnd(18)} │ ${status.padEnd(8)} │${colors.reset}`);
        }
        
        console.log(`${colors.cyan}└────────────┴────────────────────┴──────────┘${colors.reset}`);
    }
    
    printPredictions(symbol, data) {
        console.log(`\n${colors.cyan}┌─────────────────────────────────────────────────────────────┐${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} ${colors.bright}🔮 PRICE PREDICTIONS for ${symbol}${' '.repeat(52 - symbol.length)}${colors.cyan}│${colors.reset}`);
        console.log(`${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}`);
        console.log(`${colors.cyan}│${colors.reset} Current Price: ${colors.green}$${data.currentPrice.toLocaleString()}${colors.reset}${' '.repeat(39)}${colors.cyan}│${colors.reset}`);
        
        if (data.predictions.ema14) {
            console.log(`${colors.cyan}│${colors.reset} EMA (14):      $${data.predictions.ema14.toLocaleString()}${' '.repeat(36)}${colors.cyan}│${colors.reset}`);
        }
        if (data.predictions.ema50) {
            console.log(`${colors.cyan}│${colors.reset} EMA (50):      $${data.predictions.ema50.toLocaleString()}${' '.repeat(36)}${colors.cyan}│${colors.reset}`);
        }
        if (data.predictions.predictedNext) {
            const change = ((data.predictions.predictedNext - data.currentPrice) / data.currentPrice * 100);
            const changeColor = change > 0 ? colors.green : change < 0 ? colors.red : colors.yellow;
            const arrow = change > 0 ? '▲' : change < 0 ? '▼' : '━';
            console.log(`${colors.cyan}│${colors.reset} Predicted:     $${data.predictions.predictedNext.toLocaleString()} ${changeColor}${arrow} ${Math.abs(change).toFixed(2)}%${colors.reset}${' '.repeat(26 - Math.abs(change).toFixed(2).length)}${colors.cyan}│${colors.reset}`);
        }
        
        console.log(`${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}`);
        
        if (data.indicators.volatility) {
            const volColor = data.indicators.volatility < 30 ? colors.green : data.indicators.volatility < 60 ? colors.yellow : colors.red;
            console.log(`${colors.cyan}│${colors.reset} Volatility:    ${volColor}${data.indicators.volatility.toFixed(2)}%${colors.reset}${' '.repeat(39)}${colors.cyan}│${colors.reset}`);
        }
        if (data.indicators.support) {
            console.log(`${colors.cyan}│${colors.reset} Support:       $${data.indicators.support.toLocaleString()}${' '.repeat(36)}${colors.cyan}│${colors.reset}`);
        }
        if (data.indicators.resistance) {
            console.log(`${colors.cyan}│${colors.reset} Resistance:    $${data.indicators.resistance.toLocaleString()}${' '.repeat(36)}${colors.cyan}│${colors.reset}`);
        }
        
        const trend = data.indicators.trend;
        const trendColor = trend.trend === 'BULLISH' ? colors.green : trend.trend === 'BEARISH' ? colors.red : colors.yellow;
        console.log(`${colors.cyan}│${colors.reset} Trend:         ${trendColor}${trend.trend}${colors.reset} (Strength: ${trend.strength.toFixed(1)}%)${' '.repeat(19 - trend.strength.toFixed(1).length)}${colors.cyan}│${colors.reset}`);
        
        console.log(`${colors.cyan}└─────────────────────────────────────────────────────────────┘${colors.reset}`);
    }
    
    async getSinglePrice(symbol) {
        console.log(`\n${colors.yellow}Fetching price for ${symbol}...${colors.reset}`);
        const price = await this.tracker.getPrice(symbol);
        
        if (price) {
            this.printPrice(symbol, price);
        } else {
            console.log(`${colors.red}Failed to fetch price for ${symbol}${colors.reset}`);
        }
        console.log();
    }
    
    async getMultiplePrices(symbols) {
        console.log(`\n${colors.yellow}Fetching prices for ${symbols.length} cryptocurrencies...${colors.reset}`);
        const prices = {};
        
        for (const symbol of symbols) {
            prices[symbol] = await this.tracker.getPrice(symbol);
        }
        
        this.printTable(prices);
        console.log();
    }
    
    async liveMonitor(symbol) {
        console.log(`\n${colors.green}Starting live monitor for ${symbol}${colors.reset}`);
        console.log(`${colors.dim}Press Ctrl+C to stop${colors.reset}\n`);
        
        const monitorInterval = setInterval(async () => {
            // Clear previous line and move cursor up
            readline.cursorTo(process.stdout, 0);
            readline.moveCursor(process.stdout, 0, -2);
            
            const price = await this.tracker.getPrice(symbol);
            const timestamp = new Date().toLocaleTimeString();
            
            if (price) {
                let priceStr;
                if (price < 0.001) priceStr = price.toFixed(10);
                else if (price < 0.1) priceStr = price.toFixed(6);
                else if (price < 1) priceStr = price.toFixed(4);
                else if (price < 100) priceStr = price.toFixed(2);
                else priceStr = price.toLocaleString(undefined, {minimumFractionDigits: 2});
                
                console.log(`${colors.cyan}[${timestamp}]${colors.reset} ${symbol}: ${colors.green}$${priceStr}${colors.reset}`);
                console.log(`${colors.dim}Monitoring... (updates every 5 seconds)${colors.reset}`);
            } else {
                console.log(`${colors.red}[${timestamp}] Failed to fetch price${colors.reset}`);
                console.log(`${colors.dim}Monitoring... (updates every 5 seconds)${colors.reset}`);
            }
        }, 5000);
        
        // Handle exit
        process.on('SIGINT', () => {
            clearInterval(monitorInterval);
            console.log(`\n${colors.yellow}Monitor stopped${colors.reset}`);
            process.exit(0);
        });
    }
    
    async showPredictions(symbol) {
        console.log(`\n${colors.yellow}Analyzing ${symbol}...${colors.reset}`);
        
        // Need historical data - get current price first
        const price = await this.tracker.getPrice(symbol);
        if (!price) {
            console.log(`${colors.red}Failed to fetch price for ${symbol}${colors.reset}`);
            return;
        }
        
        // Get predictions
        const predictions = this.tracker.getPredictions(symbol);
        if (predictions) {
            this.printPredictions(symbol, predictions);
        } else {
            console.log(`${colors.red}Insufficient data for predictions${colors.reset}`);
        }
        console.log();
    }
    
    async showArbitrage(symbol) {
        console.log(`\n${colors.yellow}Checking arbitrage opportunities for ${symbol}...${colors.reset}`);
        
        const opportunities = await this.tracker.detectArbitrage(symbol);
        
        if (opportunities.length > 0) {
            console.log(`\n${colors.green}Found ${opportunities.length} arbitrage opportunity(s):${colors.reset}`);
            for (const opp of opportunities) {
                console.log(`\n  ${colors.cyan}▶${colors.reset} ${opp.action}`);
                console.log(`     ${colors.green}Profit: ${opp.profitPercent}%${colors.reset}`);
            }
        } else {
            console.log(`\n${colors.yellow}No arbitrage opportunities found${colors.reset}`);
        }
        console.log();
    }
    
    async interactiveMode() {
        this.printBanner();
        
        const menu = `
${colors.bright}${colors.cyan}┌─────────────────────────────────────────────────────────────┐${colors.reset}
${colors.bright}${colors.cyan}│                         MAIN MENU                               │${colors.reset}
${colors.bright}${colors.cyan}├─────────────────────────────────────────────────────────────┤${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}  ${colors.green}1${colors.reset}. Track Single Cryptocurrency                         ${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}  ${colors.green}2${colors.reset}. Track Multiple Cryptocurrencies                    ${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}  ${colors.green}3${colors.reset}. Live Price Monitor                               ${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}  ${colors.green}4${colors.reset}. View Price Predictions                           ${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}  ${colors.green}5${colors.reset}. Detect Arbitrage Opportunities                  ${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}  ${colors.green}6${colors.reset}. Clear Cache                                       ${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}  ${colors.green}7${colors.reset}. Toggle Simulated Mode                            ${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}│${colors.reset}  ${colors.red}0${colors.reset}. Exit                                                ${colors.cyan}│${colors.reset}
${colors.bright}${colors.cyan}└─────────────────────────────────────────────────────────────┘${colors.reset}
`;
        
        const askChoice = () => {
            this.rl.question(`\n${colors.bright}Enter your choice: ${colors.reset}`, async (choice) => {
                switch (choice) {
                    case '0':
                        console.log(`\n${colors.green}Goodbye!${colors.reset}`);
                        this.rl.close();
                        break;
                    case '1':
                        this.rl.question('Enter cryptocurrency symbol (e.g., BTC): ', async (symbol) => {
                            await this.getSinglePrice(symbol.toUpperCase());
                            askChoice();
                        });
                        break;
                    case '2':
                        this.rl.question('Enter symbols separated by commas (e.g., BTC,ETH,SOL): ', async (symbolsStr) => {
                            const symbols = symbolsStr.split(',').map(s => s.trim().toUpperCase());
                            await this.getMultiplePrices(symbols);
                            askChoice();
                        });
                        break;
                    case '3':
                        this.rl.question('Enter cryptocurrency symbol to monitor: ', async (symbol) => {
                            await this.liveMonitor(symbol.toUpperCase());
                        });
                        break;
                    case '4':
                        this.rl.question('Enter cryptocurrency symbol: ', async (symbol) => {
                            await this.showPredictions(symbol.toUpperCase());
                            askChoice();
                        });
                        break;
                    case '5':
                        this.rl.question('Enter cryptocurrency symbol: ', async (symbol) => {
                            await this.showArbitrage(symbol.toUpperCase());
                            askChoice();
                        });
                        break;
                    case '6':
                        this.tracker.clearCache();
                        console.log(`\n${colors.green}Cache cleared!${colors.reset}`);
                        askChoice();
                        break;
                    case '7':
                        this.tracker.useSimulated = !this.tracker.useSimulated;
                        const mode = this.tracker.useSimulated ? 'SIMULATED' : 'LIVE SCRAPING';
                        const modeColor = this.tracker.useSimulated ? colors.yellow : colors.green;
                        console.log(`\n${modeColor}Mode switched to: ${mode}${colors.reset}`);
                        askChoice();
                        break;
                    default:
                        console.log(`\n${colors.red}Invalid choice!${colors.reset}`);
                        askChoice();
                }
            });
        };
        
        console.log(menu);
        askChoice();
    }
    
    async run(args) {
        if (args.length === 0 || args[0] === '--interactive') {
            await this.interactiveMode();
        } else if (args[0] === '--live' && args[1]) {
            await this.liveMonitor(args[1].toUpperCase());
        } else if (args[0] === '--predict' && args[1]) {
            await this.showPredictions(args[1].toUpperCase());
        } else if (args[0] === '--arbitrage' && args[1]) {
            await this.showArbitrage(args[1].toUpperCase());
        } else if (args[0] && args[0].includes(',')) {
            const symbols = args[0].split(',').map(s => s.trim().toUpperCase());
            await this.getMultiplePrices(symbols);
        } else if (args[0]) {
            await this.getSinglePrice(args[0].toUpperCase());
        } else {
            await this.interactiveMode();
        }
    }
}

// Parse command line arguments
const args = process.argv.slice(2);
const cli = new CryptoCLI();
cli.run(args).catch(console.error);
