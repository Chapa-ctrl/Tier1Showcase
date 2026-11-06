# Tier 1: Showcase template

A one-page website with a contact form that emails the business owner.
It runs on a small Node.js (Express) server. No database, no CMS.

The placeholder content is **Tidepool Print Studio**, a pretend risograph
studio. Everything you see is meant to be replaced with the client's brand.

**Accounts this tier needs:** GitHub, Render (Starter plan), and one email
service account (shared across all your clients, see [Email](#email)).

---

## What's inside

```
server.js              Starts the server: security, routes, static files
routes/
  contact.js           POST /api/contact: checks a message and emails it
  pages.js             /page.html -> /page redirects (add page routes here)
middleware/
  botCheck.js          Honeypot + time trap that block spam bots
  limiters.js          Rate limits (whole site, and 5 messages/hour)
  canonicalHost.js     Redirects onrender.com / www. to the real domain
  logger.js            Logs requests to the console and server.log
  errors.js            404 page and error handling
utils/
  mailer.js            Sends email with Nodemailer (settings from .env)
  validation.js        Checks contact form fields
public/
  index.html           The page
  404.html             "Page not found"
  css/site.css         All styles. Brand colors and fonts are at the top
  js/site.js           Menu, gallery, lightbox, contact form, scroll effects
  art/                 Placeholder SVG art (made by scripts/art.js)
scripts/
  test-email.js        npm run email:test: sends one test email
  art.js               npm run art: redraws the placeholder art
.env.example           Every setting, with notes. Copy to .env
render.yaml            Render Blueprint for one-click deploys
```

---

## 1. Run it on your laptop

You need Node.js 20 or newer.

```bash
npm install
cp .env.example .env
```

Open `.env` and set `FORM_SECRET` to a long random string. This makes one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Then start it:

```bash
npm run dev      # restarts by itself when you save a file
```

Open http://localhost:3000. Until email is set up, contact form messages
**print in the terminal** instead of being sent, so you can try the form
right away. (The form waits 2 seconds after the page loads before it will
accept a message. That is the bot check, not a bug.)

---

## 2. Email

The contact form sends email with [Nodemailer](https://nodemailer.com) over
SMTP. Every setting lives in `.env`, so changing email services never means
changing code.

### The setup we use: one account for every client

Set this up **once**, then reuse it for every client site.

1. Sign up for a transactional email service. Any of these work:

   | Service  | SMTP_HOST              | SMTP_PORT | SMTP_USER                 | SMTP_PASS          |
   |----------|------------------------|-----------|---------------------------|--------------------|
   | Resend   | `smtp.resend.com`      | 587       | `resend`                  | your API key       |
   | Brevo    | `smtp-relay.brevo.com` | 587       | your SMTP login           | an SMTP key        |
   | Postmark | `smtp.postmarkapp.com` | 587       | your Server API token     | the same token     |

   Check the service's own SMTP page when you sign up. Free plans and
   settings change over time.

2. **Verify your domain** (e.g. `dmhspwd.org`) in that service. It gives you
   a few DNS records (SPF, DKIM, sometimes DMARC). Add them wherever the
   domain's DNS is managed, then click Verify. This is what keeps the email
   out of spam.

3. For each client site, set:

   ```
   MAIL_FROM="Tidepool Website <forms@dmhspwd.org>"
   CONTACT_TO=owner@theirbusiness.com
   SITE_NAME=Tidepool Print Studio
   ```

   The email comes **from** your domain, goes **to** the client, and its
   **Reply-To** is the visitor. When the client clicks Reply, it goes
   straight to the visitor.

4. Test it:

   ```bash
   npm run email:test
   ```

   It logs in to the SMTP server (a wrong password or host shows up here)
   and sends one email to `CONTACT_TO`. Check the spam folder the first time.

### Later, if a client needs more

- **They want email from their own domain** (`forms@theirbusiness.com`):
  add their domain to your same email account, add its DNS records, and
  change `MAIL_FROM`. No code changes.
- **They outgrow the shared account, or should own it themselves:** they
  sign up for their own account, and you change the `SMTP_*` values.
  No code changes.

### Just testing quickly? Gmail works

Turn on 2-Step Verification for the Google account, create an
[App Password](https://myaccount.google.com/apppasswords), and use
`SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER=you@gmail.com`,
`SMTP_PASS=<the app password>`, `MAIL_FROM=you@gmail.com`. Fine for testing,
but not for client sites. It sends from a Gmail address and has daily limits.

---

## 3. Deploy to Render

1. Make a GitHub repo from this folder and push it. `.env` is in
   `.gitignore` and must never be committed.
2. In Render: **New → Blueprint**, pick the repo. Render reads `render.yaml`,
   makes a random `FORM_SECRET`, and asks for the rest of the settings.
   (Or **New → Web Service** with build `npm install`, start `npm start`,
   and add the settings from `.env.example` by hand. Set `NODE_ENV=production`.)
3. Use the **Starter** plan or higher. **Render's free plan blocks SMTP, so
   the contact form can't send from it.**
4. On the live site the server refuses to start if any email setting is
   missing, and the deploy log says which one.
5. Send yourself a message through the live form.

### Custom domain

1. In Render: the service's **Settings → Custom Domains**, add the domain
   (e.g. `theirbusiness.com` and `www.theirbusiness.com`).
2. Add the DNS records Render shows you at the domain registrar.
3. Once it works, set `CANONICAL_HOST=theirbusiness.com` in Render, so the
   `onrender.com` and `www.` addresses redirect to the real one.
4. In `public/robots.txt`, add the sitemap line if you make a sitemap.

---

## 4. Make it theirs (branding checklist)

- [ ] **Colors and fonts:** the `:root` block at the top of `public/css/site.css`.
      Change the font `<link>` in `index.html` and `404.html` to match.
- [ ] **Name and logo:** the `.logo` in the nav, `public/art/mark.svg`
      (also the browser tab icon), and the footer.
- [ ] **`<head>`:** `<title>`, `<meta name="description">`, and `theme-color`
      in `index.html` and `404.html`.
- [ ] **Content:** hero, marquee, gallery, about, events, contact details.
      Delete any section the client doesn't need, along with its nav link.
- [ ] **Images:** replace the SVGs in `public/art/` with the client's photos
      or art. Keep `alt` text that describes each image.
      (`npm run art` redraws the Tidepool placeholders and **overwrites**
      `public/art`, so stop using it once the art is the client's.)
- [ ] **Email:** `SITE_NAME`, `MAIL_FROM` and `CONTACT_TO` in Render.
- [ ] **Credit:** the "Site designed and built by" line in the footer.

---

## How the contact form protects itself

- **The browser never emails anyone.** It sends the message to our server,
  which checks it and sends the email. No email password ever reaches the page.
- **Honeypot:** a hidden `website` field. People never see it, but bots fill
  in every field, so a filled-in one means a bot.
- **Time trap:** when the page loads it gets a signed "ticket" with the time
  (`GET /api/contact/ticket`). Messages sent less than 2 seconds later are
  from bots. The ticket is signed with `FORM_SECRET`, so it can't be faked.
- Caught bots get a fake "success" so they don't learn they were caught.
  They're logged as `BOT BLOCKED` in the console and `server.log`.
- **Rate limit:** 5 messages per visitor per hour.
- **Plain-text email only,** so nothing a visitor types can become HTML,
  and line breaks are refused in the name (it goes in the subject line).

---

## Settings (`.env`)

| Name             | Needed          | What it is                                                     |
|------------------|-----------------|----------------------------------------------------------------|
| `FORM_SECRET`    | Always          | Long random string that signs the bot-check ticket             |
| `SMTP_HOST`      | Live site       | Email service's SMTP server                                    |
| `SMTP_PORT`      | Optional        | `587` (default) or `465`                                       |
| `SMTP_USER`      | Live site       | SMTP username                                                  |
| `SMTP_PASS`      | Live site       | SMTP password or API key. Secret                               |
| `MAIL_FROM`      | Live site       | Sender, on a verified domain: `Name <forms@yourdomain.org>`    |
| `CONTACT_TO`     | Live site       | Where messages go. Commas for more than one                    |
| `SITE_NAME`      | Recommended     | Business name, used in email subjects                          |
| `CANONICAL_HOST` | Live site       | The real domain, no `https://`                                 |
| `NODE_ENV`       | Live site       | `production` (render.yaml sets it)                             |
| `PORT`           | Laptop only     | Render sets its own                                            |
