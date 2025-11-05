import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminUser from './models/AdminUser.js';

dotenv.config();

const seedAdminData = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_travels_admin');
    console.log('Connected to MongoDB');

    // Clear existing admin users
    await AdminUser.deleteMany({});

    // Create admin users
    const adminUsers = [
      {
        name: 'Super Admin',
        email: 'admin@tourtravels.com',
        password: 'admin123',
        role: 'Super Admin',
        phone: '+91-9876543210',
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
            module: 'customers',
            actions: ['create', 'read', 'update', 'delete']
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
      },
      {
        name: 'Operations Manager',
        email: 'operations@tourtravels.com',
        password: 'operations123',
        role: 'Operations',
        phone: '+91-9876543211',
        isActive: true,
        permissions: [
          {
            module: 'dashboard',
            actions: ['read']
          },
          {
            module: 'bookings',
            actions: ['read', 'update', 'approve']
          },
          {
            module: 'customers',
            actions: ['read', 'update']
          },
          {
            module: 'drivers',
            actions: ['read', 'update', 'approve']
          },
          {
            module: 'vehicles',
            actions: ['read', 'update']
          },
          {
            module: 'packages',
            actions: ['read']
          }
        ]
      },
      {
        name: 'Finance Manager',
        email: 'finance@tourtravels.com',
        password: 'finance123',
        role: 'Finance',
        phone: '+91-9876543212',
        isActive: true,
        permissions: [
          {
            module: 'dashboard',
            actions: ['read']
          },
          {
            module: 'bookings',
            actions: ['read']
          },
          {
            module: 'payments',
            actions: ['read', 'update', 'approve']
          },
          {
            module: 'reports',
            actions: ['read']
          }
        ]
      },
      {
        name: 'Support Agent',
        email: 'support@tourtravels.com',
        password: 'support123',
        role: 'Support',
        phone: '+91-9876543213',
        isActive: true,
        permissions: [
          {
            module: 'dashboard',
            actions: ['read']
          },
          {
            module: 'bookings',
            actions: ['read', 'update']
          },
          {
            module: 'customers',
            actions: ['read', 'update']
          }
        ]
      }
    ];

    await AdminUser.insertMany(adminUsers);
    console.log('Admin users seeded successfully');

    console.log('Admin data seeded successfully!');
    console.log('Demo admin credentials:');
    console.log('Email: admin@tourtravels.com');
    console.log('Password: admin123');
    
    process.exit(0);

  } catch (error) {
    console.error('Error seeding admin data:', error);
    process.exit(1);
  }
};

seedAdminData();