(function () {
  const OVERLAY_SELECTORS = [
    '.game-menu',
    '.mode-selector-overlay',
    '.start-screen',
    '.loading-overlay'
  ];

  function injectStylesIfMissing() {
    if (document.getElementById('popup-exit-btn-styles')) return;
    const style = document.createElement('style');
    style.id = 'popup-exit-btn-styles';
    style.textContent = `
      .popup-exit-btn {
        position: absolute;
        top: 10px;
        right: 10px;
        width: 44px;
        height: 44px;
        border-radius: 50%;
        border: 2px solid var(--exit-btn-border, rgba(0, 255, 255, 0.5));
        background: var(--exit-btn-bg, rgba(0, 255, 255, 0.2));
        color: var(--exit-btn-fg, #fff);
        font-size: 18px;
        line-height: 1;
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        z-index: 2147483647;
        box-shadow: 0 6px 20px var(--exit-btn-shadow, rgba(0, 255, 255, 0.35));
        backdrop-filter: blur(6px);
        transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease, border-color 0.2s ease;
      }
      .popup-exit-btn:hover {
        transform: scale(1.12);
        background: var(--exit-btn-hover-bg, rgba(0, 255, 255, 0.35));
        border-color: var(--exit-btn-hover-border, #00ffff);
        box-shadow: 0 10px 28px var(--exit-btn-hover-shadow, rgba(0, 255, 255, 0.5));
      }
      .popup-exit-btn:active {
        transform: scale(1.04);
      }
      .popup-exit-btn:focus { outline: none; }
    `;
    document.head.appendChild(style);
  }

  function isHiddenByClass(element) {
    return element.classList && element.classList.contains('hidden');
  }

  function isVisible(element) {
    if (!element || !(element instanceof Element)) return false;
    const style = getComputedStyle(element);
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
    if (isHiddenByClass(element)) return false;
    return true;
  }

  function hasAnyCloseButton(element) {
    return !!element.querySelector('.popup-exit-btn, .close-btn, [data-popup-exit]');
  }

  function closeOverlay(element) {
    if (!element) return false;
    // Prefer class-based hide to respect page logic
    if (element.classList.contains('game-menu') || element.classList.contains('start-screen')) {
      element.classList.add('hidden');
      return true;
    }
    // mode selector overlay
    if (element.classList.contains('mode-selector-overlay')) {
      element.style.display = 'none';
      return true;
    }
    // generic fallbacks (e.g., loading-overlay)
    element.style.display = 'none';
    return true;
  }

  function addExitButtonTo(element) {
    if (!element || hasAnyCloseButton(element)) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'popup-exit-btn';
    button.setAttribute('aria-label', '关闭弹窗');
    button.setAttribute('title', '关闭');
    button.setAttribute('data-popup-exit', 'true');
    button.textContent = '✕';
    button.addEventListener('click', function (event) {
      event.preventDefault();
      event.stopPropagation();
      closeOverlay(element);
    });
    // Ensure the container can position the button correctly
    const computed = getComputedStyle(element);
    if (computed.position === 'static') {
      element.style.position = 'relative';
    }
    element.appendChild(button);
  }

  function ensurePopupExitButtons(root) {
    const scope = root && root.querySelectorAll ? root : document;
    OVERLAY_SELECTORS.forEach(function (selector) {
      scope.querySelectorAll(selector).forEach(function (el) {
        addExitButtonTo(el);
      });
    });
  }

  function collectVisibleOverlays() {
    const overlays = [];
    OVERLAY_SELECTORS.forEach(function (selector) {
      document.querySelectorAll(selector).forEach(function (el) {
        if (isVisible(el)) overlays.push(el);
      });
    });
    return overlays;
  }

  function parseZIndex(element) {
    const z = parseInt(getComputedStyle(element).zIndex, 10);
    return isNaN(z) ? 0 : z;
  }

  function closeTopmostPopup() {
    const visible = collectVisibleOverlays();
    if (visible.length === 0) return false;
    // choose by highest z-index, fallback to last in DOM order
    visible.sort(function (a, b) {
      return parseZIndex(a) - parseZIndex(b);
    });
    const topmost = visible[visible.length - 1];
    return closeOverlay(topmost);
  }

  function initMutationObserver() {
    const observer = new MutationObserver(function (mutations) {
      for (const mutation of mutations) {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(function (node) {
            if (!(node instanceof Element)) return;
            ensurePopupExitButtons(node);
          });
        }
      }
    });
    observer.observe(document.documentElement || document.body, {
      childList: true,
      subtree: true
    });
  }

  function initEscKeyBinding() {
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const closed = closeTopmostPopup();
        if (closed) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    }, true);
  }

  function init() {
    injectStylesIfMissing();
    ensurePopupExitButtons(document);
    initMutationObserver();
    initEscKeyBinding();
  }

  // Public API
  const PopupExit = {
    init: init,
    ensurePopupExitButtons: ensurePopupExitButtons,
    closeTopmostPopup: closeTopmostPopup
  };

  if (typeof window !== 'undefined') {
    window.PopupExit = PopupExit;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 0);
  }
})();


