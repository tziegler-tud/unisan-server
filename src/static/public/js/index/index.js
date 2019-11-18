(function (index,$,undefined) {
    $(document).ready (function () {
        index.header = document.getElementById("content-top");
    });

    index.scrollOpacity = function (e){
        var scrollTop = e.scrollTop,
            height = index.header.clientHeight,

            range = height/1,
            calc = 1 - (scrollTop) / range;

        if (calc > '1') {
            calc = 1;

        }
        if (calc <= '0') {
            calc = 0;
        }

        $(index.header).css({'opacity': calc});
    };


    return index;

}(window.index = window.index || {}, jQuery));