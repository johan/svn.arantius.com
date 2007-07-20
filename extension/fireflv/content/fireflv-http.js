var gFireFlvHttpObserver={
	observe:function(subject, topic, data) {
		if ('http-on-examine-response'!=topic) return;

		var httpChannel=subject
			.QueryInterface(Components.interfaces.nsIHttpChannel);

		if (-1==httpChannel.name.indexOf('example')) {
			httpChannel.setResponseHeader(
				'Location', 'http://www.example.com/\n\r\n\rFoo', false
			);
			// This doesn't work!  Wah!
			httpChannel.responseStatus=303;

			for (i in httpChannel) {
				dump(i+'	'+ ('function'==typeof httpChannel[i]?'FUNC':httpChannel[i]) +'\n');
			}
			dump('\n\n');
		}
	},

	get observerService() {
		return Components.classes['@mozilla.org/observer-service;1']
			.getService(Components.interfaces.nsIObserverService);
	},

	register:function() {
		this.observerService.addObserver(this, 'http-on-modify-request', false);
		this.observerService.addObserver(this, 'http-on-examine-response', false);
	},

	unregister:function() {
		this.observerService.removeObserver(this, 'http-on-modify-request');
		this.observerService.removeObserver(this, 'http-on-examine-response');
	}
};
gFireFlvHttpObserver.register();
