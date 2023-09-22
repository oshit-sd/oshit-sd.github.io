(function ($) {

    "use strict";

    window.onload = (event) => {
        setTimeout(() => {
            $('#counter').load('elements/counter.html');
        }, 300);
    };

    $('#logo-hanging').load('elements/logo-hanging.html');

})(jQuery);
