Protocol.prototype={
	QueryInterface:function(iid) {
		if (!iid.equals(nsIProtocolHandler) &&
				!iid.equals(nsISupports))
			throw Components.results.NS_ERROR_NO_INTERFACE;
		return this;
	},

	scheme:kSCHEME,
	defaultPort:-1,
	protocolFlags:nsIProtocolHandler.URI_STD,
	
	allowPort:function(port, scheme) {
		return false;
	},

	newURI:function(spec, charset, baseURI) {
		var uri=Components.classes[kSIMPLEURI_CONTRACTID].createInstance(nsIURI);
		uri.spec=spec;
		return uri;
	},

	newChannel:function(aURI) {
		dump('>>> FireFlv Protocol.newChannel()...\n');

		// data:text/xml;charset=utf-8,%3C%3Fxml%20version%3D%221.0%22%3F%3E%3Ccross-domain-policy%3E%3Callow-access-from%20domain%3D%22*%22%2F%3E%3C%2Fcross-domain-policy%3E


		var myUrl=aURI.spec;
		dump('FROM: '+myUrl+'\n');

		var piece=myUrl.substring(18);
		piece=piece.substring(0, piece.indexOf('?'));
		if ('player'==piece) {
			myUrl='chrome://fireflv/content/flvplayer.swf';
		}
		
		dump('TO:   '+myUrl+'\n');

		var ios=Components.classes[kIOSERVICE_CONTRACTID]
			.getService(nsIIOService);
		return ios.newChannel(myUrl, null, null);
	},
};
