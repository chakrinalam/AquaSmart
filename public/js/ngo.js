document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'NGO') {
        window.location.href = 'index.html';
        return;
    }

    const socket = io();
    
    const loadTasks = async () => {
        try {
            const complaints = await apiCall('/complaints');
            
            // Filter logic: show high risk or ones assigned to this NGO, etc.
            // For Demo, show 'Assigned', 'In Progress', or 'High' severity that aren't resolved.
            const relevantTasks = complaints.filter(c => c.status !== 'Resolved' && (c.severityLevel === 'High' || c.status === 'Assigned' || c.status === 'In Progress'));

            const tbody = document.getElementById('ngoTasks');
            tbody.innerHTML = '';
            
            relevantTasks.forEach(c => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${new Date(c.createdAt).toLocaleDateString()}</td>
                    <td>${c.areaName}</td>
                    <td>
                        <span class="badge badge-${c.severityLevel === 'High' ? 'red' : c.severityLevel === 'Moderate' ? 'orange' : 'green'}">
                            ${c.severityLevel}
                        </span>
                    </td>
                    <td><strong>${c.status}</strong></td>
                    <td>
                        <button class="btn btn-secondary" style="padding: 5px 10px; font-size: 0.9rem;" onclick="markProgress('${c._id}')">Start Task</button>
                        <button class="btn" style="padding: 5px 10px; font-size: 0.9rem; margin-top:5px; background: #00ff00; color: #000;" onclick="markResolved('${c._id}')">Resolve</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
        }
    };

    window.markProgress = async (id) => {
        try {
            await apiCall(`/complaints/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'In Progress' })
            });
            showToast('Task marked as In Progress');
        } catch (err) {}
    };

    window.markResolved = async (id) => {
        try {
            await apiCall(`/complaints/${id}/status`, {
                method: 'PUT',
                body: JSON.stringify({ status: 'Resolved' })
            });
            showToast('Water crisis resolved successfully!');
        } catch (err) {}
    };

    // Load initial data
    await loadTasks();

    // Real-time Updates
    socket.on('new_complaint', () => loadTasks());
    socket.on('status_update', () => loadTasks());
});
