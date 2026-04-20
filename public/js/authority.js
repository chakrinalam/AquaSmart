document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Authority') {
        window.location.href = 'index.html';
        return;
    }

    const socket = io();
    
    const loadDashboard = async () => {
        try {
            const [complaints, stats] = await Promise.all([
                apiCall('/complaints'),
                apiCall('/stats')
            ]);
            
            // Render Complaints
            const tbody = document.getElementById('allComplaints');
            tbody.innerHTML = '';
            
            complaints.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${c.areaName}</td>
                    <td>${c.citizenId?.name || 'Unknown'}</td>
                    <td><div style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="${c.description}">${c.description}</div></td>
                    <td>
                        <span class="badge badge-${c.severityLevel === 'High' ? 'red' : c.severityLevel === 'Moderate' ? 'orange' : 'green'}">
                            ${c.severityLevel}
                        </span>
                    </td>
                    <td><strong>${c.status}</strong></td>
                    <td>
                        <select onchange="updateStatus('${c._id}', this.value)" style="padding:5px; border-radius:5px; max-width: 150px;">
                            <option value="">Update...</option>
                            <option value="Assigned">Assign NGO/Tanker</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Resolved">Resolved</option>
                        </select>
                    </td>
                `;
                tbody.appendChild(tr);
            });

            // Render Risk Zones
            const riskGrid = document.getElementById('riskGrid');
            riskGrid.innerHTML = '';
            
            stats.areas.forEach(area => {
                let badgeClass = 'green';
                let riskText = 'Low Risk';
                
                if (area.count > 100) {
                    badgeClass = 'red';
                    riskText = 'High Risk';
                } else if (area.count >= 50) {
                    badgeClass = 'orange';
                    riskText = 'Moderate Risk';
                }

                riskGrid.innerHTML += `
                    <div class="stat-card" style="border-top: 4px solid var(--${badgeClass === 'red' ? 'accent' : badgeClass === 'orange' ? 'primary' : 'secondary'})">
                        <h3>${area._id}</h3>
                        <p>${area.count} Complaints</p>
                        <span class="badge badge-${badgeClass}" style="margin-top:10px;">${riskText}</span>
                    </div>
                `;
            });

        } catch (err) {
            console.error(err);
        }
    };

    // Make global for inline select handle
    window.updateStatus = async (id, status) => {
        if (!status) return;
        try {
            await apiCall(`/complaints/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status })
            });
            showToast('Complaint status updated.');
        } catch (error) {
            // Toast automatically handled
        }
    };

    // Load initial data
    await loadDashboard();

    // Real-time Updates
    socket.on('new_complaint', () => loadDashboard());
    socket.on('status_update', () => loadDashboard());
});
