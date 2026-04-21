const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/water-crisis')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Test potheri area specifically
    const potheriComplaints = await Complaint.find({ areaName: 'potheri' });
    console.log('=== POTHERI COMPLAINTS ===');
    potheriComplaints.forEach((c, i) => {
      console.log(`${i+1}. Area: ${c.areaName}, Severity: ${c.severityLevel}, Status: ${c.status}`);
    });
    
    // Get aggregated stats for potheri
    const potheriStats = await Complaint.aggregate([
        {
            $match: { areaName: 'potheri' }
        },
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
                }
            }
        }
    ]);

    console.log('\n=== POTHERI AGGREGATED STATS ===');
    potheriStats.forEach(stat => {
        console.log(`Area: ${stat._id}`);
        console.log(`  Total: ${stat.count}, High: ${stat.highSeverity}, Moderate: ${stat.moderateSeverity}, Low: ${stat.lowSeverity}`);
        
        // Test the exact logic from API
        const totalComplaints = stat.count;
        let riskLevel = 'Low';
        let waterSupplyStatus = 'Normal';
        
        if (stat.highSeverity >= 3) {
            riskLevel = 'Critical';
            waterSupplyStatus = 'No Supply';
        } else if (stat.highSeverity >= 2) {
            riskLevel = 'High';
            waterSupplyStatus = 'Critical';
        } else if (stat.highSeverity >= 1 || stat.moderateSeverity >= 1) {
            riskLevel = 'Moderate';
            waterSupplyStatus = 'Limited';
        } else {
            riskLevel = 'Low';
            waterSupplyStatus = 'Normal';
        }
        
        console.log(`  API Logic Result: Risk=${riskLevel}, Supply=${waterSupplyStatus}`);
    });
    
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('Error:', err);
  });
