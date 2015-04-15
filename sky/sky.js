/**
 * Created by shuding on 3/27/15.
 * <ds303077135@gmail.com>
 */
;(function (window, undefined) {

    var randomColorHex = function () {
        // random color, via randomcolour.com
        var randomHex = Math.floor(Math.random() * 16777215).toString(16);
        var color = "#" + ("000000" + randomHex).slice(-6);

        return color;
    };

    var getGradientCSS = function (color1, color2) {
        var gradient = 'to top, ' + color1 + ' 0%, ' + color2 + ' 100%';
        var gradientCSS ='linear-gradient(' + gradient + ')';

        return gradientCSS;
    };

    var layer = [
        document.getElementById('layer-1'),
        document.getElementById('layer-2'),
        document.getElementById('layer-3'),
        document.getElementById('layer-4')
    ], currentLayer = 0;

    var setGradient = function (layerNo) {
        layer[layerNo].style.background = getGradientCSS(randomColorHex(), randomColorHex());
    };

    var swapGradient = function () {
        if (currentLayer % 2 == 0) {
            layer[currentLayer].style.opacity = 0;
            setGradient(2 - currentLayer);
            layer[2 - currentLayer].style.opacity = 1;
        }
        else {
            layer[currentLayer].style.opacity = 0;
            setGradient(4 - currentLayer);
            layer[4 - currentLayer].style.opacity = 1;
        }

        currentLayer = (currentLayer + 1) % 4;
    };

    setInterval(swapGradient, 1500);
})(window);