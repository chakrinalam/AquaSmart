// Use built-in fetch in Node.js

async function testRiskAPI() {
    try {
        console.log('Testing risk zones API...');
        
        const response = await fetch('http://localhost:5000/api/risk-zones');
        const data = await response.json();
        
        console.log('=== API RESPONSE ===');
        data.forEach(zone => {
            console.log(`Area: ${zone.areaName}`);
            console.log(`  Complaints: ${zone.complaintCount}`);
            console.log(`  Risk Level: ${zone.riskLevel}`);
            console.log(`  Water Supply: ${zone.waterSupplyStatus}`);
            console.log('');
        });
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testRiskAPI();
