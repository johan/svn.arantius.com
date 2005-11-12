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

	//mangle addTab function
	gBrowser.origAddTab=gBrowser.addTab;
	gBrowser.addTab=gTabControl.addTab;

	//conditionally mangle BrowserCloseTabOrWindow function
	if ( gTabControl.getPref('bool', 'tabcontrol.doNotCloseWinOnHotkey', true) ) {
		BrowserCloseTabOrWindow=gTabControl.BrowserCloseTabOrWindow;
	}

	//initial tab max width
	gBrowser.mTabContainer.firstChild.maxWidth=350
},

onUnLoad:function() {
	//remove our listeners
	window.removeEventListener('load', gTabControl.onLoad, false);
	window.removeEventListener('unload', gTabControl.onUnLoad, false);
},

/****************************** TAB MANIPULATION *****************************/

addTab:function(aURI, aReferrerURI, aCharset, aPostData) {
	var posRight=gTabControl.getPref('bool', 'tabcontrol.posRightOnAdd', true);
	var currTab=gBrowser.mCurrentTab;

	//call the browser's real add tab function
	var newTab=gBrowser.origAddTab(aURI, aReferrerURI, aCharset, aPostData);

	//shift the new tab into position
	if (posRight && newTab.tPos!=currTab._tPos+1) {
		gBrowser.moveTabTo(newTab, currTab._tPos+1);
	}

	//replicate broken focus-new-tab functionality
	if (!gTabControl.getPref('bool', 'browser.tabs.loadInBackground', false)) {
		gTabControl.selectTab(newTab);
	}

	//tab max width
	newTab.maxWidth=350;
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

BrowserCloseTabOrWindow:function() {
	//NOPE!  only close tabs
	if (gBrowser.localName == 'tabbrowser' && 
		gBrowser.tabContainer.childNodes.length > 1
	) {
		gBrowser.removeCurrentTab();
		return;
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
		var checks=window.document.getElementsByTagName('checkbox');
		for (i in checks) {
			checks[i].checked=gTabControl.getPref('bool',
				'tabcontrol.'+checks[i].getAttribute('id'), true
			);
		}
	} catch (e) {  }
	return true;
},

saveOptions:function() {
	try {
		var checks=window.document.getElementsByTagName('checkbox');
		for (i in checks) {
			gTabControl.setPref('bool',
				'tabcontrol.'+checks[i].getAttribute('id'), 
				checks[i].checked
			);
		}
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
