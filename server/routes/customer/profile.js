import express from 'express';
import Customer from '../../models/Customer.js';
import { authenticateCustomer } from '../../middleware/customerAuth.js';

const router = express.Router();

// @route   GET /api/customer/profile
// @desc    Get customer profile
// @access  Private
router.get('/', authenticateCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('-password -phoneOTP -emailOTP -resetPasswordToken');

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: customer
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile'
    });
  }
});

// @route   PUT /api/customer/profile
// @desc    Update customer profile
// @access  Private
router.put('/', authenticateCustomer, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      emergencyContact,
      preferences
    } = req.body;

    const updateData = {};
    
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (dateOfBirth) updateData.dateOfBirth = new Date(dateOfBirth);
    if (gender) updateData.gender = gender;
    if (emergencyContact) updateData.emergencyContact = emergencyContact;
    if (preferences) updateData.preferences = { ...updateData.preferences, ...preferences };

    const customer = await Customer.findByIdAndUpdate(
      req.customer.id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password -phoneOTP -emailOTP -resetPasswordToken');

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: customer
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile'
    });
  }
});

// @route   POST /api/customer/profile/upload-image
// @desc    Upload profile image
// @access  Private
router.post('/upload-image', authenticateCustomer, async (req, res) => {
  try {
    const { imageBase64 } = req.body;

    if (!imageBase64) {
      return res.status(400).json({
        success: false,
        message: 'Image data required'
      });
    }

    // In production, upload to cloud storage (AWS S3, Cloudinary, etc.)
    // For now, we'll just store the base64 string
    const imageUrl = `data:image/jpeg;base64,${imageBase64}`;

    const customer = await Customer.findByIdAndUpdate(
      req.customer.id,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password -phoneOTP -emailOTP -resetPasswordToken');

    res.json({
      success: true,
      message: 'Profile image updated successfully',
      data: {
        profileImage: customer.profileImage
      }
    });

  } catch (error) {
    console.error('Upload image error:', error);
    res.status(500).json({
      success: false,
      message: 'Error uploading image'
    });
  }
});

// @route   GET /api/customer/profile/addresses
// @desc    Get customer addresses
// @access  Private
router.get('/addresses', authenticateCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id).select('addresses');

    res.json({
      success: true,
      data: customer.addresses || []
    });

  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching addresses'
    });
  }
});

// @route   POST /api/customer/profile/addresses
// @desc    Add new address
// @access  Private
router.post('/addresses', authenticateCustomer, async (req, res) => {
  try {
    const { label, address, landmark, latitude, longitude, isDefault } = req.body;

    if (!label || !address || !latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: 'Label, address, latitude, and longitude are required'
      });
    }

    const customer = await Customer.findById(req.customer.id);

    // If this is set as default, unset other defaults
    if (isDefault) {
      customer.addresses.forEach(addr => addr.isDefault = false);
    }

    customer.addresses.push({
      label,
      address,
      landmark,
      latitude,
      longitude,
      isDefault: isDefault || customer.addresses.length === 0 // First address is default
    });

    await customer.save();

    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: customer.addresses
    });

  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding address'
    });
  }
});

// @route   PUT /api/customer/profile/addresses/:addressId
// @desc    Update address
// @access  Private
router.put('/addresses/:addressId', authenticateCustomer, async (req, res) => {
  try {
    const { label, address, landmark, latitude, longitude, isDefault } = req.body;

    const customer = await Customer.findById(req.customer.id);
    const addressIndex = customer.addresses.id(req.params.addressId);

    if (!addressIndex) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    // If this is set as default, unset other defaults
    if (isDefault) {
      customer.addresses.forEach(addr => {
        if (addr._id.toString() !== req.params.addressId) {
          addr.isDefault = false;
        }
      });
    }

    // Update the address
    if (label) addressIndex.label = label;
    if (address) addressIndex.address = address;
    if (landmark !== undefined) addressIndex.landmark = landmark;
    if (latitude) addressIndex.latitude = latitude;
    if (longitude) addressIndex.longitude = longitude;
    if (isDefault !== undefined) addressIndex.isDefault = isDefault;

    await customer.save();

    res.json({
      success: true,
      message: 'Address updated successfully',
      data: customer.addresses
    });

  } catch (error) {
    console.error('Update address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating address'
    });
  }
});

// @route   DELETE /api/customer/profile/addresses/:addressId
// @desc    Delete address
// @access  Private
router.delete('/addresses/:addressId', authenticateCustomer, async (req, res) => {
  try {
    const customer = await Customer.findById(req.customer.id);
    const address = customer.addresses.id(req.params.addressId);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;
    customer.addresses.pull(req.params.addressId);

    // If deleted address was default, make first address default
    if (wasDefault && customer.addresses.length > 0) {
      customer.addresses[0].isDefault = true;
    }

    await customer.save();

    res.json({
      success: true,
      message: 'Address deleted successfully',
      data: customer.addresses
    });

  } catch (error) {
    console.error('Delete address error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting address'
    });
  }
});

// @route   PUT /api/customer/profile/change-password
// @desc    Change customer password
// @access  Private
router.put('/change-password', authenticateCustomer, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const customer = await Customer.findById(req.customer.id);

    // Verify current password
    const isMatch = await customer.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    customer.password = newPassword;
    await customer.save();

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password'
    });
  }
});

// @route   PUT /api/customer/profile/phone
// @desc    Update phone number (requires OTP verification)
// @access  Private
router.put('/phone', authenticateCustomer, async (req, res) => {
  try {
    const { newPhone } = req.body;

    if (!newPhone) {
      return res.status(400).json({
        success: false,
        message: 'New phone number is required'
      });
    }

    // Check if phone already exists
    const existingCustomer = await Customer.findOne({ phone: newPhone });
    if (existingCustomer && existingCustomer._id.toString() !== req.customer.id) {
      return res.status(400).json({
        success: false,
        message: 'Phone number already exists'
      });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const customer = await Customer.findById(req.customer.id);
    customer.phoneOTP = otp;
    customer.otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    customer.tempPhone = newPhone; // Store temporarily

    await customer.save();

    // Send OTP to new phone number
    // await sendOTP(newPhone, otp);

    res.json({
      success: true,
      message: 'OTP sent to new phone number',
      data: {
        // For development only
        devOTP: otp
      }
    });

  } catch (error) {
    console.error('Update phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating phone number'
    });
  }
});

// @route   POST /api/customer/profile/verify-phone
// @desc    Verify new phone number with OTP
// @access  Private
router.post('/verify-phone', authenticateCustomer, async (req, res) => {
  try {
    const { otp } = req.body;

    const customer = await Customer.findById(req.customer.id);

    if (!customer.phoneOTP || !customer.tempPhone) {
      return res.status(400).json({
        success: false,
        message: 'No phone update request found'
      });
    }

    if (customer.otpExpiry < new Date()) {
      return res.status(400).json({
        success: false,
        message: 'OTP has expired'
      });
    }

    if (customer.phoneOTP !== otp) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Update phone number
    customer.phone = customer.tempPhone;
    customer.isPhoneVerified = true;
    customer.phoneOTP = undefined;
    customer.tempPhone = undefined;
    customer.otpExpiry = undefined;

    await customer.save();

    res.json({
      success: true,
      message: 'Phone number updated successfully',
      data: {
        phone: customer.phone
      }
    });

  } catch (error) {
    console.error('Verify phone error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying phone number'
    });
  }
});

export default router;