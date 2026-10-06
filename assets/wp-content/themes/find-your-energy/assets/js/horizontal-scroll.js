// Make horizontal lists draggable with click-safe behavior and nice UX
(() => {
  const selectors =
    'ul[class^="is-style-cards-swipe"], ul[class*=" is-style-cards-swipe"], ul[class*=" is-style-cards-expanders-swipe"], ul.stalwart-trumba-list';

  document.querySelectorAll(selectors).forEach(makeDraggable);

  function makeDraggable(el) {
    let isDown = false;
    let startX = 0;
    let startScrollLeft = 0;
    let moved = false;
    const CLICK_CANCEL_THRESHOLD = 5; // px

    // Let vertical scroll pass through on touch/trackpad
    if (!el.style.touchAction) el.style.touchAction = 'pan-y';

    // Prevent ghost image dragging inside the scroller
    el.addEventListener('dragstart', (e) => e.preventDefault());

    // Store and restore scroll-snap while dragging (if used in CSS)
    const originalSnap = getComputedStyle(el).scrollSnapType;
    const restoreSnap = () => (el.style.scrollSnapType = originalSnap || '');

    // Pointer down: set initial state
    el.addEventListener('pointerdown', (e) => {
      // For mouse, only left button
      if (e.pointerType === 'mouse' && e.button !== 0) return;

      isDown = true;
      moved = false;
      startX = e.clientX;
      startScrollLeft = el.scrollLeft;

      // UX polish: show grabbing, disable text select, and disable scroll-snap
      el.classList.add('dragging');
      el.style.scrollSnapType = 'none';
    });

    // Move: update scrollLeft (non-passive to allow preventDefault)
    el.addEventListener(
      'pointermove',
      (e) => {
        if (!isDown) return;

        const dx = e.clientX - startX;

        if (!moved && Math.abs(dx) > CLICK_CANCEL_THRESHOLD) {
          moved = true;
        }

        if (moved) {
          el.scrollLeft = startScrollLeft - dx;
          // prevent text selection while dragging
          e.preventDefault();
        }
      },
      { passive: false }
    );

    // End drag
    const endDrag = () => {
      if (!isDown) return;
      isDown = false;
      el.classList.remove('dragging');
      restoreSnap();
    };

    el.addEventListener('pointerup', endDrag);
    el.addEventListener('pointerleave', endDrag);
    el.addEventListener('pointercancel', endDrag);

    // If the user actually dragged, cancel the click to avoid accidental nav
    // (Use capture so we intercept before inner links/buttons)
    el.addEventListener(
      'click',
      (e) => {
        if (moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      },
      true
    );

    // Optional: keyboard arrow scrolling for accessibility
    el.addEventListener('keydown', (e) => {
      if (!e.target || e.target !== el) return; // only when the UL itself is focused
      const step = Math.round(el.clientWidth * 0.9); // screenful-ish
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        el.scrollBy({ left: step, behavior: 'smooth' });
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        el.scrollBy({ left: -step, behavior: 'smooth' });
      }
    });
  }
})();