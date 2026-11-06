// Sends email with Nodemailer over SMTP. Every setting comes from .env,
// so switching email services (Resend, Brevo, Postmark, Gmail...) means
// changing .env, not this file. See "Email" in README.md.
const nodemailer = require('nodemailer');

const EMAIL_SETTINGS = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'MAIL_FROM', 'CONTACT_TO'];
const missingEmailSettings = EMAIL_SETTINGS.filter(name => !process.env[name]);
const emailReady = missingEmailSettings.length === 0;

const port = Number(process.env.SMTP_PORT) || 587;

// Without settings (on a laptop, before email is set up), messages are
// printed to the terminal instead of sent, so the form can still be tried.
// server.js refuses to start in production without them.
const transporter = emailReady
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465, // 465 is encrypted from the start; 587 upgrades with STARTTLS
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
        // Give up after 10 seconds instead of leaving the visitor waiting
        connectionTimeout: 10000,
        greetingTimeout: 10000,
        socketTimeout: 10000
    })
    : nodemailer.createTransport({ jsonTransport: true });

// Sends to CONTACT_TO from MAIL_FROM. Pass subject, text, and replyTo.
// CONTACT_TO can be several addresses, separated by commas.
async function sendMail(message) {
    const info = await transporter.sendMail({
        from: process.env.MAIL_FROM || 'Website <website@localhost>',
        to: process.env.CONTACT_TO || 'owner@localhost',
        ...message
    });
    if (!emailReady) {
        console.log('Email is not set up yet, so here is what would have been sent:');
        console.log(JSON.parse(info.message));
    }
    return info;
}

module.exports = { sendMail, transporter, emailReady, missingEmailSettings };
