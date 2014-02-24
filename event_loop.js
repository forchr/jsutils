var eventLoopLabel = "Robot";
var eventLoopId = "elRobot";

//all function callback have the parameters: jQuery Object.
var events = [
    /*
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
     */
];

var stopCommandReceived = false;
var stopReason = "";
var running = false;
var eventTimeoutId;
var nextEventIndex = 0; //next event performed.
var currentEvent;//
//
//used for register event listener,event:
//beforeEvent: called before performing one event,return false to stop performing.
//afterEvent: called after performing one event.
//beforeStart: called before starting event loop.
//afterStop: called after event loop stopped.
//log: function(msg,level){}, called to log message,return true to stop output to console
var listenerHolder = jQuery("<div/>").appendTo(jQuery("body"));

function IntValidator(min, max, label) {
    this.min = min || 0;
    this.max = max || 2147483647;
    this.label = label;
}
IntValidator.prototype.min = 0;
IntValidator.prototype.max = 2147483647;
IntValidator.prototype.label = "";
IntValidator.prototype.check = function(value, label) {
    var i = parseInt(value);
    if (isNaN(i)) {
        throw (label || this.label) + "必须是整数！";
    }
    if (i < this.min) {
        throw (label || this.label) + "不能小于" + this.min + "！";
    }
    if (i > this.max) {
        throw (label || this.label) + "不能大于" + this.max + "！";
    }
};

var LOG_LEVEL_DEBUG = 3;
var LOG_LEVEL_INFO = 4;
var LOG_LEVEL_WARN = 5;
var LOG_LEVEL_ERROR = 6;

var loopCount = 0;
var cfg = {
    loopMax: 0, //max event loop
    eventInterval: 3000, //default interval millisecond between events.
    maxFailFinds: 5, //when event needs find "selector",try find the element.
    reFindInterval: 1500, //wait milliseconds between fail finds.
    logLevel: LOG_LEVEL_DEBUG
};

var cfgMeta = {
    loopMax: {label: "循环次数", "validator": new IntValidator(0, null)}, //max event loop
    eventInterval: {label: "默认事件间暂停时间(ms)", "validator": new IntValidator(0, 3600000)}, //default interval millisecond between events.
    maxFailFinds: {label: "重找html元素次数", "validator": new IntValidator(0, 100)}, //when event needs find "selector",try find the element.
    reFindInterval: {label: "重找html元素间隔时间(ms)", "validator": new IntValidator(0, 3600000)}, //wait milliseconds between fail finds.
    logLevel: {label: "日志级别", edit: {
            type: "select",
            options: [
                [LOG_LEVEL_DEBUG, "调试"],
                [LOG_LEVEL_INFO, "信息"],
                [LOG_LEVEL_WARN, "警告"],
                [LOG_LEVEL_ERROR, "错误"],
            ]},
        "validator": new IntValidator(3, 6)}
};

function readConfigValue() {
    _.each(cfg, function(v, k) {
        cfg[k] = GM_getValue(k, v);
    });
}
;
readConfigValue();

function debug(msg) {
    if (cfg.logLevel < LOG_LEVEL_DEBUG) {
        return;
    }
    if (listenerHolder.triggerHandler("log", [msg, cfg.logLevel]) === true) {
        return;
    }
    console.debug(msg);
}

function info(msg) {
    if (cfg.logLevel < LOG_LEVEL_INFO) {
        return;
    }
    if (listenerHolder.triggerHandler("log", [msg, cfg.logLevel]) === true) {
        return;
    }
    console.info(msg);
}

function warn(msg) {
    if (cfg.logLevel < LOG_LEVEL_WARN) {
        return;
    }
    if (listenerHolder.triggerHandler("log", [msg, cfg.logLevel]) === true) {
        return;
    }
    console.warn(msg);
}

function error(msg) {
    if (cfg.logLevel < LOG_LEVEL_ERROR) {
        return;
    }
    if (listenerHolder.triggerHandler("log", [msg, cfg.logLevel]) === true) {
        return;
    }
    console.error(msg);
}

function startEventLoop() {
    stopCommandReceived = false;
    stopReason = "";
    listenerHolder.triggerHandler("beforeStart");
    running = true;
    info("程序开始运行...");
    setEventTimer();
}

function stopEventLoop(reason) {
    stopCommandReceived = true;
    stopReason = reason;
    info("收到停止指令。");
}

function eventLoopStopped() {
    running = false;
    if (eventTimeoutId !== undefined && eventTimeoutId !== null) {
        window.clearTimeout(eventTimeoutId);
        eventTimeoutId = null;
    }
    listenerHolder.triggerHandler("afterStop");
    info("程序停止运行。");
}


