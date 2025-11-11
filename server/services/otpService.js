// Simple OTP service for development
// In production, integrate with SMS/Email services like Twilio, AWS SES, etc.

class OTPService {
    
    // Generate a 6-digit OTP
    static generateOTP() {
        return Math.floor(100000 + Math.random() * 900000).toString();
    }

    // Send OTP via SMS (mock implementation)
    static async sendSMS(phone, otp, driverName = 'Driver') {
        try {
            // Mock SMS sending - in production, integrate with SMS service
            console.log(`\n📱 SMS to ${phone}:`);
            console.log(`Hi ${driverName}, your Tour & Travels login OTP is: ${otp}`);
            console.log(`This OTP will expire in 5 minutes.`);
            console.log(`Do not share this OTP with anyone.\n`);
            
            // In production, replace with actual SMS service:
            // const result = await smsService.send({
            //     to: phone,
            //     message: `Hi ${driverName}, your Tour & Travels login OTP is: ${otp}. This OTP will expire in 5 minutes. Do not share this OTP with anyone.`
            // });
            
            return {
                success: true,
                message: 'SMS sent successfully',
                provider: 'mock'
            };
        } catch (error) {
            console.error('SMS sending error:', error);
            return {
                success: false,
                message: 'Failed to send SMS',
                error: error.message
            };
        }
    }

    // Send OTP via Email (mock implementation)
    static async sendEmail(email, otp, driverName = 'Driver', type = 'login') {
        try {
            const subject = type === 'password_reset' ? 'Tour & Travels - Password Reset OTP' : 'Tour & Travels - Login OTP';
            const purpose = type === 'password_reset' ? 'reset your password' : 'login';
            const expiry = type === 'password_reset' ? '10 minutes' : '5 minutes';
            
            // Mock email sending - in production, integrate with email service
            console.log(`\n📧 Email to ${email}:`);
            console.log(`Subject: ${subject}`);
            console.log(`---`);
            console.log(`Hi ${driverName},\n`);
            console.log(`Your OTP to ${purpose} is: ${otp}\n`);
            console.log(`This OTP will expire in ${expiry}.\n`);
            console.log(`For security reasons, do not share this OTP with anyone.\n`);
            if (type === 'password_reset') {
                console.log(`If you didn't request a password reset, please ignore this email or contact support.\n`);
            } else {
                console.log(`If you didn't request this OTP, please ignore this email.\n`);
            }
            console.log(`Best regards,`);
            console.log(`Tour & Travels Team\n`);
            
            return {
                success: true,
                message: 'Email sent successfully',
                provider: 'mock'
            };
        } catch (error) {
            console.error('Email sending error:', error);
            return {
                success: false,
                message: 'Failed to send email',
                error: error.message
            };
        }
    }

    // Send OTP via SMS for password reset
    static async sendPasswordResetSMS(phone, otp, driverName = 'Driver') {
        try {
            // Mock SMS sending for password reset
            console.log(`\n📱 Password Reset SMS to ${phone}:`);
            console.log(`Hi ${driverName}, your Tour & Travels password reset OTP is: ${otp}`);
            console.log(`This OTP will expire in 10 minutes.`);
            console.log(`Do not share this OTP with anyone. If you didn't request this, ignore this message.\n`);
            
            return {
                success: true,
                message: 'Password reset SMS sent successfully',
                provider: 'mock'
            };
        } catch (error) {
            console.error('Password reset SMS sending error:', error);
            return {
                success: false,
                message: 'Failed to send password reset SMS',
                error: error.message
            };
        }
    }

    // Send password reset OTP via both SMS and Email
    static async sendPasswordResetOTP(phone, email, otp, driverName = 'Driver') {
        const results = {
            sms: null,
            email: null
        };

        // Send via SMS if phone number is provided
        if (phone) {
            results.sms = await this.sendPasswordResetSMS(phone, otp, driverName);
        }

        // Send via Email if email is provided  
        if (email) {
            results.email = await this.sendEmail(email, otp, driverName, 'password_reset');
        }

        // Check if at least one method succeeded
        const anySuccess = (results.sms?.success || results.email?.success);
        
        return {
            success: anySuccess,
            results,
            message: anySuccess ? 'Password reset OTP sent successfully' : 'Failed to send password reset OTP via any method'
        };
    }

    // Main method to send OTP (tries both SMS and Email)
    static async sendOTP(phone, email, otp, driverName = 'Driver') {
        const results = {
            sms: null,
            email: null
        };

        // Send via SMS if phone number is provided
        if (phone) {
            results.sms = await this.sendSMS(phone, otp, driverName);
        }

        // Send via Email if email is provided  
        if (email) {
            results.email = await this.sendEmail(email, otp, driverName);
        }

        // Check if at least one method succeeded
        const anySuccess = (results.sms?.success || results.email?.success);
        
        return {
            success: anySuccess,
            results,
            message: anySuccess ? 'OTP sent successfully' : 'Failed to send OTP via any method'
        };
    }

    // Validate OTP format
    static isValidOTPFormat(otp) {
        return /^\d{6}$/.test(otp);
    }

    // Check if OTP is expired
    static isOTPExpired(expiryDate) {
        return new Date() > expiryDate;
    }

    // Generate secure random OTP (alternative implementation)
    static generateSecureOTP(length = 6) {
        const digits = '0123456789';
        let otp = '';
        
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * digits.length)];
        }
        
        return otp;
    }
}

export default OTPService;