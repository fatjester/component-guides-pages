/**
 * Content Query block — editor inspector panel.
 * Plain JS using WordPress globals; no build step, no JSX.
 */
(function (blocks, blockEditor, element, components, apiFetch) {
    'use strict';

    var el              = element.createElement;
    var useState        = element.useState;
    var useEffect       = element.useEffect;
    var Fragment        = element.Fragment;
    var useBlockProps   = blockEditor.useBlockProps;
    var InspectorControls = blockEditor.InspectorControls;
    var PanelBody       = components.PanelBody;
    var SelectControl   = components.SelectControl;
    var RadioControl    = components.RadioControl;
    var TextControl     = components.TextControl;
    var ToggleControl   = components.ToggleControl;
    var Button          = components.Button;
    var Spinner         = components.Spinner;

    // -----------------------------------------------------------------------
    // Helpers
    // -----------------------------------------------------------------------

    function cloneFilter(f) {
        return Object.assign({}, f, {
            terms:        (f.terms        || []).slice(),
            defaultTerms: (f.defaultTerms || []).slice(),
        });
    }

    // -----------------------------------------------------------------------
    // Edit component
    // -----------------------------------------------------------------------

    function ContentQueryEdit(props) {
        var attributes   = props.attributes;
        var setAttributes = props.setAttributes;

        var postType      = attributes.postType;
        var displayMode   = attributes.displayMode;
        var curatedIds    = attributes.curatedIds;
        var filters       = attributes.filters;
        var acrossOp      = attributes.acrossOperator;
        var columns       = attributes.columns;
        var postsPerPage  = attributes.postsPerPage;
        var showImage     = attributes.showImage;
        var showExcerpt   = attributes.showExcerpt;
        var orderBy       = attributes.orderBy;
        var imageRatio    = attributes.imageRatio;
        var headingLevel  = attributes.headingLevel;
        var termDisplays  = attributes.termDisplays;
        var layout        = attributes.layout;
        var tableColumns  = attributes.tableColumns;

        // Post types fetched from REST API.
        var postTypesState    = useState([]);
        var postTypes         = postTypesState[0];
        var setPostTypes      = postTypesState[1];
        var ptLoadingState    = useState(false);
        var ptLoading         = ptLoadingState[0];
        var setPtLoading      = ptLoadingState[1];

        // Rest-base lookup: { slug: rest_base }
        var restBasesState    = useState({});
        var restBases         = restBasesState[0];
        var setRestBases      = restBasesState[1];

        // Taxonomies for the chosen post type.
        var taxonomiesState   = useState([]);
        var taxonomies        = taxonomiesState[0];
        var setTaxonomies     = taxonomiesState[1];
        var taxLoadingState   = useState(false);
        var taxLoading        = taxLoadingState[0];
        var setTaxLoading     = taxLoadingState[1];

        // Terms per taxonomy: { tax_slug: [{id, name, slug}] }
        var termsByTaxState   = useState({});
        var termsByTax        = termsByTaxState[0];
        var setTermsByTax     = termsByTaxState[1];

        // Curated search.
        var searchQueryState  = useState('');
        var searchQuery       = searchQueryState[0];
        var setSearchQuery    = searchQueryState[1];
        var searchResultsState = useState([]);
        var searchResults     = searchResultsState[0];
        var setSearchResults  = searchResultsState[1];
        var searchLoadingState = useState(false);
        var searchLoading     = searchLoadingState[0];
        var setSearchLoading  = searchLoadingState[1];

        // Resolved titles for selected curated post IDs.
        var curatedPostsState = useState([]);
        var curatedPosts      = curatedPostsState[0];
        var setCuratedPosts   = curatedPostsState[1];

        // ---- Effects --------------------------------------------------------

        // Fetch post types once on mount.
        useEffect(function () {
            setPtLoading(true);
            apiFetch({ path: '/wp/v2/types?context=edit' }).then(function (types) {
                var excluded = [
                    'attachment', 'nav_menu_item', 'wp_block', 'wp_template',
                    'wp_template_part', 'wp_navigation', 'wp_font_family', 'wp_font_face',
                ];
                var options  = [{ label: '— Select a post type —', value: '' }];
                var bases    = {};
                Object.keys(types).forEach(function (slug) {
                    if (excluded.indexOf(slug) !== -1) return;
                    var t = types[slug];
                    if (t.viewable || t.rest_base) {
                        options.push({ label: t.name + ' (' + slug + ')', value: slug });
                        bases[slug] = t.rest_base || slug;
                    }
                });
                setPostTypes(options);
                setRestBases(bases);
                setPtLoading(false);
            }).catch(function () { setPtLoading(false); });
        }, []);

        // Fetch taxonomies whenever the post type changes.
        useEffect(function () {
            setTaxonomies([]);
            setTermsByTax({});
            if (!postType) return;
            setTaxLoading(true);
            apiFetch({ path: '/wp/v2/taxonomies?type=' + postType }).then(function (taxData) {
                var list = Object.keys(taxData).map(function (slug) {
                    return { slug: slug, name: taxData[slug].name, rest_base: taxData[slug].rest_base };
                });
                setTaxonomies(list);
                setTaxLoading(false);
                list.forEach(function (tax) {
                    apiFetch({ path: '/wp/v2/' + tax.rest_base + '?per_page=100&context=edit' }).then(function (terms) {
                        setTermsByTax(function (prev) {
                            var next = Object.assign({}, prev);
                            next[tax.slug] = terms.map(function (t) {
                                return { id: t.id, name: t.name, slug: t.slug };
                            });
                            return next;
                        });
                    }).catch(function () {});
                });
            }).catch(function () { setTaxLoading(false); });
        }, [postType]);

        // Debounced curated post search.
        useEffect(function () {
            if (displayMode !== 'curated' || !postType || searchQuery.length < 2) {
                setSearchResults([]);
                return;
            }
            setSearchLoading(true);
            var base  = restBases[postType] || postType;
            var timer = setTimeout(function () {
                apiFetch({ path: '/wp/v2/' + base + '?search=' + encodeURIComponent(searchQuery) + '&per_page=10&context=edit' })
                    .then(function (results) {
                        setSearchResults(results.map(function (p) {
                            return { id: p.id, title: p.title && p.title.rendered ? p.title.rendered : '(no title)' };
                        }));
                        setSearchLoading(false);
                    }).catch(function () { setSearchLoading(false); });
            }, 300);
            return function () { clearTimeout(timer); };
        }, [searchQuery, postType, displayMode]);

        // Resolve titles for saved curated IDs.
        useEffect(function () {
            if (!postType || !curatedIds || curatedIds.length === 0) {
                setCuratedPosts([]);
                return;
            }
            var base = restBases[postType] || postType;
            apiFetch({ path: '/wp/v2/' + base + '?include=' + curatedIds.join(',') + '&per_page=100&context=edit' })
                .then(function (results) {
                    var byId = {};
                    results.forEach(function (p) {
                        byId[p.id] = { id: p.id, title: p.title && p.title.rendered ? p.title.rendered : '(no title)' };
                    });
                    setCuratedPosts(curatedIds.map(function (id) {
                        return byId[id] || { id: id, title: '(ID: ' + id + ')' };
                    }));
                }).catch(function () {});
        }, [postType, (curatedIds || []).join(',')]);

        // ---- Handlers -------------------------------------------------------

        function onPostTypeChange(val) {
            setAttributes({ postType: val, filters: [], curatedIds: [] });
        }

        function onDisplayModeChange(val) {
            setAttributes({ displayMode: val, filters: [], curatedIds: [] });
        }

        function addCuratedPost(post) {
            if (curatedIds.indexOf(post.id) === -1) {
                setAttributes({ curatedIds: curatedIds.concat([post.id]) });
            }
            setSearchQuery('');
            setSearchResults([]);
        }

        function removeCuratedPost(id) {
            setAttributes({ curatedIds: curatedIds.filter(function (i) { return i !== id; }) });
        }

        function movePost(idx, dir) {
            var arr  = curatedIds.slice();
            var swap = idx + dir;
            if (swap < 0 || swap >= arr.length) return;
            var tmp   = arr[idx];
            arr[idx]  = arr[swap];
            arr[swap] = tmp;
            setAttributes({ curatedIds: arr });
        }

        function addFilter() {
            if (!taxonomies.length) return;
            setAttributes({
                filters: filters.concat([{
                    taxonomy:       taxonomies[0].slug,
                    terms:          [],
                    defaultTerms:   [],
                    showOnFrontend: displayMode === 'all',
                    label:          '',
                    inputType:      'checkboxes',
                    withinOperator: 'OR',
                }]),
            });
        }

        function updateFilter(idx, updates) {
            setAttributes({
                filters: filters.map(function (f, i) {
                    return i === idx ? Object.assign(cloneFilter(f), updates) : f;
                }),
            });
        }

        function removeFilter(idx) {
            setAttributes({ filters: filters.filter(function (_, i) { return i !== idx; }) });
        }

        function addTableColumn() {
            if (!taxonomies.length) return;
            var used = (tableColumns || []).map(function (c) { return c.taxonomy; });
            var next = null;
            for (var i = 0; i < taxonomies.length; i++) {
                if (used.indexOf(taxonomies[i].slug) === -1) { next = taxonomies[i]; break; }
            }
            if (!next) return;
            setAttributes({ tableColumns: (tableColumns || []).concat([{ taxonomy: next.slug, label: '' }]) });
        }

        function updateTableColumn(idx, updates) {
            setAttributes({
                tableColumns: (tableColumns || []).map(function (col, i) {
                    return i === idx ? Object.assign({}, col, updates) : col;
                }),
            });
        }

        function removeTableColumn(idx) {
            setAttributes({ tableColumns: (tableColumns || []).filter(function (_, i) { return i !== idx; }) });
        }

        function moveTableColumn(idx, dir) {
            var arr  = (tableColumns || []).slice();
            var swap = idx + dir;
            if (swap < 0 || swap >= arr.length) return;
            var tmp  = arr[idx]; arr[idx] = arr[swap]; arr[swap] = tmp;
            setAttributes({ tableColumns: arr });
        }

        function addTermDisplay() {
            if (!taxonomies.length) return;
            setAttributes({
                termDisplays: termDisplays.concat([{
                    taxonomy:  taxonomies[0].slug,
                    style:     'pills',
                    placement: 'above-title',
                    maxTerms:  0,
                }]),
            });
        }

        function updateTermDisplay(idx, updates) {
            setAttributes({
                termDisplays: termDisplays.map(function (td, i) {
                    return i === idx ? Object.assign({}, td, updates) : td;
                }),
            });
        }

        function removeTermDisplay(idx) {
            setAttributes({ termDisplays: termDisplays.filter(function (_, i) { return i !== idx; }) });
        }

        function toggleFilterTerm(filterIdx, termSlug) {
            var f    = cloneFilter(filters[filterIdx]);
            var pos  = f.terms.indexOf(termSlug);
            f.terms  = pos === -1 ? f.terms.concat([termSlug]) : f.terms.filter(function (s) { return s !== termSlug; });
            // Remove from defaultTerms any term that is no longer in terms (when terms is non-empty).
            var nextDefault = f.defaultTerms.filter(function (s) {
                return f.terms.length === 0 || f.terms.indexOf(s) !== -1;
            });
            updateFilter(filterIdx, { terms: f.terms, defaultTerms: nextDefault });
        }

        function toggleDefaultTerm(filterIdx, termSlug) {
            var f        = cloneFilter(filters[filterIdx]);
            var pos      = f.defaultTerms.indexOf(termSlug);
            f.defaultTerms = pos === -1
                ? f.defaultTerms.concat([termSlug])
                : f.defaultTerms.filter(function (s) { return s !== termSlug; });
            updateFilter(filterIdx, { defaultTerms: f.defaultTerms });
        }

        // ---- Render helpers -------------------------------------------------

        function renderPostTypeStep() {
            if (ptLoading) return el(Spinner, null);
            return el(SelectControl, {
                label:    'Post Type',
                value:    postType,
                options:  postTypes,
                onChange: onPostTypeChange,
            });
        }

        function renderDisplayModeStep() {
            return el(RadioControl, {
                label:    'Display Mode',
                selected: displayMode,
                options: [
                    { label: 'Curated — hand-pick individual posts',           value: 'curated'      },
                    { label: 'Pre-filtered — server-side taxonomy filters',    value: 'pre-filtered' },
                    { label: 'All / Frontend-filtered — visitors can filter',  value: 'all'          },
                ],
                onChange: onDisplayModeChange,
            });
        }

        function renderCuratedPicker() {
            return el('div', { className: 'stalwart-cq-curated-picker' },
                el(TextControl, {
                    label:       'Search posts by title',
                    value:       searchQuery,
                    placeholder: 'Start typing…',
                    onChange:    setSearchQuery,
                }),
                searchLoading && el(Spinner, null),
                searchResults.length > 0 && el('ul', { className: 'stalwart-cq-search-results' },
                    searchResults.map(function (p) {
                        return el('li', { key: p.id },
                            el(Button, { variant: 'tertiary', onClick: function () { addCuratedPost(p); } }, p.title)
                        );
                    })
                ),
                curatedPosts.length > 0 && el('div', { className: 'stalwart-cq-selected-posts' },
                    el('p', { className: 'stalwart-cq-selected-label' }, 'Selected posts (' + curatedPosts.length + '):'),
                    curatedPosts.map(function (p, idx) {
                        return el('div', { key: p.id, className: 'stalwart-cq-selected-post' },
                            el('span', { className: 'stalwart-cq-post-title' }, p.title),
                            el('span', { className: 'stalwart-cq-post-actions' },
                                idx > 0 && el(Button, {
                                    icon: 'arrow-up-alt2', label: 'Move up', isSmall: true,
                                    onClick: function () { movePost(idx, -1); },
                                }),
                                idx < curatedPosts.length - 1 && el(Button, {
                                    icon: 'arrow-down-alt2', label: 'Move down', isSmall: true,
                                    onClick: function () { movePost(idx, 1); },
                                }),
                                el(Button, {
                                    icon: 'no-alt', label: 'Remove', isSmall: true, isDestructive: true,
                                    onClick: function () { removeCuratedPost(p.id); },
                                })
                            )
                        );
                    })
                )
            );
        }

        function renderFilterBuilder() {
            var isFrontendMode = displayMode === 'all';
            var taxOptions     = taxonomies.map(function (t) { return { label: t.name, value: t.slug }; });

            return el('div', { className: 'stalwart-cq-filter-builder' },
                taxLoading && el(Spinner, null),

                filters.map(function (filter, idx) {
                    var taxTerms          = termsByTax[filter.taxonomy] || [];
                    var availableForDefault = filter.terms && filter.terms.length > 0
                        ? taxTerms.filter(function (t) { return filter.terms.indexOf(t.slug) !== -1; })
                        : taxTerms;

                    return el('div', { key: idx, className: 'stalwart-cq-filter-row' },

                        el('div', { className: 'stalwart-cq-filter-row-header' },
                            el('strong', null, 'Filter ' + (idx + 1)),
                            el(Button, {
                                icon: 'no-alt', label: 'Remove filter', isSmall: true, isDestructive: true,
                                onClick: function () { removeFilter(idx); },
                            })
                        ),

                        taxOptions.length > 0 && el(SelectControl, {
                            label:    'Taxonomy',
                            value:    filter.taxonomy,
                            options:  taxOptions,
                            onChange: function (val) { updateFilter(idx, { taxonomy: val, terms: [] }); },
                        }),

                        taxTerms.length > 0 && el('div', { className: 'stalwart-cq-term-picker' },
                            el('span', { className: 'stalwart-cq-term-picker-label' }, 'Terms to include'),
                            taxTerms.map(function (term) {
                                return el('label', { key: term.id, className: 'stalwart-cq-term-option' },
                                    el('input', {
                                        type:    'checkbox',
                                        checked: filter.terms.indexOf(term.slug) !== -1,
                                        onChange: function () { toggleFilterTerm(idx, term.slug); },
                                    }),
                                    ' ' + term.name
                                );
                            })
                        ),

                        el(SelectControl, {
                            label:    'Within-filter operator',
                            value:    filter.withinOperator || 'OR',
                            options: [
                                { label: 'OR — any selected term matches',     value: 'OR'  },
                                { label: 'AND — post must have all terms',     value: 'AND' },
                            ],
                            onChange: function (val) { updateFilter(idx, { withinOperator: val }); },
                        }),

                        isFrontendMode && el(ToggleControl, {
                            label:    'Show to visitors',
                            checked:  !!filter.showOnFrontend,
                            onChange: function (val) { updateFilter(idx, { showOnFrontend: val }); },
                        }),

                        isFrontendMode && filter.showOnFrontend && availableForDefault.length > 0 && el('div', { className: 'stalwart-cq-term-picker' },
                            el('span', { className: 'stalwart-cq-term-picker-label' }, 'Pre-selected on load'),
                            availableForDefault.map(function (term) {
                                return el('label', { key: term.id, className: 'stalwart-cq-term-option' },
                                    el('input', {
                                        type:     'checkbox',
                                        checked:  (filter.defaultTerms || []).indexOf(term.slug) !== -1,
                                        onChange: function () { toggleDefaultTerm(idx, term.slug); },
                                    }),
                                    ' ' + term.name
                                );
                            })
                        ),

                        isFrontendMode && filter.showOnFrontend && el(TextControl, {
                            label:       'Label override',
                            value:       filter.label || '',
                            placeholder: 'Defaults to taxonomy label',
                            onChange:    function (val) { updateFilter(idx, { label: val }); },
                        }),

                        isFrontendMode && filter.showOnFrontend && el(SelectControl, {
                            label:    'Input type',
                            value:    filter.inputType || 'checkboxes',
                            options: [
                                { label: 'Checkboxes',    value: 'checkboxes' },
                                { label: 'Radio buttons', value: 'radio'      },
                                { label: 'Dropdown',      value: 'dropdown'   },
                            ],
                            onChange: function (val) { updateFilter(idx, { inputType: val }); },
                        }),

                        el('hr', { className: 'stalwart-cq-filter-divider' })
                    );
                }),

                el('div', { className: 'stalwart-cq-filter-actions' },
                    el(Button, {
                        variant:  'secondary',
                        icon:     'plus',
                        disabled: !taxonomies.length,
                        onClick:  addFilter,
                    }, 'Add filter')
                ),

                filters.length > 1 && el(SelectControl, {
                    label:    'Across-filter logic',
                    value:    acrossOp,
                    options: [
                        { label: 'AND — post must satisfy all filters',  value: 'AND' },
                        { label: 'OR — post matching any filter shown',  value: 'OR'  },
                    ],
                    onChange: function (val) { setAttributes({ acrossOperator: val }); },
                })
            );
        }

        function renderTableColumnBuilder() {
            var cols       = tableColumns || [];
            var taxOptions = taxonomies.map(function (t) { return { label: t.name, value: t.slug }; });
            var allUsed    = cols.length >= taxonomies.length;

            return el('div', { className: 'stalwart-cq-filter-builder' },
                taxLoading && el(Spinner, null),
                cols.length === 0 && el('p', { style: { margin: '0 0 0.5rem', color: '#757575' } },
                    'The title column is always first. Add taxonomy columns below.'
                ),
                cols.map(function (col, idx) {
                    return el('div', { key: idx, className: 'stalwart-cq-filter-row' },
                        el('div', { className: 'stalwart-cq-filter-row-header' },
                            el('strong', null, 'Column ' + (idx + 2)),
                            el('span', { className: 'stalwart-cq-post-actions' },
                                idx > 0 && el(Button, {
                                    icon: 'arrow-up-alt2', label: 'Move up', isSmall: true,
                                    onClick: function () { moveTableColumn(idx, -1); },
                                }),
                                idx < cols.length - 1 && el(Button, {
                                    icon: 'arrow-down-alt2', label: 'Move down', isSmall: true,
                                    onClick: function () { moveTableColumn(idx, 1); },
                                }),
                                el(Button, {
                                    icon: 'no-alt', label: 'Remove column', isSmall: true, isDestructive: true,
                                    onClick: function () { removeTableColumn(idx); },
                                })
                            )
                        ),
                        taxOptions.length > 0 && el(SelectControl, {
                            label:    'Taxonomy',
                            value:    col.taxonomy,
                            options:  taxOptions,
                            onChange: function (val) { updateTableColumn(idx, { taxonomy: val }); },
                        }),
                        el(TextControl, {
                            label:       'Column label override',
                            value:       col.label || '',
                            placeholder: 'Defaults to taxonomy label',
                            onChange:    function (val) { updateTableColumn(idx, { label: val }); },
                        }),
                        el('hr', { className: 'stalwart-cq-filter-divider' })
                    );
                }),
                el('div', { className: 'stalwart-cq-filter-actions' },
                    el(Button, {
                        variant:  'secondary',
                        icon:     'plus',
                        disabled: !taxonomies.length || allUsed,
                        onClick:  addTableColumn,
                    }, 'Add column')
                )
            );
        }

        function renderTermDisplayBuilder() {
            var taxOptions = taxonomies.map(function (t) { return { label: t.name, value: t.slug }; });

            var contentPlacements = [
                { label: 'Above title',   value: 'above-title'   },
                { label: 'Below title',   value: 'below-title'   },
                { label: 'Below excerpt', value: 'below-excerpt' },
            ];

            return el('div', { className: 'stalwart-cq-filter-builder' },
                taxLoading && el(Spinner, null),

                termDisplays.map(function (td, idx) {
                    var isRibbon = td.style === 'ribbon';

                    return el('div', { key: idx, className: 'stalwart-cq-filter-row' },

                        el('div', { className: 'stalwart-cq-filter-row-header' },
                            el('strong', null, 'Term Display ' + (idx + 1)),
                            el(Button, {
                                icon: 'no-alt', label: 'Remove', isSmall: true, isDestructive: true,
                                onClick: function () { removeTermDisplay(idx); },
                            })
                        ),

                        taxOptions.length > 0 && el(SelectControl, {
                            label:    'Taxonomy',
                            value:    td.taxonomy,
                            options:  taxOptions,
                            onChange: function (val) { updateTermDisplay(idx, { taxonomy: val }); },
                        }),

                        el(RadioControl, {
                            label:    'Style',
                            selected: td.style || 'pills',
                            options: [
                                { label: 'Pills',  value: 'pills'  },
                                { label: 'Kicker', value: 'kicker' },
                                { label: 'Ribbon', value: 'ribbon' },
                            ],
                            onChange: function (val) {
                                var defaultPlacement = val === 'ribbon' ? 'top-left' : 'above-title';
                                updateTermDisplay(idx, { style: val, placement: defaultPlacement });
                            },
                        }),

                        !isRibbon && el(SelectControl, {
                            label:    'Placement',
                            value:    td.placement || 'above-title',
                            options:  contentPlacements,
                            onChange: function (val) { updateTermDisplay(idx, { placement: val }); },
                        }),

                        !isRibbon && el(RadioControl, {
                            label:    'Terms to show',
                            selected: String(td.maxTerms || 0),
                            options: [
                                { label: 'All terms',       value: '0' },
                                { label: 'First term only', value: '1' },
                            ],
                            onChange: function (val) { updateTermDisplay(idx, { maxTerms: parseInt(val, 10) }); },
                        }),

                        el('hr', { className: 'stalwart-cq-filter-divider' })
                    );
                }),

                el('div', { className: 'stalwart-cq-filter-actions' },
                    el(Button, {
                        variant:  'secondary',
                        icon:     'plus',
                        disabled: !taxonomies.length,
                        onClick:  addTermDisplay,
                    }, 'Add term display')
                )
            );
        }

        // ---- Full render ----------------------------------------------------

        var blockProps = useBlockProps({ className: 'stalwart-content-query-editor-preview' });

        var previewBody = !postType
            ? el('p', { className: 'stalwart-cq-editor-placeholder' },
                'Select a post type in the block settings to configure this block.')
            : el('div', { className: 'stalwart-cq-editor-summary' },
                el('p', null,
                    el('strong', null, 'Content Query'),
                    ' — ',
                    postType,
                    ' · ',
                    displayMode,
                    ' · ',
                    columns + ' columns'
                )
            );

        return el(Fragment, null,
            el(InspectorControls, null,
                el(PanelBody, { title: 'Query Settings', initialOpen: true },
                    renderPostTypeStep(),
                    postType && renderDisplayModeStep(),
                    postType && displayMode === 'curated'      && renderCuratedPicker(),
                    postType && displayMode !== 'curated'      && renderFilterBuilder()
                ),
                postType && el(PanelBody, { title: 'Display Settings', initialOpen: false },
                    el(RadioControl, {
                        label:    'Layout',
                        selected: layout || 'grid',
                        options: [
                            { label: 'Cards', value: 'grid'  },
                            { label: 'Table', value: 'table' },
                        ],
                        onChange: function (val) { setAttributes({ layout: val }); },
                    }),
                    el('hr', { className: 'stalwart-cq-filter-divider' }),

                    layout !== 'table' && el(RadioControl, {
                        label:    'Columns',
                        selected: String(columns),
                        options: [
                            { label: '2', value: '2' },
                            { label: '3', value: '3' },
                            { label: '4', value: '4' },
                        ],
                        onChange: function (val) { setAttributes({ columns: parseInt(val, 10) }); },
                    }),
                    layout !== 'table' && el(RadioControl, {
                        label:    'Image aspect ratio',
                        selected: imageRatio,
                        options: [
                            { label: 'Natural', value: 'natural' },
                            { label: '1:1',     value: '1-1'     },
                            { label: '4:3',     value: '4-3'     },
                            { label: '16:9',    value: '16-9'    },
                            { label: '2:1',     value: '2-1'     },
                        ],
                        onChange: function (val) { setAttributes({ imageRatio: val }); },
                    }),
                    layout !== 'table' && el(ToggleControl, {
                        label:    'Show featured image',
                        checked:  showImage,
                        onChange: function (val) { setAttributes({ showImage: val }); },
                    }),
                    layout !== 'table' && el(ToggleControl, {
                        label:    'Show excerpt',
                        checked:  showExcerpt,
                        onChange: function (val) { setAttributes({ showExcerpt: val }); },
                    }),
                    layout !== 'table' && el(SelectControl, {
                        label:    'Heading Level',
                        value:    String(headingLevel),
                        options: [
                            { label: 'H2', value: '2' },
                            { label: 'H3', value: '3' },
                            { label: 'H4', value: '4' },
                            { label: 'H5', value: '5' },
                            { label: 'None (paragraph)', value: '0' },
                        ],
                        onChange: function (val) { setAttributes({ headingLevel: parseInt(val, 10) }); },
                    }),

                    el(TextControl, {
                        label:    'Posts per page (−1 for all)',
                        type:     'number',
                        value:    String(postsPerPage),
                        onChange: function (val) { setAttributes({ postsPerPage: parseInt(val, 10) || -1 }); },
                    }),
                    el(SelectControl, {
                        label:    'Order by',
                        value:    orderBy,
                        options: [
                            { label: 'Title A–Z',    value: 'title_asc'  },
                            { label: 'Title Z–A',    value: 'title_desc' },
                            { label: 'Newest first', value: 'newest'     },
                            { label: 'Oldest first', value: 'oldest'     },
                            { label: 'Menu order',   value: 'menu_order' },
                        ],
                        onChange: function (val) { setAttributes({ orderBy: val }); },
                    }),

                    layout === 'table' && el('hr', { className: 'stalwart-cq-filter-divider' }),
                    layout === 'table' && el('p', { style: { margin: '0 0 0.5rem', fontWeight: 600 } }, 'Table Columns'),
                    layout === 'table' && renderTableColumnBuilder(),

                    layout !== 'table' && el('hr', { className: 'stalwart-cq-filter-divider' }),
                    layout !== 'table' && el('p', { style: { margin: '0 0 0.5rem', fontWeight: 600 } }, 'Term Displays'),
                    layout !== 'table' && renderTermDisplayBuilder()
                )
            ),
            el('div', blockProps, previewBody)
        );
    }

    // Register the block type (client-side; server-side registration via block.json + render_callback).
    blocks.registerBlockType('stalwart-blocks/content-query', {
        edit: ContentQueryEdit,
        save: function () { return null; },
    });

}(window.wp.blocks, window.wp.blockEditor, window.wp.element, window.wp.components, window.wp.apiFetch));
