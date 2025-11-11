import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import process from 'process';
import Driver from '../../models/Driver.js';
import driverAuth from '../../middleware/driverAuth.js';
import otpRateLimit from '../../middleware/otpRateLimit.js';
import OTPService from '../../services/otpService.js';
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

        // Don't generate token for new drivers until KYC is approved
        // This prevents immediate login and ensures admin approval flow
        
        res.status(201).json({
            success: true,
            message: 'Driver registered successfully. Your account is pending admin approval.',
            pendingApproval: true,
            driver: {
                id: newDriver._id,
                name: newDriver.name,
                email: newDriver.email,
                phone: newDriver.phone,
                kycStatus: newDriver.kycStatus,
                isActive: newDriver.isActive,
                isAvailable: false, // Not available until approved
                registrationDate: newDriver.registrationDate
            },
            nextSteps: {
                message: 'Please wait for admin approval. You will be notified once your KYC documents are verified.',
                estimatedTime: '24-48 hours',
                contactSupport: 'For urgent queries, contact support at support@tourtravel.com'
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

// Driver Login - Step 1: Request OTP
router.post('/login/request-otp', otpRateLimit, async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        // Find driver by email or phone
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

        // Check if driver account is active
        if (!driver.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Check KYC status before allowing login
        if (driver.kycStatus === 'Pending') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. Please wait for KYC verification.',
                kycStatus: 'Pending',
                nextSteps: {
                    message: 'Please wait for admin approval. You will be notified once your KYC documents are verified.',
                    estimatedTime: '24-48 hours',
                    contactSupport: 'For urgent queries, contact support at support@tourtravel.com'
                }
            });
        }

        if (driver.kycStatus === 'Rejected') {
            return res.status(403).json({
                success: false,
                message: 'Your KYC has been rejected. Please contact support for more information.',
                kycStatus: 'Rejected',
                contactSupport: 'Contact support at support@tourtravel.com'
            });
        }

        if (driver.kycStatus === 'Under Review') {
            return res.status(403).json({
                success: false,
                message: 'Your KYC is currently under review. Please wait for verification to complete.',
                kycStatus: 'Under Review',
                nextSteps: {
                    message: 'Your documents are being reviewed by our team.',
                    estimatedTime: '12-24 hours',
                    contactSupport: 'For urgent queries, contact support at support@tourtravel.com'
                }
            });
        }

        // Generate 6-digit OTP
        const otp = OTPService.generateOTP();
        
        // Store OTP with expiration (5 minutes)
        driver.loginOtp = otp;
        driver.loginOtpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
        driver.loginOtpAttempts = 0;
        await driver.save();

        // Send OTP via SMS/Email (development mode shows in console)
        const otpResult = await OTPService.sendOTP(driver.phone, driver.email, otp, driver.name);
        
        if (!otpResult.success) {
            console.error('OTP sending failed:', otpResult);
            // Continue anyway for development - in production, you might want to fail here
        }

        res.json({
            success: true,
            message: 'OTP sent successfully',
            // Remove in production - only for development
            otp: process.env.NODE_ENV === 'development' ? otp : undefined,
            expiresIn: '5 minutes',
            phone: driver.phone,
            email: driver.email,
            driverId: driver._id
        });

    } catch (error) {
        console.error('Request OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message
        });
    }
});

