const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // Check if email credentials are configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || 
        process.env.EMAIL_USER === 'your_email@gmail.com' || 
        process.env.EMAIL_PASS === 'your_app_password_here') {
        
        // For development/testing, log the email content instead of sending
        console.log('=== EMAIL SIMULATION (No email credentials configured) ===');
        console.log('To:', options.to);
        console.log('Subject:', options.subject);
        console.log('HTML:', options.html);
        console.log('========================================================');
        
        // Return success to allow the password reset flow to continue
        return;
    }

    // Create a transporter using Gmail (you can change this to any email service)
    const transporter = nodemailer.createTransporter({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.error('Email error:', error);
        throw new Error('Email could not be sent');
    }
};

module.exports = sendEmail;
