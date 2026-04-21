const mongoose = require('mongoose');
const RiskZone = require('./models/RiskZone');
require('dotenv').config();

const seedRiskZones = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/water-crisis');
        console.log('Connected to MongoDB');

        // Sample risk zone data
        const riskZones = [
            {
                areaName: 'Downtown',
                coordinates: { latitude: 13.0827, longitude: 80.2707 },
                population: 50000,
                waterSupplyStatus: 'Limited',
                complaintCount: 85,
                riskFactors: {
                    droughtIndex: 65,
                    infrastructureAge: 25,
                    populationDensity: 3500,
                    historicalComplaints: 120
                },
                alerts: [
                    {
                        type: 'Supply Disruption',
                        severity: 'Medium',
                        message: 'Reduced water pressure in downtown area due to maintenance work',
                        resolved: false
                    }
                ]
            },
            {
                areaName: 'Suburbs North',
                coordinates: { latitude: 13.1227, longitude: 80.2907 },
                population: 35000,
                waterSupplyStatus: 'Normal',
                complaintCount: 25,
                riskFactors: {
                    droughtIndex: 35,
                    infrastructureAge: 15,
                    populationDensity: 1800,
                    historicalComplaints: 45
                },
                alerts: []
            },
            {
                areaName: 'Industrial Zone',
                coordinates: { latitude: 13.0527, longitude: 80.2507 },
                population: 25000,
                waterSupplyStatus: 'Critical',
                complaintCount: 156,
                riskFactors: {
                    droughtIndex: 85,
                    infrastructureAge: 35,
                    populationDensity: 2200,
                    historicalComplaints: 200
                },
                alerts: [
                    {
                        type: 'Quality Issue',
                        severity: 'High',
                        message: 'Water contamination detected in industrial zone',
                        resolved: false
                    },
                    {
                        type: 'Pressure Drop',
                        severity: 'Medium',
                        message: 'Low water pressure reported in multiple locations',
                        resolved: false
                    }
                ]
            },
            {
                areaName: 'Residential East',
                coordinates: { latitude: 13.0927, longitude: 80.3107 },
                population: 42000,
                waterSupplyStatus: 'Limited',
                complaintCount: 67,
                riskFactors: {
                    droughtIndex: 55,
                    infrastructureAge: 20,
                    populationDensity: 2800,
                    historicalComplaints: 95
                },
                alerts: [
                    {
                        type: 'Supply Disruption',
                        severity: 'Low',
                        message: 'Scheduled maintenance affecting water supply',
                        resolved: false
                    }
                ]
            },
            {
                areaName: 'Commercial District',
                coordinates: { latitude: 13.0727, longitude: 80.2807 },
                population: 18000,
                waterSupplyStatus: 'Normal',
                complaintCount: 12,
                riskFactors: {
                    droughtIndex: 25,
                    infrastructureAge: 10,
                    populationDensity: 1500,
                    historicalComplaints: 30
                },
                alerts: []
            },
            {
                areaName: 'Riverside Area',
                coordinates: { latitude: 13.1027, longitude: 80.2607 },
                population: 28000,
                waterSupplyStatus: 'No Supply',
                complaintCount: 198,
                riskFactors: {
                    droughtIndex: 95,
                    infrastructureAge: 40,
                    populationDensity: 2400,
                    historicalComplaints: 250
                },
                alerts: [
                    {
                        type: 'Contamination Risk',
                        severity: 'Critical',
                        message: 'Severe water contamination detected - supply suspended',
                        resolved: false
                    },
                    {
                        type: 'Supply Disruption',
                        severity: 'Critical',
                        message: 'Complete water supply failure in riverside area',
                        resolved: false
                    }
                ]
            }
        ];

        // Clear existing risk zones
        await RiskZone.deleteMany({});
        console.log('Cleared existing risk zones');

        // Insert new risk zones
        const insertedZones = await RiskZone.insertMany(riskZones);
        console.log(`Inserted ${insertedZones.length} risk zones`);

        // Display risk levels
        insertedZones.forEach(zone => {
            console.log(`${zone.areaName}: ${zone.riskLevel} risk (${zone.complaintCount} complaints)`);
        });

        console.log('Risk zones seeded successfully!');
    } catch (error) {
        console.error('Error seeding risk zones:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Disconnected from MongoDB');
    }
};

seedRiskZones();
