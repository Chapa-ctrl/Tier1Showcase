const crypto = require('crypto');
const { writeLog } = require('./logger');

const MIN_FILL_TIME = 2000;                // 2 seconds, in milliseconds
const MAX_FORM_AGE = 24 * 60 * 60 * 1000;  // a ticket is good for a day

// The time trap needs to know when the form was opened. Without a login
// session to keep that in, the server hands the page a "ticket": the time,
// plus a signature made with FORM_SECRET. Only the server can make a valid
// signature, so a bot can't just write in an older time.
function sign(time) {
    return crypto.createHmac('sha256', process.env.FORM_SECRET).update(time).digest('hex');
}

// Looks like "1767225600000.3f9a...". Sent by GET /api/contact/ticket.
function makeTicket() {
    const time = String(Date.now());
    return `${time}.${sign(time)}`;
}

// How long ago the ticket was made, in milliseconds, or null if it is
// missing or fake
function ticketAge(ticket) {
    if (typeof ticket !== 'string') return null;
    const [time, signature] = ticket.split('.');
    if (!/^\d{13}$/.test(time) || !/^[0-9a-f]{64}$/.test(signature || '')) return null;

    // timingSafeEqual takes the same time whether the first or last
    // character is wrong, so guessing one character at a time doesn't work
    const expected = Buffer.from(sign(time), 'hex');
    if (!crypto.timingSafeEqual(expected, Buffer.from(signature, 'hex'))) return null;
    return Date.now() - Number(time);
}

// Writes a note about a caught bot to the console and server.log.
// Inside a router, req.path is only the part after the mount point ("/"),
// so req.originalUrl is used to log the full address.
function logBot(req, reason) {
    writeLog(`[${new Date().toISOString()}] BOT BLOCKED (${reason}) from ${req.ip} on ${req.originalUrl}`);
}

// Blocks bot submissions using a honeypot and a time trap.
// Bots get a fake "success" so they don't learn they were caught.
function botCheck(req, res, next) {
    // Check 1: the honeypot. Humans leave it empty.
    if (req.body.website) {
        logBot(req, 'honeypot filled');
        return res.status(201).json({});
    }

    // Check 2: the time trap. Humans need more than 2 seconds.
    const age = ticketAge(req.body.ticket);
    if (age === null || age < MIN_FILL_TIME) {
        logBot(req, age === null ? 'no valid ticket' : 'submitted too fast');
        return res.status(201).json({});
    }

    // A person who left the tab open overnight. Tell them, don't drop it.
    if (age > MAX_FORM_AGE) {
        return res.status(400).json({ error: 'This page has been open a long time. Please refresh it and send again.' });
    }

    next(); // passed both checks
}

module.exports = { botCheck, makeTicket };