// Driver Login - Step 2: Verify OTP and Login
router.post('/login/verify-otp', async (req, res) => {
    try {
        const { email, phone, otp } = req.body;

        // Validate OTP format
        if (!OTPService.isValidOTPFormat(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP format. OTP must be 6 digits.'
            });
        }

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        // Find driver by email or phone and include OTP fields
        const driver = await Driver.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        }).select('+loginOtp +loginOtpExpires +loginOtpAttempts'); // Explicitly include OTP fields

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if OTP exists and is not expired
        if (!driver.loginOtp || !driver.loginOtpExpires) {
            return res.status(400).json({
                success: false,
                message: 'No OTP found. Please request a new OTP.'
            });
        }

        if (OTPService.isOTPExpired(driver.loginOtpExpires)) {
            // Clear expired OTP
            driver.loginOtp = undefined;
            driver.loginOtpExpires = undefined;
            driver.loginOtpAttempts = 0;
            await driver.save();
            
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new OTP.'
            });
        }

        // Check attempt limit (max 3 attempts)
        if (driver.loginOtpAttempts >= 3) {
            driver.loginOtp = undefined;
            driver.loginOtpExpires = undefined;
            driver.loginOtpAttempts = 0;
            await driver.save();
            
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please request a new OTP.'
            });
        }

        // Verify OTP
        if (driver.loginOtp !== otp) {
            driver.loginOtpAttempts = (driver.loginOtpAttempts || 0) + 1;
            await driver.save();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid OTP',
                attemptsRemaining: 3 - driver.loginOtpAttempts
            });
        }

        // OTP verified successfully
        // Clear OTP fields
        driver.loginOtp = undefined;
        driver.loginOtpExpires = undefined;
        driver.loginOtpAttempts = 0;
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
                totalEarnings: driver.totalEarnings,
                approvalDate: driver.approvalDate
            }
        });

    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

// Legacy password-based login (kept for backward compatibility)
router.post('/login', async (req, res) => {
    try {
        const { email, phone, password } = req.body;

        if (!password) {
            return res.status(400).json({
                success: false,
                message: 'Password login is deprecated. Please use OTP-based login.',
                useOtpLogin: true,
                otpEndpoints: {
                    requestOtp: '/api/driver/auth/login/request-otp',
                    verifyOtp: '/api/driver/auth/login/verify-otp'
                }
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
                message: 'Password not set. Please use OTP-based login or contact support.',
                useOtpLogin: true,
                otpEndpoints: {
                    requestOtp: '/api/driver/auth/login/request-otp',
                    verifyOtp: '/api/driver/auth/login/verify-otp'
                }
            });
        }

        // Check if driver account is active
        if (!driver.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.'
            });
        }

        // Check KYC status before allowing login
        if (driver.kycStatus === 'Pending') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending admin approval. Please wait for KYC verification.',
                kycStatus: 'Pending',
                nextSteps: {
                    message: 'Please wait for admin approval. You will be notified once your KYC documents are verified.',
                    estimatedTime: '24-48 hours',
                    contactSupport: 'For urgent queries, contact support at support@tourtravel.com'
                }
            });
        }

        if (driver.kycStatus === 'Rejected') {
            return res.status(403).json({
                success: false,
                message: 'Your KYC has been rejected. Please contact support for more information.',
                kycStatus: 'Rejected',
                contactSupport: 'Contact support at support@tourtravel.com'
            });
        }

        if (driver.kycStatus === 'Under Review') {
            return res.status(403).json({
                success: false,
                message: 'Your KYC is currently under review. Please wait for verification to complete.',
                kycStatus: 'Under Review',
                nextSteps: {
                    message: 'Your documents are being reviewed by our team.',
                    estimatedTime: '12-24 hours',
                    contactSupport: 'For urgent queries, contact support at support@tourtravel.com'
                }
            });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, driver.password);
        if (!isValidPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password. Consider using OTP-based login for better security.',
                useOtpLogin: true
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

// Forgot Password - Step 1: Request Reset OTP
router.post('/forgot-password/request-otp', otpRateLimit, async (req, res) => {
    try {
        const { email, phone } = req.body;

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        // Find driver by email or phone
        const driver = await Driver.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        });

        if (!driver) {
            // Don't reveal that user doesn't exist for security
            return res.json({
                success: true,
                message: 'If an account exists with this email/phone, you will receive a password reset OTP.',
                expiresIn: '5 minutes'
            });
        }

        // Check if driver account is active
        if (!driver.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support for password reset.'
            });
        }

        // Generate 6-digit OTP for password reset
        const resetOtp = OTPService.generateOTP();
        
        // Store reset OTP with expiration (10 minutes for password reset)
        driver.resetPasswordOtp = resetOtp;
        driver.resetPasswordOtpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
        driver.resetPasswordOtpAttempts = 0;
        await driver.save();

        // Send reset OTP via SMS/Email
        const otpResult = await OTPService.sendPasswordResetOTP(driver.phone, driver.email, resetOtp, driver.name);
        
        if (!otpResult.success) {
            console.error('Reset OTP sending failed:', otpResult);
            // Continue anyway for development - in production, you might want to fail here
        }

        res.json({
            success: true,
            message: 'Password reset OTP sent successfully',
            // Remove in production - only for development
            otp: process.env.NODE_ENV === 'development' ? resetOtp : undefined,
            expiresIn: '10 minutes',
            phone: driver.phone ? `${driver.phone.slice(0, -4)}****` : undefined,
            email: driver.email ? `${driver.email.split('@')[0].slice(0, -2)}**@${driver.email.split('@')[1]}` : undefined,
            driverId: driver._id
        });

    } catch (error) {
        console.error('Reset OTP request error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send reset OTP',
            error: error.message
        });
    }
});

