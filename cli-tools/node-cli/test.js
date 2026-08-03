#!/usr/bin/env node

/**
 * Crypto Tracker Pro - Node.js CLI Tests
 * Basic smoke tests for CLI functionality
 */

const { program } = require('commander');
const axios = require('axios');

const API_BASE = 'https://api.coingecko.com/api/v3';

let testsPassed = 0;
let testsFailed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`✅ ${name}`);
        testsPassed++;
    } catch (error) {
        console.log(`❌ ${name}: ${error.message}`);
        testsFailed++;
    }
}

async function runTests() {
    console.log('🧪 Crypto Tracker Pro - Node.js CLI Tests\n');
    
    await test('API is reachable', async () => {
        const response = await axios.get(`${API_BASE}/ping`, { timeout: 5000 });
        if (!response.data) {
            throw new Error('API did not respond');
        }
    });
    
    await test('Fetch market data returns array', async () => {
        const response = await axios.get(`${API_BASE}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 10,
                page: 1,
                sparkline: false
            },
            timeout: 10000
        });
        if (!Array.isArray(response.data)) {
            throw new Error('Response is not an array');
        }
        if (response.data.length === 0) {
            throw new Error('Response array is empty');
        }
    });
    
    await test('Coin data has required fields', async () => {
        const response = await axios.get(`${API_BASE}/coins/markets`, {
            params: {
                vs_currency: 'usd',
                order: 'market_cap_desc',
                per_page: 1,
                page: 1,
                sparkline: false
            },
            timeout: 10000
        });
        const coin = response.data[0];
        const requiredFields = ['symbol', 'name', 'current_price', 'market_cap', 'total_volume'];
        const missingFields = requiredFields.filter(field => !(field in coin));
        if (missingFields.length > 0) {
            throw new Error(`Missing fields: ${missingFields.join(', ')}`);
        }
    });
    
    await test('Format number function works', async () => {
        const formatNumber = (num) => {
            if (num === undefined || num === null) return 'N/A';
            if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
            if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
            if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
            if (num < 0.01) return `$${num.toFixed(8)}`;
            if (num < 1) return `$${num.toFixed(4)}`;
            return `$${num.toFixed(2)}`;
        };
        
        const tests = [
            { input: 1000000000, expected: '$1.00B' },
            { input: 1000000, expected: '$1.00M' },
            { input: 1000, expected: '$1.00K' },
            { input: 50000, expected: '$50000.00' },
        ];
        
        for (const t of tests) {
            const result = formatNumber(t.input);
            if (result !== t.expected) {
                throw new Error(`Expected ${t.expected}, got ${result}`);
            }
        }
    });
    
    await test('Format change function works', async () => {
        const formatChange = (change) => {
            if (change === undefined || change === null) return 'N/A';
            const isPositive = change >= 0;
            const arrow = isPositive ? '▲' : '▼';
            return `${arrow} ${Math.abs(change).toFixed(2)}%`;
        };
        
        const positive = formatChange(5.5);
        const negative = formatChange(-3.2);
        
        if (!positive.includes('▲') || !positive.includes('5.50%')) {
            throw new Error('Positive change format incorrect');
        }
        if (!negative.includes('▼') || !negative.includes('3.20%')) {
            throw new Error('Negative change format incorrect');
        }
    });
    
    console.log('\n==========================================');
    console.log(`Tests: ${testsPassed + testsFailed} | Passed: ${testsPassed} | Failed: ${testsFailed}`);
    console.log('==========================================\n');
    
    if (testsFailed > 0) {
        process.exit(1);
    }
}

runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
});
