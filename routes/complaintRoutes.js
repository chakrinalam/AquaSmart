const express = require('express');
const router = express.Router();
const Complaint = require('../models/Complaint');
const { protect, authorize } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @route POST /api/complaints
// @desc Create a complaint
// @access Private (Citizen)
router.post('/', protect, authorize('Citizen'), async (req, res) => {
    try {
        const { areaName, severityLevel, description } = req.body;
        const complaint = await Complaint.create({
            citizenId: req.user._id,
            areaName,
            severityLevel,
            description
        });
        
        // Emit Socket Event
        req.io.emit('new_complaint', complaint);
        
        res.status(201).json(complaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route GET /api/complaints
// @desc Get complaints (Citizen sees own, Authority/Admin sees all, NGO sees assigned or high risk)
// @access Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        
        if (req.user.role === 'Citizen') {
            query.citizenId = req.user._id;
        } else if (req.user.role === 'NGO') {
            // NGOs might see everything to accept or just their assignments, for demo let's show all
            query = {}; 
        } // Authority and Admin see all
        
        const complaints = await Complaint.find(query).populate('citizenId', 'name email').populate('assignedTo', 'name').sort({ createdAt: -1 });
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// @route PUT /api/complaints/:id/status
// @desc Update complaint status/assignment
// @access Private (Authority, NGO)
router.put('/:id/status', protect, authorize('Authority', 'NGO'), async (req, res) => {
    try {
        const { status, assignedTo } = req.body;
        const complaint = await Complaint.findById(req.params.id);
        
        if (!complaint) {
            return res.status(404).json({ message: 'Complaint not found' });
        }
        
        if (status) complaint.status = status;
        if (assignedTo) complaint.assignedTo = assignedTo;
        
        await complaint.save();
        
        const updatedComplaint = await Complaint.findById(req.params.id).populate('citizenId', 'name email').populate('assignedTo', 'name');
        
        // Emit Socket Event
        req.io.emit('status_update', updatedComplaint);
        
        res.json(updatedComplaint);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
