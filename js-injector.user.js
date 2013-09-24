// ==UserScript==
// @name        js-injector
// @namespace   http://fast.sourceforge.org
// @include     *
// @version     1
// @grant       none
// ==/UserScript==

function injectExternalJS(url) {
    var head = document.getElementsByTagName("head")[0];

    for (var i = 0; i < arguments.length; i++) {
        var e = document.createElement("script");
        e.setAttribute("type", "text/javascript");
        e.setAttribute("src", arguments[i]);
        head.appendChild(e);
    }
}

function injectExternalCss(url){
    var head = document.getElementsByTagName("head")[0];

    for (var i = 0; i < arguments.length; i++) {
        var e = document.createElement("link");
        e.setAttribute("type", "text/css");
        e.setAttribute("rel", "stylesheet");
        e.setAttribute("href", arguments[i]);
        head.appendChild(e);
    }
}
injectExternalCss("http://code.jquery.com/ui/jquery-ui-git.css");

injectExternalJS("http://code.jquery.com/jquery-2.0.3.min.js",
"http://underscorejs.org/underscore-min.js",
"http://code.jquery.com/ui/jquery-ui-git.js",
"https://raw.github.com/forchr/jsutils/master/jquery.simulate.js",
"https://raw.github.com/j-ulrich/jquery-simulate-ext/master/libs/bililiteRange.js",
"https://raw.github.com/j-ulrich/jquery-simulate-ext/master/src/jquery.simulate.ext.js",
"https://raw.github.com/j-ulrich/jquery-simulate-ext/master/src/jquery.simulate.drag-n-drop.js",
"https://raw.github.com/j-ulrich/jquery-simulate-ext/master/src/jquery.simulate.key-combo.js",
"https://raw.github.com/j-ulrich/jquery-simulate-ext/master/src/jquery.simulate.key-sequence.js",
"http://underscorejs.org/underscore-min.js"
);
window.injectExternalJS = injectExternalJS;
window.injectExternalCss = injectExternalCss;
