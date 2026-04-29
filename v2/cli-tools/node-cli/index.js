#!/usr/bin/env node

/**
 * Crypto Tracker Pro - Node.js CLI
 * Command-line interface for cryptocurrency price tracking
 */

const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const axios = require('axios');
const { table } = require('table');

const API_BASE = 'https://api.coingecko.com/api/v3';

// ============================================
// UTILITY FUNCTIONS
// ============================================

function formatNumber(num) {
    if (num === undefined || num === null) return 'N/A';
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    if (num < 0.01) return `$${num.toFixed(8)}`;
    if (num < 1) return `$${num.toFixed(4)}`;
    return `$${num.toFixed(2)}`;
}

function formatChange(change) {
    if (change === undefined || change === null) return 'N/A';
    const isPositive = change >= 0;
    const arrow = isPositive ? '▲' : '▼';
    const color = isPositive ? chalk.green : chalk.red;
    return color(`${arrow} ${Math.abs(change).toFixed(2)}%`);
}

async function fetchMarketData() {
    const spinner = ora('Fetching crypto data...').start();
    try {
        const response = await axios.get(`${API_BASE}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 50,
                page: 1,
                sparkline: false
            }
        });
        spinner.succeed('Data fetched successfully');
        return response.data;
    } catch (error) {
        spinner.fail('Failed to fetch data');
        console.error(chalk.red(error.message));
        process.exit(1);
    }
}

// ============================================
// COMMAND HANDLERS
// ============================================

async function showTopCoins(limit = 10) {
    const data = await fetchMarketData();
    const topCoins = data.slice(0, limit);
    
    const tableData = [
        ['#', 'Coin', 'Price', '24h Change', 'Market Cap']
    ];
    
    topCoins.forEach((coin, index) => {
        tableData.push([
            `${index + 1}`,
            `${coin.name} (${coin.symbol.toUpperCase()})`,
            formatNumber(coin.current_price),
            formatChange(coin.price_change_percentage_24h),
            formatNumber(coin.market_cap)
        ]);
    });
    
    console.log(table(tableData));
}

async function showPrice(symbols) {
    const data = await fetchMarketData();
    const results = [];
    
    for (const symbol of symbols) {
        const coin = data.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
        if (coin) {
            results.push({
                symbol: coin.symbol.toUpperCase(),
                name: coin.name,
                price: coin.current_price,
                change: coin.price_change_percentage_24h
            });
        } else {
            results.push({
                symbol: symbol.toUpperCase(),
                error: 'Not found'
            });
        }
    }
    
    for (const result of results) {
        if (result.error) {
            console.log(chalk.red(`${result.symbol}: ${result.error}`));
        } else {
            console.log(
                `${chalk.bold(result.symbol)}: ${chalk.green(formatNumber(result.price))} ` +
                `${formatChange(result.change)}`
            );
        }
    }
}

async function liveMonitor(symbol) {
    console.log(chalk.cyan(`\n📊 Monitoring ${symbol.toUpperCase()}... (Press Ctrl+C to stop)\n`));
    
    const updatePrice = async () => {
        const data = await fetchMarketData();
        const coin = data.find(c => c.symbol.toLowerCase() === symbol.toLowerCase());
        
        if (coin) {
            const timestamp = new Date().toLocaleTimeString();
            process.stdout.write(`\r[${timestamp}] ${symbol.toUpperCase()}: ${chalk.green(formatNumber(coin.current_price))} ${formatChange(coin.price_change_percentage_24h)}`);
        }
    };
    
    await updatePrice();
    setInterval(updatePrice, 10000);
}

// ============================================
// CLI PROGRAM
// ============================================

program
    .name('crypto-tracker')
    .description('Professional cryptocurrency price tracker CLI')
    .version('2.0.0');

program
    .command('top')
    .description('Show top cryptocurrencies by market cap')
    .option('-l, --limit <number>', 'Number of coins to show', '10')
    .action(async (options) => {
        await showTopCoins(parseInt(options.limit));
    });

program
    .command('price <symbols...>')
    .description('Get price for specific cryptocurrencies')
    .action(async (symbols) => {
        await showPrice(symbols);
    });

program
    .command('watch <symbol>')
    .description('Live monitor a cryptocurrency')
    .action(async (symbol) => {
        await liveMonitor(symbol);
    });

program.parse();
