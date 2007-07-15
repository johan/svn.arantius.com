var gFireFlvPolicy={
	ACCEPT:Components.interfaces.nsIContentPolicy.ACCEPT,
	REJECT:Components.interfaces.nsIContentPolicy.REJECT_REQUEST,

	// nsIContentPolicy interface implementation
	shouldLoad:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra
	) {
		dump('FireFlv:\nloc: '+contentLocation.spec+'\norg: '+requestOrigin.spec+'\n');

		return this.ACCEPT;
	},

	// nsISupports interface implementation
	shouldProcess:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra
	) {
		dump([
			'.... shouldProcess ....', contentType, contentLocation.spec,
			requestOrigin.spec, requestingNode, mimeType, extra
		,''].join('\n'));
		return this.ACCEPT;
	},

	// nsISupports interface implementation
	QueryInterface:function(iid) {
		if (!iid.equals(Components.interfaces.nsISupports) &&
			!iid.equals(Components.interfaces.nsIContentPolicy)
		) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	}
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// Factory object
var gFireFlvPolicyFactory={
	// nsIFactory interface implementation
	createInstance:function(outer, iid) {
		if (outer!=null) throw Components.results.NS_ERROR_NO_AGGREGATION;
		return gFireFlvPolicy;
	},

	// nsISupports interface implementation
	QueryInterface:function(iid) {
		if (!iid.equals(Components.interfaces.nsISupports) &&
			!iid.equals(Components.interfaces.nsISupportsWeakReference) &&
			!iid.equals(Components.interfaces.nsIFactory) &&
			!iid.equals(Components.interfaces.nsIObserver)
		) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	}
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// Initialization and registration
if ('undefined'==typeof(Components.classes[FIREFLV_POLICY_CONTRACTID])) {
	(function() { // to keep from munging with scope
		const CONTENTPOLICY_CONTRACTID="@mozilla.org/layout/content-policy;1";
		const CONTENTPOLICY_DESCRIPTION="Content policy service";

		// Component registration
		var compMgr=Components.manager
			.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		var cid=compMgr.contractIDToCID(CONTENTPOLICY_CONTRACTID);

		compMgr.registerFactory(
			cid, CONTENTPOLICY_DESCRIPTION, CONTENTPOLICY_CONTRACTID, gFireFlvFactory
		);
		compMgr.registerFactory(
			FIREFLV_POLICY_CID, CONTENTPOLICY_DESCRIPTION, FIREFLV_POLICY_CONTRACTID, gFireFlvPolicyFactory
		);
	})();
}
