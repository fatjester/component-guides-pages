/**
 * Collapsible footer menus — mobile only.
 * Activated when #footer_menu_columns has data-collapse-menus="true".
 * At the md breakpoint (782px), headings become toggle buttons and menus
 * collapse with a height/opacity transition. At desktop, everything is restored.
 */

( function () {
    'use strict';

    const container = document.getElementById( 'footer_menu_columns' );
    if ( !container || container.dataset.collapseMenus !== 'true' ) return;

    const menus      = Array.from( container.querySelectorAll( '.footer_menu' ) );
    const BREAKPOINT = 782; // $screen-md-min
    const EASING     = 'cubic-bezier(0.2, 0.7, 0.3, 1)';
    let   mobileActive = false;

    // ── Chevron icon ──────────────────────────────────────────────────────────

    function makeChevron() {
        const span = document.createElement( 'span' );
        span.className = 'footer-menu-toggle-icon';
        span.setAttribute( 'aria-hidden', 'true' );
        span.innerHTML =
            '<svg viewBox="0 0 16 10" xmlns="http://www.w3.org/2000/svg"' +
            ' fill="none" stroke="currentColor" stroke-width="2"' +
            ' stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M1 1l7 7 7-7"/></svg>';
        return span;
    }

    // ── Open / close animation ────────────────────────────────────────────────

    function openMenu( btn, nav ) {
        nav.hidden = false;
        nav.style.height = '0px';
        btn.setAttribute( 'aria-expanded', 'true' );

        requestAnimationFrame( function () {
            nav.style.height  = nav.scrollHeight + 'px';
            nav.style.opacity = '1';
        } );

        nav.addEventListener( 'transitionend', function handler() {
            nav.style.height = 'auto';
            nav.removeEventListener( 'transitionend', handler );
        }, { once: true } );
    }

    function closeMenu( btn, nav ) {
        // Fix height before animating to 0 (can't animate from 'auto')
        nav.style.height = nav.scrollHeight + 'px';
        btn.setAttribute( 'aria-expanded', 'false' );

        requestAnimationFrame( function () {
            nav.style.height  = '0px';
            nav.style.opacity = '0';
        } );

        nav.addEventListener( 'transitionend', function handler() {
            nav.hidden = true;
            nav.removeEventListener( 'transitionend', handler );
        }, { once: true } );
    }

    // ── Init / destroy per menu ───────────────────────────────────────────────

    function initMenu( menu ) {
        const heading = menu.querySelector( 'h2' );
        const nav     = menu.querySelector( 'nav' );
        if ( !heading || !nav ) return;
        if ( heading.querySelector( '.footer-menu-toggle' ) ) return; // already wired up

        // Preserve original text for desktop restore
        const label = heading.dataset.originalText || heading.textContent.trim();
        heading.dataset.originalText = label;

        // Build toggle button
        const btn = document.createElement( 'button' );
        btn.type      = 'button';
        btn.className = 'footer-menu-toggle';
        btn.setAttribute( 'aria-expanded', 'false' );
        btn.setAttribute( 'aria-label', 'Toggle ' + label );
        if ( nav.id ) btn.setAttribute( 'aria-controls', nav.id );

        const labelSpan = document.createElement( 'span' );
        labelSpan.className   = 'footer-menu-toggle-label';
        labelSpan.textContent = label;

        btn.append( labelSpan, makeChevron() );

        // Replace heading text with the button
        heading.textContent = '';
        heading.appendChild( btn );

        // Collapse nav
        nav.style.cssText =
            'height:0px;overflow:hidden;opacity:0;' +
            'transition:height 220ms ' + EASING + ',opacity 180ms ' + EASING + ';';
        nav.hidden = true;

        btn.addEventListener( 'click', function () {
            btn.getAttribute( 'aria-expanded' ) === 'true'
                ? closeMenu( btn, nav )
                : openMenu( btn, nav );
        } );
    }

    function destroyMenu( menu ) {
        const heading = menu.querySelector( 'h2' );
        const nav     = menu.querySelector( 'nav' );
        if ( !heading || !nav ) return;
        if ( !heading.querySelector( '.footer-menu-toggle' ) ) return;

        heading.textContent = heading.dataset.originalText || '';

        nav.hidden    = false;
        nav.style.cssText = '';
    }

    // ── Responsive update ─────────────────────────────────────────────────────

    function update() {
        const isMobile = window.innerWidth < BREAKPOINT;

        if ( isMobile && !mobileActive ) {
            mobileActive = true;
            menus.forEach( initMenu );
        } else if ( !isMobile && mobileActive ) {
            mobileActive = false;
            menus.forEach( destroyMenu );
        }
    }

    update();
    window.addEventListener( 'resize', update );

} )();
