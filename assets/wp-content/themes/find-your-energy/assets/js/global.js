// Add a class to define how many columns are in a "Columns" block
document.addEventListener('DOMContentLoaded', () => {
	const columnBlocks = document.querySelectorAll('.wp-block-columns');

	columnBlocks.forEach((block) => {
		const columns = block.querySelectorAll('.wp-block-column');
		const count = columns.length;

		// Remove any existing count class
		block.className = block.className.replace(/\bcolumns--\d+\b/g, '');

		// Add new count class
		block.classList.add(`columns-${count}`);
	});

	// const applyUserActionBoxOffset = () => {
	// 	const userActionBoxes = document.querySelectorAll('.user-action-box');
	// 	const factor = window.innerWidth < 992 ? 0.1 : 0.5;

	// 	userActionBoxes.forEach((box) => {
	// 		const height = box.offsetHeight;

	// 		if (height > 0) {
	// 			box.style.marginBottom = `-${height * factor}px`;
	// 		} else {
	// 			box.style.marginBottom = '0px';
	// 		}
	// 	});
	// };

	// applyUserActionBoxOffset();

	// let resizeTimeout;
	// window.addEventListener('resize', () => {
	// 	clearTimeout(resizeTimeout);
	// 	resizeTimeout = setTimeout(applyUserActionBoxOffset, 150);
	// });

	const hydrateButtonGroupAnimations = () => {
		if (!document.body.classList.contains('has-entrance-animations')) {
			return;
		}

		const buttonGroups = document.querySelectorAll('.wp-block-buttons[data-animate]');

		buttonGroups.forEach((group) => {
			const buttons = group.querySelectorAll('.wp-block-button');

			buttons.forEach((button) => {
				if (!button.hasAttribute('data-animate')) {
					button.setAttribute('data-animate', '');
				}
			});
		});
	};

	hydrateButtonGroupAnimations();

	const activateAnimationTarget = (target) => {
		target.classList.add('is-animated');

		if (target.classList.contains('wp-block-buttons')) {
			target.querySelectorAll('.wp-block-button').forEach((button) => {
				button.classList.add('is-animated');
			});
		}
	};

	const animatedNodes = document.body.classList.contains('has-entrance-animations')
		? document.querySelectorAll('[data-animate]')
		: [];

	if (animatedNodes.length && 'IntersectionObserver' in window) {
		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					activateAnimationTarget(entry.target);
					observer.unobserve(entry.target);
				}
			});
		}, {
			root: null,
			rootMargin: '0px 0px -10% 0px',
			threshold: 0.2,
		});

		animatedNodes.forEach((node, index) => {
			node.style.setProperty('--fye-anim-index', index);
			const margin = node.getAttribute('data-animate-margin');
			const threshold = node.getAttribute('data-animate-threshold');

			if (margin || threshold) {
				const opts = {
					root: null,
					rootMargin: margin || '0px',
					threshold: threshold ? parseFloat(threshold) : 0.2,
				};
				const customObserver = new IntersectionObserver((entries) => {
					entries.forEach((entry) => {
						if (entry.isIntersecting) {
							activateAnimationTarget(entry.target);
							customObserver.unobserve(entry.target);
						}
					});
				}, opts);
				customObserver.observe(node);
			} else {
				observer.observe(node);
			}
		});
	} else if (animatedNodes.length) {
		animatedNodes.forEach((node) => activateAnimationTarget(node));
	}
});

