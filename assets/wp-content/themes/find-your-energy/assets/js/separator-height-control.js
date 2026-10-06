/* global wp */
( function ( wp ) {
	if ( ! wp || ! wp.hooks || ! wp.element || ! wp.components ) {
		return;
	}

	const { addFilter } = wp.hooks;
	const { Fragment, createElement } = wp.element;
	const {
		PanelBody,
		RangeControl,
		UnitControl: StableUnitControl,
		__experimentalUnitControl: ExperimentalUnitControl,
	} = wp.components;
	const { InspectorControls } = wp.blockEditor || wp.editor || {};

	const UnitControl = StableUnitControl || ExperimentalUnitControl;
	if ( ! PanelBody || ! UnitControl || ! RangeControl || ! InspectorControls ) {
		return;
	}

	const DEFAULT_UNIT      = 'rem';
	const DEFAULT_HEIGHT    = 6;
	const SCRIPT_NAMESPACE  = 'find-your-energy/separator-height-control';

	const UNIT_CHOICES = [
		{ value: 'px',  label: 'px' },
		{ value: 'em',  label: 'em' },
		{ value: 'rem', label: 'rem' },
		{ value: '%',   label: '%' },
		{ value: 'vh',  label: 'vh' },
		{ value: 'vw',  label: 'vw' },
	];

	// Slider range/step per unit
	const SLIDER_RANGES = {
		px:  { min: 1,   max: 500, step: 1   },
		rem: { min: 0.5, max: 30,  step: 0.5 },
		em:  { min: 0.5, max: 30,  step: 0.5 },
		'%': { min: 1,   max: 100, step: 1   },
		vh:  { min: 1,   max: 100, step: 1   },
		vw:  { min: 1,   max: 100, step: 1   },
	};

	/**
	 * Add customHeight / customHeightUnit attributes to core/separator.
	 * Default is null so existing separators without the attribute pass
	 * block validation unchanged — the PHP render_block filter applies
	 * the height on the frontend without touching saved HTML.
	 */
	addFilter(
		'blocks.registerBlockType',
		`${ SCRIPT_NAMESPACE }/attributes`,
		( settings, name ) => {
			if ( name !== 'core/separator' ) {
				return settings;
			}

			return {
				...settings,
				attributes: {
					...( settings.attributes || {} ),
					customHeight: {
						type: 'number',
						default: null,
					},
					customHeightUnit: {
						type: 'string',
						default: DEFAULT_UNIT,
					},
					align: {
						type: 'string',
						default: 'full',
					},
				},
			};
		}
	);

	/**
	 * Inject Height panel (UnitControl + RangeControl slider) into the
	 * separator's inspector sidebar.
	 */
	addFilter(
		'editor.BlockEdit',
		`${ SCRIPT_NAMESPACE }/control`,
		( BlockEdit ) => ( props ) => {
			if ( props.name !== 'core/separator' ) {
				return createElement( BlockEdit, props );
			}

			const { attributes = {}, setAttributes } = props;
			const {
				customHeight,
				customHeightUnit = DEFAULT_UNIT,
				align,
			} = attributes;

			const unit  = customHeightUnit || DEFAULT_UNIT;
			const range = SLIDER_RANGES[ unit ] || SLIDER_RANGES.rem;

			// Value shown in the slider — fall back to DEFAULT_HEIGHT so the
			// slider has a sensible position before the user sets anything.
			const sliderValue =
				typeof customHeight === 'number' && Number.isFinite( customHeight )
					? customHeight
					: DEFAULT_HEIGHT;

			// Value shown in the UnitControl text input.
			const inputValue =
				typeof customHeight === 'number' && Number.isFinite( customHeight )
					? `${ customHeight }${ unit }`
					: '';

			// Ensure align defaults to full on mount.
			if ( ! align ) {
				setAttributes( { align: 'full' } );
			}

			const handleUnitControlChange = ( value ) => {
				if ( typeof value !== 'string' ) {
					return;
				}
				const match = value.trim().match( /^([\d.]+)([a-z%]*)$/ );
				if ( ! match ) {
					setAttributes( { customHeight: null, customHeightUnit: unit } );
					return;
				}
				const amount  = parseFloat( match[ 1 ] );
				const newUnit = match[ 2 ] || unit;
				setAttributes( {
					customHeight:     Number.isFinite( amount ) ? amount : null,
					customHeightUnit: newUnit,
				} );
			};

			const handleRangeChange = ( value ) => {
				setAttributes( { customHeight: value } );
			};

			return createElement(
				Fragment,
				null,
				createElement( BlockEdit, props ),
				createElement(
					InspectorControls,
					null,
					createElement(
						PanelBody,
						{ title: 'Separator Height', initialOpen: true },
						createElement( UnitControl, {
							label:       'Height',
							value:       inputValue,
							placeholder: `${ DEFAULT_HEIGHT }${ unit }`,
							onChange:    handleUnitControlChange,
							units:       UNIT_CHOICES,
							min:         range.min,
							max:         range.max,
							step:        range.step,
						} ),
						createElement( RangeControl, {
							value:          sliderValue,
							onChange:       handleRangeChange,
							min:            range.min,
							max:            range.max,
							step:           range.step,
							withInputField: false,
						} )
					)
				)
			);
		}
	);

} )( window.wp );