function setEventTimer(refind) {
    if (stopCommandReceived) {
        eventLoopStopped();
        return;
    }
    checkNextEventIndex();
    if (nextEventIndex === 0 && refind !== true) {
        loopCount++;
        if (cfg.loopMax > 0 && loopCount > cfg.loopMax) {
            stopEventLoop("达到最大循环次数: " + cfg.loopMax);
            return;
        }
    }
    var intervalMillis;
    if (intervalMillis === undefined || intervalMillis < 0) {
        if (refind === true) {
            intervalMillis = cfg.reFindInterval;
        } else {
            intervalMillis = events[nextEventIndex].waitBeforeMillis;
            if (intervalMillis === undefined || intervalMillis < 0) {
                intervalMillis = cfg.eventInterval >= 0 ? cfg.eventInterval : 3000;
            }
        }
    }
    debug(intervalMillis + "毫秒后操作下一事件。");
    eventTimeoutId = setTimeout(function() {
        performEventLoop();
    }, intervalMillis);
}


function findEventConfigById(eventId) {
    if (_.isArray(events)) {
        for (var i = 0; i < events.length; i++) {
            if (events[i].id === eventId) {
                return i;
            }
        }
    }
    return null;
}

function startNextEventTimerById(eId) {
    var i = findEventConfigById(eId);
    if (i === null) {
        stopEventLoop("找不到此事件: " + eId);
    } else {
        nextEventIndex = i;
        setEventTimer();
    }
}

function checkNextEventIndex() {
    if (nextEventIndex === null || nextEventIndex < 0 ||
            nextEventIndex >= events.length) {
        nextEventIndex = 0;
    }
}
function performEventLoop() {
    if (stopCommandReceived) {
        eventLoopStopped();
        return;
    }
    if (!_.isArray(events) || events.length === 0) {
        stopEventLoop("没事件序列！");
        return;
    }
    checkNextEventIndex();
    var startedNextEventLoop = false;
    currentEvent = events[nextEventIndex];
    debug("执行事件：" + currentEvent.label);
    var performAllowed = listenerHolder.triggerHandler("beforeEvent", [currentEvent]) !== false;
    if (performAllowed) {
        var $e;
        if (currentEvent.selector !== undefined && currentEvent.selector !== null) {
            var s;
            if (_.isFunction(currentEvent.selector)) {
                s = currentEvent.selector(currentEvent);
            } else if (_.isString(currentEvent.selector)) {
                s = currentEvent.selector;
            } else {
                stopEventLoop("错误的selector:" + currentEvent.selector + " of " + currentEvent.id);
                return;
            }
            $e = jQuery(s);
            if ($e.length === 0) {
                if (!_.isNumber(currentEvent.failFindCount)) {
                    currentEvent.failFindCount = 1;
                } else {
                    currentEvent.failFindCount++;
                }

                warn(currentEvent.failFindCount + ".找不到:" + s);

                if (currentEvent.failFindCount < cfg.maxFailFinds) {
                    setEventTimer(true);
                    return;
                }
                if (currentEvent.ifNone !== undefined && currentEvent.ifNone !== null) {
                    var eId;
                    if (_.isFunction(currentEvent.ifNone)) {
                        eId = currentEvent.ifNone(currentEvent);
                    } else if (_.isString(currentEvent.ifNone) && currentEvent.ifNone.length > 0) {
                        eId = currentEvent.ifNone;
                    }
                    if (eId) {
                        if (eId === "stopApp") {
                            stopEventLoop("程序内部要求停止。");
                        } else {
                            info("跳到：" + eId);
                            startNextEventTimerById(eId);
                        }
                        return;
                    }
                }
            } else {
                currentEvent.failFindCount = 0;
            }
        }

        //***perform event***        
        if (_.isFunction(currentEvent.event)) {
            var eId = currentEvent.event($e);
            if (eId && _.isString(eId)) {
                info("跳到：" + eId);
                startNextEventTimerById(eId);
                startedNextEventLoop = true;
            }
        } else if ($e !== undefined && $e.length > 0 && _.isString(currentEvent.event)) {
            var v;
            switch (currentEvent.event) {
                case "remove":
                    $e.remove();
                    break;
                case "setValue":
                    if (_.isFunction(currentEvent.value)) {
                        v = currentEvent.value($e);
                    } else {
                        v = currentEvent.value;
                    }
                    $e.val(v === undefined || v === null ? "" : v);
                    break;
                case "setText":
                    if (_.isFunction(currentEvent.text)) {
                        v = currentEvent.text($e);
                    } else {
                        v = currentEvent.text;
                    }
                    $e.text(v === undefined || v === null ? "" : v);
                    break;
                case "setHtml":
                    if (_.isFunction(currentEvent.html)) {
                        v = currentEvent.html($e);
                    } else {
                        v = currentEvent.html;
                    }
                    $e.html(v === undefined || v === null ? "" : v);
                    break;
                default:
                    var o;
                    if (_.isFunction(currentEvent.eventOptions)) {
                        o = currentEvent.eventOptions($e);
                    } else {
                        o = currentEvent.eventOptions;
                    }
                    $e.simulate(currentEvent.event, o);
            }
        } else {
            stopEventLoop("不知如何处理此事件: " + currentEvent.id);
            return;
        }

        //***after found element and perform event.***
        if ($e !== undefined && $e.length > 0 && currentEvent.afterFound) {
            var eId;
            if (_.isFunction(currentEvent.afterFound)) {
                eId = currentEvent.afterFound($e);
            } else if (_.isString(currentEvent.afterFound)) {
                eId = currentEvent.afterFound;
            }
            if (eId && _.isString(eId)) {
                info("跳到：" + eId);
                startNextEventTimerById(eId);
                startedNextEventLoop = true;
            }
        }

        //*** after perform event.***
        listenerHolder.triggerHandler("afterEvent", [currentEvent]);
    }
    if (!startedNextEventLoop) {
        nextEventIndex++;
        setEventTimer();
    }
}


