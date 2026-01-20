// server/index.js
require('dotenv').config();
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();

// Middleware
app.use(express.json());
app.use(cors()); // This allows React (port 3000) to talk to Node (port 5000)

// Configure the Email Transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS // This must be an App Password, not your login password
    }
});

// The Route React will call
app.post('/api/send-email', async (req, res) => {
    const { to, subject, text, html } = req.body;

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: to,
        subject: subject,
        text: text,
        html: html
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log(`✅ Email sent to ${to}`);
        res.status(200).send({ success: true, message: 'Email sent successfully' });
    } catch (error) {
        console.error('❌ Error sending email:', error);
        res.status(500).send({ success: false, error: error.message });
    }
});

// Start the Server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`🚀 Email Server running on port ${PORT}`);
});