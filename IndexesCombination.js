/**
 * 计算下标组合。
 * @param {Array of int} maxes index maximums.
 * @param {Array of int} curs current indexes.
 * @param {Array of int} mins index minimums.
 */
function IndexesCombination(maxes, curs, mins) {
    if (!(maxes instanceof Array)) {
        throw "must supply maxes array.";
    }

    this.getSize = function() {
        return maxes.length;
    };

    var last = maxes.length - 1;
    if (!(mins instanceof Array)) {
        mins = new Array();
    }
    if (!(curs instanceof Array)) {
        curs = new Array();
    }
    
    var total = 1;
    for (var i = 0; i < maxes.length; i++) {
        if (maxes[i] < 0) {
            throw "maximum must be greater than zero.";
        }

        if (typeof mins[i] !== "number" || mins[i] < 0) {
            mins[i] = 0;
        } else if (mins[i] > maxes[i]) {
            var t = mins[i];
            mins[i] = maxes[i];
            maxes[i] = t;
        }
        if (typeof curs[i] !== "number" || curs[i] < mins[i]) {
            curs[i] = i === last ? mins[i] - 1 : mins[i];
        } else if (curs[i] > maxes[i]) {
            curs[i] = maxes[i];
        }
        
        total *= maxes[i] - mins[i] + 1;
    }

    /**
     * 
     * @returns {Number} 剩下多少个
     */
    this.getTotal = function() {
        return total;
    };

    this.reset = function() {
        for (var i = 0; i < maxes.length; i++) {
            curs[i] = mins[i];
        }
    };

    this.next = function(store) {
        if (!(store instanceof Array)) {
            throw "must supply a array to store indexes."
        }
        curs[last]++;
        var aoi = maxes.length;//increment one element index
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
            curs[i] = mins[i];
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
        for (var i = 0; i < maxes.length; i++) {
            if (a[i] >= mins[i] && a[i] <= maxes[i]) {
                curs[i] = a[i];
            }
        }
    };

    this.setIndexesAt = function(cur, min, max, at) {
        if (at >= 0
                && at < maxes.length
                && min >= defMins[at]
                && max >= 0
                && min <= max
                && cur >= min
                && cur <= max) {
            curs[at] = cur;
        }
    };
}
