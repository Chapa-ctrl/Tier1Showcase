// Menu, gallery filter, lightbox, contact form, and scroll effects
document.documentElement.classList.add('js');

// ===== Footer year =====
document.querySelector('#year').textContent = new Date().getFullYear();

// ===== Sticky nav gets a shadow once you scroll =====
const nav = document.querySelector('.nav');
const updateNav = () => nav.classList.toggle('is-scrolled', window.scrollY > 40);
window.addEventListener('scroll', updateNav, { passive: true });
updateNav();

// ===== Mobile menu =====
const menuToggle = document.querySelector('.menu-toggle');
const menu = document.querySelector('#menu');

function setMenu(open) {
    menuToggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('is-open', open);
}

menuToggle.addEventListener('click', () => {
    setMenu(menuToggle.getAttribute('aria-expanded') !== 'true');
});
menu.addEventListener('click', event => {
    if (event.target.closest('a')) setMenu(false);
});
document.addEventListener('keydown', event => {
    if (event.key === 'Escape') setMenu(false);
});

// ===== Gallery filter =====
const filters = document.querySelectorAll('.filter');
const pieces = [...document.querySelectorAll('.piece')];

filters.forEach(button => {
    button.addEventListener('click', () => {
        const category = button.dataset.filter;
        filters.forEach(other => {
            const isActive = other === button;
            other.classList.toggle('is-active', isActive);
            other.setAttribute('aria-pressed', String(isActive));
        });
        pieces.forEach(piece => {
            piece.hidden = category !== 'all' && piece.dataset.category !== category;
        });
    });
});

// ===== Lightbox =====
const lightbox = document.querySelector('.lightbox');
const lightboxImage = lightbox.querySelector('img');
const lightboxTitle = lightbox.querySelector('#lightbox-title');
const lightboxMeta = lightbox.querySelector('.lb-meta');
let current = 0;

// Only step through the pieces the filter is showing
const visiblePieces = () => pieces.filter(piece => !piece.hidden);

function showPiece(piece) {
    const button = piece.querySelector('button');
    const image = piece.querySelector('img');
    lightboxImage.src = image.src;
    lightboxImage.alt = image.alt;
    lightboxTitle.textContent = button.dataset.title;
    lightboxMeta.textContent = button.dataset.meta;
    current = visiblePieces().indexOf(piece);
}

function step(direction) {
    const list = visiblePieces();
    showPiece(list[(current + direction + list.length) % list.length]);
}

pieces.forEach(piece => {
    piece.querySelector('button').addEventListener('click', () => {
        showPiece(piece);
        lightbox.showModal();
    });
});

lightbox.querySelector('.lb-close').addEventListener('click', () => lightbox.close());
lightbox.querySelector('.lb-prev').addEventListener('click', () => step(-1));
lightbox.querySelector('.lb-next').addEventListener('click', () => step(1));
lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft') step(-1);
    if (event.key === 'ArrowRight') step(1);
});
// Clicking the dark backdrop (outside the card) closes it
lightbox.addEventListener('click', event => {
    const box = lightbox.getBoundingClientRect();
    const outside = event.clientX < box.left || event.clientX > box.right ||
        event.clientY < box.top || event.clientY > box.bottom;
    if (outside) lightbox.close();
});

// ===== Contact form =====
// Sends the message to our server (/api/contact), which emails it on
const contactForm = document.querySelector('#contact-form');

if (contactForm) {
    const formStatus = contactForm.querySelector('.form-status');
    const sendButton = contactForm.querySelector('button[type="submit"]');
    let ticket = null;

    // The server's signed "this form was opened at" stamp. It is how the
    // server spots bots that send the form faster than a person could.
    async function getTicket() {
        try {
            const response = await fetch('/api/contact/ticket');
            ticket = (await response.json()).ticket;
        } catch (err) {
            ticket = null; // sending will still show an error the visitor can see
        }
    }
    getTicket();

    function showStatus(message, isError) {
        formStatus.textContent = message;
        formStatus.classList.toggle('is-error', isError);
    }

    contactForm.addEventListener('submit', async event => {
        event.preventDefault();
        if (!contactForm.reportValidity()) return; // the browser points at what's missing

        const body = Object.fromEntries(new FormData(contactForm));
        body.ticket = ticket;

        sendButton.disabled = true;
        sendButton.textContent = 'Sending...';
        showStatus('', false);
        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Could not send your message. Please try again.');

            contactForm.reset();
            showStatus('Thanks! Your message is on its way.', false);
            getTicket(); // a fresh ticket in case they send another
        } catch (err) {
            // fetch throws a TypeError when it can't reach the server at all
            showStatus(err instanceof TypeError ? 'Could not reach the site. Check your connection.' : err.message, true);
        } finally {
            sendButton.disabled = false;
            sendButton.textContent = 'Send message';
        }
    });
}

// ===== Fade sections in as they scroll into view =====
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
    });
}, { threshold: 0.15 });

document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));
