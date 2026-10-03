/**
 * Toitures Boréal - Auto Iframe Resizer for WordPress & Elementor
 * Handles dynamic height adjustment and smooth scroll interactions between Next.js iframe and WordPress.
 */
(function () {
  'use strict';

  function initBorealResizer() {
    window.addEventListener('message', function (event) {
      if (!event.data || typeof event.data !== 'object') {
        return;
      }

      // Handle automatic height adjustment
      if (event.data.type === 'BOREAL_RESIZE' && typeof event.data.height === 'number') {
        var iframes = document.querySelectorAll('.boreal-estimateur-iframe');
        var newHeight = Math.ceil(event.data.height);

        if (newHeight > 200) {
          iframes.forEach(function (iframe) {
            iframe.style.height = newHeight + 'px';
          });
        }
      }

      // Handle smooth scroll to top of iframe on step navigation
      if (event.data.type === 'BOREAL_SCROLL_TOP') {
        var firstIframe = document.querySelector('.boreal-estimateur-iframe');
        if (firstIframe) {
          var rect = firstIframe.getBoundingClientRect();
          var scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          var targetY = rect.top + scrollTop - 80; // 80px offset for WordPress header / sticky navbar

          window.scrollTo({
            top: Math.max(0, targetY),
            behavior: 'smooth'
          });
        }
      }
    });

    // Send a ping to the iframe once loaded
    var iframes = document.querySelectorAll('.boreal-estimateur-iframe');
    iframes.forEach(function (iframe) {
      iframe.addEventListener('load', function () {
        try {
          if (iframe.contentWindow) {
            iframe.contentWindow.postMessage({ type: 'BOREAL_PARENT_READY' }, '*');
          }
        } catch (e) {
          // Ignore cross-origin warnings on ping
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBorealResizer);
  } else {
    initBorealResizer();
  }
})();
