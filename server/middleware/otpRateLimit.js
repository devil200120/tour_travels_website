import Driver from '../models/Driver.js';

// In-memory rate limiting for OTP requests (consider using Redis in production)
const otpRequestTracker = new Map();

const otpRateLimit = async (req, res, next) => {
    try {
        const { email, phone } = req.body;
        const identifier = email || phone;

        if (!identifier) {
            return res.status(400).json({
                success: false,
                message: 'Email or phone number is required'
            });
        }

        // Check in-memory rate limiting (per identifier)
        const now = Date.now();
        const trackerKey = identifier.toLowerCase();
        
        if (otpRequestTracker.has(trackerKey)) {
            const tracker = otpRequestTracker.get(trackerKey);
            const timeDiff = now - tracker.lastRequest;
            
            // Rate limit: 1 request per minute
            if (timeDiff < 60 * 1000) { // 60 seconds
                const remainingTime = Math.ceil((60 * 1000 - timeDiff) / 1000);
                return res.status(429).json({
                    success: false,
                    message: `Please wait ${remainingTime} seconds before requesting another OTP`,
                    retryAfter: remainingTime
                });
            }
            
            // Check daily limit (max 5 OTP requests per day per identifier)
            if (tracker.dailyCount >= 5 && now - tracker.dayStart < 24 * 60 * 60 * 1000) {
                return res.status(429).json({
                    success: false,
                    message: 'Daily OTP limit exceeded. Please try again tomorrow or contact support.',
                    dailyLimit: 5,
                    resetTime: '24 hours'
                });
            }
            
            // Reset daily counter if it's a new day
            if (now - tracker.dayStart >= 24 * 60 * 60 * 1000) {
                tracker.dailyCount = 0;
                tracker.dayStart = now;
            }
            
            // Update tracker
            tracker.lastRequest = now;
            tracker.dailyCount += 1;
        } else {
            // First request for this identifier
            otpRequestTracker.set(trackerKey, {
                lastRequest: now,
                dailyCount: 1,
                dayStart: now
            });
        }

        // Clean up old entries (remove entries older than 24 hours)
        for (const [key, tracker] of otpRequestTracker.entries()) {
            if (now - tracker.dayStart > 24 * 60 * 60 * 1000) {
                otpRequestTracker.delete(key);
            }
        }

        next();
    } catch (error) {
        console.error('OTP rate limit error:', error);
        res.status(500).json({
            success: false,
            message: 'Rate limiting check failed',
            error: error.message
        });
    }
};

export default otpRateLimit;