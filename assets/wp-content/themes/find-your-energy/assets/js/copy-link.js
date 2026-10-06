document.addEventListener('DOMContentLoaded', function () {
	const copyBtn = document.getElementById('copy-share-link');
	const feedback = document.getElementById('copy-feedback');

	if (!copyBtn) return;

	copyBtn.addEventListener('click', function () {
		const link = this.getAttribute('data-link');

		// Try Clipboard API first
		if (navigator.clipboard && navigator.clipboard.writeText) {
			navigator.clipboard.writeText(link).then(function () {
				showFeedback();
			}).catch(function (err) {
				console.error('Clipboard API failed, falling back...', err);
				fallbackCopy(link);
			});
		} else {
			// Fallback
			fallbackCopy(link);
		}
	});

	function fallbackCopy(text) {
		const tempInput = document.createElement('input');
		tempInput.value = text;
		document.body.appendChild(tempInput);
		tempInput.select();
		try {
			const successful = document.execCommand('copy');
			if (successful) {
				showFeedback();
			} else {
				alert('Copy failed. Please copy manually.');
			}
		} catch (err) {
			alert('Copy not supported in this browser.');
		}
		document.body.removeChild(tempInput);
	}

	function showFeedback() {
		if (!feedback) return;
		feedback.style.display = 'block';
		setTimeout(() => feedback.style.display = 'none', 2500);
	}
});