// off-canvas menu functions
document.addEventListener( 'DOMContentLoaded', function() {

    const toggle = document.getElementById('menu_control');
    const menu = document.getElementById('global_navigation_menu');
    const overlay = document.getElementById('global_menu_overlay');

    function toggleMenu() {

        const isActive = menu.classList.toggle('active');
        overlay.classList.toggle('active', isActive);

        // Toggle class on body
        document.body.classList.toggle( 'scroll-lock', isActive );

        // Update ARIA attributes
        toggle.setAttribute('aria-expanded', isActive);
        menu.setAttribute('aria-hidden', !isActive);

        // Focus management
        if (isActive) {
        
            menu.querySelector('a, button').focus();
        
        } else {
        
            toggle.focus();
        
        }
    
    }

    // Event listeners
    toggle.addEventListener('click', toggleMenu);
    overlay.addEventListener('click', toggleMenu);

    // Close menu with ESC key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && menu.classList.contains('active')) {
            toggleMenu();
        }
    });

    const toggles = document.querySelectorAll('.accordion-menu .submenu-toggle');

    function closeSubmenu(t) {
        const sm = t.nextElementSibling;
        t.setAttribute('aria-expanded', 'false');
        sm.setAttribute('aria-hidden', 'true');
        sm.style.height = 0;
        sm.classList.remove('open');
        const parentItem = sm.closest('li');
        if (parentItem) parentItem.style.height = 'auto';
    }

    toggles.forEach(toggle => {
        toggle.addEventListener('click', function (e) {
            e.preventDefault();

            const submenu = toggle.nextElementSibling;
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';

            toggle.setAttribute('aria-expanded', !isOpen);
            submenu.setAttribute('aria-hidden', isOpen);

            if (!isOpen) {
                // Close any other open submenus before opening this one
                toggles.forEach(other => {
                    if (other !== toggle && other.getAttribute('aria-expanded') === 'true') {
                        closeSubmenu(other);
                    }
                });

                // Open: set actual scrollHeight to height
                submenu.style.height = submenu.scrollHeight + 'px';
                submenu.classList.add('open');

                const parentItem = submenu.closest('li');
                if (parentItem) parentItem.style.height = 'auto';
            } else {
                // Close: collapse
                submenu.style.height = 0;
                submenu.classList.remove('open');

                const parentItem = submenu.closest('li');
                if (parentItem) parentItem.style.height = 'auto';
            }
        });
    });

});

// horizontal menu details/summary keyboard accessibility
document.addEventListener('DOMContentLoaded', function() {
    
    const menuItems = document.querySelectorAll('.horizontal-menu li.menu-item-has-children > a');

    menuItems.forEach(item => {

        const submenu = item.nextElementSibling;

        item.addEventListener('keydown', function(e) {
        
            if (!submenu) return;

            // Open submenu with Down arrow
            if (e.key === 'ArrowDown') {
        
                e.preventDefault();
                submenu.style.display = 'block';
                submenu.querySelector('a').focus();
        
            }

            // Close submenu with Escape
            if (e.key === 'Escape') {
        
                e.preventDefault();
                submenu.style.display = 'none';
                item.focus();
        
            }
        
        });

        // Close submenu when focus leaves last child
        if (submenu) {
        
            const links = submenu.querySelectorAll('a');
        
            links[links.length - 1].addEventListener('blur', function() {
                submenu.style.display = 'none';
            });
        
        }
    
    });

    const toggles = document.querySelectorAll('.horizontal-menu .submenu-toggle');

    function closeHorizontalSubmenu(t) {
        const sm = t.parentElement.querySelector('.sub-menu');
        if (!sm) return;
        t.setAttribute('aria-expanded', 'false');
        sm.setAttribute('aria-hidden', 'true');
        sm.classList.remove('open');
    }

    toggles.forEach(toggle => {
        // Find the submenu inside the same parent <li>
        const parentLi = toggle.parentElement;
        const submenu = parentLi.querySelector('.sub-menu');

        if (!submenu) return;

        // Click toggles submenu
        toggle.addEventListener('click', function(e) {
            e.preventDefault(); // disable navigation
            const isOpen = toggle.getAttribute('aria-expanded') === 'true';

            // Close any other open submenus before opening this one
            if (!isOpen) {
                toggles.forEach(other => {
                    if (other !== toggle && other.getAttribute('aria-expanded') === 'true') {
                        closeHorizontalSubmenu(other);
                    }
                });
            }

            // Toggle ARIA attributes
            toggle.setAttribute('aria-expanded', !isOpen);
            submenu.setAttribute('aria-hidden', isOpen);

            // Toggle CSS class for visibility
            submenu.classList.toggle('open', !isOpen);
        });

        // Keyboard navigation
        toggle.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                submenu.classList.add('open');
                toggle.setAttribute('aria-expanded', true);
                submenu.querySelector('a').focus();
            }
            if (e.key === 'Escape') {
                e.preventDefault();
                submenu.classList.remove('open');
                toggle.setAttribute('aria-expanded', false);
                toggle.focus();
            }
        });

        // Close submenu when last child loses focus
        const links = submenu.querySelectorAll('a');
        links[links.length - 1].addEventListener('blur', function() {
            submenu.classList.remove('open');
            toggle.setAttribute('aria-expanded', false);
        });
    });

    // Close any open submenu when clicking outside it
    document.addEventListener('click', function(e) {
        toggles.forEach(toggle => {
            if (toggle.getAttribute('aria-expanded') === 'true') {
                if (!toggle.parentElement.contains(e.target)) {
                    closeHorizontalSubmenu(toggle);
                }
            }
        });
    });

});

