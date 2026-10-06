wp.domReady(() => {

	// Unregister general core blocks
	const blocksToUnregister = [
		'core/verse',
		'core/freeform',
		'core/more',
		'core/nextpage',
		'core/archives',
		'core/calendar',
		'core/categories',
		'core/latest-comments',
		//'core/latest-posts',
		'core/page-list',
		'core/site-logo',
		'core/site-title',
		'core/site-tagline',
		//'core/query',
		'core/comments',
		//'core/template-part',
		'core/post-content',
		'core/loginout',
		'core/term-description',
		'core/tag-cloud',
		'core/avatar',
		'core/comments-count',
		'core/comments-link',
		'core/date',
		'core/previous-post',
		'core/next-post',
		'core/comments-form',
		'core/term-count',
		'core/terms-name',
		'core/terms-query',
		'core/search-results-title',
		'core/post-type-label',
		'core/author-biography',
		'core/breadcrumbs'
	];

	blocksToUnregister.forEach((blockName) => {
		wp.blocks.unregisterBlockType(blockName);
	});

	// ✅ Unregister embed VARIATIONS instead of block types
	const allowedEmbeds = [
		'youtube',
		'flickr',
		'issuu',
		'tiktok'
	];

	const variations = wp.blocks.getBlockVariations('core/embed') || [];

	variations.forEach((variation) => {
		if (!allowedEmbeds.includes(variation.name)) {
			wp.blocks.unregisterBlockVariation('core/embed', variation.name);
		}
	});

	console.log(
		'Remaining embed variations:',
		wp.blocks.getBlockVariations('core/embed').map(v => v.name)
	);

	// Unregister block styles
	wp.blocks.unregisterBlockStyle('core/separator', 'dots');
	wp.blocks.unregisterBlockStyle('core/separator', 'wide');

	// Add a class to define how many columns are in a "Columns" block
	const updateColumnCountClasses = () => {
		const columnBlocks = document.querySelectorAll('.wp-block-columns');

		columnBlocks.forEach((block) => {
			const columns = block.querySelectorAll('.wp-block-column');
			const count = columns.length;

			// Remove existing count class
			block.className = block.className.replace(/\bcolumns--\d+\b/g, '');

			// Add new count class
			block.classList.add(`columns-${count}`);
		});
	};

	// Initial run
	updateColumnCountClasses();

	// Re-run when blocks update (optional)
	const observer = new MutationObserver(updateColumnCountClasses);
	observer.observe(document.body, { childList: true, subtree: true });
});


// Set the default height of the spacer block
wp.hooks.addFilter(
	'blocks.registerBlockType',
	'find-your-energy/default-spacer-height',
	function (settings, name) {
		if (name === 'core/spacer') {
			return {
				...settings, // keep everything from the original block
				attributes: {
					...settings.attributes, // keep all existing attributes
					height: {
						type: 'string', // change to string so we can use 'rem'
						default: '6rem' // default height in rem instead of px
					}
				}
			};
		}
		return settings;
	}
);