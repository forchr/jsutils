var actionsConfig = {
    //all function have the parameters: actionsConfig and jQuery Object.
    events: [
        {
            "id": "doSomething",
            "label": "doSomethingLabel",
            //optional jQuery selector.
            //it can be a string or function returning a string
            "selector": "#someElement",
            //if event is String,then it must be :
            //1. jQuery event name.
            //2. "setValue"
            //3. "setText"
            //4. "setHtml"
            //5. "remove"
            //else event must be function.
            "event": "click",
            //for event options,according to jquery-simulate-ext
            //can be object or function returning object
            "eventOptions": {},
            "value": 1, //or function , valid if event is "setValue"
            "text": "abc", //or function , valid if event is "setText"
            "html": "<b>h</b>", //or function , valid if event is "setHtml"
            "waitBeforeMillis": 3000, //wait milliseconds before perform this action
            //when "selector" is not found,and if you specify this parameter, the "event" is not perform, it can be:
            //1. the id of another event;
            //2. function, can return id of another event;
            //3. "stopApp": means stop the whole application.
            "ifNone": "doOtherThing",
            //go to another event after "selector" is found and event performed.
            //can be:
            //1. the id of another event;
            //2. function, can return id of another event;
            "afterFound": "doAnotherThing"
        }
    ],
    //called before perform event.
    //return false to stop event.
    performBeforeEvent: function(actionsConfig, eventConfig) {
    },
    //called after perform event.
    performAfterEvent: function(actionsConfig, eventConfig) {
    }
};

var defaultActionsConfig = {
    eventInterval: 3000, //default interval millisecond between events.
    maxFailFinds: 5, //when event needs find "selector",try find the element.
    findInterval: 1500, //wait milliseconds between fail finds.
    nextEventIndex: 0 //next event performed.
};

var loopConfig = {
    "stopCommandReceived": false,
    "stopReason": "",
    "eventTimeoutId": null,
    //user define it
    "beforeStart": function() {
    },
    "afterStop": function() {
        if (this.eventTimeoutId !== undefined && this.eventTimeoutId !== null) {
            window.clearTimeout(this.eventTimeoutId);
        }
        console.info("app stop. reason: " + this.stopReason);
    },
    "stop": function(reason) {
        this.stopCommandReceived = true;
        this.stopReason = reason;
        if (_.isFunction(this.afterStop)) {
            this.afterStop();
        }
    }
};

function eventLoopStopped() {
    console.info("app stop. reason: " + loopConfig.stopReason);
    if (loopConfig.eventTimeoutId !== undefined && loopConfig.eventTimeoutId !== null) {
        window.clearTimeout(loopConfig.eventTimeoutId);
        loopConfig.eventTimeoutId = null;
    }
    if (_.isFunction(loopConfig.afterStop)) {
        loopConfig.afterStop();
    }
}

function startEventLoop(actionsConfig) {
    loopConfig.stopCommandReceived = false;
    loopConfig.stopReason = "";
    if (_.isFunction(loopConfig.beforeStart)) {
        loopConfig.beforeStart();
    }
    setEventLoopTimer(actionsConfig);
}

function setEventLoopTimer(actionsConfig, intervalMillis) {
    if (loopConfig.stopCommandReceived) {
        eventLoopStopped();
        return;
    }
    if (intervalMillis === undefined || intervalMillis < 0) {
        checkNextEventIndex(actionsConfig);
        intervalMillis = actionsConfig.events[actionsConfig.nextEventIndex].waitBeforeMillis;
        if (intervalMillis === undefined || intervalMillis < 0) {
            intervalMillis = actionsConfig.eventInterval >= 0 ? actionsConfig.eventInterval : 3000;
        }
    }
    loopConfig.eventTimeoutId = setTimeout(function() {
        performEventLoop(actionsConfig);
    }, intervalMillis);
}

/**
 * 
 * @param {type} actionsConfig
 * @param {type} eventId
 * @returns {Number}
 */
function findEventConfigById(actionsConfig, eventId) {
    if (_.isArray(actionsConfig.events)) {
        for (var i = 0; i < actionsConfig.events.length; i++) {
            if (actionsConfig.events[i].id === eventId) {
                return i;
            }
        }
    }
    return null;
}

function startNextEventLoopTimerById(actionsConfig, eId) {
    var i = findEventConfigById(actionsConfig, eId);
    if (i === null) {
        loopConfig.stop("can't found event config with id: " + eId);
    } else {
        actionsConfig.nextEventIndex = i;
        setEventLoopTimer(actionsConfig);
    }
}

