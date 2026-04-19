// REALED — gedeelde JavaScript voor alle pagina's
// Mobile menu toggle + header shadow on scroll

(function () {
  // Mobile menu toggle
  const toggle = document.querySelector('.menu-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      const willOpen = !menu.classList.contains('open');
      menu.classList.toggle('open');
      document.body.classList.toggle('menu-open', willOpen);
      toggle.setAttribute('aria-expanded', willOpen);
    });
    // Close on link click
    menu.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        menu.classList.remove('open');
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        menu.classList.remove('open');
        document.body.classList.remove('menu-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // Header shadow on scroll
  const header = document.querySelector('.site-header');
  if (header) {
    let ticking = false;
    window.addEventListener('scroll', function () {
      if (!ticking) {
        requestAnimationFrame(function () {
          if (window.scrollY > 8) header.classList.add('scrolled');
          else header.classList.remove('scrolled');
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  // Cookiebanner — minimal GDPR consent (noodzakelijk + statistiek + marketing)
  // Persisted in localStorage as "realed_consent" JSON: {necessary:true, stats:bool, marketing:bool, v:1, ts:ISO}
  (function () {
    const LS_KEY = 'realed_consent';
    const VERSION = 1;

    function getConsent() {
      try {
        const raw = localStorage.getItem(LS_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.v !== VERSION) return null;
        return parsed;
      } catch (e) { return null; }
    }
    function setConsent(c) {
      c.v = VERSION;
      c.ts = new Date().toISOString();
      try { localStorage.setItem(LS_KEY, JSON.stringify(c)); } catch (e) {}
    }

    function build() {
      const wrap = document.createElement('div');
      wrap.className = 'cookie-banner';
      wrap.setAttribute('role', 'dialog');
      wrap.setAttribute('aria-label', 'Cookievoorkeuren');
      wrap.innerHTML = [
        '<div class="cb-inner">',
        '  <div class="cb-text">',
        '    <strong>Cookies op realed.be</strong>',
        '    <p>We gebruiken cookies die nodig zijn voor de werking van de site. Met uw toestemming zetten we bijkomende statistiek- of marketingcookies. Zie <a href="cookies.html">ons cookiebeleid</a> voor detail.</p>',
        '  </div>',
        '  <div class="cb-actions">',
        '    <button type="button" class="btn btn-ghost" data-cb="reject">Alleen noodzakelijke</button>',
        '    <button type="button" class="btn btn-primary" data-cb="accept">Accepteren</button>',
        '  </div>',
        '</div>'
      ].join('');
      document.body.appendChild(wrap);
      requestAnimationFrame(function () { wrap.classList.add('open'); });

      wrap.querySelector('[data-cb="accept"]').addEventListener('click', function () {
        setConsent({ necessary: true, stats: true, marketing: true });
        close();
      });
      wrap.querySelector('[data-cb="reject"]').addEventListener('click', function () {
        setConsent({ necessary: true, stats: false, marketing: false });
        close();
      });

      function close() {
        wrap.classList.remove('open');
        setTimeout(function () { wrap.remove(); }, 220);
      }
    }

    // Public API: reopen from /cookies.html
    window.ReallyCookieBanner = {
      open: function () {
        try { localStorage.removeItem(LS_KEY); } catch (e) {}
        // remove existing then rebuild
        const existing = document.querySelector('.cookie-banner');
        if (existing) existing.remove();
        build();
      },
      get: getConsent
    };

    if (!getConsent()) {
      // Build after idle so it does not block first paint
      if ('requestIdleCallback' in window) {
        requestIdleCallback(build, { timeout: 800 });
      } else {
        setTimeout(build, 400);
      }
    }
  })();

  // File-upload: toon bestandsnaam na selectie (job-*.html)
  document.querySelectorAll('.file-upload input[type="file"]').forEach(function (input) {
    input.addEventListener('change', function () {
      const wrap = input.closest('.file-upload');
      const targetSel = input.getAttribute('data-filename-target');
      const target = targetSel ? wrap.querySelector(targetSel) : null;
      if (input.files && input.files.length) {
        const f = input.files[0];
        const sizeKB = Math.round(f.size / 1024);
        const sizeText = sizeKB > 1024 ? (sizeKB / 1024).toFixed(1) + ' MB' : sizeKB + ' KB';
        if (target) target.textContent = f.name + ' · ' + sizeText;
        wrap.setAttribute('data-has-file', 'true');
      } else {
        if (target) target.textContent = '';
        wrap.removeAttribute('data-has-file');
      }
    });
  });

  // News category filter (nieuws.html)
  const filterButtons = document.querySelectorAll('.news-filter button');
  if (filterButtons.length) {
    const featured = document.querySelector('.news-featured[data-category]');
    const cards = document.querySelectorAll('.news-card[data-category]');

    filterButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        // toggle active state
        filterButtons.forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');

        const filter = btn.getAttribute('data-filter');

        // featured: hide unless 'all' or matches category
        if (featured) {
          const show = (filter === 'all') || (featured.getAttribute('data-category') === filter);
          featured.style.display = show ? '' : 'none';
        }

        // grid cards: hide when category does not match
        cards.forEach(function (card) {
          const show = (filter === 'all') || (card.getAttribute('data-category') === filter);
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }
})();
