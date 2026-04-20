// REALED, gedeelde JavaScript voor alle pagina's
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

  // Cookiebanner, minimal GDPR consent (noodzakelijk + statistiek + marketing)
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

// Google reCAPTCHA v2, enable submit pas na succesvolle captcha
// Callbacks zijn globaal (data-callback / data-expired-callback op de widget)
function onRecaptchaSuccess() {
  document.querySelectorAll('.submit-gated').forEach(function (btn) {
    btn.removeAttribute('disabled');
  });
}
function onRecaptchaExpired() {
  document.querySelectorAll('.submit-gated').forEach(function (btn) {
    btn.setAttribute('disabled', 'disabled');
  });
}

// Realed, AJAX form submission naar FormSubmit
// Voorkomt dat de gebruiker ooit de kale formsubmit.co URL ziet.
// Bij success: redirect naar _next. Bij fout (netwerk/adblock/down): in-page error met telefoonnummers.
(function () {
  document.addEventListener('DOMContentLoaded', function () {
    var forms = document.querySelectorAll('form[action^="https://formsubmit.co/"]');
    if (!forms.length) return;

    forms.forEach(function (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();

        var submitBtn = form.querySelector('button[type="submit"], input[type="submit"]');
        var originalBtnHtml = submitBtn ? submitBtn.innerHTML : '';
        if (submitBtn) {
          submitBtn.setAttribute('disabled', 'disabled');
          submitBtn.innerHTML = 'Bezig met verzenden...';
        }

        // Verwijder eerdere error
        var existingErr = form.querySelector('.form-error');
        if (existingErr) existingErr.remove();

        var nextInput = form.querySelector('input[name="_next"]');
        var nextUrl = nextInput && nextInput.value ? nextInput.value : 'bedankt.html';

        // Bouw AJAX endpoint: formsubmit.co/email -> formsubmit.co/ajax/email
        var ajaxAction = form.action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
        var formData = new FormData(form);

        fetch(ajaxAction, {
          method: 'POST',
          body: formData,
          headers: { 'Accept': 'application/json' }
        })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json().catch(function () { return {}; });
          })
          .then(function () {
            window.location.href = nextUrl;
          })
          .catch(function () {
            if (submitBtn) {
              submitBtn.removeAttribute('disabled');
              submitBtn.innerHTML = originalBtnHtml;
            }
            var errorBox = document.createElement('div');
            errorBox.className = 'form-error';
            errorBox.setAttribute('role', 'alert');
            errorBox.style.cssText = 'margin: 18px 0; padding: 14px 16px; background: #fef2f2; border: 1px solid #fecaca; border-radius: 10px; color: #991b1b; font-size: 0.92rem; line-height: 1.6;';
            errorBox.innerHTML = '<strong>Verzending niet gelukt.</strong> Probeer het opnieuw, of neem rechtstreeks contact op via <a href="tel:+3250321120" style="color:#991b1b; font-weight:600;">+32 50 32 11 20</a> · <a href="tel:+3256201986" style="color:#991b1b; font-weight:600;">+32 56 20 19 86</a> · <a href="mailto:info@realed.be" style="color:#991b1b; font-weight:600;">info@realed.be</a>.';
            if (submitBtn && submitBtn.parentNode) {
              submitBtn.parentNode.insertBefore(errorBox, submitBtn);
            } else {
              form.appendChild(errorBox);
            }
            // Reset reCAPTCHA zodat gebruiker opnieuw kan proberen
            if (window.grecaptcha && typeof window.grecaptcha.reset === 'function') {
              try { window.grecaptcha.reset(); } catch (e) {}
            }
          });
      });
    });
  });
})();

// Google Places Autocomplete, adres-autofill voor het contactformulier
// Callback wordt opgeroepen door de Maps JS API script tag (?callback=initRealedAutocomplete)
// Bindt op elk input-veld met attribuut data-places-autocomplete, beperkt tot BE.
// Parst het geselecteerde adres en vult de verborgen velden (#adres_straat, #adres_nummer,
// #adres_postcode, #adres_gemeente, #adres_land) zodat FormSubmit het gestructureerd doorstuurt.
function initRealedAutocomplete() {
  if (!(window.google && google.maps && google.maps.places)) return;

  var inputs = document.querySelectorAll('input[data-places-autocomplete]');
  inputs.forEach(function (input) {
    var ac = new google.maps.places.Autocomplete(input, {
      componentRestrictions: { country: ['be'] },
      fields: ['address_components', 'formatted_address', 'geometry'],
      types: ['address']
    });

    ac.addListener('place_changed', function () {
      var place = ac.getPlace();
      if (!place || !place.address_components) return;

      var parts = { route: '', street_number: '', postal_code: '', locality: '', country: '' };
      place.address_components.forEach(function (c) {
        c.types.forEach(function (t) {
          if (t in parts) parts[t] = c.long_name;
        });
      });

      var doc = document;
      function setVal(id, v) { var el = doc.getElementById(id); if (el) el.value = v || ''; }
      setVal('adres_straat',    parts.route);
      setVal('adres_nummer',    parts.street_number);
      setVal('adres_postcode',  parts.postal_code);
      setVal('adres_gemeente',  parts.locality);
      setVal('adres_land',      parts.country);

      // Toon het formatted_address in het zichtbare veld voor duidelijkheid
      if (place.formatted_address) input.value = place.formatted_address;
    });

    // Voorkom dat Enter op de autocomplete-dropdown het formulier submit
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        var pac = document.querySelector('.pac-container:not([style*="display: none"])');
        if (pac && pac.offsetHeight > 0) e.preventDefault();
      }
    });
  });
}
// Expose op window voor Maps callback
window.initRealedAutocomplete = initRealedAutocomplete;
