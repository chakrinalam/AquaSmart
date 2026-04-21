const mongoose = require('mongoose');

const RiskZoneSchema = new mongoose.Schema({
    areaName: {
        type: String,
        required: true,
        unique: true
    },
    coordinates: {
        latitude: {
            type: Number,
            required: true
        },
        longitude: {
            type: Number,
            required: true
        }
    },
    population: {
        type: Number,
        required: true,
        default: 0
    },
    waterSupplyStatus: {
        type: String,
        enum: ['Normal', 'Limited', 'Critical', 'No Supply'],
        default: 'Normal'
    },
    riskLevel: {
        type: String,
        enum: ['Low', 'Moderate', 'High', 'Critical'],
        default: 'Low'
    },
    complaintCount: {
        type: Number,
        default: 0
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    },
    riskFactors: {
        droughtIndex: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },
        infrastructureAge: {
            type: Number,
            default: 0 // years
        },
        populationDensity: {
            type: Number,
            default: 0 // people per km²
        },
        historicalComplaints: {
            type: Number,
            default: 0
        }
    },
    alerts: [{
        type: {
            type: String,
            enum: ['Supply Disruption', 'Quality Issue', 'Pressure Drop', 'Contamination Risk'],
            required: true
        },
        severity: {
            type: String,
            enum: ['Low', 'Medium', 'High', 'Critical'],
            required: true
        },
        message: {
            type: String,
            required: true
        },
        timestamp: {
            type: Date,
            default: Date.now
        },
        resolved: {
            type: Boolean,
            default: false
        }
    }]
}, { timestamps: true });

// Method to calculate risk level based on various factors
RiskZoneSchema.methods.calculateRiskLevel = function() {
    let riskScore = 0;
    
    // Complaint count factor (40% weight)
    if (this.complaintCount > 100) riskScore += 40;
    else if (this.complaintCount > 50) riskScore += 25;
    else if (this.complaintCount > 20) riskScore += 10;
    
    // Water supply status factor (30% weight)
    if (this.waterSupplyStatus === 'No Supply') riskScore += 30;
    else if (this.waterSupplyStatus === 'Critical') riskScore += 25;
    else if (this.waterSupplyStatus === 'Limited') riskScore += 15;
    
    // Drought index factor (20% weight)
    riskScore += (this.riskFactors.droughtIndex / 100) * 20;
    
    // Infrastructure age factor (10% weight)
    if (this.riskFactors.infrastructureAge > 30) riskScore += 10;
    else if (this.riskFactors.infrastructureAge > 20) riskScore += 7;
    else if (this.riskFactors.infrastructureAge > 10) riskScore += 3;
    
    // Determine risk level based on score
    if (riskScore >= 75) this.riskLevel = 'Critical';
    else if (riskScore >= 50) this.riskLevel = 'High';
    else if (riskScore >= 25) this.riskLevel = 'Moderate';
    else this.riskLevel = 'Low';
    
    return this.riskLevel;
};

// Pre-save middleware to update risk level
RiskZoneSchema.pre('save', function(next) {
    this.calculateRiskLevel();
    this.lastUpdated = new Date();
    next();
});

module.exports = mongoose.model('RiskZone', RiskZoneSchema);
