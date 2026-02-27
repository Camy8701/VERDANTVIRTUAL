(function () {
  function initCardFlashlight(root) {
    const scope = root || document;
    scope.querySelectorAll('.card-flashlight').forEach((card) => {
      if (card.dataset.vvFlashInit === '1') return;
      card.dataset.vvFlashInit = '1';
      card.addEventListener('mousemove', (event) => {
        const rect = card.getBoundingClientRect();
        card.style.setProperty('--mouse-x', (event.clientX - rect.left) + 'px');
        card.style.setProperty('--mouse-y', (event.clientY - rect.top) + 'px');
      });
    });
  }

  function initSubHeadlineObserver(root) {
    const scope = root || document;
    const targets = Array.from(scope.querySelectorAll('.sub-hl')).filter((el) => !el.classList.contains('is-visible'));
    if (!targets.length) return;

    if (!('IntersectionObserver' in window)) {
      targets.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.3 });

    targets.forEach((el) => observer.observe(el));
  }

  function init(root) {
    initCardFlashlight(root);
    initSubHeadlineObserver(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function onReady() {
      document.removeEventListener('DOMContentLoaded', onReady);
      init(document);
    });
  } else {
    init(document);
  }

  window.VVSharedUI = {
    init,
    initCardFlashlight,
    initSubHeadlineObserver
  };
})();
