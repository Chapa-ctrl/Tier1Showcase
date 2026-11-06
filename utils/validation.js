// Checks for anything people send us. Each returns an error message,
// or null if the input is fine.

// A contact form message. Name, email and message are required; phone is
// optional but must still look like a phone number if it is sent.
function validateContact({ name, email, phone, message }) {
    for (const value of [name, email, message]) {
        if (typeof value !== 'string') return 'Name, email and message are required.';
    }
    if (phone !== undefined && typeof phone !== 'string') {
        return 'Every field must be text.';
    }
    // The name goes in the email's subject line, so no line breaks
    if (name.trim().length < 1 || name.trim().length > 80 || /[\r\n]/.test(name)) {
        return 'Name must be 1 to 80 characters.';
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
        return 'Please enter a valid email address.';
    }
    if (phone && (phone.trim().length > 30 || !/^[0-9+().\-\s]*$/.test(phone.trim()))) {
        return 'Phone number can only have numbers, spaces, and + ( ) - .';
    }
    if (message.trim().length < 10 || message.trim().length > 2000) {
        return 'Message must be 10 to 2000 characters.';
    }
    return null;
}

module.exports = { validateContact };