// Dynamically position right-side header elements based on measured widths.
// Order from right to left: menu_control → action_button → language_selector → network_home_link
// #brand_local lives inside .navbar (flex), so we push it left via navbar padding-right.
(function () {

	const actionButton  = document.getElementById( 'action_button' );
	const langSelector  = document.getElementById( 'language_selector' );
	const networkLink   = document.getElementById( 'network_home_link' );
	const navbar        = document.querySelector( '#site_header .navbar' );

	// Nothing to do if none of the dynamic targets exist
	if ( !langSelector && !networkLink ) return;

	const BREAKPOINT = 992;

	function getOffset() {
		// Width of #menu_control: 4rem (64px) below breakpoint, 8rem (128px) above
		return window.innerWidth < BREAKPOINT ? 64 : 128;
	}

	function updatePositions() {
		const offset  = getOffset();
		const abWidth = actionButton ? actionButton.getBoundingClientRect().width : 0;

		// Network home link sits immediately left of the action button
		if ( networkLink ) {
			networkLink.style.right = `${ abWidth + offset }px`;
		}

		const nlWidth = networkLink ? networkLink.getBoundingClientRect().width : 0;

		// Language selector is the leftmost element in the group
		if ( langSelector ) {
			langSelector.style.right = `${ abWidth + nlWidth + offset }px`;
		}

		const lsWidth = langSelector ? langSelector.getBoundingClientRect().width : 0;

		// Keep #brand_local (last .navbar flex item) from sliding under fixed elements
		if ( navbar ) {
			navbar.style.paddingRight = `${ abWidth + nlWidth + lsWidth + offset }px`;
		}
	}

	// Initial run
	updatePositions();

	// Watch each element for size changes (e.g. font load, content change)
	const observer = new ResizeObserver( updatePositions );
	if ( actionButton ) observer.observe( actionButton );
	if ( networkLink )  observer.observe( networkLink );
	if ( langSelector ) observer.observe( langSelector );

	// Also react to viewport width changes (offset switches at breakpoint)
	window.addEventListener( 'resize', updatePositions );

})();

