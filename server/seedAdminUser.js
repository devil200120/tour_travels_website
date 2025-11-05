import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminUser from './models/AdminUser.js';

dotenv.config();

const createAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_travels_admin');
    console.log('Connected to MongoDB');

    // Check if admin user already exists
    const existingAdmin = await AdminUser.findOne({ email: 'admin@tourtravels.com' });
    
    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@tourtravels.com');
      console.log('Password: admin123');
      process.exit(0);
    }

    // Create admin user
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
    console.log('Admin user created successfully!');
    console.log('Email: admin@tourtravels.com');
    console.log('Password: admin123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
};

createAdminUser();