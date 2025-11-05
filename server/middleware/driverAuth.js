import jwt from 'jsonwebtoken';
import process from 'process';
import Driver from '../models/Driver.js';

const driverAuth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        
        // Check if the token is for a driver
        if (decoded.role !== 'driver') {
            return res.status(403).json({
                success: false,
                message: 'Access denied. Driver token required.'
            });
        }

        // Find the driver
        const driver = await Driver.findById(decoded.id);
        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'Driver not found.'
            });
        }

        // Check if driver is active
        if (!driver.isActive) {
            return res.status(403).json({
                success: false,
                message: 'Account has been deactivated. Please contact support.'
            });
        }

        req.user = {
            id: driver._id,
            role: 'driver',
            email: driver.email,
            name: driver.name
        };
        
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }
        
        console.error('Driver auth middleware error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during authentication.'
        });
    }
};

export default driverAuth;