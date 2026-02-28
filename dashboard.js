// MABS Dashboard - Comprehensive view
// Shows detailed project, agent, and blocker information

let dashboardData = null;

async function loadDashboardData() {
    try {
        const response = await fetch(`dashboard-data.json?t=${Date.now()}`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        dashboardData = await response.json();
        renderDashboard();
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('dashboard').innerHTML = `
            <div style="padding:20px;text-align:center;color:#f44;">
                <h2>⚠️ Failed to load</h2>
                <p>${error.message}</p>
            </div>`;
        setTimeout(loadDashboardData, 5000);
    }
}

function renderDashboard() {
    if (!dashboardData) return;
    
    document.getElementById('dashboard').innerHTML = `
        <div class="header">
            <h1>MABS Dashboard</h1>
            <p class="last-updated">Updated: ${new Date(dashboardData.lastUpdated).toLocaleString()}</p>
        </div>
        
        ${renderStats()}
        ${renderAlerts()}
        ${renderProjects()}
        ${renderAgents()}
        ${renderAwaitingSean()}
        ${renderRecentCompletions()}
    `;
}

function renderStats() {
    const s = dashboardData.stats;
    return `
        <div class="stats-grid">
            <div class="stat-card"><div class="stat-value">${s.activeProjects}</div><div class="stat-label">Active Projects</div></div>
            <div class="stat-card"><div class="stat-value">${s.activeAgents}</div><div class="stat-label">Agents</div></div>
            <div class="stat-card"><div class="stat-value">${s.blockers}</div><div class="stat-label">Blockers</div></div>
            <div class="stat-card"><div class="stat-value">${s.completedToday}</div><div class="stat-label">Completed Today</div></div>
        </div>
    `;
}

function renderAlerts() {
    if (!dashboardData.alerts || dashboardData.alerts.length === 0) return '';
    
    const alerts = dashboardData.alerts.map(a => {
        const colorMap = {critical: '#f44', warning: '#fa0', success: '#4d4', info: '#44f'};
        return `<div class="alert" style="background:${colorMap[a.type]};color:${a.type==='warning'?'#000':'#fff'};padding:12px;border-radius:6px;margin-bottom:8px;">
            ${a.type==='critical'?'🚨':a.type==='warning'?'⚠️':a.type==='success'?'✅':'ℹ️'} 
            <strong>${a.message}</strong>
            <div style="font-size:11px;opacity:0.9;margin-top:4px;">Since: ${a.since}</div>
        </div>`;
    }).join('');
    
    return `<div class="section"><h2>🚨 System Alerts</h2>${alerts}</div>`;
}

function renderProjects() {
    if (!dashboardData.projects) return '';
    
    const projects = dashboardData.projects.map(p => `
        <div class="project-card">
            <div class="project-header">
                <h3>${p.statusIcon} ${p.name}</h3>
                <span class="badge ${p.priority}">${p.priority}</span>
            </div>
            <div class="project-details">
                <div><strong>Phase:</strong> ${p.phase}</div>
                <div><strong>Owner:</strong> ${p.owner}</div>
                <div><strong>Progress:</strong> ${p.progress}</div>
                <div><strong>Last update:</strong> ${p.lastUpdate}</div>
                ${p.blocker !== 'None' ? `<div class="blocker">🚧 <strong>Blocker:</strong> ${p.blocker}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    return `<div class="section"><h2>🎯 Active Projects</h2>${projects}</div>`;
}

function renderAgents() {
    if (!dashboardData.agents) return '';
    
    const agents = dashboardData.agents.map(a => `
        <div class="agent-card">
            <div class="agent-header">
                <span class="agent-id">${a.id}</span>
                <span>${a.statusIcon}</span>
            </div>
            <div class="agent-name">${a.name}</div>
            <div class="agent-load ${a.load.toLowerCase().replace(' ', '-')}">${a.load}</div>
            <div class="agent-details">
                <div><strong>Current:</strong> ${a.currentWork}</div>
                <div style="font-size:11px;opacity:0.8;margin-top:4px;">Last seen: ${a.lastSeen}</div>
                ${a.issue !== 'None' ? `<div style="color:#fa0;margin-top:6px;">⚠️ ${a.issue}</div>` : ''}
            </div>
        </div>
    `).join('');
    
    return `<div class="section"><h2>👥 Agent Status</h2><div class="agents-grid">${agents}</div></div>`;
}

function renderAwaitingSean() {
    if (!dashboardData.awaitingSean) return '';
    
    const items = dashboardData.awaitingSean.map(i => `
        <div class="awaiting-item">
            <div class="awaiting-header">
                <strong>${i.item}</strong>
                <span class="badge ${i.urgency.toLowerCase()}">${i.urgency}</span>
            </div>
            <div style="font-size:13px;margin-top:6px;">
                <div>Blocked: ${i.blockedAgent} (${i.blockedProject})</div>
                <div style="color:#fa0;">Impact: ${i.impact}</div>
            </div>
        </div>
    `).join('');
    
    return `<div class="section"><h2>⏳ Awaiting Sean</h2>${items}</div>`;
}

function renderRecentCompletions() {
    if (!dashboardData.recentCompletions) return '';
    
    const items = dashboardData.recentCompletions.map(c => 
        `<li style="padding:8px;background:#222;border-radius:4px;margin-bottom:6px;">✅ ${c}</li>`
    ).join('');
    
    return `<div class="section"><h2>✅ Recent Completions</h2><ul style="list-style:none;padding:0;">${items}</ul></div>`;
}

document.addEventListener('DOMContentLoaded', () => {
    loadDashboardData();
    setInterval(loadDashboardData, 30000);
});
