const TPSS_CONTRACTID="@arantius.com/tpss;1";
const TPSS_CID=Components.ID('{cabe6b3f-578c-480f-a2f0-68bc4b7a1142}');

const CONTENTPOLICY_CONTRACTID="@mozilla.org/layout/content-policy;1";
const CONTENTPOLICY_DESCRIPTION="Content policy service";

var policy={
	// nsIContentPolicy interface implementation
	shouldLoad:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra
	) {
		if (null==requestOrigin || null==requestingNode) {
			// if we don't know where the request came from, we can't
			// judge it.  let it through
			return apiConstants.ACCEPT;
		}

		if ('http'!=contentLocation.scheme &&
			'https'!=contentLocation.scheme &&
			'ftp'!=contentLocation.scheme
		) {
			// it's not a remote scheme, definitely let it through
			return apiConstants.ACCEPT;
		}

//		dump('shouldLoad remote?\n'+
//			contentLocation.spec+'\n'+
//			requestOrigin.spec+'\n'+
//			'\n'
//		);
//
//		dump([
//			'TPSS\'s shouldLoad called...',
//			contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra,
//			'-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=', ''
//		].join('\n'));

		if ('undefined'!=typeof requestingNode.tagName &&
			'SCRIPT'==requestingNode.tagName
		) {
			dump('requestingNode '+requestingNode+' is a script!\n');
			dump('c host: '+contentLocation.host+'\n');
			dump('r host: '+requestOrigin.host+'\n');
		}

		return apiConstants.ACCEPT;
	},

	// this is now for urls that directly load media, and meta-refreshes (before activation)
	shouldProcess:function(
		contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra
	) {
//		dump([
//			'TPSS\'s shouldProcess called...',
//			contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra,
//		'', ''].join('\n'));

		return apiConstants.ACCEPT;
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

// Factory object
var factory={
	// nsIFactory interface implementation
	createInstance:function(outer, iid) {
		if (outer!=null) throw Components.results.NS_ERROR_NO_AGGREGATION;
		return policy;
	},

	// nsIObserver + nsIPrefBranchObserver interface implementation
	observe:function(subject, topic, prefName) { 
		dump([
			'TPSS\'s factory observe called...',
			subject, topic, prefName,
		'', ''].join('\n'));

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
if (typeof(Components.classes[TPSS_CONTRACTID]) == 'undefined') {
	// Component registration
	var compMgr=Components.manager
		.QueryInterface(Components.interfaces.nsIComponentRegistrar);
	var cid=compMgr.contractIDToCID(CONTENTPOLICY_CONTRACTID);

	compMgr.registerFactory(
		cid, CONTENTPOLICY_DESCRIPTION, CONTENTPOLICY_CONTRACTID, factory
	);
	compMgr.registerFactory(
		TPSS_CID, CONTENTPOLICY_DESCRIPTION, TPSS_CONTRACTID, factory
	);
}
