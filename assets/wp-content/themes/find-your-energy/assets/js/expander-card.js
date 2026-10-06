/**
 * CTA Expander behavior (theme JS)
 * Targets only the "Expander" variation:
 * .wp-block-stalwart-blocks-call-to-action.is-style-cards-expander
 *
 * Key points:
 * - Overlay is absolute in both states; collapsed translate uses per-card --peek.
 * - We also set a per-row --peek-spacer (max of row) so the peek sits BELOW the image
 *   and all cards in the same row share equal heights (no jump).
 */
(function () {
  'use strict';

  const ROOT_SELECTOR   = '.wp-block-stalwart-blocks-call-to-action';
  const VARIANT_SELECTOR = '[class*="is-style-cards-expander"]';
  const LIST_SELECTOR   = 'ul.stalwart-ctas';
  const CARD_SELECTOR   = 'li.stalwart-cta-single.has-link';

  const OPEN_ONE_AT_A_TIME = true;
  const $$ = (root, sel) => Array.prototype.slice.call(root.querySelectorAll(sel));

  /* ========================= Builders ========================= */

  function buildReadMore(href, text, ariaLabel) {
    const a = document.createElement('a');
    a.className = 'stalwart-cta-read-more';
    a.href = href;
    a.textContent = text || 'Read more';
    if (ariaLabel) a.setAttribute('aria-label', ariaLabel);
    a.setAttribute('role', 'button');
    a.setAttribute('aria-hidden', 'true');
    a.tabIndex = -1;
    return a;
  }

  function buildToggleButton() {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cta-toggle';
    btn.setAttribute('aria-label', 'Expand card');
    return btn;
  }

  function getHeadingLink(card) {
    return card.querySelector('.stalwart-cta-heading a.stalwart-cta-link[href]');
  }

  function preventWhileExpanded(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  /* ========================= Peek measurement ========================= */

  function getPx(n) { return Number.isFinite(n) ? `${n}px` : n; }

  // Measure kicker + heading total block height (+ small buffer)
  function calcPeekForCard(card) {
    const content = card.querySelector('.stalwart-cta-content');
    if (!content) return null;

    const kicker  = content.querySelector('.stalwart-cta-kicker');
    const heading = content.querySelector('.stalwart-cta-heading');

    let total = 0;
    if (kicker)  total += kicker.offsetHeight;
    if (heading) total += heading.offsetHeight;

    const buffer = 8; // px breathing room
    total += buffer;

    return total || null;
  }

  // Set per-card --peek on the content element so it wins everywhere
  function setPeekVar(card) {
    const content = card.querySelector('.stalwart-cta-content');
    const peek = calcPeekForCard(card);
    if (peek && content) content.style.setProperty('--peek', getPx(peek));
  }

  // Group cards by visual row via offsetTop (with small tolerance)
  function groupCardsByRow(cards) {
    const rows = [];
    const tolerance = 2; // px
    cards.forEach(card => {
      const top = card.offsetTop;
      const row = rows.find(r => Math.abs(r.top - top) <= tolerance);
      if (row) row.cards.push(card);
      else rows.push({ top, cards: [card] });
    });
    return rows;
  }

  // For a list: compute each card's --peek, then set per-row --peek-spacer = max of that row
  function setRowSpacersForList(list) {
    const cards = Array.from(list.querySelectorAll('li.stalwart-cta-single.has-link'));
    if (!cards.length) return;

    // Ensure every card has its own --peek
    cards.forEach(setPeekVar);

    const rows = groupCardsByRow(cards);
    rows.forEach(({ cards: rowCards }) => {
      let maxPeek = 0;
      rowCards.forEach(card => {
        const content = card.querySelector('.stalwart-cta-content');
        const val = content ? getComputedStyle(content).getPropertyValue('--peek') : '';
        const peekNum = parseFloat(val); // expect px from setPeekVar
        if (Number.isFinite(peekNum) && peekNum > maxPeek) maxPeek = peekNum;
      });
      const spacer = maxPeek > 0 ? `${maxPeek}px` : '0px';
      rowCards.forEach(card => card.style.setProperty('--peek-spacer', spacer));
    });
  }

  function debounce(fn, wait) {
    let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), wait); };
  }

  const recomputeAllSpacers = debounce(() => {
    document.querySelectorAll(LIST_SELECTOR).forEach(setRowSpacersForList);
  }, 100);

  // Wait for images to ensure headings don’t wrap differently post-load
  function waitForImages(list) {
    const imgs = Array.from(list.querySelectorAll('.stalwart-cta-image-wrapper img'));
    const pending = imgs.filter(img => !img.complete);
    if (!pending.length) return Promise.resolve();
    return Promise.all(
      pending.map(img => new Promise(res => {
        img.addEventListener('load', res, { once: true });
        img.addEventListener('error', res, { once: true });
      }))
    );
  }

  /* ========================= Expand/Collapse ========================= */

  function setExpanded(card, expanded) {
    card.classList.toggle('is-expanded', expanded);
    card.setAttribute('aria-expanded', expanded ? 'true' : 'false');

    const desc      = card.querySelector('.stalwart-cta-description');
    const readMore  = card.querySelector('.stalwart-cta-read-more');
    const toggleBtn = card.querySelector('.cta-toggle');
    // match heading link whether it currently has href or not
    const headingLn = card.querySelector('.stalwart-cta-heading a.stalwart-cta-link[href], .stalwart-cta-heading a.stalwart-cta-link');
    const titleEl   = card.querySelector('.stalwart-cta-heading');
    const titleText = titleEl ? titleEl.textContent.trim() : 'this card';

    // Update the card's own label to describe the action
    card.setAttribute('aria-label', expanded ? `Collapse details about ${titleText}` : `Expand details about ${titleText}`);

    if (expanded) {
      // Disable heading link while expanded (no focus, no nav)
      if (headingLn) {
        if (headingLn.hasAttribute('href')) {
          headingLn.dataset.origHref = headingLn.getAttribute('href');
          headingLn.removeAttribute('href');
        }
        headingLn.setAttribute('aria-disabled', 'true');
        headingLn.tabIndex = -1;
        headingLn.addEventListener('click', preventWhileExpanded, { once: true });
      }

      if (readMore) {
        readMore.removeAttribute('aria-hidden');
        readMore.tabIndex = 0;
        readMore.classList.add('fade-in');
        readMore.classList.remove('fade-out');
      }
      if (desc) {
        desc.setAttribute('aria-hidden', 'false');
        desc.classList.add('fade-in');
        desc.classList.remove('fade-out');
      }
      if (toggleBtn) {
        toggleBtn.tabIndex = 0;
        toggleBtn.setAttribute('aria-label', 'Close card');
      }
    } else {
      // Collapsed: keep heading link present but unfocusable
      if (headingLn) {
        if (headingLn.dataset.origHref) {
          headingLn.setAttribute('href', headingLn.dataset.origHref);
          delete headingLn.dataset.origHref;
        }
        headingLn.removeAttribute('aria-disabled');
        headingLn.tabIndex = -1; // keep unfocusable while collapsed
      }

      if (desc) {
        desc.setAttribute('aria-hidden', 'true');
        desc.classList.add('fade-out');
        desc.classList.remove('fade-in');
      }
      if (readMore) {
        readMore.setAttribute('aria-hidden', 'true');
        readMore.tabIndex = -1;
        readMore.classList.add('fade-out');
        readMore.classList.remove('fade-in');
      }
      if (toggleBtn) {
        toggleBtn.tabIndex = -1;
        toggleBtn.setAttribute('aria-label', 'Expand card');
      }
    }

    // After any state change, recompute this card's row spacer (handles wrap changes)
    const list = card.closest('ul.stalwart-ctas');
    if (list) setRowSpacersForList(list);
  }

  function collapseCard(card) {
    if (!card || !card.classList.contains('is-expanded')) return;
    setExpanded(card, false);
    const active = document.activeElement;
    if (active && card.contains(active)) card.focus({ preventScroll: true });
  }

  function expandCard(card, group) {
    if (!card) return;
    if (OPEN_ONE_AT_A_TIME && group) {
      $$(group, CARD_SELECTOR).forEach(c => { if (c !== card) collapseCard(c); });
    }
    setExpanded(card, true);
  }

  /* ========================= Per-list setup ========================= */

  function enhanceExpanderList(list) {
    const cards = $$(list, CARD_SELECTOR);
    if (!cards.length) return;
    list.classList.add('ctas-expander-ready');

    cards.forEach(card => {
      // Make the card operable as a disclosure
      card.setAttribute('tabindex', '0');
      card.setAttribute('role', 'button');
      card.setAttribute('aria-expanded', 'false');

      const content     = card.querySelector('.stalwart-cta-content');
      const desc        = card.querySelector('.stalwart-cta-description');
      const imgWrap     = card.querySelector('.stalwart-cta-image-wrapper');
      const headingLink = getHeadingLink(card);

      if (!content || !imgWrap || !headingLink) return;

      // Contextual label for the card when focused (collapsed)
      const titleEl   = card.querySelector('.stalwart-cta-heading');
      const titleText = titleEl ? titleEl.textContent.trim() : 'this card';
      card.setAttribute('aria-label', `Expand details about ${titleText}`);

      // Description start hidden (smooth fades)
      if (desc) {
        desc.setAttribute('aria-hidden', 'true');
        desc.classList.add('fade-base', 'fade-out');
      }

      // Read more with contextual aria-label = title
      if (!card.querySelector('.stalwart-cta-read-more')) {
        const readMore = buildReadMore(headingLink.href, 'Read more', titleText);
        readMore.classList.add('fade-base', 'fade-out');
        content.appendChild(readMore);
      }

      // Keep heading link unfocusable while collapsed
      headingLink.tabIndex = -1;

      // Toggle button (close/expand) after Read more so it’s next in tab order
      if (!card.querySelector('.cta-toggle')) {
        const toggleBtn = buildToggleButton();
        toggleBtn.tabIndex = -1; // collapsed by default
        content.appendChild(toggleBtn);
        toggleBtn.addEventListener('click', (e) => {
          e.preventDefault();
          card.classList.contains('is-expanded') ? collapseCard(card) : expandCard(card, list);
        });
      }

      // Clicking the heading when collapsed expands instead of navigating
      headingLink.addEventListener('click', (e) => {
        if (!card.classList.contains('is-expanded')) {
          e.preventDefault();
          e.stopPropagation();
          expandCard(card, list);
        }
      });

      // Clicking anywhere on the card (image or content) expands when collapsed
      card.addEventListener('click', (e) => {
        const interactive = e.target.closest('a, button, input, select, textarea, summary');
        if (interactive) return; // let native controls act normally
        if (!card.classList.contains('is-expanded')) {
          e.preventDefault();
          e.stopPropagation();
          expandCard(card, list);
        }
      });

      // Keyboard support: only act when focus is on the card itself (not inside interactive children)
      card.addEventListener('keydown', (e) => {
        const isInteractive = e.target.closest('a, button, input, select, textarea, summary');
        if (isInteractive) return;

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          if (!card.classList.contains('is-expanded')) expandCard(card, list);
        } else if (e.key === 'Escape') {
          if (card.classList.contains('is-expanded')) {
            e.preventDefault();
            e.stopPropagation();
            collapseCard(card);
          }
        }
      });
    });

    // After wiring: compute peeks & row spacers once images (and fonts) are ready
    waitForImages(list).then(() => {
      setRowSpacersForList(list);

      // Observe responsive changes to content; recompute row spacers when content wraps
      if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => setRowSpacersForList(list));
        list.querySelectorAll('li.stalwart-cta-single.has-link .stalwart-cta-content')
            .forEach(el => ro.observe(el));
      }
    });
  }

  /* ========================= Init ========================= */

  function init() {
    const roots = $$(document, `${ROOT_SELECTOR}${VARIANT_SELECTOR}, ${ROOT_SELECTOR} ${VARIANT_SELECTOR}`);
    roots.forEach(root => {
      const lists = $$(root, LIST_SELECTOR);
      lists.forEach(enhanceExpanderList);
    });

    // Recompute on resize & after fonts load
    window.addEventListener('resize', recomputeAllSpacers);
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(recomputeAllSpacers).catch(() => {});
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();