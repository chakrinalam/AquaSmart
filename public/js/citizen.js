document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Citizen') {
        window.location.href = 'index.html';
        return;
    }

    const socket = io();
    
    const loadComplaints = async () => {
        try {
            const complaints = await apiCall('/complaints');
            const tbody = document.getElementById('complaintList');
            tbody.innerHTML = '';
            
            complaints.forEach(c => {
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
                `;
                tbody.appendChild(tr);
            });
        } catch (err) {
            console.error(err);
        }
    };

    // Load initial data
    await loadComplaints();

    // Form Submission
    document.getElementById('complaintForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        try {
            await apiCall('/complaints', {
                method: 'POST',
                body: JSON.stringify({
                    areaName: document.getElementById('areaName').value,
                    severityLevel: document.getElementById('severityLevel').value,
                    description: document.getElementById('description').value
                })
            });
            
            showToast('Complaint submitted successfully!');
            document.getElementById('complaintForm').reset();
            // Optional: re-load locally or depend on socket
        } catch (err) {
            // Error managed
        }
    });

    // Real-time Updates
    socket.on('new_complaint', (data) => {
        if(data.citizenId === user._id) {
            loadComplaints();
        }
    });

    socket.on('status_update', (data) => {
        if(data.citizenId._id === user._id || data.citizenId === user._id) {
            loadComplaints();
            showToast(`Status updated for ${data.areaName}: ${data.status}`, 'success');
        }
    });
});
