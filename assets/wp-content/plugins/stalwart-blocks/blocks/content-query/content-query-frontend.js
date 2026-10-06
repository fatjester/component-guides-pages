/**
 * Content Query block — frontend filtering.
 * Vanilla JS, no build step required.
 *
 * URL format: ?taxonomy_slug=term-slug,other-slug
 * Multiple blocks on one page are handled independently.
 *
 * Card visibility uses a two-phase approach so the CSS grid reflows
 * only after the fade-out transition completes, avoiding empty gaps:
 *   .is-hiding  → opacity: 0 / scale (still in grid layout, transitioning)
 *   .is-hidden  → display: none (removed from grid layout, reflow happens here)
 */

var CQ_TRANSITION_MS = 275; // slightly longer than CSS 0.25s to ensure transition finishes

document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.wp-block-stalwart-blocks-content-query').forEach(function (block) {
        initBlock(block);
    });

    window.addEventListener('popstate', function () {
        document.querySelectorAll('.wp-block-stalwart-blocks-content-query').forEach(function (block) {
            applyUrlParams(block);
            runFilterPass(block, false);
        });
    });
});

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

function initBlock(block) {
    var groups = block.querySelectorAll('.stalwart-cq-filter-group');
    if (!groups.length) return;

    groups.forEach(function (group) {
        var inputType = group.dataset.inputType || 'checkboxes';

        if (inputType === 'dropdown') {
            group.querySelector('select').addEventListener('change', function () {
                runFilterPass(block, true);
            });

        } else if (inputType === 'radio') {
            group.querySelectorAll('input[type="radio"]').forEach(function (radio) {
                radio.addEventListener('change', function () {
                    group.querySelectorAll('.stalwart-cq-filter-option').forEach(function (opt) {
                        opt.classList.remove('is-active');
                    });
                    radio.closest('.stalwart-cq-filter-option').classList.add('is-active');
                    runFilterPass(block, true);
                });
            });

        } else {
            // Checkboxes
            var allBox    = group.querySelector('input[data-all="true"]');
            var termBoxes = Array.prototype.slice.call(group.querySelectorAll('input:not([data-all])'));

            if (allBox) {
                allBox.addEventListener('change', function () {
                    if (allBox.checked) {
                        termBoxes.forEach(function (cb) { cb.checked = false; });
                    }
                    refreshCheckboxActive(group);
                    runFilterPass(block, true);
                });
            }

            termBoxes.forEach(function (cb) {
                cb.addEventListener('change', function () {
                    var anyChecked = termBoxes.some(function (c) { return c.checked; });
                    if (allBox) allBox.checked = !anyChecked;
                    refreshCheckboxActive(group);
                    runFilterPass(block, true);
                });
            });
        }
    });

    applyDefaultTerms(block); // defaults first; URL params below will override per-taxonomy
    applyUrlParams(block);
    runFilterPass(block, false);
}

function refreshCheckboxActive(group) {
    group.querySelectorAll('.stalwart-cq-filter-option').forEach(function (label) {
        var input = label.querySelector('input');
        if (input) label.classList.toggle('is-active', !!input.checked);
    });
}

// ---------------------------------------------------------------------------
// Default terms → filter state (applied before URL params so URL can override)
// ---------------------------------------------------------------------------

function applyDefaultTerms(block) {
    block.querySelectorAll('.stalwart-cq-filter-group').forEach(function (group) {
        var raw = group.dataset.defaultTerms;
        if (!raw) return;

        var slugs     = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!slugs.length) return;

        var inputType = group.dataset.inputType || 'checkboxes';

        if (inputType === 'dropdown') {
            var sel = group.querySelector('select');
            if (sel) sel.value = slugs[0];

        } else if (inputType === 'radio') {
            group.querySelectorAll('input[type="radio"]').forEach(function (radio) {
                radio.checked = slugs.indexOf(radio.value) !== -1;
                radio.closest('.stalwart-cq-filter-option').classList.toggle('is-active', radio.checked);
            });

        } else {
            var allBox    = group.querySelector('input[data-all="true"]');
            var termBoxes = Array.prototype.slice.call(group.querySelectorAll('input:not([data-all])'));
            termBoxes.forEach(function (cb) { cb.checked = slugs.indexOf(cb.value) !== -1; });
            var anyChecked = termBoxes.some(function (c) { return c.checked; });
            if (allBox) allBox.checked = !anyChecked;
            refreshCheckboxActive(group);
        }
    });
}

// ---------------------------------------------------------------------------
// URL param → filter state
// ---------------------------------------------------------------------------

function applyUrlParams(block) {
    var params = new URLSearchParams(window.location.search);

    block.querySelectorAll('.stalwart-cq-filter-group').forEach(function (group) {
        var taxonomy  = group.dataset.taxonomy;
        var inputType = group.dataset.inputType || 'checkboxes';
        var raw       = params.get(taxonomy);
        if (!raw) return;

        var slugs = raw.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        if (!slugs.length) return;

        if (inputType === 'dropdown') {
            var sel = group.querySelector('select');
            if (sel) sel.value = slugs[0];

        } else if (inputType === 'radio') {
            group.querySelectorAll('input[type="radio"]').forEach(function (radio) {
                radio.checked = slugs.indexOf(radio.value) !== -1;
                radio.closest('.stalwart-cq-filter-option').classList.toggle('is-active', radio.checked);
            });

        } else {
            var allBox    = group.querySelector('input[data-all="true"]');
            var termBoxes = Array.prototype.slice.call(group.querySelectorAll('input:not([data-all])'));
            termBoxes.forEach(function (cb) { cb.checked = slugs.indexOf(cb.value) !== -1; });
            var anyChecked = termBoxes.some(function (c) { return c.checked; });
            if (allBox) allBox.checked = !anyChecked;
            refreshCheckboxActive(group);
        }
    });
}

