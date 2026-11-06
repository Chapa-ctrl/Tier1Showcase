const express = require('express');

const router = express.Router();

// /about.html -> /about, /index.html -> /
// Keeps one address per page, so search engines don't see two copies.
// Add routes here for any page that needs more than a plain file.
router.get(/\.html$/, (req, res) => {
    let cleanPath = req.path.replace(/\.html$/, '').replace(/\/index$/, '/');
    cleanPath = cleanPath.replace(/^\/+/, '/'); // "//other-site.com" must stay on our site
    const query = req.originalUrl.slice(req.path.length);
    res.redirect(301, cleanPath + query);
});

module.exports = router;