// Forgot Password - Step 2: Verify Reset OTP
router.post('/forgot-password/verify-otp', async (req, res) => {
    try {
        const { email, phone, otp } = req.body;

        // Validate OTP format
        if (!OTPService.isValidOTPFormat(otp)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP format. OTP must be 6 digits.'
            });
        }

        if (!email && !phone) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        // Find driver by email or phone and include reset OTP fields
        const driver = await Driver.findOne({
            $or: [
                { email: email },
                { phone: phone }
            ]
        }).select('+resetPasswordOtp +resetPasswordOtpExpires +resetPasswordOtpAttempts'); // Explicitly include reset OTP fields

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if reset OTP exists and is not expired
        if (!driver.resetPasswordOtp || !driver.resetPasswordOtpExpires) {
            return res.status(400).json({
                success: false,
                message: 'No password reset OTP found. Please request a new reset OTP.'
            });
        }

        if (OTPService.isOTPExpired(driver.resetPasswordOtpExpires)) {
            // Clear expired reset OTP
            driver.resetPasswordOtp = undefined;
            driver.resetPasswordOtpExpires = undefined;
            driver.resetPasswordOtpAttempts = 0;
            await driver.save();
            
            return res.status(400).json({
                success: false,
                message: 'Reset OTP has expired. Please request a new reset OTP.'
            });
        }

        // Check attempt limit (max 3 attempts)
        if (driver.resetPasswordOtpAttempts >= 3) {
            driver.resetPasswordOtp = undefined;
            driver.resetPasswordOtpExpires = undefined;
            driver.resetPasswordOtpAttempts = 0;
            await driver.save();
            
            return res.status(429).json({
                success: false,
                message: 'Too many failed attempts. Please request a new reset OTP.'
            });
        }

        // Verify reset OTP
        if (driver.resetPasswordOtp !== otp) {
            driver.resetPasswordOtpAttempts = (driver.resetPasswordOtpAttempts || 0) + 1;
            await driver.save();
            
            return res.status(401).json({
                success: false,
                message: 'Invalid reset OTP',
                attemptsRemaining: 3 - driver.resetPasswordOtpAttempts
            });
        }

        // OTP verified successfully - generate password reset token
        const resetToken = jwt.sign(
            { 
                id: driver._id,
                purpose: 'password_reset',
                timestamp: Date.now()
            },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '15m' } // 15 minutes to reset password
        );

        // Clear reset OTP but keep driver info for password reset
        driver.resetPasswordOtp = undefined;
        driver.resetPasswordOtpExpires = undefined;
        driver.resetPasswordOtpAttempts = 0;
        driver.passwordResetToken = resetToken;
        driver.passwordResetTokenExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        await driver.save();

        res.json({
            success: true,
            message: 'Reset OTP verified successfully',
            resetToken: resetToken,
            expiresIn: '15 minutes',
            driver: {
                id: driver._id,
                name: driver.name,
                email: driver.email,
                phone: driver.phone
            }
        });

    } catch (error) {
        console.error('Reset OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Reset OTP verification failed',
            error: error.message
        });
    }
});