function buildEventLoopControlPane() {
    var $top = jQuery("<div/>").addClass("loopControl");
    var $startButton = jQuery("<button/>").addClass("startLoop")
            .appendTo($top)
            .button({"label": "开始", "disabled": false})
            .click(function(event) {
                $(this).button("disable");
                if (!running) {
                    startEventLoop();
                }
            });

    var $stopButton = jQuery("<button/>").addClass("stopLoop")
            .appendTo($top)
            .button({"label": "停止", "disabled": true})
            .click(function(event) {
                $(this).button("disable");
                if (running) {
                    stopEventLoop("用户要求停止。");
                }
            });
    listenerHolder.on("beforeStart", function(event) {
        $startButton.button("disable");
        $stopButton.button("enable");
    });
    listenerHolder.on("afterStop", function(event) {
        $startButton.button("enable");
        $stopButton.button("disable");
    });

    return $top;
}

function buildInputElement(type, options/*if type is "select", it must be array of array,or object.*/) {
    if (type === undefined || type === null) {
        type = "text";
    }
    var simpleTypes = ["text",
        "password",
        "checkbox",
        "radio",
        "submit",
        "image",
        "reset",
        "button",
        "file",
        "hidden"
    ];
    var $e;
    switch (type) {
        case "textarea":
            $e = jQuery("<textarea/>");
            break;
        case "select":
            $e = jQuery("<select/>");
            var at = _.isArray(options);
            _.each(options, function(a, b) {
                $e.append(jQuery("<option/>").attr("value", at ? a[0] : b)
                        .text(at ? a[1] : a));
            });
            break;
        default:
            if (_.indexOf(simpleTypes, type) === -1) {
                throw "错误的input type:" + type;
            }
            $e = jQuery("<input type='" + type + "'/>");
    }
    return $e;
}


function buildEventLoopConfigPane() {
    var $top = jQuery("<div/>").addClass("loopConfig");
    var tdCss = {"padding": "3px"};
    var $tb = jQuery("<table/>").css({"empty-cell": "show", "border-collapse": "collapse"}).appendTo($top);
    _.each(cfg, function(v, k) {
        var $tr = jQuery("<tr/>").css({"border-bottom": "1px solid #ccc"}).appendTo($tb);
        var m = cfgMeta[k];
        jQuery("<label/>").text(m.label)
                .appendTo(jQuery("<td/>")
                        .css(tdCss).appendTo($tr));
        if (!_.isObject(m.edit)) {
            m.edit = {"type": "text"};
        }
        var $e = buildInputElement(m.edit.type, m.edit.options).appendTo(
                jQuery("<td/>").css(tdCss).appendTo($tr));
        if (_.isObject(m.edit.attrs)) {
            $e.attr(m.edit.attrs);
        }
        if (v !== undefined && v !== null) {
            $e.val(v);
        }
        $e.change(function(event) {
            var v = jQuery(this).val();
            if (_.isObject(m.validator)) {
                try {
                    v = m.validator.check(v, m.label);
                    cfg[k] = v;
                    GM_setValue(eventLoopId + ".cfg." + k, v);
                    GM_notification("已经保存新值：" + v);
                } catch (err) {
                    GM_notification(err, "输入错误");
                }
            }
        });
    });

    return $top;
}

function buildLogPane() {
    var $top = jQuery("<div/>").addClass("log").css({
        "min-height": "1em",
        "background-color": "black",
        "color": "white",
        padding: "3px",
        "max-height": "100px",
        "overflow": "auto"});
    listenerHolder.on("log", function(event, msg, level) {
        $top.html(msg);
        if (level > LOG_LEVEL_INFO) {
            console.error(msg);
        }
        return true;
    });
}


function showUI() {
    var $top = jQuery("<div/>").attr("id", eventLoopId)
            .css({"position": "absolute",
                zIndex: _.random(3, 1000),
                "right": _.random(0, 20) + "px",
                "top": _.random(0, 20) + "px",
                "padding": "3px"
            })
            .appendTo(jQuery("body"))
            .resizable();
    var $tt = jQuery("<h3/>").text(eventLoopLabel).appendTo($top);

    $top.append(buildLogPane());
    $top.append(buildEventLoopControlPane());
    $top.append(buildEventLoopConfigPane());
    $top.draggable({handle: $tt});
}
