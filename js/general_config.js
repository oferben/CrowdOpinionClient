/* jQuery Mobile settings configuration */
$(document).bind("mobileinit", function() {
    $.extend($.mobile, {
        defaultPageTransition: 'slide'
    });
    $.mobile.page.prototype.options.addBackBtn = true;
    $.mobile.page.prototype.options.backBtnTheme = "b";
    
    // Loading
    $.mobile.loader.prototype.options.text = "Loading";
    $.mobile.loader.prototype.options.textVisible = true;
    
    /* A work around for this
     https://github.com/jquery/jquery-mobile/issues/4078 */
    $('#prev-asked').on('pageshow', function(e) {
        $(this).addClass('ui-page-active');
    });
    
    /* Initialize database */
    window.db = openDatabase('crowdopinion', '1.0', 'CrowdOpinion local database', 65536);
    window.escapeString = function(str) {
        return (str + '').replace(/[\\"']/g, '\\$&').replace(/\u0000/g, '\\0');
    };
    
    // Set swipe configuration.
    // More than this horizontal displacement, and we will suppress scrolling.
    $.event.special.swipe.scrollSupressionThreshold = 10;
    // More time than this, and it isn't a swipe.
    $.event.special.swipe.durationThreshold = 1300;
    // Swipe horizontal displacement must be more than this.
    $.event.special.swipe.horizontalDistanceThreshold = 120;
    
    // Prevent jQuery mobile from changing the page title
    $(":jqmData(role='page')").attr("data-title", document.title);
            
    handlePageOnResize();
});

/* Backend Node.js server address */
window.backendServerAddress = 'http://crowdopinion.aws.af.cm/';

/* Amount of available coins */
window.availableCoins = 0;

/* Add to home configuration */
var addToHomeConfig = {
	animationIn: 'fade',
	animationOut: 'drop',
	lifespan:10000,
	expire:2,
	touchIcon:true,
	message:'Install CrowdOpinion on your <strong>%device</strong>. Tap `%icon` and click <strong>Add to Home Screen</strong>.'
};

window.addEventListener("resize", handlePageOnResize);
var initialScreenSize = window.innerHeight;
function handlePageOnResize() {

    /* Hack to hide footer when the keyboard shows up on Android devices.
     * Taken from: http://stackoverflow.com/a/13176372/588879
     */
    if (window.innerHeight < initialScreenSize) {
        $("[data-role=footer]").hide();
    }
    else {
        $("[data-role=footer]").show();
    }

    var contentHeight = window.innerHeight - 135;
    $(".content").css("height", contentHeight + "px");
}

/*  It will be read only once, when the site is loaded, not on every page!!! 
 see: http://jquerymobile.com/demos/1.2.0/docs/api/events.html */
$(document).ready(function() {

    /* Set fixed header and footer (taken from: http://stackoverflow.com/a/15203532/588879).
     * Also, prevent the header from covering the text. */
    $("[data-role=header],[data-role=footer]").fixedtoolbar({tapToggle: false});
    $("[data-role=content]").css('margin-top', '30px').css('margin-bottom', '30px');

    /* Load footer simultaneously on all pages */
    $('.footer').html('<div data-role="footer" data-position="fixed" data-theme="a"><h4><a href="#about" style="color:#fff;">About</a><span class="divider">|</span><a href="#help" style="color:#fff;">Help</a><span class="divider">|</span><a href="#terms" style="color:#fff;">Terms of Use</a></h4></div>');
});