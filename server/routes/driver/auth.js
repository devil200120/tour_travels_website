import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import process from 'process';
import Driver from '../../models/Driver.js';
import driverAuth from '../../middleware/driverAuth.js';
const router = express.Router();

// Driver Registration/Signup
router.post('/signup', async (req, res) => {
    try {
        const {
            name,
            email,
            phone,
            alternatePhone,
            password,
            address,
            dateOfBirth,
            licenseNumber,
            licenseExpiry,
            licenseType,
            experience,
            emergencyContact,
            languages,
            specializations,
            vehicleDetails
        } = req.body;

        // Check if driver already exists
        const existingDriver = await Driver.findOne({
            $or: [
                { email: email },
                { phone: phone },
                { licenseNumber: licenseNumber }
            ]
        });

        if (existingDriver) {
            return res.status(400).json({
                success: false,
                message: 'Driver already exists with this email, phone, or license number'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new driver
        const newDriver = new Driver({
            name,
            email,
            phone,
            alternatePhone,
            password: hashedPassword,
            address,
            dateOfBirth,
            licenseNumber,
            licenseExpiry,
            licenseType,
            experience: experience || 0,
            emergencyContact,
            languages: languages || ['English'],
            specializations: specializations || [],
            vehicleDetails,
            kycStatus: 'Pending',
            isActive: true,
            isAvailable: false,
            registrationDate: new Date()
        });

        await newDriver.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: newDriver._id, 
                role: 'driver',
                email: newDriver.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.status(201).json({
            success: true,
            message: 'Driver registered successfully',
            token,
            driver: {
                id: newDriver._id,
                name: newDriver.name,
                email: newDriver.email,
                phone: newDriver.phone,
                kycStatus: newDriver.kycStatus,
                isActive: newDriver.isActive,
                isAvailable: newDriver.isAvailable
            }
        });

    } catch (error) {
        console.error('Driver signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

// Driver Login
router.post('/login', async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password is required'
            });
        }

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        // Find driver by email or phone and include password for verification
        const driver = await Driver.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        }).select('+password'); // Explicitly include password field

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if driver has a password (for backward compatibility)
        if (!driver.password) {
            return res.status(400).json({
                success: false,
                message: 'Account setup incomplete. Please contact support to reset your password.'
            });
        }

        // Check if driver account is active
        if (!driver.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, driver.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password'
            });
        }

        // Update last login
        driver.lastLoginDate = new Date();
        await driver.save();

        // Generate JWT token
        const token = jwt.sign(
            { 
                id: driver._id, 
                role: 'driver',
                email: driver.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            token,
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone,
                kycStatus: driver.kycStatus,
                isActive: driver.isActive,
                isAvailable: driver.isAvailable,
                currentLocation: driver.currentLocation,
                rating: driver.rating,
                totalTrips: driver.totalTrips,
                totalEarnings: driver.totalEarnings
            }
        });

    } catch (error) {
        console.error('Driver login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Driver Profile
router.get('/profile', driverAuth, async (req, res) => {
    try {
        const driverId = req.user.id;
        
        const driver = await Driver.findById(driverId).select('-password');
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        res.json({
            success: true,
            driver
        });

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch profile',
            error: error.message
        });
    }
});

// Refresh Token
router.post('/refresh-token', driverAuth, async (req, res) => {
    try {
        const driverId = req.user.id;
        
        const driver = await Driver.findById(driverId);
        if (!driver || !driver.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Driver not found or inactive'
            });
        }

        // Generate new token
        const token = jwt.sign(
            { 
                id: driver._id, 
                role: 'driver',
                email: driver.email
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '30d' }
        );

        res.json({
            success: true,
            token
        });

    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({
            success: false,
            message: 'Token refresh failed',
            error: error.message
        });
    }
});

// Driver Logout
router.post('/logout', driverAuth, async (req, res) => {
    try {
        const driverId = req.user.id;
        
        // Update driver status to offline
        await Driver.findByIdAndUpdate(driverId, {
            isAvailable: false,
            lastSeenDate: new Date()
        });

        res.json({
            success: true,
            message: 'Logged out successfully'
        });

    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
            error: error.message
        });
    }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        const driver = await Driver.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Generate reset token (in production, send via SMS/Email)
        const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
        
        // Store reset token (expires in 10 minutes)
        driver.resetPasswordToken = resetToken;
        driver.resetPasswordExpires = new Date(Date.now() + 10 * 60 * 1000);
        await driver.save();

        res.json({
            success: true,
            message: 'Password reset code sent',
            // In production, don't send token in response
            resetToken: resetToken // Only for development
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process forgot password request',
            error: error.message
        });
    }
});

// Reset Password
router.post('/reset-password', async (req, res) => {
    try {
        const { email, phone, resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Reset token and new password are required'
            });
        }

        const driver = await Driver.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ],
            resetPasswordToken: resetToken,
            resetPasswordExpires: { $gt: new Date() }
        });

        if (!driver) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password and clear reset token
        driver.password = hashedPassword;
        driver.resetPasswordToken = undefined;
        driver.resetPasswordExpires = undefined;
        await driver.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message
        });
    }
});

export default router;