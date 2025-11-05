// Mock notification service
// In production, integrate with SMS gateway, email service, and push notification service

export const sendOTP = async (phone, otp) => {
  try {
    // Mock SMS sending
    console.log(`SMS sent to ${phone}: Your OTP is ${otp}`);
    
    // In production, use services like Twilio, AWS SNS, or local SMS gateway
    // const response = await twilioClient.messages.create({
    //   body: `Your OTP for Tour & Travels is: ${otp}. Valid for 10 minutes.`,
    //   from: process.env.TWILIO_PHONE_NUMBER,
    //   to: phone
    // });
    
    return { success: true, messageId: 'mock_sms_id' };
  } catch (error) {
    console.error('SMS sending error:', error);
    throw new Error('Failed to send SMS');
  }
};

export const sendEmail = async (email, subject, message) => {
  try {
    // Mock email sending
    console.log(`Email sent to ${email}: ${subject} - ${message}`);
    
    // In production, use services like SendGrid, AWS SES, or Nodemailer
    // const msg = {
    //   to: email,
    //   from: process.env.FROM_EMAIL,
    //   subject: subject,
    //   text: message,
    //   html: `<p>${message}</p>`
    // };
    // await sgMail.send(msg);
    
    return { success: true, messageId: 'mock_email_id' };
  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send email');
  }
};

export const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  try {
    // Mock push notification
    console.log(`Push notification sent to ${fcmToken}: ${title} - ${body}`);
    
    // In production, use Firebase Cloud Messaging
    // const message = {
    //   notification: {
    //     title: title,
    //     body: body
    //   },
    //   data: data,
    //   token: fcmToken
    // };
    // const response = await admin.messaging().send(message);
    
    return { success: true, messageId: 'mock_push_id' };
  } catch (error) {
    console.error('Push notification error:', error);
    throw new Error('Failed to send push notification');
  }
};