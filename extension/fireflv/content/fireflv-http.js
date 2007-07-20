var gFireFlvHttpObserver={
	observe:function(subject, topic, data) {
		if ('http-on-modify-request'!=topic) return;

		var httpChannel=subject
			.QueryInterface(Components.interfaces.nsIHttpChannel);

		dump(httpChannel.name+'\n');
		httpChannel.setRequestHeader('X-FireFlv', 'Hello World!', false);
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
