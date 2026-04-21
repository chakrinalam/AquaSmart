const mongoose = require('mongoose');
const Complaint = require('./models/Complaint');
require('dotenv').config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/water-crisis')
  .then(async () => {
    console.log('Connected to MongoDB');
    const complaints = await Complaint.find({});
    console.log('=== CURRENT COMPLAINTS IN DATABASE ===');
    complaints.forEach((c, i) => {
      console.log(`${i+1}. Area: ${c.areaName}, Severity: ${c.severityLevel}, Status: ${c.status}, Description: ${c.description}`);
    });
    console.log(`\nTotal complaints: ${complaints.length}`);
    
    // Group by area and severity
    const areaStats = {};
    complaints.forEach(c => {
      if (!areaStats[c.areaName]) {
        areaStats[c.areaName] = { Low: 0, Moderate: 0, High: 0, total: 0 };
      }
      areaStats[c.areaName][c.severityLevel]++;
      areaStats[c.areaName].total++;
    });
    
    console.log('\n=== AREA-WISE SEVERITY BREAKDOWN ===');
    Object.keys(areaStats).forEach(area => {
      const stats = areaStats[area];
      console.log(`${area}: Low=${stats.Low}, Moderate=${stats.Moderate}, High=${stats.High}, Total=${stats.total}`);
    });
    
    return mongoose.connection.close();
  })
  .then(() => {
    console.log('Disconnected from MongoDB');
  })
  .catch(err => {
    console.error('Error:', err);
  });
