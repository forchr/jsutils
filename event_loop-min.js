var eventLoopLabel="Robot";var eventLoopId="elRobot";var MAX_INT=2147483647;var simulatedEvents=["mousemove","mousedown","mouseup","click","dblclick","mouseover","mouseout","mouseenter","mouseleave","contextmenu","keydown","keyup","keypress","focus","blur","drag-n-drop","drag","drop","key-sequence","key-combo",];var events=[];var stopCommandReceived=false;var stopReason="";var started=false;var eventIndexChangeableByUser=false;var resetEventIndexWhenStart=true;var currentEvent;var nextEventIndex=-1;var timerTimeoutIds={eventTimeoutId:null,runTimeoutId:null,setTimeout:function(c,b,a){this.clearId(c);this[c]=window.setTimeout(b,a);return this},clearId:function(b){for(var a=0;a<arguments.length;a++){b=arguments[a];if(this[b]){window.clearTimeout(this[b]);this[b]=null}}return this}};var listenerHolder=jQuery("<div/>").appendTo(jQuery("body"));function IntValidator(c,a,b){this.min=c||0;this.max=a||2147483647;this.label=b}IntValidator.prototype.min=0;IntValidator.prototype.max=MAX_INT;IntValidator.prototype.label="";IntValidator.prototype.check=function(c,a){var b=parseInt(c);if(isNaN(b)){throw (a||this.label)+"必须是整数！"}if(b<this.min){throw (a||this.label)+"不能小于"+this.min+"！"}if(b>this.max){throw (a||this.label)+"不能大于"+this.max+"！"}return b};function confirmMessage(b,a){jQuery("<div/>").html(b).dialog({title:(a||"信息"),appendTo:"#"+eventLoopId,minHeight:100,minWidth:150,resizable:true,draggable:true,modal:true,position:{my:"left top",at:"left top",of:"#"+eventLoopId}})}var LOG_LEVEL_DEBUG=3;var LOG_LEVEL_INFO=4;var LOG_LEVEL_WARN=5;var LOG_LEVEL_ERROR=6;var cfg={loopCount:0,loopMax:0,runTimeout:0,unknownFailCount:0,unknownFailMax:10,eventInterval:3000,maxFailFinds:5,reFindInterval:1500,logLevel:LOG_LEVEL_DEBUG};var gt0Validator=new IntValidator(0,null);var bool01Validator=new IntValidator(0,1);var cfgMeta={loopCount:{label:"当前循环次数",editable:true,edit:{type:"text",attrs:{size:6,maxlength:"8"}},validator:gt0Validator},loopMax:{label:"最大循环次数",edit:{type:"text",attrs:{title:"小于1表示无限",size:6,maxlength:"8"}},validator:gt0Validator},runTimeout:{label:"限定运行时间",edit:{type:"text",attrs:{title:"小于1表示无限",size:6,maxlength:"8"}},validator:gt0Validator,suffix:"分钟"},unknownFailCount:{label:"未知原因失败次数",editable:false,save:false},unknownFailMax:{label:"未知原因最大失败次数",edit:{type:"text",attrs:{title:"小于1表示无限",size:6,maxlength:"8"}},validator:gt0Validator},eventInterval:{label:"默认事件间暂停时间",edit:{type:"text",attrs:{title:"小于1表示无限",size:6,maxlength:"8"}},validator:new IntValidator(0,3600000),suffix:"毫秒"},maxFailFinds:{label:"重找html元素次数",edit:{type:"text",attrs:{title:"小于1表示无限",size:6,maxlength:"8"}},validator:new IntValidator(0,100)},reFindInterval:{label:"重找html元素间隔时间",edit:{type:"text",attrs:{title:"小于1表示无限",size:6,maxlength:"8"}},validator:new IntValidator(0,3600000),suffix:"毫秒"},logLevel:{label:"运行信息输出级别",edit:{type:"select",options:[[LOG_LEVEL_DEBUG,"调试"],[LOG_LEVEL_INFO,"信息"],[LOG_LEVEL_WARN,"警告"],[LOG_LEVEL_ERROR,"错误"]]},validator:new IntValidator(3,6)}};function readConfigValue(){_.each(cfgMeta,function(c,b){if(c.save!==false){var a=GM_getValue("cfg."+b);if(a!==undefined){cfg[b]=a;console.debug("restore "+c.label+"="+a)}}})}function saveConfigValue(b){for(var a=0;a<arguments.length;a++){b=arguments[a];if(cfg[b]===undefined){error("没定义的属性cfg."+b)}else{if(cfgMeta[b].save!==false){GM_setValue("cfg."+b,cfg[b]);debug("已保存新值："+cfgMeta[b].label+"="+cfg[b])}}}}function debug(a){if(LOG_LEVEL_DEBUG<cfg.logLevel){return}if(listenerHolder.triggerHandler("log",[a,cfg.logLevel,"debug"])===true){return}console.debug(a)}function info(a){if(LOG_LEVEL_INFO<cfg.logLevel){return}if(listenerHolder.triggerHandler("log",[a,cfg.logLevel,"info"])===true){return}console.info(a)}function warn(a){if(LOG_LEVEL_WARN<cfg.logLevel){return}if(listenerHolder.triggerHandler("log",[a,cfg.logLevel,"warn"])===true){return}console.warn(a)}function error(a){if(LOG_LEVEL_ERROR<cfg.logLevel){return}if(listenerHolder.triggerHandler("log",[a,cfg.logLevel,error])===true){return}console.error(a)}function setConfigValue(c,b){if(cfg[c]===b){return}var a=cfg[c];cfg[c]=b;saveConfigValue(c);listenerHolder.triggerHandler(c+"Change",[a,cfg[c],c])}var elstartTimestamp;function startEventLoop(){if(events.length===0){stopReason="无事件！";eventLoopStopped();return}elstartTimestamp=new Date();listenerHolder.triggerHandler("beforeStart");setConfigValue("unknownFailCount",0);stopCommandReceived=false;stopReason="";if(cfg.loopCount>cfg.loopMax){setConfigValue("loopCount",0)}if(resetEventIndexWhenStart===true){setNextEventIndex(0)}started=true;setEventTimer();if(cfg.runTimeout>0){debug("启动限时运行时间控制。");timerTimeoutIds.setTimeout("runTimeoutId",function(){stopEventLoop("限定运行时间到。")},cfg.runTimeout*60*1000)}info("程序开始运行...")}function stopEventLoop(a){stopCommandReceived=true;stopReason=a;debug("收到停止指令："+a);if(processingEvent===false){eventLoopStopped()}}function eventLoopStopped(){if(started===false){return}started=false;timerTimeoutIds.clearId("eventTimeoutId","runTimeoutId");listenerHolder.triggerHandler("afterStop");info("停止运行！原因："+stopReason)}function setEventTimer(b,a){if(stopCommandReceived){eventLoopStopped();return}if(cfg.unknownFailMax>0&&cfg.unknownFailCount>=cfg.unknownFailMax){stopEventLoop("达到"+cfgMeta.unknownFailMax+": "+cfg.unknownFailMax);return}checkNextEventIndex();if(nextEventIndex===0&&b!==true){setConfigValue("loopCount",cfg.loopCount+1);if(cfg.loopMax>0&&cfg.loopCount>cfg.loopMax){stopEventLoop("达到最大循环次数: "+cfg.loopMax);return}}var e=events[nextEventIndex];if(a===undefined||a<0){if(b===true){a=cfg.reFindInterval}else{if(_.isFunction(e.getWaitBeforeMillis)){a=e.getWaitBeforeMillis()}else{a=e.waitBeforeMillis}if(a===undefined||a<0){a=cfg.eventInterval>=0?cfg.eventInterval:3000}}}if(a>0){var c=formatDuration(a);debug(c+"后执行 "+getEventName(e,nextEventIndex));listenerHolder.triggerHandler("eventTimerSet",[c,a]);timerTimeoutIds.setTimeout("eventTimeoutId",processEventConfig,a)}else{processEventConfig()}}function formatDuration(c){var d=moment.duration(c);var e={years:"年",months:"个月",days:"天",hours:"小时",minutes:"分钟",seconds:"秒",milliseconds:"毫秒"};var b=[];jQuery.each(e,function(g,h){var a=d[g]();if(a>0){b.push(a+h)}});return b.join(" ")}function findEventConfigById(b){if(_.isArray(events)&&_.isString(b)){for(var a=0;a<events.length;a++){if(events[a].id===b){return a}}}return null}function findEventConfigByLabel(b){if(_.isArray(events)&&_.isString(b)){for(var a=0;a<events.length;a++){if(events[a].label===b){return a}}}return null}var jumpNextEventIndex=-1;var nextEventWaitMillis=-1;function setJumpEventIndexById(e,b,f){if(!e){return false}if(_.isArray(e)&&_.isString(e[0])){if(e.length>1&&b===undefined){b=e[1]}if(e.length>2&&f===undefined){f=e[2]}e=e[0]}var d=findEventConfigById(e);if(d===null){return false}var a;if(b>=0){if(f>=0){if(b>f){var c=b;b=f;f=c}a=_.random(b,f)}else{a=b}}else{if(f>=0){a=_.random(0,f)}else{if(b){if(_.isFunction(b)){a=b.call(currentEvent)}else{if(_.isObject(b)&&_.isString(f)&&_.isFunction(b[f])){a=b[f]()}}}}}debug("跳转到 "+getEventName(events[d],d));jumpNextEventIndex=d;nextEventWaitMillis=a;return true}function checkNextEventIndex(){if(nextEventIndex===null||nextEventIndex<0||nextEventIndex>=events.length){setNextEventIndex(0)}}function setNextEventIndex(a){nextEventIndex=a}function getEventName(a){if(a===undefined||a===null){a=currentEvent}if(_.isString(a.label)){return a.label}if(_.isString(a.id)){return a.id}return a.index>=0?"动作序号: "+a.index:"未知动作名称"}function findElement(f,g,e,c){if(f===undefined||f===null){f=currentEvent}if(g===undefined||g===null){g="selector"}var l;if(f[g]&&_.isFunction(f[g])){l=f[g]()}else{l=f[g]}debug("找: "+l);if(c===true){var k;if(_.isArray(l)){k=l}else{if(_.isString(l)){k=[l]}else{stopEventLoop("类型错误的selector:"+f[g]+" of "+getEventName(f));return{stop:true}}}var j=[];for(var h=0;h<k.length;h++){var d=jQuery(k[h],h>0?j[h-1].contents():null);if(d.length===0){return doWhenElementNotFound(f,k[h],"failFindIframeCount")}else{f.failFindIframeCount=0;j[h]=d}}return{found:true,$eArray:j}}else{if(!_.isString(l)){stopEventLoop("必须是String类型的selector:"+f[g]+" of "+getEventName(f));return false}var d=jQuery(l,e);if(d.length===0){return doWhenElementNotFound(f,l,"failFindCount")}else{f.failFindCount=0;return{found:true,$e:d}}}}function doWhenElementNotFound(b,a,d){if(b[d]===undefined||b[d]===null||b[d]<1){b[d]=1}else{b[d]+=1}warn(b[d]+".找不到: "+a+" of "+getEventName(b));if(b[d]<(b.maxFailFinds&&b.maxFailFinds>0?b.maxFailFinds:cfg.maxFailFinds)){debug("再次找此元素。");return{findAgain:true}}debug("不再找此元素。");b[d]=0;if(b.ifNone===false){stopEventLoop("多次找不到元素："+a);return{stop:true}}var c=callFunction(b.ifNone);if(c===true){return{found:false,doAction:true}}if(c===false){stopEventLoop("多次找不到元素："+a);return{stop:true}}setJumpEventIndexById(c);return{found:false,doAction:false}}var ActionResult_Stop=1;var ActionResult_Continue=2;function performAction(b,c){function e(a){if(b.length===1){return undefined}if(a===undefined){a=1}if(_.isFunction(b[a])){return b[a].call(currentEvent,c)}if(b.length>2){var f=a+1;if(_.isObject(b[a])&&_.isString(b[f])&&_.isFunction(b[a][b[f]])){return b[a][b[f]](c)}}return b[a]}if(!_.isArray(b)){b=[b]}if(_.isFunction(b[0])){debug("call function");var d=b[0].call(currentEvent,c);setJumpEventIndexById(d);return ActionResult_Continue}if(_.indexOf(simulatedEvents,b[0])>=0){if(c!==undefined&&c.length>0){debug("模拟动作: "+b[0]);c.simulate(b[0],e()||{})}else{warn("html元素不存在！不能模拟动作！"+getEventName())}return ActionResult_Continue}if(_.isFunction(jQuery.fn[b[0]])){if(!c||c.jquery&&c.length===0){warn("html元素不存在！不能模拟动作！"+getEventName())}else{debug("call: "+b[0]);c[b[0]](e())}return ActionResult_Continue}if("jump"===b[0]){if(setJumpEventIndexById(b[1],b[2],b[3])){return ActionResult_Continue}else{stopEventLoop("错误动作："+b);return ActionResult_Stop}}if("dispatchEvent"===b[0]){if(b.length===1||!_.isString(b[1])){stopEventLoop("错误的event类型，必须是String: "+b.join(",")+" @ "+getEventName());return ActionResult_Stop}debug("dispatchEvent "+b[1]);listenerHolder.triggerHandler(b[1],c);return ActionResult_Continue}if(b.length>1&&b[1]&&_.isObject(b[1])&&_.isFunction(b[1][b[0]])){debug("call method: "+b[0]);var d=b[1][b[0]](c);setJumpEventIndexById(d);return ActionResult_Continue}stopEventLoop("未知event类型: "+b.join(",")+" @ "+getEventName());return ActionResult_Stop}function callFunction(b){if(_.isFunction(b)){return b.apply(currentEvent)}else{if(_.isArray(b)){if(_.isFunction(b[0])){return b[0].apply(currentEvent,b.length>1?b.slice(1):undefined)}else{if(b.length>1&&_.isObject(b[0])&&_.isString(b[1])&&_.isFunction(b[0][b[1]])){return b[0][b[1]].apply(b[0],b.length>2?b.slice(2):undefined)}}}}return b}var processingEvent=false;function processEventConfig(){processingEvent=true;nextEventWaitMillis=-1;jumpNextEventIndex=-1;var m=false;try{if(stopCommandReceived){return}currentEvent=events[nextEventIndex];currentEvent.index=nextEventIndex;debug("执行动作："+getEventName(currentEvent));var l=true;var j=false;var h=false;if(currentEvent.iframe){j=true;var c=findElement(currentEvent,"iframe",null,true);m=c.findAgain===true;if(c.stop===true||c.findAgain===true){return}if(c.found===true){h=_.last(c.$eArray).contents()}else{if(c.doAction===false){l=false}}}var a;if((j===false||h)&&currentEvent.selector){var b=findElement(currentEvent,"selector",h);m=b.findAgain===true;if(b.stop===true||b.findAgain===true){return}if(b.found===true){a=b.$e}else{if(b.doAction===false){l=false}}}if(l===false){debug("不执行此步动作");return}if(a&&a.jquery&&a.length>0){if(_.isFunction(currentEvent.filterElement)){var g=currentEvent.filterElement.call(currentEvent,a);if(g&&g.jquery&&g!==a){a=g}}}var k=currentEvent.event;for(var f=0;!stopCommandReceived&&f<k.length;f++){var e=performAction(k[f],a);switch(e){case ActionResult_Stop:return;case ActionResult_Continue:break;default:stopEventLoop("程序错误:A01! ")}}}catch(d){console.error(d);stopEventLoop("程序错误:A02! "+d)}finally{if(m){setEventTimer(true)}else{if(jumpNextEventIndex>=0){setNextEventIndex(jumpNextEventIndex);setEventTimer(false,nextEventWaitMillis)}else{setNextEventIndex(currentEvent.index+1);setEventTimer(false)}}if(stopCommandReceived){eventLoopStopped()}processingEvent=false}}var startConditons=[{checkStartConditions:function(){if(!_.isArray(events)||events.length===0){throw ("无动作序列！")}if(cfg.loopMax>0&&cfg.loopCount>cfg.loopMax){throw ("达到最大循环次数: "+cfg.loopMax)}}}];function checkStartConditions(){if(startConditons.length>0){for(var a=0;a<startConditons.length;a++){startConditons[a].checkStartConditions()}}}function stopAfterStartConditionsCheck(){try{checkStartConditions()}catch(a){stopEventLoop(a)}}function buildEventLoopControlPane(){var d=jQuery("<div/>").addClass("loopControl");var c={"margin-right":"10px"};var a=jQuery("<button/>").addClass("startLoop").css(c).appendTo(d).button({label:"开始",disabled:false}).click(function(f){try{checkStartConditions()}catch(e){confirmMessage(e);return}$(this).button("disable");if(!started){window.setTimeout(startEventLoop,10)}});var b=jQuery("<button/>").addClass("stopLoop").css(c).appendTo(d).button({label:"停止",disabled:true}).click(function(e){$(this).button("disable");if(started){stopEventLoop("用户要求停止。")}});listenerHolder.on("beforeStart",function(e){a.button("disable");b.button("enable")});listenerHolder.on("afterStop",function(e){a.button("enable");b.button("disable")});return d}function buildInputElement(d,c){if(d===undefined||d===null){d="text"}var e=["text","password","checkbox","radio","submit","image","reset","button","file","hidden"];var b;switch(d){case"textarea":b=jQuery("<textarea/>");break;case"select":b=jQuery("<select/>");var a=_.isArray(c);_.each(c,function(g,f){b.append(jQuery("<option/>").attr("value",a?g[0]:f).text(a?g[1]:g))});break;default:if(_.indexOf(e,d)===-1){throw"错误的input type:"+d}b=jQuery("<input type='"+d+"'/>")}return b}function TableBuilder(){this.tableCss={"empty-cell":"show","border-collapse":"collapse"};this.tdCss={padding:"2px",border:"1px solid #ccc"}}TableBuilder.prototype.createTable=function(){return this.$tb=jQuery("<table/>").css(this.tableCss)};TableBuilder.prototype.createTr=function(){return this.$tr=jQuery("<tr/>").appendTo(this.$tb)};TableBuilder.prototype.createTd=function(){return this.$td=jQuery("<td/>").css(this.tdCss).appendTo(this.$tr)};function buildEventLoopConfigPane(){var c=jQuery("<div/>").addClass("loopConfig");var b=[];_.each(cfgMeta,function(e,d){if(e.viewable!==false){if(e.at!==undefined&&e.at>=0){b.splice(e.at,0,d)}else{b.push(d)}}});var a=new TableBuilder();a.createTable().appendTo(c);_.each(b,function(f,h){a.createTr();a.createTd().text(h+1);var e=cfg[f];var d=cfgMeta[f];a.createTd().text(d.label);if(!_.isObject(d.edit)){d.edit={type:"text"}}a.createTd();if(d.editable===false){a.$td.text(e);listenerHolder.on(f+"Change",null,{$e:a.$td},function(k,j,i){k.data.$e.text(i)})}else{var g=buildInputElement(d.edit.type,d.edit.options).appendTo(a.$td);g.addClass("enableWhenStop");if(_.isObject(d.edit.attrs)){g.attr(d.edit.attrs)}if(e!==undefined&&e!==null){g.val(e)}g.change(function(k){var i=jQuery(this).val();if(_.isObject(d.validator)){try{i=d.validator.check(i,d.label);setConfigValue(f,i)}catch(j){confirmMessage(j)}}});listenerHolder.on(f+"Change",null,{$e:g},function(k,j,i){k.data.$e.val(i)})}if(d.suffix){jQuery("<span/>").css("margin-left","4px").html(d.suffix).appendTo(a.$td)}});return c}function buildLogPane(){var c=jQuery("<div class='log'/>").attr("title","运行信息窗，双击清空。").addClass("log").css({"background-color":"white",padding:"2px",overflow:"auto"}).dblclick(function(d){$(this).empty()});var a=0;listenerHolder.on("beforeStart",function(d){c.empty();a=0});var b={debug:{color:"#144139",margin:"3px auto"},info:{color:"#000",margin:"3px auto"},warn:{color:"#EA04B3",margin:"3px auto"},error:{color:"red",margin:"3px auto"}};listenerHolder.on("log",function(g,i,j,d){a++;var h=70;var e=c.children();if(e.length>=h){e.filter(":lt("+(e.length-h+1)+")").remove()}var f=jQuery("<div class='item'/>").css(b[d]||{margin:"3px auto"}).html(a+"｜"+i);c.append(f);if(_.isFunction(c.scrollTo)){c.scrollTo(f)}if(j>LOG_LEVEL_INFO){console.error(i)}return true});return c}function readAllEventConfig(){_.each(events,function(c,b){var a=GM_getValue("eventWaitBeforeMillis."+c.id);if(a>=0){c.waitBeforeMillis=a}})}function saveEventConfig(a){if(a.waitBeforeMillis>=0&&a.waitBeforeMillis!==cfg.eventInterval){GM_setValue("eventWaitBeforeMillis."+a.id,a.waitBeforeMillis);debug("已保存")}}function buildEventListUI(){var b=jQuery("<div class='eventList'/>");listenerHolder.on("eventsChange",null,null,function(c){if(events.length>0){b.empty();a()}else{b.html("<h3>无动作序列！</h3>")}});function a(){var c=new TableBuilder();c.createTable().appendTo(b);c.createTr();var f={"font-weight":"bolder"};_.each(["序号","动作","稍等时间","倒计时"],function(k,j){c.createTd().text(k).css(f)});_.each(events,function(l,k){c.createTr().attr({id:eventLoopId+"_eventTr_"+k});c.createTd().append(jQuery("<span/>").text(k+1));if(eventIndexChangeableByUser===true&&events.length>1){c.$td.attr({id:eventLoopId+"_event_"+k}).on("dblclick",null,{eventIndex:k},function(i){if(started){info("程序停止后才能改变下一个要执行的动作！")}else{setNextEventIndex(i.data.eventIndex);info("下一个要执行的动作: "+getEventName(events[nextEventIndex]))}})}c.createTd().text(getEventName(l,k));c.createTd();var j=l.waitBeforeMillis;if(j===null||j===undefined||j<0){j=cfg.eventInterval}jQuery("<input type='text' class='enableWhenStop' size='5' maxlength='12'/>").val(j).appendTo(c.$td).on("change",null,{i:k},function(m){m.stopPropagation();var i=parseInt(jQuery.trim(this.value));if(isNaN(i)||i<0){confirmMessage("错误时间值！不采用！");this.value=n.waitBeforeMillis||cfg.eventInterval}else{var n=events[m.data.i];if(cfg.eventInterval===i&&n.waitBeforeMillis===undefined){info("等于默认值，不保存: "+i)}else{n.waitBeforeMillis=i;saveEventConfig(n)}}});jQuery("<span/>").text("毫秒").appendTo(c.$td);jQuery("<span/>").attr("id",eventLoopId+"_event_timeout_"+k).css({color:"red"}).appendTo(c.createTd())});if(events.length>1){var e=null;var d;function h(i){if(e!==null){clearInterval(e);if(i){i.empty()}else{if(d>=0){g(d).empty()}}e=null}}function g(j){return jQuery("#"+eventLoopId+"_event_timeout_"+j)}listenerHolder.on("eventTimerSet",null,null,function(j,k,i){h();if(i<1000){return}d=nextEventIndex;g(d).text((i/1000).toFixed(0));if(_.isFunction(b.scrollTo)){b.parent().scrollTo("#"+eventLoopId+"_eventTr_"+d)}e=setInterval(function(){var l=g(d);var m=parseInt(l.text())-1;if(!stopCommandReceived&&m>0){l.text(m)}else{h(l)}},1000)});if(eventIndexChangeableByUser===true){c.$tb.after(jQuery("<div/>").text("双击序号即可设置为下一个要执行的动作。"))}}}listenerHolder.triggerHandler("eventsChange");return b}var runCodeUIUsed=true;function buildRunCodeUI(){var $top=jQuery("<div class='runCode'/>");var $textarea=jQuery("<textarea/>").addClass("enableWhenStop").css({width:"97%",height:"150px"}).appendTo($top);var txt=GM_getValue("code");if(txt){$textarea.val(txt)}var $tbar=jQuery("<div/>").appendTo($top);jQuery("<button/>").addClass("enableWhenStop").appendTo($tbar).button({label:"运行"}).click(function(event){event.stopPropagation();this.disabled=true;try{var txt=jQuery.trim($textarea.val());if(txt.length>0){var a=String(eval(txt));info("运行结果:"+a);GM_setValue("code",txt)}else{throw"请输入代码！"}}catch(err){confirmMessage(err,"输入错误")}finally{this.disabled=false}});return $top}var ui_tab_action="动作";var ui_tab_setting="设置";var ui_tab_code="代码";var ui_tab_help="帮助";var rowCss={"margin-bottom":"5px"};var columnCss={"margin-right":"15px"};var uiCommonCss={"font-family":'"楷体",KaiTi,STKaiti,BiauKai,DFKai-SB,"Microsoft YaHei", "宋体","Trebuchet MS", Verdana,serif',"font-size":"16px"};var textLinkTemplate=_.template("<a href='<%=url%>' target='_blank' title='<%-title%>' style='text-decoration:underline;color:#255989;'><%-text%></a>");var helps=[];function buildHelpUI(){if(helps.length===0){return null}var b=jQuery("<div class='help'/>");var a=jQuery("<ol/>").css({margin:"auto"}).appendTo(b);_.each(helps,function(d,c){jQuery("<li/>").css({"list-style-type":"decimal",margin:"5px auto"}).html(d).appendTo(a)});return b}function showUI(e,p,f){var h=60;var c=300;var k=60;var m=_.extend({position:"fixed","z-index":2147483600,right:_.random(20,30)+"px",top:_.random(0,20)+"px",padding:"0px",width:"630px",height:(h+c+k+25)+"px",border:"1px solid #E1F82D","text-align":"left"},uiCommonCss);var o="";var j="td,th,legend,input,select,option,textarea,button,h1,h2,h3,h4,h5,h6,li,div,span,label,legend,p".split(",");_.each(j,function(a,q){o=o+"#<%=eventLoopId%> "+a;if(q!==j.length-1){o+=","}});GM_addStyle(_.template("#<%=eventLoopId%> * {font-family:inherit;text-align:left;}\r\n"+o+" {font-size:inherit;text-align:left;}",{eventLoopId:eventLoopId}));if(p!==undefined&&p!==null&&_.isObject(p)){p=_.extend(m,p)}else{p=m}var d=jQuery("<div/>").attr("id",eventLoopId).css(p).appendTo(jQuery("body"));var l=buildEventLoopControlPane();d.append(l);l.addClass("ui-layout-north").css({position:"relative"});var n=jQuery("<span/>").text("※").attr({title:"点住并拖拉"}).css({position:"absolute",right:"0px",cursor:"pointer"}).appendTo(l);jQuery("<span/>").text("X").attr({title:"删除界面"}).css({position:"absolute",right:"26px",cursor:"pointer"}).appendTo(l).click(function(a){jQuery("#"+eventLoopId).remove()});if(e===undefined||e===null||!_.isObject(e)){e={}}if(f===undefined||f===null||!_.isArray(f)){f=_.keys(e)}e[ui_tab_action]=buildEventListUI();if(_.indexOf(f,ui_tab_action)===-1){f.splice(0,0,ui_tab_action)}e[ui_tab_setting]=buildEventLoopConfigPane();if(_.indexOf(f,ui_tab_setting)===-1){f.splice(1,0,ui_tab_setting)}if(runCodeUIUsed){e[ui_tab_code]=buildRunCodeUI();if(_.indexOf(f,ui_tab_code)===-1){f.push(ui_tab_code)}}var g=buildHelpUI();if(g&&g.jquery){e[ui_tab_help]=buildHelpUI();if(_.indexOf(f,ui_tab_help)===-1){f.push(ui_tab_help)}}var b=jQuery("<div/>").attr("id",eventLoopId+"_main"+_.random(MAX_INT)).addClass("ui-layout-center").appendTo(d);var i=jQuery("<select/>").attr("id","settingsId"+_.unique()).appendTo(l);_.each(f,function(q,a){var r=eventLoopId+"_settings_"+a;e[q].attr("id",r).appendTo(b);if(a>0){e[q].hide()}jQuery("<option/>").val(r).text(q).appendTo(i)});i.change(function(a){b.children().hide();jQuery("#"+jQuery(this).val()).show()});d.append(buildLogPane().addClass("ui-layout-south").css({height:k+"px"}));d.draggable({handle:n,containment:"window"}).resizable({minWidth:420,minHeight:300});d.layout({applyDefaultStyles:false,north:{resizable:false,size:h,closable:false},center:{size:c},south:{size:k}});listenerHolder.on("beforeStart afterStop",function(a){jQuery("#"+eventLoopId+" .enableWhenStop").prop("disabled",a.type==="beforeStart"?true:false)});return d}function restoreAllConfig(){readAllEventConfig();readConfigValue()};
