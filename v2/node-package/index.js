#!/usr/bin/env node

/**
 * CRYPTO PRICE TRACKER - Main Entry Point for NPM Package
 * 
 * Usage:
 *   const { CryptoPriceTracker } = require('crypto-price-tracker');
 *   const tracker = new CryptoPriceTracker();
 *   const price = await tracker.getPrice('BTC');
 */

const { CryptoPriceTracker, CryptoScraper, SimulatedPriceEngine, PricePredictor, ArbitrageDetector } = require('./src/price-scraper.js');

module.exports = {
    CryptoPriceTracker,
    CryptoScraper,
    SimulatedPriceEngine,
    PricePredictor,
    ArbitrageDetector
};
