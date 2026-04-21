const express = require('express');
const router = express.Router();
const RiskZone = require('../models/RiskZone');
const Complaint = require('../models/Complaint');

// Get all risk zones with detailed analytics based on real complaint data
router.get('/', async (req, res) => {
    try {
        // Get complaint statistics for each area from actual complaints
        const complaintStats = await Complaint.aggregate([
            {
                $group: {
                    _id: '$areaName',
                    count: { $sum: 1 },
                    highSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'High'] }, 1, 0] }
                    },
                    moderateSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'Moderate'] }, 1, 0] }
                    },
                    lowSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'Low'] }, 1, 0] }
                    },
                    pendingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    },
                    inProgressCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] }
                    },
                    resolvedCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] }
                    },
                    lastComplaint: { $max: '$createdAt' }
                }
            }
        ]);

        // Create dynamic risk zones based on actual complaint data
        const dynamicRiskZones = complaintStats.map(stat => {
            // Calculate risk level based on actual complaint data
            let riskLevel = 'Low';
            let waterSupplyStatus = 'Normal';
            
            // Risk calculation based on complaint count and severity
            const totalComplaints = stat.count;
            const highSeverityRatio = totalComplaints > 0 ? stat.highSeverity / totalComplaints : 0;
            const pendingRatio = totalComplaints > 0 ? stat.pendingCount / totalComplaints : 0;
            
            // Risk calculation based on user-selected severity levels
            if (stat.highSeverity >= 3) {
                riskLevel = 'Critical';
                waterSupplyStatus = 'No Supply';
            } else if (stat.highSeverity >= 1) {
                riskLevel = 'High';
                waterSupplyStatus = 'Critical';
            } else if (stat.moderateSeverity >= 1) {
                riskLevel = 'Moderate';
                waterSupplyStatus = 'Limited';
            } else {
                riskLevel = 'Low';
                waterSupplyStatus = 'Normal';
            }

            return {
                areaName: stat._id,
                complaintCount: stat.count,
                riskLevel: riskLevel,
                waterSupplyStatus: waterSupplyStatus,
                population: Math.floor(Math.random() * 50000) + 10000, // Estimated population
                coordinates: {
                    latitude: 13.0827 + (Math.random() - 0.5) * 0.1,
                    longitude: 80.2707 + (Math.random() - 0.5) * 0.1
                },
                complaintStats: {
                    count: stat.count,
                    highSeverity: stat.highSeverity,
                    moderateSeverity: stat.moderateSeverity,
                    lowSeverity: stat.lowSeverity,
                    pendingCount: stat.pendingCount,
                    inProgressCount: stat.inProgressCount,
                    resolvedCount: stat.resolvedCount
                },
                activeAlerts: stat.pendingCount > 0 ? Math.ceil(stat.pendingCount / 5) : 0,
                lastUpdated: stat.lastComplaint
            };
        });

        res.json(dynamicRiskZones);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get risk zone summary statistics based on real complaint data
router.get('/summary', async (req, res) => {
    try {
        // Get complaint statistics for each area from actual complaints
        const complaintStats = await Complaint.aggregate([
            {
                $group: {
                    _id: '$areaName',
                    count: { $sum: 1 },
                    highSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'High'] }, 1, 0] }
                    },
                    moderateSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'Moderate'] }, 1, 0] }
                    },
                    lowSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'Low'] }, 1, 0] }
                    },
                    pendingCount: {
                        $sum: { $cond: [{ $eq: ['$status', 'Pending'] }, 1, 0] }
                    }
                }
            }
        ]);

        // Calculate risk levels dynamically
        let criticalCount = 0;
        let highCount = 0;
        let moderateCount = 0;
        let lowCount = 0;
        let totalComplaints = 0;
        let totalPending = 0;

        complaintStats.forEach(stat => {
            const totalComplaintsForArea = stat.count;
            const highSeverityRatio = totalComplaintsForArea > 0 ? stat.highSeverity / totalComplaintsForArea : 0;
            
            totalComplaints += stat.count;
            totalPending += stat.pendingCount;
            
            // Use same corrected severity-based logic
            if (stat.highSeverity >= 3) {
                criticalCount++;
            } else if (stat.highSeverity >= 1) {
                highCount++;
            } else if (stat.moderateSeverity >= 1) {
                moderateCount++;
            } else {
                lowCount++;
            }
        });

        const summary = {
            totalZones: complaintStats.length,
            riskLevels: {
                critical: criticalCount,
                high: highCount,
                moderate: moderateCount,
                low: lowCount
            },
            waterSupplyStatus: {
                normal: lowCount,
                limited: moderateCount,
                critical: highCount,
                noSupply: criticalCount
            },
            totalPopulation: complaintStats.length * 30000, // Estimated average
            totalComplaints: totalComplaints,
            activeAlerts: Math.ceil(totalPending / 5)
        };

        res.json(summary);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get risk trends over time
router.get('/trends', async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const trends = await Complaint.aggregate([
            {
                $match: {
                    createdAt: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: {
                            format: "%Y-%m-%d",
                            date: "$createdAt"
                        }
                    },
                    count: { $sum: 1 },
                    highSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'High'] }, 1, 0] }
                    },
                    moderateSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'Moderate'] }, 1, 0] }
                    },
                    lowSeverity: {
                        $sum: { $cond: [{ $eq: ['$severityLevel', 'Low'] }, 1, 0] }
                    }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        res.json(trends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Get specific risk zone details
router.get('/:areaName', async (req, res) => {
    try {
        const riskZone = await RiskZone.findOne({ areaName: req.params.areaName });
        
        if (!riskZone) {
            return res.status(404).json({ message: 'Risk zone not found' });
        }

        // Get recent complaints for this area
        const recentComplaints = await Complaint.find({ 
            areaName: req.params.areaName 
        })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate('citizenId', 'name email');

        res.json({
            ...riskZone.toObject(),
            recentComplaints
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Create or update risk zone
router.post('/', async (req, res) => {
    try {
        const {
            areaName,
            coordinates,
            population,
            waterSupplyStatus,
            riskFactors
        } = req.body;

        const riskZone = await RiskZone.findOneAndUpdate(
            { areaName },
            {
                areaName,
                coordinates,
                population,
                waterSupplyStatus,
                riskFactors: {
                    ...riskFactors,
                    historicalComplaints: riskFactors?.historicalComplaints || 0
                }
            },
            { upsert: true, new: true }
        );

        res.json(riskZone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add alert to risk zone
router.post('/:areaName/alerts', async (req, res) => {
    try {
        const { type, severity, message } = req.body;

        const riskZone = await RiskZone.findOne({ areaName: req.params.areaName });
        
        if (!riskZone) {
            return res.status(404).json({ message: 'Risk zone not found' });
        }

        riskZone.alerts.push({
            type,
            severity,
            message,
            timestamp: new Date()
        });

        await riskZone.save();
        res.json(riskZone);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Resolve alert
router.put('/:areaName/alerts/:alertId/resolve', async (req, res) => {
    try {
        const riskZone = await RiskZone.findOne({ areaName: req.params.areaName });
        
        if (!riskZone) {
            return res.status(404).json({ message: 'Risk zone not found' });
        }

        const alert = riskZone.alerts.id(req.params.alertId);
        if (!alert) {
            return res.status(404).json({ message: 'Alert not found' });
        }

        alert.resolved = true;
        await riskZone.save();
        
        res.json({ message: 'Alert resolved successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
