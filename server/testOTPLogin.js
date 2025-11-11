// Test script for OTP-based driver login
// Run with: node testOTPLogin.js

import fetch from 'node-fetch';
import process from 'process';

const API_BASE = 'http://localhost:5000/api/driver/auth';

// Test data
const testDriver = {
    email: 'test.driver@email.com',
    phone: '+919876543210'
};

async function testOTPLogin() {
    try {
        console.log('🧪 Testing OTP-based Driver Login Flow\n');

        // Step 1: Request OTP
        console.log('📱 Step 1: Requesting OTP...');
        const otpResponse = await fetch(`${API_BASE}/login/request-otp`, {
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
            console.error('❌ Failed to request OTP:', otpData.message);
            return;
        }

        console.log('✅ OTP requested successfully');
        
        // Extract OTP (only available in development mode)
        const otp = otpData.otp;
        if (!otp) {
            console.log('📝 OTP not provided in response (production mode)');
            console.log('Please check server console for OTP or enter manually:');
            return;
        }

        console.log(`🔑 Received OTP: ${otp}\n`);

        // Step 2: Verify OTP and Login
        console.log('🔐 Step 2: Verifying OTP and logging in...');
        const loginResponse = await fetch(`${API_BASE}/login/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testDriver.email,
                otp: otp
            })
        });

        const loginData = await loginResponse.json();
        console.log('Login Response:', JSON.stringify(loginData, null, 2));

        if (!loginData.success) {
            console.error('❌ Login failed:', loginData.message);
            return;
        }

        console.log('✅ Login successful!');
        console.log('🎫 JWT Token:', loginData.token);
        console.log('👤 Driver Info:', loginData.driver.name, '-', loginData.driver.email);
        console.log('📊 KYC Status:', loginData.driver.kycStatus);

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Test rate limiting
async function testRateLimit() {
    try {
        console.log('\n🚦 Testing Rate Limiting...');
        
        // Make multiple rapid requests
        for (let i = 1; i <= 3; i++) {
            console.log(`Request ${i}:`);
            const response = await fetch(`${API_BASE}/login/request-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: testDriver.email
                })
            });
            
            const data = await response.json();
            console.log(`Status: ${response.status}, Message: ${data.message}\n`);
            
            if (i < 3) await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        }
        
    } catch (error) {
        console.error('Rate limit test failed:', error.message);
    }
}

// Test invalid OTP
async function testInvalidOTP() {
    try {
        console.log('\n🔍 Testing Invalid OTP...');
        
        // Request OTP first
        await fetch(`${API_BASE}/login/request-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testDriver.email
            })
        });

        // Try with invalid OTP
        const response = await fetch(`${API_BASE}/login/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: testDriver.email,
                otp: '123456' // Wrong OTP
            })
        });

        const data = await response.json();
        console.log('Invalid OTP Response:', JSON.stringify(data, null, 2));
        
    } catch (error) {
        console.error('Invalid OTP test failed:', error.message);
    }
}

// Run tests
async function runAllTests() {
    console.log('🚀 Starting OTP Login Tests...\n');
    
    await testOTPLogin();
    await testRateLimit();
    await testInvalidOTP();
    
    console.log('\n✅ All tests completed!');
}

// Check if script is run directly
if (import.meta.url === `file://${process.argv[1]}`) {
    runAllTests();
}

export { testOTPLogin, testRateLimit, testInvalidOTP };