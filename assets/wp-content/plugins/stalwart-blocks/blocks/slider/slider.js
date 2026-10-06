document.addEventListener("DOMContentLoaded", () => {
    console.log("Slider block script loaded.");
    // Add slider functionality here.

    // Initialize the slider(s). This for loop allows for multiple slider instances on the same page.
    var elms = document.getElementsByClassName( 'splide' );

    for ( var i = 0; i < elms.length; i++ ) {
        new Splide( elms[ i ] ).mount();
    }
});
