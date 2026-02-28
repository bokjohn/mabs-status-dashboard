#!/usr/bin/env node
/**
 * Simple HTTP server for MABS Dashboard
 * Serves static files and allows CORS for local file reading
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const BASE_DIR = path.resolve(__dirname);
const SYSTEM_DIR = path.resolve(__dirname, '..');

// MIME types
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.md': 'text/markdown',
    '.txt': 'text/plain'
};

const server = http.createServer((req, res) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    
    // Parse URL
    let filePath = req.url === '/' ? '/index.html' : req.url;
    
    // Security: prevent directory traversal
    if (filePath.includes('..')) {
        res.writeHead(403);
        res.end('Forbidden');
        return;
    }
    
    // Determine if requesting dashboard file or system file
    let fullPath;
    if (filePath.startsWith('/STATUS-BOARD.md') || 
        filePath.startsWith('/evolution-metrics.json') ||
        filePath.includes('_SYSTEM') ||
        filePath.includes('_MEETINGS')) {
        fullPath = path.join(SYSTEM_DIR, filePath);
    } else {
        fullPath = path.join(BASE_DIR, filePath);
    }
    
    // Get MIME type
    const ext = path.extname(fullPath);
    const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
    
    // Read and serve file
    fs.readFile(fullPath, (err, content) => {
        if (err) {
            if (err.code === 'ENOENT') {
                console.log(`  → 404 Not Found: ${fullPath}`);
                res.writeHead(404);
                res.end('File not found');
            } else {
                console.error(`  → 500 Error: ${err.message}`);
                res.writeHead(500);
                res.end('Server error');
            }
        } else {
            console.log(`  → 200 OK (${mimeType})`);
            res.writeHead(200, { 'Content-Type': mimeType });
            res.end(content);
        }
    });
});

server.listen(PORT, () => {
    console.log('════════════════════════════════════════════════');
    console.log('🤖 MABS Dashboard Server');
    console.log('════════════════════════════════════════════════');
    console.log(`Started: ${new Date().toLocaleString()}`);
    console.log(`URL:     http://localhost:${PORT}`);
    console.log(`Dir:     ${BASE_DIR}`);
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('════════════════════════════════════════════════');
});
