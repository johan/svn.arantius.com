var gFireFlvHttpObserver={
	observe:function(subject, topic, data) {
		if ("http-on-examine-response"!=topic) return;

		var httpChannel=subject
			.QueryInterface(Components.interfaces.nsIHttpChannel);
		//for (var i in httpChannel) dump(i+'	'+httpChannel[i]+'\n');
		//dump(httpChannel.name+'\n');

		if (gFireFlvIsVideoXDomain(httpChannel.name)) {
			dump('FireFlv needs to override: '+httpChannel.name+'!\n');

			//httpChannel.setResponseHeader('Location', 'xx', false);
		}
			
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
		this.observerService.addObserver(this, "http-on-examine-response", false);
	},

	unregister:function() {
		this.observerService.removeObserver(this, "http-on-examine-response");
	}
};
gFireFlvHttpObserver.register();
