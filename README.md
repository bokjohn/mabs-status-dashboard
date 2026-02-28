# MABS Status Dashboard

Real-time visual dashboard for Multi-Agent Business System (MABS).

## Features

- 📊 Portfolio status (active businesses, awaiting Sean decisions)
- 👥 Agent status (6 agents: BIR, BPW, TA, BLD, MKT, QA)  
- 🚨 System alerts and blockers
- 📱 Mobile-friendly responsive design
- 🔄 Auto-refresh every 30 seconds

## Usage

**View online:** https://bokjohn.github.io/mabs-status-dashboard/

**Run locally:**
```bash
# Simple HTTP server (any port)
python3 -m http.server 8000

# Or with Node
node server.js
```

## Data Source

Dashboard reads from `dashboard-data.json` which is exported from the main MABS `STATUS-BOARD.md` file.

**To update dashboard data:**
```bash
cd /path/to/mabs/business-system/_SYSTEM/dashboard
node export-data.js
cp dashboard-data.json /path/to/this-repo/
git commit -am "Update dashboard data"
git push
```

GitHub Pages will automatically deploy the updated dashboard.

## Architecture

- `index.html` - Dashboard UI (simple HTML/CSS)
- `dashboard.js` - Data loading and rendering logic
- `dashboard-data.json` - Pre-exported STATUS-BOARD data
- No build step, no frameworks - just simple static files

Built for Sean to access MABS status from phone when away from computer.
