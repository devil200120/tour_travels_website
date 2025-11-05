import jwt from 'jsonwebtoken';
import Customer from '../models/Customer.js';

export const authenticateCustomer = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    
    if (decoded.type !== 'customer') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token type'
      });
    }

    const customer = await Customer.findById(decoded.customerId);
    
    if (!customer) {
      return res.status(401).json({
        success: false,
        message: 'Customer not found'
      });
    }

    if (customer.status !== 'active') {
      return res.status(403).json({
        success: false,
        message: 'Account is not active'
      });
    }

    req.customer = {
      id: customer._id,
      email: customer.email,
      phone: customer.phone,
      status: customer.status
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
      
      if (decoded.type === 'customer') {
        const customer = await Customer.findById(decoded.customerId);
        
        if (customer && customer.status === 'active') {
          req.customer = {
            id: customer._id,
            email: customer.email,
            phone: customer.phone,
            status: customer.status
          };
        }
      }
    }

    next();
  } catch (error) {
    // Continue without authentication for optional auth
    next();
  }
};