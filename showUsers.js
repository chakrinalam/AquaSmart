const mongoose = require('mongoose');

// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/water-crisis').then(async () => {
    console.log('Connected to MongoDB');
    
    try {
        // Get the User model
        const User = require('./models/User');
        
        // Find all users
        const users = await User.find({});
        
        console.log('\n=== USER CREDENTIALS ===');
        console.log('Total users found:', users.length);
        console.log('========================\n');
        
        users.forEach((user, index) => {
            console.log(`User ${index + 1}:`);
            console.log('  ID:', user._id);
            console.log('  Name:', user.name);
            console.log('  Email:', user.email);
            console.log('  Password (hashed):', user.password);
            console.log('  Role:', user.role);
            console.log('  Created:', user.createdAt);
            console.log('  Updated:', user.updatedAt);
            console.log('-------------------');
        });
        
    } catch (error) {
        console.error('Error fetching users:', error);
    } finally {
        mongoose.connection.close();
        process.exit(0);
    }
}).catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
});
