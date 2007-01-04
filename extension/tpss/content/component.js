/*
** authored by Wladimir and rue
*/


/*
 * Constants / Globals
 */

const ADBLOCK_CONTRACTID = "@mozilla.org/adblock;1";
const ADBLOCK_CID = Components.ID('{34274bf4-1d97-a289-e984-17e546307e4f}');

const CONTENTPOLICY_CONTRACTID = "@mozilla.org/layout/content-policy;1";
const CONTENTPOLICY_DESCRIPTION = "Content policy service";

const PREFSERVICE_CONTRACTID = "@mozilla.org/preferences-service;1";
const STDURL_CONTRACTID = "@mozilla.org/network/standard-url;1";
const DIRSERVICE_CONTRACTID = '@mozilla.org/file/directory_service;1';

var SubScriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].createInstance(Components.interfaces.mozIJSSubScriptLoader);

var origComponent = null;
var origContentPolicy = null;
var apiConstants = new Object(); // handle old + new api constants
var blockTypes = [];			// blockable content-policy types
var blockSchemes = [];			// blockable content-policy schemes
var exceptionTypes = [];		// unblocked content-policy types
var exceptionNames = [];		// unblocked node names
var linkTypes = [];				// link-blockable content-policy types
var linkSchemes = [];			// link-blockable href-protocols
var baseTypes = [];				// unalterable content-policy types
var baseNames = [];				// unalterable node names
var frameCounter = 0;			// counter for "unique" obj-tab names

var isEnabled = false;
var linkCheck = false;			// pref: check parent-links for img / obj's
var pageBlock = false;			// pref: allow page-blocking
var removeAds = false;
var fastCollapse = false;
var frameObjects = false;
var patterns = [];


/*
 * Content policy class definition
 */

