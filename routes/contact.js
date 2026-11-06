const express = require('express');
const { contactLimiter } = require('../middleware/limiters');
const { botCheck, makeTicket } = require('../middleware/botCheck');
const { validateContact } = require('../utils/validation');
const { writeLog } = require('../middleware/logger');
const { sendMail } = require('../utils/mailer');

const router = express.Router();

const SITE_NAME = process.env.SITE_NAME || 'your website';

// GET /api/contact/ticket (mounted at /api/contact in server.js)
// The page asks for this when it loads. It starts the bot-check clock.
router.get('/ticket', (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.json({ ticket: makeTicket() });
});

// POST /api/contact  { name, email, phone, message, ticket, website }
// The browser only ever talks to us. We check the message, then email it
// to the site owner (CONTACT_TO).
router.post('/', contactLimiter, botCheck, async (req, res) => {
    const error = validateContact(req.body);
    if (error) {
        return res.status(400).json({ error });
    }

    // Only the fields we checked are sent, trimmed, in a fixed order
    const name = req.body.name.trim();
    const email = req.body.email.trim();
    const phone = req.body.phone?.trim() || '(none)';
    const message = req.body.message.trim();

    try {
        await sendMail({
            // The email comes FROM the site (MAIL_FROM). Pretending it came
            // from the visitor would land it in spam. "Reply" still goes to them.
            replyTo: { name, address: email },
            subject: `New message from ${SITE_NAME}: ${name}`,
            // Plain text only, so nothing a visitor types can become HTML
            text: [
                `Name:  ${name}`,
                `Email: ${email}`,
                `Phone: ${phone}`,
                '',
                message,
                '',
                `-- Sent from the contact form on ${SITE_NAME}. Hit Reply to answer ${name}.`
            ].join('\n')
        });
    } catch (err) {
        writeLog(`[${new Date().toISOString()}] EMAIL ERROR: ${err.message}`);
        return res.status(502).json({ error: 'Could not send your message. Please try again later.' });
    }

    res.status(201).json({ success: true });
});

module.exports = router;
