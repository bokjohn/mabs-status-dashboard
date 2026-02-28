// MABS Dashboard - Loads from dashboard-data.json
// Updated: 2026-02-28 for GitHub Pages deployment

let dashboardData = null;

// Load dashboard data from JSON
async function loadDashboardData() {
    try {
        const response = await fetch('dashboard-data.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        dashboardData = await response.json();
        renderDashboard();
    } catch (error) {
        console.error('Error loading dashboard data:', error);
        document.getElementById('dashboard').innerHTML = `
            <div style="padding: 20px; text-align: center; color: #ff6b6b;">
                <h2>⚠️ Failed to load dashboard data</h2>
                <p>${error.message}</p>
                <p style="margin-top: 20px;">Retrying in 5 seconds...</p>
            </div>
        `;
        setTimeout(loadDashboardData, 5000);
    }
}

// Render the dashboard
function renderDashboard() {
    if (!dashboardData) {
        console.error('No dashboard data available');
        return;
    }

    const container = document.getElementById('dashboard');
    
    const html = `
        <div class="header">
            <h1>MABS Dashboard</h1>
            <p class="last-updated">Last updated: ${new Date(dashboardData.lastUpdated).toLocaleString()}</p>
        </div>

        ${renderStats()}
        ${renderAlerts()}
        ${renderAgents()}
        ${renderBusinesses()}
        ${renderAwaitingSean()}
    `;
    
    container.innerHTML = html;
}

// Render stats overview
function renderStats() {
    const stats = dashboardData.stats || {};
    return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${stats.activeProjects || dashboardData.businesses?.length || 0}</div>
                <div class="stat-label">Active Projects</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.activeAgents || dashboardData.agents?.length || 0}</div>
                <div class="stat-label">Agents</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.blockers || dashboardData.awaitingSean?.length || 0}</div>
                <div class="stat-label">Blockers</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${stats.completedToday || 0}</div>
                <div class="stat-label">Completed Today</div>
            </div>
        </div>
    `;
}

// Render alerts
function renderAlerts() {
    if (!dashboardData.alerts || dashboardData.alerts.length === 0) {
        return '';
    }

    const alertsHtml = dashboardData.alerts.map(alert => {
        const icon = alert.type === 'critical' ? '🚨' : alert.type === 'warning' ? '⚠️' : 'ℹ️';
        const className = `alert alert-${alert.type}`;
        return `<div class="${className}">${icon} ${alert.message}</div>`;
    }).join('');

    return `
        <div class="section">
            <h2>🚨 Alerts</h2>
            ${alertsHtml}
        </div>
    `;
}

// Render agents
function renderAgents() {
    if (!dashboardData.agents || dashboardData.agents.length === 0) {
        return '<div class="section"><h2>👥 Agents</h2><p>No agent data available</p></div>';
    }

    const agentsHtml = dashboardData.agents.map(agent => {
        const statusIcon = agent.status === 'active' ? '✅' : 
                          agent.status === 'stalled' ? '🚨' : 
                          agent.status === 'waiting' ? '⏸️' : '❓';
        const loadClass = agent.load === 'critical' ? 'load-critical' : 
                         agent.load === 'high' ? 'load-high' : 
                         agent.load === 'medium' ? 'load-medium' : 'load-low';
        
        return `
            <div class="agent-card">
                <div class="agent-header">
                    <span class="agent-id">${agent.id}</span>
                    <span class="agent-status">${statusIcon}</span>
                </div>
                <div class="agent-name">${agent.name}</div>
                <div class="agent-load ${loadClass}">Load: ${agent.load}</div>
            </div>
        `;
    }).join('');

    return `
        <div class="section">
            <h2>👥 Agents</h2>
            <div class="agents-grid">
                ${agentsHtml}
            </div>
        </div>
    `;
}

// Render businesses
function renderBusinesses() {
    if (!dashboardData.businesses || dashboardData.businesses.length === 0) {
        return '<div class="section"><h2>🎯 Active Projects</h2><p>No active projects</p></div>';
    }

    const businessesHtml = dashboardData.businesses.map(biz => {
        const statusIcon = biz.status === 'active' ? '🚀' : 
                          biz.status === 'stalled' ? '🚨' : 
                          biz.status === 'ready' ? '✅' : '⏸️';
        
        return `
            <div class="business-card">
                <div class="business-header">
                    <h3>${biz.name}</h3>
                    <span class="business-status">${statusIcon} ${biz.status}</span>
                </div>
                <div class="business-details">
                    <div><strong>Phase:</strong> ${biz.phase}</div>
                    <div><strong>Owner:</strong> ${biz.owner}</div>
                </div>
            </div>
        `;
    }).join('');

    return `
        <div class="section">
            <h2>🎯 Active Projects</h2>
            ${businessesHtml}
        </div>
    `;
}

// Render awaiting Sean
function renderAwaitingSean() {
    if (!dashboardData.awaitingSean || dashboardData.awaitingSean.length === 0) {
        return '';
    }

    const itemsHtml = dashboardData.awaitingSean.map(item => 
        `<li>${item}</li>`
    ).join('');

    return `
        <div class="section">
            <h2>⏳ Awaiting Sean</h2>
            <ul class="awaiting-list">
                ${itemsHtml}
            </ul>
        </div>
    `;
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    
    // Auto-refresh every 30 seconds
    setInterval(loadDashboardData, 30000);
});