// GTranslate keyboard accessibility
// GTranslate's float widget appends #gt_float_wrapper to <body> and renders
// its controls as divs/spans with click handlers — both problems for keyboard
// users. This IIFE:
//   1. Moves #gt_float_wrapper into #language_selector so it sits in the
//      correct tab-order position in the DOM.
//   2. Adds tabindex + role + keyboard handlers to any non-interactive elements
//      that GTranslate made clickable, so Enter/Space activate them.
// Runs on DOMContentLoaded and again after a short delay to catch GTranslate's
// async initialisation.
(function () {
    'use strict';

    const langSelector = document.getElementById( 'language_selector' );
    if ( !langSelector ) return;

    function enhance() {
        // Adopt the float wrapper into our container if GTranslate placed it elsewhere
        const floatWrapper = document.getElementById( 'gt_float_wrapper' );
        if ( floatWrapper && !langSelector.contains( floatWrapper ) ) {
            langSelector.appendChild( floatWrapper );
        }

        // Make div/span elements that only have click handlers keyboard-reachable
        const root = floatWrapper || langSelector;
        root.querySelectorAll( '[onclick]:not(a):not(button):not(select):not(input)' )
            .forEach( function ( el ) {
                if ( !el.getAttribute( 'tabindex' ) ) {
                    el.setAttribute( 'tabindex', '0' );
                }
                if ( !el.getAttribute( 'role' ) ) {
                    el.setAttribute( 'role', 'button' );
                }
                if ( !el._gtA11yBound ) {
                    el._gtA11yBound = true;
                    el.addEventListener( 'keydown', function ( e ) {
                        if ( e.key === 'Enter' || e.key === ' ' ) {
                            e.preventDefault();
                            el.click();
                        }
                    } );
                }
            } );
    }

    document.addEventListener( 'DOMContentLoaded', function () {
        enhance();
        // GTranslate initialises asynchronously after page load
        setTimeout( enhance, 800 );
    } );

} )();

