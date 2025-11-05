import express from 'express';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import Customer from '../../models/Customer.js';
import { sendOTP, sendEmail } from '../../services/notificationService.js';

const router = express.Router();

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate JWT Token
const generateToken = (customerId) => {
  return jwt.sign({ customerId, type: 'customer' }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '30d'
  });
};

// @route   POST /api/customer/auth/register
// @desc    Register a new customer
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, phone, password, deviceInfo } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Check if customer already exists
    const existingCustomer = await Customer.findOne({
      $or: [{ email }, { phone }]
    });

    if (existingCustomer) {
      return res.status(400).json({
        success: false,
        message: 'Customer already exists with this email or phone'
      });
    }

    // Generate OTP
    const phoneOTP = generateOTP();
    const emailOTP = generateOTP();

    // Create new customer
    const customer = new Customer({
      firstName,
      lastName,
      email,
      phone,
      password,
      phoneOTP,
      emailOTP,
      otpExpiry: new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
      deviceInfo: deviceInfo || {}
    });

    await customer.save();

    // Send OTPs (In production, use actual SMS/Email services)
    // await sendOTP(phone, phoneOTP);
    // await sendEmail(email, 'Verify your email', `Your OTP is: ${emailOTP}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Please verify your phone and email.',
      data: {
        customerId: customer._id,
        phoneOTPSent: true,
        emailOTPSent: true,
        // For development only - remove in production
        devOTPs: {
          phoneOTP,
          emailOTP
        }
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

// @route   POST /api/customer/auth/verify-otp
// @desc    Verify phone/email OTP
// @access  Public
router.post('/verify-otp', async (req, res) => {
  try {
    const { customerId, type, otp } = req.body; // type: 'phone' or 'email'

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Check OTP expiry
    if (customer.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    // Verify OTP
    let isValid = false;
    if (type === 'phone' && customer.phoneOTP === otp) {
      customer.isPhoneVerified = true;
      customer.phoneOTP = undefined;
      isValid = true;
    } else if (type === 'email' && customer.emailOTP === otp) {
      customer.isEmailVerified = true;
      customer.emailOTP = undefined;
      isValid = true;
    }

    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // If both phone and email are verified, activate account
    if (customer.isPhoneVerified && customer.isEmailVerified) {
      customer.status = 'active';
      customer.otpExpiry = undefined;
    }

    await customer.save();

    res.json({
      success: true,
      message: `${type} verified successfully`,
      data: {
        phoneVerified: customer.isPhoneVerified,
        emailVerified: customer.isEmailVerified,
        accountActive: customer.status === 'active'
      }
    });

  } catch (error) {
    console.error('OTP verification error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during verification'
    });
  }
});

// @route   POST /api/customer/auth/login
// @desc    Login customer with email/phone and password
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { emailOrPhone, password, deviceInfo } = req.body;

    if (!emailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Phone and password are required'
      });
    }

    // Find customer by email or phone
    const customer = await Customer.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is locked
    if (customer.isLocked()) {
      return res.status(423).json({
        success: false,
        message: 'Account is temporarily locked due to multiple failed attempts'
      });
    }

    // Verify password
    const isMatch = await customer.comparePassword(password);
    if (!isMatch) {
      await customer.incLoginAttempts();
      return res.status(400).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if account is active
    if (customer.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active. Please contact support.'
      });
    }

    // Reset login attempts on successful login
    await customer.resetLoginAttempts();

    // Update last login and device info
    customer.lastLogin = new Date();
    if (deviceInfo) {
      customer.deviceInfo = { ...customer.deviceInfo, ...deviceInfo };
    }
    await customer.save();

    // Generate JWT token
    const token = generateToken(customer._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          profileImage: customer.profileImage,
          isPhoneVerified: customer.isPhoneVerified,
          isEmailVerified: customer.isEmailVerified,
          walletBalance: customer.paymentPreferences?.walletBalance || 0,
          loyaltyPoints: customer.paymentPreferences?.loyaltyPoints || 0
        }
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

