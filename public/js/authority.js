document.addEventListener('DOMContentLoaded', async () => {
    // Auth Check
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user || user.role !== 'Authority') {
        window.location.href = 'index.html';
        return;
    }

    const socket = io();
    let currentRiskData = [];
    
    const loadDashboard = async () => {
        try {
            const [complaints, stats, riskZones, riskSummary, riskTrends] = await Promise.all([
                apiCall('/complaints'),
                apiCall('/stats'),
                apiCall('/risk-zones'),
                apiCall('/risk-zones/summary'),
                apiCall('/risk-zones/trends?days=7')
            ]);
            
            // Store risk data for filtering
            currentRiskData = riskZones;
            
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

            // Render Enhanced Risk Summary
            renderRiskSummary(riskSummary);
            
            // Render Risk Zones with enhanced data
            console.log('Risk zones data received:', riskZones);
            renderRiskZones(riskZones);
            
            // Render Enhanced Risk Map
            renderRiskMap(riskZones);
            
            // Render Risk Trends with real data
            renderRiskTrends(riskTrends);

        } catch (err) {
            console.error(err);
        }
    };

    const renderRiskSummary = (summary) => {
        document.getElementById('highRiskCount').textContent = summary.riskLevels.high + summary.riskLevels.critical;
        document.getElementById('moderateRiskCount').textContent = summary.riskLevels.moderate;
        document.getElementById('lowRiskCount').textContent = summary.riskLevels.low;
        document.getElementById('totalComplaintsCount').textContent = summary.totalComplaints;
    };

    const renderRiskZones = (areas, filter = 'all') => {
        const riskGrid = document.getElementById('riskGrid');
        riskGrid.innerHTML = '';
        
        let filteredAreas = areas;
        if (filter !== 'all') {
            filteredAreas = areas.filter(area => {
                if (filter === 'high') return area.riskLevel === 'High' || area.riskLevel === 'Critical';
                if (filter === 'moderate') return area.riskLevel === 'Moderate';
                if (filter === 'low') return area.riskLevel === 'Low';
                return true;
            });
        }
        
        filteredAreas.forEach(area => {
            let badgeClass = 'green';
            let riskText = 'Low Risk';
            let riskLevel = 'low-risk';
            
            if (area.riskLevel === 'Critical') {
                badgeClass = 'red';
                riskText = 'Critical Risk';
                riskLevel = 'high-risk';
            } else if (area.riskLevel === 'High') {
                badgeClass = 'red';
                riskText = 'High Risk';
                riskLevel = 'high-risk';
            } else if (area.riskLevel === 'Moderate') {
                badgeClass = 'orange';
                riskText = 'Moderate Risk';
                riskLevel = 'moderate-risk';
            }

            const statCard = document.createElement('div');
            statCard.className = `stat-card ${riskLevel}`;
            statCard.innerHTML = `
                <h3>${area.areaName}</h3>
                <p>${area.complaintCount} Complaints</p>
                <p style="font-size: 0.8rem; color: var(--text-muted);">Population: ${area.population.toLocaleString()}</p>
                <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px;">
                    <span class="badge badge-${badgeClass}">${riskText}</span>
                    <button onclick="viewAreaDetails('${area.areaName}')" class="btn" style="padding: 5px 10px; font-size: 0.8rem;">View Details</button>
                </div>
                ${area.activeAlerts > 0 ? `<div style="margin-top: 10px;"><span style="color: var(--accent); font-size: 0.8rem;">${area.activeAlerts} Active Alerts</span></div>` : ''}
            `;
            statCard.onclick = () => viewAreaDetails(area.areaName);
            riskGrid.appendChild(statCard);
        });
    };

    const renderRiskMap = (areas) => {
        const riskMap = document.getElementById('riskMap');
        riskMap.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h4 style="color: var(--text-main); margin-bottom: 20px;">Interactive Risk Zone Map</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; max-width: 600px; margin: 0 auto;">
                    ${areas.map(area => {
                        let bgColor = '#28a745'; // green for low
                        if (area.riskLevel === 'Critical' || area.riskLevel === 'High') bgColor = 'var(--accent)'; // red for high/critical
                        else if (area.riskLevel === 'Moderate') bgColor = 'var(--primary)'; // orange for moderate
                        
                        return `
                            <div style="background: ${bgColor}; color: white; padding: 15px; border-radius: 10px; cursor: pointer; transition: transform 0.3s ease; position: relative;" 
                                 onmouseover="this.style.transform='scale(1.05)'" 
                                 onmouseout="this.style.transform='scale(1)'"
                                 onclick="viewAreaDetails('${area.areaName}')">
                                ${area.activeAlerts > 0 ? `<div style="position: absolute; top: -5px; right: -5px; background: var(--accent); color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: bold;">${area.activeAlerts}</div>` : ''}
                                <div style="font-weight: bold; margin-bottom: 5px;">${area.areaName}</div>
                                <div style="font-size: 0.9rem;">${area.complaintCount} complaints</div>
                                <div style="font-size: 0.8rem; opacity: 0.9;">${area.waterSupplyStatus}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top: 20px; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 15px; height: 15px; background: var(--accent); border-radius: 3px;"></div>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Critical/High Risk</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 15px; height: 15px; background: var(--primary); border-radius: 3px;"></div>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Moderate Risk</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 15px; height: 15px; background: #28a745; border-radius: 3px;"></div>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Low Risk</span>
                    </div>
                </div>
                <p style="margin-top: 15px; color: var(--text-muted); font-size: 0.9rem;">
                    Click on any area to view detailed information
                </p>
            </div>
        `;
    };

    const renderRiskTrends = (trendsData) => {
        const trendsChart = document.getElementById('riskTrendsChart');
        
        if (!trendsData || trendsData.length === 0) {
            trendsChart.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h4 style="color: var(--text-main); margin-bottom: 20px;">7-Day Risk Trend Analysis</h4>
                    <p style="color: var(--text-muted);">No trend data available for the selected period</p>
                </div>
            `;
            return;
        }

        const maxCount = Math.max(...trendsData.map(t => t.count));
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        
        // Create a map for all days with default 0 values
        const dayMap = {};
        days.forEach(day => dayMap[day] = { count: 0, highSeverity: 0, moderateSeverity: 0, lowSeverity: 0 });
        
        // Fill in actual data
        trendsData.forEach(trend => {
            const date = new Date(trend._id);
            const dayName = days[date.getDay()];
            if (dayMap[dayName]) {
                dayMap[dayName] = trend;
            }
        });

        trendsChart.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h4 style="color: var(--text-main); margin-bottom: 20px;">7-Day Risk Trend Analysis</h4>
                <div style="display: flex; justify-content: space-around; align-items: flex-end; height: 150px; max-width: 600px; margin: 0 auto;">
                    ${days.map(day => {
                        const data = dayMap[day];
                        const height = maxCount > 0 ? (data.count / maxCount) * 120 : 0;
                        const bgColor = data.highSeverity > 0 ? 'var(--accent)' : 
                                       data.moderateSeverity > 0 ? 'var(--primary)' : 
                                       data.count > 0 ? 'var(--secondary)' : '#28a745';
                        
                        return `
                            <div style="text-align: center;">
                                <div style="background: ${bgColor}; width: 40px; height: ${height}px; margin: 0 auto 5px; border-radius: 5px; transition: height 0.3s ease;" 
                                     title="${day}: ${data.count} complaints (High: ${data.highSeverity}, Moderate: ${data.moderateSeverity}, Low: ${data.lowSeverity})"></div>
                                <small style="color: var(--text-muted);">${day}</small>
                                <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 2px;">${data.count}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                <div style="margin-top: 20px; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap;">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 15px; height: 15px; background: var(--accent); border-radius: 3px;"></div>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">High Severity</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 15px; height: 15px; background: var(--primary); border-radius: 3px;"></div>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Moderate Severity</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 15px; height: 15px; background: var(--secondary); border-radius: 3px;"></div>
                        <span style="color: var(--text-muted); font-size: 0.8rem;">Low Severity</span>
                    </div>
                </div>
                <p style="margin-top: 15px; color: var(--text-muted); font-size: 0.9rem;">
                    Total complaints: ${trendsData.reduce((sum, t) => sum + t.count, 0)} over the past 7 days
                </p>
            </div>
        `;
    };

    // Make global functions
    window.filterRiskZones = () => {
        const filter = document.getElementById('riskFilter').value;
        renderRiskZones(currentRiskData, filter);
    };

    window.refreshRiskData = async () => {
        showToast('Refreshing risk data...');
        await loadDashboard();
        showToast('Risk data updated successfully!');
    };

    window.viewAreaDetails = (areaName) => {
        const area = currentRiskData.find(a => a._id === areaName);
        if (area) {
            showToast(`Area: ${areaName} - ${area.count} complaints. Click on complaint table below for details.`);
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
