const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/authMiddleware');

// @route GET /api/stats
// @desc Get system analytics
// @access Private (Authority, Admin)
router.get('/', protect, authorize('Authority', 'Admin'), async (req, res) => {
    try {
        const totalComplaints = await Complaint.countDocuments();
        
        // Count complaints by status
        const resolved = await Complaint.countDocuments({ status: 'Resolved' });
        const pending = await Complaint.countDocuments({ status: 'Pending' });
        const assigned = await Complaint.countDocuments({ status: 'Assigned' });
        const inProgress = await Complaint.countDocuments({ status: 'In Progress' });
        
        // User counts
        const totalUsers = await User.countDocuments();
        const ngoCount = await User.countDocuments({ role: 'NGO' });
        const citizenCount = await User.countDocuments({ role: 'Citizen' });

        // Aggregate by Area to calculate risk zones
        const complaintsByArea = await Complaint.aggregate([
            { $group: { _id: "$areaName", count: { $sum: 1 } } }
        ]);
        
        res.json({
            complaints: {
                total: totalComplaints,
                resolved,
                pending,
                assigned,
                inProgress
            },
            users: {
                total: totalUsers,
                ngos: ngoCount,
                citizens: citizenCount
            },
            areas: complaintsByArea
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
