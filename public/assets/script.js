// =========================================
//  LÓGICA GLOBAL Y REUTILIZABLE
// =========================================

// Loading Screen
window.addEventListener('load', function() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }, 1000);
    }
});

// Inject Scroll Progress Bar
(function() {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.prepend(bar);
})();

// Inject Back to Top Button
(function() {
    const btn = document.createElement('button');
    btn.className = 'back-to-top';
    btn.innerHTML = '↑';
    btn.setAttribute('aria-label', 'Volver arriba');
    document.body.appendChild(btn);
    btn.addEventListener('click', function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });
})();

// Ensure mobile menu button exists on all pages
(function() {
    const nav = document.querySelector('nav');
    if (nav && !nav.querySelector('.mobile-menu-btn')) {
        const btn = document.createElement('button');
        btn.className = 'mobile-menu-btn';
        btn.textContent = '☰';
        nav.appendChild(btn);
    }
})();

// Combined Scroll Handler (header, progress bar, back-to-top)
(function() {
    var header = document.getElementById('header');
    var progressBar = document.querySelector('.scroll-progress');
    var backToTop = document.querySelector('.back-to-top');
    window.addEventListener('scroll', function() {
        var scrollY = window.scrollY;
        if (header) header.classList.toggle('scrolled', scrollY > 100);
        if (progressBar) {
            var docHeight = document.documentElement.scrollHeight - window.innerHeight;
            progressBar.style.width = (docHeight > 0 ? (scrollY / docHeight) * 100 : 0) + '%';
        }
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 300);
    });
})();

// Smooth Scrolling for anchor links with offset for fixed header
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        const href = this.getAttribute('href');
        if (href === '#') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        const target = document.querySelector(href);
        if (target) {
            const headerHeight = document.querySelector('header') ? document.querySelector('header').offsetHeight : 0;
            const targetPosition = target.getBoundingClientRect().top + window.scrollY - headerHeight - 20;
            window.scrollTo({ top: targetPosition, behavior: 'smooth' });
        }
    });
});

// Active Section Indicator (highlights nav link for visible section)
(function() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!sections.length || !navLinks.length) return;

    const sectionObserver = new IntersectionObserver(function(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.toggle('active', link.getAttribute('href') === '#' + id);
                });
            }
        });
    }, { threshold: 0.3, rootMargin: '-80px 0px -50% 0px' });

    sections.forEach(section => sectionObserver.observe(section));
})();

// Intersection Observer for fade-in animations
const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in-up');
        }
    });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.service-card, .area-card, .section-header, .expertise-content, .cta-content').forEach(el => {
    observer.observe(el);
});

// Google Analytics Event Tracking
function trackEvent(action, category, label) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'event_category': category,
            'event_label': label
        });
    }
}

// Mobile Menu (animated hamburger, outside click close, Escape key)
(function() {
    const menuBtn = document.querySelector('.mobile-menu-btn');
    const navLinks = document.querySelector('.nav-links');
    if (!menuBtn || !navLinks) return;

    menuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
    menuBtn.setAttribute('aria-expanded', 'false');

    function closeMenu() {
        navLinks.classList.remove('active');
        menuBtn.classList.remove('active');
        menuBtn.setAttribute('aria-expanded', 'false');
        menuBtn.setAttribute('aria-label', 'Abrir menú de navegación');
        menuBtn.textContent = '☰';
    }

    menuBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        const isOpen = navLinks.classList.toggle('active');
        menuBtn.classList.toggle('active', isOpen);
        menuBtn.setAttribute('aria-expanded', String(isOpen));
        menuBtn.setAttribute('aria-label', isOpen ? 'Cerrar menú' : 'Abrir menú de navegación');
        menuBtn.textContent = isOpen ? '✕' : '☰';
    });

    // Close on nav item click
    navLinks.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
        if (!navLinks.contains(e.target) && !menuBtn.contains(e.target)) {
            closeMenu();
        }
    });

    // Close on Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && navLinks.classList.contains('active')) {
            closeMenu();
            menuBtn.focus();
        }
    });
})();


// =========================================
//  LÓGICA ESPECÍFICA DE LA PÁGINA PRINCIPAL
// =========================================
if (document.querySelector('.portfolio')) {
    // Area cards expand/collapse (accordion)
    window.toggleArea = function(btn) {
        const card = btn.closest('.area-card');
        const panel = card.querySelector('.area-expanded');
        const isOpen = panel.classList.contains('open');

        // Close all panels first (accordion behavior)
        document.querySelectorAll('.area-expanded.open').forEach(p => {
            p.classList.remove('open');
            const otherBtn = p.closest('.area-card').querySelector('.area-pill-toggle');
            if (otherBtn) {
                const lang = document.documentElement.lang || 'es';
                otherBtn.textContent = otherBtn.getAttribute('data-' + lang) || otherBtn.getAttribute('data-es');
            }
        });

        // Toggle clicked panel
        if (!isOpen) {
            panel.classList.add('open');
            const lang = document.documentElement.lang || 'es';
            btn.textContent = lang === 'en' ? '▲ Close' : '▲ Cerrar';
        }
    };

    // Track CTA clicks
    document.querySelectorAll('.btn-primary, .btn-secondary, .btn-white, .btn-outline').forEach(btn => {
        btn.addEventListener('click', function() {
            trackEvent('click', 'CTA', this.textContent.trim());
        });
    });

    // Track area card branch clicks
    document.querySelectorAll('.branch-item').forEach(item => {
        item.addEventListener('click', function() {
            const title = this.querySelector('.branch-title').textContent;
            trackEvent('click', 'Project', title);
        });
    });
}