function checkNextEventIndex(actionsConfig) {
    if (actionsConfig.nextEventIndex === undefined ||
            actionsConfig.nextEventIndex === null ||
            actionsConfig.nextEventIndex < 0 ||
            actionsConfig.nextEventIndex >= actionsConfig.events.length) {
        actionsConfig.nextEventIndex = 0;
    }
}
function performEventLoop(actionsConfig) {
    if (loopConfig.stopCommandReceived) {
        eventLoopStopped();
        return;
    }
    if (!_.isArray(actionsConfig.events) || actionsConfig.events.length === 0) {
        loopConfig.stop("没事件序列！");
        return;
    }
    checkNextEventIndex(actionsConfig);
    var eventConfig = actionsConfig.events[actionsConfig.nextEventIndex];
    var performAllowed = true;
    if (_.isFunction(actionsConfig.performBeforeEvent)) {
        var s = actionsConfig.performBeforeEvent(actionsConfig, eventConfig);
        if (s === false) {
            performAllowed = false;
        }
    }
    if (performAllowed) {
        var $e;
        if (eventConfig.selector !== undefined && eventConfig.selector !== null) {
            var s;
            if (_.isFunction(eventConfig.selector)) {
                s = eventConfig.selector(actionsConfig, eventConfig);
            } else if (_.isString(eventConfig.selector)) {
                s = eventConfig.selector;
            } else {
                loopConfig.stop("wrong selector:" + eventConfig.selector + " of " + eventConfig.id);
                return;
            }
            $e = jQuery(s);
            if ($e.length === 0) {
                if (!_.isNumber(eventConfig.failFindCount)) {
                    eventConfig.failFindCount = 1;
                } else {
                    eventConfig.failFindCount++;
                }
                if (eventConfig.failFindCount < actionsConfig.maxFailFinds) {
                    setEventLoopTimer(actionsConfig);
                    return;
                }
                if (eventConfig.ifNone !== undefined && eventConfig.ifNone !== null) {
                    var eId;
                    if (_.isFunction(eventConfig.ifNone)) {
                        eId = eventConfig.ifNone(actionsConfig, eventConfig);
                    } else if (_.isString(eventConfig.ifNone) && eventConfig.ifNone.length > 0) {
                        eId = eventConfig.ifNone;
                    }
                    if (eId) {
                        if (eId === "stopApp") {
                            loopConfig.stop("can't found: " + $e.selector);
                        } else {
                            startNextEventLoopTimerById(actionsConfig, eId);
                        }
                        return;
                    }
                }
            } else {
                eventConfig.failFindCount = 0;
            }
        }

        var startedNextEventLoop = false;
        //***perform event***        
        if (_.isFunction(eventConfig.event)) {
            var eId = eventConfig.event(actionsConfig, eventConfig, $e);
            if (eId && _.isString(eId)) {
                startNextEventLoopTimerById(actionsConfig, eId);
                startedNextEventLoop = true;
            }
        } else if ($e !== undefined && $e.length > 0 && _.isString(eventConfig.event)) {
            var v;
            switch (eventConfig.event) {
                case "remove":
                    $e.remove();
                    break;
                case "setValue":
                    if (_.isFunction(v = eventConfig.value)) {
                        v = eventConfig.value(actionsConfig, eventConfig, $e);
                    } else {
                        v = eventConfig.value;
                    }
                    $e.val(v === undefined || v === null ? "" : v);
                    break;
                case "setText":
                    if (_.isFunction(eventConfig.text)) {
                        v = eventConfig.text(actionsConfig, eventConfig, $e);
                    } else {
                        v = eventConfig.text;
                    }
                    $e.text(v === undefined || v === null ? "" : v);
                    break;
                case "setHtml":
                    if (_.isFunction(eventConfig.html)) {
                        v = eventConfig.html(actionsConfig, eventConfig, $e);
                    } else {
                        v = eventConfig.html;
                    }
                    $e.html(v === undefined || v === null ? "" : v);
                    break;
                default:
                    var o;
                    if (_.isFunction(eventConfig.eventOptions)) {
                        o = eventConfig.eventOptions(actionsConfig, eventConfig, $e);
                    } else {
                        o = eventConfig.eventOptions;
                    }
                    $e.simulate(eventConfig.event, o);
            }
        } else {
            loopConfig.stop("don't known what to do. eventId: " + eventConfig.id);
            return;
        }

        //***after found element and perform event.***
        if ($e !== undefined && $e.length > 0 && eventConfig.afterFound) {
            var eId;
            if (_.isFunction(eventConfig.afterFound)) {
                eId = eventConfig.afterFound(actionsConfig, eventConfig, $e);
            } else if (_.isString(eventConfig.afterFound)) {
                eId = eventConfig.afterFound;
            }
            if (eId && _.isString(eId)) {
                startNextEventLoopTimerById(actionsConfig, eId);
                startedNextEventLoop = true;
            }
        }

        //*** after perform event.***
        if (_.isFunction(actionsConfig.performAfterEvent)) {
            actionsConfig.performAfterEvent(actionsConfig, eventConfig, $e);
        }
        if (!startedNextEventLoop) {
            actionsConfig.nextEventIndex++;
            setEventLoopTimer(actionsConfig);
        }
    }
}
