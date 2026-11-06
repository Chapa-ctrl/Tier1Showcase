const rateLimit = require('express-rate-limit');

// Every request: 100 per 10 seconds, per visitor
const limiter = rateLimit({
    windowMs: 10 * 1000,
    limit: 100,
    message: '<h1>429 Too Many Requests</h1><p>Please wait 10 seconds.</p>'
});

// Contact form: 5 per hour, so no one can flood the owner's inbox
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    message: { error: 'Too many messages sent. Please wait an hour and try again.' }
});

module.exports = { limiter, contactLimiter };
