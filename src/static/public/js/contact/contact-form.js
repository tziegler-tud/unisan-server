$(document).ready(function(){


    $('.cont-flip').toggleClass('flipped');

    $('.flip').click(function(){
        $(this.parentNode.parentNode).toggleClass('flipped');
        return false;
    });
});