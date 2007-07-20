const nsISupports=Components.interfaces.nsISupports;

const CLASS_ID=Components.ID("5fcffc89-1dc6-4ea8-b7fa-9676ea2a5ffb");
const CLASS_NAME="FireFlash Component Loader";
const CONTRACT_ID="@arantius.com/fireflv;1";

const JSLOADER_CONTRACTID='@mozilla.org/moz/jssubscript-loader;1';

var loader=Components.classes[JSLOADER_CONTRACTID]
	.getService(Components.interfaces.mozIJSSubScriptLoader);

function FireFlash() {
	this.wrappedJSObject=this;

	// Do our once-upon-init code here.
	loader.loadSubScript('chrome://fireflv/content/fireflv-lib.js');
	loader.loadSubScript('chrome://fireflv/content/fireflv-http.js');
}

// This is the implementation of your component.
FireFlash.prototype={
	// for nsISupports
	QueryInterface:function(aIID) {
		// add any other interfaces you support here
		if (!aIID.equals(nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}
		return this;
	}
}

var FireFlashFactory={
	singleton: null,

	createInstance:function(aOuter, aIID) {
		if (aOuter!=null) {
			throw Components.results.NS_ERROR_NO_AGGREGATION;
		}
		
		if (null===this.singleton) {
			this.singleton=(new FireFlash()).QueryInterface(aIID);
		}

		return this.singleton;
	}
};

var FireFlashModule={
	registerSelf:function(aCompMgr, aFileSpec, aLocation, aType) {
		aCompMgr
			.QueryInterface(Components.interfaces.nsIComponentRegistrar)
			.registerFactoryLocation(
				CLASS_ID, CLASS_NAME, CONTRACT_ID, aFileSpec, aLocation, aType
			);
		var catMgr = Components.classes["@mozilla.org/categorymanager;1"]
			.getService(Components.interfaces.nsICategoryManager);
		catMgr.addCategoryEntry(
			"app-startup", CLASS_NAME, CONTRACT_ID, true, true
		);
	},

	unregisterSelf:function(aCompMgr, aLocation, aType) {
		aCompMgr
			.QueryInterface(Components.interfaces.nsIComponentRegistrar)
			.unregisterFactoryLocation(CLASS_ID, aLocation);		
	},
	
	getClassObject:function(aCompMgr, aCID, aIID) {
		if (!aIID.equals(Components.interfaces.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}

		if (aCID.equals(CLASS_ID)) {
			return FireFlashFactory;
		}

		throw Components.results.NS_ERROR_NO_INTERFACE;
	},

	canUnload:function(aCompMgr) { return true; }
};

// Module initialization
function NSGetModule(aCompMgr, aFileSpec) { 
	return FireFlashModule;
}


/*
var headerName	= "X-hello";
var headerValue = "world";

function myHTTPListener() { }

myHTTPListener.prototype = {
	
	observe: function(subject, topic, data) {
		if (topic == "http-on-modify-request") {
			var httpChannel = subject.QueryInterface(Components.interfaces.nsIHttpChannel);
			httpChannel.setRequestHeader(headerName, headerValue, false);
			return;
		}

		if (topic == "app-startup") {
			var os = Components.classes["@mozilla.org/observer-service;1"]
				 .getService(Components.interfaces.nsIObserverService);

			os.addObserver(this, "http-on-modify-request", false);
			return;
		}
	},

	QueryInterface: function (iid) {
		if (iid.equals(Components.interfaces.nsIObserver) ||
			iid.equals(Components.interfaces.nsISupports)
		) {
			return this;
		}

		Components.returnCode = Components.results.NS_ERROR_NO_INTERFACE;
		return null;
	},
};

var myModule = {
	registerSelf: function (compMgr, fileSpec, location, type) {

		var compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
		compMgr.registerFactoryLocation(
			this.myCID, this.myName, this.myProgID,
			fileSpec, location, type
		);
		var catMgr = Components.classes["@mozilla.org/categorymanager;1"]
			.getService(Components.interfaces.nsICategoryManager);
		catMgr.addCategoryEntry(
			"app-startup", this.myName, this.myProgID, true, true
		);
	},


	getClassObject: function (compMgr, cid, iid) {

			LOG("----------------------------> getClassObject");

		return this.myFactory;
	},

	myCID: Components.ID("{9cf5f3df-2505-42dd-9094-c1631bd1be1c}"),

	myProgID: "@dougt/myHTTPListener;1",

	myName:	 "Simple HTTP Listener",

	myFactory: {
		QueryInterface: function (aIID) {
			if (!aIID.equals(Components.interfaces.nsISupports) &&
				!aIID.equals(Components.interfaces.nsIFactory))
				throw Components.results.NS_ERROR_NO_INTERFACE;
			return this;
		},

		createInstance: function (outer, iid) {

			LOG("----------------------------> createInstance");

			return new myHTTPListener();
		}
	},

	canUnload: function(compMgr) {
		return true;
	}
};

function NSGetModule(compMgr, fileSpec) {
	return myModule;
}
*/