// GTranslate popup-style accessibility
// Targets .gt_white_content (GTranslate's actual popup class).
// Uses window.gt_hide_popup() to close — avoids dispatching synthetic click
// events, which bubble to document and trigger GTranslate's load_tlib handler
// without the expected callback (the source of all the console errors).
// Focus cycling uses an injected sentinel span so we never call .focus()
// programmatically on GTranslate's own language links (which also invoke load_tlib).
(function () {
    'use strict';

    if ( !document.getElementById( 'language_selector' ) ) return;

    let activePopup = null;
    let returnFocus = null;
    let trapHandler = null;
    let closing     = false; // prevents MutationObserver feedback loop during close

    function closePopup() {
        if ( !activePopup || closing ) return;
        closing = true;

        activePopup.removeAttribute( 'role' );
        activePopup.removeAttribute( 'aria-modal' );
        activePopup.removeAttribute( 'aria-label' );
        activePopup = null;

        if ( trapHandler ) {
            document.removeEventListener( 'keydown', trapHandler );
            trapHandler = null;
        }

        if ( returnFocus && typeof returnFocus.focus === 'function' ) {
            try { returnFocus.focus(); } catch ( _ ) {}
        }
        returnFocus = null;

        // Use GTranslate's own global — avoids synthetic click events
        // that trigger load_tlib on the document-level handler
        if ( typeof window.gt_hide_popup === 'function' ) {
            window.gt_hide_popup();
        }

        setTimeout( function () { closing = false; }, 300 );
    }

    function openPopup( popup ) {
        if ( activePopup === popup || closing ) return;
        activePopup = popup;
        returnFocus = document.activeElement;

        popup.setAttribute( 'role',       'dialog' );
        popup.setAttribute( 'aria-modal', 'true' );
        popup.setAttribute( 'aria-label', 'Select language' );

        // Inject close button — appended so CSS can position it absolute top-right
        let closeBtn = popup.querySelector( '.fye-gt-close' );
        if ( !closeBtn ) {
            closeBtn = document.createElement( 'button' );
            closeBtn.type      = 'button';
            closeBtn.className = 'fye-gt-close';
            closeBtn.setAttribute( 'aria-label', 'Close language selector' );
            closeBtn.innerHTML = '&times;';
            closeBtn.addEventListener( 'click', function ( e ) {
                e.stopPropagation(); // stop GTranslate's document-level click handler
                closePopup();
            } );
            popup.appendChild( closeBtn );
        }

        // Focus sentinel — visually hidden last child; lets the focus trap cycle
        // without ever calling .focus() on GTranslate's language links
        let sentinel = popup.querySelector( '.fye-gt-sentinel' );
        if ( !sentinel ) {
            sentinel = document.createElement( 'span' );
            sentinel.className = 'fye-gt-sentinel';
            sentinel.setAttribute( 'tabindex', '0' );
            sentinel.setAttribute( 'aria-hidden', 'true' );
            popup.appendChild( sentinel );
        }

        const closeBtnRef = closeBtn;
        const sentinelRef = sentinel;

        // Focus our close button — safe because it is an element we own
        setTimeout( function () {
            if ( activePopup ) closeBtnRef.focus();
        }, 50 );

        trapHandler = function ( e ) {
            if ( e.key === 'Escape' ) {
                e.preventDefault();
                e.stopPropagation();
                closePopup();
                return;
            }

            if ( e.key !== 'Tab' || !activePopup ) return;

            const active = document.activeElement;

            // Shift+Tab on close button → jump to sentinel (never to a GTranslate link)
            if ( e.shiftKey && active === closeBtnRef ) {
                e.preventDefault();
                sentinelRef.focus();
            // Tab on sentinel → back to close button
            } else if ( !e.shiftKey && active === sentinelRef ) {
                e.preventDefault();
                closeBtnRef.focus();
            }
        };

        document.addEventListener( 'keydown', trapHandler );
    }

    function scan() {
        if ( closing ) return;

        const popup = document.querySelector( '.gt_white_content' );

        if ( popup && popup.offsetParent !== null ) {
            openPopup( popup );
        } else if ( activePopup ) {
            // Closed externally (user clicked outside — GTranslate handles it)
            activePopup.removeAttribute( 'role' );
            activePopup.removeAttribute( 'aria-modal' );
            activePopup.removeAttribute( 'aria-label' );
            activePopup = null;

            if ( trapHandler ) {
                document.removeEventListener( 'keydown', trapHandler );
                trapHandler = null;
            }

            if ( returnFocus && typeof returnFocus.focus === 'function' ) {
                try { returnFocus.focus(); } catch ( _ ) {}
            }
            returnFocus = null;
        }
    }

    document.addEventListener( 'DOMContentLoaded', function () {
        setTimeout( function () {
            new MutationObserver( scan ).observe( document.body, {
                childList:       true,
                subtree:         true,
                attributes:      true,
                attributeFilter: [ 'style', 'class' ],
            } );
            scan();
        }, 800 );
    } );

} )();

// Toggle local navigation menu visibility
document.addEventListener('DOMContentLoaded', function() {
    const toggleButton = document.getElementById('local_navigation_menu_toggle');
    // Use a class-based query so the menu is found regardless of the
    // auto-generated ID that WordPress assigns based on the menu name/slug.
    const menu = document.querySelector('#local_navigation_menu .horizontal-menu');

    if (toggleButton && menu) {
        toggleButton.addEventListener('click', function() {
            const isExpanded = toggleButton.getAttribute('aria-expanded') === 'true';

            toggleButton.setAttribute('aria-expanded', !isExpanded);
            menu.setAttribute('aria-hidden', isExpanded);
            menu.classList.toggle('is-visible', !isExpanded);
        });
    }
});

