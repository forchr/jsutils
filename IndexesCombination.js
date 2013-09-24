/**
 * 计算下标组合。
 * @param {Array of int} maxes index maximums.
 * @param {Array of int} curs current indexes.
 */
function IndexesCombination(maxes, curs) {
    if (!(maxes instanceof Array)) {
        throw "must supply maxes array.";
    }
    var total = 1;
    for (var i = 0; i < maxes.length; i++) {
        if (maxes[i] < 0) {
            throw "maximum must be greater than zero.";
        }
        total *= maxes[i] + 1;
    }
    this.getMaxes = function() {
        var a = [];
        for (var i = 0; i < maxes.length; i++) {
            a[i] = maxes[i];
        }
        return a;
    };
    this.getTotal = function() {
        return total;
    };
    this.getSize = function() {
        return maxes.length;
    };
    var last = maxes.length - 1;
    if (!(curs instanceof Array)) {
        curs = new Array();
    }
    for (var i = 0; i < last; i++) {
        if (typeof curs[i] !== "number" || curs[i] < 0) {
            curs[i] = 0;
        }
    }

    if (typeof curs[last] !== "number" || curs[last] < -1) {
        curs[last] = -1;
    }

    this.reset = function() {
        for (var i = 0; i < last; i++) {
            curs[i] = 0;
        }
        curs[last] = -1;
    };
    this.next = function(store) {
        if (!(store instanceof Array)) {
            throw "must supply a array to store indexes."
        }
        curs[last]++;
        var aoi = maxes.length;
        for (var i = last; i >= 0; i--) {
            if (curs[i] > maxes[i]) {
                aoi = i - 1;
                if (aoi >= 0) {
                    curs[aoi]++;
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        if (aoi < 0) {
            return false;
        }
        for (var i = aoi + 1; i < maxes.length; i++) {
            curs[i] = 0;
        }
        copyIndexes(store);
        return true;
    };
    function copyIndexes(store) {
        for (var i = 0; i < maxes.length; i++) {
            store[i] = curs[i];
        }
    }
    this.getCurrentIndexes = function(store) {
        if (!(store instanceof Array)) {
            store = new Array();
        }
        copyIndexes(store);
        return store;
    };
    this.setCurrentIndexes = function(a) {
        if (!(a instanceof Array)) {
            throw "param must be a array";
        }
        for (var i = 0; i < maxes.length - 1; i++) {
            curs[i] = a[i];
            if (curs[i] <= -1) {
                curs[i] = 0;
            }
        }
        curs[i] = a[i];
        if (a[i] <= -1) {
            curs[i] = -1;
        }
    };
}