// Reset Password - Step 3: Set New Password
router.post('/reset-password', async (req, res) => {
    console.log('\n=== RESET PASSWORD REQUEST START ===');
    console.log('Request received at:', new Date().toISOString());
    console.log('Request headers:', req.headers);
    console.log('Request body keys:', Object.keys(req.body));
    
    try {
        const { resetToken, newPassword, confirmPassword } = req.body;

        console.log('Reset password request received');
        console.log('Reset token present:', resetToken ? 'YES' : 'NO');
        console.log('Reset token length:', resetToken ? resetToken.length : 0);
        console.log('New password present:', newPassword ? 'YES' : 'NO');
        console.log('Confirm password present:', confirmPassword ? 'YES' : 'NO');

        if (!resetToken) {
            console.log('❌ VALIDATION FAILED: Reset token is missing');
            return res.status(400).json({
                success: false,
                message: 'Reset token is required'
            });
        }

        if (!newPassword || !confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password are required'
            });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password and confirm password do not match'
            });
        }

        // Validate password strength
        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        // Verify reset token (JWT)
        let decoded;
        try {
            console.log('🔍 Debug Reset Password:');
            console.log('Reset token received:', resetToken ? 'Present' : 'Missing');
            console.log('Token length:', resetToken ? resetToken.length : 0);
            console.log('Token starts with:', resetToken ? resetToken.substring(0, 20) + '...' : 'N/A');
            console.log('JWT_SECRET being used:', process.env.JWT_SECRET || 'your-secret-key');
            
            decoded = jwt.verify(resetToken, process.env.JWT_SECRET || 'your-secret-key');
            console.log('✅ JWT decoded successfully:', decoded);
            
            if (decoded.purpose !== 'password_reset') {
                console.log('❌ Invalid token purpose:', decoded.purpose);
                throw new Error('Invalid token purpose');
            }
            
            console.log('✅ Token purpose verified');
        } catch (error) {
            console.error('❌ JWT verification failed:');
            console.error('Error name:', error.name);
            console.error('Error message:', error.message);
            console.error('Full error:', error);
            
            let errorMessage = 'Invalid or expired reset token';
            
            if (error.name === 'TokenExpiredError') {
                errorMessage = 'Reset token has expired. Please request a new password reset.';
            } else if (error.name === 'JsonWebTokenError') {
                errorMessage = 'Invalid reset token format. Please request a new password reset.';
            } else if (error.message === 'Invalid token purpose') {
                errorMessage = 'Token is not valid for password reset.';
            }
            
            return res.status(401).json({
                success: false,
                message: errorMessage,
                debug: process.env.NODE_ENV === 'development' ? {
                    errorName: error.name,
                    errorMessage: error.message
                } : undefined
            });
        }

        // Find driver - include password field
        const driver = await Driver.findById(decoded.id).select('+password');
        
        console.log('Driver found:', driver ? 'Yes' : 'No');
        
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found'
            });
        }

        // Check if driver is active
        if (!driver.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account is deactivated. Cannot reset password.'
            });
        }

        // Hash the new password
        const saltRounds = 12;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // Update password and clear reset token
        driver.password = hashedPassword;
        driver.passwordResetToken = undefined;
        driver.passwordResetTokenExpires = undefined;
        driver.lastPasswordResetDate = new Date();
        await driver.save();

        res.json({
            success: true,
            message: 'Password reset successfully',
            nextSteps: {
                message: 'Your password has been updated. You can now login with your new password or use OTP-based login.',
                loginOptions: [
                    'Use new password with legacy login',
                    'Use OTP-based login (recommended)'
                ]
            }
        });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({
            success: false,
            message: 'Password reset failed',
            error: error.message
        });
    }
});

// Test endpoint to verify reset password route is working
router.get('/reset-password-test', (req, res) => {
    console.log('🧪 Reset password test endpoint hit');
    res.json({
        success: true,
        message: 'Reset password route is accessible',
        timestamp: new Date().toISOString(),
        route: '/api/driver/auth/reset-password'
    });
});

export default router;