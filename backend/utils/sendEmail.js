import nodemailer from 'nodemailer';
const sendEmail = async (to, subject, text, html) => {
    const emailUser = process.env.EMAIL_USER;
    const emailPass = process.env.EMAIL_PASS;
    // If email credentials are not configured, skip sending (don't throw)
    if (!emailUser || !emailPass) {
        console.warn('⚠️ Email credentials not configured. Skipping email sending.');
        return;
    }
    // Create a transporter using Gmail service
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailUser,
            pass: emailPass.replace(/\s/g, '')
        }
    });
    const mailOptions = {
        from: `Quiz App <${emailUser}>`,
        to: to,
        subject: subject,
        text: text,
        html: html
    };
    try {
        await transporter.sendMail(mailOptions);
    }
    catch (error) {
        console.error('Email sending failed:', error);
        // Don't throw - user signup should still succeed even if email fails
    }
};
export default sendEmail;
