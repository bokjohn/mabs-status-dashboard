#!/usr/bin/env node
/**
 * Export MABS data to JSON for GitHub Pages deployment
 * Reads STATUS-BOARD.md and evolution-metrics.json, outputs dashboard-data.json
 */

const fs = require('fs');
const path = require('path');

const SYSTEM_DIR = path.resolve(__dirname, '..');
const OUTPUT_FILE = path.resolve(__dirname, 'dashboard-data.json');

// Read STATUS-BOARD.md
function readStatusBoard() {
    const filePath = path.join(SYSTEM_DIR, 'STATUS-BOARD.md');
    
    if (!fs.existsSync(filePath)) {
        console.error('STATUS-BOARD.md not found');
        return null;
    }
    
    return fs.readFileSync(filePath, 'utf8');
}

// Parse STATUS-BOARD.md
function parseStatusBoard(markdown) {
    const data = {
        agents: [],
        businesses: [],
        awaitingSean: [],
        alerts: [],
        timestamp: new Date().toISOString()
    };
    
    const lines = markdown.split('\n');
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect sections
        if (line.match(/##.*AGENT STATUS/i)) {
            currentSection = 'agents';
            continue;
        }
        if (line.match(/##.*ACTIVE PROJECTS|##.*PORTFOLIO/i)) {
            currentSection = 'businesses';
            continue;
        }
        if (line.match(/##.*AWAITING SEAN/i)) {
            currentSection = 'awaiting';
            continue;
        }
        
        // Parse agent entries (### Agent Name)
        if (currentSection === 'agents' && line.startsWith('###')) {
            const agentName = line.replace(/^###\s*/, '').replace(/[🟢🟡🔴]/g, '').trim();
            const status = detectAgentStatus(lines, i);
            data.agents.push({
                name: agentName,
                status: status.state,
                lastActive: status.lastActive,
                currentWork: status.currentWork,
                blockers: status.blockers
            });
        }
        
        // Parse business entries
        if (currentSection === 'businesses' && line.startsWith('###')) {
            const businessName = line.replace(/^###\s*/, '').replace(/[📊🎯]/g, '').trim();
            const progress = detectBusinessProgress(lines, i);
            data.businesses.push({
                name: businessName,
                status: progress.status,
                progress: progress.percentage,
                nextMilestone: progress.next,
                blockers: progress.blockers
            });
        }
        
        // Parse awaiting Sean items
        if (currentSection === 'awaiting' && (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./))) {
            const item = line.replace(/^[-*\d.]\s*/, '').trim();
            if (item && !item.startsWith('#') && !item.startsWith('None')) {
                data.awaitingSean.push(item);
            }
        }
    }
    
    // Generate alerts from agent/business status
    data.agents.forEach(agent => {
        if (agent.status === 'stalled') {
            data.alerts.push({
                type: 'critical',
                title: `${agent.name} Stalled`,
                message: agent.blockers.length > 0 ? agent.blockers[0] : 'No activity detected'
            });
        }
    });
    
    data.businesses.forEach(business => {
        if (business.blockers.length > 0) {
            data.alerts.push({
                type: 'warning',
                title: `${business.name} Blocked`,
                message: business.blockers[0]
            });
        }
    });
    
    return data;
}

// Detect agent status from surrounding lines
function detectAgentStatus(lines, startIndex) {
    const nextLines = lines.slice(startIndex + 1, startIndex + 10).join('\n').toLowerCase();
    
    let state = 'idle';
    let lastActive = 'Unknown';
    let currentWork = 'No current task';
    let blockers = [];
    
    // Detect status
    if (nextLines.includes('🟢') || nextLines.includes('active')) state = 'active';
    if (nextLines.includes('🟡') || nextLines.includes('idle')) state = 'idle';
    if (nextLines.includes('🔴') || nextLines.includes('stalled') || nextLines.includes('blocked')) state = 'stalled';
    
    // Extract last active
    const timeMatch = nextLines.match(/(\d+[hm]?\s*ago|just now|active)/i);
    if (timeMatch) lastActive = timeMatch[0];
    
    // Extract current work
    const workMatch = nextLines.match(/current[:\s]*([^\n]+)/i) || nextLines.match(/working on[:\s]*([^\n]+)/i);
    if (workMatch) currentWork = workMatch[1].trim().substring(0, 100);
    
    // Extract blockers
    const blockerMatch = nextLines.match(/blocker[s]?[:\s]*([^\n]+)/i);
    if (blockerMatch && !blockerMatch[1].toLowerCase().includes('none')) {
        blockers.push(blockerMatch[1].trim().substring(0, 100));
    }
    
    return { state, lastActive, currentWork, blockers };
}

// Detect business progress
function detectBusinessProgress(lines, startIndex) {
    const nextLines = lines.slice(startIndex + 1, startIndex + 10).join('\n');
    
    let status = 'In Progress';
    let percentage = 0;
    let next = 'TBD';
    let blockers = [];
    
    // Extract status
    const statusMatch = nextLines.match(/status[:\s]*([^\n]+)/i);
    if (statusMatch) status = statusMatch[1].trim();
    
    // Extract percentage
    const percentMatch = nextLines.match(/(\d+)%/);
    if (percentMatch) percentage = parseInt(percentMatch[1]);
    
    // Extract next milestone
    const nextMatch = nextLines.match(/next[:\s]*([^\n]+)/i);
    if (nextMatch) next = nextMatch[1].trim().substring(0, 100);
    
    // Extract blockers
    const blockerMatch = nextLines.match(/blocker[s]?[:\s]*([^\n]+)/i);
    if (blockerMatch && !blockerMatch[1].toLowerCase().includes('none')) {
        blockers.push(blockerMatch[1].trim().substring(0, 100));
    }
    
    return { status, percentage, next, blockers };
}

// Read evolution metrics
function readMetrics() {
    const filePath = path.join(SYSTEM_DIR, 'evolution-metrics.json');
    
    if (fs.existsSync(filePath)) {
        try {
            return JSON.parse(fs.readFileSync(filePath, 'utf8'));
        } catch (error) {
            console.error('Error parsing evolution-metrics.json:', error.message);
        }
    }
    
    // Return defaults
    return {
        deliveryRate: { value: 0, target: 85 },
        completionVerification: { value: 0, target: 95 },
        stallEvents: { value: 0, target: 0 },
        loopEvents: { value: 0, target: 0 },
        capacityUtilization: { value: 0, target: 75 }
    };
}

// Main export
function exportData() {
    console.log('Exporting MABS data for GitHub Pages...');
    
    const markdown = readStatusBoard();
    if (!markdown) {
        console.error('Failed to read STATUS-BOARD.md');
        process.exit(1);
    }
    
    const statusData = parseStatusBoard(markdown);
    const metrics = readMetrics();
    
    const dashboardData = {
        ...statusData,
        metrics,
        generatedAt: new Date().toISOString(),
        version: '1.0'
    };
    
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(dashboardData, null, 2));
    
    console.log(`✅ Exported to ${OUTPUT_FILE}`);
    console.log(`   Agents: ${dashboardData.agents.length}`);
    console.log(`   Businesses: ${dashboardData.businesses.length}`);
    console.log(`   Awaiting Sean: ${dashboardData.awaitingSean.length}`);
    console.log(`   Alerts: ${dashboardData.alerts.length}`);
}

// Run export
if (require.main === module) {
    exportData();
}

module.exports = { exportData };
