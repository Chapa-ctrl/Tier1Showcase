require('dotenv').config({ quiet: true });

const isProduction = process.env.NODE_ENV === 'production';

// Stop immediately if any required setting is missing
const REQUIRED_ENV = ['FORM_SECRET'];
for (const name of REQUIRED_ENV) {
    if (!process.env[name]) {
        console.error(`Missing ${name} in .env (or in Render's Environment settings)`);
        process.exit(1);
    }
}

const path = require('path');
const express = require('express');
const helmet = require('helmet');

const { canonicalHost } = require('./middleware/canonicalHost');
const { requestLogger } = require('./middleware/logger');
const { limiter } = require('./middleware/limiters');
const { notFound, errorHandler } = require('./middleware/errors');
const { emailReady, missingEmailSettings } = require('./utils/mailer');
const pagesRouter = require('./routes/pages');
const contactRouter = require('./routes/contact');

// On a laptop the contact form prints messages to the terminal. On the
// live site they have to really send, so don't start without email.
if (!emailReady) {
    const message = `Email is not set up. Missing: ${missingEmailSettings.join(', ')}`;
    if (isProduction) {
        console.error(`${message} (in Render's Environment settings)`);
        process.exit(1);
    }
    console.warn(`${message}. Contact form messages will print here instead.`);
}

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// ===== 1. Security and parsing =====
// Trust the X-Forwarded-For header set by hosts like Render, so the rate
// limiter sees each visitor's real IP instead of the proxy's
app.set('trust proxy', 1);
app.use(canonicalHost);
app.use(helmet());
app.use(express.json({ limit: '20kb' }));
app.use(requestLogger);
app.use(limiter);

// ===== 2. Routes =====
app.use(pagesRouter);
app.use('/api/contact', contactRouter); // public: the contact form

// ===== 3. Static files, then errors =====
// `extensions: ['html']` lets /about find about.html without the extension
// Pages, scripts and styles change together when we deploy. "no-cache" makes
// browsers check for a newer copy every time (a quick "still the same" reply
// when nothing changed), so nobody gets a new page running an old script.
// Images can still be cached.
app.use(express.static(PUBLIC_DIR, {
    extensions: ['html'],
    setHeaders: (res, filePath) => {
        if (/\.(html|js|css)$/.test(filePath)) {
            res.setHeader('Cache-Control', 'no-cache');
        }
    }
}));
app.use(notFound);
app.use(errorHandler);

// ===== 4. Start =====
// Express 5 passes startup errors (like a port already in use) here
// instead of crashing, so report them instead of claiming success
app.listen(PORT, (err) => {
    if (err) {
        console.error(`Could not start the server: ${err.message}`);
        process.exit(1);
    }
    console.log(`Server live on http://localhost:${PORT}`);
});
