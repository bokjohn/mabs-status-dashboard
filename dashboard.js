// MABS Dashboard - Simple file-based data loader
// Reads from business-system/_SYSTEM/ and _MEETINGS/

const DATA_PATH = '../';  // Relative to dashboard location

// Sample data structure (will be replaced with file reading)
let dashboardData = {
    agents: [],
    businesses: [],
    metrics: {},
    alerts: [],
    awaitingSean: []
};

// Load and parse STATUS-BOARD.md
async function loadStatusBoard() {
    try {
        const response = await fetch(DATA_PATH + 'STATUS-BOARD.md');
        const text = await response.text();
        return parseStatusBoard(text);
    } catch (error) {
        console.error('Error loading STATUS-BOARD:', error);
        return null;
    }
}

// Parse STATUS-BOARD.md for agent and business status
function parseStatusBoard(markdown) {
    const data = {
        agents: [],
        businesses: [],
        awaitingSean: []
    };
    
    const lines = markdown.split('\n');
    let currentSection = null;
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        
        // Detect sections
        if (line.includes('AGENT STATUS') || line.includes('👥 AGENT STATUS')) {
            currentSection = 'agents';
            continue;
        }
        if (line.includes('ACTIVE PROJECTS') || line.includes('🎯 ACTIVE PROJECTS')) {
            currentSection = 'businesses';
            continue;
        }
        if (line.includes('AWAITING SEAN') || line.includes('🚨 AWAITING SEAN')) {
            currentSection = 'awaiting';
            continue;
        }
        
        // Parse agent entries
        if (currentSection === 'agents' && line.startsWith('###')) {
            const agentName = line.replace(/^###\s*/, '').trim();
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
            const businessName = line.replace(/^###\s*/, '').trim();
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
            if (item && !item.startsWith('#')) {
                data.awaitingSean.push(item);
            }
        }
    }
    
    return data;
}

// Detect agent status from surrounding lines
function detectAgentStatus(lines, startIndex) {
    const nextLines = lines.slice(startIndex + 1, startIndex + 10).join('\n').toLowerCase();
    
    let state = 'idle';
    let lastActive = 'Unknown';
    let currentWork = 'No current task';
    let blockers = [];
    
    // Detect status indicators
    if (nextLines.includes('🟢') || nextLines.includes('active')) state = 'active';
    if (nextLines.includes('🟡') || nextLines.includes('idle')) state = 'idle';
    if (nextLines.includes('🔴') || nextLines.includes('stalled') || nextLines.includes('blocked')) state = 'stalled';
    
    // Extract last active time
    const timeMatch = nextLines.match(/(\d+[hm]?\s*ago|just now|active)/i);
    if (timeMatch) lastActive = timeMatch[0];
    
    // Extract current work
    const workMatch = nextLines.match(/current[:\s]*([^\n]+)/i) || nextLines.match(/working on[:\s]*([^\n]+)/i);
    if (workMatch) currentWork = workMatch[1].trim();
    
    // Extract blockers
    if (nextLines.includes('blocker')) {
        const blockerMatch = nextLines.match(/blocker[s]?[:\s]*([^\n]+)/i);
        if (blockerMatch) blockers.push(blockerMatch[1].trim());
    }
    
    return { state, lastActive, currentWork, blockers };
}

// Detect business progress
function detectBusinessProgress(lines, startIndex) {
    const nextLines = lines.slice(startIndex + 1, startIndex + 10).join('\n');
    
    let status = 'Unknown';
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
    if (nextMatch) next = nextMatch[1].trim();
    
    // Extract blockers
    const blockerMatch = nextLines.match(/blocker[s]?[:\s]*([^\n]+)/i);
    if (blockerMatch && !blockerMatch[1].toLowerCase().includes('none')) {
        blockers.push(blockerMatch[1].trim());
    }
    
    return { status, percentage, next, blockers };
}

// Load evolution metrics (if file exists)
async function loadMetrics() {
    try {
        const response = await fetch(DATA_PATH + 'evolution-metrics.json');
        return await response.json();
    } catch (error) {
        console.log('Evolution metrics not found, using defaults');
        return getDefaultMetrics();
    }
}

// Default metrics if file doesn't exist
function getDefaultMetrics() {
    return {
        deliveryRate: { value: 0, target: 85 },
        completionVerification: { value: 0, target: 95 },
        stallEvents: { value: 0, target: 0 },
        loopEvents: { value: 0, target: 0 },
        capacityUtilization: { value: 0, target: 75 }
    };
}

// Render dashboard
function render() {
    renderSystemStatus();
    renderAgents();
    renderBusinesses();
    renderMetrics();
    renderAlerts();
    renderAwaitingSean();
    updateRefreshTime();
}

// Render system status badge
function renderSystemStatus() {
    const critical = dashboardData.agents.filter(a => a.status === 'stalled').length;
    const warnings = dashboardData.agents.filter(a => a.status === 'idle').length;
    
    const statusDot = document.getElementById('statusDot');
    const statusText = document.getElementById('statusText');
    
    if (critical > 0) {
        statusDot.style.color = '#ef4444';
        statusText.textContent = 'Critical Issues';
    } else if (warnings > 0) {
        statusDot.style.color = '#f59e0b';
        statusText.textContent = 'Minor Issues';
    } else {
        statusDot.style.color = '#10b981';
        statusText.textContent = 'All Systems Operational';
    }
}

// Render agents
function renderAgents() {
    const container = document.getElementById('agentStatus');
    
    if (dashboardData.agents.length === 0) {
        container.innerHTML = '<div style="opacity: 0.5; text-align: center;">No agent data available</div>';
        return;
    }
    
    container.innerHTML = dashboardData.agents.map(agent => `
        <div class="agent-item ${agent.status}">
            <div class="agent-header">
                <span class="agent-name">${agent.name}</span>
                <span class="agent-status">${agent.lastActive}</span>
            </div>
            <div class="agent-work">${agent.currentWork}</div>
            ${agent.blockers.length > 0 ? `<div class="agent-work" style="color: #ef4444;">Blocker: ${agent.blockers[0]}</div>` : ''}
        </div>
    `).join('');
}

// Render businesses
function renderBusinesses() {
    const container = document.getElementById('businessProgress');
    
    if (dashboardData.businesses.length === 0) {
        container.innerHTML = '<div style="opacity: 0.5; text-align: center;">No business data available</div>';
        return;
    }
    
    container.innerHTML = dashboardData.businesses.map(business => `
        <div class="business-item">
            <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                <strong>${business.name}</strong>
                <span>${business.progress}%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${business.progress}%"></div>
            </div>
            <div style="font-size: 14px; opacity: 0.7; margin-top: 4px;">
                Next: ${business.nextMilestone}
            </div>
            ${business.blockers.length > 0 ? `<div style="color: #ef4444; font-size: 14px; margin-top: 4px;">⚠️ ${business.blockers[0]}</div>` : ''}
        </div>
    `).join('');
}

// Render metrics
function renderMetrics() {
    const container = document.getElementById('metrics');
    const m = dashboardData.metrics;
    
    const getClass = (value, target, inverse = false) => {
        const ratio = value / target;
        if (inverse) {
            return ratio <= 1 ? 'metric-good' : (ratio <= 1.5 ? 'metric-warn' : 'metric-bad');
        }
        return ratio >= 0.9 ? 'metric-good' : (ratio >= 0.7 ? 'metric-warn' : 'metric-bad');
    };
    
    container.innerHTML = `
        <div class="metric-card">
            <div class="metric-label">Delivery Rate</div>
            <div class="metric-value ${getClass(m.deliveryRate?.value || 0, m.deliveryRate?.target || 85)}">
                ${m.deliveryRate?.value || 0}%
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Verification Rate</div>
            <div class="metric-value ${getClass(m.completionVerification?.value || 0, m.completionVerification?.target || 95)}">
                ${m.completionVerification?.value || 0}%
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Stall Events</div>
            <div class="metric-value ${getClass(m.stallEvents?.value || 0, m.stallEvents?.target || 0, true)}">
                ${m.stallEvents?.value || 0}
            </div>
        </div>
        <div class="metric-card">
            <div class="metric-label">Capacity</div>
            <div class="metric-value ${getClass(m.capacityUtilization?.value || 0, m.capacityUtilization?.target || 75)}">
                ${m.capacityUtilization?.value || 0}%
            </div>
        </div>
    `;
}

// Render alerts
function renderAlerts() {
    const container = document.getElementById('alerts');
    const alerts = [];
    
    // Generate alerts from agent status
    dashboardData.agents.forEach(agent => {
        if (agent.status === 'stalled') {
            alerts.push({
                type: 'critical',
                title: `${agent.name} Stalled`,
                message: agent.blockers.length > 0 ? agent.blockers[0] : 'Unknown blocker'
            });
        }
    });
    
    // Generate alerts from business blockers
    dashboardData.businesses.forEach(business => {
        if (business.blockers.length > 0) {
            alerts.push({
                type: 'warning',
                title: `${business.name} Blocked`,
                message: business.blockers[0]
            });
        }
    });
    
    if (alerts.length === 0) {
        container.innerHTML = '<div style="opacity: 0.5; text-align: center;">✅ No active alerts</div>';
        return;
    }
    
    container.innerHTML = alerts.map(alert => `
        <div class="alert">
            <div class="alert-title">${alert.title}</div>
            <div style="font-size: 14px; opacity: 0.8;">${alert.message}</div>
        </div>
    `).join('');
}

// Render awaiting Sean items
function renderAwaitingSean() {
    const container = document.getElementById('awaitingSean');
    
    if (dashboardData.awaitingSean.length === 0) {
        container.innerHTML = '<div style="opacity: 0.5; text-align: center;">No items awaiting Sean</div>';
        return;
    }
    
    container.innerHTML = dashboardData.awaitingSean.map(item => `
        <div class="awaiting-item">${item}</div>
    `).join('');
}

// Update refresh time
function updateRefreshTime() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = 
        `Last updated: ${now.toLocaleTimeString()}`;
}

// Load all data and render
async function refresh() {
    try {
        // Load STATUS-BOARD
        const statusBoard = await loadStatusBoard();
        if (statusBoard) {
            dashboardData.agents = statusBoard.agents;
            dashboardData.businesses = statusBoard.businesses;
            dashboardData.awaitingSean = statusBoard.awaitingSean;
        }
        
        // Load metrics
        dashboardData.metrics = await loadMetrics();
        
        // Render everything
        render();
    } catch (error) {
        console.error('Error refreshing dashboard:', error);
    }
}

// Initial load
refresh();

// Auto-refresh every 30 seconds
setInterval(refresh, 30000);
