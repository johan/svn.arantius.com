/*
** authored by Wladimir and rue
*/


/*
 * Constants / Globals
 */

const TPSS_CONTRACTID="@arantius.com/tpss;1";
const TPSS_CID=Components.ID('{cabe6b3f-578c-480f-a2f0-68bc4b7a1142}');

const CONTENTPOLICY_CONTRACTID="@mozilla.org/layout/content-policy;1";
const CONTENTPOLICY_DESCRIPTION="Content policy service";

const PREFSERVICE_CONTRACTID="@mozilla.org/preferences-service;1";
const STDURL_CONTRACTID="@mozilla.org/network/standard-url;1";
const DIRSERVICE_CONTRACTID='@mozilla.org/file/directory_service;1';

var SubScriptLoader=Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
	.createInstance(Components.interfaces.mozIJSSubScriptLoader);

var origComponent = null;
var origContentPolicy = null;
var apiConstants = {};          // handle old + new api constants
var blockTypes = [];			// blockable content-policy types
var blockSchemes = [];			// blockable content-policy schemes
var exceptionTypes = [];		// unblocked content-policy types
var exceptionNames = [];		// unblocked node names
var linkTypes = [];				// link-blockable content-policy types
var linkSchemes = [];			// link-blockable href-protocols
var baseTypes = [];				// unalterable content-policy types
var baseNames = [];				// unalterable node names

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
			if (origComponent) {
				return origComponent.QueryInterface(iid);
			} else {
				throw Components.results.NS_ERROR_NO_INTERFACE;
			}
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

// returns the queryInterface to a dom-object or frame / iframe -- for 'shouldload' policy-check
function elementInterface(contentType, context, wnd) {
	try {
		if (!apiConstants.oldStyleAPI)
			return context;
		else if (contentType == apiConstants.SUBDOCUMENT)
			return wnd.frameElement;
		else if (contentType == apiConstants.DOCUMENT)
			return wnd.document.documentElement
		else 
			return context.QueryInterface(Components.interfaces.nsIDOMElement);
	} catch(e) { return context; }
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// binary array-search -- returns lowest-matching element if found; false otherwise
// -- Requires a SORTED array
//  -- note:sorting with a compareFunction defines ordering -> return:zero::unchanged, pos::first value, neg::second value
function binSearchArray(array, searchItem) {
	var low=0;
	var high=(array.length-1>0) ? array.length-1 :0; // in case array.length == 1
	var searchPoint=0;
	var prevPoint=0;
	var match=null;
	while (match == null) {
		searchPoint=Math.floor((high-low)/2+low);
		if (searchPoint == prevPoint) {
			searchPoint=(prevPoint==low) ? high :low; // due to rounding (floor), we might get stuck - so jump
			high=low; } // matches false if the search-term isn't found
		if (array[searchPoint] == searchItem) {
			match=array[searchPoint];
			array.splice(searchPoint, 1); } // remove match from search-array
		else if (high==low) match=false;													
		else if (searchItem < array[searchPoint]) high=searchPoint;
		else if (searchItem > array[searchPoint]) low=searchPoint;
		prevPoint=searchPoint;
	}
	return match;
}

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

(function() {

// Initialization and registration
if (typeof(Components.classes[TPSS_CONTRACTID]) == 'undefined') {

	// Saving original content policy
	try {
		origComponent=Components
			.classes[CONTENTPOLICY_CONTRACTID].getService();
		origContentPolicy=origComponent
			.QueryInterface(Components.interfaces.nsIContentPolicy);
	} catch (e) {
		dump("TPSS content policy init:exception when loading original content policy component:" + e + "\n"); 
	}

	if (!origContentPolicy) {
		return;
	}

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

// Standard Pref-observer registration
try {
	var prefInternal=Components.classes[PREFSERVICE_CONTRACTID]
		.getService(Components.interfaces.nsIPrefBranchInternal);
	prefInternal.addObserver("tpss", factory, true);
} catch (e) { 
	dump("TPSS content policy registration:exception when registering pref observer:" + e + "\n"); 
}

// content-policy api constants :old + new
apiConstants.UNIMPLEMENTED=-72591; // our own, custom value -- hopefully it remains available  ( -used by apiConstants.REFRESH)
apiConstants.OTHER=Components.interfaces.nsIContentPolicy.TYPE_OTHER;
apiConstants.SCRIPT=Components.interfaces.nsIContentPolicy.TYPE_SCRIPT;
apiConstants.IMAGE=Components.interfaces.nsIContentPolicy.TYPE_IMAGE;
apiConstants.STYLESHEET=Components.interfaces.nsIContentPolicy.TYPE_STYLESHEET;
apiConstants.OBJECT=Components.interfaces.nsIContentPolicy.TYPE_OBJECT;
apiConstants.DOCUMENT=Components.interfaces.nsIContentPolicy.TYPE_DOCUMENT;
apiConstants.SUBDOCUMENT=Components.interfaces.nsIContentPolicy.TYPE_SUBDOCUMENT;
apiConstants.REFRESH=Components.interfaces.nsIContentPolicy.TYPE_REFRESH; // new api ONLY ::shouldProcess() handles this

apiConstants.ACCEPT=Components.interfaces.nsIContentPolicy.ACCEPT; 			// +1
apiConstants.REJECT_REQUEST=Components.interfaces.nsIContentPolicy.REJECT_REQUEST; 	// -1 -- unilateral rejection
apiConstants.REJECT_TYPE=Components.interfaces.nsIContentPolicy.REJECT_TYPE; 		// -2 -- rejected based solely on its type (of the above flags)
apiConstants.REJECT_SERVER=Components.interfaces.nsIContentPolicy.REJECT_SERVER; 	// -3 -- rejected based on hosting/requesting server (aContentLocation or aRequestOrigin)
apiConstants.REJECT_OTHER=Components.interfaces.nsIContentPolicy.REJECT_OTHER; 	// -4 -- maybe direct third-party callers to consult the "extra" param for additional details
apiConstants.IMMEDIATE=-73; // another custom value (smaller for speed) -- same hope
apiConstants.NULL=-92; // UNUSED:custom value

// blockable types + schemes
blockTypes[apiConstants.UNIMPLEMENTED]=false; // DISABLED
blockTypes[apiConstants.SCRIPT]=true;
blockTypes[apiConstants.IMAGE]=true;
blockTypes[apiConstants.OBJECT]=true;
blockTypes[apiConstants.DOCUMENT]=true;
blockTypes[apiConstants.SUBDOCUMENT]=true;
blockSchemes["file"]=false;
blockSchemes["http"]=true;
blockSchemes["https"]=true;

})();
