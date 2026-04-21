const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/water-crisis')
  .then(async () => {
    console.log('Connected to MongoDB');
    const complaints = await Complaint.find({});
    
    // Group by area and severity like the API does
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

    console.log('=== AGGREGATED COMPLAINT STATS ===');
    complaintStats.forEach(stat => {
        console.log(`Area: ${stat._id}`);
        console.log(`  Total: ${stat.count}, High: ${stat.highSeverity}, Moderate: ${stat.moderateSeverity}, Low: ${stat.lowSeverity}, Pending: ${stat.pendingCount}`);
        
        // Test the risk calculation logic
        const totalComplaints = stat.count;
        let riskLevel = 'Low';
        let waterSupplyStatus = 'Normal';
        
        // Current logic from API
        if (stat.highSeverity >= 3) {
            riskLevel = 'Critical';
            waterSupplyStatus = 'No Supply';
        } else if (stat.highSeverity >= 2) {
            riskLevel = 'High';
            waterSupplyStatus = 'Critical';
        } else if (stat.highSeverity >= 1) {
            riskLevel = 'Moderate';
            waterSupplyStatus = 'Limited';
        } else {
            riskLevel = 'Low';
            waterSupplyStatus = 'Normal';
        }
        
        console.log(`  Calculated Risk: ${riskLevel}, Supply Status: ${waterSupplyStatus}`);
        console.log('');
    });
    
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('Error:', err);
  });
