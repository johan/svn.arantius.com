var gFireFlvHttpObserver={
	observe:function(subject, topic, data) {
		if ("http-on-modify-request"!=topic) return;

//		var httpChannel=subject
//			.QueryInterface(Components.interfaces.nsIHttpChannel);
		
//		for (var i in httpChannel) dump(i+'	'+('function'==typeof httpChannel[i]?'FUNC':httpChannel[i])+'\n');dump('\n');
//		dump('channel: '+httpChannel.name+'\n');
//
//		if (0==httpChannel.name
//			.indexOf('http://arantius.googlepages.com/flvplayer.swf')
//		) {
//			dump('\nforge: '+httpChannel.name+'\n');
//			var o=httpChannel.name;
//			o=o.substring(o.indexOf('origurl=')+8);
//			
//			httpChannel.originalURI=unescape(o);
//		}

//		if (gFireFlvIsVideoXDomain(httpChannel.name)) {
//			dump('FireFlv needs to override: '+httpChannel.name+'!\n');
//
//			var x=httpChannel.setResponseHeader(
//				'Location', 'http://arantius.googlepages.com/crossdomain.xml', false
//			);
//			dump('set? '+x+'\n');
//
//			//httpChannel.cancel();
//		}
			
//		dump('subj: '+subject+'\n');
//		for (i in Components.interfaces) {
//			try {
//				subject.QueryInterface(Components.interfaces[i]);
//				dump(i+'\n');
//			} catch(e) { }
//		}
//		dump('\n');
		
//		dump(
//			subject.QueryInterface(Components.interfaces.nsIHttpChannelInternal)
//				.documentURI.spec
//			+'\n'
//		);
	},

	get observerService() {
		return Components.classes["@mozilla.org/observer-service;1"]
			.getService(Components.interfaces.nsIObserverService);
	},

	register:function() {
		this.observerService.addObserver(this, "http-on-modify-request", false);
	},

	unregister:function() {
		this.observerService.removeObserver(this, "http-on-modify-request");
	}
};
gFireFlvHttpObserver.register();
