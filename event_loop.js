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
    performBeforeEvent: function(eventConfig) {
    },
    //called after perform event.
    performAfterEvent: function(eventConfig) {
    }
    ,
    eventInterval: 3000, //default interval millisecond between events.
    maxFailFinds: 5, //when event needs find "selector",try find the element.
    findInterval: 1500, //wait milliseconds between fail finds.
    nextEventIndex: 0, //next event performed.
    loopCount: 0,
    loopMax: 0//max event loop
    ,
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
    }
};


function startEventLoop() {
    actionsConfig.stopCommandReceived = false;
    actionsConfig.stopReason = "";
    if (_.isFunction(actionsConfig.beforeStart)) {
        actionsConfig.beforeStart();
    }
    setEventLoopTimer(actionsConfig);
}

function stopEventLoop(reason) {
    actionsConfig.stopCommandReceived = true;
    actionsConfig.stopReason = reason;
    if (_.isFunction(actionsConfig.afterStop)) {
        actionsConfig.afterStop();
    }
}

function eventLoopStopped() {
    console.info("app stop. reason: " + actionsConfig.stopReason);
    if (actionsConfig.eventTimeoutId !== undefined && actionsConfig.eventTimeoutId !== null) {
        window.clearTimeout(actionsConfig.eventTimeoutId);
        actionsConfig.eventTimeoutId = null;
    }
    if (_.isFunction(actionsConfig.afterStop)) {
        actionsConfig.afterStop();
    }
}


function setEventLoopTimer(intervalMillis) {
    if (actionsConfig.stopCommandReceived) {
        eventLoopStopped();
        return;
    }
    checkNextEventIndex(actionsConfig);
    if (actionsConfig.nextEventIndex === 0) {
        actionsConfig.loopCount++;
        if (actionsConfig.loopMax > 0 && actionsConfig.loopCount > actionsConfig.loopMax) {
            stopEventLoop("arrives loopMax: " + actionsConfig.loopMax);
            return;
        }
    }
    if (intervalMillis === undefined || intervalMillis < 0) {
        intervalMillis = actionsConfig.events[actionsConfig.nextEventIndex].waitBeforeMillis;
        if (intervalMillis === undefined || intervalMillis < 0) {
            intervalMillis = actionsConfig.eventInterval >= 0 ? actionsConfig.eventInterval : 3000;
        }
    }
    actionsConfig.eventTimeoutId = setTimeout(function() {
        performEventLoop(actionsConfig);
    }, intervalMillis);
}

/**
 * 
 * @param {type} actionsConfig
 * @param {type} eventId
 * @returns {Number}
 */
function findEventConfigById(eventId) {
    if (_.isArray(actionsConfig.events)) {
        for (var i = 0; i < actionsConfig.events.length; i++) {
            if (actionsConfig.events[i].id === eventId) {
                return i;
            }
        }
    }
    return null;
}

function startNextEventLoopTimerById(eId) {
    var i = findEventConfigById(eId);
    if (i === null) {
        stopEventLoop("can't found event config with id: " + eId);
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
    if (actionsConfig.stopCommandReceived) {
        eventLoopStopped();
        return;
    }
    if (!_.isArray(actionsConfig.events) || actionsConfig.events.length === 0) {
        stopEventLoop("没事件序列！");
        return;
    }
    checkNextEventIndex(actionsConfig);
    var eventConfig = actionsConfig.events[actionsConfig.nextEventIndex];
    var performAllowed = true;
    if (_.isFunction(actionsConfig.performBeforeEvent)) {
        var s = actionsConfig.performBeforeEvent(eventConfig);
        if (s === false) {
            performAllowed = false;
        }
    }
    if (performAllowed) {
        var $e;
        if (eventConfig.selector !== undefined && eventConfig.selector !== null) {
            var s;
            if (_.isFunction(eventConfig.selector)) {
                s = eventConfig.selector(eventConfig);
            } else if (_.isString(eventConfig.selector)) {
                s = eventConfig.selector;
            } else {
                stopEventLoop("wrong selector:" + eventConfig.selector + " of " + eventConfig.id);
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
                        eId = eventConfig.ifNone(eventConfig);
                    } else if (_.isString(eventConfig.ifNone) && eventConfig.ifNone.length > 0) {
                        eId = eventConfig.ifNone;
                    }
                    if (eId) {
                        if (eId === "stopApp") {
                            stopEventLoop("can't found: " + $e.selector);
                        } else {
                            startNextEventLoopTimerById(eId);
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
            var eId = eventConfig.event(eventConfig, $e);
            if (eId && _.isString(eId)) {
                startNextEventLoopTimerById(eId);
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
                        v = eventConfig.value(eventConfig, $e);
                    } else {
                        v = eventConfig.value;
                    }
                    $e.val(v === undefined || v === null ? "" : v);
                    break;
                case "setText":
                    if (_.isFunction(eventConfig.text)) {
                        v = eventConfig.text(eventConfig, $e);
                    } else {
                        v = eventConfig.text;
                    }
                    $e.text(v === undefined || v === null ? "" : v);
                    break;
                case "setHtml":
                    if (_.isFunction(eventConfig.html)) {
                        v = eventConfig.html(eventConfig, $e);
                    } else {
                        v = eventConfig.html;
                    }
                    $e.html(v === undefined || v === null ? "" : v);
                    break;
                default:
                    var o;
                    if (_.isFunction(eventConfig.eventOptions)) {
                        o = eventConfig.eventOptions(eventConfig, $e);
                    } else {
                        o = eventConfig.eventOptions;
                    }
                    $e.simulate(eventConfig.event, o);
            }
        } else {
            stopEventLoop("don't known what to do. eventId: " + eventConfig.id);
            return;
        }

        //***after found element and perform event.***
        if ($e !== undefined && $e.length > 0 && eventConfig.afterFound) {
            var eId;
            if (_.isFunction(eventConfig.afterFound)) {
                eId = eventConfig.afterFound(eventConfig, $e);
            } else if (_.isString(eventConfig.afterFound)) {
                eId = eventConfig.afterFound;
            }
            if (eId && _.isString(eId)) {
                startNextEventLoopTimerById(eId);
                startedNextEventLoop = true;
            }
        }

        //*** after perform event.***
        if (_.isFunction(actionsConfig.performAfterEvent)) {
            actionsConfig.performAfterEvent(eventConfig, $e);
        }
        if (!startedNextEventLoop) {
            actionsConfig.nextEventIndex++;
            setEventLoopTimer(actionsConfig);
        }
    }
}