// @route   POST /api/customer/auth/social-login
// @desc    Social login (Google/Apple/Facebook)
// @access  Public
router.post('/social-login', async (req, res) => {
  try {
    const { provider, socialId, email, firstName, lastName, profileImage, deviceInfo } = req.body;

    if (!provider || !socialId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Provider, social ID, and email are required'
      });
    }

    let customer;
    const socialField = `${provider}Id`;

    // Check if customer exists with social ID
    customer = await Customer.findOne({ [socialField]: socialId });

    if (!customer) {
      // Check if customer exists with email
      customer = await Customer.findOne({ email });
      
      if (customer) {
        // Link social account to existing customer
        customer[socialField] = socialId;
        if (profileImage && !customer.profileImage) {
          customer.profileImage = profileImage;
        }
      } else {
        // Create new customer
        customer = new Customer({
          firstName: firstName || 'User',
          lastName: lastName || '',
          email,
          phone: '', // Will need to be added later
          password: crypto.randomBytes(32).toString('hex'), // Random password
          [socialField]: socialId,
          profileImage,
          isEmailVerified: true, // Social login means email is verified
          status: 'active',
          registrationSource: 'Mobile App'
        });
      }
    }

    // Update device info and last login
    customer.lastLogin = new Date();
    if (deviceInfo) {
      customer.deviceInfo = { ...customer.deviceInfo, ...deviceInfo };
    }

    await customer.save();

    // Generate JWT token
    const token = generateToken(customer._id);

    res.json({
      success: true,
      message: 'Social login successful',
      data: {
        token,
        customer: {
          id: customer._id,
          firstName: customer.firstName,
          lastName: customer.lastName,
          email: customer.email,
          phone: customer.phone,
          profileImage: customer.profileImage,
          isPhoneVerified: customer.isPhoneVerified,
          isEmailVerified: customer.isEmailVerified,
          needsPhoneVerification: !customer.phone,
          walletBalance: customer.paymentPreferences?.walletBalance || 0,
          loyaltyPoints: customer.paymentPreferences?.loyaltyPoints || 0
        }
      }
    });

  } catch (error) {
    console.error('Social login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during social login'
    });
  }
});

// @route   POST /api/customer/auth/resend-otp
// @desc    Resend OTP for phone/email verification
// @access  Public
router.post('/resend-otp', async (req, res) => {
  try {
    const { customerId, type } = req.body; // type: 'phone' or 'email'

    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Generate new OTP
    const otp = generateOTP();
    const expiryTime = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    if (type === 'phone') {
      customer.phoneOTP = otp;
      customer.otpExpiry = expiryTime;
      // await sendOTP(customer.phone, otp);
    } else if (type === 'email') {
      customer.emailOTP = otp;
      customer.otpExpiry = expiryTime;
      // await sendEmail(customer.email, 'Verify your email', `Your OTP is: ${otp}`);
    }

    await customer.save();

    res.json({
      success: true,
      message: `OTP sent to ${type}`,
      data: {
        // For development only - remove in production
        devOTP: otp
      }
    });

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resending OTP'
    });
  }
});

// @route   POST /api/customer/auth/forgot-password
// @desc    Send password reset link/OTP
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrPhone } = req.body;

    const customer = await Customer.findOne({
      $or: [
        { email: emailOrPhone },
        { phone: emailOrPhone }
      ]
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'No account found with this email or phone'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    customer.resetPasswordToken = resetToken;
    customer.resetPasswordExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes

    await customer.save();

    // In production, send email with reset link
    // await sendEmail(customer.email, 'Password Reset', `Reset link: ${resetLink}`);

    res.json({
      success: true,
      message: 'Password reset instructions sent',
      data: {
        // For development only
        resetToken
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

// @route   POST /api/customer/auth/reset-password
// @desc    Reset password using token
// @access  Public
router.post('/reset-password', async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    const customer = await Customer.findOne({
      resetPasswordToken: resetToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    customer.password = newPassword;
    customer.resetPasswordToken = undefined;
    customer.resetPasswordExpires = undefined;

    await customer.save();

    res.json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during password reset'
    });
  }
});

export default router;