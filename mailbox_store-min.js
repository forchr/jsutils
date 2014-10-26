function MailboxStore(){this.addrs=[];try{var a=GM_getValue("addrs");if(a){this.addrs=JSON.parse(a)}}catch(b){debug(b);this.addrs=[]}this.max=300;this.count=0;this.defaultURL="http://localhost:9080/mailbox/save";this.url=GM_getValue("url",this.defaultURL)}MailboxStore.prototype.getCount=function(){return this.addrs.length};MailboxStore.prototype.checkStartConditions=function(){if(this.getCount()>=this.max){throw"请保存检测出的注册邮箱地址，再继续！"}};MailboxStore.prototype.save=function(b){if(b&&b.length){for(var c=0;c<b.length;c++){if(_.indexOf(this.addrs,b[c])===-1){this.addrs.push(b[c]);this.count++}}GM_setValue("addrs",JSON.stringify(this.addrs))}if(this.addrs.length){this.post()}return this};MailboxStore.prototype.post=function(c){if(!c){c=this.addrs}if(c.length===0){return}var g=[];for(var e=0;e<c.length;e++){var f=c[e];var d=f.indexOf("@");if(d>0){g.push({domain:f.substring(d+1),username:f.substring(0,d),status:4})}}if(g.length===0){error("错误邮箱地址！");return}var b=this;GM_xmlhttpRequest({method:"POST",url:this.url,data:JSON.stringify(g),headers:{"Content-Type":"text/plain"},onerror:function(a){error(a.status+": "+a.responseText);GM_log(a.responseText)},onload:function(a){if(a.status==200){b.addrs=c==b.addrs?[]:_.difference(b.addrs,c);b.save().showData()}info(a.responseText)}})};MailboxStore.prototype.showData=function(){this.$text.val(this.addrs.join("\r\n"));this.$total.text("本地:"+this.addrs.length+"(累计:"+this.count+")");return this};MailboxStore.prototype.clear=function(){GM_deleteValue("addrs");this.addrs=[];return this};MailboxStore.prototype.buildUI=function(){var e=jQuery("<div/>");var c=jQuery("<div/>").appendTo(e);c.text("邮箱地址总数:");this.$total=jQuery("<span/>").appendTo(c);var b=jQuery("<div/>").appendTo(e);this.$text=jQuery("<textarea/>").css({width:"98%",height:"160px"}).appendTo(b);var a=this;jQuery("<button/>").text("清空").appendTo(c).css({"margin-left":"20px"}).click(function(f){jQuery("<div/>").text("请手动存到别的文件后再清除！以免数据丢失。确定要继续清空？").css({"text-align":"left"}).dialog({title:"先保存",modal:true,height:260,width:340,resizable:true,buttons:[{text:"确定清空",click:function(){a.clear().showData();jQuery(this).dialog("close").dialog("destroy")}},{text:"取消",click:function(){jQuery(this).dialog("close").dialog("destroy")}}]})});jQuery("<button/>").text("保存到数据库").appendTo(c).css({"margin-left":"20px"}).click(function(g){debug("save db");if(a.addrs.length){a.post()}else{var f=jQuery.trim(a.$text.val()).split(/[\s,;]+/g);if(f.length){a.post(f)}}});this.showData();var a=this;var d=jQuery("<div/>").appendTo(e);jQuery("<span/>").text("数据库url:").appendTo(e);jQuery("<input type='text' size='60'/>").val(this.url).attr("title","双击恢复默认值").appendTo(e).change(function(f){a.url=jQuery.trim(jQuery(this).val());GM_setValue("url",a.url)}).dblclick(function(f){this.value=a.defaultURL});return e};
