/**
 * Site alert — cookie check, header offset, and dismiss behaviour.
 *
 * Cookie strategy:
 *   Name : fye_alert
 *   Value: MD5 hash of the alert content
 *   If the stored hash differs from the current alert's hash (content changed),
 *   the alert shows again regardless of the previous dismissal.
 *
 * Progressive enhancement: the alert is rendered server-side and visible by
 * default. This script removes it if the user has already dismissed it.
 */

( function () {
    'use strict';

    const alertEl = document.getElementById( 'site_alert' );
    if ( !alertEl ) return;

    const hash           = alertEl.dataset.hash;
    const cookieDuration = alertEl.dataset.cookie;
    const COOKIE_NAME    = 'fye_alert';

    // ── Cookie utilities ──────────────────────────────────────────────────────

    function getCookie( name ) {
        const match = document.cookie.match(
            new RegExp( '(?:^|; )' + name.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' ) + '=([^;]*)' )
        );
        return match ? decodeURIComponent( match[ 1 ] ) : null;
    }

    function setCookie( name, value, days ) {
        let cookie = name + '=' + encodeURIComponent( value ) + '; path=/; SameSite=Lax';
        if ( days !== 'session' && days > 0 ) {
            const expires = new Date();
            expires.setDate( expires.getDate() + days );
            cookie += '; expires=' + expires.toUTCString();
        }
        document.cookie = cookie;
    }

    // ── Visibility check ──────────────────────────────────────────────────────

    function shouldShow() {
        if ( cookieDuration === 'always' ) return true;
        const stored = getCookie( COOKIE_NAME );
        // Show if: no cookie, or content has changed since last dismissal
        return !stored || stored !== hash;
    }

    // ── Header offset via CSS custom property ─────────────────────────────────

    function setAlertHeight() {
        const height = alertEl.isConnected && !alertEl.hidden
            ? alertEl.getBoundingClientRect().height
            : 0;
        document.documentElement.style.setProperty( '--fye-alert-height', height + 'px' );
    }

    // ── Dismiss ───────────────────────────────────────────────────────────────

    function dismiss() {
        alertEl.hidden = true;
        setAlertHeight();

        if ( cookieDuration === 'always' ) return;

        const daysMap = {
            session:  'session',
            '1_day':  1,
            '7_days': 7,
            '30_days': 30,
            never:    3650, // 10 years
        };
        setCookie( COOKIE_NAME, hash, daysMap[ cookieDuration ] ?? 'session' );
    }

    // ── Initialise ────────────────────────────────────────────────────────────

    if ( !shouldShow() ) {
        // Cookie still valid and content unchanged — remove from DOM entirely
        // so it takes up no space and is not announced by screen readers.
        alertEl.remove();
        return;
    }

    // Alert should show — measure and set initial offset
    setAlertHeight();

    // Close button
    const closeBtn = document.getElementById( 'site_alert_close' );
    if ( closeBtn ) {
        closeBtn.addEventListener( 'click', dismiss );
    }

    // Escape key
    document.addEventListener( 'keydown', function ( e ) {
        if ( e.key === 'Escape' && !alertEl.hidden ) {
            dismiss();
            // Return focus to the first focusable element in the header
            const firstFocusable = document.querySelector(
                '#site_header a[href], #site_header button:not([disabled])'
            );
            if ( firstFocusable ) firstFocusable.focus();
        }
    } );

    // Re-measure if the alert changes height (e.g. text reflows on resize)
    new ResizeObserver( setAlertHeight ).observe( alertEl );

} )();
