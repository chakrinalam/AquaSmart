const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['Citizen', 'Authority', 'NGO', 'Admin'],
        required: true
    },
    resetPasswordToken: {
        type: String,
        default: null
    },
    resetPasswordExpires: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Hash password before saving
UserSchema.pre('save', async function() {
    console.log('Pre-save hook called');
    console.log('Password modified:', this.isModified('password'));
    
    if (!this.isModified('password')) {
        console.log('Password not modified, skipping hash');
        return;
    }
    
    console.log('Password modified, hashing...');
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        console.log('Password hashed successfully');
    } catch (error) {
        console.log('Error hashing password:', error);
        throw error;
    }
});

// Match user password
UserSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
