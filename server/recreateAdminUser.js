import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminUser from './models/AdminUser.js';

dotenv.config();

const recreateAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_travels_admin');
    console.log('Connected to MongoDB');

    // Delete existing admin user
    await AdminUser.deleteOne({ email: 'admin@tourtravels.com' });
    console.log('Deleted existing admin user');

    // Create new admin user (this will trigger the pre-save hook)
    const adminUser = new AdminUser({
      name: 'Super Admin',
      email: 'admin@tourtravels.com',
      password: 'admin123',
      role: 'Super Admin',
      phone: '+1234567890',
      isActive: true,
      permissions: [
        {
          module: 'dashboard',
          actions: ['read']
        },
        {
          module: 'bookings',
          actions: ['create', 'read', 'update', 'delete', 'approve']
        },
        {
          module: 'drivers',
          actions: ['create', 'read', 'update', 'delete', 'approve']
        },
        {
          module: 'vehicles',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'customers',
          actions: ['read', 'update']
        },
        {
          module: 'packages',
          actions: ['create', 'read', 'update', 'delete']
        },
        {
          module: 'payments',
          actions: ['read', 'update', 'approve']
        },
        {
          module: 'reports',
          actions: ['read']
        },
        {
          module: 'settings',
          actions: ['read', 'update']
        }
      ]
    });

    await adminUser.save();
    console.log('New admin user created successfully!');
    
    // Test the password
    const testUser = await AdminUser.findOne({ email: 'admin@tourtravels.com' });
    const isMatch = await testUser.comparePassword('admin123');
    console.log('Password test result:', isMatch);
    console.log('Password hash:', testUser.password);
    
    if (isMatch) {
      console.log('SUCCESS: Admin user is working correctly!');
      console.log('Credentials:');
      console.log('Email: admin@tourtravels.com');
      console.log('Password: admin123');
    } else {
      console.log('ERROR: Password comparison failed');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error recreating admin user:', error);
    process.exit(1);
  }
};

recreateAdminUser();