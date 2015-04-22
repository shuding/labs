;(function () {
    var cursorStyleClasses = [
        "n",
        "ne",
        "e",
        "es",
        "s",
        "sw",
        "w",
        "wn"
    ];
    var cursorNow = 0;

    var changeStyle = function () {
        cursorNow = (cursorNow + 1) % cursorStyleClasses.length;
        document.body.className = cursorStyleClasses[cursorNow];
    };

    setInterval(changeStyle, 60);
})();
