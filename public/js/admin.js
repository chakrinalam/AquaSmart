document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Admin') {
        window.location.href = 'index.html';
        return;
    }

    const socket = io();
    let statusChartInstance = null;
    let usersChartInstance = null;
    
    const loadAdminDashboard = async () => {
        try {
            const stats = await apiCall('/stats');
            
            // 1. Update Grid
            const grid = document.getElementById('adminStatsGrid');
            grid.innerHTML = `
                <div class="stat-card">
                    <h3>Total Complaints</h3>
                    <p>${stats.complaints.total}</p>
                </div>
                <div class="stat-card" style="border-top: 4px solid var(--primary);">
                    <h3>Resolved Cases</h3>
                    <p>${stats.complaints.resolved}</p>
                </div>
                <div class="stat-card" style="border-top: 4px solid var(--accent);">
                    <h3>Total Users</h3>
                    <p>${stats.users.total}</p>
                </div>
                <div class="stat-card" style="border-top: 4px solid var(--secondary);">
                    <h3>NGOs Active</h3>
                    <p>${stats.users.ngos}</p>
                </div>
            `;

            // 2. Charts
            updateCharts(stats);

        } catch (err) {
            console.error(err);
        }
    };

    const updateCharts = (stats) => {
        // Status Chart
        const ctxStatus = document.getElementById('statusChart').getContext('2d');
        if (statusChartInstance) statusChartInstance.destroy();
        
        statusChartInstance = new Chart(ctxStatus, {
            type: 'doughnut',
            data: {
                labels: ['Pending', 'Assigned', 'In Progress', 'Resolved'],
                datasets: [{
                    data: [stats.complaints.pending, stats.complaints.assigned, stats.complaints.inProgress, stats.complaints.resolved],
                    backgroundColor: ['#ff4d4d', '#ffa500', '#00f2fe', '#00ff00'],
                    borderWidth: 0
                }]
            },
            options: {
                plugins: { legend: { labels: { color: '#fff' } } }
            }
        });

        // Users Chart
        const ctxUsers = document.getElementById('usersChart').getContext('2d');
        if (usersChartInstance) usersChartInstance.destroy();
        
        usersChartInstance = new Chart(ctxUsers, {
            type: 'bar',
            data: {
                labels: ['Total', 'Citizens', 'NGOs'],
                datasets: [{
                    label: 'User Base',
                    data: [stats.users.total, stats.users.citizens, stats.users.ngos],
                    backgroundColor: ['#4facfe', '#00f2fe', '#ff007f']
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { 
                    y: { ticks: { color: '#fff' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                    x: { ticks: { color: '#fff' }, grid: { display: false } }
                }
            }
        });
    };

    // Load initial data
    await loadAdminDashboard();

    // Real-time Updates
    socket.on('new_complaint', () => { loadAdminDashboard(); showToast('New Complaint Reported'); });
    socket.on('status_update', () => { loadAdminDashboard(); });
});
