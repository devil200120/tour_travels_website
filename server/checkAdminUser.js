import mongoose from 'mongoose';
import dotenv from 'dotenv';
import AdminUser from './models/AdminUser.js';

dotenv.config();

const checkAdminUser = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/tour_travels_admin');
    console.log('Connected to MongoDB');

    // Find the admin user
    const adminUser = await AdminUser.findOne({ email: 'admin@tourtravels.com' });
    
    if (!adminUser) {
      console.log('Admin user not found!');
      process.exit(1);
    }

    console.log('Admin User Details:');
    console.log('Name:', adminUser.name);
    console.log('Email:', adminUser.email);
    console.log('Role:', adminUser.role);
    console.log('Is Active:', adminUser.isActive);
    console.log('Password Hash:', adminUser.password);
    
    // Test password comparison
    const isMatch = await adminUser.comparePassword('admin123');
    console.log('Password test result:', isMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking admin user:', error);
    process.exit(1);
  }
};

checkAdminUser();