/* ==========================================================================
   PETANQUE MANAGER — Landing Page JavaScript
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // ---- NAVBAR SCROLL EFFECT ----
  const navbar = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');

  const handleScroll = () => {
    // Navbar background
    if (window.scrollY > 50) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }

    // Active nav link
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href') === '#' + current) {
        link.classList.add('active');
      }
    });
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  // ---- MOBILE NAV TOGGLE ----
  const navToggle = document.getElementById('navToggle');
  const navMenu = document.getElementById('navLinks');

  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navMenu.classList.toggle('open');
      const icon = navToggle.querySelector('i');
      if (navMenu.classList.contains('open')) {
        icon.className = 'fas fa-times';
      } else {
        icon.className = 'fas fa-bars';
      }
    });

    // Close menu on link click
    navMenu.querySelectorAll('.nav-link').forEach(link => {
      link.addEventListener('click', () => {
        navMenu.classList.remove('open');
        navToggle.querySelector('i').className = 'fas fa-bars';
      });
    });
  }

  // ---- PRICING TOGGLE (Monthly / Annual) ----
  const pricingToggle = document.getElementById('pricingToggle');
  const labelMensuel = document.getElementById('labelMensuel');
  const labelAnnuel = document.getElementById('labelAnnuel');
  let isAnnual = false;

  if (pricingToggle) {
    // Default: monthly active
    labelMensuel.classList.add('active');

    pricingToggle.addEventListener('click', () => {
      isAnnual = !isAnnual;
      pricingToggle.classList.toggle('active', isAnnual);
      labelMensuel.classList.toggle('active', !isAnnual);
      labelAnnuel.classList.toggle('active', isAnnual);

      // Toggle prices
      document.querySelectorAll('.price-monthly').forEach(el => {
        el.classList.toggle('hidden', isAnnual);
      });
      document.querySelectorAll('.price-annual').forEach(el => {
        el.classList.toggle('hidden', !isAnnual);
      });
      document.querySelectorAll('.price-annual-bonus').forEach(el => {
        el.classList.toggle('hidden', !isAnnual);
      });

      // Update plan codes on buttons (m <-> y)
      document.querySelectorAll('[data-plan-code]').forEach(btn => {
        const code = btn.getAttribute('data-plan-code');
        if (!code || code === 'event_7d') return; // Pass doesn't change
        if (isAnnual) {
          btn.setAttribute('data-plan-code', code.replace('_m', '_y'));
        } else {
          btn.setAttribute('data-plan-code', code.replace('_y', '_m'));
        }
      });
    });
  }

  // ---- FAQ ACCORDION ----
  const faqItems = document.querySelectorAll('.faq-item');

  faqItems.forEach(item => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');

      // Close all
      faqItems.forEach(faq => faq.classList.remove('open'));

      // Toggle current
      if (!isOpen) {
        item.classList.add('open');
      }
    });
  });

  // ---- CONTACT FORM ----
  const contactForm = document.getElementById('contactForm');
  const contactStatus = document.getElementById('contactStatus');

  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = document.getElementById('contactName').value.trim();
      const email = document.getElementById('contactEmail').value.trim();
      const message = document.getElementById('contactMessage').value.trim();

      if (!name || !email || !message) {
        contactStatus.textContent = 'Veuillez remplir tous les champs.';
        contactStatus.className = 'contact-status error';
        return;
      }

      const submitBtn = contactForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';

      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, message })
        });

        const data = await response.json();

        if (data.success) {
          contactStatus.textContent = 'Message envoy\u00e9 avec succ\u00e8s ! Nous vous r\u00e9pondrons sous 24\u201348h.';
          contactStatus.className = 'contact-status success';
          contactForm.reset();
        } else {
          contactStatus.textContent = data.error || 'Erreur lors de l\'envoi.';
          contactStatus.className = 'contact-status error';
        }
      } catch {
        contactStatus.textContent = 'Erreur r\u00e9seau. Veuillez r\u00e9essayer.';
        contactStatus.className = 'contact-status error';
      }

      submitBtn.disabled = false;
      submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Envoyer';
    });
  }

  // ---- LIGHTBOX (image zoom on click) ----
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightboxImg');
  const lightboxCaption = document.getElementById('lightboxCaption');
  const lightboxClose = document.getElementById('lightboxClose');
  const lightboxPrev = document.getElementById('lightboxPrev');
  const lightboxNext = document.getElementById('lightboxNext');
  const zoomables = document.querySelectorAll('.zoomable[data-lightbox-src]');
  let currentIndex = -1;
  const lightboxItems = [];

  // Build list of all zoomable images
  zoomables.forEach((el, i) => {
    lightboxItems.push({
      src: el.getAttribute('data-lightbox-src'),
      alt: el.getAttribute('data-lightbox-alt') || ''
    });

    el.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      openLightbox(i);
    });
  });

  function openLightbox(index) {
    if (index < 0 || index >= lightboxItems.length) return;
    currentIndex = index;
    const item = lightboxItems[index];
    lightboxImg.src = item.src;
    lightboxImg.alt = item.alt;
    lightboxCaption.textContent = item.alt;
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    updateNavButtons();
  }

  function closeLightbox() {
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
    currentIndex = -1;
  }

  function updateNavButtons() {
    lightboxPrev.style.display = currentIndex > 0 ? 'flex' : 'none';
    lightboxNext.style.display = currentIndex < lightboxItems.length - 1 ? 'flex' : 'none';
  }

  if (lightboxClose) {
    lightboxClose.addEventListener('click', (e) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  if (lightboxPrev) {
    lightboxPrev.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex > 0) openLightbox(currentIndex - 1);
    });
  }

  if (lightboxNext) {
    lightboxNext.addEventListener('click', (e) => {
      e.stopPropagation();
      if (currentIndex < lightboxItems.length - 1) openLightbox(currentIndex + 1);
    });
  }

  // Close on overlay click (outside the image)
  if (lightbox) {
    lightbox.addEventListener('click', (e) => {
      if (e.target === lightbox) closeLightbox();
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    if (currentIndex === -1) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft' && currentIndex > 0) openLightbox(currentIndex - 1);
    if (e.key === 'ArrowRight' && currentIndex < lightboxItems.length - 1) openLightbox(currentIndex + 1);
  });

  // ---- SCROLL REVEAL ANIMATIONS ----
  const animateElements = () => {
    const elements = document.querySelectorAll(
      '.feature-card, .screenshot-card, .pricing-card, .addon-card, .download-step, .faq-item'
    );

    elements.forEach(el => {
      if (!el.classList.contains('fade-in')) {
        el.classList.add('fade-in');
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    });

    elements.forEach(el => observer.observe(el));
  };

  animateElements();

  // ---- SMOOTH SCROLL for all anchor links ----
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', (e) => {
      const targetId = anchor.getAttribute('href');
      if (targetId === '#') return;

      const targetElement = document.querySelector(targetId);
      if (targetElement) {
        e.preventDefault();
        targetElement.scrollIntoView({ behavior: 'smooth' });
      }
    });
  });

  // ---- STRIPE CHECKOUT — Plan purchase buttons ----
  document.querySelectorAll('[data-plan-code]').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const planCode = btn.getAttribute('data-plan-code');
      if (!planCode) return;

      // Disable button while loading
      const originalText = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Redirection...';

      try {
        const payload = { plan_code: planCode };

        const res = await fetch('/api/stripe/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (data.url) {
          window.location.href = data.url;
        } else {
          alert(data.error || 'Erreur lors de la cr\u00e9ation de la session de paiement.');
          btn.disabled = false;
          btn.innerHTML = originalText;
        }
      } catch (err) {
        alert('Erreur r\u00e9seau. Veuillez r\u00e9essayer.');
        btn.disabled = false;
        btn.innerHTML = originalText;
      }
    });
  });
});
