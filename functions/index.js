const functions = require('firebase-functions');
const admin = require('firebase-admin');
const nodemailer = require('nodemailer');

admin.initializeApp();

// Email configuration
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: functions.config().email.user,
        pass: functions.config().email.pass
    }
});

// Newsletter verification
exports.sendVerificationEmail = functions.https.onCall(async (data, context) => {
    const { email } = data;
    
    const mailOptions = {
        from: 'Your Name <your-email@gmail.com>',
        to: email,
        subject: 'Verify your subscription',
        html: `
            <h2>Thank you for subscribing!</h2>
            <p>Please click the link below to verify your email:</p>
            <a href="https://your-domain.com/verify?token=${verificationToken}">
                Verify Email
            </a>
        `
    };

    await transporter.sendMail(mailOptions);
});

// Contact form notification
exports.sendContactNotification = functions.https.onCall(async (data, context) => {
    const { name, email, message } = data;
    
    const mailOptions = {
        from: 'Your Website <your-email@gmail.com>',
        to: 'your-email@gmail.com',
        subject: 'New Contact Form Submission',
        html: `
            <h2>New Contact Message</h2>
            <p><strong>From:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `
    };

    await transporter.sendMail(mailOptions);
}); 