// ---------------------------------------------------------------------------
// Active filter collection
// ---------------------------------------------------------------------------

function getActiveFilters(block) {
    var filters = [];
    block.querySelectorAll('.stalwart-cq-filter-group').forEach(function (group) {
        var taxonomy  = group.dataset.taxonomy;
        var inputType = group.dataset.inputType || 'checkboxes';
        var withinOp  = (group.dataset.withinOperator || 'OR').toUpperCase();
        var terms     = [];

        if (inputType === 'dropdown') {
            var val = group.querySelector('select').value;
            if (val) terms = [val];
        } else if (inputType === 'radio') {
            var checked = group.querySelector('input[type="radio"]:checked');
            if (checked && checked.value) terms = [checked.value];
        } else {
            group.querySelectorAll('input:not([data-all]):checked').forEach(function (cb) {
                terms.push(cb.value);
            });
        }

        filters.push({ taxonomy: taxonomy, terms: terms, withinOp: withinOp });
    });
    return filters;
}

// ---------------------------------------------------------------------------
// Card visibility — two-phase so grid reflows after the transition
// ---------------------------------------------------------------------------

function setCardVisible(card, visible) {
    // Cancel any pending collapse timer
    if (card._cqTimer) {
        clearTimeout(card._cqTimer);
        card._cqTimer = null;
    }

    if (visible) {
        // If fully collapsed, restore to layout then fade in.
        // Add .is-hiding first so the card starts at opacity:0 when it
        // re-enters the grid, then remove it one rAF later to trigger the
        // transition back to opacity:1.
        if (card.classList.contains('is-hidden')) {
            card.classList.add('is-hiding');
            card.classList.remove('is-hidden');
        }
        // Double rAF: first ensures the browser has processed the class
        // change and laid out the card; second triggers the transition.
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                card.classList.remove('is-hiding');
            });
        });
    } else {
        // Already hidden or in the process of hiding — nothing to do.
        if (card.classList.contains('is-hidden')) return;

        // Phase 1: fade out (card still occupies grid space).
        card.classList.add('is-hiding');

        // Phase 2: after the transition completes, collapse out of the grid.
        card._cqTimer = setTimeout(function () {
            card._cqTimer = null;
            if (card.classList.contains('is-hiding')) {
                card.classList.add('is-hidden');
                card.classList.remove('is-hiding');
            }
        }, CQ_TRANSITION_MS);
    }
}

// ---------------------------------------------------------------------------
// Filter pass
// ---------------------------------------------------------------------------

function runFilterPass(block, pushState) {
    var acrossOp  = (block.dataset.acrossOperator || 'AND').toUpperCase();
    var active    = getActiveFilters(block);
    var nonEmpty  = active.filter(function (f) { return f.terms.length > 0; });
    var items     = block.querySelectorAll(
        '.stalwart-cq-grid > .stalwart-card-traditional, .stalwart-cq-table tbody .stalwart-cq-row'
    );
    var visible   = 0;

    items.forEach(function (item) {
        var termsData = {};
        try { termsData = JSON.parse(item.dataset.terms || '{}'); } catch (e) {}

        var passes = true;
        if (nonEmpty.length) {
            var results = nonEmpty.map(function (f) {
                var cardTerms = termsData[f.taxonomy] || [];
                if (f.withinOp === 'AND') {
                    return f.terms.every(function (t) { return cardTerms.indexOf(t) !== -1; });
                }
                return f.terms.some(function (t) { return cardTerms.indexOf(t) !== -1; });
            });
            passes = acrossOp === 'AND' ? results.every(Boolean) : results.some(Boolean);
        }

        setCardVisible(item, passes);
        if (passes) visible++;
    });

    // Show/hide empty state message.
    // Delay slightly so it appears after cards have animated out.
    var empty = block.querySelector('.stalwart-cq-empty-state');
    if (empty) {
        if (visible > 0) {
            empty.hidden = true;
        } else {
            setTimeout(function () { empty.hidden = false; }, CQ_TRANSITION_MS);
        }
    }

    if (pushState) updateUrl(block, active);
}

// ---------------------------------------------------------------------------
// URL state
// ---------------------------------------------------------------------------

function updateUrl(block, activeFilters) {
    var params    = new URLSearchParams(window.location.search);
    var blockTaxs = [];
    block.querySelectorAll('.stalwart-cq-filter-group').forEach(function (g) {
        blockTaxs.push(g.dataset.taxonomy);
    });

    blockTaxs.forEach(function (t) { params.delete(t); });
    activeFilters.forEach(function (f) {
        if (f.terms.length) params.set(f.taxonomy, f.terms.join(','));
    });

    var qs  = params.toString();
    var url = window.location.pathname + (qs ? '?' + qs : '');
    history.pushState(null, '', url);
}