var policy = {
	// nsIContentPolicy interface implementation
	shouldLoad: function(contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra) {

	 	// if it's an unblockable-type, or unknown-scheme, return the normal policy
		if ( !blockTypes[contentType] || !blockSchemes[contentLocation.scheme]
				/*|| ( exceptionTypes[contentType] && exceptionNames[context.nodeName.toLowerCase()] )*/ // applets are back -!
			)
			return origContentPolicy ?
					origContentPolicy.shouldLoad(contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra) 
					: 
					apiConstants.ACCEPT;

	 	// handle old api
	 	if (apiConstants.oldStyleAPI) { 	// bool is set by adblockInit()
	 		var context = requestOrigin; 	// oldStyleAPI @params: function(contentType, contentLocation, context, wnd)
	 		var wnd = requestingNode; /*requestOrigin=false, requestingNode=false, mimeTypeGuess=false;*/ }
	 	else {
	 		if (requestingNode) // moronically, this argument is now "optional"
	 			wnd = requestingNode.defaultView || (requestingNode.ownerDocument ? requestingNode.ownerDocument.defaultView : null);
	 		context = requestingNode; }
	 	
		if (isEnabled) {
			var filterMatch = null;
	
			// if we've already checked this url, use the prior result -- filter-cache
			if (wnd && typeof(wnd.top._AdblockFiltered)!='undefined' && typeof(wnd.top._AdblockFiltered[contentLocation.spec]!='undefined'))
				filterMatch = wnd.top._AdblockFiltered[contentLocation.spec];
			// if any containing-link matches a filter..
			if (filterMatch == null && context && wnd && linkCheck && linkTypes[contentType]) filterMatch = checkLinks(contentType, contentLocation, context, wnd);
			// if we didn't match a link, check the element's source
			if (filterMatch == null) filterMatch = isBlocked(contentLocation); // store the matching filter, or null

			if (filterMatch) {

					// special handling for documents
					if (contentType == apiConstants.DOCUMENT) {
						// we'll have to comb through the windows+tabs manually, now; looking for this unloaded URI
						if (pageBlock) { if (apiConstants.oldStyleAPI) adblockPageBlock(filterMatch, contentLocation, wnd); } // if page-block is enabled, write a message and stop.
						else return apiConstants.ACCEPT; } // no need to continue if the page will load (it would only add us to the adblockable-listing)

					// filter-cache
					if (wnd) {
						if (typeof(wnd.top._AdblockFiltered) == 'undefined') wnd.top._AdblockFiltered = []; // create the "filtered" asc-array
						if (typeof(wnd.top._AdblockFiltered) == 'object' && !wnd.top._AdblockFiltered[contentLocation.spec]) // some (whack) sites dont allow proper access to wnd.top
							wnd.top._AdblockFiltered[contentLocation.spec] = filterMatch; } // add the matched url to our filtered-cache
					
					var node = elementInterface(contentType, context, wnd);
					
					if (node) {
						// metadata
						storeAdblockData(node, contentLocation, contentType, filterMatch);
		
						// special handling for applets -- disables by specifying a default class
						if (node.nodeName.toLowerCase() == "applet") {
							node.setAttribute("AdblockCode", node.getAttribute("code")); // save the original code attribute
							node.setAttribute("code", "java.applet.Applet"); // this is a default class, which does nothing
							if (node.hasAttribute("AdblockFrameName"))
								node.ownerDocument.getElementById(node.getAttribute("AdblockFrameName")).style.visibility = 'hidden'; }// hide tab-frame -- applets
						
						// hide overlay / frame -- on filter-dialog "refiltration" -- not applets, though
						else {
							if (typeof(node._AdblockOverlay) != 'undefined' && node._AdblockOverlay.style.visibility != 'hidden')
								node._AdblockOverlay.style.visibility = 'hidden'; // hide flash-overlay
							if (typeof(node._AdblockFrame) != 'undefined')
								node._AdblockFrame.style.visibility = 'hidden'; } // hide tab-frame -- objects
		
						// if it's not a base-element
						if ( ! (baseTypes[contentType] && baseNames[node.nodeName.toLowerCase()] )) {
							var immediate = apiConstants.oldStyleAPI ? (node._AdblockImmediate) : (mimeTypeGuess == apiConstants.IMMEDIATE); // (extra instanceof Components.interfaces.nsISupports)
							if (removeAds) adblockRemoveFast(node, wnd, immediate); // ..and we're set to 'remove', collapse the node.
							else adblockHide(node, wnd, immediate); } // ..otherwise, hide it
					}
	
				var loadNode = removeAds ? apiConstants.REJECT_REQUEST : apiConstants.ACCEPT;
				return loadNode; // bool: "shouldload" node?
			}
			//  node wasn't blocked -- update filter-cache
			if (wnd) {
				if (typeof(wnd.top._AdblockFiltered) == 'undefined') wnd.top._AdblockFiltered = []; // create the "filtered" asc-array
				if (typeof(wnd.top._AdblockFiltered) == 'object') wnd.top._AdblockFiltered[contentLocation.spec] = false; } // add the unblocked url to our filtered-cache --  ps: some (whack) sites dont allow proper access to wnd.top
		}

		// either the node wasn't blocked OR we're not enabled:
		// -- check original policy, and then object-frame addition..
		loadNode = origContentPolicy ? // apiConstants.notReal isn't defined, allowing us to selectively pass "undefined" if we want
					origContentPolicy.shouldLoad(contentType, contentLocation, requestOrigin, requestingNode, mimeTypeGuess, extra) 
					: 
					apiConstants.ACCEPT;
		if (loadNode == apiConstants.ACCEPT && contentType != apiConstants.DOCUMENT) { // ..not for Documents, though!
			node = elementInterface(contentType, context, wnd); // 'node' declared prior
			
			if (node) {
				// store filtering-metadata
				storeAdblockData(node, contentLocation, contentType, null);
				// if we're set to, add a frame to all applets + objects + raw-embeds
				node = elementInterface(contentType, context, wnd);
				if (isEnabled && frameObjects 
						&& (contentType == apiConstants.OBJECT || /embed/.test(node.nodeName.toLowerCase()) ) // objects *and* raw-embeds
						&& contentLocation.spec != node.ownerDocument.URL ) // it's not a standalone object
					makeObjectFrame(node, contentType, contentLocation, wnd); // add frame
			}
		
		}
		return loadNode;
	},

	// this is now for urls that directly load media, and meta-refreshes (before activation)
	shouldProcess: function(contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra) {
	 	/* If + When the time comes... we're ready:
	 	// handle old api
	 	if (apiConstants.oldStyleAPI) { 	// bool is set by adblockInit()
	 		var context = requestOrigin; 	// oldStyleAPI @params: function(contentType, contentLocation, context, wnd)
	 		var wnd = requestingNode; }
	 	else {
	 		wnd = requestingNode.ownerDocument.defaultView;
	 		context = requestingNode; } */
		return origContentPolicy ? 
					origContentPolicy.shouldProcess(contentType, contentLocation, requestOrigin, requestingNode, mimeType, extra) 
					: 
					apiConstants.ACCEPT;
	},

	// nsISupports interface implementation
	QueryInterface: function(iid) {
		if (!iid.equals(Components.interfaces.nsISupports) &&
			!iid.equals(Components.interfaces.nsIContentPolicy))
		{
			if (origComponent)
				return origComponent.QueryInterface(iid);
			else
				throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	}
};

// Factory object
var factory =
{
	// nsIFactory interface implementation
	 createInstance: function(outer, iid) {
		if (outer != null) throw Components.results.NS_ERROR_NO_AGGREGATION;
		return policy;
	},

	// nsIObserver + nsIPrefBranchObserver interface implementation
	observe: function(subject, topic, prefName) { 
		// subject: [wrapped nsISupports :: nsIPrefBranch], nsIPrefBranchInternal
		// topic: "changed"
		
		if (topic == "Adblock-SavePrefFile") {
			var prefObj = Components.classes[PREFSERVICE_CONTRACTID].getService(Components.interfaces.nsIPrefService);
			prefObj.savePrefFile(null); // save the prefs to disk
			return; }
		else if (topic == "Adblock-PrefChange" && prefName == "FilterChange") {
			adblockLoadSettings(prefName); // reload -- with prefname
			return; }
		else if (topic == "Adblock-LoadAPIConstants") {
			var appShell = Components.classes["@mozilla.org/appshell/appShellService;1"].getService(Components.interfaces.nsIAppShellService);
			var hiddenWnd = appShell.hiddenDOMWindow; // global hidden-window
			if (!hiddenWnd.apiConstants) hiddenWnd.apiConstants = apiConstants;
			return; }
		else {
			var prefRe = /^adblock\.(?!observer|patterns)/; // reloads settings only on appropriate pref-change
			if (prefRe.test(prefName)) adblockLoadSettings(prefName); } // reload -- with prefname

	},

	// nsISupports interface implementation
	QueryInterface: function(iid) {
		if (!iid.equals(Components.interfaces.nsISupports) &&
			!iid.equals(Components.interfaces.nsISupportsWeakReference) &&
			!iid.equals(Components.interfaces.nsIFactory) &&
			!iid.equals(Components.interfaces.nsIObserver))
		{
			dump("Adblock content policy factory object: QI unknown interface: " + iid + "\n");
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		return this;
	}
}



/*
 * Core Routines
 */

adblockInit(); // begin initialization

// Initialization and registration
function adblockInit() {

	if (typeof(Components.classes[ADBLOCK_CONTRACTID]) == 'undefined') {
	
		// Saving original content policy
		try {
			origComponent = Components.classes[CONTENTPOLICY_CONTRACTID].getService();
			origContentPolicy = origComponent.QueryInterface(Components.interfaces.nsIContentPolicy);
		} catch (e) { dump("Adblock content policy init: exception when loading original content policy component: " + e + "\n"); }
	
		if (!origContentPolicy)
			return;
	
		// Component registration
		var compMgr = Components.manager.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		var cid = compMgr.contractIDToCID(CONTENTPOLICY_CONTRACTID);
	
		compMgr.registerFactory(cid, CONTENTPOLICY_DESCRIPTION, CONTENTPOLICY_CONTRACTID, factory);
		compMgr.registerFactory(ADBLOCK_CID, CONTENTPOLICY_DESCRIPTION, ADBLOCK_CONTRACTID, factory);

	}

	// Standard Pref-observer registration
	try {
		var prefInternal = Components.classes[PREFSERVICE_CONTRACTID].getService(Components.interfaces.nsIPrefBranchInternal);
		prefInternal.addObserver("adblock", factory, true);
	} catch (e) { dump("Adblock content policy registration: exception when registering pref observer: " + e + "\n"); }

	// Custom Pref-observer registration
	try {
		var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);
		observerService.addObserver(factory, "Adblock-PrefChange", true);
		observerService.addObserver(factory, "Adblock-SavePrefFile", true);
		observerService.addObserver(factory, "Adblock-LoadAPIConstants", true);
	} catch (e) { dump("Adblock content policy registration: exception when registering saveprefs observer: " + e + "\n"); }

	// Variable initialization
	
	// content-policy api constants : old + new
	apiConstants.oldStyleAPI = typeof(Components.interfaces.nsIContentPolicy.TYPE_DOCUMENT) == 'undefined';
	apiConstants.UNIMPLEMENTED = -72591; // our own, custom value -- hopefully it remains available  ( -used by apiConstants.REFRESH)
	apiConstants.OTHER = 		Components.interfaces.nsIContentPolicy.OTHER 		| Components.interfaces.nsIContentPolicy.TYPE_OTHER;
	apiConstants.SCRIPT = 		Components.interfaces.nsIContentPolicy.SCRIPT 		| Components.interfaces.nsIContentPolicy.TYPE_SCRIPT;
	apiConstants.IMAGE = 		Components.interfaces.nsIContentPolicy.IMAGE 		| Components.interfaces.nsIContentPolicy.TYPE_IMAGE;
	apiConstants.STYLESHEET = 	Components.interfaces.nsIContentPolicy.STYLESHEET 	| Components.interfaces.nsIContentPolicy.TYPE_STYLESHEET;
	apiConstants.OBJECT = 		Components.interfaces.nsIContentPolicy.OBJECT 		| Components.interfaces.nsIContentPolicy.TYPE_OBJECT;
	apiConstants.DOCUMENT = 	Components.interfaces.nsIContentPolicy.DOCUMENT 	| Components.interfaces.nsIContentPolicy.TYPE_DOCUMENT;
	apiConstants.SUBDOCUMENT = 	Components.interfaces.nsIContentPolicy.SUBDOCUMENT 	| Components.interfaces.nsIContentPolicy.TYPE_SUBDOCUMENT;
	apiConstants.REFRESH = 			apiConstants.oldStyleAPI ? apiConstants.UNIMPLEMENTED : Components.interfaces.nsIContentPolicy.TYPE_REFRESH; // new api ONLY :: shouldProcess() handles this
	apiConstants.ACCEPT = 			apiConstants.oldStyleAPI ? true  : Components.interfaces.nsIContentPolicy.ACCEPT; 			// +1
	apiConstants.REJECT_REQUEST = 	apiConstants.oldStyleAPI ? false : Components.interfaces.nsIContentPolicy.REJECT_REQUEST; 	// -1 -- unilateral rejection
	apiConstants.REJECT_TYPE = 		apiConstants.oldStyleAPI ? false : Components.interfaces.nsIContentPolicy.REJECT_TYPE; 		// -2 -- rejected based solely on its type (of the above flags)
	apiConstants.REJECT_SERVER = 	apiConstants.oldStyleAPI ? false : Components.interfaces.nsIContentPolicy.REJECT_SERVER; 	// -3 -- rejected based on hosting/requesting server (aContentLocation or aRequestOrigin)
	apiConstants.REJECT_OTHER = 	apiConstants.oldStyleAPI ? false : Components.interfaces.nsIContentPolicy.REJECT_OTHER; 	// -4 -- maybe direct third-party callers to consult the "extra" param for additional details
	apiConstants.IMMEDIATE = -73; // another custom value (smaller for speed) -- same hope
	apiConstants.NULL = -92; // UNUSED: custom value
	
	// blockable types + schemes
	blockTypes[apiConstants.UNIMPLEMENTED] = false; // DISABLED
	blockTypes[apiConstants.SCRIPT] = true;
	blockTypes[apiConstants.IMAGE] = true;
	blockTypes[apiConstants.OBJECT] = true;
	blockTypes[apiConstants.DOCUMENT] = true;
	blockTypes[apiConstants.SUBDOCUMENT] = true;
	blockSchemes["file"] = false;
	blockSchemes["http"] = true;
	blockSchemes["https"] = true;

	// unblocked types + nodeNames
	exceptionTypes[apiConstants.OBJECT] = false; // DISABLED
	exceptionNames["applet"] = false; // DISABLED

	// link-searchable types + href-protocols
	linkTypes[apiConstants.IMAGE] = true;
	linkTypes[apiConstants.OBJECT] = true;
	linkSchemes["file:"] = false;
	linkSchemes["http:"] = true;
	linkSchemes["https:"] = true;
	linkSchemes["javascript:"] = true;

	// unalterable content-policy types + nodeNames -- root-elements
	baseTypes[apiConstants.IMAGE] = true;
	baseTypes[apiConstants.DOCUMENT] = true;
	baseTypes[apiConstants.SCRIPT] = true;
	baseNames["html"] = true;
	baseNames["body"] = true;
	baseNames["script"] = true;

	// Temp-Dir Cleanup (for prior uninstalls) -- separate, in case there's no default profile, or the user isn't root
	var dirArray = new Array();
	dirArray[0] = "AChrom"; 	// app. chrome magic-key
	dirArray[1] = "UChrm"; 		// profile chrome magic-key
	dirArray[2] = "ProfD"; 		// profile directory magic-key
	dirArray[3] = "ComsD"; 		// component directory magic-key
	for (var i = 0, n ; i < dirArray.length ; i++) {
		try { 
			var dirService = Components.classes[DIRSERVICE_CONTRACTID].getService(Components.interfaces.nsIProperties);
			var currentDir = dirService.get(dirArray[i], Components.interfaces.nsIFile);
			var tempDir = currentDir.clone();
			var uninstalledFile = currentDir.clone();
			
			tempDir.append("adblock-temp");
			uninstalledFile.append("adblock-uninstalled");
			n = 1;
			
			// remove temp-dir
			if (tempDir.exists()) tempDir.remove(true);
			
			// remove installer-uninstalled files
			while (uninstalledFile.exists()) {
				uninstalledFile.remove(true);
				uninstalledFile = currentDir.clone();
				uninstalledFile.append("adblock-uninstalled" + n);
				n++; }
		} catch(e) { /*throw(e);*/ }
	}

	// Load Settings
	adblockLoadSettings("Init");
}

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

// stores adblock-metadata for an element
function storeAdblockData(node, contentLocation, contentType, filterMatch) {
	try { if (apiConstants.oldStyleAPI) node = node.QueryInterface(Components.interfaces.nsIDOMElement); } // this totally mangles the new API
	catch(e) {}
	try {
		// special handling for UNLOADED or blocked applets
		if (node.nodeName.toLowerCase() == "applet" && (node.hasAttribute("AdblockData") || !filterMatch) ) { // loaded or unmatched
			if (!node.hasAttribute("AdblockData")) {
				node.setAttribute("AdblockData", true); // applets can't directly test for "public-classes"
				node.setAttribute("AdblockLocation", contentLocation.spec);
				node.setAttribute("AdblockType", contentType); }
			node.setAttribute("AdblockMatch", filterMatch); }
		else {
			if (typeof(node._AdblockData) == 'undefined') node._AdblockData = []; // applets can't test "typeof"
			node._AdblockData.push(contentLocation);
			node._AdblockData.push(contentType);
			node._AdblockData.push(filterMatch); } // null, or the matched filter
	}
	catch(e) {}
}

// stores the reference to a local-document's nsIDocShell -- for reflows
function storeAdblockDocShell(wnd) {
	
}

// for blocked / hidden pages 
//   -- writes a message showing the filter and its matched portion of url
function adblockPageBlock(filterMatch, contentLocation, wnd) {
	filterMatch = filterMatch.toString(); // force-convert filter to string
	var urlRe = new RegExp(filterMatch.replace(/^\/(.*)\/i?$/, "($1)"), "i"); // must come before filterMatch's change
	var urlHilight = contentLocation.spec.replace(urlRe, "<span class='urlHilight'>$1</span>");
	var simpleRe = /\(\?\:\\n\)\?/; // test for the "Adblock simple-filter" flag
	if (simpleRe.test(filterMatch)) filterMatch = filterMatch.replace(/^\/(.*)\(\?\:\\n\)\?\/i?$/, "$1").replace(/\\\./g, " ").replace(/\.\*/g, "*").replace(/\s/g, ".").replace(/\\/g, ""); // the first 'replace' is same as substr, below -- left regexp for fun
	else filterMatch = filterMatch.substr(0, filterMatch.length - 1); //.replace(/\\/g, "\\\\"); // length isn't zero-based + / + $ + flag "i" are anchored to end
	var title = contentLocation.host.replace(/^www\./, "");
	var pageElementLocal = wnd.document.documentElement;
	// write the block-message into the page -- [Note: doesn't center properly for pages with prior content]
	pageElementLocal.innerHTML = "\
		<head>\
			<style type='text/css'>\
			<!--\
				.massive 	{ font-family: Times, Times New Roman, Serif; font-size: 400%; color: #999999;}\
				.infotext	{ font-family: Arial, Helvetica, San-serif; font-size: medium; color: #999999;}\
				.filter		{ font-family: Arial, Helvetica, San-serif; font-size: medium; color: #993333;}\
				.url		{ font-family: Arial, Helvetica, San-serif; font-size: small; color: #999999;}\
				.urlHilight	{ border-width: 0 0 1px 0; border-color: default; border-style: none none solid none;}\
			-->\
			</style>\
		</head>\
		<body>\
			<table style='width: 100%; height: 100%;'><tr valign='middle'><td><center>\
				<span class='massive'>Adblock</span><br>\
				<span class='infotext'>This site has been blocked: </span><span class='filter'>"+filterMatch+"</span><br>\
				<span class='url'>"+urlHilight+"</span>\
			</center></td></tr></table>\
		</body>";
	//wnd.setTimeout("document.title = 'Adblocked: "+title+"';", 0);
	//wnd.gURLBar.value = contentLocation.spec;
	
	// fire the notification-event -- so our listener can set the urlbar / content.uri
	pageElementLocal.adblockURI = contentLocation;
	var event = pageElementLocal.ownerDocument.createEvent('Events');
	event.initEvent("adblock-pageblock", true, false);
	event.adblockURI = contentLocation;
	pageElementLocal.dispatchEvent(event);
}

// hides a BLOCKED element -- faster / less thorough
function adblockRemoveFast(node, wnd, immediate) {
	// serialize iframes - to avoid graphics-glitch -- old api only
	if (apiConstants.oldStyleAPI && node.nodeName.toLowerCase() == "iframe")
		wnd.document.documentElement.innerHTML = "";

	// collapse frameset-cols+rows for frames
	if (node.nodeName.toLowerCase() == "frame" && node.parentNode.nodeName.toLowerCase() == "frameset") {
		var i = 0, prevFrame = node;
		while (prevFrame.previousSibling) {
			if (/^frame|frameset$/i.test(prevFrame.previousSibling.nodeName)) i++;
			prevFrame = prevFrame.previousSibling; }

		/* This was a frameset alteration-listener. it proved too complicated to be desirable
		if (node.parentNode.hasAttribute("adblockrows") || node.parentNode.hasAttribute("adblockcols"))
			return;
			node.parentNode.removeEventListener("DOMAttrModified", onFramesetChange, true); */
		var setTypes = ["cols", "rows"], RowsOrCols;
		for (var t in setTypes) {
			RowsOrCols = setTypes[t];
			if (node.parentNode.hasAttribute(RowsOrCols))
				adblockRemoveSlow(node, wnd, immediate, '\
					var setWidths = node.parentNode.getAttribute("'+RowsOrCols+'").split(",");\
					setWidths['+i+'] = "0";\
					setWidths = setWidths.join(",");\
					node.parentNode.setAttribute("adblock'+RowsOrCols+'", setWidths);\
					node.parentNode.setAttribute("'+RowsOrCols+'", setWidths);\
				'); }
		/*node.parentNode.addEventListener("DOMAttrModified", onFramesetChange, true);*/
	}
	// explicitly hide nodes (when adding a filter)
	else (fastCollapse) ?
		adblockHide(node, wnd, immediate)
		:
		adblockRemoveSlow(node, wnd, immediate);
}

/* We're stuck with code-strings below -- newer builds sandbox anonymous-functions from accessing 'node' */

// hides a BLOCKED element -- slower / more thorough
function adblockRemoveSlow(node, wnd, immediate, removalCode) {
	// use timeout to collapse node - otherwise the reflow-queue doesn't catch it
	// set style + collapse frameset-cols+rows for frames (if specified)
	if (immediate) (removalCode) ? eval(removalCode) : (node.style.display = "none");
	else {
		var nodeIndex = adblockNodeIndex(wnd, node);
		wnd.setTimeout(
				"var node = window._AdblockObjects["+nodeIndex+"];\
				"+  (removalCode ? removalCode : "node.style.display = 'none';")  +"\
				delete window._AdblockObjects["+nodeIndex+"];", 0); // no content will be loaded
	}
}

// hides a LOADED element
function adblockHide(node, wnd, immediate) {
	// use timeout to hide node - so reflow-queue gets it
	try {node = node.QueryInterface(Components.interfaces.nsIDOMElement);} catch(e) {}
	if (immediate) node.style.setProperty("visibility", "hidden", "important");
	else {
		var nodeIndex = adblockNodeIndex(wnd, node);
		wnd.setTimeout(
				"var node = window._AdblockObjects["+nodeIndex+"];\
				node.style.setProperty('visibility', 'hidden', 'important');\
				delete window._AdblockObjects["+nodeIndex+"];", 0); // content will load
	}
}

// indexes the relevant node, for setTimeout -- newer builds fails to pass this proper
function adblockNodeIndex(wnd, node) {
	if (typeof(wnd._AdblockObjects) == 'undefined') { 
		wnd._AdblockObjects=[]; 
		wnd._AdblockCounter=0; }
	var nodeIndex = ""+wnd._AdblockCounter++;
	switch(arguments.length) {
		case 1: break;
		case 2: wnd._AdblockObjects[nodeIndex] = node; break;
		default: 
			wnd._AdblockObjects[nodeIndex] = new Array();
			for (var n = 1 ; n < arguments.length ; n++)
				wnd._AdblockObjects.push(arguments[n]); // for makeObjectFrame()
			break;
	}
	
	return nodeIndex;
}



/*
 * URL checking
 */

// Tests if any containing-link matches a filter
function checkLinks(contentType, contentLocation, context, wnd) {
	var parentLink = null, parentLinkLocation, parentNode = elementInterface(contentType, context, wnd).parentNode;
	while (parentNode && parentLink == null) {
		if (typeof(parentNode.href) != 'undefined' && parentNode.href 
				&& linkSchemes[parentNode.protocol.toLowerCase()] ) 
			parentLink = parentNode.href;
		//else if (parentNode.getAttribute("URL")) parentLink = parentNode.getAttribute("URL"); // unneeded ?
		else parentNode = parentNode.parentNode; }
	if (parentLink) { try {
		parentLinkLocation = new Object();
		parentLinkLocation.spec = parentLink;
		parentLinkLocation.host = "all"; //}
		var linkMatch = isBlocked(parentLinkLocation); 
		//if (linkMatch) parentNode.removeAttribute("href"); // DISABLED: stops other children from being caught --eliminate link, if matching
		return linkMatch; } catch(e) { wnd.alert("Adblock LinkCheck Error: " + contentLocation.spec + "\n\n" + parentLink + "\n\n" + e); return null;} }
	else 
		return null;
}

// Tests if a given URL should be blocked
function isBlocked(url) {
	if (typeof(patterns[url.host]) != 'undefined') {
		var matchingPattern = checkURL(url.spec, patterns[url.host]);
		if (matchingPattern || url.host == 'all') 
			return matchingPattern; } // if no matches (and not linkCheck), continue..
		
	if (typeof(patterns['']) != 'undefined') {
		matchingPattern = checkURL(url.spec, patterns['']);
		return matchingPattern; } // if no matches, we're done.
}

// Checks if the URL matches any of the patterns from the list
function checkURL(url, patterns) {
	for (var i=0; i<patterns.length; i++)
		if (patterns[i].test(url))
			return patterns[i];

	return null; // if no matches, return null
}



/*
 * Filter management
 */

// Loads the preferences
function adblockLoadSettings(prefName) {
	var prefObj = Components.classes[PREFSERVICE_CONTRACTID].getService(Components.interfaces.nsIPrefService);
	var Branch = prefObj.getBranch("adblock.");

	// Load Bool-prefs -- on init or inidividual-change
	if (prefName && prefName != "FilterChange") {
		isEnabled = !Branch.prefHasUserValue("enabled") || Branch.getBoolPref("enabled"); // default:true
		linkCheck = Branch.prefHasUserValue("linkcheck") && Branch.getBoolPref("linkcheck"); // default:false
		pageBlock = Branch.prefHasUserValue("pageblock") && Branch.getBoolPref("pageblock"); // default:false
		removeAds = !Branch.prefHasUserValue("hide") || !Branch.getBoolPref("hide"); // rev-hide -- default:true
		fastCollapse = Branch.prefHasUserValue("fastcollapse") && Branch.getBoolPref("fastcollapse"); // default:false
		frameObjects = !Branch.prefHasUserValue("frameobjects") || Branch.getBoolPref("frameobjects"); // default:true
		// don't continue, if we're not initializing
		if (prefName != "Init") return;
	}
	
	// Load Filter-list -- on init or list-change
	patterns = [];
	var url = Components.classes[STDURL_CONTRACTID].createInstance(Components.interfaces.nsIURI);
	var list = Branch.prefHasUserValue("patterns") ? Branch.getCharPref("patterns") : null;
	
	/*
	// Default Filters (for unset pref)
	if (list == null) {
		SubScriptLoader.loadSubScript("chrome://adblock/content/component-defaultfilters.js"); // gives us "var defaultFilterString"
		Branch.setCharPref('patterns', defaultFilterString);
		list = defaultFilterString; }
	*/
	
	// Duplicate management
	if (list && list != "") {
		// remove duplicate entries
		list = list.split(" ");
		var origLength = list.length;
		var duplicateFound = false, lastMatch;
		var tempList = list.slice(0, list.length); // copy the list
		tempList.sort();
		for (var d = 0; d < list.length; d++) {
			binSearchArray(tempList, list[d]); // remove the "initial" entry
			duplicateFound = binSearchArray(tempList, list[d]); // first duplicate (if any)
			if (duplicateFound) {
				var m = true;
				while (m) m = binSearchArray(tempList, list[d]); // remove further duplicates from tempList
				for (var r = d+1; r < list.length; r++)
					if (list[r] == duplicateFound) { // only match the duplicates (second+)
						list.splice(r, 1); // remove duplicate from real list
						lastMatch = r;
						r--; // back the counter - from splice 
					}
				list.splice(d, 1); // remove original item..
				list.splice(lastMatch-1, 0, duplicateFound); // ..reinserting at last match-point (-1 from splice)
				d--; // back the counter - from splice
			}
		}
		// save list -- on truncation, or pref-change
		if (list.length < origLength || prefName) 
			try {
				var joinedList = (list.slice(0, list.length)).join(" "); // copy+join the list
				//prefListReloading = true; // window-flag to keep prefs from reloading
				Branch.setCharPref("patterns", joinedList);
				prefObj.savePrefFile(null); // save the prefs to disk 
			} catch(e) {}
		// load list into memory
		for (var i = 0; i < list.length; i++) {
			list[i].replace(/\s/g, '');
			if (list[i].match(/^https?:\/\/[^*\/]+\//)) {
				url.spec = list[i];
				addPattern(list[i], url.host); }
			else
				addPattern(list[i], "");
		}
	}
}

// Converts a pattern into RegExp and adds it to the list
function addPattern(pattern, host) {
	if (typeof(patterns[host]) == 'undefined')
		patterns[host] = [];
	if (typeof(patterns['all']) == 'undefined')
		patterns['all'] = [];

	var regexp;
	if (pattern.charAt(0) == "/" && pattern.charAt(pattern.length - 1) == "/")  // pattern is a regexp already
		regexp = pattern.substr(1, pattern.length - 2);
	else
		regexp = pattern.replace(/^[\*]*(.(?:[^\*]|[\*]+[^\*])*)[\*]*$/, "$1").replace(/[\*]+/, "*").replace(/([^\w\*])/g, "\\$1").replace(/\*/g, ".*") + "(?:\\n)?"; // append flag for "adblock simple-filter" -- for filterall's de-regexp
		//regexp = pattern.replace(/(?:^\*).|.(?:\*$)/g, "").replace(/([^\w\*])/g, "\\$1").replace(/\*/g, ".*") + "(?:\\n)?"; // append flag for "adblock simple-filter" -- for filterall's de-regexp
		//regexp = "^" + pattern.replace(/([^\w\*])/g, "\\$1").replace(/\*/g, ".*") + "(ABsf)?" + "$";

	try {
	regexp = new RegExp(regexp, "i");
	
	patterns[host].push(regexp);
	patterns['all'].push(regexp);
	} catch(e) {}
}

// binary array-search -- returns lowest-matching element if found; false otherwise
// -- Requires a SORTED array
//  -- note: sorting with a compareFunction defines ordering -> return: zero::unchanged, pos::first value, neg::second value
function binSearchArray(array, searchItem) {
	var low = 0;
	var high = (array.length-1>0) ? array.length-1 : 0; // in case array.length == 1
	var searchPoint = 0;
	var prevPoint = 0;
	var match = null;
	while (match == null) {
		searchPoint = Math.floor((high-low)/2+low);
		if (searchPoint == prevPoint) {
			searchPoint = (prevPoint==low) ? high : low; // due to rounding (floor), we might get stuck - so jump
			high = low; } // matches false if the search-term isn't found
		if (array[searchPoint] == searchItem) {
			match = array[searchPoint];
			array.splice(searchPoint, 1); } // remove match from search-array
		else if (high==low) match = false;													
		else if (searchItem < array[searchPoint]) high = searchPoint;
		else if (searchItem > array[searchPoint]) low = searchPoint;
		prevPoint = searchPoint;
	}
	return match;
}



/*
 * Object frames
 */

// Creates a frame around a new object node
function makeObjectFrame(node, contentType, contentLocation, wnd) {
	try {node = node.QueryInterface(Components.interfaces.nsIDOMElement);} catch(e) {}
	//var isApplet = (node.nodeName.toLowerCase() == "applet"); // applet-frames can't be wrapped
	var isApplet = true; // let's see how this works... :P~

	// Don't continue if we already have a frame
	if (isApplet)
		if (node.hasAttribute("AdblockFramedObject") || node.hasAttribute("AdblockFramedObject2")) return;
	else 
		if (typeof(node._AdblockFrame) != 'undefined') return;

	// Create frame node
	var frame, subDiv1, subDiv2, span;
	frame = node.ownerDocument.createElement('div'); 
	subDiv1 = node.ownerDocument.createElement('div');
	subDiv2 = node.ownerDocument.createElement('div');
	span = node.ownerDocument.createElement('span');
	
	// Style frame node
	frame.setAttribute("style", style="margin: 0px; padding: 0px; overflow: visible;");
	subDiv1.setAttribute("style", "height: 0px; width: 100%; overflow: visible;");
	subDiv2.setAttribute("style", "padding: 1px; vertical-align: bottom; border-style: ridge ridge none ridge; border-width: 2px 2px 0px 2px; -moz-border-radius-topleft: 10px; -moz-border-radius-topright: 10px; -moz-opacity: 0.5; background-color: white;  position: relative; top: -19px; left: -5px; z-index: 900;  width: 48px; height: 15px;  cursor: pointer; overflow: visible;");
	span.setAttribute("style", "font-family: Arial,Helvetica,Sans-serif; font-size: 12px; font-style: normal; font-variant: normal; font-weight: normal; line-height: 140%; text-align: right; text-decoration: none; -moz-opacity: 1.5; color: black;");
	subDiv1.setAttribute("align", "right"); // right-align the tab.
	subDiv2.setAttribute("align", "center"); // center tab-text.

	// Adjust frame-width: if applets, or if we have a relative object width (%)
	if (isApplet || (node.getAttribute('width') && node.getAttribute('width').match(/%$/)) ) {
		frame.style.width = node.getAttribute('width'); 
		frame.style.display = 'block'; }
	else
		frame.style.display = 'table-cell';

	// Assemble frame node
	frame.appendChild(subDiv1);
	subDiv1.appendChild(subDiv2);
	subDiv2.appendChild(span);
	span.appendChild(node.ownerDocument.createTextNode('Adblock'));
	
	// Add cross-node references
	frame._AdblockObject = node; // add Node reference to frame
	//if (!isApplet) // it's all manually overridden, for now
	if (node.nodeName.toLowerCase() != "applet") {
		node._AdblockFrame = frame; // objects: add Frame reference to node
		node.setAttribute("AdblockFramedObject2", true); }
	else {
		frame._AdblockData = new Array(); // applets: add Node data to frame
		frame._AdblockData.push(contentLocation);
		frame._AdblockData.push(contentType); 
		node.setAttribute("AdblockFramedObject", true); }
	frame.setAttribute("AdblockFrame", true); // to identify the outer-frame on tab-click
	subDiv2.addEventListener('click', onBlockObject, false); // event listener, for tab-click
	var frameName = "adblock-frame-n"+frameCounter++;
	frame.id = frameName;
	node.setAttribute("AdblockFrameName", frameName);
	
	// Add event listeners to the object node (in case it's moved)
	//node.addEventListener('DOMNodeInserted', onNodeInserted, false);
	//node.ownerDocument.addEventListener('DOMNodeRemoved', onNodeRemoved, false);

	// Cannot add the frame right now - the object has not been added to the document yet
	/*if (!isApplet)*/ node.style.setProperty('visibility', 'hidden', 'important'); // hide node, so the frame-swap doesn't show
	
	var nodeIndex = adblockNodeIndex(wnd);
	wnd._AdblockObjects[nodeIndex] = [node, frame, isApplet]; // we need to do this locally, for some reason

	// insert frame, relocating to bottom if hidden by window-top
	//   -- and increase parent-iframe's height if necessary
	wnd.setTimeout( '\
			var node = window._AdblockObjects["'+nodeIndex+'"][0];\
			var frame = window._AdblockObjects["'+nodeIndex+'"][1];\
			var isApplet = window._AdblockObjects["'+nodeIndex+'"][2];\
			var style = node.ownerDocument.defaultView.getComputedStyle(node, "");\
			if (!frame.style.width) frame.style.width = style.getPropertyValue("width");\
	\
			var currentOffset = node, y = node.offsetTop;\
			while (currentOffset.offsetParent) {\
				y += currentOffset.offsetParent.offsetTop;\
				currentOffset = currentOffset.offsetParent; }\
			if (y < 20) {\
				var subFrame = frame.firstChild, subFrame2 = frame.firstChild.firstChild;\
				subFrame2.style.setProperty("-moz-border-radius-bottomleft", "10px", null);\
				subFrame2.style.setProperty("-moz-border-radius-bottomright", "10px", null);\
				subFrame2.style.setProperty("border-style", "none ridge ridge ridge", null);\
				subFrame2.style.setProperty("border-width", "0px 2px 2px 2px", null);\
				subFrame2.style.setProperty("top", (isApplet) ? "0px":style.getPropertyValue("height"), null);\
				subFrame2.style.setProperty("right", "-5px", null);\
				subFrame2.style.removeProperty("left");\
				subFrame2.style.removeProperty("-moz-border-radius-topleft");\
				subFrame2.style.removeProperty("-moz-border-radius-topright");\
				subFrame.setAttribute("align", "left");\
				if (node.nextSibling) var evalCode = "node.parentNode.insertBefore(frame, node.nextSibling);";\
				else evalCode = "node.parentNode.appendChild(frame);";\
			}\
			else\
				evalCode = "node.parentNode.insertBefore(frame, node);";\
	\
			var parentiFrame = node.ownerDocument.defaultView.frameElement;\
			if (parentiFrame != null) {\
				var nodeHeight = parseInt(style.getPropertyValue("height").replace(/(\d+).*$/, "$1"));\
				var parentiFrameStyle = node.ownerDocument.defaultView.getComputedStyle(parentiFrame, "");\
				var parentiFrameHeight = parseInt(parentiFrameStyle.getPropertyValue("height").replace(/(\d+).*$/, "$1"));\
				if (nodeHeight + 20 + y > parentiFrameHeight) {\
					parentiFrame.style.setProperty("height", nodeHeight+20+y, "important");\
					parentiFrame.height = nodeHeight+20+y; }\
			}\
	\
			eval(evalCode);\
			node.style.removeProperty("visibility");\
			delete window._AdblockObjects["'+nodeIndex+'"];\
		', 0);
}

// Event handler, object element has been removed from the document - hide the frame
function onNodeRemoved(event) {
	var node = event.target;
	if (!node.hasAttribute("AdblockFrameName")) return;

	if (node.nodeName.toLowerCase() == "applet") {
		var frame = document.getElementById(node.getAttribute("AdblockFrameName"));
		/*
		// Have to move the child temporarily to prevent the document from reloading
		var head = node.parentNode.getElementsByTagName('head')[0];
		if (head) head.appendChild(frame.parentNode.removeChild(frame)); 
		*/
	}
	else {
		frame = node._AdblockFrame;
		/*frame.parentNode.removeChild(frame);*/ }
	
	frame.style.display = "none";
}

// Event handler, object element has been reinserted into the document - unhide the frame
function onNodeInserted(event) {
	var node = event.target;
	if (!node.hasAttribute("AdblockFrameName")) return;
	
	if (node.nodeName.toLowerCase() == "applet") {
		var frame = document.getElementById(node.getAttribute("AdblockFrameName"));
		frame.parentNode.removeChild(frame); }
	else frame = node._AdblockFrame;
	//alert("frame: "+frame +"\nnode: "+ node +"\nparentNode: "+ node.parentNode +"\nnextSibling: "+ node.nextSibling);
	
	/*
	var above = (frame.firstChild.style.getPropertyValue("align") == "right");
	if (above) node.parentNode.insertBefore(frame, node);
	else {
		if (node.nextSibling) node.parentNode.insertBefore(frame, node.nextSibling);
		else node.parentNode.appendChild(frame); }
	*/
	
	frame.style.removeProperty("display");
}

// Event handler, frameset attribute has changed
function onFramesetChange(event) {
	if (/^(cols|rows)$/.test(event.attrName)) {
		var node = event.target;
		node.removeEventListener("DOMAttrModified", onFramesetChange, true);
		if (node.getAttribute(event.attrName) != node.getAttribute("adblock"+event.attrName))
			node.setAttribute(event.attrName, node.getAttribute("adblock"+event.attrName));
		node.addEventListener("DOMAttrModified", onFramesetChange, true);
	}
}

// Event handler, Adblock Tab has been clicked
function onBlockObject(event) {
	var data, node, frame = event.target;
	while ( ! (frame.nodeName.toLowerCase() == "div" && frame.hasAttribute("AdblockFrame")) )
		frame = frame.parentNode;
	node = frame._AdblockObject;
	//node = node.QueryInterface(Components.interfaces.nsIDOMElement); -- causes issues with flash
	if (node.nodeName.toLowerCase() == "applet") data = frame._AdblockData; // applet's can't store this directly
	else data = node._AdblockData; // if we don't have an applet

	itemFramedDialog(node, data);
}

// pops a filter dialog for FRAMED, embedded media
function itemFramedDialog(node, data) {
	var page = node.ownerDocument; // -ownerDocument -!
	//node = node.QueryInterface(Components.interfaces.nsIDOMElement); -- causes issues with flash
	
	// passes the target item to the dialogue via window.argument[1] -- allows the item to be refiltered on 'accept'
	var dialogHandle = node.ownerDocument.defaultView.top.openDialog("chrome://adblock/content/addfilterdialog.xul","Add filter", "chrome,modal,centerscreen", data[0].spec, node);
}



/*
 * Debug Routines
 */
 
// lists everything in an object -- unlimited
function unlimitedListObject(obj) {
	var res = "Listing: " + obj + "\n\n"+obj.nodeName+"\n"+obj.value+"\n";
	for(var list in obj)	
		res += list + ": " + eval("obj."+list) + "\n"; //+ " -- " + (eval("obj."+list))?(eval("obj."+list+".nodeName")):null + "\n";
		
	return res + "--\n\n";
}


// appends a given string to "logfile.txt"
function logfile(logString) {
	var streamOut = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
	var dirService = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties);
	var logFile = dirService.get("UChrm", Components.interfaces.nsIFile);// lxr.mozilla.org/seamonkey/source/xpcom/io/nsAppDirectoryServiceDefs.h
	logFile.append("logfile.txt"); // "appends" the file-string to our dir file-obj
	logFile.createUnique(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0666); // uniquely name file
	
	// if the file is writable, append logString
	if (logFile.isWritable()) {
		streamOut.init(logFile, 0x02, 0x200, null);
		//streamOut.flush();
		streamOut.write(logString, logString.length);
		streamOut.close();
	}
}

// Creates a text-listing for an item's nested node structure, n-layers deep -- very useful debug tool
function listChildNodesX(itemN, depthX) {
	if (!itemN.hasChildNodes) return null;
	if (itemN.hasChildNodes()) {
	
		var itemlengthN = itemN.childNodes.length
		var prefixcharsX = '- - ';
		var prefixstringX = ' ';
		var cnodesL = ' ';
		
		// if this is our first recursion-call, 'depthX' wont be an array yet
		if (!depthX[1]) {
			depthX = [0, depthX]; // define iteration counter and recursion limit
		}

		// sets appropriate indentation, multiplying the prefix-string by our current depth
		for (var v = 0 ; v < depthX[0] ; v++) {
			prefixstringX += prefixcharsX;
		}
		
		cnodesL += ' :' + itemlengthN + '\n'; // prints the number of childnodes for this depth
		
		for (var w = 0 ; w < itemlengthN ; w++) {
			cnodesL += prefixstringX + w + '. ' + itemN.childNodes.item(w);
			if (itemN.childNodes.item(w).hasChildNodes()) {
				if (depthX[0] < depthX[1]) {
					depthX[0]++;
					cnodesL += listChildNodesX(itemN.childNodes.item(w), depthX); }
			}
			else cnodesL += '\n';
		}
	}
	return cnodesL;
}