// Microsite nav mobile toggle — injects a button and wires expand/collapse
document.addEventListener('DOMContentLoaded', function () {
    const container = document.querySelector('.microsite-nav-container');
    if (!container) return;

    const menu = container.querySelector('.horizontal-menu');
    if (!menu) return;

    const btn = document.createElement('button');
    btn.id = 'microsite_nav_toggle';
    btn.setAttribute('aria-expanded', 'false');
    btn.setAttribute('aria-label', 'Open Microsite Navigation');
    btn.innerHTML =
        '<span class="menu_icon"><svg viewBox="0 0 16 16">' +
        '<rect y="3" width="16" height="1"/>' +
        '<rect y="5" width="16" height="1"/>' +
        '<rect y="7" width="16" height="1"/>' +
        '<rect y="9" width="16" height="1"/>' +
        '<rect y="11" width="16" height="1"/>' +
        '</svg></span>' +
        '<span class="button_label">navigation</span>';

    container.prepend(btn);

    btn.addEventListener('click', function () {
        const isExpanded = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!isExpanded));
        btn.setAttribute('aria-label', !isExpanded ? 'Close Microsite Navigation' : 'Open Microsite Navigation');
        menu.classList.toggle('is-visible', !isExpanded);
    });

    document.addEventListener('click', function (e) {
        if (!container.contains(e.target) && menu.classList.contains('is-visible')) {
            menu.classList.remove('is-visible');
            btn.setAttribute('aria-expanded', 'false');
            btn.setAttribute('aria-label', 'Open Microsite Navigation');
        }
    });
});

// Search form toggle (accessible): manage ARIA, focusability and labels
document.addEventListener('DOMContentLoaded', function() {
    const toggleSearch = document.getElementById('search_control');
    const siteSearch = document.getElementById('site_search'); // container
    const searchForm = document.getElementById('search_form'); // actual form
    const closeBtn = document.getElementById('search_close');
    const searchInput = document.getElementById('search_input');

    if (!toggleSearch || !siteSearch || !searchForm || !closeBtn || !searchInput) return;

    // Utility: set elements non-focusable when closed
    function makeNonFocusable(el) {
        el.setAttribute('tabindex', '-1');
        el.setAttribute('aria-hidden', 'true');
    }

    function makeFocusable(el) {
        el.removeAttribute('tabindex');
        el.setAttribute('aria-hidden', 'false');
    }

    // Open action
    function openSearch() {
        siteSearch.classList.add('open');
        searchForm.setAttribute('aria-hidden', 'false');
        toggleSearch.setAttribute('aria-expanded', 'true');
        toggleSearch.setAttribute('aria-label', 'Close Search Form');
        closeBtn.setAttribute('aria-expanded', 'true');

        // make focusable
        makeFocusable(searchInput);
        makeFocusable(closeBtn);

        // focus the input
        setTimeout(() => searchInput.focus(), 10);
    }

    // Close action
    function closeSearch(returnFocus = true) {
        siteSearch.classList.remove('open');
        searchForm.setAttribute('aria-hidden', 'true');
        toggleSearch.setAttribute('aria-expanded', 'false');
        toggleSearch.setAttribute('aria-label', 'Open Search Form');
        closeBtn.setAttribute('aria-expanded', 'false');

        // remove from tab order
        makeNonFocusable(searchInput);
        makeNonFocusable(closeBtn);

        // clear input and return focus to the opener
        searchInput.value = '';
        if (returnFocus) toggleSearch.focus();
    }

    // Initialize closed state without moving focus
    closeSearch(false);

    // Toggle via opener
    toggleSearch.addEventListener('click', function(e) {
        const isOpen = toggleSearch.getAttribute('aria-expanded') === 'true';
        if (!isOpen) {
            openSearch();
        } else {
            closeSearch();
        }
    });

    // Close via close button
    closeBtn.addEventListener('click', function(e) {
        closeSearch();
    });

    // Close on Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && toggleSearch.getAttribute('aria-expanded') === 'true') {
            closeSearch();
        }
    });

    // Prevent tabbing into search input/buttons when closed (redundant guard)
    document.addEventListener('focusin', function(e) {
        if (toggleSearch.getAttribute('aria-expanded') !== 'true') {
            if (e.target === searchInput || e.target === closeBtn) {
                e.preventDefault();
                toggleSearch.focus();
            }
        }
    });

});