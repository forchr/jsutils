function MailDataComposer(e,f){this.SEND_NEW=0;this.SEND_SENT=1;this.rejectedReasons={addressInvalid:1,senderFrequencyLimited:2,mailContentDenied:3,spamMail:4};var c=this;var b={processSendActionCount:0,processSentCount:0,processAvgSentCount:0,pageSentCount:0,totalSentCount:0,pageSentMax:1000,composeSeparate:1,waitAfterHVC:30,continuousFailedCount:0,continuousFailedMax:0};cfgMeta.unknownFailCount.label="未知原因发信失败次数";cfgMeta.unknownFailMax.label="未知原因发信失败最大次数";var a={processSendActionCount:{label:"本次运行发送次数",editable:false,save:false},processSentCount:{label:"本次运行发信数",editable:false,save:false},processAvgSentCount:{label:"本次运行平均每次发出信数",editable:false,save:false},pageSentCount:{label:"此页面内发信数",editable:false,save:false},totalSentCount:{label:"累计发信数",editable:false},pageSentMax:{label:"此页面内最大发信数",edit:{type:"text",attrs:{title:"小于1表示无限",size:6,maxlength:"8"}},validator:gt0Validator},composeSeparate:{label:"群发单显",edit:{type:"select",options:[[1,"使用"],[0,"不使用"]]},validator:bool01Validator},waitAfterHVC:{label:"遇到人工验证码后暂停时间",edit:{type:"text",attrs:{title:"小于1表示停止不再发送",size:6,maxlength:"8"}},validator:gt0Validator,suffix:"分钟"}};if(e){helps.push("使用【再次发送已发信件】方法：1、在【设置】里选择【信件种类】为【已发信件】；2、手动打开已发信件。");_.extend(b,{sendLetterType:c.SEND_NEW,changeOldLetterSubject:1,changeOldLetterContent:1,checkAttachment:1});_.extend(a,{sendLetterType:{label:"信件种类",edit:{type:"select",options:[[c.SEND_NEW,"新信件"],[c.SEND_SENT,"已发信件"]]},validator:new IntValidator(0,1)},changeOldLetterSubject:{label:"原信件主题",edit:{type:"select",options:[[1,"改变"],[0,"不改变"]]},validator:new IntValidator(0,1)},changeOldLetterContent:{label:"原信件正文",edit:{type:"select",options:[[1,"改变"],[0,"不改变"],[2,"改变但保留图片"]]},validator:new IntValidator(0,2)},checkAttachment:{label:"检测到带附件才发信",edit:{type:"select",options:[[1,"是"],[0,"不检测"]]},validator:new IntValidator(0,1)}})}if(f){b.checkUnreadRejectedLetter=1;a.checkUnreadRejectedLetter={label:"检查未读退信",edit:{type:"select",options:[[1,"检查"],[0,"不检查"]]},validator:new IntValidator(0,1)}}_.extend(cfg,b);var d=0;_.each(a,function(h,g){h.at=d++});_.extend(cfgMeta,a);startConditons.push(this);this.rmm=new ReceiverMailboxManager();this.scm=new SubjectContentManager();this.data={addr:"",subject:"",content:""};this.addrSeperator=";"}MailDataComposer.prototype.bindEvent=function(){var a=listenerHolder;a.on("beforeStart",null,{my:this},function(c){var b=["processSentCount","processSendActionCount","processAvgSentCount"];_.each(b,function(f,e){var d=cfg[f];cfg[f]=0;listenerHolder.trigger(f+"Change",[d,cfg[f]])})});listenerHolder.on("afterStop",function(b){this.rmm.reportRemaining()});return this};MailDataComposer.prototype.restoreData=function(){this.rmm.restoreAll();this.scm.restoreAll();return this};MailDataComposer.prototype.getData=function(){return this.data};MailDataComposer.prototype.getAddr=function(){var a=this.sentMaxLeft();if(a<1){stopEventLoop(this.rmm.empty()?"没邮箱！":"完成发送任务，达最大值："+cfg.pageSentMax);return}this.addrArray=this.rmm.getForSend(a);if(this.addrArray===null){stopEventLoop(this.rmm.empty()?"没邮箱！":"所有邮箱发信完毕。");return}this.data.addr=this.addrArray.join(this.addrSeperator);debug("收件人: "+this.data.addr);return this.data.addr};MailDataComposer.prototype.getSubject=function(){debug("主题: "+this.data.subject);return this.data.subject};MailDataComposer.prototype.getContent=function(){debug("正文："+this.data.content);return this.data.content};MailDataComposer.prototype.setSystemTemplateData=function(a){var b=new Date();return _.extend(a,{d:b.toLocaleDateString(),t:b.toLocaleTimeString(),dt:b.toLocaleString(),to:this.data.addr})};MailDataComposer.prototype.sumAfterDelivered=function(){var d="processSendActionCount";setConfigValue(d,cfg[d]+1);var b=["processSentCount","pageSentCount","totalSentCount"];_.each(b,function(e,a){setConfigValue(e,cfg[e]+this.addrArray.length)},this);var c=parseFloat((cfg.processSentCount/cfg.processSendActionCount).toFixed(1));d="processAvgSentCount";setConfigValue(d,c)};MailDataComposer.prototype.getCurrentAddrsLength=function(){return this.addrArray?this.addrArray.length:0};MailDataComposer.prototype.mailDelivered=function(){this.sumAfterDelivered();this.rmm.sent(this.addrArray);this.rmm.storeStatus();this.scm.storeStatus();info("发出"+this.addrArray.length+"封邮件。")};MailDataComposer.prototype.mailNotDelivered=function(b){if(!b){b=this.addrArray}if(!b){return 0}var d=this.rmm.unsent(b);if(d>0){this.rmm.storeStatus()}};MailDataComposer.prototype.invalidAddrs=function(b){if(!b){b=this.addrArray}if(!b){return 0}var d=this.rmm.invalid(b);if(d>0){this.rmm.storeStatus()}};MailDataComposer.prototype.sentMaxLeft=function(){return cfg.pageSentMax<1?MAX_INT:(cfg.pageSentMax-cfg.pageSentCount)};MailDataComposer.prototype.composeData=function(){var d,b;if(cfg.sendLetterType===this.SEND_NEW||cfg.changeOldLetterSubject){d=this.scm.nextSubject();if(!d){stopEventLoop("没主题！");return}}if(cfg.sendLetterType===this.SEND_NEW||cfg.changeOldLetterContent){b=this.scm.nextContent();if(!b){stopEventLoop("没正文！");return}}if((d||b)&&this.scm.isTemplateUsed()){var a=this.scm.getUserTemplateData();if(!_.isObject(a)){a={}}this.setSystemTemplateData(a);var c={variable:this.scm.templateDataTopVariable};try{if(d){d=_.template(d,a,c);a.subject=d}else{a.subject="[undefined]"}if(b){b=_.template(b,a,c)}}catch(e){stopEventLoop(e);return}}this.data.subject=d;this.data.content=b};MailDataComposer.prototype.needWait=function(){return this.rmm.canFetch()&&(this.rmm.empty()||this.rmm.getUnsentCount()<1)};MailDataComposer.prototype.fetchData=function(){if(this.needWait()){this.rmm.fetchMailbox()}};MailDataComposer.prototype.checkStartConditions=function(){if(!this.rmm.canFetch()){if(this.rmm.empty()){throw"没有接收邮箱！"}if(this.rmm.getUnsentCount()<1){throw"所有邮箱地址都已发送完毕！"}}if(this.sentMaxLeft()<1){throw"已达到最大发信数！"}if((cfg.sendLetterType===this.SEND_NEW||cfg.changeOldLetterSubject>0)&&this.scm.getSubjectTotal()===0){throw"没有邮件主题！"}if((cfg.sendLetterType===this.SEND_NEW||cfg.changeOldLetterContent>0)&&this.scm.getContentTotal()===0){throw"没有邮件正文！"}};
