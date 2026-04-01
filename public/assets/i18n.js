// =========================================
//  i18n — Language Apply (no visible toggle)
// =========================================

(function () {
  window.switchLanguage = function (lang) {
    function applyLang() {
      try {
        var elements = document.querySelectorAll('[data-en][data-es]');
        elements.forEach(function (el) {
          var val = el.getAttribute('data-' + lang);
          if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = val;
          } else if (el.tagName === 'A' && !el.children.length) {
            el.textContent = val;
          } else {
            el.innerHTML = val;
          }
        });
      } catch (e) {}

      var html = document.documentElement;
      if (html.getAttribute('data-en-title') && html.getAttribute('data-es-title')) {
        document.title = html.getAttribute('data-' + lang + '-title');
      }
      html.lang = lang;
      try { localStorage.setItem('preferredLanguage', lang); } catch (e) {}
    }

    applyLang();
  };

  // Apply saved preference on load (default: Spanish)
  var saved = 'es';
  try { saved = localStorage.getItem('preferredLanguage') || 'es'; } catch (e) {}
  window.switchLanguage(saved);
})();
