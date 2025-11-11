// Test script for password reset flow
import fetch from 'node-fetch';
import process from 'process';

const API_BASE = 'http://localhost:5000/api/driver/auth';

// Test data - make sure this driver exists in your database
const testDriver = {
    email: 'test.driver@email.com',
    phone: '+919876543210'
};

async function testPasswordResetFlow() {
    try {
        console.log('🧪 Testing Complete Password Reset Flow\n');

        // Step 1: Request Reset OTP
        console.log('📧 Step 1: Requesting password reset OTP...');
        const otpResponse = await fetch(`${API_BASE}/forgot-password/request-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testDriver.email,
                phone: testDriver.phone
            })
        });

        const otpData = await otpResponse.json();
        console.log('OTP Response:', JSON.stringify(otpData, null, 2));

        if (!otpData.success) {
            console.error('❌ Failed to request reset OTP:', otpData.message);
            return;
        }

        const resetOtp = otpData.otp;
        if (!resetOtp) {
            console.log('📝 Reset OTP not provided in response (production mode)');
            console.log('Please check server console for OTP');
            return;
        }

        console.log(`🔑 Received Reset OTP: ${resetOtp}\n`);

        // Step 2: Verify Reset OTP
        console.log('🔐 Step 2: Verifying reset OTP...');
        const verifyResponse = await fetch(`${API_BASE}/forgot-password/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testDriver.email,
                otp: resetOtp
            })
        });

        const verifyData = await verifyResponse.json();
        console.log('Verify Response:', JSON.stringify(verifyData, null, 2));

        if (!verifyData.success) {
            console.error('❌ Reset OTP verification failed:', verifyData.message);
            return;
        }

        const resetToken = verifyData.resetToken;
        console.log(`🎫 Received Reset Token: ${resetToken.substring(0, 50)}...\n`);

        // Step 3: Reset Password
        console.log('🔒 Step 3: Setting new password...');
        const resetResponse = await fetch(`${API_BASE}/reset-password`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                resetToken: resetToken,
                newPassword: 'newSecurePassword123!',
                confirmPassword: 'newSecurePassword123!'
            })
        });

        const resetData = await resetResponse.json();
        console.log('Reset Response:', JSON.stringify(resetData, null, 2));

        if (!resetData.success) {
            console.error('❌ Password reset failed:', resetData.message);
            return;
        }

        console.log('✅ Password reset completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
    testPasswordResetFlow();
}

export { testPasswordResetFlow };