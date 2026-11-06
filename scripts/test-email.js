// Checks the email settings in .env by sending one real test email to
// CONTACT_TO. Run with: npm run email:test
require('dotenv').config({ quiet: true });

const { transporter, sendMail, emailReady, missingEmailSettings } = require('../utils/mailer');

async function main() {
    if (!emailReady) {
        console.error(`Missing in .env: ${missingEmailSettings.join(', ')}`);
        process.exit(1);
    }

    // verify() logs in to the SMTP server without sending anything, so a
    // wrong password or host shows up here with a clear message
    await transporter.verify();
    console.log(`Logged in to ${process.env.SMTP_HOST}`);

    await sendMail({
        subject: `Test email from ${process.env.SITE_NAME || 'your website'}`,
        text: 'If you can read this, the contact form can send email.'
    });
    console.log(`Sent a test email to ${process.env.CONTACT_TO}. Check that inbox (and its spam folder).`);
}

main().catch((err) => {
    console.error('Email test failed:', err.message);
    process.exit(1);
});
