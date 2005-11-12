var gTabControl={
/********************************* VARIABLES *********************************/

prefObj: Components.classes['@mozilla.org/preferences-service;1']
		.getService(Components.interfaces.nsIPrefBranch),

/****************************** EVENT LISTENERS ******************************/

onLoad:function() {
	//in options window, no getbrowser...
	if ('undefined'==typeof getBrowser) return;

	//attach other listeners
	window.addEventListener('unload', gTabControl.onUnLoad, false);

	//mangle removeTab function
	gBrowser.origRemoveTab=gBrowser.removeTab;
	gBrowser.removeTab=gTabControl.removeTab;

	//mangle loadOneTab function
	gBrowser.origLoadOneTab=gBrowser.loadOneTab;
	gBrowser.loadOneTab=gTabControl.loadOneTab;
},

onUnLoad:function() {
	//remove our listeners
	window.removeEventListener('load', gTabControl.onLoad, false);
	window.removeEventListener('unload', gTabControl.onUnLoad, false);
},

/****************************** TAB MANIPULATION *****************************/

loadOneTab:function(aURI, aReferrerURI, aCharset, aPostData) {
	var posRight=gTabControl.getPref('bool', 'tabcontrol.posRightOnAdd', true);
	var currTab=gBrowser.mCurrentTab;

	//call the browser's real add tab function
	var newTab=gBrowser.origLoadOneTab(aURI, aReferrerURI, aCharset, aPostData);

	//shift the new tab into position
	if (posRight && newTab.tPos!=currTab._tPos+1) {
		gBrowser.moveTabTo(newTab, currTab._tPos+1);
	}
},

removeTab:function(aTab) {
	var tabToSelect=null;
	var focusLeft=gTabControl.getPref('bool', 'tabcontrol.focusLeftOnClose', true);

	//if we're configured to, get set to focus left tab
	if (focusLeft && aTab._tPos>0) {
		tabToSelect=gBrowser.mTabContainer.childNodes[aTab._tPos-1];
	}

	//call the browser's real remove tab function
	gBrowser.origRemoveTab(aTab);

	//skip the rest if we don't need to focus a custom tab
	if (null==tabToSelect) return;
	
	//set focus to the tab that we want
	gTabControl.selectTab(tabToSelect);
},

selectTab:function(aTab) {
	with (gBrowser) {
		selectedTab=aTab;
		mTabBox.selectedPanel=getBrowserForTab(mCurrentTab).parentNode;
		mCurrentTab.selected = true;
		updateCurrentBrowser();
	}
},

/******************************** PREFERENCES ********************************/

getPref:function(aType, aName, aDefault) {
	try {
		switch(aType) {
		case 'bool':   return this.prefObj.getBoolPref(aName);
		case 'int':    return this.prefObj.getIntPref(aName);
		case 'string':
		default:       return this.prefObj.getCharPref(aName); 
		}
	} catch (e) { 
		return(aDefault);
	}
	return '';
},

setPref:function(aType, aName, aValue) {
	try {
		switch (aType) {
		case 'bool':   this.prefObj.setBoolPref(aName, aValue); break;
		case 'int':    this.prefObj.setIntPref(aName, aValue); break;
		case 'string':
		default:       this.prefObj.setCharPref(aName, aValue); break;
		}
	} catch (e) {  }
},

loadOptions:function() {
	try {
		window.document.getElementById('focusLeftOnClose').checked=
			gTabControl.getPref('bool', 'tabcontrol.focusLeftOnClose', true);
		window.document.getElementById('posRightOnAdd').checked=
			gTabControl.getPref('bool', 'tabcontrol.posRightOnAdd', true);
	} catch (e) {  }
	return true;
},

saveOptions:function() {
	try {
		gTabControl.setPref('bool', 'tabcontrol.posRightOnAdd',
			window.document.getElementById('posRightOnAdd').checked
		);
		gTabControl.setPref('bool', 'tabcontrol.posRightOnAdd',
			window.document.getElementById('posRightOnAdd').checked
		);
	} catch (e) {  }
	return true;
},

/********************************* DEBUGGING *********************************/

test:function() {
	alert('tabcontrol test!\n');
},

dumpErr:function(e) {
	var s='Error in tabcontrol:  ';
	s+='Line: '+e.lineNumber+'  ';
	s+=e.name+': '+e.message+'\n';
	dump(s);
},

}//close object gTabControl

//add listener for onload handler
window.addEventListener('load', gTabControl.onLoad, false);
