import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import AdminUser from './models/AdminUser.js';

dotenv.config();

const fixAdminPassword = async () => {
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

    // Hash the password manually
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    // Update the user with hashed password
    adminUser.password = hashedPassword;
    await adminUser.save({ validateBeforeSave: false });

    console.log('Admin password updated successfully!');
    
    // Test the password again
    const isMatch = await adminUser.comparePassword('admin123');
    console.log('Password test result after fix:', isMatch);
    
    process.exit(0);
  } catch (error) {
    console.error('Error fixing admin password:', error);
    process.exit(1);
  }
};

fixAdminPassword();