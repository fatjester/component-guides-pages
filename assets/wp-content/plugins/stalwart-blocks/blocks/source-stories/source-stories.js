document.addEventListener("DOMContentLoaded", () => {

    enforceAspectRatios();
    
    // Resize event with debounce
    let resizeTimeout;
    let lastWidth = window.innerWidth;

    window.addEventListener("resize", function () {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            const newWidth = window.innerWidth;

            // Only trigger updates when crossing breakpoints
            if (
                (lastWidth >= 992 && newWidth < 992) || 
                (lastWidth < 992 && newWidth >= 992) ||
                (lastWidth >= 768 && newWidth < 768) ||
                (lastWidth < 768 && newWidth >= 768)
            ) {
                enforceAspectRatios();
            }

            lastWidth = newWidth;
        }, 150);
    });
});

function enforceAspectRatios() {
    document.querySelectorAll('.stalwart-source-image-wrapper.ratio').forEach(wrapper => {
        const img = wrapper.querySelector('img');
        
        if (img && img.complete) {
            applyMaxHeight(wrapper);
        } else if (img) {
            img.onload = () => applyMaxHeight(wrapper);
        }
    });
}

function applyMaxHeight(wrapper) {
    const width = wrapper.offsetWidth;
    
    if (width > 0) {
        const aspectRatio = getAspectRatio(wrapper);
        if (aspectRatio) {
            wrapper.style.maxHeight = `${width * aspectRatio}px`;
        }
    }
}

function getAspectRatio(element) {
    // Find a class that matches "aspect-x-y"
    const classList = Array.from(element.classList);
    const aspectClass = classList.find(cls => cls.startsWith('aspect-'));

    if (aspectClass) {
        const matches = aspectClass.match(/^aspect-(\d+)-(\d+)$/);
        if (matches) {
            const x = parseFloat(matches[1]);
            const y = parseFloat(matches[2]);
            return y / x; // Convert width:height to multiplier for max-height
        }
    }
    
    return null; // Default to no modification if no valid aspect class found
}