const FIREFLV_POLICY_CONTRACTID='@arantius.com/fireflv-policy;1';
const FIREFLV_POLICY_CID=Components.ID('{cebd8118-e3c9-4d81-abd8-538c8b7abed5}');

const CATMAN_CONTRACTID='@mozilla.org/categorymanager;1';
const JSLOADER_CONTRACTID='@mozilla.org/moz/jssubscript-loader;1';

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

var Module={
	factoryLoaded:false,

	registerSelf:function(compMgr, fileSpec, location, type) {
		compMgr=compMgr.QueryInterface(
			Components.interfaces.nsIComponentRegistrar
		);
		compMgr.registerFactoryLocation(
			FIREFLV_POLICY_CID, 'FireFlash Video Content Policy', FIREFLV_POLICY_CONTRACTID,
			fileSpec, location, type
		);

		var catman=Components.classes[CATMAN_CONTRACTID]
			.getService(Components.interfaces.nsICategoryManager);
		catman.addCategoryEntry(
			'content-policy', FIREFLV_POLICY_CONTRACTID, FIREFLV_POLICY_CONTRACTID, true, true
		);
	},

	unregisterSelf:function(compMgr, fileSpec, location) {
		compMgr=compMgr.QueryInterface(
			Components.interfaces.nsIComponentRegistrar
		);

		compMgr.unregisterFactoryLocation(FIREFLV_POLICY_CID, fileSpec);

		var catman=Components.classes[CATMAN_CONTRACTID]
			.getService(Components.interfaces.nsICategoryManager);
		catman.deleteCategoryEntry('content-policy', FIREFLV_POLICY_CONTRACTID, true);
	},

	getClassObject:function(compMgr, cid, iid) {
		if (!cid.equals(FIREFLV_POLICY_CID)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
		}

		if (!iid.equals(Components.interfaces.nsIFactory)) {
			throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
		}

		if (!this.factoryLoaded) {
			var loader=Components.classes[JSLOADER_CONTRACTID]
				.getService(Components.interfaces.mozIJSSubScriptLoader);

			loader.loadSubScript('chrome://fireflv/content/fireflv-policy.js');

			this.factoryLoaded=true;
		}

		return gFireFlvPolicyFactory;
	},

	canUnload:function(compMgr) {
		return true;
	}
};

// \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ // \\ //

// module initialisation
function NSGetModule(comMgr, fileSpec) {
	return Module;
}
